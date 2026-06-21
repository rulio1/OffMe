#!/usr/bin/env python3
"""Generate OffMe app icons for iOS and web from a source image."""

from __future__ import annotations

import argparse
import json
import struct
import zlib
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    Image = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "assets" / "brand" / "logo-source.jpg"
IOS_ICON_DIR = ROOT / "mobile-ios" / "OffMe" / "Assets.xcassets" / "AppIcon.appiconset"
IOS_LOGO_DIR = ROOT / "mobile-ios" / "OffMe" / "Assets.xcassets" / "Logo.imageset"
WEB_PUBLIC = ROOT / "frontend-web" / "public"

ACCENT = (29, 155, 240)
ACCENT_DARK = (26, 140, 216)
WHITE = (255, 255, 255)

IOS_SIZES = [
    ("icon-20@2x.png", 40, "20x20", "iphone", "2x"),
    ("icon-20@3x.png", 60, "20x20", "iphone", "3x"),
    ("icon-29@2x.png", 58, "29x29", "iphone", "2x"),
    ("icon-29@3x.png", 87, "29x29", "iphone", "3x"),
    ("icon-40@2x.png", 80, "40x40", "iphone", "2x"),
    ("icon-40@3x.png", 120, "40x40", "iphone", "3x"),
    ("icon-60@2x.png", 120, "60x60", "iphone", "2x"),
    ("icon-60@3x.png", 180, "60x60", "iphone", "3x"),
    ("AppIcon-1024.png", 1024, "1024x1024", "ios-marketing", "1x"),
]


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def blend(bg: tuple[int, int, int], fg: tuple[int, int, int], alpha: float) -> tuple[int, int, int]:
    return (
        lerp(bg[0], fg[0], alpha),
        lerp(bg[1], fg[1], alpha),
        lerp(bg[2], fg[2], alpha),
    )


def draw_icon_pillow(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size))
    px = img.load()
    cx = cy = (size - 1) / 2
    radius = size * 0.72

    for y in range(size):
        for x in range(size):
            dx = x - cx
            dy = y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            t = min(dist / radius, 1.0)
            color = blend(ACCENT, ACCENT_DARK, t * 0.35)
            px[x, y] = color

    draw = ImageDraw.Draw(img)

    # "O" ring
    ox = cx - size * 0.11
    outer = size * 0.24
    inner = size * 0.145
    draw.ellipse(
        (ox - outer, cy - outer, ox + outer, cy + outer),
        fill=WHITE,
    )
    draw.ellipse(
        (ox - inner, cy - inner, ox + inner, cy + inner),
        fill=ACCENT,
    )

    # "M"
    bar_w = max(2, int(size * 0.075))
    left = int(cx + size * 0.02)
    top = int(cy - size * 0.19)
    bottom = int(cy + size * 0.19)
    mid_y = int(cy - size * 0.02)
    right = left + int(size * 0.13)

    draw.rectangle((left, top, left + bar_w, bottom), fill=WHITE)
    draw.rectangle((right, top, right + bar_w, bottom), fill=WHITE)

    steps = max(4, int(size * 0.22))
    for i in range(steps):
        t = i / max(steps - 1, 1)
        x = left + bar_w + int(t * size * 0.055)
        y_top = top + int(t * (mid_y - top))
        y_bottom = bottom - int(t * (bottom - mid_y))
        draw.rectangle((x, y_top, x + bar_w, y_top + bar_w), fill=WHITE)
        draw.rectangle((x, y_bottom - bar_w, x + bar_w, y_bottom), fill=WHITE)

    return img


