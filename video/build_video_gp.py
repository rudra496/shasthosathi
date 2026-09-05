#!/usr/bin/env python3
"""GP FutureMakers Round-1 video: 2-minute Bangla pitch (MP4, H.264, <=300MB).
Frames = live app screenshots; narration = edge-tts bn-BD; captions = Bangla (Nirmala UI)."""
import asyncio, os, json
from PIL import Image, ImageDraw, ImageFont
import edge_tts
import imageio_ffmpeg
import imageio.v3 as iio

ROOT = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(ROOT, "frames")
OUT = os.path.join(ROOT, "ShasthoSathi_GP_Video.mp4")
W, H = 1280, 720
VOICE = "bn-BD-NabanitaNeural"

FONT_PATHS = ["C:/Windows/Fonts/Nirmala.ttf", "C:/Windows/Fonts/NirmalaB.ttf",
              "C:/Windows/Fonts/nirmala.ttf"]
def font(sz, bold=False):
    p = FONT_PATHS[1] if bold else FONT_PATHS[0]
    for path in ([p] + FONT_PATHS):
        if os.path.exists(path):
            return ImageFont.truetype(path, sz)
    return ImageFont.load_default()

# (frame, narration, caption)  — story: hook → who → solution → demo → sms → data → AI → impact
SEGMENTS = [
    ("07-dash-kpis",
     "দুই হাজার তেইশ সালে বাংলাদেশে ডেঙ্গুতে আক্রান্ত হন তিন লক্ষ একুশ হাজারের বেশি মানুষ, মারা যান এক হাজার সাতশো পাঁচজন। আর চলতি বছরও সংখ্যাটা বাড়ছে।",
     "২০২৩: ৩,২১,১৭৯ কেস · ১,৭০৫ মৃত্যু · ২০২৬ (৫ সেপ্টে): ৪১,০৩২ · ১১৩"),
    ("02-triage",
     "সবচেয়ে বেশি ক্ষতিগ্রস্ত সাধারণ মানুষ, আর তাদের প্রথম সেবাদাতা কমিউনিটি স্বাস্থ্যকর্মীরা। কিন্তু তাদের হাতে নেই কোনো এআই সহায়তা, নেই নির্ভরযোগ্য ইন্টারনেট।",
     "প্রথম সেবাদাতা = স্বাস্থ্যকর্মী · কোনো এআই নেই · ইন্টারনেট নেই"),
    ("01-home",
     "সমাধান হলো স্বাস্থ্যসাথী — স্বাস্থ্যকর্মীদের জন্য অফলাইন এআই সঙ্গী। ইন্টারনেট ছাড়াই সাধারণ ফোনে চলে।",
     "স্বাস্থ্যসাথী — অফলাইন এআই স্বাস্থ্যসঙ্গী"),
    ("03-result",
     "স্বাস্থ্যকর্মী বাংলায় উপসর্গ জানালে ডব্লিউ এইচ ও-র নিয়মের ভিত্তিতে অ্যাপ বলে দেয় — ঘরে থাকবেন, আজই হাসপাতালে যাবেন, নাকি এটা জরুরি। সঙ্গে দেখায় সিদ্ধান্তের কারণও।",
     "ব্যাখ্যাযোগ্য ট্রায়াজ — কারণসহ · WHO ২০০৯ নিয়ম"),
    ("04-sms",
     "ফিচার ফোনেও চলে। এসএমএস-এ কোড পাঠালে একই ইঞ্জিন উত্তর দেয় — নেটওয়ার্ক ছাড়া সম্ভব নয় এমন কিছু নেই।",
     "SMS মোড — ফিচার ফোনেও একই ইঞ্জিন"),
    ("08-dash-2026",
     "সুপারভাইজার ড্যাশবোর্ডে সরকারের সরাসরি ডেটা — দুই হাজার তেইশ থেকে আজ পর্যন্ত, মাসভিত্তিক তুলনা, আর জলবায়ু-ভিত্তিক পূর্বাভাস — যা বাস্তব দুই হাজার ছাব্বিশের ডেটায় যাচাই করা।",
     "লাইভ ডেটা ২০২৩→২০২৬ · মডেল বনাম বাস্তব"),
    ("09-dash-map",
     "বিভাগভিত্তিক বাস্তব ম্যাপ বলে দেয় কোথে সবচেয়ে বেশি ঝুঁকি — সম্পদ পাঠানোর সঠিক ক্রম ঠিক করতে।",
     "বাস্তব বিভাগ-ম্যাপ → সম্পদ বরাদ্দ"),
    ("06-maternal",
     "মা ও শিশুর যত্ন, টিকার সূচি, ওষুধ পড়ে শোনানো — সব একই অ্যাপে, সবই অফলাইনে।",
     "মা-শিশু সূচি · ওষুধ পাঠ · সব অফলাইন"),
    ("05-camp",
     "এখানে এআই-এর ভূমিকা স্পষ্ট — ব্যাখ্যাযোগ্য সিদ্ধান্ত সহায়তা, বাংলা বক্তৃতা শনাক্তকরণ, ওসিআর, আর মেশিন-লার্নিং পূর্বাভাস। এআই চিকিৎসক নয় — পাশের সহকারী, সীমাবদ্ধতা স্বীকার করে।",
     "এআই = সহকারী, চিকিৎসক নয় · সীমাবদ্ধতা ঘোষিত"),
    ("01-home",
     "ইতিমধ্যেই চালু, ব্রাউজারে ব্যবহারযোগ্য, আন্তর্জাতিক গবেষণায় ভিত্তি করে। স্বাস্থ্যসাথী — প্রতিটি স্বাস্থ্যকর্মীর হাতে।",
     "শুরু হয়ে গেছে · ৬৪টি যাচাইকৃত গবেষণার ভিত্তিতে · rudra496.github.io/shasthosathi"),
]

