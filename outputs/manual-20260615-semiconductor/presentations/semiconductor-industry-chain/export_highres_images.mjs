import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const pptxPath = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260614-半导体产业链/半导体产业链研究.pptx";
const outputDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260614-半导体产业链/高清图片";
const scale = 4;

const presentation = await PresentationFile.importPptx(await FileBlob.load(pptxPath));
const slides = Array.isArray(presentation.slides?.items)
  ? presentation.slides.items
  : Array.from({ length: presentation.slides.count }, (_, index) => presentation.slides.getItem(index));

await fs.mkdir(outputDir, { recursive: true });
const outputs = [];
for (let index = 0; index < slides.length; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  const output = path.join(outputDir, `${number}-半导体产业链研究.png`);
  const blob = await presentation.export({ slide: slides[index], format: "png", scale });
  await fs.writeFile(output, Buffer.from(await blob.arrayBuffer()));
  outputs.push(output);
}

const columns = 4;
const thumbWidth = 960;
const gap = 48;
const margin = 72;
const firstMeta = await sharp(outputs[0]).metadata();
const thumbHeight = Math.round((firstMeta.height / firstMeta.width) * thumbWidth);
const rows = Math.ceil(outputs.length / columns);
const overviewWidth = margin * 2 + columns * thumbWidth + (columns - 1) * gap;
const overviewHeight = margin * 2 + rows * thumbHeight + (rows - 1) * gap;
const composites = await Promise.all(outputs.map(async (file, index) => ({
  input: await sharp(file).resize({ width: thumbWidth }).png().toBuffer(),
  left: margin + (index % columns) * (thumbWidth + gap),
  top: margin + Math.floor(index / columns) * (thumbHeight + gap),
})));

await sharp({
  create: {
    width: overviewWidth,
    height: overviewHeight,
    channels: 4,
    background: "#ece8e2",
  },
})
  .composite(composites)
  .png()
  .toFile(path.join(outputDir, "总览图.png"));

console.log(JSON.stringify({
  slideCount: outputs.length,
  slideDimensions: `${firstMeta.width}x${firstMeta.height}`,
  overviewDimensions: `${overviewWidth}x${overviewHeight}`,
  outputDir,
}, null, 2));
