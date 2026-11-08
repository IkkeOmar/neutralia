#!/usr/bin/env python3
"""Render the NEUTRALIA markdown design docs to styled HTML for GitHub Pages.

Pure stdlib + python-markdown. Reads docs/*.md, writes docs/<name>.html.
Tables, fenced code, task lists and the `[verified]` marker get special handling.
"""
import html
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = ROOT / "docs"

CSS = """
:root{--bg:#0b0d17;--panel:rgba(255,255,255,.045);--line:rgba(255,255,255,.10);
--purple:#7c5cfc;--cyan:#38bdf8;--gold:#f0b429;--green:#34d399;--txt:#e8eaf2;--dim:#8b90a8}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 800px at 20% -10%,#1a1640 0%,transparent 60%),
radial-gradient(900px 700px at 100% 0%,#0d2b45 0%,transparent 55%),var(--bg);
color:var(--txt);font:15px/1.68 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
padding:38px 20px 80px}
.wrap{max-width:920px;margin:0 auto}
h1{font-size:30px;margin:0 0 22px;letter-spacing:.06em;color:var(--txt)}
h1 span{color:var(--purple)}
h2{font-size:19px;margin:38px 0 12px;padding-top:20px;border-top:1px solid var(--line);color:var(--cyan)}
h3{font-size:15.5px;margin:26px 0 9px;color:var(--purple)}
h4{font-size:14px;margin:20px 0 7px;color:var(--gold)}
p{margin:0 0 13px}
a{color:var(--cyan)}
code{background:rgba(124,92,252,.16);padding:1px 6px;border-radius:5px;font-size:12.5px;
font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#c3b5ff}
pre{background:rgba(0,0,0,.34);border:1px solid var(--line);border-radius:11px;padding:15px;
overflow-x:auto;margin:0 0 16px}
pre code{background:none;padding:0;color:#d5d8e8;font-size:12.5px;line-height:1.55}
table{border-collapse:collapse;width:100%;margin:0 0 18px;font-size:13px}
th,td{border-bottom:1px solid rgba(255,255,255,.07);padding:8px 10px;text-align:left;vertical-align:top}
th{color:var(--dim);font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}
tr:hover td{background:rgba(255,255,255,.028)}
blockquote{border-left:3px solid var(--purple);margin:0 0 15px;padding:2px 0 2px 14px;
color:var(--dim);font-style:italic}
blockquote p{margin:0 0 6px}
hr{border:0;border-top:1px solid var(--line);margin:30px 0}
ul,ol{margin:0 0 14px;padding-left:24px}
li{margin-bottom:5px}
strong{color:#fff}
.back{display:inline-block;margin-bottom:22px;color:var(--dim);text-decoration:none;font-size:13px;
padding:6px 12px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.04)}
.back:hover{border-color:var(--purple);color:var(--txt)}
.verified{color:var(--green);font-size:11px;font-weight:600}
footer{margin-top:44px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:12px}
"""

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>{css}</style>
</head>
<body>
<div class="wrap">
<a class="back" href="../index.html">&larr; NEUTRALIA — design index</a>
{body}
<footer>NEUTRALIA — Battlefield Heroes MMO design. Rendered from <code>{src}</code>.</footer>
</div>
</body>
</html>
"""


def render(md_text: str, src_name: str) -> str:
    md = markdown.Markdown(
        extensions=["tables", "fenced_code", "sane_lists", "attr_list"],
        output_format="html",
    )
    body = md.convert(md_text)
    # highlight the [verified] marker the docs use as a citation tag
    body = re.sub(r"\[verified\]", '<span class="verified">[verified]</span>', body)
    title = src_name.replace(".md", "")
    return TEMPLATE.format(title=html.escape(title), css=CSS, body=body, src=html.escape(src_name))


def main() -> int:
    if not DOCS.exists():
        print(f"no docs dir at {DOCS}", file=sys.stderr)
        return 1
    n = 0
    for md_path in sorted(DOCS.glob("*.md")):
        out = DOCS / (md_path.stem + ".html")
        out.write_text(render(md_path.read_text(), md_path.name), encoding="utf-8")
        print(f"  {md_path.name} -> {out.name} ({out.stat().st_size//1024} KB)")
        n += 1
    print(f"{n} documents rendered")
    return 0


if __name__ == "__main__":
    sys.exit(main())
