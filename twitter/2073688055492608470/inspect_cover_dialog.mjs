import playwright from "/Users/apple/Documents/GitHub/gcc-skills/tools/browser-publisher/node_modules/playwright/index.js";
const { chromium } = playwright;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const page = browser.contexts()[0].pages()[0];
const data = await page.evaluate(() => {
  const dialog = [...document.querySelectorAll('[role="dialog"], .weui-desktop-dialog, .weui-desktop-dialog__wrp')].find(el => el.getBoundingClientRect().width > 500 && (el.innerText || "").includes("选择图片"));
  if (!dialog) return null;
  return [...dialog.querySelectorAll('img,button,a,label,input,[class*="cover"],[class*="item"],[style*="background"]')].slice(0,80).map((el,index)=>({index,tag:el.tagName,text:(el.innerText||el.getAttribute("title")||"").trim(),className:String(el.className),src:el.getAttribute("src"),style:el.getAttribute("style"),html:el.outerHTML.slice(0,800)}));
});
console.log(JSON.stringify(data, null, 2));
