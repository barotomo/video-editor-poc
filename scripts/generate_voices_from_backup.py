import os
import json
import re
import urllib.request
import urllib.parse
import subprocess

VOICEVOX_URL = "http://127.0.0.1:50021"

SPEAKER_ID_MAP = {
    "tsumugi": 8,    # 春日部つむぎ (ノーマル)
    "takehiro": 11,  # 玄野武宏 (ノーマル)
    "ryusei": 13,    # 青山龍星 (ノーマル)
    "narrator": 13,
    "female": 8,
    "male": 11,
}

OUTPUT_DIR = "/Users/Baron/ai-work/video-editor-poc/frontend/public/voices/0002"
os.makedirs(OUTPUT_DIR, exist_ok=True)

BACKUP_PATH = "/Users/Baron/ai-work/video-editor-poc/videos/0002/manga_spec_backup_20261104.json"
OUTPUT_SPEC_JSON = "/Users/Baron/ai-work/video-editor-poc/frontend/src/types/yofukashiSpec.json"
OUTPUT_SPEC_TS = "/Users/Baron/ai-work/video-editor-poc/frontend/src/types/yofukashiEditorialSpec.ts"

def clean_speech_text(text: str) -> str:
    # インラインカラータグ [red:foo] -> foo
    t = re.sub(r'\[[a-z]+:(.*?)\]', r'\1', text)
    # カギ括弧 「 」
    t = t.replace('「', '').replace('」', '')
    # 改行
    t = t.replace('\n', '、')
    # 連続スペースやカンマ
    t = re.sub(r'\s+', ' ', t)
    # SNS -> エスエヌエス
    t = t.replace('SNS', 'エスエヌエス').replace('sns', 'エスエヌエス')
    # 読み仮名修正: 金 -> かね, 身体 -> からだ
    t = re.sub(r'(?<!借)金(?=[もをにはの])', 'かね', t)
    t = t.replace('稼いだ金', '稼いだかね')
    t = t.replace('身体', 'からだ')
    return t.strip()

def synthesize_voicevox(text: str, speaker_id: int, out_path: str):
    query_params = urllib.parse.urlencode({"text": text, "speaker": speaker_id})
    req = urllib.request.Request(f"{VOICEVOX_URL}/audio_query?{query_params}", method="POST")
    with urllib.request.urlopen(req) as res:
        query_data = json.loads(res.read().decode("utf-8"))

    # スピードはテンポよく 1.25倍
    query_data["speedScale"] = 1.25

    # シーン1用: タメ（0.45秒のポーズ）
    if "ヤバすぎた" in text and len(query_data.get("accent_phrases", [])) >= 3:
        for p in query_data["accent_phrases"]:
            m_text = "".join([m["text"] for m in p["moras"]])
            if "ソツギョウシタラ" in m_text or "ソツギョウ" in m_text:
                if p.get("pause_mora") is None:
                    p["pause_mora"] = {"text": "、", "consonant": None, "consonant_length": None, "vowel": "pau", "vowel_length": 0.45, "pitch": 0.0}
                else:
                    p["pause_mora"]["vowel_length"] = 0.45

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

