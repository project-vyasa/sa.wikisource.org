// Craft reading view — sūtra stream with adhyāya.sūtra chrome.
// CSS: templates/html/reading.css

`layout [
{{ body }}
]

`item [
`div { class="verse-content" } [
    `div { class="verse-meta" } [
        `span { class="meta-item" } [
            `span { class="meta-label" } [सूत्रम्]
            `span { class="meta-value" } [ {{ adhyaya }}.{{ sutra }} ]
        ]
    ]
    `div { class="verse-stack" } [
        `div { class="stream-group" } [
            `div { class="label" } [सूत्रम्]
            `div { class="deva-text sutra-text stream-content" } [`stream { ref="primary" }]
        ]
    ]
]
]
