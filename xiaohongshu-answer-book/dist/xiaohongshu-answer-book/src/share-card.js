export function wrapText(text, maxChars, maxLines) {
  const chars = [...String(text || '')]; const lines = [];
  while (chars.length && lines.length < maxLines) lines.push(chars.splice(0, maxChars).join(''));
  if (chars.length && lines.length) lines[lines.length - 1] = `${lines.at(-1).slice(0, Math.max(0, maxChars - 1))}…`;
  return lines;
}

export function buildShareModel(result, { hideQuestion = false, productName = '答案正在浮现' } = {}) {
  return {
    question: hideQuestion ? '一个只属于你的问题' : result.question,
    answer: result.answer.text,
    insight: result.answer.insight,
    categoryName: result.categoryName,
    dateKey: result.dateKey,
    productName
  };
}

export function drawShareCard(canvas, model) {
  canvas.width = 1080; canvas.height = 1440; const ctx = canvas.getContext('2d');
  const background = ctx.createRadialGradient(540, 470, 30, 540, 720, 900);
  background.addColorStop(0, '#34204d'); background.addColorStop(.5, '#120d20'); background.addColorStop(1, '#05040b');
  ctx.fillStyle = background; ctx.fillRect(0, 0, 1080, 1440);
  drawStars(ctx); drawMoon(ctx, 540, 190, 74);
  ctx.textAlign = 'center'; ctx.fillStyle = '#d9b45d'; ctx.font = '500 24px serif'; ctx.fillText('BOOK OF INNER SIGNS', 540, 335);
  ctx.fillStyle = '#aca2ba'; ctx.font = '30px serif'; wrapText(`“${model.question}”`, 25, 2).forEach((line, index) => ctx.fillText(line, 540, 420 + index * 45));
  ctx.strokeStyle = 'rgba(217,180,93,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(180, 540); ctx.lineTo(900, 540); ctx.stroke();
  ctx.fillStyle = '#f7e5a7'; ctx.font = '600 66px serif'; wrapText(model.answer, 12, 3).forEach((line, index, lines) => ctx.fillText(line, 540, 665 + (index - (lines.length - 1) / 2) * 82));
  ctx.fillStyle = '#e1d7c5'; ctx.font = '34px serif'; wrapText(model.insight, 22, 4).forEach((line, index) => ctx.fillText(line, 540, 920 + index * 50));
  ctx.fillStyle = 'rgba(217,180,93,.12)'; rounded(ctx, 245, 1150, 590, 72, 36); ctx.fill();
  ctx.fillStyle = '#d7c9aa'; ctx.font = '26px sans-serif'; ctx.fillText(`${model.categoryName || '心中一问'}  ·  ${model.dateKey}`, 540, 1196);
  ctx.fillStyle = '#f8f1df'; ctx.font = '600 34px serif'; ctx.fillText(`《${model.productName}》`, 540, 1308);
  ctx.fillStyle = '#746a7c'; ctx.font = '22px sans-serif'; ctx.fillText('答案仅供娱乐与自我整理', 540, 1354);
  return new Promise((resolve) => canvas.toBlob ? canvas.toBlob(resolve, 'image/png') : resolve(null));
}

function rounded(ctx, x, y, width, height, radius) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
function drawMoon(ctx, x, y, radius) {
  ctx.save(); ctx.shadowColor = '#f7e5a7'; ctx.shadowBlur = 35; ctx.fillStyle = '#f7e5a7'; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#120d20'; ctx.beginPath(); ctx.arc(x + 28, y - 9, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function drawStars(ctx) {
  ctx.fillStyle = 'rgba(247,229,167,.45)';
  for (let index = 0; index < 72; index++) { const x = (index * 149) % 1040 + 20; const y = (index * 227) % 1380 + 20; const radius = index % 9 === 0 ? 2.4 : 1.1; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); }
}
