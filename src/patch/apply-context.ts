import type { AnukramaniPatchEntry } from "../schema/anukramani-patch";

const CONTEXT_RE = /`set context \{([\s\S]*?)\}\n/;

function escapeAttr(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseContextFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of body.split("\n")) {
    const m = /^\s*([^=]+)=\s*"((?:\\.|[^"\\])*)"\s*,?\s*$/.exec(line);
    if (m) fields.set(m[1].trim(), m[2].replace(/\\"/g, '"'));
  }
  return fields;
}

function emitContext(fields: Map<string, string>): string {
  const order = [
    "mandala",
    "sukta",
    "mandala.title",
    "sukta.title",
    "sukta.rishi",
    "sukta.devata",
    "sukta.chandas",
  ];
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const key of order) {
    const value = fields.get(key);
    if (value == null) continue;
    seen.add(key);
    lines.push(`  ${key} = "${escapeAttr(value)}"`);
  }

  for (const [key, value] of fields) {
    if (seen.has(key)) continue;
    lines.push(`  ${key} = "${escapeAttr(value)}"`);
  }

  const body = lines
    .map((line, i) => (i < lines.length - 1 ? `${line},` : line))
    .join("\n");
  return `\`set context {\n${body}\n}\n`;
}

export function applyAnukramaniPatchToVy(
  content: string,
  patch: AnukramaniPatchEntry,
): string {
  const match = CONTEXT_RE.exec(content);
  if (!match) {
    throw new Error("No `set context` block found");
  }

  const fields = parseContextFields(match[1]);
  if (patch.rishi) fields.set("sukta.rishi", patch.rishi);
  if (patch.devata) fields.set("sukta.devata", patch.devata);
  if (patch.chandas) fields.set("sukta.chandas", patch.chandas);

  const nextContext = emitContext(fields);
  return content.replace(CONTEXT_RE, nextContext);
}
