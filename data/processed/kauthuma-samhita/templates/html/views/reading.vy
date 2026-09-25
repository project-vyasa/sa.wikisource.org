// Craft reading view — samhita stream with arcika.prapāṭhaka.segment.mantra chrome.
// CSS: templates/html/reading.css

`layout [
{{ body }}
]

`item [
`div { class="verse-content" } [
    `div { class="verse-meta" } [
        `span { class="meta-item" } [
            `span { class="meta-label" } [मन्त्रः]
            `span { class="meta-value" } [ {{ arcika }}.{{ prapāṭhaka }}.{{ segment }}.{{ mantra }} ]
        ]
    ]
    `div { class="verse-stack" } [
        `div { class="stream-group" } [
            `div { class="label" } [संहिता]
            `div { class="deva-text samhita-text stream-content" } [`stream { ref="primary" }]
        ]
    ]
]
]