def _png_chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def write_png_rgb(path: Path, img: Image.Image) -> None:
    if img.mode != "RGB":
        img = img.convert("RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)


def center_crop_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def load_master(source: Path) -> Image.Image:
    if not source.exists():
        raise FileNotFoundError(f"Source image not found: {source}")
    img = Image.open(source)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA")
    if img.mode == "RGBA":
        background = Image.new("RGB", img.size, WHITE)
        background.paste(img, mask=img.split()[3])
        img = background
    return center_crop_square(img)


def write_contents_json(path: Path, entries: list[dict]) -> None:
    payload = {
        "images": entries,
        "info": {"author": "xcode", "version": 1},
    }
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_ico(path: Path, frames: list[tuple[int, bytes]]) -> None:
    offset = 6 + 16 * len(frames)
    parts = [struct.pack("<HHH", 0, 1, len(frames))]
    for size, data in frames:
        parts.append(
            struct.pack(
                "<BBBBHHII",
                size if size < 256 else 0,
                size if size < 256 else 0,
                0,
                0,
                1,
                32,
                len(data),
                offset,
            )
        )
        offset += len(data)
    for _, data in frames:
        parts.append(data)
    path.write_bytes(b"".join(parts))


def write_logo_imageset(master: Image.Image) -> None:
    logo_sizes = {
        "logo.png": 256,
        "logo@2x.png": 512,
        "logo@3x.png": 768,
    }
    IOS_LOGO_DIR.mkdir(parents=True, exist_ok=True)
    entries: list[dict] = []
    for filename, px in logo_sizes.items():
        icon = master.resize((px, px), Image.Resampling.LANCZOS)
        write_png_rgb(IOS_LOGO_DIR / filename, icon)
        scale = filename.replace("logo", "").replace(".png", "") or "1x"
        if scale == "":
            scale = "1x"
        entries.append(
            {
                "filename": filename,
                "idiom": "universal",
                "scale": scale if "@" in filename else "1x",
            }
        )

    contents = {
        "images": [
            {"filename": "logo.png", "idiom": "universal", "scale": "1x"},
            {"filename": "logo@2x.png", "idiom": "universal", "scale": "2x"},
            {"filename": "logo@3x.png", "idiom": "universal", "scale": "3x"},
        ],
        "info": {"author": "xcode", "version": 1},
    }
    (IOS_LOGO_DIR / "Contents.json").write_text(
        json.dumps(contents, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    if Image is None:
        raise SystemExit("Instale Pillow: pip3 install pillow")

    parser = argparse.ArgumentParser(description="Generate OffMe icons from a source image")
    parser.add_argument(
        "--source",
        type=Path,
        default=DEFAULT_SOURCE,
        help=f"Source image (default: {DEFAULT_SOURCE})",
    )
    args = parser.parse_args()

    master = load_master(args.source)
    contents_entries: list[dict] = []

    for filename, px, size_label, idiom, scale in IOS_SIZES:
        icon = master.resize((px, px), Image.Resampling.LANCZOS)
        out = IOS_ICON_DIR / filename
        write_png_rgb(out, icon)
        entry = {
            "filename": filename,
            "idiom": idiom,
            "scale": scale,
            "size": size_label,
        }
        if idiom == "ios-marketing":
            entry.pop("scale", None)
        contents_entries.append(entry)

    write_contents_json(IOS_ICON_DIR / "Contents.json", contents_entries)
    write_logo_imageset(master)

    web_sizes = {
        "logo.png": 512,
        "icon-512.png": 512,
        "icon-192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-32.png": 32,
        "favicon-16.png": 16,
    }
    WEB_PUBLIC.mkdir(parents=True, exist_ok=True)
    ico_frames: list[tuple[int, bytes]] = []
    for name, px in web_sizes.items():
        icon = master.resize((px, px), Image.Resampling.LANCZOS)
        out = WEB_PUBLIC / name
        write_png_rgb(out, icon)
        if px in (16, 32):
            ico_frames.append((px, out.read_bytes()))

    write_ico(WEB_PUBLIC / "favicon.ico", ico_frames)

    print("Generated icons:")
    print(f"  Source: {args.source}")
    print(f"  iOS: {IOS_ICON_DIR} ({len(IOS_SIZES)} sizes)")
    print(f"  iOS logo: {IOS_LOGO_DIR}")
    print(f"  Web: {WEB_PUBLIC}")


if __name__ == "__main__":
    main()