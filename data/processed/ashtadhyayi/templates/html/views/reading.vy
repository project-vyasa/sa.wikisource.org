// Craft reading view — stacked sūtra, Hindi vyākhyā, and udāharaṇa.
// CSS: templates/html/reading.css

`layout [
{{ body }}
]

`item [
`div { class="verse-content" } [
    `div { class="verse-meta" } [
        `span { class="meta-item" } [
            `span { class="meta-label" } [सूत्रम्]
            `span { class="meta-value" } [ {{ adhyaya }}.{{ pada }}.{{ sutra }} ]
        ]
    ]
    `div { class="verse-stack" } [
        `div { class="stream-group" } [
            `div { class="label" } [सूत्रम्]
            `div { class="deva-text sutra-text stream-content" } [`stream { ref="primary" }]
        ]
        `div { class="stream-group" } [
            `div { class="label" } [व्याख्या]
            `div { class="deva-text vyakhya-text stream-content" } [`stream { ref="vyakhya" }]
        ]
        `div { class="stream-group" } [
            `div { class="label" } [उदाहरणम्]
            `div { class="deva-text udaharana-text stream-content" } [`stream { ref="udaharana" }]
        ]
    ]
]
]
