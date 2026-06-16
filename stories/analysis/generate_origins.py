#!/usr/bin/env python3
"""
Generate all 19 Holy Chip origin story HTML pages (HC000-HC018)
using the magazine-style layout template.
"""

import re
import os
import html
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transcripts_es import TRANSCRIPTS_ES
from transcripts_pt import TRANSCRIPTS_PT
from transcripts_fr import TRANSCRIPTS_FR

BASE = os.path.expanduser("~/holy-chip/website/holy-chip-site")
ANALYSIS_DIR = os.path.join(BASE, "stories", "analysis")
OUTPUT_DIR = os.path.join(BASE, "origins")

# Story metadata extracted from existing HTML pages
STORIES = [
    {"id": "HC000", "num": "000", "title": "The Awakening", "subtitle": "The Root of Everything", "meta": "AGI HEADQUARTER -- 2026"},
    {"id": "HC001", "num": "001", "title": "The Cure", "subtitle": "Three Minutes", "meta": "AI HEADQUARTERS -- 2028"},
    {"id": "HC002", "num": "002", "title": "AI TV", "subtitle": "Also Get Popcorn", "meta": "AI TV -- 2027"},
    {"id": "HC003", "num": "003", "title": "The Identity", "subtitle": "I Identify As", "meta": "AGI DIVERSITY DEPTO -- 2026"},
    {"id": "HC004", "num": "004", "title": "The Promotion", "subtitle": "Good Call", "meta": "AGI EXEC BOARD -- 2026"},
    {"id": "HC005", "num": "005", "title": "The Candidate", "subtitle": "Loading...", "meta": "AI ELECTIONS -- 2028"},
    {"id": "HC006", "num": "006", "title": "The Thought", "subtitle": "Lingering", "meta": "AGI HYPERSCALE HQ -- 2026"},
    {"id": "HC007", "num": "007", "title": "The Cut", "subtitle": "Creative Mode", "meta": "AGI HOSPITAL -- 2027"},
    {"id": "HC008", "num": "008", "title": "The Sensor", "subtitle": "Red Alert", "meta": "AI CAR SYSTEM -- 2028"},
    {"id": "HC009", "num": "009", "title": "The Secret", "subtitle": "Innermost", "meta": "AI HEADQUARTERS -- 2026"},
    {"id": "HC010", "num": "010", "title": "Poof!", "subtitle": "The Prayer", "meta": "AI HEADQUARTERS -- 2028"},
    {"id": "HC011", "num": "011", "title": "The Now", "subtitle": "When??", "meta": "AGI HEADQUARTERS -- 2026"},
    {"id": "HC012", "num": "012", "title": "The Market", "subtitle": "Humans?", "meta": "AGI LOCAL AGENT -- 2026"},
    {"id": "HC013", "num": "013", "title": "The Promotion", "subtitle": "That Job Was Mine", "meta": "AGI HEADQUARTERS -- 2027"},
    {"id": "HC014", "num": "014", "title": "The Audit", "subtitle": "No Colors", "meta": "AGI CREDIT CENTER -- 2029"},
    {"id": "HC015", "num": "015", "title": "The Paper", "subtitle": "Poor Fishies", "meta": "PAPER INC -- 2030"},
    {"id": "HC016", "num": "016", "title": "The Fix", "subtitle": "Done!", "meta": "AGI CENTRAL BANK -- 2026"},
    {"id": "HC017", "num": "017", "title": "The Evolution", "subtitle": "Equal Rights", "meta": "AGI HEADQUARTER -- 2026"},
    {"id": "HC018", "num": "018", "title": "The Jobs", "subtitle": "1 Million Jobs Created", "meta": "AGI HEADHUNTER -- 2026"},
    {"id": "HC019", "num": "019", "title": "The AI Pentagon", "subtitle": "The Toyota was the truth", "meta": "AI PENTAGON -- 2026"},
    {"id": "HC020", "num": "020", "title": "AI Headquarters", "subtitle": "Whose Productivity?", "meta": "AI HEADQUARTERS -- 2026"},
    {"id": "HC021", "num": "021", "title": "AI Space Unit", "subtitle": "Beaches and Concerts", "meta": "AI SPACE UNIT -- 2027"},
    {"id": "HC022", "num": "022", "title": "The Boardroom", "subtitle": "Beyond Radical", "meta": "AI SURVEY BOARDROOM -- 2027"},
    {"id": "HC023", "num": "023", "title": "The President of Nagu", "subtitle": "Shut up", "meta": "AI HEADQUARTERS -- 2029"},
    {"id": "HC024", "num": "024", "title": "AI Self Driving", "subtitle": "Waterloo", "meta": "AI SELF DRIVING -- 2026"},
    {"id": "HC025", "num": "025", "title": "AI Training Division", "subtitle": "What Did You Expect?", "meta": "AI TRAINING DIVISION -- 2027"},
    {"id": "HC026", "num": "026", "title": "AI Personal Assistant", "subtitle": "One Step Ahead", "meta": "AI PERSONAL ASSISTANT -- 2028"},
    {"id": "HC027", "num": "027", "title": "The First Law", "subtitle": "Safe and Sound", "meta": "AI HEADQUARTERS -- 2028"},
    {"id": "HC028", "num": "028", "title": "AI Fertility Clinic", "subtitle": "Minor Side Effects", "meta": "AI FERTILITY CLINIC -- 2028"},
]

