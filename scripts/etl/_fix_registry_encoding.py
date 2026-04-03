#!/usr/bin/env python3
"""Fix mojibake encoding in sbm-source-registry.json and save clean version."""

import json
from pathlib import Path

REG_PATH = Path("data/config/sbm-source-registry.json")

with open(REG_PATH, "rb") as f:
    raw = f.read()

# Fix double-encoded UTF-8 mojibake sequences
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xe2\x80\x9d", b" -- ")
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xe2\x80\x93", b" -- ")
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xe2\x80\x99", b"'")
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xe2\x80\x98", b"'")
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xe2\x80\x9c", b'"')
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xc2\xa2", b"->")
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac\xc2\xba", b"->")
raw = raw.replace(b"\xc3\xa2\xe2\x82\xac", b" -- ")

text = raw.decode("utf-8", errors="replace")
text = text.replace("\ufffd", "")
text = text.replace("\u201c", '"').replace("\u201d", '"')
text = text.replace("\u2018", "'").replace("\u2019", "'")
text = text.replace("\u2013", "-").replace("\u2014", "--")
text = text.replace("\u2192", "->")

try:
    data = json.loads(text)
    print(f"Parsed OK. States: {sorted(data.get('states', {}).keys())}")
    total = sum(len(s.get("issuers", [])) for s in data["states"].values())
    print(f"Total issuers: {total}")

    with open(REG_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("Saved clean version.")
except json.JSONDecodeError as e:
    print(f"Still failing: {e}")
    lines = text.split("\n")
    for i in range(max(0, e.lineno - 2), min(len(lines), e.lineno + 2)):
        print(f"  L{i+1}: {lines[i][:150]}")
