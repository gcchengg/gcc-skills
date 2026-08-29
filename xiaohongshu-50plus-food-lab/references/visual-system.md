# 50+ Food Wonder Lab Visual System

- Use an oversized photorealistic food subject, cinematic depth, visible transformation, and a bright coral/orange/purple/teal/cream palette adjusted to the ingredient.
- Use glass tracks, suspended platforms, miniature kitchens, steam, droplets, translucent materials, and volumetric light only when they explain the content.
- Keep the top label “50+饮食说明书” and use a large modern Chinese sans-serif title.
- Reserve 20–25% for title, 45–55% for the food scene, 15–20% for steps or comparisons, and 5–10% for safety conditions.
- Render at 3:4 portrait with no screenshot margins.
- Do not use black-gold, crowns, medals, stars, TOP scores, fabricated rankings, dashboards, dense software cards, brands, watermarks, QR codes, or platform UI.
- Reject pseudo-Chinese, duplicate labels, unreadable small text, plastic-looking food, and physically incorrect food states.

## Rendering and QA

- Food is the single, unmistakable first visual. The title communicates the conclusion at thumbnail size; the food transformation is understood second; the concrete action or condition is found third.
- Keep text high contrast and spacious for a 50+ audience. The top label, title, subtitle, 3–8 visual nodes, and safety condition must each be legible and must not be obscured by 3D elements.
- Depict times, portions, storage conditions, and individual differences only when supplied by the validated post packet. Do not imply that food treats, prevents, or reverses disease.
- On review, reject any image whose title is not legible after a 3:4 portrait crop, whose Chinese is malformed or repeated, or whose spectacle blocks the explanation.

## Packet-to-prompt mapping

| Validated post-packet field | Prompt use |
| --- | --- |
| `{{TOPIC}}` | Identifies the food subject, eating scenario, or comparison topic in the scene-specific request and subject. |
| `{{TITLE}}` | Supplies the large, thumbnail-readable main title and the prompt's central conclusion. |
| `{{SUBTITLE}}` | Supplies the one-sentence explanatory subtitle. |
| `{{VISUAL_NODES}}` | Supplies the 3–8 visible steps, categories, comparison conditions, or portion cues. |
| `{{BODY_COPY}}` | Supplies the factual operating condition that the visual scene must explain. |
| `{{SAFETY_NOTE}}` | Supplies the bottom safety or individual-difference condition. |
