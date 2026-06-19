---
name: twitter
description: Download the highest-quality available video from Twitter/X posts, then create a Chinese Xiaohongshu article and a Japanese Twitter/X post in one dedicated directory per source link under the twitter skill directory. Use when the user invokes $twitter, provides an x.com or twitter.com status URL, or asks to download, save, fetch, republish, or generate social copy from a Twitter/X video.
---

# Twitter/X Video And Social Copy

Use Chinese when communicating with the user. Download videos with the bundled script. Do not manually reconstruct media URLs.

## Workflow

1. Extract every `x.com` or `twitter.com` status URL from the user's request.
2. Run the script once per URL:

   ```bash
   bash scripts/download_twitter_video.sh "https://x.com/user/status/id"
   ```

3. If the post requires login, retry using the user's active browser cookies:

   ```bash
   bash scripts/download_twitter_video.sh --cookies-from-browser chrome "URL"
   ```

   Prefer `chrome`, then try `safari` only when appropriate.
4. Read the script's `OUTPUT_DIR` line. Use that exact per-link directory for every generated artifact.
5. Read the generated `.info.json` for the original post text, uploader, source URL, and post ID.
6. Inspect the video itself. Use `ffprobe` for resolution, duration, codecs, and file size. Extract representative frames with `ffmpeg` or inspect the video when needed. Do not write copy based only on the filename.
7. Create these two files inside the per-link output directory:

   ```text
   小红书文案.md
   Twitter日语文案.md
   ```

8. Return clickable absolute paths to the video and both articles.

## Output Structure

Store everything generated from one link in its own directory, named with the status ID from the source URL:

```text
/Users/apple/Documents/GitHub/gcc-skills/twitter/{source-status-id}/
├── {uploader}_{media-id}.mp4
├── {uploader}_{media-id}.info.json
├── 小红书文案.md
└── Twitter日语文案.md
```

Never place generated content outside `/Users/apple/Documents/GitHub/gcc-skills/twitter/`. Treat each distinct source status URL as a separate output directory.

## Xiaohongshu Article

Write natural simplified Chinese suitable for publishing on Xiaohongshu. Include:

- 3 concise title options, each no longer than 20 Chinese characters when practical
- One ready-to-publish article with an engaging opening, accurate description of the video, personal observation, and a closing interaction question
- 5 to 10 relevant hashtags
- A source note containing the original Twitter/X URL

Avoid unsupported claims, fake personal experiences, exaggerated clickbait, and invented context. Do not mention downloading or `yt-dlp` in the publishing copy.

## Japanese Twitter/X Post

Write natural Japanese suitable for Twitter/X. Include:

- One primary ready-to-publish post, concise enough for a standard X post when practical
- Two alternative versions with meaningfully different tones
- Relevant Japanese hashtags, used sparingly
- A source URL line

Prefer idiomatic Japanese over literal translation. Preserve names and facts from the source. Do not invent context or claim ownership of the video.

## Rules

- Select the highest-quality stream actually provided by Twitter/X.
- Use `ffmpeg` to merge separate video and audio streams.
- Retry transient connection and media-fragment failures.
- Generate both article files unless the user explicitly opts out.
- Put the video, metadata, Chinese article, Japanese post, and any analysis artifacts in the same per-link directory.
- Use the source URL's status ID as the directory name to prevent accidental overwrites.
- Do not claim that a source is HD when Twitter/X only provides a lower-resolution stream.
- Do not upscale or otherwise alter the source unless the user explicitly requests it.
- Only download content the user is authorized to save and use.
