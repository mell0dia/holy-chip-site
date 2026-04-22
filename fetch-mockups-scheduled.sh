#!/bin/bash
# Scheduled mockup fetch — runs 1 hour after Printify product rebuild
# Started: 2026-03-06 ~12:10 PST → runs at ~13:10 PST

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SITE_DIR/mockup-fetch.log"

echo "⏳ Waiting 1 hour for Printify mockups to generate..." | tee "$LOG"
echo "Started at: $(date)" | tee -a "$LOG"
sleep 3600

echo "" | tee -a "$LOG"
echo "🔄 Starting mockup fetch at $(date)" | tee -a "$LOG"

cd "$SITE_DIR"

# Fetch t-shirt mockups
echo "👕 Fetching t-shirt mockups..." | tee -a "$LOG"
node fetch-tshirt-mockups.js 2>&1 | tee -a "$LOG"

# Fetch mug mockups
echo "" | tee -a "$LOG"
echo "☕ Fetching mug mockups..." | tee -a "$LOG"
node fetch-all-mug-angles.js 2>&1 | tee -a "$LOG"

# Commit and push new mockups
echo "" | tee -a "$LOG"
echo "📦 Committing mockups..." | tee -a "$LOG"
git add assets/mockups/ assets/mug-mockups/ 2>&1 | tee -a "$LOG"
git commit -m "Update mockups: transparent backgrounds + 8 new chips

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" 2>&1 | tee -a "$LOG"
git push origin gh-pages 2>&1 | tee -a "$LOG"

echo "" | tee -a "$LOG"
echo "✅ Done at $(date)" | tee -a "$LOG"
