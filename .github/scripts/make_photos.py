"""写真の一覧(photos.js)と、軽い表示用の写真(サムネイル・閲覧用)を作ります。
GitHub 上で自動実行されます。手で実行する必要はありません。

  images/○○/写真.jpg        ← 元の写真(アップロードしたまま)
  images/○○/thumb/写真.jpg   ← 一覧・流れる表紙用の小さい写真(長辺 800px)
  images/○○/view/写真.jpg    ← 1枚ずつ見る・保存する用(長辺 2000px)

作った写真は位置情報などの撮影データを含みません。
"""
import json
import re
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # Pillow が無い環境でも、一覧(photos.js)だけは作る
    Image = None

ROOT = Path(__file__).resolve().parents[2]
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
VARIANTS = {"thumb": (800, 80), "view": (2000, 85)}   # 長辺(px), 画質


def natural_key(name):
    # IMG_2.jpg が IMG_10.jpg より前に来るように並べる
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def make_variant(src, dst, size, quality):
    """src を縮小して dst(JPEG)に保存する。すでにあれば何もしない。"""
    if dst.exists():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        if im.format == "JPEG":
            im.draft("RGB", (size, size))          # 大きな写真でも速く読めるようにする
        im = ImageOps.exif_transpose(im)           # スマホ写真の向きをそろえる
        if im.mode in ("RGBA", "LA", "P"):
            im = im.convert("RGBA")
            bg = Image.new("RGB", im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        elif im.mode != "RGB":
            im = im.convert("RGB")
        im.thumbnail((size, size), Image.LANCZOS)  # 小さい写真は拡大しない
        im.save(dst, "JPEG", quality=quality, optimize=True, progressive=True)
    return True


def main():
    cfg = (ROOT / "config.js").read_text(encoding="utf-8")
    folders = list(dict.fromkeys(re.findall(r'folder:\s*"([^"]+)"', cfg)))
    result = {}
    made = 0
    for folder in folders:
        d = ROOT / folder
        names = []
        if d.is_dir():
            names = sorted(
                (p.name for p in d.iterdir() if p.is_file() and p.suffix.lower() in EXTS),
                key=natural_key,
            )
        result[folder] = [f"{folder}/{n}" for n in names]
        if Image is None or not d.is_dir():
            continue
        stems = {Path(n).stem for n in names}
        for kind, (size, quality) in VARIANTS.items():
            for n in names:
                try:
                    if make_variant(d / n, d / kind / (Path(n).stem + ".jpg"), size, quality):
                        made += 1
                except Exception as e:   # 壊れた写真などは飛ばす(元の写真がそのまま使われる)
                    print(f"  ! {folder}/{n}: {kind} を作れませんでした ({e})")
            vd = d / kind
            if vd.is_dir():               # 元の写真を消したときは、縮小版も消す
                for f in vd.iterdir():
                    if f.is_file() and f.stem not in stems:
                        f.unlink()
                        print(f"  - {folder}/{kind}/{f.name} を削除")
    body = json.dumps(result, ensure_ascii=False, indent=2)
    out = "/* 自動で作られるファイルです(手で書き換えないでください) */\nconst PHOTOS = " + body + ";\n"
    (ROOT / "photos.js").write_text(out, encoding="utf-8", newline="\n")
    for k, v in result.items():
        print(f"{k}: {len(v)}枚")
    print(f"縮小した写真を {made} 枚作りました")


if __name__ == "__main__":
    main()
