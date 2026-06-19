import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const presentation = await PresentationFile.importPptx(await FileBlob.load("template-starter.pptx"));
console.log(presentation.help("image.replace", { include: ["index", "examples", "notes"], maxChars: 4000 }));
console.log(presentation.help("slide.images.add", { include: ["index", "examples", "notes"], maxChars: 6000 }));
const slide = presentation.slides.items[0];
const image = slide.images?.items?.[0];
const shape = slide.shapes?.items?.find((item) => String(item.text || "").trim());
console.log(JSON.stringify({
  slideKeys: Object.keys(slide),
  imageCount: slide.images?.items?.length,
  imageKeys: image ? Object.keys(image) : [],
  imageId: image?.id,
  imageName: image?.name,
  imagePosition: image?.position,
  imageMethods: image ? Object.getOwnPropertyNames(Object.getPrototypeOf(image)) : [],
  shapeKeys: shape ? Object.keys(shape) : [],
  shapeMethods: shape ? Object.getOwnPropertyNames(Object.getPrototypeOf(shape)) : [],
}, null, 2));
