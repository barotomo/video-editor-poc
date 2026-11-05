import os
import json
import urllib.request
import urllib.parse
import subprocess

# 話者設定
# 女の子: 春日部つむぎ（ノーマル id: 8）
# 男性: 玄野武宏（ノーマル id: 11）
# ナレーション: 青山龍星（ノーマル id: 13）
SPEAKER_GIRL = 8
SPEAKER_BOY = 11
SPEAKER_NARRATION = 13

OUTPUT_DIR = "/Users/Baron/ai-work/video-editor-poc/frontend/public/voices/sakuragi"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 音声リスト: (ファイル名, 読み上げテキスト, speaker_id)
VOICE_ITEMS = [
    # Scene 1: 「女の子が」の後に1テンポのタメ（間）を置く
    ("manga_01_01.wav", "衝撃の光景を目の当たりにしてしまった女の子が……ヤバすぎた", SPEAKER_NARRATION),
    # Scene 2
    ("manga_02_01.wav", "先輩、彼女いるんすか？", SPEAKER_GIRL),
    ("manga_02_02.wav", "と、文芸部の先輩に質問する女の子", SPEAKER_NARRATION),
    # Scene 3
    ("manga_03_01.wav", "彼女は先輩と過ごす時間が大好きで", SPEAKER_NARRATION),
    ("manga_03_02.wav", "バレー部が休みの日は、いつも文芸部に入り浸っていた", SPEAKER_NARRATION),
    # Scene 4
    ("manga_04_01.wav", "卒業が近づいた先輩ともっと過ごしたいと思い", SPEAKER_NARRATION),
    ("manga_04_02.wav", "最近はいつもより積極的になる彼女だが", SPEAKER_NARRATION),
    # Scene 5
    ("manga_05_01.wav", "そんな先輩は同じく文芸部の上園先輩に好意を寄せており", SPEAKER_NARRATION),
    ("manga_05_02.wav", "文武両道で美人な先輩は、学年の男子全員の高嶺の花であった", SPEAKER_NARRATION),
    # Scene 6
    ("manga_06_01.wav", "先輩もまた、そのように思っており", SPEAKER_NARRATION),
    ("manga_06_02.wav", "彼女は、女として終わってる自分くらいが丁度いい、と先輩に提案してみるが", SPEAKER_NARRATION),
    # Scene 7
    ("manga_07_01.wav", "そんなこと言うなよ。お前はかっこいいよ", SPEAKER_BOY),
    ("manga_07_02.wav", "と言われ、改めて先輩の良さに気付く女の子", SPEAKER_NARRATION),
    # Scene 8
    ("manga_08_01.wav", "そんなある日、昨夜から先輩からの返信が無いことに気付き", SPEAKER_NARRATION),
    ("manga_08_02.wav", "部活仲間にあの先輩かとからかわれてしまうが", SPEAKER_NARRATION),
    # Scene 9
    ("manga_09_01.wav", "同時にウジウジしてるのはらしくないとアドバイスを貰い", SPEAKER_NARRATION),
    ("manga_09_02.wav", "遂に告白する決心がつく女の子", SPEAKER_NARRATION),
    # Scene 10
    ("manga_10_01.wav", "思い立ったらすぐに行動と文芸部に向かう彼女", SPEAKER_NARRATION),
    ("manga_10_02.wav", "そして思いを伝えるため扉を開くと", SPEAKER_NARRATION),
    # Scene 11
    ("manga_11_01.wav", "そこには大好きな先輩と、上園先輩が…", SPEAKER_NARRATION),
    # Scene 12
    ("manga_12_01.wav", "作品の詳細は、動画の説明欄からチェックしてね！", SPEAKER_NARRATION),
]

def synthesize_voicevox(text: str, speaker_id: int, out_path: str):
    # 1. audio_query 生成
    query_params = urllib.parse.urlencode({"text": text, "speaker": speaker_id})
    req = urllib.request.Request(f"http://127.0.0.1:50021/audio_query?{query_params}", method="POST")
    with urllib.request.urlopen(req) as res:
        query_data = json.loads(res.read().decode("utf-8"))

    # スピードをさらに上げてキビキビしたテンポ（1.28倍）に設定
    query_data["speedScale"] = 1.28

    # シーン1用: 「女の子が」と「ヤバすぎた」の間にしっかり1テンポ（約0.5秒）のタメ（ポーズ）を作る
    if "ヤバすぎた" in text and len(query_data.get("accent_phrases", [])) >= 7:
        for p in query_data["accent_phrases"]:
            m_text = "".join([m["text"] for m in p["moras"]])
            if "オンナノコガ" in m_text:
                if p.get("pause_mora") is None:
                    p["pause_mora"] = {"text": "、", "consonant": None, "consonant_length": None, "vowel": "pau", "vowel_length": 0.55, "pitch": 0.0}
                else:
                    p["pause_mora"]["vowel_length"] = 0.55

    # 2. synthesis 合成
    synth_params = urllib.parse.urlencode({"speaker": speaker_id})
    synth_req = urllib.request.Request(
        f"http://127.0.0.1:50021/synthesis?{synth_params}",
        data=json.dumps(query_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(synth_req) as synth_res:
        audio_bytes = synth_res.read()

    with open(out_path, "wb") as f:
        f.write(audio_bytes)

def get_audio_duration_seconds(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

results = []
for filename, text, speaker in VOICE_ITEMS:
    out_file = os.path.join(OUTPUT_DIR, filename)
    print(f"Generating: {filename} (speaker={speaker}) -> '{text}'...")
    synthesize_voicevox(text, speaker, out_file)
    dur = get_audio_duration_seconds(out_file)
    frames = int(round(dur * 30)) + 6 # 少し余白 (6フレーム = 0.2秒)
    results.append({
        "file": f"/voices/sakuragi/{filename}",
        "durationSec": dur,
        "frames": frames,
        "text": text,
        "speaker": speaker
    })
    print(f"  -> Generated {filename}: {dur:.2f}s ({frames} frames)")

with open(os.path.join(OUTPUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\nAll voices synthesized successfully!")

