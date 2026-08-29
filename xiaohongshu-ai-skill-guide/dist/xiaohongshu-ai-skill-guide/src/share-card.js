export function wrapText(text, maxChars, maxLines) {
  const chars = [...text]; const lines = [];
  while (chars.length && lines.length < maxLines) lines.push(chars.splice(0, maxChars).join(''));
  if (chars.length) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  return lines;
}

export function buildShareCardModel(result, context) {
  return { archetype: result.archetype, profile: result.profile, radar: result.radar, skills: result.essential.slice(0, 5).map(({ name }) => name), industryName: context.industryName, roleNames: context.roleNames, catalogVersion: context.catalogVersion };
}

export function renderShareCard(canvas, model) {
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1440); gradient.addColorStop(0, '#ff3155'); gradient.addColorStop(1, '#ffb943');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1440);
  ctx.fillStyle = '#fff'; roundRect(ctx, 72, 100, 936, 1180, 48); ctx.fill();
  ctx.fillStyle = '#ff3155'; ctx.font = '700 30px sans-serif'; ctx.fillText('MY AI SKILL SETUP', 130, 180);
  ctx.fillStyle = '#15161b'; ctx.font = '800 72px sans-serif'; wrapText(model.archetype, 10, 2).forEach((line, i) => ctx.fillText(line, 130, 290 + i * 86));
  ctx.fillStyle = '#72757d'; ctx.font = '36px sans-serif'; ctx.fillText(`${model.industryName} · ${model.roleNames.join(' × ')}`, 130, 475);
  drawRadar(ctx, model.radar, 540, 670, 100);
  ctx.fillStyle = '#15161b'; ctx.font = '700 32px sans-serif'; ctx.fillText('我的必装 Skill TOP 5', 130, 835);
  model.skills.forEach((name, i) => { ctx.fillStyle = '#f4f1ed'; roundRect(ctx, 130, 870 + i * 64, 820, 48, 16); ctx.fill(); ctx.fillStyle = '#25262b'; ctx.font = '600 25px sans-serif'; ctx.fillText(name, 160, 902 + i * 64); });
  ctx.fillStyle = '#777'; ctx.font = '26px sans-serif'; ctx.fillText(`目录版本 ${model.catalogVersion} · AI Skill 装机指南`, 130, 1215);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function drawRadar(ctx, radar, centerX, centerY, radius) {
  const entries = Object.entries(radar || {}).slice(0, 5);
  if (entries.length < 3) return;
  const point = (index, scale = 1) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / entries.length;
    return [centerX + Math.cos(angle) * radius * scale, centerY + Math.sin(angle) * radius * scale];
  };
  [1, .66, .33].forEach((scale) => {
    ctx.beginPath(); entries.forEach((_, i) => { const [x, y] = point(i, scale); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
    ctx.strokeStyle = '#e2dcd6'; ctx.lineWidth = 2; ctx.stroke();
  });
  ctx.beginPath(); entries.forEach(([, value], i) => { const [x, y] = point(i, Math.max(0, Math.min(100, value)) / 100); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
  ctx.fillStyle = 'rgba(255,49,85,.2)'; ctx.strokeStyle = '#ff3155'; ctx.lineWidth = 5; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#64666d'; ctx.font = '500 23px sans-serif'; ctx.textAlign = 'center';
  entries.forEach(([label], i) => { const [x, y] = point(i, 1.32); ctx.fillText(label, x, y + 8); }); ctx.textAlign = 'start';
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
}
