// Craft reading view — samhita stream with kāṇḍa.sūkta.ṛk chrome.
// CSS: templates/html/reading.css

`layout [
{{ body }}
]

`item [
`div { class="verse-content" } [
    `div { class="verse-meta" } [
        `span { class="meta-item" } [
            `span { class="meta-label" } [ऋक्]
            `span { class="meta-value" } [ {{ kanda }}.{{ sukta }}.{{ rik }} ]
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