def compose(frame, caption, idx):
    """1280x720 slide: app screenshot fit + Chrome-rendered Bangla caption strip.
    (PIL lacks libraqm -> Bengali shaping breaks; Chrome renders it correctly.)"""
    img = Image.open(os.path.join(FR, frame + ".png")).convert("RGB")
    img.thumbnail((W, H - 64), Image.LANCZOS)
    slide = Image.new("RGB", (W, H), "#0f766e")
    x = (W - img.width) // 2
    y = (H - 64 - img.height) // 2
    slide.paste(img, (x, y))
    cap_path = os.path.join(ROOT, f"caption_{idx:02d}.png")
    if os.path.exists(cap_path):
        strip = Image.open(cap_path).convert("RGB").resize((W, 64))
        slide.paste(strip, (0, H - 64))
    else:
        d = ImageDraw.Draw(slide)
        d.rectangle([0, H - 64, W, H], fill="#134e4a")
    return slide

async def tts_all():
    seg_files = []
    for i, (_, text, _) in enumerate(SEGMENTS):
        mp3 = os.path.join(ROOT, f"seg_{i:02d}.mp3")
        await edge_tts.Communicate(text, VOICE).save(mp3)
        seg_files.append(mp3)
    return seg_files

def duration_of(mp3):
    meta = iio.immeta(mp3, plugin="pyav") if False else None
    # simple: decode via ffmpeg probe
    import subprocess
    out = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-i", mp3, "-f", "null", "-"],
                         capture_output=True, text=True)
    import re
    m = re.search(r"time=(\d+):(\d+):(\d+\.\d+)", out.stderr)
    h, mnt, s = m.groups() if m else (0, 0, 0)
    return int(h) * 3600 + int(mnt) * 60 + float(s)

def main():
    print("1) narration...")
    seg_files = asyncio.run(tts_all())
    durs = [duration_of(f) for f in seg_files]
    total = sum(durs) + 0.4 * len(durs)
    print("   durations:", [round(d, 1) for d in durs], "total≈", round(total, 1), "s")
    assert total <= 118, f"narration too long: {total:.0f}s"

    print("2) slides...")
    slides = []
    for i, ((frame, _, cap), d) in enumerate(zip(SEGMENTS, durs)):
        slides.append((compose(frame, cap, i), d + 0.4))

    print("3) mux audio + frames...")
    # concat narration to one track with 0.4s gaps
    concat_list = os.path.join(ROOT, "concat.txt")
    silence = os.path.join(ROOT, "sil.mp3")
    subprocess_run = imageio_ffmpeg.get_ffmpeg_exe()
    import subprocess
    subprocess.run([subprocess_run, "-y", "-f", "lavfi", "-i",
                    "anullsrc=r=24000:cl=mono", "-t", "0.4", "-q:a", "9", silence],
                   capture_output=True)
    with open(concat_list, "w") as f:
        for i, sf in enumerate(seg_files):
            f.write(f"file '{sf}'\nfile '{silence}'\n")
    subprocess.run([subprocess_run, "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
                    "-c", "copy", os.path.join(ROOT, "narration.mp3")], capture_output=True)

    # memory-free encode: ffmpeg concat demuxer (slide PNGs + durations) + narration audio
    slide_files = []
    for i, (img, d) in enumerate(slides):
        p = os.path.join(ROOT, f"slide_{i:02d}.png")
        img.save(p)
        slide_files.append((p, d))
    fconcat = os.path.join(ROOT, "frames_concat.txt")
    with open(fconcat, "w", encoding="utf-8") as f:
        f.write("ffconcat version 1.0\n")
        for p, d in slide_files:
            f.write(f"file '{p}'\nduration {d:.3f}\n")
        f.write(f"file '{slide_files[-1][0]}'\n")  # concat demuxer quirk: repeat last frame
    final = OUT.replace(".mp4", "_final.mp4")
    subprocess.run([subprocess_run, "-y", "-f", "concat", "-safe", "0", "-i", fconcat,
                    "-i", os.path.join(ROOT, "narration.mp3"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
                    "-c:a", "aac", "-b:a", "96k", "-shortest", final], capture_output=True)
    os.replace(final, OUT)
    sz = os.path.getsize(OUT)
    print(f"DONE: {OUT} — {sz/1e6:.1f} MB, {total:.0f}s narration")
    assert sz < 300e6, "video exceeds 300 MB"
    assert total <= 118, "video too long"

def _gen(slides):
    for img, d in slides:
        n = max(int(d * 30), 12)
        for _ in range(n):
            yield img

if __name__ == "__main__":
    import numpy as np  # noqa
    main()
