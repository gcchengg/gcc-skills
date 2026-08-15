import fs from 'node:fs';

const file = new URL('./index.html', import.meta.url);
let html = fs.readFileSync(file, 'utf8');
const scenes = [
  ['s1', 0, 7.6], ['s2', 7.6, 9.38], ['s3', 16.98, 13.8], ['s4', 30.78, 10.69],
  ['s5', 41.47, 9.13], ['s6', 50.6, 9.03], ['s7', 59.63, 8.78], ['s8', 68.41, 6.82],
];
html = html.replace('data-composition-id="main" data-start="0" data-duration="72"', 'data-composition-id="main" data-start="0" data-duration="75.23"');
for (let i = 0; i < scenes.length; i++) {
  const [sceneId, start, duration] = scenes[i];
  const captionId = `c${i + 1}`;
  const timing = `data-start="${start}" data-duration="${duration}"`;
  html = html.replace(new RegExp(`(id="${sceneId}"[^>]*?)data-start="[^"]+" data-duration="[^"]+"`), `$1${timing}`);
  html = html.replace(new RegExp(`(id="${captionId}"[^>]*?)data-start="[^"]+" data-duration="[^"]+"`), `$1${timing}`);
}
if (!html.includes('data-hf-id="audio-narration"')) {
  html = html.replace('</div><script>window.__timelines=', '<audio id="narration-audio" data-hf-id="audio-narration" src="audio/narration-fish.mp3" data-start="0" data-duration="75.23" data-track-index="10" data-volume="1"></audio>\n</div><script>window.__timelines=');
}
html = html.replace('<audio data-hf-id="audio-narration"', '<audio id="narration-audio" data-hf-id="audio-narration"');
html = html.replace('duration:72,ease:', 'duration:75.23,ease:');
fs.writeFileSync(file, html);

const storyboardFile = new URL('./storyboard/storyboard.json', import.meta.url);
const storyboard = JSON.parse(fs.readFileSync(storyboardFile, 'utf8'));
storyboard.audio = {path: 'audio/narration-fish.mp3', duration_seconds: 75.23};
for (let i = 0; i < scenes.length; i++) {
  const [, start, duration] = scenes[i];
  storyboard.scenes[i].start = start;
  storyboard.scenes[i].end = Number((start + duration).toFixed(2));
}
fs.writeFileSync(storyboardFile, JSON.stringify(storyboard, null, 2) + '\n');

const metaFile = new URL('./meta.json', import.meta.url);
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
meta.duration_seconds = 75.23;
meta.narration = {
  service: 'Fish Audio', voice_name: '中文科技知识讲解',
  voice_id: 'a48a402a-8f0c-48d6-b8da-e8f49706364d',
  model_id: 'fishaudio-s21pro-flash', format: 'mp3', speed: 1,
};
fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + '\n');
