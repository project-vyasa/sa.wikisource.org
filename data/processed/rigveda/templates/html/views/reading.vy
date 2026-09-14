// Craft reading view — stacked samhita, padapatha, and Sayana commentary.
// CSS: templates/html/reading.css

`layout [
{{ body }}
]

`item [
`div { class="verse-content" } [
    `div { class="verse-meta" } [
        `span { class="meta-item" } [
            `span { class="meta-label" } [देवता]
            `span { class="meta-value" } [ {{ devata }} ]
        ]
        `span { class="meta-item" } [
            `span { class="meta-label" } [ऋषि]
            `span { class="meta-value" } [ {{ rishi }} ]
        ]
        `span { class="meta-item" } [
            `span { class="meta-label" } [छन्दस्]
            `span { class="meta-value" } [ {{ chandas }} ]
        ]
    ]
    `div { class="verse-stack" } [
        `div { class="stream-group" } [
            `div { class="label" } [संहिता]
            `div { class="deva-text samhita-text stream-content" } [`stream { ref="primary" }]
        ]
        `div { class="stream-group" } [
            `div { class="label" } [पदपाठः]
            `div { class="deva-text pada-text stream-content" } [`stream { ref="padapatha" }]
        ]
        `div { class="stream-group" } [
            `div { class="label" } [सायणभाष्यम्]
            `div { class="deva-text sayana-text stream-content" } [`stream { ref="sayana" }]
        ]
    ]
]
]
