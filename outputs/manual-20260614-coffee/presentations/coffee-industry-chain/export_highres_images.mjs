import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const pptxPath = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260614-咖啡产业链/咖啡产业链研究.pptx";
const outputDir = "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究/20260614-咖啡产业链/高清图片";
const scale = 4;

const presentation = await PresentationFile.importPptx(await FileBlob.load(pptxPath));
const slides = Array.isArray(presentation.slides?.items)
  ? presentation.slides.items
  : Array.from({ length: presentation.slides.count }, (_, index) => presentation.slides.getItem(index));

await fs.mkdir(outputDir, { recursive: true });
for (let index = 0; index < slides.length; index += 1) {
  const number = String(index + 1).padStart(2, "0");
  const output = path.join(outputDir, `${number}-咖啡产业链研究.png`);
  const blob = await presentation.export({ slide: slides[index], format: "png", scale });
  await fs.writeFile(output, Buffer.from(await blob.arrayBuffer()));
  console.log(output);
}
