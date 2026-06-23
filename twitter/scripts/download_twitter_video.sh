#!/usr/bin/env bash
set -euo pipefail

OUTPUT_ROOT="/Users/apple/Documents/GitHub/gcc-skills/twitter"
VENV_DIR="${TMPDIR:-/private/tmp}/twitter-skill-yt-dlp-venv"
COOKIES_BROWSER=""

usage() {
  echo "Usage: $0 [--output-root DIR] [--cookies-from-browser BROWSER] TWITTER_URL" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-root)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      OUTPUT_ROOT="$2"
      shift 2
      ;;
    --cookies-from-browser)
      [[ $# -ge 2 ]] || { usage; exit 2; }
      COOKIES_BROWSER="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
    *)
      URL="$1"
      shift
      ;;
  esac
done

if [[ -z "${URL:-}" ]]; then
  usage
  exit 2
fi

if [[ ! "${URL}" =~ ^https?://(www\.)?(x\.com|twitter\.com)/.+/status/[0-9]+ ]]; then
  echo "Expected an x.com or twitter.com status URL: ${URL}" >&2
  exit 2
fi

if [[ "${URL}" =~ /status/([0-9]+) ]]; then
  SOURCE_STATUS_ID="${BASH_REMATCH[1]}"
else
  echo "Could not extract the status ID from: ${URL}" >&2
  exit 2
fi

OUTPUT_DIR="${OUTPUT_ROOT}/${SOURCE_STATUS_ID}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required. Install it before downloading." >&2
  exit 1
fi

if command -v yt-dlp >/dev/null 2>&1; then
  YT_DLP="$(command -v yt-dlp)"
else
  if [[ ! -x "${VENV_DIR}/bin/yt-dlp" || ! -x "${VENV_DIR}/bin/python" ]]; then
    python3 -m venv --clear "${VENV_DIR}"
    "${VENV_DIR}/bin/python" -m pip install yt-dlp
  fi
  YT_DLP="${VENV_DIR}/bin/yt-dlp"
fi

mkdir -p "${OUTPUT_DIR}"

ARGS=(
  --format "bestvideo*+bestaudio/best"
  --merge-output-format mp4
  --write-info-json
  --retries 10
  --fragment-retries 20
  --retry-sleep "fragment:exp=1:10"
  --no-overwrites
  --print "after_move:OUTPUT_DIR=${OUTPUT_DIR}"
  --print "after_move:DOWNLOADED_FILE=%(filepath)s"
  --print "after_move:POST_ID=%(id)s"
  --print "after_move:INFO_JSON=${OUTPUT_DIR}/%(uploader)s_%(id)s.info.json"
  --output "${OUTPUT_DIR}/%(uploader)s_%(id)s.%(ext)s"
)

if [[ -n "${COOKIES_BROWSER}" ]]; then
  ARGS+=(--cookies-from-browser "${COOKIES_BROWSER}")
fi

"${YT_DLP}" "${ARGS[@]}" "${URL}"
