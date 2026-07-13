import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "../..");
const sourcePath = path.join(repo, "tmp_addyosmani_2074927530482835916.json");

const payload = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const tweet = payload.tweet;
const article = tweet.article;
const blocks = article.content.blocks;
const mediaEntities = new Map(
  article.media_entities.map((item) => [
    item.media_id,
    {
      url: item.media_info.original_img_url,
      width: item.media_info.original_img_width,
      height: item.media_info.original_img_height,
    },
  ]),
);

const entityRows = article.content.entityMap
  .filter((entry) => entry.value.type === "MEDIA")
  .map((entry) => {
    const mediaId = entry.value.data.mediaItems?.[0]?.mediaId;
    return {
      key: entry.key,
      mediaId,
      caption: entry.value.data.caption || "",
      ...mediaEntities.get(mediaId),
    };
  });

const textLines = [
  `# ${article.title}`,
  "",
  `原帖：${tweet.url}`,
  `作者：${tweet.author.name}（@${tweet.author.screen_name}）`,
  `发布时间：${tweet.created_at}`,
  `Article ID：${article.id}`,
  "",
  `> Preview: ${article.preview_text}`,
  "",
];

let mediaIndex = 0;
for (const block of blocks) {
  if (block.type === "header-two") {
    textLines.push(`## ${block.text}`, "");
    continue;
  }
  if (block.type === "atomic") {
    const key = block.entityRanges?.[0]?.key;
    const media = entityRows.find((row) => Number(row.key) === key);
    if (media) {
      mediaIndex += 1;
      textLines.push(
        `![原文图 ${String(mediaIndex).padStart(2, "0")}](${media.url})`,
        media.caption ? `图注：${media.caption}` : "",
        "",
      );
    }
    continue;
  }
  if (block.text.trim()) {
    textLines.push(block.text.trim(), "");
  }
}

const inventory = [
  "# 原文图片清单",
  "",
  "处理原则：原文配图多为英文黑底概念卡，信息价值高但不适合直接作为公众号中文解释主视觉。本文保留原文图片 URL 作为证据链；公众号正文优先用中文段落解释核心知识点，并生成中文封面。若后续需要图文版，可按本清单把关键英文图重绘成中文图。",
  "",
  "| 序号 | 原文 media_id | 尺寸 | 原文图注/贡献 | 处理方式 |",
  "| --- | --- | --- | --- | --- |",
];

entityRows.forEach((row, index) => {
  const caption = row.caption || inferContribution(index);
  const treatment = index <= 4
    ? "正文重点解释，可重绘为中文概念图"
    : "保留为原文视觉证据，公众号正文不强制插入";
  inventory.push(
    `| ${String(index + 1).padStart(2, "0")} | ${row.mediaId} | ${row.width}x${row.height} | ${caption.replaceAll("|", "｜")} | ${treatment} |`,
  );
});

function inferContribution(index) {
  const labels = [
    "封面/总论视觉：围绕 outer loop 与责任边界",
    "模型只是引擎，harness 才是可安全工作的车身",
    "loop：investigate、implement、verify、repeat",
    "software factory：多个 loop 规模化运行",
    "系统内外边界：agent 产生证据，人类做裁决",
    "capability 与 agency 的区分",
    "AI 代码占比上升与验证压力",
    "trust-verification gap：生成速度快于控制速度",
    "质量作为 back pressure",
    "人在 constraints、sampling、audit、ownership loop 中",
    "长周期 agent 决策需要 answerability",
    "三种隐藏成本之一：认知投降",
    "三种隐藏成本之一：认知债务",
    "三种隐藏成本之一：编排税",
    "brownfield 系统的隐性行为与历史伤痕",
    "attention/worktree/scope/evidence 的修复方向",
    "alpha、decay、taste 的职业判断框架",
    "把 taste 显性化、可练习化",
    "everyone is developer, not everyone is engineer",
    "未来角色拆分：prototype/build/sweep/grow/maintain",
    "人类持有系统另一侧的 alpha",
    "accountability contract",
    "high agency ladder",
    "brownfield 需要 durable engineering",
    "new work is real work：外循环是新工作",
  ];
  return labels[index] || "原文概念视觉";
}

await fs.writeFile(path.join(root, "原文提取.md"), textLines.join("\n"), "utf8");
await fs.writeFile(path.join(root, "原文图片清单.md"), inventory.join("\n"), "utf8");
