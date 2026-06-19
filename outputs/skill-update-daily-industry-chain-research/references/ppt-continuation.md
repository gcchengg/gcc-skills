# PPT Continuation Workflow

Use this workflow only after the research brief and Xiaohongshu copy are
complete and the user has provided an absolute PPTX template path.

## Inputs

- Content source: `{topic_dir}/产业链研究底稿.md`
- Visual source: the PPTX template path provided by the user
- Output directory: the existing topic directory returned by the registry

## Deck Construction

1. Use the Presentations plugin and its template-following workflow.
2. Inspect every template slide before editing. Identify the available layout
   types, recurring visual rules, fonts, colors, image treatments, and chart
   styles.
3. Build a slide outline from the research brief. Cover the chain overview,
   upstream, midstream, downstream, value distribution, barriers, risks, and
   conclusions when the source supports them.
4. Map each outline section to a suitable copied template slide. Preserve the
   template's theme and layout system; do not rebuild the deck from scratch.
5. Rewrite and compress the source for presentation readability. Do not paste
   long Markdown paragraphs directly into slides.
6. Remove unused placeholders, sample copy, sample charts, logos, and template
   artifacts that are not appropriate for the new deck.
7. Save the deck as `{topic_dir}/{主题}研究.pptx`.

## High-Resolution Images

1. Create `{topic_dir}/高清图片/`.
2. Render every final slide to PNG at the highest practical quality. For a
   16:9 deck, target at least 3840 x 2160 pixels. Preserve the source aspect
   ratio for other page sizes.
3. Name slide images with zero-padded page numbers:
   `01-{主题}研究.png`, `02-{主题}研究.png`, and so on.
4. Generate a readable contact-sheet overview of all final slides and save it
   as `{topic_dir}/高清图片/总览图.png`.
5. Keep temporary render files outside the topic directory.

## Verification

- Confirm the final PPTX opens and its slide count matches the intended outline.
- Confirm there is exactly one numbered PNG for every final slide.
- Confirm rendered PNG dimensions meet the high-resolution target.
- Inspect the overview image for clipping, blank slides, overflow, unreadable
  text, and inconsistent template use.
- Confirm no template sample text or unintended placeholders remain.
- Return the final PPTX path, the `高清图片/` path, slide count, and rendered
  image dimensions.
