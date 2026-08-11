# Research and drafting protocol

Follow this protocol for a new run and for any revision that changes research, public copy, or media.

## Research and selection

1. Search X and LOFTER for the last 24 hours. For every publishable topic, record at least two direct X source URLs and one direct LOFTER source URL.
2. Run the deterministic scorer and selector. Expand to 72 hours only when the selector reports insufficient 24-hour evidence; record the failed 24-hour sufficiency result and expansion reason.
3. Record observations and source metadata in `hotspot-analysis.json`. Never invent engagement counts. Use `null` for unavailable metrics and distinguish direct observations from inference.
4. Stop without drafting when no topic reaches the fixed eligibility threshold or cross-platform source minimum.

Route the selected topic objectively, using the selector's precedence:

- Use `trend_analysis` when an event, controversy, release, or trend signal is present.
- Use `fanfic` only when relationship/worldbuilding discussion is prominent and every prerequisite below passes.
- Use `visual_curation` when strong visual evidence is the primary signal and no higher-priority event signal applies.

Before `fanfic`, verify world setting, characters, relationships, CP conventions, and fandom/OOC risks; record a prior LOFTER observation URL and date; and require either the explicitly selected weeks 1–2 baseline or week 3+ top-40% result from the latest 14 days. Route to `trend_analysis` if any prerequisite fails.

## Source ledger and checksums

In the private `hotspot-analysis.json` source ledger, record `platform`, `source_url`, `author_handle`, `post_id`, `media_id`, `published_at` when known, `observed_at`, observed `metrics` with their capture time, factual `observations`, and any `inferences`. For each local media file also record `local_path`, `byte_size`, lowercase SHA-256 `sha256`, `fetched_at` or `created_at`, intended use, and review status. Keep these research fields separate from the strict `sources/media-ledger.json` schema passed to deterministic draft functions.

Compute SHA-256 from the actual local bytes after download or generation. Recompute it before draft installation, replacement, and publication approval. Stop on a size or digest mismatch. Keep source and authorization ledgers private; public artifacts may contain attribution but never evidence paths.

## Draft contract

1. Draft exactly one 800–1500-character Chinese article, three distinct titles, 8–12 distinct tags, one cover, and at most two body images.
2. Synthesize the cross-platform pattern, relevant context, and an original viewpoint. Do not translate posts line by line, stitch posts together, copy distinctive wording, imitate a creator's style, or present fan inference as canon.
3. Keep character, relationship, CP, and official-versus-fan-setting labels accurate. Include one natural interaction question and no hard-paywall cliffhanger or unrelated trending tags.
4. Set `authorized_media_intent` and `ai_assistance` truthfully, then let `build_publishable_draft.build_draft` add the reserved disclosure. When authorized media and AI assistance coexist, the exact disclosure is `图像经授权使用，含AI辅助创作｜#AI辅助#`; never author or duplicate it manually.

## Media acquisition and independent generation

1. Download candidate X media only into `original-media/`. Record it as `pending`; local preview use does not grant upload permission. Do not upload it before authorization review completes.
2. Save generated visuals only in `generated-media/`. Record the full prompt, model/tool label, creation time, SHA-256, byte size, and generation lineage in the private research source ledger; pass only the supported `generation_lineage` fields to the strict draft media ledger.
3. For a generated original, use a text-only topic and composition brief; `source_media_ids must be []`.
4. For an unauthorized or rejected image, generate a materially independent replacement with a different composition and visual expression. Do not provide the rejected image, its local path, its bytes, or any image attachment/reference to the image-generation tool. Do not include its source URL, IDs, author handle, or path in the prompt or generator metadata. Start the generation call with no referenced source image and persist empty source lineage.
5. Never pass rejected image/path/bytes through a recent-image mechanism, `referenced_image_paths`, encoded data, upload, seed image, control image, or other indirect input. This prohibition applies upstream before generation, independently of downstream replacement validation.
6. After generation, call `replace_rejected_media`; do not manually relabel X-derived work as independent.

## Preview loop

Validate all model-authored payloads with the deterministic draft/revision functions. Re-render `preview.html` after every accepted revision and show its absolute local path to the user. Keep the run in authorization review until every media item is `authorized` or `independent` and the user sends the first exact confirmation.
