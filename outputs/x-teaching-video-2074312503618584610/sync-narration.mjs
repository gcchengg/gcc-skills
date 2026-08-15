import fs from 'node:fs';

const scenes = [
  ['s1',0,9.36], ['s2',9.36,9.91], ['s3',19.27,8.49], ['s4',27.76,8.74],
  ['s5',36.5,7.86], ['s6',44.36,8.32], ['s7',52.68,5.94], ['s8',58.62,5.615],
];
const htmlPath = new URL('./index.html', import.meta.url);
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/data-composition-id="main" data-start="0" data-duration="[^"]+"/, 'data-composition-id="main" data-start="0" data-duration="64.235"');
for (let i = 0; i < scenes.length; i++) {
  const [sceneId,start,duration] = scenes[i];
  const timing = `data-start="${start}" data-duration="${duration}"`;
  html = html.replace(new RegExp(`(id="${sceneId}"[^>]*?)data-start="[^"]+" data-duration="[^"]+"`), `$1${timing}`);
  html = html.replace(new RegExp(`(id="c${i+1}"[^>]*?)data-start="[^"]+" data-duration="[^"]+"`), `$1${timing}`);
}
if (!html.includes('id="narration-audio"')) {
  html = html.replace('</div><script>window.__timelines=', '<audio id="narration-audio" data-hf-id="audio-narration" src="audio/narration-fish.mp3" data-start="0" data-duration="64.235" data-track-index="10" data-volume="1"></audio>\n</div><script>window.__timelines=');
}
html = html.replace(/duration:72,ease:/, 'duration:64.235,ease:');
fs.writeFileSync(htmlPath, html);

const storyboardPath = new URL('./storyboard/storyboard.json', import.meta.url);
const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
storyboard.audio = {path:'audio/narration-fish.mp3',duration_seconds:64.235};
for (let i=0;i<scenes.length;i++) {
  storyboard.scenes[i].start=scenes[i][1];
  storyboard.scenes[i].end=Number((scenes[i][1]+scenes[i][2]).toFixed(3));
}
fs.writeFileSync(storyboardPath, JSON.stringify(storyboard,null,2)+'\n');

const metaPath = new URL('./meta.json', import.meta.url);
const meta = JSON.parse(fs.readFileSync(metaPath,'utf8'));
meta.duration_seconds=64.235;
meta.narration={service:'Fish Audio',voice_name:'中文科技知识讲解',voice_id:'a48a402a-8f0c-48d6-b8da-e8f49706364d',model_id:'fishaudio-s21pro-flash',format:'mp3',speed:1,request_id:'codex-teaching-video-66db1b34550cc6040c76748e'};
fs.writeFileSync(metaPath, JSON.stringify(meta,null,2)+'\n');
