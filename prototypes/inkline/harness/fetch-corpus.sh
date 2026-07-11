#!/usr/bin/env bash
# Fetch the public-domain corpus images listed in manifest.json.
#
# NOTE: this could not be run in the original build environment - its network
# policy blocked wikimedia.org / loc.gov / wikisource.org / archive.org
# (only package registries were reachable). Run this on a machine with normal
# internet access.
#
# After fetching:
#   1. Open each entry's source_page / transcription_source URL.
#   2. Verify (or create) the corresponding ground-truth .txt so that it covers
#      EXACTLY the text visible in the downloaded image (trim multi-page
#      transcriptions to the fetched page). The .txt files shipped in this repo
#      are excerpts of the published transcriptions and MUST be checked against
#      the actual downloaded image before trusting CER numbers.
#   3. Set "ground_truth_included": true in manifest.json for verified entries.
set -uo pipefail
cd "$(dirname "$0")/corpus"

UA="InkLinePrototype/0.1 (accuracy-harness; public-domain corpus fetch)"
fail=0
count=0

while IFS=$'\t' read -r image url; do
  [ -z "$image" ] && continue
  if [ -s "$image" ]; then
    echo "SKIP  $image (already present)"
    continue
  fi
  echo "GET   $image  <-  $url"
  if curl -fsSL --retry 2 -A "$UA" -o "$image" "$url"; then
    count=$((count + 1))
  else
    echo "FAIL  $image"
    rm -f "$image"
    fail=$((fail + 1))
  fi
done < <(node -e '
  const m = require("./manifest.json");
  for (const d of m.documents) process.stdout.write(d.image + "\t" + d.image_url + "\n");
')

echo
echo "Downloaded: $count, failed: $fail"
echo "Now verify ground-truth .txt files against the downloaded images (see header)."
exit 0
