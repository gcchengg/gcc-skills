import fs from 'node:fs';

const storyboardPath = new URL('./storyboard/storyboard.json', import.meta.url);
const storyboard = JSON.parse(fs.readFileSync(storyboardPath, 'utf8'));
storyboard.scenes[7].image = null;
storyboard.scenes[7].image_focus = null;
fs.writeFileSync(storyboardPath, JSON.stringify(storyboard, null, 2) + '\n');

const mapPath = new URL('./source/source-map.json', import.meta.url);
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
map.attribution = 'Modengsir AI (@ModengSir), X Article, 2026-07-07';
map.sections = [
  {id:'intro', title:'为什么选择 WorkBuddy', images:['images/source-02.jpg']},
  {id:'reason-01', title:'微信生态与迁移成本', images:['images/source-09.jpg']},
  {id:'reason-02', title:'自然语言与学习成本', images:['images/source-05.jpg']},
  {id:'reason-03', title:'碎片时间与远程派活', images:['images/source-08.jpg','images/source-10.jpg']},
  {id:'reason-04', title:'内容运营任务覆盖', images:['images/source-02.jpg']},
  {id:'reason-05', title:'国内可用性与稳定性', images:['images/source-06.jpg']},
  {id:'conclusion', title:'适合工作流才是最好', images:['images/source-07.jpg']},
];
map.omitted_from_video = [
  {path:'images/source-01.jpg', reason:'功能分类截图，与主线重复'},
  {path:'images/source-03.jpg', reason:'开发功能截图，与创作者选择主线无关'},
  {path:'images/source-04.jpg', reason:'办公功能截图，与创作者选择主线重复'},
  {path:'images/source-07.jpg', reason:'结论宣传图，视频结尾改用更简洁的自制总结卡'},
];
fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
