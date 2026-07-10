#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ARTICLE_DIR="$ROOT/twitter/2061907337154367865"
ENV_FILE="$ROOT/产业链拆解/20260516-1712-AI-Agent-结构解剖/.baoyu-skills/.env"
MD2WECHAT="$ROOT/tools/bin/md2wechat"

set -a
source "$ENV_FILE"
set +a

"$MD2WECHAT" sync-md \
  "$ARTICLE_DIR/微信公众号发布稿_上传版.md" \
  --title "Codex 新玩法：让 AI 自己组队干活" \
  --author "guocc" \
  --digest "复杂任务别只靠一个上下文硬扛。用动态工作流，让 Codex 为每个任务临时搭一套执行系统。" \
  --cover "$ARTICLE_DIR/wechat_upload_assets/wechat_img_01.png"
