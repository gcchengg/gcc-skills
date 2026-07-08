import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  sleep,
} from '/Users/apple/.codex/skills/baoyu-post-to-x/scripts/x-utils.ts';

const ROOT = '/Users/apple/Documents/GitHub/gcc-skills/美女博主';
const COMPOSE_URL = 'https://x.com/compose/post';

type Task = { name: string; postText: string; promptText: string; images: string[] };

function runAppleScript(lines: string[]): string {
  const args = lines.flatMap((line) => ['-e', line]);
  return execFileSync('osascript', args, { encoding: 'utf8' }).trim();
}

function chromeJs(js: string): string {
  return runAppleScript([
    'tell application "Google Chrome"',
    `execute active tab of front window javascript ${JSON.stringify(js)}`,
    'end tell',
  ]);
}

function setChromeUrl(url: string): void {
  runAppleScript([
    'tell application "Google Chrome"',
    `set URL of active tab of front window to ${JSON.stringify(url)}`,
    'activate',
    'end tell',
  ]);
}

function between(text: string, start: string, end: string): string {
  const s = text.indexOf(start);
  if (s < 0) return '';
  const after = text.slice(s + start.length);
  const e = after.indexOf(end);
  return e < 0 ? after : after.slice(0, e);
}

async function listTasks(): Promise<Task[]> {
  const dirs = (await fs.readdir(ROOT, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const tasks: Task[] = [];
  for (const name of dirs) {
    const dir = path.join(ROOT, name);
    const md = await fs.readFile(path.join(dir, 'Twitter日语文案.md'), 'utf8');
    const imageDir = path.join(dir, 'images');
    const images = (await fs.readdir(imageDir))
      .filter((f) => !f.endsWith('-base.png') && /\.(png|jpe?g|webp|gif)$/i.test(f))
      .sort()
      .map((f) => path.join(imageDir, f));
    tasks.push({
      name,
      postText: between(md, '## 投稿文', '## プロンプト要約').trim(),
      promptText: `【プロンプト】\n${between(md, '```text', '```').trim()}`,
      images,
    });
  }
  return tasks;
}

async function waitFor(label: string, timeoutMs: number, fn: () => boolean): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (fn()) return;
    await sleep(800);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function editorCount(): number {
  return Number(chromeJs(`
    (() => Array.from(document.querySelectorAll('[data-testid="tweetTextarea_0"]'))
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length)()
  `) || '0');
}

function insertIntoEditor(index: number, text: string): void {
  const ok = chromeJs(`
    (() => {
      const editors = Array.from(document.querySelectorAll('[data-testid="tweetTextarea_0"]'))
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
        .sort((a,b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height);
      const editor = editors[${index}];
      if (!editor) return 'no-editor';
      editor.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, ${JSON.stringify(text)});
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(text)} }));
      return 'ok';
    })()
  `);
  if (ok !== 'ok') throw new Error(`Failed to insert text into editor ${index}: ${ok}`);
}

function focusEditor(index: number): void {
  chromeJs(`
    (() => {
      const editors = Array.from(document.querySelectorAll('[data-testid="tweetTextarea_0"]'))
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
        .sort((a,b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height);
      editors[${index}]?.focus();
    })()
  `);
}

function clickAddPost(): boolean {
  const result = chromeJs(`
    (() => {
      const visible = el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.offsetParent !== null;
      };
      const buttons = Array.from(document.querySelectorAll('button,div[role="button"]')).filter(visible);
      const candidates = buttons.filter(b => {
        const aria = b.getAttribute('aria-label') || '';
        const test = b.getAttribute('data-testid') || '';
        const text = b.innerText || '';
        return aria.includes('ポストを追加') || aria === '次へ' || text === '次へ' || test === 'addButton';
      });
      const btn = candidates[candidates.length - 1];
      if (!btn) return JSON.stringify({ ok:false, buttons: buttons.slice(0,40).map(b => ({aria:b.getAttribute('aria-label'), test:b.getAttribute('data-testid'), text:b.innerText})) });
      btn.click();
      return JSON.stringify({ ok:true, aria:btn.getAttribute('aria-label'), test:btn.getAttribute('data-testid'), text:btn.innerText });
    })()
  `);
  const parsed = JSON.parse(result);
  if (!parsed.ok) console.log('[current-chrome] add candidates not found', result);
  else console.log('[current-chrome] clicked add/next', result);
  return parsed.ok;
}

async function pasteImages(images: string[]): Promise<void> {
  for (const image of images) {
    console.log(`[current-chrome] Uploading image: ${image}`);
    const before = Number(chromeJs(`document.querySelectorAll('img[src^="blob:"]').length`) || '0');
    await uploadImageByFileInput(image);
    await waitFor(`upload ${path.basename(image)}`, 30_000, () => {
      const now = Number(chromeJs(`document.querySelectorAll('img[src^="blob:"]').length`) || '0');
      return now > before;
    });
    await sleep(1000);
  }
}

async function uploadImageByFileInput(imagePath: string): Promise<void> {
  const ext = path.extname(imagePath).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.webp' ? 'image/webp'
      : ext === '.gif' ? 'image/gif'
        : 'image/png';
  const name = path.basename(imagePath);
  const b64 = fsSync.readFileSync(imagePath).toString('base64');
  const key = `__codexUpload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  chromeJs(`window[${JSON.stringify(key)}] = ""; "ok"`);
  const chunkSize = 180_000;
  for (let i = 0; i < b64.length; i += chunkSize) {
    const chunk = b64.slice(i, i + chunkSize);
    chromeJs(`window[${JSON.stringify(key)}] += ${JSON.stringify(chunk)}; "ok"`);
  }
  const result = chromeJs(`
    (() => {
      const b64 = window[${JSON.stringify(key)}];
      delete window[${JSON.stringify(key)}];
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], ${JSON.stringify(name)}, { type: ${JSON.stringify(mime)} });
      const input = Array.from(document.querySelectorAll('input[type="file"]'))
        .find(i => {
          const accept = i.getAttribute('accept') || '';
          return accept.includes('image') || accept.includes('png') || accept.includes('jpeg') || accept.includes('gif');
        });
      if (!input) return 'no-input';
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return 'ok';
    })()
  `);
  if (result !== 'ok') throw new Error(`File input upload failed for ${imagePath}: ${result}`);
}

function clickPostButton(): void {
  const result = chromeJs(`
    (() => {
      const visible = el => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.offsetParent !== null;
      };
      const buttons = Array.from(document.querySelectorAll('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]')).filter(visible);
      const enabled = buttons.find(b => b.getAttribute('aria-disabled') !== 'true' && !b.disabled);
      if (!enabled) return JSON.stringify({ ok:false, count:buttons.length, labels:buttons.map(b => b.innerText) });
      enabled.click();
      return JSON.stringify({ ok:true, text:enabled.innerText, test:enabled.getAttribute('data-testid') });
    })()
  `);
  const parsed = JSON.parse(result);
  if (!parsed.ok) throw new Error(`No enabled post button: ${result}`);
  console.log('[current-chrome] clicked post', result);
}

async function postTask(task: Task, submit: boolean): Promise<void> {
  console.log(`[current-chrome] Composing ${task.name}`);
  setChromeUrl(COMPOSE_URL);
  await waitFor('compose editor', 60_000, () => editorCount() > 0);
  await sleep(1500);
  insertIntoEditor(0, task.postText);
  await pasteImages(task.images.slice(0, 4));

  if (!clickAddPost()) throw new Error('Could not add second post to thread');
  await waitFor('second editor', 30_000, () => editorCount() >= 2);
  await sleep(1000);
  insertIntoEditor(1, task.promptText);

  const rest = task.images.slice(4);
  if (rest.length) {
    if (!clickAddPost()) throw new Error('Could not add third post to thread');
    await waitFor('third editor', 30_000, () => editorCount() >= 3);
    insertIntoEditor(2, '追加画像');
    await pasteImages(rest.slice(0, 4));
  }

  if (submit) {
    clickPostButton();
    await sleep(8000);
  } else {
    console.log(`[current-chrome] Preview only: ${task.name}`);
  }
}

async function main(): Promise<void> {
  const tasks = await listTasks();
  const start = Number(process.env.X_START ?? '0');
  const count = process.env.X_COUNT ? Number(process.env.X_COUNT) : tasks.length - start;
  const submit = process.env.X_DRY_RUN !== '1';
  const selected = tasks.slice(start, start + count);
  for (let i = 0; i < selected.length; i++) {
    console.log(`[current-chrome] ${start + i + 1}/${tasks.length}`);
    await postTask(selected[i]!, submit);
    await sleep(12_000);
  }
}

await main().catch((err) => {
  console.error(`[current-chrome] Error: ${err instanceof Error ? err.stack || err.message : String(err)}`);
  process.exit(1);
});
