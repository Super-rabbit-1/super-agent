---
name: self-media-vault
description: "Capture and develop a personal self-media idea vault: save fleeting thoughts, voice-note transcriptions, observations, hooks, and references; cluster them into topics; then continue a focused conversation to turn a topic into a video angle, outline, and polished script. Use when the user mentions content ideas, inspiration, material collection, topic selection, video planning, scripts, content backlog, or a personal creator knowledge base."
---

# Self-Media Vault

Keep a local Markdown vault as the source of truth. Its default location is `~/Documents/Codex/self-media-vault`; override it with `CONTENT_IDEA_VAULT` or the script's `--vault` flag. Do not create a Feishu document, send content, or publish anything unless the user explicitly asks.

## Capture first

When the user shares an idea, observation, voice-note transcription, quote, link, hook, or half-formed sentence:

1. Preserve the original wording before interpreting it.
2. Give it a short neutral title and 0–5 tentative tags; do not force it into a topic yet.
3. Run `scripts/idea-vault.mjs capture --text "..." --title "..." --tags "..." --source <thought|voice|link|observation>`.
4. Return the saved item title and path, then offer one short next move: capture another, organize the inbox, or develop a topic.

For the first local write to the default vault, state the exact vault path and ask for confirmation. A user request to “record/save this idea” authorizes that one capture.

## Organize without flattening

When asked to整理/归类/复盘素材:

1. Run `scripts/idea-vault.mjs list --status inbox --json`.
2. Cluster by recurring tension, audience, point of view, scene, emotional drive, and possible format—not merely shared keywords.
3. Present 3–7 candidate topics with: topic name, central contradiction, included idea titles, and one content opportunity.
4. Keep ambiguous entries in `inbox`; never discard or silently merge them.
5. Before moving files or creating a topic folder, show the exact affected entries and ask for confirmation.

## Develop one topic through dialogue

When the user chooses a topic, keep a visible working brief:

- **Audience:** who would care and why now
- **Tension:** the contradiction or question that earns attention
- **Viewpoint:** the user's specific conclusion, not a generic summary
- **Evidence:** scenes, personal experiences, examples, quotations, or research still needed
- **Format:** talking head, story, commentary, list, interview, or essay video
- **Open questions:** what must be decided before drafting

Advance in small turns. Offer 2–3 distinct angles first; then help select one, create a hook, outline the argument/story beats, and draft. Preserve the user's voice and point out where a claim needs evidence. Treat an AI draft as a working version, not a final truth.

## Script quality bar

For a video script, deliver separately:

1. One-sentence premise
2. 3 alternative hooks
3. Beat outline with approximate time allocation
4. Full spoken draft in the user's intended tone
5. Visual/B-roll or evidence prompts
6. Source ideas used and unresolved gaps

Do not invent personal experiences, quotes, statistics, or sources. Mark assumptions and research needs plainly.

## Safety and lifecycle

- Use `inbox` for raw material; use `topics` only after the user confirms a cluster.
- Keep raw entries immutable; add interpretations in topic briefs rather than overwriting the original thought.
- Ask immediately before bulk moves, deletion, or external synchronization.
- Use [references/vault-schema.md](references/vault-schema.md) for the folder layout and content states.
