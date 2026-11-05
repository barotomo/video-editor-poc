#!/usr/bin/env python3
"""
漫画紹介ショート動画（全13シーン・Nコマ対応エディトリアル版）量産自動化スクリプト

使い方:
  python scripts/create_manga_shorts.py scripts/templates/manga_script_template.json
  
処理内容:
  1. 台本JSONの読み込み & バリデーション (全13シーン・Nコマ・SE対応)
  2. VOICEVOX API (http://127.0.0.1:50021) による音声合成
     - 「金」を「かね」、「身体」を「からだ」等の自動読み仮名補正
     - シーン01の「卒業したら……ヤバすぎた」のタメポーズ自動挿入
  3. ffmpeg によるピッチ維持タイムストレッチ (atempo=1.08)
  4. ffprobe による尺計測 & フレーム数同期
  5. manifest.json の生成
  6. TypeScript 定義コード (`frontend/src/types/generated/{projectId}.ts`) の自動生成
  7. JSON スペック (`frontend/public/manga/{projectId}/spec.json`) の自動出力
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import subprocess
import re
import wave
import struct
import math

DEFAULT_VOICEVOX_URL = "http://127.0.0.1:50021"

# デフォルト話者ID
SPEAKER_MAPPING = {
    "girl": 8,       # 春日部つむぎ
    "tsumugi": 8,
    "female": 8,
    "boy": 11,       # 玄野武宏
    "takehiro": 11,
    "male": 11,
    "narration": 13, # 青山龍星
    "ryusei": 13,
    "narrator": 13
}

# 読み仮名置換辞書（漫画特有の誤読防止）
READING_REPLACEMENTS = [
    ("金を", "かねを"),
    ("金も", "かねも"),
    ("金が", "かねが"),
    ("金で", "かねで"),
    ("身体", "からだ"),
]

def clean_text(raw_text: str) -> str:
    """インラインタグ [pink:...] 等を除去して読み上げ用テキストにする"""
    t = re.sub(r'\[(pink|blue|red|black|accent):([^\]]+)\]', r'\2', raw_text)
    t = t.replace('//', '').replace('~~', '').replace('__', '')
    t = t.replace('「', '').replace('」', '').replace('『', '').replace('』', '')
    for src, dst in READING_REPLACEMENTS:
        t = t.replace(src, dst)
    return t.strip()

def is_voicevox_running(url: str = DEFAULT_VOICEVOX_URL) -> bool:
    try:
        req = urllib.request.Request(f"{url}/version", method="GET")
        with urllib.request.urlopen(req, timeout=2) as res:
            return res.status == 200
    except Exception:
        return False

def synthesize_voicevox(text: str, speaker_id: int, out_path: str, is_scene_01: bool = False, url: str = DEFAULT_VOICEVOX_URL):
    query_params = urllib.parse.urlencode({"text": text, "speaker": speaker_id})
    req = urllib.request.Request(f"{url}/audio_query?{query_params}", method="POST")
    with urllib.request.urlopen(req) as res:
        query_data = json.loads(res.read().decode("utf-8"))

    query_data["speedScale"] = 1.08

    # シーン01用: 「ヤバすぎた」の直前に0.55秒のタメ（息をのむ間）を挿入
    if is_scene_01 and ("ヤバすぎた" in text or "ヤバすぎ" in text) and len(query_data.get("accent_phrases", [])) >= 3:
        for p in query_data["accent_phrases"]:
            m_text = "".join([m.get("text", "") for m in p.get("moras", [])])
            if "シタラ" in m_text or "ソツギョウ" in m_text or "オンナノコガ" in m_text:
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

def get_audio_duration_seconds(file_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return float(res.stdout.strip())

def detect_punchline_start_frame(wav_path: str, fps: int = 30) -> int:
    """シーン01の音声波形から『ヤバすぎた』の発声開始フレームを検出"""
    try:
        with wave.open(wav_path, 'r') as w:
            frames = w.getnframes()
            rate = w.getframerate()
            raw = w.readframes(frames)
            samples = struct.unpack(f'{frames}h', raw)

        samples_per_frame = int(rate / fps)
        total_vframes = int(frames / samples_per_frame)
        # 後半60%以降で立ち上がりを検索
        start_search = int(total_vframes * 0.6)
        for vf in range(start_search, total_vframes - 5):
            chunk = samples[vf * samples_per_frame : (vf + 1) * samples_per_frame]
            rms = math.sqrt(sum(s * s for s in chunk) / len(chunk))
            if rms > 1000:
                return vf
        return 74
    except Exception:
        return 74

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

    project_id = data.get("projectId", "0003_sample")
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
        "female": speaker_config.get("girl", SPEAKER_MAPPING["girl"]),
        "tsumugi": speaker_config.get("girl", SPEAKER_MAPPING["girl"]),
        "boy": speaker_config.get("boy", SPEAKER_MAPPING["boy"]),
        "male": speaker_config.get("boy", SPEAKER_MAPPING["boy"]),
        "takehiro": speaker_config.get("boy", SPEAKER_MAPPING["boy"]),
        "narration": speaker_config.get("narration", SPEAKER_MAPPING["narration"]),
        "narrator": speaker_config.get("narration", SPEAKER_MAPPING["narration"]),
        "ryusei": speaker_config.get("narration", SPEAKER_MAPPING["narration"]),
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
        scene_str = str(scene_num).zfill(2)
        is_scene_01 = (scene_num == 1)

        # panels が明示されているシーン (Nコマ構成)
        panels = scene.get("panels")
        if panels and len(panels) > 0:
            processed_panels = []
            processed_dialogues = []
            scene_frames = 0

            for p_idx, p in enumerate(panels):
                raw_text = p.get("dialogueText") or p.get("text") or ""
                tts_text = clean_text(raw_text)
                speaker_key = p.get("speaker", "narration")
                speaker_id = speaker_ids.get(speaker_key, SPEAKER_MAPPING.get(speaker_key, 13))

                filename = f"manga_{scene_str}_{str(p_idx + 1).zfill(2)}.wav"
                out_file = os.path.join(public_voices_dir, filename)
                audio_url = f"/voices/{project_id}/{filename}"

                frames = 60
                if tts_text and voicevox_available:
                    print(f"[{scene_num}-{p_idx+1}] 合成中 ({speaker_key}, ID={speaker_id}): {tts_text[:24]}...")
                    synthesize_voicevox(tts_text, speaker_id, out_file, is_scene_01=False)
                    dur_sec = get_audio_duration_seconds(out_file)
                    frames = int(round(dur_sec * 30)) + 6
                elif tts_text:
                    dur_sec = max(len(tts_text), 1) / (7.5 * atempo)
                    frames = max(45, int(round(dur_sec * 30)) + 6)
                    audio_url = None
                else:
                    audio_url = None
                    frames = p.get("durationFrames", 60)

                scene_frames += frames
                p_copy = dict(p)
                p_copy["durationFrames"] = frames
                if audio_url:
                    p_copy["audioUrl"] = audio_url
                processed_panels.append(p_copy)

                speaker_role = "tsumugi" if speaker_key in ["girl", "female", "tsumugi"] else ("takehiro" if speaker_key in ["boy", "male", "takehiro"] else "ryusei")
                dialogue_entry = {
                    "text": raw_text,
                    "speaker": speaker_role,
                    "durationFrames": frames
                }
                if audio_url:
                    dialogue_entry["audioUrl"] = audio_url
                processed_dialogues.append(dialogue_entry)

                manifest.append({
                    "scene": scene_num,
                    "panel": p_idx + 1,
                    "file": audio_url,
                    "frames": frames,
                    "text": raw_text,
                    "speaker": speaker_key
                })

            total_frames += scene_frames
            p_scene = dict(scene)
            p_scene["panels"] = processed_panels
            p_scene["dialogues"] = processed_dialogues
            p_scene["durationFrames"] = scene_frames
            processed_scenes.append(p_scene)

        else:
            # 通常シーン / シーン01 (dialogues 構成)
            dialogues = scene.get("dialogues", [])
            processed_dialogues = []
            scene_frames = 0
            scene_01_wav = None

            for d_idx, d in enumerate(dialogues):
                raw_text = d.get("text", "")
                tts_text = clean_text(raw_text)
                speaker_key = d.get("speaker", "narration")
                speaker_id = speaker_ids.get(speaker_key, SPEAKER_MAPPING.get(speaker_key, 13))

                filename = f"manga_{scene_str}_{str(d_idx + 1).zfill(2)}.wav"
                out_file = os.path.join(public_voices_dir, filename)
                audio_url = f"/voices/{project_id}/{filename}"

                frames = 60
                if tts_text and voicevox_available:
                    print(f"[{scene_num}-{d_idx+1}] 合成中 ({speaker_key}, ID={speaker_id}): {tts_text[:24]}...")
                    synthesize_voicevox(tts_text, speaker_id, out_file, is_scene_01=is_scene_01)
                    dur_sec = get_audio_duration_seconds(out_file)
                    frames = int(round(dur_sec * 30)) + 6
                    if is_scene_01 and d_idx == 0:
                        scene_01_wav = out_file
                elif tts_text:
                    dur_sec = max(len(tts_text), 1) / (7.5 * atempo)
                    frames = max(45, int(round(dur_sec * 30)) + 6)
                    audio_url = None
                else:
                    audio_url = None
                    frames = d.get("durationFrames", 60)

                scene_frames += frames
                speaker_role = "tsumugi" if speaker_key in ["girl", "female", "tsumugi"] else ("takehiro" if speaker_key in ["boy", "male", "takehiro"] else "ryusei")
                dialogue_entry = {
                    "text": raw_text,
                    "speaker": speaker_role,
                    "durationFrames": frames
                }
                if audio_url:
                    dialogue_entry["audioUrl"] = audio_url
                processed_dialogues.append(dialogue_entry)

                manifest.append({
                    "scene": scene_num,
                    "dialogue": d_idx + 1,
                    "file": audio_url,
                    "frames": frames,
                    "text": raw_text,
                    "speaker": speaker_key
                })

            p_scene = dict(scene)
            p_scene["dialogues"] = processed_dialogues

            # シーン01の最適化: 着弾位置自動検出 & 余韻確保
            if is_scene_01:
                f_start = detect_punchline_start_frame(scene_01_wav) if scene_01_wav else 74
                p_scene["footerStartFrame"] = f_start
                # 着弾後約1秒間の余韻を確保 (最低120フレーム)
                scene_01_duration = max(120, scene_frames + 24)
                p_scene["durationFrames"] = scene_01_duration
                if len(processed_dialogues) > 0:
                    processed_dialogues[0]["durationFrames"] = scene_01_duration
                total_frames += scene_01_duration
            else:
                p_scene["durationFrames"] = scene_frames
                if "footerStartFrame" not in p_scene and len(processed_dialogues) >= 2:
                    p_scene["footerStartFrame"] = processed_dialogues[0]["durationFrames"]
                total_frames += scene_frames

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

    # TypeScript 変数名として有効な名前にサニタイズ
    clean_id = re.sub(r'[^a-zA-Z0-9_]', '_', project_id)
    var_name = f"mangaSpec_{clean_id}" if clean_id[0].isdigit() else f"{clean_id}MangaSpec"

    # TypeScript 設定スニペットの生成
    ts_code = f"""import type {{ VideoSpec }} from '../videoSpec';
