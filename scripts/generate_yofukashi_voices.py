import os
import json
import urllib.request
import urllib.parse
import subprocess

VOICEVOX_URL = "http://127.0.0.1:50021"

SPEAKER_TSUMUGI = 8    # 春日部つむぎ（ノーマル）
SPEAKER_TAKEHIRO = 11  # 玄野武宏（ノーマル）
SPEAKER_RYUSEI = 13    # 青山龍星（ノーマル）

OUTPUT_DIR = "/Users/Baron/ai-work/video-editor-poc/frontend/public/voices/0002"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 音声リスト: (ファイル名, テキスト, speaker_id)
VOICE_ITEMS = [
    # Scene 1: 冒頭フック (下部テキスト内容をナレーションで読み上げ)
    ("manga_01_01.wav", "最後の日に卒業してみたら……気持ち良すぎた", SPEAKER_RYUSEI),
    # Scene 2
    ("manga_02_01.wav", "深夜の森の中、車の中で独り誰かを待つ男", SPEAKER_RYUSEI),
    # Scene 3: コマ1(女性) + コマ2(ナレーション)
    ("manga_03_01.wav", "こんばんわ、初めまして", SPEAKER_TSUMUGI),
    ("manga_03_02.wav", "そこに若い女の子が現れ、男は彼女を車へ迎え入れた", SPEAKER_RYUSEI),
    # Scene 4: コマ1(女性) + コマ2(男性)
    ("manga_04_01.wav", "すみません、何もかも用意してもらって…", SPEAKER_TSUMUGI),
    ("manga_04_02.wav", "来て貰えただけで嬉しいです、ひとりだと心細いんで", SPEAKER_TAKEHIRO),
    # Scene 5: コマ1(ナレーション)
    ("manga_05_01.wav", "エスエヌエスをきっかけに集まった彼らは、互いに人生に絶望していた", SPEAKER_RYUSEI),
    # Scene 6: コマ1(男性) + コマ2(女性)
    ("manga_06_01.wav", "お若いのになんでこんなことを…？", SPEAKER_TAKEHIRO),
    ("manga_06_02.wav", "イジメですね…", SPEAKER_TSUMUGI),
    # Scene 7: コマ1(ナレーション)
    ("manga_07_01.wav", "どうやら根暗で愛想が悪いことが、ターゲットにされた原因なのだという", SPEAKER_RYUSEI),
    # Scene 8: コマ1(女性) + コマ2(ナレーション)
    ("manga_08_01.wav", "お兄さんは借金が理由でしたっけ", SPEAKER_TSUMUGI),
    ("manga_08_02.wav", "男は毎日残業に追われ、稼いだ金も借金に消えていた", SPEAKER_RYUSEI),
    # Scene 9: コマ1(女性) + コマ2(ナレーション)
    ("manga_09_01.wav", "でも今日で苦しいのも終わり…", SPEAKER_TSUMUGI),
    ("manga_09_02.wav", "彼女はそう言うが、いざ準備に取り掛かると、男は思い悩んでしまう", SPEAKER_RYUSEI),
    # Scene 10: コマ1(女性) + コマ2(男性)
    ("manga_10_01.wav", "やり残したことでもあるんですか…？", SPEAKER_TSUMUGI),
    ("manga_10_02.wav", "なけなしの財産で最後の晩餐をと、でもまったく食欲がわかなくて…", SPEAKER_TAKEHIRO),
    # Scene 11: コマ1(男性) + コマ2(ナレーション)
    ("manga_11_01.wav", "どうせ逝くなら、初めてを卒業したかったな…", SPEAKER_TAKEHIRO),
    ("manga_11_02.wav", "最後の日だと言うのに、突然未練を語り始めた男", SPEAKER_RYUSEI),
    # Scene 12: コマ1(ナレーション) + コマ2(女性) + コマ3(女性)
    ("manga_12_01.wav", "すると彼女から", SPEAKER_RYUSEI),
    ("manga_12_02.wav", "じゃあ未練、解消しましょうか", SPEAKER_TSUMUGI),
    ("manga_12_03.wav", "私の身体なら、お好きにどうぞ…", SPEAKER_TSUMUGI),
    # Scene 13: 最終シーンCTA (上部テキストをナレーションで読み上げ)
    ("manga_13_01.wav", "作品の詳細は、動画の説明欄からチェックしてね！", SPEAKER_RYUSEI),
]

def synthesize_voicevox(text: str, speaker_id: int, out_path: str):
    query_params = urllib.parse.urlencode({"text": text, "speaker": speaker_id})
    req = urllib.request.Request(f"{VOICEVOX_URL}/audio_query?{query_params}", method="POST")
    with urllib.request.urlopen(req) as res:
        query_data = json.loads(res.read().decode("utf-8"))

    # スピードはテンポよく 1.25倍
    query_data["speedScale"] = 1.25

    # シーン1用: タメ（0.5秒のポーズ）
    if "気持ち良すぎた" in text and len(query_data.get("accent_phrases", [])) >= 4:
        for p in query_data["accent_phrases"]:
            m_text = "".join([m["text"] for m in p["moras"]])
            if "ソツギョウシテミタラ" in m_text or "サイゴノヒニ" in m_text:
                if p.get("pause_mora") is None:
                    p["pause_mora"] = {"text": "、", "consonant": None, "consonant_length": None, "vowel": "pau", "vowel_length": 0.5, "pitch": 0.0}
                else:
                    p["pause_mora"]["vowel_length"] = 0.5

    synth_params = urllib.parse.urlencode({"speaker": speaker_id})
    synth_req = urllib.request.Request(
        f"{VOICEVOX_URL}/synthesis?{synth_params}",
        data=json.dumps(query_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(synth_req) as synth_res:
        audio_bytes = synth_res.read()

    with open(out_path, "wb") as f:
        f.write(audio_bytes)

def time_stretch(in_path: str, out_path: str, atempo: float = 1.08):
    cmd = ["ffmpeg", "-y", "-i", in_path, "-filter:a", f"atempo={atempo}", "-vn", out_path]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def get_duration(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

results = []
total_frames = 0

print("Synthesizing clean voices without BGM via VOICEVOX...")
for filename, text, speaker in VOICE_ITEMS:
    raw_path = os.path.join(OUTPUT_DIR, filename + ".raw.wav")
    final_path = os.path.join(OUTPUT_DIR, filename)

    print(f"Generating {filename} ({speaker}): {text[:20]}...")
    synthesize_voicevox(text, speaker, raw_path)
    # atempo=1.08 でタイムストレッチ
    time_stretch(raw_path, final_path, 1.08)
    if os.path.exists(raw_path):
        os.remove(raw_path)

    dur = get_duration(final_path)
    frames = int(round(dur * 30)) + 6  # 0.2秒の余白
    total_frames += frames
    results.append({
        "file": f"/voices/0002/{filename}",
        "durationSec": dur,
        "frames": frames,
        "text": text,
        "speaker": speaker
    })
    print(f"  -> {dur:.2f}s ({frames} frames)")

manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n==========================================")
print(f"全 {len(VOICE_ITEMS)} 音声を生成完了（BGMなし・クリア音声）")
print(f"総フレーム数: {total_frames} frames ({total_frames / 30.0:.2f} 秒)")
print("==========================================")

