import { collapseFalseDoubleDanda } from "./danda";

/**
 * Emit a Vyasa command body. Bracket/backtick bodies use a delimited
 * block `;TAG [` … `]TAG` so the source can contain `]` and `` ` ``.
 */
export function emitBlock(
  cmd: string,
  arg: number | null,
  body: string,
  delimiter = "RV",
): string {
  body = collapseFalseDoubleDanda(body);
  const needsDelim = body.includes("]") || body.includes("`");
  const head = arg == null ? `\`${cmd}` : `\`${cmd} ${arg}`;
  if (needsDelim) {
    return `${head} ;${delimiter} [\n${body}\n]${delimiter}`;
  }
  return `${head} [\n${body}\n]`;
}
