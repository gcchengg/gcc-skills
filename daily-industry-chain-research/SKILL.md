---
name: daily-industry-chain-research
description: Generate one non-repeating Chinese industry-chain research brief as structured Markdown text for downstream PPT, infographic, video, or social-content skills. Use when the user asks for 今日产业链, 每天介绍一个产业链, 随机产业链拆解, a specific industry-chain research draft, or a batch topic plan. This skill produces text only and archives every brief under PPT生成/每日产业链研究.
---

# Daily Industry Chain Research

Use Chinese by default. Produce research text only. Do not generate images, image prompts, slides, videos, publishing captions, or platform-specific layouts.

## Output Location

Archive all generated files under:

```text
/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究
```

Create one directory per topic:

```text
YYYYMMDD-{主题}/
└── 产业链研究底稿.md
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
5. Write only `产业链研究底稿.md` in the directory returned by the script. Follow [references/output-schema.md](references/output-schema.md).
6. Complete the registry entry:

   ```bash
   python3 scripts/topic_registry.py complete --topic "咖啡产业链" --file "/absolute/path/产业链研究底稿.md"
   ```

7. Return the generated file path and a one-sentence summary.

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

## Utility Commands

```bash
python3 scripts/topic_registry.py status
python3 scripts/topic_registry.py check --topic "咖啡产业链"
python3 scripts/topic_registry.py suggest --count 7
```
