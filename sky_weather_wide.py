"""Wide multi-panel layout for Sky Weather. Keep source pixel art unscaled."""
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

def _text(draw, xy, msg, fill, max_width):
    font = ImageFont.load_default()
    text = str(msg)
    while text and draw.textbbox((0, 0), text, font=font)[2] > max_width:
        text = text[:-1]
    if len(text) < len(str(msg)) and len(text) > 2:
        text = text[:-2] + ".."
    draw.text(xy, text, fill=fill, font=font)

def _fmt(value, suffix=""):
    try:
        return str(round(float(value))) + suffix
    except (ValueError, TypeError):
        return "--"

def compose_wide(frame, width, height, world, page):
    """A readable sidebar each side of the original 128x32 page.

    It renders directly at the configured physical matrix dimensions.
    If the extra space is too narrow, omit labels instead of overlapping.
    """
    width, height = int(width), int(height)
    frame = frame.convert("RGB")
    sky = frame.getpixel((0, max(0, min(8, frame.height - 1))))
    bg = tuple(max(0, int(c * 0.42)) for c in sky)
    out = Image.new("RGB", (width, height), bg)
    x0 = (width - frame.width) // 2
    y0 = (height - frame.height) // 2
    out.paste(frame, (x0, y0))
    draw = ImageDraw.Draw(out)
    left = x0 - 4
    right = x0 + frame.width + 4
    edge_pad = 4
    cur = world.get("cur") or {}
    forecasts = world.get("hourly") or []
    days = world.get("daily") or []
    text = (220, 231, 242)
    dim = (141, 172, 195)
    accent = (255, 210, 115)
    if left >= 58:
        _text(draw, (edge_pad, y0 + 2), "CURRENT", accent, left - 6)
        _text(draw, (edge_pad, y0 + 12), _fmt(cur.get("temp"), chr(176) + str(cur.get("unit", ""))), text, left - 6)
        if height >= 32:
            _text(draw, (edge_pad, y0 + 22), str(cur.get("cond", "weather")).replace("-", " "), dim, left - 6)
    if width - right >= 54:
        avail = width - right - edge_pad
        _text(draw, (right, y0 + 2), "FORECAST", accent, avail)
        if forecasts:
            first = forecasts[0]
            _text(draw, (right, y0 + 12), "Next " + _fmt(first.get("temp"), chr(176)), text, avail)
            _text(draw, (right, y0 + 22), "Rain " + _fmt(first.get("pop"), "%"), dim, avail)
        elif days:
            first = days[0]
            _text(draw, (right, y0 + 12), "Hi " + _fmt(first.get("temp"), chr(176)), text, avail)
            _text(draw, (right, y0 + 22), "Lo " + _fmt(first.get("low"), chr(176)), dim, avail)
    return out