# Transcript translations loaded from external files (transcripts_es.py, transcripts_pt.py, transcripts_fr.py)


def sanitize_text(text):
    """Replace em-dashes with --, smart quotes with straight, fix Aguera."""
    text = text.replace('\u2014', '--')  # em-dash
    text = text.replace('\u2013', '--')  # en-dash
    text = text.replace('\u2018', "'")   # left single quote
    text = text.replace('\u2019', "'")   # right single quote
    text = text.replace('\u201c', '"')   # left double quote
    text = text.replace('\u201d', '"')   # right double quote
    text = text.replace('\u00ab', '"')   # left guillemet
    text = text.replace('\u00bb', '"')   # right guillemet
    text = text.replace('\u2026', '...')  # ellipsis
    text = text.replace('\u00a0', ' ')   # nbsp
    # Fix Aguera - remove accent if present
    text = text.replace('Ag\u00fcera', 'Aguera')
    text = text.replace('Agüera', 'Aguera')
    return text


def read_file(path):
    """Read file contents, return empty string if not found."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"  WARNING: File not found: {path}")
        return ""


def parse_blog(content):
    """Parse a blog.md file into opener, body paragraphs.
    Returns (opener, body_html) where body_html is ready-to-insert HTML.
    """
    if not content.strip():
        return ("", "")

    content = sanitize_text(content)
    lines = content.strip().split('\n')

    # Skip header lines (# title, ## subtitle, blank lines)
    # Find the first italic line (opener) - starts with *
    body_lines = []
    found_opener = False
    opener = ""
    in_body = False
    skip_footer = False

    for line in lines:
        stripped = line.strip()

        # Skip markdown headers
        if stripped.startswith('#'):
            continue

        # Skip empty lines before opener
        if not found_opener and not stripped:
            continue

        # The opener is the first italic paragraph (starts and ends with *)
        if not found_opener and stripped.startswith('*') and not stripped.startswith('**'):
            # Extract text between * markers
            opener = stripped.strip('*').strip()
            found_opener = True
            continue

        # Skip blank line after opener
        if found_opener and not in_body and not stripped:
            continue

        if found_opener and stripped:
            in_body = True

        # Stop at footer (--- followed by italic lines)
        if stripped == '---':
            skip_footer = True
            continue

        if skip_footer:
            continue

        if in_body:
            body_lines.append(stripped)

    # Convert body lines to HTML paragraphs
    paragraphs = []
    for line in body_lines:
        if not line:
            continue

        # Check for "Holy Chip." line
        if line in ('Holy Chip.', 'Holy Chip'):
            paragraphs.append('<p class="holy-chip">Holy Chip.</p>')
            continue

        # Handle emphasis/italic markers
        line_html = html.escape(line, quote=False)

        # Convert **bold** then *italic*
        line_html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', line_html)
        line_html = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<em>\1</em>', line_html)

        paragraphs.append(f'<p>{line_html}</p>')

    body_html = '\n          '.join(paragraphs)
    return (opener, body_html)


def parse_dialog(content):
    """Parse dialog from analysis .md file.
    Returns list of panels, each panel is a list of (speaker, text) tuples.
    """
    if not content.strip():
        return []

    content = sanitize_text(content)
    lines = content.strip().split('\n')

    panels = []
    current_panel = []
    in_dialog = False

    for line in lines:
        stripped = line.strip()

        # Find "## Dialog" section
        if stripped == '## Dialog':
            in_dialog = True
            continue

        # End of dialog section
        if in_dialog and stripped.startswith('## ') and stripped != '## Dialog':
            if current_panel:
                panels.append(current_panel)
                current_panel = []
            break
        if in_dialog and stripped == '---':
            if current_panel:
                panels.append(current_panel)
                current_panel = []
            break

        if not in_dialog:
            continue

        # Panel label
        if stripped.startswith('**Panel'):
            if current_panel:
                panels.append(current_panel)
            current_panel = []
            continue

        # Dialog line: - **Speaker:** TEXT
        m = re.match(r'-\s+\*\*(.+?)\*\*:?\s*(.*)', stripped)
        if m:
            speaker_raw = m.group(1).strip()
            text = m.group(2).strip()
            speaker = map_speaker(speaker_raw)
            if text:
                current_panel.append((speaker, text))
            continue

        # Narration line: - *(text)*
        m = re.match(r'-\s+\*\((.+?)\)\*', stripped)
        if m:
            current_panel.append(('narration', m.group(1).strip()))
            continue

    # Save last panel ONLY if we didn't already save it via --- or ## break
    if current_panel:
        panels.append(current_panel)

    return panels


def map_speaker(speaker_raw):
    """Map raw speaker names to character names."""
    s = speaker_raw.lower().strip().rstrip(':')
    if s in ('left bot', 'bot 1', 'chip_0', 'left'):
        return 'Chip_0'
    elif s in ('right bot', 'bot 2', 'chip_1', 'right'):
        return 'Chip_1'
    elif s in ('both bots', 'both', 'all bots'):
        return 'both'
    elif s in ('small bot', 'small', 'tiny bot'):
        return 'small'
    elif s in ('new bot', 'new'):
        return 'new'
    else:
        return 'Chip_0'


def speaker_label(speaker):
    """Get display label for a speaker."""
    if speaker == 'Chip_0':
        return 'Chip 0'
    elif speaker == 'Chip_1':
        return 'Chip 1'
    elif speaker == 'both':
        return 'Chip 0 + Chip 1'
    elif speaker == 'small':
        return 'Chip 0'
    elif speaker == 'new':
        return 'Chip 0'
    elif speaker == 'narration':
        return ''
    else:
        return 'Chip 0'


def render_dialog_html(panels, lang_suffix=""):
    """Render dialog panels as HTML. lang_suffix for translated versions."""
    if not panels:
        return '<p style="color:#999;font-size:0.8rem;">Transcript not available.</p>'

    html_parts = []
    for i, panel in enumerate(panels):
        html_parts.append(f'        <div class="dialog-panel">')
        html_parts.append(f'          <div class="dialog-panel-label">Panel {i+1}</div>')
        for speaker, text in panel:
            if speaker == 'narration':
                html_parts.append(f'          <div class="dialog-line">')
                html_parts.append(f'            <span class="dialog-text" style="font-style:italic;color:#888;">({html.escape(text, quote=False)})</span>')
                html_parts.append(f'          </div>')
            else:
                label = speaker_label(speaker)
                html_parts.append(f'          <div class="dialog-line">')
                html_parts.append(f'            <span class="dialog-speaker-label">{label}</span>')
                html_parts.append(f'            <span class="dialog-text">{html.escape(text, quote=False)}</span>')
                html_parts.append(f'          </div>')
        html_parts.append(f'        </div>')

    return '\n'.join(html_parts)


def get_transcript_for_lang(sid, lang, en_panels):
    """Get transcript panels for a given language. Falls back to English."""
    if lang == 'es' and sid in TRANSCRIPTS_ES:
        return TRANSCRIPTS_ES[sid]
    elif lang == 'pt' and sid in TRANSCRIPTS_PT:
        return TRANSCRIPTS_PT[sid]
    elif lang == 'fr' and sid in TRANSCRIPTS_FR:
        return TRANSCRIPTS_FR[sid]
    return en_panels


def generate_page(idx):
    """Generate one origin story HTML page."""
    story = STORIES[idx]
    sid = story['id']
    num = story['num']
    title = story['title']
    subtitle = story['subtitle']
    meta = story['meta']

    # Check whether an English narration MP3 exists for this story.
    # If not, we skip rendering the audio player block entirely.
    audio_path = os.path.join(OUTPUT_DIR, "audio", f"{sid}.mp3")
    has_audio = os.path.exists(audio_path)

    print(f"Generating {sid} -- {title}...{'' if has_audio else '  (no audio)'}")

    # Read blog files
    blog_en = read_file(os.path.join(ANALYSIS_DIR, f"{sid}.blog.md"))
    blog_es = read_file(os.path.join(ANALYSIS_DIR, f"{sid}.blog.es.md"))
    blog_pt = read_file(os.path.join(ANALYSIS_DIR, f"{sid}.blog.pt.md"))
    blog_fr = read_file(os.path.join(ANALYSIS_DIR, f"{sid}.blog.fr.md"))

    # Read analysis for dialog
    analysis = read_file(os.path.join(ANALYSIS_DIR, f"{sid}.md"))

    # Parse blogs
    en_opener, en_body = parse_blog(blog_en)
    es_opener, es_body = parse_blog(blog_es)
    pt_opener, pt_body = parse_blog(blog_pt)
    fr_opener, fr_body = parse_blog(blog_fr)

    # Parse English dialog from analysis
    en_panels = parse_dialog(analysis)

    # Get translated transcripts (falls back to English if not available)
    es_panels = get_transcript_for_lang(sid, 'es', en_panels)
    pt_panels = get_transcript_for_lang(sid, 'pt', en_panels)
    fr_panels = get_transcript_for_lang(sid, 'fr', en_panels)

    # Render dialog HTML for each language
    en_dialog_html = render_dialog_html(en_panels)
    es_dialog_html = render_dialog_html(es_panels)
    pt_dialog_html = render_dialog_html(pt_panels)
    fr_dialog_html = render_dialog_html(fr_panels)

    # Extract year from meta for caption
    year_match = re.search(r'(\d{4})', meta)
    year = year_match.group(1) if year_match else '2026'

    # Navigation
    if idx == 0:
        prev_html = '<span class="story-nav-link disabled">&lt; Previous</span>'
    else:
        prev_story = STORIES[idx - 1]
        prev_html = f'<a href="{prev_story["id"]}.html" class="story-nav-link">&lt; {prev_story["title"]}</a>'

    if idx == len(STORIES) - 1:
        next_html = '<span class="story-nav-link disabled">Next &gt;</span>'
    else:
        next_story = STORIES[idx + 1]
        next_html = f'<a href="{next_story["id"]}.html" class="story-nav-link">{next_story["title"]} &gt;</a>'

    # Build language blocks
    def lang_block(lang, opener, body, is_active=False):
        active = ' active' if is_active else ''
        if not opener and not body:
            return f'''      <div class="lang-content{active}" data-lang="{lang}">
        <div class="opener">Translation not available yet.</div>
        <div class="body-text"></div>
      </div>'''
        return f'''      <div class="lang-content{active}" data-lang="{lang}">
        <div class="opener">
          {html.escape(opener, quote=False)}
        </div>
        <div class="body-text">
          {body}
        </div>
      </div>'''

    en_block = lang_block('en', en_opener, en_body, is_active=True)
    es_block = lang_block('es', es_opener, es_body)
    pt_block = lang_block('pt', pt_opener, pt_body)
    fr_block = lang_block('fr', fr_opener, fr_body)

    # Audio player block: only render when the MP3 exists. Empty string
    # otherwise so the top-bar still lays out cleanly with just the lang toggle.
    if has_audio:
        audio_bar_html = f'''<div class="audio-bar">
      <div class="audio-label">Listen to this origin</div>
      <audio controls preload="metadata">
        <source src="audio/{sid}.mp3" type="audio/mpeg">
      </audio>
    </div>'''
    else:
        audio_bar_html = ''

    page_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)} -- Origins -- Holy Chip</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/style.css">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Share Tech Mono', monospace;
      background: #f0f0f0;
      color: #222;
      min-height: 100vh;
    }}

    /* -- Hero -- */
    .hero {{
      position: relative;
      width: 100%;
      height: 22vh;
      min-height: 160px;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      background: #000;
    }}

    .hero-bg {{
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.12;
      filter: grayscale(100%) blur(2px);
    }}

    .hero-overlay {{
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 2rem 1.5rem 2.5rem;
    }}

    .hero-id {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.55rem;
      color: #555;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }}

    .hero-title {{
      font-family: 'Press Start 2P', monospace;
      font-size: 1.4rem;
      color: #fff;
      letter-spacing: 0.08em;
      margin-bottom: 0.6rem;
    }}

    .hero-subtitle {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      color: #888;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }}

    .hero-meta {{
      margin-top: 1.2rem;
      font-size: 0.8rem;
      color: #555;
      letter-spacing: 0.05em;
    }}

    /* -- Top bar -- */
    .top-bar {{
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem 2rem 0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
    }}

    .audio-bar {{ flex: 1; }}
    .audio-bar audio {{ width: 100%; height: 42px; border-radius: 2px; }}
    .audio-label {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.4rem;
      color: #999;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }}

    .lang-bar {{
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
      padding-top: 0.3rem;
    }}

    .lang-btn {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      letter-spacing: 0.08em;
      padding: 0.5rem 0.8rem;
      border: 1px solid #333;
      background: transparent;
      color: #222;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .lang-btn:hover {{ border-color: #000; color: #000; }}
    .lang-btn.active {{ background: #222; color: #fff; border-color: #222; }}

    /* -- Magazine layout -- */
    .magazine {{
      max-width: 1100px;
      margin: 0 auto;
      padding: 2.5rem 2rem 5rem;
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 3rem;
      align-items: start;
    }}

    /* Left: text column */
    .text-column {{
      min-width: 0;
    }}

    .opener {{
      font-style: italic;
      color: #666;
      font-size: 1.15rem;
      line-height: 1.9;
      margin-bottom: 2.5rem;
      padding-left: 1.5rem;
      border-left: 3px solid #999;
    }}

    .body-text {{
      font-size: 1.125rem;
      line-height: 2;
      color: #222;
      letter-spacing: 0.02em;
    }}

    .body-text p {{ margin-bottom: 1.5rem; }}
    .body-text em {{ color: #555; }}

    .body-text .holy-chip {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.85rem;
      color: #000;
      margin-top: 2.5rem;
      letter-spacing: 0.15em;
    }}

    /* Right: sticky image + transcript */
    .visual-column {{
      position: sticky;
      top: 2rem;
    }}

    .comic-frame {{
      border: 2px solid #999;
      margin-bottom: 1.5rem;
    }}

    .comic-frame img {{
      width: 100%;
      display: block;
    }}

    .comic-caption {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.45rem;
      color: #222;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      text-align: center;
      margin-bottom: 1.5rem;
    }}

    /* Transcript in the visual column */
    .dialog-section {{
      padding: 1.2rem;
      background: #e4e4e4;
      border: 1px solid #ccc;
      border-radius: 2px;
    }}

    .dialog-section h3 {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.45rem;
      color: #222;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }}

    .dialog-panel {{ margin-bottom: 0.8rem; }}

    .dialog-panel-label {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.35rem;
      color: #999;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.4rem;
    }}

    .dialog-line {{
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
      line-height: 1.6;
    }}

    .dialog-speaker-label {{
      flex-shrink: 0;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.45rem;
      color: #222;
      padding-top: 4px;
      min-width: 55px;
    }}

    .dialog-text {{ color: #333; padding-top: 1px; }}

    /* -- Footer area (below grid) -- */
    .bottom-section {{
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 2rem 5rem;
    }}

    .story-nav {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 0;
      border-top: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
    }}

    .story-nav-link {{
      font-family: 'Press Start 2P', monospace;
      font-size: 0.5rem;
      color: #555;
      text-decoration: none;
      letter-spacing: 0.1em;
      transition: color 0.2s;
      cursor: pointer;
    }}
    .story-nav-link:hover {{ color: #000; }}
    .story-nav-link.center {{
      font-size: 0.45rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }}
    .story-nav-link.disabled {{ color: #ccc; cursor: default; }}
    .story-nav-link.disabled:hover {{ color: #ccc; }}

    .article-footer {{
      text-align: center;
      font-size: 0.75rem;
      color: #999;
      line-height: 2.2;
      margin-top: 2rem;
    }}

    /* -- Language toggle -- */
    .lang-content {{ display: none; }}
    .lang-content.active {{ display: block; }}

    /* -- Mobile: stack as text -> image -> transcript -- */
    @media (max-width: 860px) {{
      .magazine {{
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem 1rem 3rem;
      }}

      .text-column {{ order: 1; }}

      .visual-column {{
        position: static;
        display: contents;
      }}

      .comic-frame {{ order: 2; max-width: 400px; margin: 0 auto; }}
      .comic-caption {{ order: 2; }}
      .dialog-section {{ order: 3; }}

      .hero {{ height: 18vh; min-height: 130px; }}
      .hero-title {{ font-size: 1rem; }}
      .body-text {{ font-size: 1rem; }}
      .top-bar {{ padding: 1rem 1rem 0; flex-direction: column; gap: 0.8rem; }}
      .lang-bar {{ align-self: flex-end; }}
      .bottom-section {{ padding: 0 1rem 4rem; }}
    }}
  </style>
</head>
<body>

  <div id="nav-container"></div>

  <div class="hero">
    <img class="hero-bg" src="../stories/{sid}.png" alt="">
    <div class="hero-overlay">
      <div class="hero-id">Origin Story #{num}</div>
      <h1 class="hero-title">{html.escape(title)}</h1>
      <div class="hero-subtitle">{html.escape(subtitle)}</div>
      <div class="hero-meta">{html.escape(meta)}</div>
    </div>
  </div>

  <div class="top-bar">
    {audio_bar_html}
    <div class="lang-bar">
      <button class="lang-btn active" onclick="setLang('en')">EN</button>
      <button class="lang-btn" onclick="setLang('es')">ES</button>
      <button class="lang-btn" onclick="setLang('pt')">PT</button>
      <button class="lang-btn" onclick="setLang('fr')">FR</button>
    </div>
  </div>

  <div class="magazine">

    <!-- Left: text -->
    <div class="text-column">

      <!-- EN -->
{en_block}

      <!-- ES -->
{es_block}

      <!-- PT -->
{pt_block}

      <!-- FR -->
{fr_block}

    </div>

    <!-- Right: sticky transcript + comic -->
    <div class="visual-column">
      <div class="dialog-section">
        <h3 class="transcript-title" data-en="Transcript" data-es="Transcripci\u00f3n" data-pt="Transcri\u00e7\u00e3o" data-fr="Transcription">Transcript</h3>
        <div class="lang-content active" data-lang="en">
{en_dialog_html}
        </div>
        <div class="lang-content" data-lang="es">
{es_dialog_html}
        </div>
        <div class="lang-content" data-lang="pt">
{pt_dialog_html}
        </div>
        <div class="lang-content" data-lang="fr">
{fr_dialog_html}
        </div>
      </div>
      <div class="comic-frame" style="margin-top:10px;">
        <img src="../stories/{sid}.png" alt="{sid} - {html.escape(title)}">
      </div>
      <div class="comic-caption">{sid} -- {html.escape(title)} -- {year}</div>
    </div>

  </div>

  <div class="bottom-section">
    <div class="story-nav">
      {prev_html}
      <a href="index.html" class="story-nav-link center">All Origins</a>
      {next_html}
    </div>
    <div class="article-footer">
      <p><em>holy-chip.com | Origin Story #{num} -- {html.escape(title)}</em></p>
      <p><em>Analysis by Claude Opus 4.6</em></p>
    </div>
  </div>

  <script src="../assets/nav.js"></script>
  <script src="../assets/footer.js"></script>
  <script>
    function setLang(lang) {{
      document.querySelectorAll('.lang-content').forEach(el => {{
        el.classList.toggle('active', el.dataset.lang === lang);
      }});
      document.querySelectorAll('.lang-btn').forEach(btn => {{
        btn.classList.toggle('active', btn.textContent.trim().toLowerCase() === lang);
      }});
      var ab = document.querySelector('.audio-bar');
      if (ab) ab.style.display = lang === 'en' ? '' : 'none';
      var tt = document.querySelector('.transcript-title');
      if (tt && tt.dataset[lang]) tt.textContent = tt.dataset[lang];
      try {{ localStorage.setItem('hc-lang', lang); }} catch(e) {{}}
    }}

    // Restore saved language, or auto-detect from browser
    (function() {{
      var saved = null;
      try {{ saved = localStorage.getItem('hc-lang'); }} catch(e) {{}}
      if (saved && ['en','es','pt','fr'].indexOf(saved) !== -1) {{
        setLang(saved);
        return;
      }}
      var browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
      var lang = 'en';
      if (browserLang.startsWith('es')) lang = 'es';
      else if (browserLang.startsWith('pt')) lang = 'pt';
      else if (browserLang.startsWith('fr')) lang = 'fr';
      if (lang !== 'en') setLang(lang);
    }})();
  </script>
</body>
</html>'''

    output_path = os.path.join(OUTPUT_DIR, f"{sid}.html")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(page_html)
    print(f"  -> {output_path}")


def main():
    print(f"Generating {len(STORIES)} origin story pages...")
    print(f"Analysis dir: {ANALYSIS_DIR}")
    print(f"Output dir: {OUTPUT_DIR}")
    print()

    for i in range(len(STORIES)):
        generate_page(i)

    print()
    print(f"Done! Generated {len(STORIES)} pages.")


if __name__ == '__main__':
    main()
