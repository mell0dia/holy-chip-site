#!/bin/bash
# Deploy holy-chip-site and refresh browser tab if open
# Usage: ./deploy.sh "commit message"

REPO_DIR="/Users/rm/.openclaw/workspace/holy-chip-site"
SITE_URL="mell0dia.github.io/holy-chip-site"
MSG="${1:-Update holy-chip-site}"

cd "$REPO_DIR" || exit 1

# Stage, commit, push
git add .
git commit -m "$MSG" || { echo "Nothing to commit"; }
git push origin main || { echo "Push failed — check credentials"; exit 1; }

echo "✅ Pushed to GitHub"
echo "⏳ Waiting 5s for GitHub Pages to rebuild..."
sleep 5

# Refresh browser tab via AppleScript (works on macOS)
osascript -e '
tell application "Google Chrome"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "'"$SITE_URL"'" then
        tell t to reload
        return "Refreshed"
      end if
    end repeat
  end repeat
end tell
' 2>/dev/null && echo "🔄 Chrome tab refreshed" || \
osascript -e '
tell application "Safari"
  repeat with w in windows
    repeat with t in tabs of w
      if URL of t contains "'"$SITE_URL"'" then
        set URL of t to URL of t
        return "Refreshed"
      end if
    end repeat
  end repeat
end tell
' 2>/dev/null && echo "🔄 Safari tab refreshed" || \
echo "ℹ️  No browser tab found with $SITE_URL"
