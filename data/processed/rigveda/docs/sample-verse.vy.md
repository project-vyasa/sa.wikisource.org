# Sample `.vy` shape

`content/samhita/01/001.vy`:

```vy
`set context {
  mandala = "01",
  sukta = "001",
  mandala.title = "Mandala 1",
  sukta.title = "Sukta 1:1",
  sukta.rishi = "मधुच्छन्दा वैश्वामित्रः",
  sukta.chandas = "गायत्री",
  sukta.devata = "अग्निः"
}

`v 1 [
अ॒ग्निमी॑ळे पु॒रोहि॑तं य॒ज्ञस्य॑ दे॒वमृ॒त्विजं॑ ।
होता॑रं रत्न॒धात॑मं ॥१
]
```

Padapatha and Sayana streams use the same `` `v N `` ids under
`content/padapatha/` and `content/sayana/`. Global URN prefix is owned by
`publisher.toml` + workspace config — not repeated in extract JSON or verse bodies.
