`layout [
`html { lang="sa" } [
    `head [
        `meta { charset="UTF-8" }
        `meta { name="viewport" content="width=device-width, initial-scale=1.0" }
        `title [ ऋग्वेदः ]
        `link { href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&family=Noto+Serif:ital,wght@0,400;1,400&display=swap" rel="stylesheet" }
        `style [
            body {
                font-family: 'Noto Serif', 'Noto Sans Devanagari', serif;
                margin: 0 auto;
                padding: 2rem;
                line-height: 1.7;
                color: #333;
                background-color: #fcfcfc;
            }
            .verse-content {
                margin-bottom: 1rem;
                border: 1px solid #eaeaea;
                border-radius: 8px;
                padding: 1rem;
                background: #fff;
            }
            .verse-header {
                text-align: center;
                font-weight: 600;
                font-size: 1.15rem;
                color: #2c3e50;
                margin-bottom: 0.75rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #f0f0f0;
            }
            .verse-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem 1.25rem;
                justify-content: center;
                font-size: 0.85rem;
                color: #64748b;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px dashed #e8e8e8;
            }
            .meta-item { display: inline-flex; gap: 0.35rem; align-items: baseline; }
            .meta-label { font-weight: 600; color: #94a3b8; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.04em; }
            .meta-value { font-family: 'Noto Sans Devanagari', sans-serif; color: #475569; }
            .verse-stack { display: flex; flex-direction: column; gap: 1.25rem; }
            .label {
                font-size: 0.75rem;
                text-transform: uppercase;
                color: #95a5a6;
                margin-bottom: 0.5rem;
                letter-spacing: 0.05em;
            }
            .stream-content { white-space: pre-line; overflow-wrap: break-word; }
            .stream-missing {
                font-style: italic;
                color: #94a3b8;
                font-size: 0.9rem;
            }
            .deva-text { font-family: 'Noto Sans Devanagari', sans-serif; }
            .samhita-text { font-size: 1.2rem; color: #5c1a1a; }
            .pada-text { font-size: 1.05rem; color: #334155; }
            .sayana-text { font-size: 0.95rem; color: #4a5568; }
        ]
    ]
    `body [
        `div { class="content" } [ {{ body }} ]
    ]
]
]

`item [
`div { class="verse-content" } [
    `div { class="verse-header" } [ {{ mandala }}:{{ sukta }}:{{ rik }} ]
    `div { class="verse-meta" } [
        `span { class="meta-item" } [
            `span { class="meta-label" } [ देवता ]
            `span { class="meta-value" } [ {{ devata }} ]
        ]
        `span { class="meta-item" } [
            `span { class="meta-label" } [ ऋषि ]
            `span { class="meta-value" } [ {{ rishi }} ]
        ]
        `span { class="meta-item" } [
            `span { class="meta-label" } [ छन्दस् ]
            `span { class="meta-value" } [ {{ chandas }} ]
        ]
    ]
    `div { class="verse-stack" } [
        `div { class="label" } [ संहिता ]
        `div { class="deva-text samhita-text stream-content" } [
            `stream { ref="primary" }
        ]
        `div { class="label" } [ पदपाठः ]
        `div { class="deva-text pada-text stream-content" } [
            `stream { ref="padapatha" }
        ]
        `div { class="label" } [ सायणभाष्यम् ]
        `div { class="deva-text sayana-text stream-content" } [
            `stream { ref="sayana" }
        ]
    ]
]
]