def main():
    print(f"Loading backup spec from {BACKUP_PATH}...")
    with open(BACKUP_PATH, "r", encoding="utf-8") as f:
        spec = json.load(f)

    # 同期バージョンを付与（localStorageの安全な一回限りマイグレーション用）
    spec["syncVersion"] = "20261105-synced-v4"

    # 不要になった分割音声ファイルをクリーンアップ
    for cleanup_file in ["manga_02_02.wav", "manga_05_02.wav", "manga_07_02.wav"]:
        p = os.path.join(OUTPUT_DIR, cleanup_file)
        if os.path.exists(p):
            os.remove(p)
            print(f"Removed redundant split audio: {cleanup_file}")

    # 既存の manifest.json を読み込み（キャッシュ比較用）
    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    old_manifest_map = {}
    if os.path.exists(manifest_path):
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                for item in json.load(f):
                    old_manifest_map[item["file"]] = item.get("text", "")
        except Exception:
            pass

    manifest = []
    total_frames = 0

    print("Generating VOICEVOX audio files...")
    for s_idx, scene in enumerate(spec["scenes"]):
        scene_num = s_idx + 1
        props = scene.setdefault("props", {})
        dialogues = scene.get("dialogues", [])
        panels = props.get("panels", [])

        # シーン02, 05, 07 は単一コマ画像の上でテキストが上部→下部とスムーズに展開されるシーン。
        # 1本の流暢なナレーション音声（自然なテンポ）とし、下部テキスト出現フレーム（footerStartFrame）を発話タイミングと正確に同期！
        if scene_num == 2:
            dialogues = [{
                "text": "深夜の森の中、車の中で独り誰かを待つ男",
                "speaker": "ryusei",
                "durationFrames": 94
            }]
            scene["dialogues"] = dialogues
            props["panels"] = []  # コマ画像は1枚で継続表示
            props["footerStartFrame"] = 38  # 「車の中で〜」の実測発音開始タイミング
        elif scene_num == 5:
            dialogues = [{
                "text": "SNSをきっかけに集まった彼らは、互いに人生に絶望していた",
                "speaker": "ryusei",
                "durationFrames": 116
            }]
            scene["dialogues"] = dialogues
            props["panels"] = []  # コマ画像は1枚で継続表示
            props["footerStartFrame"] = 64  # 「互いに〜」の実測発音開始タイミング
        elif scene_num == 7:
            dialogues = [{
                "text": "どうやら根暗で愛想が悪いことが、ターゲットにされた原因なのだという",
                "speaker": "ryusei",
                "durationFrames": 113
            }]
            scene["dialogues"] = dialogues
            props["panels"] = []  # コマ画像は1枚で継続表示
            props["footerStartFrame"] = 57  # 「ターゲットに〜」の実測発音開始タイミング

        scene_dialogue_durations = []

        for d_idx, d in enumerate(dialogues):
            dial_num = d_idx + 1
            filename = f"manga_{scene_num:02d}_{dial_num:02d}.wav"
            speaker_key = d.get("speaker", "ryusei")
            speaker_id = SPEAKER_ID_MAP.get(speaker_key, 13)
            raw_text = d.get("text", "")
            speech_text = clean_speech_text(raw_text)

            raw_path = os.path.join(OUTPUT_DIR, filename + ".raw.wav")
            final_path = os.path.join(OUTPUT_DIR, filename)

            is_cached = os.path.exists(final_path) and old_manifest_map.get(f"/voices/0002/{filename}") == speech_text

            if not is_cached:
                print(f"  [{scene_num:02d}-{dial_num:02d}] ({speaker_key}/{speaker_id}): {speech_text[:25]}...")
                synthesize_voicevox(speech_text, speaker_id, raw_path)
                time_stretch(raw_path, final_path, atempo=1.08)
                if os.path.exists(raw_path):
                    os.remove(raw_path)
            else:
                print(f"  [{scene_num:02d}-{dial_num:02d}] (cached): {speech_text[:25]}...")

            dur_sec = get_duration(final_path)
            frames = int(round(dur_sec * 30)) + 6  # 0.2秒余白
            scene_dialogue_durations.append(frames)
            total_frames += frames

            audio_url = f"/voices/0002/{filename}"
            d["audioUrl"] = audio_url
            d["durationFrames"] = frames

            # 対応するパネルがあれば同期
            if d_idx < len(panels):
                panels[d_idx]["audioUrl"] = audio_url
                panels[d_idx]["durationFrames"] = frames
                if not panels[d_idx].get("dialogueText"):
                    panels[d_idx]["dialogueText"] = raw_text

            manifest.append({
                "file": audio_url,
                "durationSec": dur_sec,
                "frames": frames,
                "text": speech_text,
                "speaker": speaker_id
            })
            print(f"     -> {dur_sec:.2f}s ({frames} frames)")

        # シーン全体のフレーム長と footerStartFrame を更新
        total_scene_frames = sum(scene_dialogue_durations)
        if len(panels) > 0:
            # 複数コマの場合: 各コマの合計
            props["durationFrames"] = total_scene_frames
            # footerStartFrame は第1コマの長さ (第2コマの開始位置)
            if len(panels) >= 2:
                props["footerStartFrame"] = panels[0]["durationFrames"]
        else:
            # 単一コマの場合: ダイアログ長
            props["durationFrames"] = total_scene_frames
            # シーン1などのフックシーンの footerStartFrame 調整
            if scene_num == 1:
                props["footerStartFrame"] = int(round(total_scene_frames * 0.57))

    # manifest 保存
    manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    # JSON出力
    with open(OUTPUT_SPEC_JSON, "w", encoding="utf-8") as f:
        json.dump(spec, f, ensure_ascii=False, indent=2)
    print(f"Saved synchronized spec JSON to {OUTPUT_SPEC_JSON}")

    # TypeScript出力 (yofukashiEditorialSpec.ts)
    spec_json_str = json.dumps(spec, ensure_ascii=False, indent=2)
    ts_content = f"""import type {{ VideoSpec }} from './videoSpec';

/**
 * プロジェクト0002「よふかしのうた」風 漫画紹介ショート動画
 * ユーザーバックアップ (manga_spec_backup_20261104.json) + VOICEVOX同期済みスペック
 */
export const yofukashiMangaEditorialSpec: VideoSpec = {spec_json_str};
"""
    with open(OUTPUT_SPEC_TS, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Saved TypeScript spec to {OUTPUT_SPEC_TS}")

    print("\n==========================================")
    print(f"全 {len(manifest)} 音声を生成完了 & スペック同期完了")
    print(f"総フレーム数: {total_frames} frames ({total_frames / 30.0:.2f} 秒)")
    print("==========================================")

if __name__ == "__main__":
    main()
