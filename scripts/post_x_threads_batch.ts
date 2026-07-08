import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  CHROME_CANDIDATES_FULL,
  CdpConnection,
  copyImageToClipboard,
  findExistingChromeDebugPort,
  getDefaultProfileDir,
  launchChrome,
  pasteFromClipboard,
  sleep,
  waitForChromeDebugPort,
} from '/Users/apple/.codex/skills/baoyu-post-to-x/scripts/x-utils.ts';

const ROOT = '/Users/apple/Documents/GitHub/gcc-skills/美女博主';
const COMPOSE_URL = 'https://x.com/compose/post';

type Task = {
  name: string;
  postText: string;
  promptText: string;
  images: string[];
};

async function listTasks(): Promise<Task[]> {
  const fs = await import('node:fs/promises');
  const entries = await fs.readdir(ROOT, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  const tasks: Task[] = [];

  for (const name of dirs) {
    const dir = path.join(ROOT, name);
    const mdPath = path.join(dir, 'Twitter日语文案.md');
    const text = await fs.readFile(mdPath, 'utf8');
    const postText = between(text, '## 投稿文', '## プロンプト要約').trim();
    const promptText = between(text, '```text', '```').trim();
    const imageDir = path.join(dir, 'images');
    const imageNames = (await fs.readdir(imageDir)).filter((f) => {
      return !f.endsWith('-base.png') && /\.(png|jpe?g|webp|gif)$/i.test(f);
    }).sort();
    tasks.push({
      name,
      postText,
      promptText: `【プロンプト】\n${promptText}`,
      images: imageNames.map((f) => path.join(imageDir, f)),
    });
  }

  return tasks;
}

function between(text: string, start: string, end: string): string {
  const s = text.indexOf(start);
  if (s < 0) return '';
  const after = text.slice(s + start.length);
  const e = after.indexOf(end);
  return e < 0 ? after : after.slice(0, e);
}

async function waitFor<T>(
  label: string,
  timeoutMs: number,
  fn: () => Promise<T | null | false | undefined>,
): Promise<T> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await fn();
    if (value) return value as T;
    await sleep(800);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function evalInPage<T>(cdp: CdpConnection, sessionId: string, expression: string): Promise<T> {
  const result = await cdp.send<{ result: { value: T } }>('Runtime.evaluate', {
    expression,
    returnByValue: true,
  }, { sessionId });
  return result.result.value;
}

async function waitForEditorCount(cdp: CdpConnection, sessionId: string, count: number): Promise<void> {
  await waitFor(`editor count ${count}`, 60_000, async () => {
    const n = await evalInPage<number>(cdp, sessionId, `
      document.querySelectorAll('[data-testid^="tweetTextarea_"]').length
    `);
    return n >= count;
  });
}

async function insertText(cdp: CdpConnection, sessionId: string, index: number, text: string): Promise<void> {
  await waitForEditorCount(cdp, sessionId, index + 1);
  const ok = await evalInPage<boolean>(cdp, sessionId, `
    (() => {
      const editors = Array.from(document.querySelectorAll('[data-testid^="tweetTextarea_"]'));
      const editor = editors[${index}];
      if (!editor) return false;
      editor.focus();
      document.execCommand('insertText', false, ${JSON.stringify(text)});
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(text)} }));
      return true;
    })()
  `);
  if (!ok) throw new Error(`Editor ${index} not found`);
  await sleep(600);
}

async function addThreadItem(cdp: CdpConnection, sessionId: string, expectedCount: number): Promise<void> {
  const clicked = await evalInPage<boolean>(cdp, sessionId, `
    (() => {
      const candidates = Array.from(document.querySelectorAll('[data-testid="addButton"], button[aria-label*="Add"], button[aria-label*="追加"]'));
      const btn = candidates.find((b) => b instanceof HTMLElement && b.offsetParent !== null && b.getAttribute('aria-disabled') !== 'true');
      if (!btn) return false;
      (btn as HTMLElement).click();
      return true;
    })()
  `);
  if (!clicked) throw new Error('Could not find X add-post button for thread composer');
  await waitForEditorCount(cdp, sessionId, expectedCount);
  await sleep(800);
}

async function pasteImages(cdp: CdpConnection, sessionId: string, editorIndex: number, images: string[]): Promise<void> {
  if (images.length === 0) return;
  await waitForEditorCount(cdp, sessionId, editorIndex + 1);
  await evalInPage<void>(cdp, sessionId, `
    (() => {
      const editor = Array.from(document.querySelectorAll('[data-testid^="tweetTextarea_"]'))[${editorIndex}];
      (editor as HTMLElement | undefined)?.focus();
    })()
  `);

  for (const imagePath of images) {
    console.log(`[batch] Pasting image: ${imagePath}`);
    const before = await evalInPage<number>(cdp, sessionId, `document.querySelectorAll('img[src^="blob:"]').length`);
    if (!copyImageToClipboard(imagePath)) throw new Error(`Failed to copy image: ${imagePath}`);
    await sleep(500);
    const pasted = pasteFromClipboard('Google Chrome', 5, 500);
    if (!pasted) throw new Error(`Failed to paste image: ${imagePath}`);
    await waitFor(`image upload ${path.basename(imagePath)}`, 30_000, async () => {
      const n = await evalInPage<number>(cdp, sessionId, `document.querySelectorAll('img[src^="blob:"]').length`);
      return n > before;
    });
    await sleep(800);
  }
}

async function submitThread(cdp: CdpConnection, sessionId: string): Promise<void> {
  const state = await evalInPage<{ clicked: boolean; disabledCount: number; buttonCount: number }>(cdp, sessionId, `
    (() => {
      const buttons = Array.from(document.querySelectorAll('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'));
      const enabled = buttons.find((b) => b instanceof HTMLElement && b.offsetParent !== null && b.getAttribute('aria-disabled') !== 'true' && !(b as HTMLButtonElement).disabled);
      if (enabled) {
        (enabled as HTMLElement).click();
        return { clicked: true, disabledCount: buttons.length - 1, buttonCount: buttons.length };
      }
      return { clicked: false, disabledCount: buttons.length, buttonCount: buttons.length };
    })()
  `);
  if (!state.clicked) {
    throw new Error(`Could not find enabled post button. Buttons: ${state.buttonCount}, disabled: ${state.disabledCount}`);
  }
  await sleep(6000);
}

async function postTask(cdp: CdpConnection, sessionId: string, task: Task, submit: boolean): Promise<void> {
  console.log(`[batch] Composing: ${task.name}`);
  await waitForEditorCount(cdp, sessionId, 1);
  await sleep(1500);

  await insertText(cdp, sessionId, 0, task.postText);
  await pasteImages(cdp, sessionId, 0, task.images.slice(0, 4));

  await addThreadItem(cdp, sessionId, 2);
  await insertText(cdp, sessionId, 1, task.promptText);

  const rest = task.images.slice(4);
  if (rest.length > 0) {
    await addThreadItem(cdp, sessionId, 3);
    await insertText(cdp, sessionId, 2, '追加画像');
    await pasteImages(cdp, sessionId, 2, rest.slice(0, 4));
  }

  if (submit) {
    console.log(`[batch] Submitting: ${task.name}`);
    await submitThread(cdp, sessionId);
    console.log(`[batch] Submitted: ${task.name}`);
  } else {
    console.log(`[batch] Preview ready: ${task.name}`);
  }
}

async function main(): Promise<void> {
  const tasks = await listTasks();
  const start = Number(process.env.X_START ?? '0');
  const count = process.env.X_COUNT ? Number(process.env.X_COUNT) : tasks.length - start;
  const selected = tasks.slice(start, start + count);
  const submit = process.env.X_DRY_RUN !== '1';
  const profileDir = getDefaultProfileDir();
  await mkdir(profileDir, { recursive: true });

  const existingPort = await findExistingChromeDebugPort(profileDir);
  const launched = existingPort === null
    ? await launchChrome(COMPOSE_URL, profileDir, CHROME_CANDIDATES_FULL)
    : null;
  const port = existingPort ?? launched!.port;
  console.log(existingPort === null ? `[batch] Launched Chrome on ${port}` : `[batch] Reusing Chrome on ${port}`);

  const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
  const cdp = await CdpConnection.connect(wsUrl, 30_000, { defaultTimeoutMs: 20_000 });
  try {
    for (let i = 0; i < selected.length; i++) {
      const globalIndex = start + i;
      console.log(`[batch] ${globalIndex + 1}/${tasks.length}`);
      const page = await createComposeSession(cdp);
      try {
        await postTask(cdp, page.sessionId, selected[i]!, submit);
      } finally {
        await cdp.send('Target.detachFromTarget', { sessionId: page.sessionId }).catch(() => undefined);
      }
      await sleep(15_000);
    }
  } finally {
    cdp.close();
    launched?.chrome.unref();
  }
}

async function createComposeSession(cdp: CdpConnection): Promise<{ targetId: string; sessionId: string }> {
  const created = await cdp.send<{ targetId: string }>('Target.createTarget', { url: COMPOSE_URL });
  const targetId = created.targetId;
  await cdp.send('Target.activateTarget', { targetId });
  await sleep(1500);
  const attached = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  const sessionId = attached.sessionId;
  await cdp.send('Page.enable', {}, { sessionId });
  await cdp.send('Runtime.enable', {}, { sessionId });
  await cdp.send('Input.setIgnoreInputEvents', { ignore: false }, { sessionId });
  await waitForEditorCount(cdp, sessionId, 1);
  return { targetId, sessionId };
}

await main().catch((err) => {
  console.error(`[batch] Error: ${err instanceof Error ? err.stack || err.message : String(err)}`);
  process.exit(1);
});