import {{ createMangaShortsSpec }} from '../mangaShortsTemplate';

export const {var_name}: VideoSpec = createMangaShortsSpec({{
  id: '{project_id}',
  title: '{title}',
  bgmVolume: {data.get("bgmVolume", 0)},
  scenes: {json.dumps(processed_scenes, ensure_ascii=False, indent=4)}
}});
"""

    gen_dir = os.path.join(base_dir, "frontend", "src", "types", "generated")
    os.makedirs(gen_dir, exist_ok=True)
    ts_path = os.path.join(gen_dir, f"{project_id}.ts")
    with open(ts_path, "w", encoding="utf-8") as f:
        f.write(ts_code)

    # JSON スペックの出力 (MangaWorkspaceのインポートでもそのまま利用可能)
    spec_json_path = os.path.join(public_manga_dir, "spec.json")
    full_spec = {
        "title": title,
        "fps": 30,
        "width": 1080,
        "height": 1920,
        "bgmVolume": data.get("bgmVolume", 0),
        "scenes": processed_scenes,
        "syncVersion": "20261105-synced-v5"
    }
    with open(spec_json_path, "w", encoding="utf-8") as f:
        json.dump(full_spec, f, ensure_ascii=False, indent=2)

    print(f"✓ VideoSpec (TS) を出力しました: {ts_path}")
    print(f"✓ VideoSpec (JSON) を出力しました: {spec_json_path}")
    print("\n【次のステップ】")
    print(f"1. コマ画像を配置してください: frontend/public/manga/{project_id}/ (panel_01.png〜)")
    print(f"2. ブラウザの漫画ワークスペースでプレビュー確認:")
    print(f"   npm --prefix frontend run dev")
    print(f"3. 必要に応じて効果音やテキストを微調整して動画書き出し")
    print("==========================================\n")

if __name__ == "__main__":
    main()
