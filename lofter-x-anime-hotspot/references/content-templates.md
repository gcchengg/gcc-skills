# Content packet contracts

Generate structural human-review packets, not public prose. Every packet must contain exactly one line beginning `互动问题：`.

## `daily_hotspot` — 今日热度异动

- Accept exactly one eligible candidate.
- Set a 200–400 Chinese-character target.
- Preserve the X evidence, LOFTER evidence, source URLs, observation time, and media provenance.
- Ask one question about whether the hotspot will continue or is a short-lived spike.

## `weekly_trend` — 本周二次元趋势

- Accept exactly five distinct candidates already ranked by score.
- Render each candidate's X signal, LOFTER signal, and non-empty sustainability note.
- Ask one question selecting what to track next week.

## `media_curation` — 媒体策展

- Accept exactly one eligible candidate.
- Require either exact-matched validated authorization or independent media with a null asset ID.
- Render source/author/attribution for authorized media and never claim authorization for independent media.
- Ask one media-focused question.

## `fanfic` — 热点脑洞实验室

- Accept exactly one eligible candidate and set an 800–2000 Chinese-character target.
- Require verified world, characters, relationships, CP conventions, and fandom risks.
- Require the prior observation's LOFTER URL and ISO-8601 publication date.
- Require either the explicitly selected weeks 1–2 baseline policy or week 3+ `top_40_percent: true`.
- Ask one continuation question.

## Exact AI disclosure

- `authorized_original`: no AI label.
- `authorized_ai_adaptation`: `图像经授权使用，含AI辅助创作｜#AI辅助#`.
- `human_original`: no AI label.
- `ai_assisted_original`: `#AI辅助#` without an authorization claim.
- `ai_generated_original`: `#AI生成#` without an authorization claim.
