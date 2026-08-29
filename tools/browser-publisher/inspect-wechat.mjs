import * as imported from "playwright";
const pw = imported.default || imported;
const browser = await pw.chromium.connectOverCDP("http://127.0.0.1:9223");
for (const [i, page] of browser.contexts()[0].pages().entries()) {
  console.log(`PAGE ${i} ${await page.title()} ${page.url()}`);
  const visible = await page.locator('button:visible, [role="button"]:visible, .weui-desktop-btn:visible, a:visible').allTextContents();
  console.log(visible.map((x) => x.trim()).filter(Boolean).slice(-100));
  const next = page.getByText("下一步", { exact: true }).last();
  if (await next.isVisible().catch(() => false)) {
    await next.click();
    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.waitForTimeout(5000);
      const after = await page.locator('button:visible, [role="button"]:visible, .weui-desktop-btn:visible, a:visible').allTextContents();
      console.log(`AFTER_NEXT_${(attempt + 1) * 5}s`, after.map((x) => x.trim()).filter(Boolean).slice(-100));
      if (after.some((x) => ["确认", "确定", "完成"].includes(x.trim()))) break;
    }
    await page.screenshot({ path: "/Users/apple/Documents/GitHub/gcc-skills/公众号文章/20260806-AdrianPunk115-2082706843466633354/wechat_cover_state.png", fullPage: false });
  }
  await page.screenshot({ path: "/Users/apple/Documents/GitHub/gcc-skills/公众号文章/20260806-AdrianPunk115-2082706843466633354/wechat_cover_state.png", fullPage: false });
}
await browser.close();
