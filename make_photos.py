"""config.js に書かれたギャラリーのフォルダを調べて、写真の一覧(photos.js)を作ります。
GitHub 上で自動実行されます。手で書き換える必要はありません。"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def natural_key(name):
    # IMG_2.jpg が IMG_10.jpg より前に来るように並べる
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def main():
    cfg = (ROOT / "config.js").read_text(encoding="utf-8")
    folders = re.findall(r'folder:\s*"([^"]+)"', cfg)
    result = {}
    for folder in folders:
        d = ROOT / folder
        files = []
        if d.is_dir():
            files = sorted(
                (p.name for p in d.iterdir() if p.is_file() and p.suffix.lower() in EXTS),
                key=natural_key,
            )
        result[folder] = [f"{folder}/{n}" for n in files]
    body = json.dumps(result, ensure_ascii=False, indent=2)
    out = "/* 自動で作られるファイルです(手で書き換えないでください) */\nconst PHOTOS = " + body + ";\n"
    (ROOT / "photos.js").write_text(out, encoding="utf-8", newline="\n")
    for k, v in result.items():
        print(f"{k}: {len(v)}枚")


if __name__ == "__main__":
    main()
