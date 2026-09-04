import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9223");
const pages = browser.contexts().flatMap((context) => context.pages());
const page = pages.find((candidate) => candidate.url().includes("appmsg_edit"));
if (!page) throw new Error("WeChat editor page not found");

await page.waitForTimeout(5000);

const result = await page.evaluate(() => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const nodes = [...document.querySelectorAll("button,a,div,span,label,input")]
    .filter(visible)
    .map((element) => ({
      tag: element.tagName,
      text: (element.innerText || element.getAttribute("aria-label") || element.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 100),
      cls: String(element.className || "").slice(0, 180),
      type: element.getAttribute("type") || "",
    }))
    .filter((item) => /封面|图片库|上传|选择|裁剪/.test(item.text) || item.type === "file");
  const fileInputs = [...document.querySelectorAll('input[type="file"]')].map((element) => ({
    cls: element.className,
    accept: element.accept,
    visible: visible(element),
  }));
  const uniqueItem = [...document.querySelectorAll('.weui-desktop-img-picker__item')]
    .find((element) => element.textContent.includes('davinci_发布流水线_封面.png'));
  return { url: location.href, title: document.title, nodes, fileInputs, uniqueItemHTML: uniqueItem?.outerHTML.slice(0, 3000) || null };
});

console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: "/private/tmp/wechat-cover-state.png", fullPage: false });
await browser.close();
