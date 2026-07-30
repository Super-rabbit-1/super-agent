# Vault schema

```text
self-media-vault/
├── inbox/YYYY-MM-DD/      # Immutable raw thoughts, links, voice transcriptions
├── topics/<topic-slug>/   # Created only after user confirms clustering
└── research/              # Optional verified research material
```

Each raw entry is Markdown with `id`, `created_at`, `status`, `title`, `tags`, and `source` frontmatter. Use `inbox` as the initial status. Add interpretation, source links, outlines, and drafts to a topic brief instead of changing the original entry.

Content states: `inbox` → `clustered` → `developing` → `draft` → `ready` → `published`. A state transition should be intentional and traceable to the original entry IDs.
