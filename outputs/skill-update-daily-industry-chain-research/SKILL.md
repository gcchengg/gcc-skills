---
name: daily-industry-chain-research
description: Generate one non-repeating Chinese industry-chain research brief plus Xiaohongshu-ready publishing copy, then optionally continue from a user-provided PPTX template to create a template-following deck, per-slide high-resolution PNGs, and an overview image. Use when the user asks for 今日产业链, 每天介绍一个产业链, 随机产业链拆解, a specific industry-chain research draft, 小红书产业链内容, a batch topic plan, or an industry-chain PPT. Archives every topic under PPT生成/每日产业链研究.
---

# Daily Industry Chain Research

Use Chinese by default. First produce reusable research text and a separate
Xiaohongshu publishing package. After those files are complete, ask whether the
user wants to continue with a PPT based on the research brief and request the
absolute PPTX template path. Do not start the PPT stage until the user confirms
and provides the template path.

## Output Location

Archive all generated files under:

```text
/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究
```

Create one directory per topic:

```text
YYYYMMDD-{主题}/
├── 产业链研究底稿.md
├── 小红书发布文案.md
├── {主题}研究.pptx                 # Generated only after template confirmation
└── 高清图片/                       # Generated only after the PPT
    ├── 01-{主题}研究.png
    ├── 02-{主题}研究.png
    └── 总览图.png
```

Use `scripts/topic_registry.py` for every concrete topic. The registry and existing output directories are the source of truth for duplicate detection.

## Workflow

1. Determine whether the user specified a topic.
2. Before researching or writing, reserve exactly one topic:

   ```bash
   python3 scripts/topic_registry.py start
   python3 scripts/topic_registry.py start --topic "咖啡产业链"
   ```

   Use the first command for `生成今日产业链` or other unspecified-topic requests. Use the second for an explicit topic.
3. If the script reports a duplicate, do not generate it. For an unspecified request, run `start` again only after resolving the registry error. For an explicit duplicate, explain that it already exists and select a closely related unused topic unless the user explicitly demands repetition.
4. Research the topic. Browse current primary or authoritative sources whenever claims involve market size, rankings, prices, policies, company positions, production volumes, or other changing facts.
5. Write `产业链研究底稿.md` and `小红书发布文案.md` in the directory
   returned by the script. Follow
   [references/output-schema.md](references/output-schema.md).
6. Complete the registry entry:

   ```bash
   python3 scripts/topic_registry.py complete \
     --topic "咖啡产业链" \
     --file "/absolute/path/产业链研究底稿.md" \
     --social-file "/absolute/path/小红书发布文案.md"
   ```

7. Return both generated file paths and a one-sentence summary. Then ask:
   `是否要根据产业链研究底稿生成对应 PPT？请提供 PPT 模板的绝对路径。`
8. If the user declines, stop after the two Markdown files. If the user
   provides a template path, continue with
   [references/ppt-continuation.md](references/ppt-continuation.md).

## PPT Continuation

- Treat `产业链研究底稿.md` as the content source and the user-provided PPTX as
  the visual and layout source.
- Preserve the template's design language and reasonably restructure the brief
  for slides instead of dumping Markdown text into placeholders.
- Save the final PPTX in the topic directory.
- Render every slide as a highest-quality PNG and create a total overview image.
- Put every rendered slide and the overview image in the topic directory's
  `高清图片/` directory.
- Follow the full workflow and verification requirements in
  [references/ppt-continuation.md](references/ppt-continuation.md).

## Non-Repetition Rules

- Never rely only on conversation memory.
- Always call `topic_registry.py start` before generating a concrete topic.
- Treat both `reserved` and `completed` topics as used.
- Normalize optional `产业链` suffixes during duplicate checks, so `咖啡` and `咖啡产业链` count as the same topic.
- Do not use `--allow-repeat` unless the user explicitly asks to regenerate or repeat an existing topic.
- For batch requests, reserve each topic separately before writing any brief.

## Content Rules

- Focus on industry structure, value creation, dependencies, bottlenecks, and flows.
- Separate verified facts from analysis or cautious inference.
- Attach source links and dates to changing claims.
- Avoid investment advice, deterministic winner predictions, and unsupported profit claims.
- Use category-level descriptions when reliable current data is unavailable.
- Keep the brief reusable by downstream skills; do not add instructions aimed at a specific visual or publishing platform.

## Xiaohongshu Publishing Rules

- Keep publishing copy separate from the reusable research brief.
- Provide 5 title options with different hooks; avoid fabricated numbers,
  exaggerated certainty, and guaranteed-return language.
- The main body should be readable without the research brief and explain the
  chain, where value is added, major barriers, risks, and overlooked facts.
- Use short paragraphs, restrained emoji, and a closing interaction question.
- Provide 8-15 relevant hashtag topics. Do not add unrelated trending tags.
- Distinguish verified facts from analysis when the distinction matters.

## Utility Commands

```bash
python3 scripts/topic_registry.py status
python3 scripts/topic_registry.py check --topic "咖啡产业链"
python3 scripts/topic_registry.py suggest --count 7
```
