import fs from 'node:fs';
const p=new URL('./source/source-map.json',import.meta.url);const m=JSON.parse(fs.readFileSync(p,'utf8'));
m.attribution='Kelvin (@ai_Goge), X Article, 2026-08-07';
m.sections=[
 {id:'definition',title:'FDE 的定义',images:['images/source-05.jpg']},
 {id:'enterprise-problem',title:'企业 AI 的最后一公里',images:['images/source-01.jpg']},
 {id:'difference',title:'FDE 与普通开发的区别',images:['images/source-03.jpg']},
 {id:'daily-work',title:'FDE 的五步工作流',images:['images/source-04.jpg']},
 {id:'core-abilities',title:'懂业务、懂 AI、能落地',images:[]},
 {id:'worked-example',title:'房地产销售助手闭环',images:['images/source-06.jpg']},
 {id:'learning-path',title:'普通人的学习路线',images:['images/source-02.jpg']},
 {id:'conclusion',title:'从看起来能用到真的能用',images:[]}
];m.omitted_from_video=[];fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
