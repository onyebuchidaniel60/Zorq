#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."

# 1. Narration. The hard spec prefers a free Google AI Studio voice; this
#    environment has no Google credential, so the reproducible free male
#    Edge neural voice is used and L-010 records the exception.
edge-tts --voice en-US-BrianNeural --rate=-4% \
  --file docs/demo/narration.md --write-media docs/demo/narration.mp3

# 2. Real UI capture (headful xvfb clears the Vercel edge checkpoint).
xvfb-run -a node scripts/demo-video/capture.mjs

# 3. End card with public evidence.
node scripts/demo-video/endcard.mjs

# 4. Assemble. Trim the challenge/startup preamble, append the evidence card,
#    then mux narration; -shortest keeps the track inside 3:00.
cd docs/demo/raw
ffmpeg -y -ss 5 -i capture.webm -vf "scale=1280:720,fps=30" -an \
  -c:v libx264 -pix_fmt yuv420p part1.mp4
ffmpeg -y -loop 1 -i endcard.png -t 42 -vf "scale=1280:720,fps=30" \
  -c:v libx264 -pix_fmt yuv420p part2.mp4
printf "file 'part1.mp4'\nfile 'part2.mp4'\n" > concat.txt
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy silent.mp4
ffmpeg -y -i silent.mp4 -i ../narration.mp3 -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart ../zorq-demo.mp4
cd ../..
ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 docs/demo/zorq-demo.mp4
