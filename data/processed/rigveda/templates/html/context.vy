// Semantic HTML templates for Rig Veda streams

`samhita [
`div { class="samhita" style="white-space: pre-line;" } [$.body]
]

`padapatha [
`div { class="padapatha" style="white-space: pre-line;" } [$.body]
]

`bhashya [
`div { class="bhashya" style="white-space: pre-line;" } [$.body]
]

`v [
`div { class="verse" style="white-space: pre-line; margin-bottom: 1.5rem;" } [
  `strong { style="display: block; color: #64748b; font-size: 0.9em; margin-bottom: 0.25rem;" } [ऋक् $.argument]
  $.body
]
]

`ref [ `a { href="$.argument" } [$.body] ]
`e1 [ `strong [$.body] ]
`e2 [ `em [$.body] ]
