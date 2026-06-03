const fs = require("fs");
const path = require("path");

const outDir = __dirname;
const W = 1080;
const H = 1440;

const cards = [
  {
    file: "01-cover.svg",
    eyebrow: "PRIVATE BEAUTY PROMPT",
    title: "AI私人美妆分析",
    subtitle: "你只需要这样写提示词",
    blocks: [
      ["上传自拍", "自然光 / 正脸 / 五官清晰"],
      ["说明需求", "妆容 / 发型 / 色彩 / 风格"],
      ["保留身份", "不改变五官比例和真实质感"],
      ["生成结果", "高级杂志感形象分析面板"],
    ],
    note: "重点不是生成网红滤镜图，而是让AI输出一张像私人形象顾问交付的视觉分析板。",
  },
  {
    file: "02-formula.svg",
    eyebrow: "UNIVERSAL FORMULA",
    title: "万能提示词公式",
    subtitle: "把这 6 句组合起来就能用",
    blocks: [
      ["1  基于上传自拍", "请基于我上传的自拍/照片"],
      ["2  保持同一身份", "五官比例、肤色气质、真实质感不变"],
      ["3  指定分析主题", "女生妆容 / 发型 / 色彩 / 穿搭风格"],
      ["4  说明画面风格", "高级美妆杂志感，象牙色背景"],
      ["5  列出分析模块", "色板、小图标、局部特写、推荐/避免"],
      ["6  加上限制要求", "自然高级，不廉价，不要品牌logo"],
    ],
    note: "公式：上传对象 + 身份保留 + 主题模块 + 视觉风格 + 输出内容 + 禁止事项。",
  },
  {
    file: "03-makeup.svg",
    eyebrow: "MAKEUP PROMPT",
    title: "妆容分析这样写",
    subtitle: "适合生成美妆分析面板",
    prompt:
      "请基于我上传的自拍，保持同一身份和真实质感，为我生成一张女生妆容分析面板。内容包含：肤色与色调、底妆质地、眼妆、眼线、睫毛、腮红修容、唇色、最终妆容效果。风格要高级自然，像美妆杂志分析板，不夸张，不改变本人身份。",
    outcomes: ["适合底妆", "眼妆方向", "唇色推荐", "腮红修容位置", "最终妆容效果"],
  },
  {
    file: "04-hairstyle.svg",
    eyebrow: "HAIRSTYLE PROMPT",
    title: "发型分析这样写",
    subtitle: "适合生成发型顾问图文卡",
    prompt:
      "请基于我上传的自拍，保持同一身份、脸型比例和真实质感，为我生成一张女生发型分析面板。内容包含：脸型方向、最佳发型变化、推荐发色、不适合发型、配饰、烫卷/理发笔记、发型与穿搭协调。整体要自然高级，有私人形象顾问的视觉分析感。",
    outcomes: ["适合发型", "避开发型", "推荐发色", "卷度/层次建议", "发型搭配方向"],
  },
  {
    file: "05-color.svg",
    eyebrow: "COLOR PROMPT",
    title: "色彩分析这样写",
    subtitle: "适合生成个人色彩分析板",
    prompt:
      "请基于我上传的自拍，保持同一身份和肤色真实质感，为我生成一张女生色彩分析面板。内容包含：最佳颜色、避免颜色、中性色、印花、妆容色彩、发色、珠宝金属、衣柜基础色。请用高级色板和简短中文标签呈现，不要廉价拼贴。",
    outcomes: ["显白颜色", "避雷颜色", "适合唇色", "发色方向", "穿搭基础色"],
  },
  {
    file: "06-style.svg",
    eyebrow: "STYLE PROMPT",
    title: "风格分析这样写",
    subtitle: "适合生成穿搭风格建议图",
    prompt:
      "请基于我上传的自拍，保持同一身份、五官气质和真实质感，为我生成一张女生穿搭风格分析面板。内容包含：最佳风格、避免风格、剪裁指南、基础单品、完整穿搭、配饰、整体风格关键词。画面要高级、清晰、有杂志感，不要夸张网红风。",
    outcomes: ["适合风格", "避开风格", "剪裁方向", "基础单品", "整体气质关键词"],
  },
  {
    file: "07-copy.svg",
    eyebrow: "COPY TEMPLATE",
    title: "完整可复制提示词",
    subtitle: "一段话生成综合形象分析面板",
    prompt:
      "请基于我上传的自拍/照片，保持同一身份、五官比例、肤色气质和真实质感，为我生成一张【女生综合形象分析面板】。风格：奢侈时尚/美妆杂志风，纯米色/象牙色背景，暖色调，柔和漫射光，超逼真摄影质感，简洁优雅线条，精致网格设计，高级留白，中文短标签。内容：中央自然增强肖像，周围加入妆容、发型、色彩、穿搭风格分析，包含色板、小图标、局部特写、推荐/避免、最终风格结果。要求：自然高级，不夸张，不廉价，不改变本人身份，不要品牌logo，文字短、清晰、优雅。",
    outcomes: ["身份保留", "高级杂志感", "四大分析模块", "中文短标签", "自然不夸张"],
  },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(text, maxChars) {
  const segments = String(text).split(/([，。；：、])/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const seg of segments) {
    if ((line + seg).length > maxChars && line) {
      lines.push(line);
      line = seg.replace(/^[，。；：、]/, "");
    } else {
      line += seg;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(lines, x, y, size, color = "#2d2723", gap = 1.45, weight = 400) {
  return lines
    .map(
      (line, i) =>
        `<text x="${x}" y="${y + i * size * gap}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`,
    )
    .join("\n");
}

function pill(x, y, text, color) {
  return `
    <rect x="${x}" y="${y}" width="172" height="50" rx="25" fill="${color}" opacity="0.92"/>
    <text x="${x + 86}" y="${y + 33}" text-anchor="middle" font-size="22" font-weight="700" fill="#fff">${esc(text)}</text>`;
}

function cardSvg(card, index) {
  const isPrompt = Boolean(card.prompt);
  const promptLines = isPrompt ? wrapText(card.prompt, index === 7 ? 24 : 22) : [];
  const blocks = card.blocks || [];
  const colors = ["#B88A6B", "#C99691", "#A5A879", "#917A67", "#D1B28C"];

  let body = "";
  if (blocks.length) {
    body += blocks
      .map((b, i) => {
        const y = 500 + i * (index === 2 ? 118 : 138);
        return `
          <rect x="108" y="${y}" width="864" height="${index === 2 ? 90 : 104}" rx="20" fill="#fffaf2" stroke="#dac9b5" stroke-width="2"/>
          <circle cx="152" cy="${y + 45}" r="16" fill="${colors[i % colors.length]}"/>
          <text x="190" y="${y + 40}" font-size="28" font-weight="800" fill="#2d2723">${esc(b[0])}</text>
          <text x="190" y="${y + 74}" font-size="24" fill="#6f6259">${esc(b[1])}</text>`;
      })
      .join("\n");
  }

  if (isPrompt) {
    const promptHeight = index === 7 ? 570 : 500;
    body += `
      <text x="108" y="478" font-size="30" font-weight="800" fill="#2d2723">复制这段提示词</text>
      <rect x="108" y="510" width="864" height="${promptHeight}" rx="22" fill="#fffaf2" stroke="#dac9b5" stroke-width="2"/>
      ${textLines(promptLines, 148, 568, index === 7 ? 25 : 28, "#3d342e", 1.55, 500)}
      <text x="108" y="${index === 7 ? 1148 : 1075}" font-size="30" font-weight="800" fill="#2d2723">效果会包含</text>
      ${(card.outcomes || []).map((o, i) => pill(108 + (i % 3) * 205, (index === 7 ? 1182 : 1110) + Math.floor(i / 3) * 72, o, colors[i % colors.length])).join("\n")}
    `;
  }

  const noteY = isPrompt ? 1320 : 1250;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbf3e7"/>
      <stop offset="100%" stop-color="#efe2d0"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#8a6b51" flood-opacity="0.13"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="944" cy="128" r="92" fill="#d9b996" opacity="0.23"/>
  <circle cx="128" cy="1290" r="112" fill="#c98983" opacity="0.15"/>
  <rect x="64" y="64" width="952" height="1312" rx="34" fill="#fff8ee" opacity="0.86" filter="url(#shadow)"/>
  <rect x="92" y="92" width="896" height="1256" rx="26" fill="none" stroke="#d8c4ad" stroke-width="2"/>
  <text x="108" y="165" font-size="24" font-weight="800" letter-spacing="3" fill="#a27d60">${esc(card.eyebrow)}</text>
  <text x="108" y="265" font-size="${index === 7 ? 58 : 66}" font-weight="900" fill="#2b2521">${esc(card.title)}</text>
  <text x="108" y="325" font-size="32" font-weight="500" fill="#806d5f">${esc(card.subtitle)}</text>
  <line x1="108" y1="384" x2="972" y2="384" stroke="#d8c4ad" stroke-width="2"/>
  <rect x="108" y="412" width="138" height="34" rx="17" fill="#2d2723"/>
  <text x="177" y="436" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">文字教学图</text>
  <rect x="264" y="412" width="148" height="34" rx="17" fill="#b88a6b"/>
  <text x="338" y="436" text-anchor="middle" font-size="20" font-weight="700" fill="#fff">小红书3:4</text>
  ${body}
  ${
    card.note
      ? `<rect x="108" y="${noteY}" width="864" height="74" rx="18" fill="#f2e5d5" opacity="0.85"/>
        ${textLines(wrapText(card.note, 31), 136, noteY + 32, 23, "#6b584d", 1.35, 600)}`
      : ""
  }
  <text x="934" y="1328" text-anchor="end" font-size="22" fill="#a89583">${String(index).padStart(2, "0")} / 07</text>
</svg>`;
}

cards.forEach((card, i) => {
  fs.writeFileSync(path.join(outDir, card.file), cardSvg(card, i + 1), "utf8");
});

fs.writeFileSync(
  path.join(outDir, "README.md"),
  `# Personal Image Analysis Xiaohongshu Cards\n\nGenerated SVG carousel cards for prompt-teaching posts.\n\n${cards
    .map((c, i) => `${i + 1}. ${c.file}`)
    .join("\n")}\n`,
  "utf8",
);

console.log(`Generated ${cards.length} SVG cards in ${outDir}`);
