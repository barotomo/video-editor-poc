#!/usr/bin/env python3
"""
漫画紹介ショート動画（全12シーン・エディトリアル版）量産自動化スクリプト

使い方:
  python scripts/create_manga_shorts.py scripts/templates/manga_script_template.json
  
処理内容:
  1. 台本JSONの読み込み & バリデーション
  2. VOICEVOX API (http://127.0.0.1:50021) による音声合成
  3. ffmpeg によるピッチ維持タイムストレッチ (atempo=1.08)
  4. ffprobe による尺計測 & 余白 (6フレーム / 0.2s) 計算
  5. manifest.json の生成
  6. createMangaShortsSpec 用の TypeScript 定義コードの自動生成
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import subprocess
import re

DEFAULT_VOICEVOX_URL = "http://127.0.0.1:50021"

# デフォルト話者ID
SPEAKER_MAPPING = {
    "girl": 8,       # 春日部つむぎ
    "tsumugi": 8,
    "boy": 11,       # 玄野武宏
    "takehiro": 11,
    "narration": 13, # 青山龍星
    "ryusei": 13
}

def clean_text(raw_text: str) -> str:
    """インラインタグ [pink:...] 等を除去して読み上げ用テキストにする"""
    t = re.sub(r'\[(pink|blue|red):([^\]]+)\]', r'\2', raw_text)
    t = t.replace('//', '').replace('~~', '').replace('__', '')
    return t.strip()

def is_voicevox_running(url: str = DEFAULT_VOICEVOX_URL) -> bool:
    try:
        req = urllib.request.Request(f"{url}/version", method="GET")
        with urllib.request.urlopen(req, timeout=2) as res:
            return res.status == 200
    except Exception:
        return False

def synthesize_voicevox(text: str, speaker_id: int, out_path: str, url: str = DEFAULT_VOICEVOX_URL):
    # 1. audio_query 生成
    query_params = urllib.parse.urlencode({"text": text, "speaker": speaker_id})
    req = urllib.request.Request(f"{url}/audio_query?{query_params}", method="POST")
    with urllib.request.urlopen(req) as res:
        query_data = json.loads(res.read().decode("utf-8"))

    query_data["speedScale"] = 1.28

    # シーン1用: タメ（ポーズ）の挿入
    if ("ヤバすぎた" in text or "ヤバすぎ" in text) and len(query_data.get("accent_phrases", [])) >= 4:
        for p in query_data["accent_phrases"]:
            m_text = "".join([m["text"] for m in p["moras"]])
            if "オンナノコガ" in m_text or "シュジンコウガ" in m_text:
                if p.get("pause_mora") is None:
                    p["pause_mora"] = {
                        "text": "、",
                        "consonant": None,
                        "consonant_length": None,
                        "vowel": "pau",
                        "vowel_length": 0.55,
                        "pitch": 0.0
                    }
                else:
                    p["pause_mora"]["vowel_length"] = 0.55

    # 2. synthesis 合成
    synth_params = urllib.parse.urlencode({"speaker": speaker_id})
    synth_req = urllib.request.Request(
        f"{url}/synthesis?{synth_params}",
        data=json.dumps(query_data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(synth_req) as synth_res:
        audio_bytes = synth_res.read()

    with open(out_path, "wb") as f:
        f.write(audio_bytes)

def time_stretch_audio(in_path: str, out_path: str, atempo: float = 1.08):
    """ffmpeg を使用して音程を維持したまま再生速度を高速化"""
    cmd = [
        "ffmpeg", "-y", "-i", in_path,
        "-filter:a", f"atempo={atempo}",
        "-vn", out_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def get_audio_duration_seconds(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

def main():
    if len(sys.argv) < 2:
        print("使用法: python scripts/create_manga_shorts.py <台本JSONパス>")
        print("例: python scripts/create_manga_shorts.py scripts/templates/manga_script_template.json")
        sys.exit(1)

    script_path = sys.argv[1]
    if not os.path.exists(script_path):
        print(f"エラー: 台本ファイルが見つかりません: {script_path}")
        sys.exit(1)

    with open(script_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    project_id = data.get("projectId", "0002_custom")
    title = data.get("title", "漫画紹介ショート")
    atempo = float(data.get("atempo", 1.08))
    scenes_data = data.get("scenes", [])

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_voices_dir = os.path.join(base_dir, "frontend", "public", "voices", project_id)
    public_manga_dir = os.path.join(base_dir, "frontend", "public", "manga", project_id)
    os.makedirs(public_voices_dir, exist_ok=True)
    os.makedirs(public_manga_dir, exist_ok=True)

    voicevox_available = is_voicevox_running()
    if voicevox_available:
        print(f"✓ VOICEVOX サーバー接続成功 ({DEFAULT_VOICEVOX_URL})")
    else:
        print(f"! 警告: VOICEVOX サーバーが見つかりません ({DEFAULT_VOICEVOX_URL})")
        print("  音声生成をスキップし、文字数からフレーム数を自動計算します。")

    speaker_config = data.get("speakers", {})
    speaker_ids = {
        "girl": speaker_config.get("girl", SPEAKER_MAPPING["girl"]),
        "boy": speaker_config.get("boy", SPEAKER_MAPPING["boy"]),
        "narration": speaker_config.get("narration", SPEAKER_MAPPING["narration"]),
    }

    manifest = []
    processed_scenes = []
    total_frames = 0

    print(f"\n==========================================")
    print(f" プロジェクト: {project_id}")
    print(f" タイトル: {title}")
    print(f" 音声テンポ: {atempo}倍速")
    print(f" シーン数: {len(scenes_data)}")
    print(f"==========================================\n")

    for s_idx, scene in enumerate(scenes_data):
        scene_num = scene.get("scene", s_idx + 1)
        dialogues = scene.get("dialogues", [])
        processed_dialogues = []
        scene_frames = 0

        for d_idx, d in enumerate(dialogues):
            speaker_key = d.get("speaker", "narration")
            speaker_id = speaker_ids.get(speaker_key, SPEAKER_MAPPING.get(speaker_key, 13))
            raw_text = d.get("text", "")
            tts_text = clean_text(raw_text)

            filename = f"manga_{str(scene_num).padStart(2, '0')}_{str(d_idx + 1).padStart(2, '0')}.wav" if hasattr(str, 'padStart') else f"manga_{str(scene_num).zfill(2)}_{str(d_idx + 1).zfill(2)}.wav"
            out_file = os.path.join(public_voices_dir, filename)
            audio_url = f"/voices/{project_id}/{filename}"

            dur_sec = 0.0
            frames = 0

            if voicevox_available:
                print(f"[{scene_num}-{d_idx+1}] 合成中 ({speaker_key}, ID={speaker_id}): {tts_text[:24]}...")
                temp_raw = out_file + ".raw.wav"
                synthesize_voicevox(tts_text, speaker_id, temp_raw)
                # タイムストレッチ
                time_stretch_audio(temp_raw, out_file, atempo)
                if os.path.exists(temp_raw):
                    os.remove(temp_raw)
                dur_sec = get_audio_duration_seconds(out_file)
                frames = int(round(dur_sec * 30)) + 6
            else:
                # 文字数推定
                char_len = max(len(tts_text), 1)
                dur_sec = char_len / (7.5 * atempo)
                frames = max(45, int(round(dur_sec * 30)) + 6)
                audio_url = None

            scene_frames += frames
            manifest.append({
                "scene": scene_num,
                "dialogue": d_idx + 1,
                "file": audio_url,
                "durationSec": dur_sec,
                "frames": frames,
                "text": raw_text,
                "speaker": speaker_key
            })

            dialogue_entry = {
                "text": raw_text,
                "speaker": "tsumugi" if speaker_key == "girl" else ("takehiro" if speaker_key == "boy" else "ryusei"),
                "durationFrames": frames
            }
            if audio_url:
                dialogue_entry["audioUrl"] = audio_url
            processed_dialogues.append(dialogue_entry)

        total_frames += scene_frames
        p_scene = dict(scene)
        p_scene["dialogues"] = processed_dialogues
        # footerStartFrame の自動設定（未指定の場合）
        if "footerStartFrame" not in p_scene and len(processed_dialogues) >= 2:
            p_scene["footerStartFrame"] = processed_dialogues[0]["durationFrames"]
        processed_scenes.append(p_scene)

    # manifest.json の保存
    manifest_path = os.path.join(public_voices_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    total_sec = total_frames / 30.0

    print("\n------------------------------------------")
    print(f" 全音声生成完了:")
    print(f" 総フレーム数: {total_frames} frames")
    print(f" 総再生時間  : {total_sec:.2f} 秒")
    if total_sec <= 58.5:
        print(f" 判定        : ✓ YouTube Shorts 安全圏 (60秒未満)")
    else:
        print(f" 判定        : ⚠ 60秒を超過する可能性があります (atempoを1.10〜1.15に上げることを推奨)")
    print(f" マニフェスト: {manifest_path}")
    print("------------------------------------------\n")

    # TypeScript 変数名として有効な名前にサニタイズ（数字始まりはプレフィックス付与）
    clean_id = re.sub(r'[^a-zA-Z0-9_]', '_', project_id)
    var_name = f"mangaSpec_{clean_id}" if clean_id[0].isdigit() else f"{clean_id}MangaSpec"

    # TypeScript 設定スニペットの生成
    ts_code = f"""import type {{ VideoSpec }} from '../videoSpec';
import {{ createMangaShortsSpec }} from '../mangaShortsTemplate';

export const {var_name}: VideoSpec = createMangaShortsSpec({{
  id: '{project_id}',
  title: '{title}',
  bgmVolume: {data.get("bgmVolume", 0.15)},
  scenes: {json.dumps(processed_scenes, ensure_ascii=False, indent=4)}
}});
"""

    gen_dir = os.path.join(base_dir, "frontend", "src", "types", "generated")
    os.makedirs(gen_dir, exist_ok=True)
    ts_path = os.path.join(gen_dir, f"{project_id}.ts")
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(ts_code)

    print(f"✓ VideoSpec 定義を出力しました: {ts_path}")
    print("\n【次のステップ】")
    print(f"1. コマ画像を配置してください: frontend/public/manga/{project_id}/")
    print(f"2. プレビュー確認:")
    print(f"   npm --prefix frontend run dev")
    print(f"3. 動画レンダリング:")
    print(f"   npm --prefix frontend run build")
    print(f"   npx remotion render src/remotion/index.ts MainVideoShorts output/{project_id}.mp4 --props='{{\"spec\": ...}}'")
    print("==========================================\n")

if __name__ == "__main__":
    main()
