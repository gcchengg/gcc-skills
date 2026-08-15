import fs from 'node:fs';
const p=new URL('./index.html',import.meta.url);let h=fs.readFileSync(p,'utf8');
h=h.replace('</style></head>','.scene:first-of-type .label{display:none}</style></head>');
fs.writeFileSync(p,h);
