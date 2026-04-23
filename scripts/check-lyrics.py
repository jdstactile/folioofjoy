#!/usr/bin/env python3
"""Probe lyrics.ovh for each iTunes ID using the same title-variant logic
as lib/music.ts::lyricsTitleVariants. Emits: ID\tSTATUS\tTITLE — ARTIST"""
import json, re, sys, time, urllib.parse, urllib.request

IDS = sys.argv[1].split(',')

def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', errors='replace')

def title_variants(title: str):
    seen, out = set(), []
    def add(s):
        t = s.strip()
        if t and t not in seen:
            seen.add(t); out.append(t)
    add(title)
    no_parens = re.sub(r'\s*[\(\[][^\)\]]*[\)\]]', '', title).strip()
    add(no_parens)
    add(re.split(r'\s+[-–]\s+', no_parens)[0])
    collapsed = re.sub(r'\b(?:[A-Za-z]\.){2,}[A-Za-z]?\b',
                       lambda m: m.group(0).replace('.', ''), no_parens)
    add(collapsed)
    add(re.sub(r'[!?.…]+$', '', no_parens))
    return out

# Batch iTunes lookup
lookup_url = f"https://itunes.apple.com/lookup?id={','.join(IDS)}&entity=song"
raw = fetch(lookup_url, timeout=30)
data = json.loads(raw)
meta = {str(r['trackId']): r for r in data.get('results', []) if r.get('wrapperType') == 'track'}

def probe(artist, title):
    url = f"https://api.lyrics.ovh/v1/{urllib.parse.quote(artist)}/{urllib.parse.quote(title)}"
    for _ in range(2):
        try:
            j = json.loads(fetch(url, timeout=15))
            lyr = (j.get('lyrics') or '').strip()
            return len(lyr) > 30
        except Exception:
            time.sleep(0.6)
    return False

for tid in IDS:
    r = meta.get(tid)
    if not r:
        print(f"{tid}\tMISSING\t(no iTunes metadata)"); sys.stdout.flush(); continue
    title = r.get('trackName', '')
    artist = r.get('artistName', '')
    ok = any(probe(artist, v) for v in title_variants(title))
    status = 'OK' if ok else 'NO_LYRICS'
    print(f"{tid}\t{status}\t{title} — {artist}"); sys.stdout.flush()
