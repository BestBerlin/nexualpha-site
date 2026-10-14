#!/usr/bin/env python3
"""Locale voiceover generator (offline, already-installed models only; no downloads).

Usage (run with the TTS venv python):
  HF_HUB_OFFLINE=1 voice.py --locale tr --out DIR --lines lines.json        # lines.json = [{"id": "...", "text": "..."}]
  HF_HUB_OFFLINE=1 voice.py --locale tr --make-reference                     # (re)create the locale reference voice
Writes DIR/<id>.wav (24/48 kHz mono) and prints a JSON {id: seconds}.

Voices (chosen 2026-10-14, all local, Apache-2.0 weights):
  en     Qwen3-TTS 1.7B Base 8bit, clone of the owner-approved English master reference (cheerful young US female)
  zh-Hans Qwen3-TTS 1.7B CustomVoice bf16, built-in speaker "Serena" + friendly-host instruct
  es, pt-BR, tr, vi, id, ru, ar  VoxCPM2 bf16 (30 languages). A one-off voice-design reference per locale is generated once and
         stored in $NX_MEDIA_DIR/voices/<locale>-reference.{wav,txt}; every line is then cloned from it so the voice stays
         constant across scenes and videos. Delete a reference to redesign that voice.
"""
import argparse, json, os, sys
os.environ.setdefault("HF_HUB_OFFLINE", "1"); os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = os.path.join(os.environ.get("NX_MEDIA_DIR", "/Volumes/致态2TB/nx-agents/media"), "voices")  # generated locale references (not in git)
QWEN_BASE = "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit"
QWEN_CUSTOM = "mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-bf16"
VOXCPM = "mlx-community/VoxCPM2-bf16"
EN_REF = "/Volumes/致态2TB/nx-agents/education/v2/voice-en-master-reference.wav"
EN_REF_TEXT = "Your KYC got rejected again? Don't worry. Most rejections come down to just a few simple mistakes. Let's fix them together."

DESIGN = {  # one-off voice design (VoxCPM2): description + a natural reference sentence in the locale
  "es": ("Una joven latinoamericana de unos veinticinco años, voz cálida, alegre y clara, presentadora amable de tutoriales en YouTube, ritmo natural",
         "¿Te rechazaron la verificación otra vez? Tranquilo. Casi siempre son unos pocos errores sencillos. Vamos a resolverlos juntos."),
  "pt-BR": ("Uma jovem brasileira de vinte e poucos anos, sotaque de São Paulo, voz calorosa, animada e clara, apresentadora simpática de tutoriais no YouTube",
            "Sua verificação foi recusada de novo? Calma. Quase sempre são só alguns erros simples. Vamos resolver isso juntos."),
  "tr": ("Yirmili yaşlarında genç bir Türk kadın, İstanbul aksanı, sıcak, neşeli ve net bir ses, samimi bir YouTube eğitim sunucusu",
         "Kimlik doğrulaman yine mi reddedildi? Merak etme. Çoğu zaman sadece birkaç basit hata vardır. Hadi birlikte düzeltelim."),
  "vi": ("Một cô gái trẻ người Việt khoảng hai mươi lăm tuổi, giọng miền Nam, ấm áp, vui tươi và rõ ràng, người dẫn chương trình hướng dẫn thân thiện trên YouTube",
         "Xác minh danh tính lại bị từ chối à? Đừng lo. Thường chỉ là vài lỗi đơn giản thôi. Mình cùng sửa nhé."),
  "id": ("Seorang perempuan muda Indonesia berusia dua puluhan, aksen Jakarta, suara hangat, ceria dan jelas, pembawa acara tutorial YouTube yang ramah",
         "Verifikasi kamu ditolak lagi? Tenang saja. Biasanya cuma karena beberapa kesalahan kecil. Yuk, kita perbaiki bersama."),
  "ru": ("Молодая русская женщина двадцати с небольшим лет, тёплый, бодрый и чёткий голос, дружелюбная ведущая обучающих видео на YouTube",
         "Тебе снова отказали в верификации? Не переживай. Обычно дело всего в паре простых ошибок. Давай исправим их вместе."),
  "ar": ("شابة عربية في العشرينات، صوت دافئ ومرح وواضح، مقدمة ودودة لفيديوهات تعليمية على يوتيوب، لهجة عربية فصحى بسيطة",
         "هل رُفض التحقق من هويتك مرة أخرى؟ لا تقلق. غالبًا السبب أخطاء بسيطة قليلة. هيا نصلحها معًا."),
}
ZH_SPEAKER = "Serena"
ZH_INSTRUCT = "语气亲切、轻快、有活力，像朋友在旁边讲解，自然口语，不要播音腔"

def _write(path, audio, sr):
    from mlx_audio.audio_io import write as audio_write
    import numpy as np
    audio_write(path, np.array(audio), sr, format="wav")

def _model(repo):
    from mlx_audio.tts.utils import load_model
    from huggingface_hub import snapshot_download
    return load_model(snapshot_download(repo, local_files_only=True))

def _collect(gen):
    import numpy as np
    parts, sr = [], None
    for r in gen:
        parts.append(np.array(r.audio)); sr = r.sample_rate
    if not parts: raise SystemExit("TTS produced no audio")
    return np.concatenate(parts), sr

def make_reference(locale, model=None):
    desc, text = DESIGN[locale]
    model = model or _model(VOXCPM)
    audio, sr = _collect(model.generate(text=text, instruct=desc, inference_timesteps=16, cfg_value=2.0))
    os.makedirs(VOICES, exist_ok=True)
    _write(os.path.join(VOICES, f"{locale}-reference.wav"), audio, sr)
    open(os.path.join(VOICES, f"{locale}-reference.txt"), "w").write(text)
    return model

def synth(locale, lines, out):
    os.makedirs(out, exist_ok=True)
    res = {}
    if locale == "en":
        m = _model(QWEN_BASE)
        gen = lambda t: m.generate(text=t, ref_audio=EN_REF, ref_text=EN_REF_TEXT, lang_code="en")
    elif locale == "zh-Hans":
        m = _model(QWEN_CUSTOM)
        gen = lambda t: m.generate(text=t, voice=ZH_SPEAKER, instruct=ZH_INSTRUCT, lang_code="chinese")
    elif locale in DESIGN:
        m = _model(VOXCPM)
        ref = os.path.join(VOICES, f"{locale}-reference.wav")
        if not os.path.exists(ref): make_reference(locale, m)
        rtext = open(os.path.join(VOICES, f"{locale}-reference.txt")).read().strip()
        gen = lambda t: m.generate(text=t, ref_audio=ref, prompt_audio=ref, prompt_text=rtext, inference_timesteps=16, cfg_value=2.0)
    else:
        raise SystemExit(f"no voice configured for locale {locale}")
    for ln in lines:
        path = os.path.join(out, f"{ln['id']}.wav")
        if not os.path.exists(path):
            audio, sr = _collect(gen(ln["text"]))
            _write(path, audio, sr)
        import subprocess
        d = subprocess.run(["/opt/homebrew/bin/ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout
        res[ln["id"]] = round(float(d), 3)
    return res

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--locale", required=True); ap.add_argument("--out"); ap.add_argument("--lines")
    ap.add_argument("--make-reference", action="store_true")
    a = ap.parse_args()
    if a.make_reference: make_reference(a.locale); print(json.dumps({"reference": os.path.join(VOICES, f"{a.locale}-reference.wav")})); sys.exit(0)
    if not (a.out and a.lines): ap.error("--out and --lines required")
    print(json.dumps(synth(a.locale, json.load(open(a.lines)), a.out)))
