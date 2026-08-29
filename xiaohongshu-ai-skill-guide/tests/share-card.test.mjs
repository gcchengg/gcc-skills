import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareCardModel, wrapText } from '../src/share-card.js';

test('share model contains five Skills and never leaks URLs', () => {
  const model = buildShareCardModel({ archetype: '产品型全栈造物者', profile: '测试', radar: { 创造: 80, 分析: 70, 表达: 60, 执行: 90, 协作: 50 }, essential: Array.from({ length: 5 }, (_, i) => ({ name: `技能${i}`, githubUrl: 'https://github.com/x/y' })) }, { industryName: '软件与互联网', roleNames: ['程序员', '产品经理'], catalogVersion: '2026.08' });
  assert.equal(model.skills.length, 5);
  assert.doesNotMatch(JSON.stringify(model), /github\.com/);
});

test('wrapText deterministically truncates long text', () => {
  const lines = wrapText('这是一个非常非常长的职业类型名称需要截断', 8, 2);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /…$/);
});
