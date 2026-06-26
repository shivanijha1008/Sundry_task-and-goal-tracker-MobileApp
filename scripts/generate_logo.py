"""
One-shot logo generator for the app rename to "Sundry".
Uses Gemini Nano Banana (gemini-3.1-flash-image-preview) via Emergent LLM key.
Generates a single source image, then produces:
  - /app/frontend/public/logo.png          (main, 512x512)
  - /app/frontend/public/logo-mark.png     (icon only, 512x512 — same as logo for now)
  - /app/frontend/public/favicon-32.png    (32x32)
  - /app/frontend/public/favicon-16.png    (16x16)
  - /app/frontend/public/apple-touch-icon.png (180x180)
  - /app/frontend/public/og-image.png      (1200x630 — share preview)
"""

import asyncio
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

sys.path.insert(0, "/app/backend")
load_dotenv("/app/backend/.env")

from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402

PUBLIC = Path("/app/frontend/public")
SRC_PATH = Path("/tmp/sundry_source.png")

PROMPT = (
    "Minimalist app logo for a calm, offline-first daily planner app called 'Sundry'. "
    "The composition should be SQUARE (1:1) with a soft dark navy/plum background. "
    "Central icon: a small bundle of 5 abstract objects arranged in a gentle arc — "
    "a star, a tiny book, a film clapperboard, a pin/location marker, and a leaf — "
    "rendered as simple, modern, monochrome line-art icons in warm pink-orange gradient. "
    "Below the icon, the wordmark 'sundry' in lowercase, geometric sans-serif (medium weight), "
    "soft cream/off-white color, gently kerned. "
    "Overall feel: cozy, premium, gen-z indie. Subtle radial glow behind icon (magenta -> orange). "
    "No people, no photographic realism, no extra text, no shopping cart. "
    "Background: deep #1B0A2A to #15030F gradient. "
    "Style: flat with very light depth, like a modern iOS app icon."
)


async def generate_source():
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY missing from /app/backend/.env")

    chat = LlmChat(
        api_key=api_key,
        session_id="sundry-logo-gen-1",
        system_message="You are a senior product designer producing a single minimalist app logo.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
        modalities=["image", "text"]
    )

    msg = UserMessage(text=PROMPT)
    text, images = await chat.send_message_multimodal_response(msg)

    if not images:
        print(f"[ERR] No images returned. text='{(text or '')[:200]}'")
        raise RuntimeError("Logo generation returned no images")

    img = images[0]
    img_bytes = base64.b64decode(img["data"])
    SRC_PATH.write_bytes(img_bytes)
    print(f"[OK] Source logo saved ({len(img_bytes)} bytes) -> {SRC_PATH}")
    return SRC_PATH


def derive_assets(src_path: Path):
    PUBLIC.mkdir(parents=True, exist_ok=True)
    base = Image.open(src_path).convert("RGBA")

    # Crop to square (center crop) if not already
    w, h = base.size
    if w != h:
        s = min(w, h)
        left = (w - s) // 2
        top = (h - s) // 2
        base = base.crop((left, top, left + s, top + s))

    # Save main logo (512)
    logo_512 = base.resize((512, 512), Image.LANCZOS)
    logo_512.save(PUBLIC / "logo.png", format="PNG", optimize=True)
    logo_512.save(PUBLIC / "logo-mark.png", format="PNG", optimize=True)

    # Favicons
    base.resize((32, 32), Image.LANCZOS).save(PUBLIC / "favicon-32.png", format="PNG", optimize=True)
    base.resize((16, 16), Image.LANCZOS).save(PUBLIC / "favicon-16.png", format="PNG", optimize=True)

    # Apple touch icon
    base.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png", format="PNG", optimize=True)

    # OG share image (1200x630) — center logo on 1200x630 with dark background
    og = Image.new("RGBA", (1200, 630), (27, 10, 42, 255))
    og_logo = base.resize((420, 420), Image.LANCZOS)
    og.paste(og_logo, ((1200 - 420) // 2, (630 - 420) // 2), og_logo)
    og.convert("RGB").save(PUBLIC / "og-image.png", format="PNG", optimize=True)

    # Multi-resolution .ico (16, 32, 48)
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    base.save(PUBLIC / "favicon.ico", format="ICO", sizes=ico_sizes)

    print(f"[OK] Generated assets in {PUBLIC}:")
    for p in sorted(PUBLIC.glob("*.png")) + [PUBLIC / "favicon.ico"]:
        if p.exists():
            print(f"   - {p.name}  ({p.stat().st_size} bytes)")


async def main():
    src = await generate_source()
    derive_assets(src)


if __name__ == "__main__":
    asyncio.run(main())
