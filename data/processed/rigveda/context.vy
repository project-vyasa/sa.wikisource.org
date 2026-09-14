`title [ऋग्वेदः]

`alias-def { name="v" target="rik" }

`command-def { name="rik" category="structure" urn="true" propagate_state="false" }
`command-def { name="samhita" category="content" }
`command-def { name="padapatha" category="content" }
`command-def { name="bhashya" whitespace="preserve" category="content" }

`command-def { name="annotate" category="metadata" flexible_args="true" }

`set settings {
  break_after = "।॥"
}

`set context {
  work = "Rig Veda",
  corpus = "rv"
}
