import React, { useState } from 'react';
import type { VideoSpec, Scene } from '../types/videoSpec';
import type { PlayerRef } from '@remotion/player';
import {
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Image as ImageIcon,
  Volume2,
  Upload,
  Download,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Lock
} from 'lucide-react';
import { getDialogueStartFrame } from '../remotion/Root';
import { DEFAULT_MANGA_SCENE01_TITLE } from '../types/mangaShortsTemplate';
import './MangaWorkspace.css';

export interface MangaWorkspaceProps {
  videoSpec: VideoSpec;
  updateSpec: (newSpec: VideoSpec) => void;
  selectedSceneIndex: number;
  setSelectedSceneIndex: (idx: number) => void;
  playerRef: React.RefObject<PlayerRef | null>;
}

export const SE_OPTIONS = [
  { label: '（なし）', value: '' },
  // 定番・切り替え・着弾
  { label: '和太鼓でドドン (着弾・タイトル)', value: '/se/和太鼓でドドン.mp3' },
  { label: 'シーン切り替え1 (シャッ・場面転換)', value: '/se/シーン切り替え1.mp3' },
  { label: 'パパッ (短冊開閉・連続)', value: '/se/パパッ.mp3' },
  { label: 'パッ (瞬間出現・単発)', value: '/se/パッ.mp3' },
  { label: 'ペタッ (貼り付け・コミカル)', value: '/se/ペタッ.mp3' },
  // リアクション・感情・展開
  { label: '驚く (!? ピキーン・衝撃)', value: '/se/驚く.mp3' },
  { label: 'ショック1 (暗転・引き・絶望)', value: '/se/ショック1.mp3' },
  { label: 'シャキーン1 (肯定・キュン・決意)', value: '/se/シャキーン1.mp3' },
  { label: '涙のしずく (涙・悲哀・自己卑下)', value: '/se/涙のしずく.mp3' },
  { label: '不安（ピアノ演奏） (シリアス・不穏)', value: '/se/不安（ピアノ演奏）.mp3' },
  { label: 'ピアノの単音 (ポーン・気付き)', value: '/se/ピアノの単音.mp3' },
  { label: 'きらきら輝く1 (輝き・ハイライト)', value: '/se/きらきら輝く1.mp3' },
  { label: 'きらーん1 (ひらめき・星)', value: '/se/きらーん1.mp3' },
  { label: 'チリン (鈴・繊細・合図)', value: '/se/チリン.mp3' },
  { label: 'ボヨン (バウンド・脱力)', value: '/se/ボヨン.mp3' },
  // 吹き出し・アクション・演出
  { label: 'ニュッ1 (吹き出し出現・標準)', value: '/se/ニュッ1.mp3' },
  { label: 'ニュッ2 (吹き出し出現・高め)', value: '/se/ニュッ2.mp3' },
  { label: 'ニュッ3 (吹き出し出現・短め)', value: '/se/ニュッ3.mp3' },
  { label: '小パンチ (パンチ着弾・ツッコミ)', value: '/se/小パンチ.mp3' },
  { label: 'ジャンプの着地 (着地・トン)', value: '/se/ジャンプの着地.mp3' },
  { label: '試合開始のゴング (カーン・対決)', value: '/se/試合開始のゴング.mp3' },
  { label: '拍子木1 (チョン・江戸・見得)', value: '/se/拍子木1.mp3' },
  { label: '男衆「オウ！」 (野太い掛け声)', value: '/se/男衆「オウ！」.mp3' },
  { label: '女衆「おう！」 (女性陣の掛け声)', value: '/se/女衆「おう！」.mp3' },
];

/** 話者種別 */
type SpeakerRole = 'female' | 'male' | 'narrator';

/** タグを除去したクリーンテキストを取得 */
const stripInlineTags = (text: string): string => {
  if (!text) return '';
  return text.replace(/\[(pink|blue|red):([^\]]+)\]/g, '$2');
};

/** 話者に応じたカラータグを付与 */
const applySpeakerTag = (text: string, role: SpeakerRole): string => {
  const clean = stripInlineTags(text);
  if (!clean.trim()) return '';
  if (role === 'female') {
    return clean.split('\n').map(l => l ? `[pink:${l}]` : '').join('\n');
  }
  if (role === 'male') {
    return clean.split('\n').map(l => l ? `[blue:${l}]` : '').join('\n');
  }
  return clean; // ナレーションは通常プレーン
};

/** テキストから話者ロールを判定 */
const detectSpeakerRole = (speakerId?: string, text?: string): SpeakerRole => {
  if (speakerId === 'tsumugi' || speakerId === 'female') return 'female';
  if (speakerId === 'takehiro' || speakerId === 'male') return 'male';
  if (speakerId === 'ryusei' || speakerId === 'narration' || speakerId === 'narrator') return 'narrator';
  if (text?.includes('[pink:')) return 'female';
  if (text?.includes('[blue:')) return 'male';
  return 'narrator';
};

/** 文字数から自然な読み上げフレーム数を算出 (1.08倍速) */
const calcFrames = (text: string): number => {
  const clean = stripInlineTags(text).replace(/[\s\n\r]/g, '');
  const count = Math.max(clean.length, 1);
  return Math.max(45, Math.round((count / 7.5) * 30) + 6);
};

/** コマ単位の編集データモデル */
export interface MangaPanelData {
  mediaUrl: string;
  text: string;
  textPosition: 'top' | 'bottom';
  speaker: SpeakerRole;
  dialogueText: string;
  durationFrames: number;
  audioUrl?: string;
  triggerSE?: string;
  punchlineTriggerSE?: string;
}

/** シーンからコマ一覧 (コマ1, コマ2, ..., コマN) を復元 */
export const getScenePanels = (scene: Scene, isScene01Override?: boolean): MangaPanelData[] => {
  const props = (scene.props as any) || {};
  const dialogues = scene.dialogues || [];
  const isScene01 = isScene01Override !== undefined
    ? isScene01Override
    : (scene.id === 'manga-1' || scene.id === 'yofukashi-1' || scene.id === 'scene-1' || props.watermark === '01' || Boolean(props.focusLines && props.footerLead));

  // 1. props.panels が既に存在する場合
  if (Array.isArray(props.panels) && props.panels.length > 0) {
    return props.panels.map((p: any, i: number) => {
      const d = dialogues[i];
      const speakerId = p.speaker || d?.speaker || (p.text?.includes('[pink:') ? 'tsumugi' : p.text?.includes('[blue:') ? 'takehiro' : 'ryusei');
      
      // シーン01の場合、コマ1の durationFrames は着弾タイミング (footerStartFrame) ではなくシーン全体の尺 (120F等) を保証
      let durationFrames = p.durationFrames ?? d?.durationFrames ?? 60;
      if (isScene01 && i === 0) {
        const footerStart = typeof props.footerStartFrame === 'number' ? props.footerStartFrame : 74;
        const totalDuration = props.durationFrames || d?.durationFrames || 120;
        if (durationFrames <= footerStart || durationFrames < 100) {
          durationFrames = Math.max(totalDuration, footerStart + 35);
        }
      }

      return {
        mediaUrl: p.mediaUrl || '',
        text: stripInlineTags(p.text ?? (i === 0 ? props.title : props.footerHeadline) ?? ''),
        textPosition: p.textPosition || (i === 0 ? (props.title ? 'top' : 'bottom') : 'bottom'),
        speaker: detectSpeakerRole(speakerId, p.text),
        dialogueText: p.dialogueText ?? d?.text ?? stripInlineTags(p.text || ''),
        durationFrames,
        audioUrl: p.audioUrl ?? d?.audioUrl,
        triggerSE: p.triggerSE,
        punchlineTriggerSE: p.punchlineTriggerSE || props.punchlineTriggerSE
      };
    });
  }

  // 2. 従来の props から復元
  const list: MangaPanelData[] = [];
  const d1 = dialogues[0];
  const hasSecondary = !isScene01 && Boolean(props.secondaryMediaUrl || dialogues.length >= 2 || props.footerHeadline || props.subtitle);
  const totalSceneFrames = props.durationFrames || d1?.durationFrames || (isScene01 ? 120 : 90);
  const fStart = props.footerStartFrame ?? Math.round(totalSceneFrames * 0.55);

  const t1Pos: 'top' | 'bottom' = props.title ? 'top' : 'bottom';
  const t1Raw = stripInlineTags(props.title || props.footerLead || d1?.text || '');
  const s1Role = detectSpeakerRole(d1?.speaker, props.title);
  list.push({
    mediaUrl: props.mediaUrl || '',
    text: t1Raw,
    textPosition: t1Pos,
    speaker: s1Role,
    dialogueText: d1?.text || t1Raw,
    durationFrames: hasSecondary ? fStart : totalSceneFrames,
    audioUrl: d1?.audioUrl,
    triggerSE: props.triggerSE,
    punchlineTriggerSE: props.punchlineTriggerSE
  });

  // コマ2 (シーン01以外でセカンダリ要素がある場合)
  if (hasSecondary) {
    const d2 = dialogues[1];
    const t2Raw = stripInlineTags(props.subtitle || props.footerHeadline || d2?.text || '');
    const s2Role = detectSpeakerRole(d2?.speaker, props.subtitle || props.footerHeadline || d2?.text);
    const p2Duration = d2?.durationFrames ?? Math.max(30, totalSceneFrames - fStart);
    list.push({
      mediaUrl: props.secondaryMediaUrl || '',
      text: t2Raw,
      textPosition: props.subtitle ? 'top' : 'bottom',
      speaker: s2Role,
      dialogueText: d2?.text || t2Raw,
      durationFrames: p2Duration,
      audioUrl: d2?.audioUrl,
      triggerSE: props.textTriggerSE || undefined
    });
  }

  // コマ3以降
  if (!isScene01 && dialogues.length >= 3) {
    for (let i = 2; i < dialogues.length; i++) {
      const d = dialogues[i];
      list.push({
        mediaUrl: '',
        text: stripInlineTags(d.text),
        textPosition: 'bottom',
        speaker: detectSpeakerRole(d.speaker, d.text),
        dialogueText: d.text,
        durationFrames: d.durationFrames || 60,
        audioUrl: d.audioUrl
      });
    }
  }

  return list;
};

/** コマ一覧 (コマ1, コマ2, ..., コマN) を Scene オブジェクトへ保存・同期 */
const syncPanelsToScene = (
  panels: MangaPanelData[],
  currentScene: Scene,
  isScene01: boolean,
  isLastScene: boolean = false
): Scene => {
  const nextProps: any = { ...currentScene.props };
  const nextDialogues: any[] = [];

  if (isScene01) {
    // ＝＝＝ シーン01: 上部固定 + 下部テキスト（先行リード文＋着弾パンチライン）をナレーションで読み上げ ＝＝＝
    const p1 = panels[0] || {
      mediaUrl: '',
      text: '',
      textPosition: 'bottom',
      speaker: 'narrator',
      dialogueText: '',
      durationFrames: 120
    };
    nextProps.title = DEFAULT_MANGA_SCENE01_TITLE;
    nextProps.mediaUrl = p1.mediaUrl;
    if (p1.text) {
      nextProps.footerLead = p1.text;
    }

    const cleanLead = stripInlineTags(nextProps.footerLead || p1.text || '').replace(/\n+/g, ' ').trim();
    const cleanHeadline = stripInlineTags(nextProps.footerHeadline || '').replace(/\n+/g, ' ').trim();
    const dialogue01Text = [cleanLead, cleanHeadline].filter(Boolean).join('……');

    const punchlineSE = p1.punchlineTriggerSE !== undefined ? p1.punchlineTriggerSE : (nextProps as any).punchlineTriggerSE;
    nextProps.punchlineTriggerSE = punchlineSE;

    // シーン01の総尺は先行リード文＋着弾パンチラインを合わせたシーン全体の尺（着弾タイミング+35フレーム以上、通常120フレーム）
    const footerStart = typeof nextProps.footerStartFrame === 'number' ? nextProps.footerStartFrame : 74;
    const scene01Duration = Math.max(
      footerStart + 35,
      p1.durationFrames && p1.durationFrames > footerStart ? p1.durationFrames : (nextProps.durationFrames || 120)
    );
    nextProps.durationFrames = scene01Duration;

    nextProps.panels = [
      {
        mediaUrl: p1.mediaUrl,
        text: p1.text,
        textPosition: 'bottom',
        speaker: 'narrator',
        dialogueText: dialogue01Text,
        durationFrames: scene01Duration,
        audioUrl: p1.audioUrl,
        triggerSE: p1.triggerSE,
        punchlineTriggerSE: punchlineSE
      }
    ];

    nextDialogues.push({
      text: dialogue01Text,
      speaker: 'ryusei', // ナレーションで読み上げ
      durationFrames: scene01Duration,
      audioUrl: p1.audioUrl
    });

    return {
      ...currentScene,
      props: nextProps,
      dialogues: nextDialogues
    };
  }

  if (isLastScene) {
    // ＝＝＝ 最後のシーン: 基本的に上部テキストをナレーションで読み上げ ＝＝＝
    // （下部テキストは案内テロップとして表示し、ボイス読み上げは行わない）
    const p1 = panels[0];
    const cleanTopText = stripInlineTags(p1?.text || nextProps.title || '作品の詳細は動画の説明欄からチェックしてね！').replace(/\n+/g, ' ').trim();

    nextProps.panels = panels.map((p, idx) => ({
      mediaUrl: p.mediaUrl,
      text: p.text,
      textPosition: p.textPosition,
      speaker: 'narrator',
      dialogueText: idx === 0 ? cleanTopText : '',
      durationFrames: p.durationFrames,
      audioUrl: idx === 0 ? p.audioUrl : undefined,
      triggerSE: p.triggerSE
    }));

    nextProps.mediaUrl = p1?.mediaUrl || '';
    if (p1) {
      nextProps.title = p1.text;
    }
    if (panels.length >= 2) {
      nextProps.footerHeadline = panels[1]?.text || nextProps.footerHeadline;
      nextProps.secondaryMediaUrl = panels[1]?.mediaUrl || undefined;
      nextProps.footerStartFrame = p1?.durationFrames || 20;
    }

    nextDialogues.push({
      text: cleanTopText,
      speaker: 'ryusei', // ナレーションで読み上げ
      durationFrames: p1?.durationFrames || calcFrames(cleanTopText),
      audioUrl: p1?.audioUrl
    });

    return {
      ...currentScene,
      props: nextProps,
      dialogues: nextDialogues
    };
  }

  // ＝＝＝ それ以外のシーン: 画面内の各コマテキストを指定話者（女性/男性/ナレーション）で読み上げ ＝＝＝
  nextProps.panels = panels.map(p => {
    const tagged = applySpeakerTag(p.text, p.speaker);
    const cleanDialogue = stripInlineTags(p.text || '').replace(/\n+/g, ' ').trim();
    return {
      mediaUrl: p.mediaUrl,
      text: tagged, // 話者に応じたカラータグ付きテキストを保存（吹き出し・色を完全保証）
      textPosition: p.textPosition,
      speaker: p.speaker,
      dialogueText: cleanDialogue, // 画面内テキストの純粋テキストをセリフとして同期
      durationFrames: p.durationFrames,
      audioUrl: p.audioUrl,
      triggerSE: p.triggerSE
    };
  });

  // 後方互換フィールドの同期
  nextProps.mediaUrl = panels[0]?.mediaUrl || '';
  if (panels.length >= 2) {
    nextProps.secondaryMediaUrl = panels[1]?.mediaUrl || undefined;
    nextProps.footerStartFrame = panels[0]?.durationFrames || 60;
  } else {
    delete nextProps.secondaryMediaUrl;
  }

  // 画面テキストの同期 (後方互換用)
  const p1 = panels[0];
  if (p1) {
    const tagged1 = applySpeakerTag(p1.text, p1.speaker);
    if (p1.textPosition === 'top') {
      nextProps.title = tagged1;
      delete nextProps.footerLead;
    } else {
      nextProps.title = '';
      nextProps.footerLead = tagged1;
    }
  }

  const p2 = panels[1];
  if (p2) {
    const tagged2 = applySpeakerTag(p2.text, p2.speaker);
    if (p2.textPosition === 'top') {
      nextProps.subtitle = tagged2;
      delete nextProps.footerHeadline;
    } else {
      nextProps.footerHeadline = tagged2;
      delete nextProps.subtitle;
    }
  } else {
    delete nextProps.footerHeadline;
    delete nextProps.subtitle;
  }

  // dialogues 配列の同期: 画面内の各コマテキストを指定話者（女性: tsumugi / 男性: takehiro / ナレーション: ryusei）で登録
  panels.forEach(p => {
    const cleanDialogue = stripInlineTags(p.text || '').replace(/\n+/g, ' ').trim();
    const speakerId = p.speaker === 'female' ? 'tsumugi' : p.speaker === 'male' ? 'takehiro' : 'ryusei';
    nextDialogues.push({
      text: cleanDialogue,
      speaker: speakerId,
      durationFrames: p.durationFrames || calcFrames(cleanDialogue),
      audioUrl: p.audioUrl
    });
  });

  return {
    ...currentScene,
    props: nextProps,
    dialogues: nextDialogues
  };
};

export const MangaWorkspace: React.FC<MangaWorkspaceProps> = ({
  videoSpec,
  updateSpec,
  selectedSceneIndex,
  setSelectedSceneIndex,
  playerRef
}) => {
  const currentScene = videoSpec.scenes[selectedSceneIndex] || videoSpec.scenes[0];
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  if (!currentScene) {
    return <div style={{ padding: 20, color: '#94a3b8' }}>シーンがありません</div>;
  }

  const props = (currentScene.props as any) || {};
  const isScene01 = selectedSceneIndex === 0;
  const isLastScene = selectedSceneIndex === videoSpec.scenes.length - 1 && videoSpec.scenes.length >= 2;

  // コマ一覧 (コマ1, コマ2, ..., コマN) を取得
  const panels = getScenePanels(currentScene, isScene01);

  // シーン更新ヘルパー
  const updateCurrentScene = (updater: (prev: Scene) => Scene) => {
    const nextScenes = [...videoSpec.scenes];
    nextScenes[selectedSceneIndex] = updater({ ...currentScene });
    updateSpec({
      ...videoSpec,
      scenes: nextScenes
    });
  };

  // パネル一覧更新ヘルパー
  const updatePanels = (nextPanels: MangaPanelData[]) => {
    updateCurrentScene(s => syncPanelsToScene(nextPanels, s, isScene01, isLastScene));
  };

  // 個別パネル更新ヘルパー
  const updateSinglePanel = (index: number, patch: Partial<MangaPanelData>) => {
    const nextPanels = [...panels];
    nextPanels[index] = { ...nextPanels[index], ...patch };
    updatePanels(nextPanels);
  };

  // シーンシーク
  const handleSelectScene = (index: number) => {
    setSelectedSceneIndex(index);
    if (playerRef.current) {
      const targetFrame = getDialogueStartFrame(videoSpec, index, 0);
      playerRef.current.seekTo(targetFrame);
    }
  };

  // 画像ファイル選択 (DataURL変換)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, panelIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      updateSinglePanel(panelIndex, { mediaUrl: result });
    };
    reader.readAsDataURL(file);
  };

  // コマを追加 (コマN)
  const handleAddPanel = () => {
    const newPanelIndex = panels.length + 1;
    const newPanel: MangaPanelData = {
      mediaUrl: '',
      text: `コマ${newPanelIndex}のセリフまたはテキスト`,
      textPosition: newPanelIndex % 2 === 1 ? 'top' : 'bottom',
      speaker: newPanelIndex % 2 === 1 ? 'female' : 'male',
      dialogueText: `コマ${newPanelIndex}のセリフまたはテキスト`,
      durationFrames: 60
    };
    updatePanels([...panels, newPanel]);
  };

  // コマを削除
  const handleDeletePanel = (panelIndex: number) => {
    if (panels.length <= 1) {
      alert('1つのシーンには最低1つのコマが必要です');
      return;
    }
    const nextPanels = panels.filter((_, i) => i !== panelIndex);
    updatePanels(nextPanels);
  };

  // シーン追加
  const handleAddScene = () => {
    const newSceneNum = videoSpec.scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${newSceneNum}`,
      template: 'editorial-kinetic',
      props: {
        theme: 'manga-page',
        transition: 'manga-slash',
        watermark: String(newSceneNum).padStart(2, '0'),
        title: 'セリフまたはナレーションを入力',
        mediaPreset: 'manga-panel'
      } as any,
      dialogues: [
        {
          text: 'セリフまたはナレーションを入力',
          speaker: 'tsumugi',
          durationFrames: 60
        }
      ]
    };
    const nextScenes = [...videoSpec.scenes, newScene];
    updateSpec({ ...videoSpec, scenes: nextScenes });
    handleSelectScene(nextScenes.length - 1);
  };

  // シーン削除
  const handleDeleteScene = () => {
    if (videoSpec.scenes.length <= 1) {
      alert('これ以上シーンを削除できません');
      return;
    }
    if (!window.confirm(`シーン ${selectedSceneIndex + 1} を削除しますか？`)) return;
    const nextScenes = videoSpec.scenes.filter((_, i) => i !== selectedSceneIndex);
    updateSpec({ ...videoSpec, scenes: nextScenes });
    handleSelectScene(Math.max(0, selectedSceneIndex - 1));
  };

  // シーン複製
  const handleDuplicateScene = () => {
    const cloned = JSON.parse(JSON.stringify(currentScene));
    cloned.id = `scene-${videoSpec.scenes.length + 1}`;
    const nextScenes = [
      ...videoSpec.scenes.slice(0, selectedSceneIndex + 1),
      cloned,
      ...videoSpec.scenes.slice(selectedSceneIndex + 1)
    ];
    updateSpec({ ...videoSpec, scenes: nextScenes });
    handleSelectScene(selectedSceneIndex + 1);
  };

  // 全設定のJSONエクスポート (ローカルPCへのバックアップ保存)
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(videoSpec, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    dlAnchor.setAttribute('download', `manga_spec_backup_${dateStr}.json`);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // JSONインポート (バックアップからの復元)
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && Array.isArray(parsed.scenes)) {
          updateSpec(parsed);
          setNoticeMessage('📥 設定JSONを正常に読み込み・復元しました！');
          setTimeout(() => setNoticeMessage(null), 4000);
        } else {
          alert('無効な動画設定JSONファイルです。');
        }
      } catch {
        alert('JSONファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 各コマの開始累積フレーム数を計算
  let cumulativeFrame = 0;

  return (
    <div className="manga-workspace">
      {/* 1. 最上部ツールバー */}
      <div className="manga-ws-toolbar">
        <div className="manga-ws-title">
          <span>📖 漫画紹介ショート 作成ワークスペース</span>
          <span className="badge">縦型 9:16</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: 11, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: 4 }}>
            <CheckCircle2 size={12} /> 自動保存中
          </span>
          <button
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={handleExportJson}
            title="現在の全設定をJSONファイルとしてPCにバックアップ保存します"
          >
            <Download size={13} /> JSON保存
          </button>
          <label
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            title="保存したJSON設定ファイルを読み込んで復元します"
          >
            <Upload size={13} /> JSON読込
            <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportJson} />
          </label>
        </div>
      </div>

      {noticeMessage && (
        <div style={{ background: '#064e3b', color: '#6ee7b7', padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={15} /> {noticeMessage}
        </div>
      )}

      {/* 2. シーン横スクロールタイムライン */}
      <div className="manga-scene-nav">
        {videoSpec.scenes.map((sc, i) => {
          const scProps = (sc.props as any) || {};
          const isAct = i === selectedSceneIndex;
          const thumb = scProps.mediaUrl;
          return (
            <button
              key={sc.id || i}
              className={`manga-scene-pill ${isAct ? 'active' : ''}`}
              onClick={() => handleSelectScene(i)}
            >
              {thumb ? (
                <img src={thumb} alt={`コマ${i+1}`} className="thumb-mini" />
              ) : (
                <ImageIcon size={14} />
              )}
              <span>シーン {String(i + 1).padStart(2, '0')}</span>
            </button>
          );
        })}
        <button className="manga-scene-pill-add" onClick={handleAddScene} title="末尾にシーンを追加">
          <Plus size={13} /> シーン追加
        </button>
      </div>

      {/* 3. メイン編集コンテンツ */}
      <div className="manga-ws-content">
        {/* シーン操作ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
              シーン {String(selectedSceneIndex + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              （総コマ数: {panels.length}コマ / 総尺: {panels.reduce((acc, p) => acc + (p.durationFrames || 0), 0)} フレーム / 約{((panels.reduce((acc, p) => acc + (p.durationFrames || 0), 0)) / 30).toFixed(1)}秒）
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={handleDuplicateScene}
            >
              <Copy size={12} /> 複製
            </button>
            <button
              style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={handleDeleteScene}
            >
              <Trash2 size={12} /> 削除
            </button>
          </div>
        </div>

        {/* ＝＝＝ シーン01専用: 上部固定テキスト ＋ 下部テキストのみ設定 ＝＝＝ */}
        {isScene01 ? (
          <div className="manga-card">
            {/* 上部固定テキスト (編集不可) */}
            <div className="fixed-scene01-header-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fb7185', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Lock size={13} /> シーン01 上部テキスト (固定・編集不可)
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>
                  全作品共通オープニングフック
                </span>
              </div>
              <div className="fixed-scene01-preview" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', textAlign: 'center' }}>
                <div style={{ whiteSpace: 'nowrap' }}>
                  大人の <span style={{ color: '#ef4444', fontWeight: 900 }}>99%</span> が読んでいる
                </div>
                <div style={{ whiteSpace: 'nowrap', fontSize: '1.15em', fontWeight: 800 }}>
                  <span style={{ color: '#ec4899', fontWeight: 900 }}>ムフフ</span> な江戸漫画
                </div>
              </div>
            </div>

            {/* コマ1 (フックコマ ＆ 下部テキスト設定) */}
            <div className="manga-panel-card active-panel">
              <div className="manga-panel-card-header">
                <span className="manga-panel-num-badge">
                  <ImageIcon size={13} /> コマ 1 (冒頭フックコマ)
                </span>
                <span style={{ fontSize: 11, color: '#93c5fd' }}>
                  目元ドアップ → 急ズームアウト演出
                </span>
              </div>

              {/* 1. コマ画像 */}
              <div className="manga-panel-item-section">
                <div className="manga-panel-item-label">
                  <span>🖼️ コマ画像 (PNG)</span>
                </div>
                <div className="panel-row">
                  <div className="panel-preview-box">
                    {panels[0]?.mediaUrl ? (
                      <img src={panels[0].mediaUrl} alt="コマ1プレビュー" className="panel-preview-img" />
                    ) : (
                      <span className="panel-preview-empty">未設定</span>
                    )}
                  </div>
                  <div className="panel-inputs">
                    <div className="path-input-group">
                      <input
                        type="text"
                        placeholder="画像URL (例: /manga/0002/panel_01.png)"
                        value={panels[0]?.mediaUrl || ''}
                        onChange={e => updateSinglePanel(0, { mediaUrl: e.target.value.trim() })}
                      />
                    </div>
                    <label className="file-select-btn">
                      <Upload size={12} /> PNGファイルを選択
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={e => handleImageFileChange(e, 0)}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. 下部テキスト設定 */}
              <div className="manga-panel-item-section">
                <div className="manga-panel-item-label">
                  <span>📝 画面テキスト (下部固定)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <label style={{ fontSize: 10, color: '#94a3b8' }}>先行リード文 (改行可・例: 最後の日に\n卒業してみたら):</label>
                    <textarea
                      className="manga-textarea"
                      rows={2}
                      placeholder="例: 最後の日に\n卒業してみたら"
                      value={props.footerLead || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const nextPanels = [...panels];
                        nextPanels[0] = { ...nextPanels[0], text: val };
                        updateCurrentScene(s => {
                          const updated = {
                            ...s,
                            props: { ...s.props, footerLead: val }
                          };
                          return syncPanelsToScene(nextPanels, updated, true, false);
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: '#94a3b8' }}>着弾パンチライン (例: [red:気持ち良すぎた] または [red:ヤバすぎた]):</label>
                    <input
                      type="text"
                      style={{ width: '100%', background: '#090e1a', border: '1px solid #334155', borderRadius: 4, padding: '6px 8px', color: '#f8fafc', fontSize: 12, fontWeight: 700 }}
                      placeholder="例: [red:気持ち良すぎた]"
                      value={props.footerHeadline || ''}
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentScene(s => {
                          const updated = {
                            ...s,
                            props: { ...s.props, footerHeadline: val }
                          };
                          return syncPanelsToScene(panels, updated, true, false);
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 3. 音声・効果音設定 */}
              <div className="manga-panel-item-section">
                <div className="manga-panel-item-label">
                  <span>🗣️ 音声 & 効果音 (SE) 設定</span>
                </div>
                <div style={{ fontSize: 11, color: '#93c5fd', background: '#0b1d3a', border: '1px solid #1e3a8a', padding: '6px 10px', borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🎙️ 読み上げ話者: <strong style={{ color: '#60a5fa' }}>ナレーション (固定)</strong></span>
                  <span style={{ fontSize: 10, color: '#cbd5e1' }}>読上げ: 下部テキスト (リード文＋パンチライン)</span>
                </div>
                {/* ① 先行リード文の効果音 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 6 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <Volume2 size={12} color="#38bdf8" /> ① 先行リード文 出現効果音 (SE):
                  </label>
                  <select
                    style={{ flex: 1, background: '#090e1a', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px', color: '#f8fafc', fontSize: 11 }}
                    value={panels[0]?.triggerSE || ''}
                    onChange={e => updateSinglePanel(0, { triggerSE: e.target.value })}
                  >
                    {SE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* ② 着弾パンチラインの効果音 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                    <Volume2 size={12} color="#f43f5e" /> ② 着弾パンチライン 効果音 (SE):
                  </label>
                  <select
                    style={{ flex: 1, background: '#090e1a', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px', color: '#f8fafc', fontSize: 11 }}
                    value={panels[0]?.punchlineTriggerSE || props.punchlineTriggerSE || ''}
                    onChange={e => {
                      const val = e.target.value;
                      updateSinglePanel(0, { punchlineTriggerSE: val });
                    }}
                  >
                    {SE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="text-block-footer">
                  <div className="duration-input-group">
                    <span>表示時間:</span>
                    <input
                      type="number"
                      value={panels[0]?.durationFrames || props.durationFrames || 120}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 30;
                        updateSinglePanel(0, { durationFrames: val });
                      }}
                    />
                    <span>F</span>
                  </div>
                  <div className="duration-input-group">
                    <span>着弾タイミング:</span>
                    <input
                      type="number"
                      value={props.footerStartFrame ?? 74}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        updateCurrentScene(s => {
                          const updated = {
                            ...s,
                            props: { ...s.props, footerStartFrame: val }
                          };
                          return syncPanelsToScene(panels, updated, true, false);
                        });
                      }}
                    />
                    <span>F目</span>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <input
                      type="text"
                      style={{ width: '80%', background: '#090e1a', border: '1px solid #334155', borderRadius: 4, padding: '3px 6px', fontSize: 10, color: '#94a3b8' }}
                      placeholder="🔊 音声URL"
                      value={panels[0]?.audioUrl || ''}
                      onChange={e => updateSinglePanel(0, { audioUrl: e.target.value.trim() || undefined })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ＝＝＝ シーン02以降: コマ1 / コマ2 / コマN の完全統一カードリスト ＝＝＝ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {panels.map((panel, pIdx) => {
              const startF = cumulativeFrame;
              cumulativeFrame += (panel.durationFrames || 60);

              return (
                <div key={pIdx} className={`manga-panel-card ${pIdx === 0 ? 'active-panel' : ''}`}>
                  {/* カードヘッダー */}
                  <div className="manga-panel-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`manga-panel-num-badge ${pIdx === 0 ? 'blue' : ''}`}>
                        <ImageIcon size={13} /> コマ {pIdx + 1} {pIdx === 0 ? '(メイン)' : ''}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        開始: {startF}F〜 (約{(startF / 30).toFixed(1)}秒)
                      </span>
                    </div>
                    {pIdx > 0 && (
                      <button
                        style={{ background: '#7f1d1d', border: 'none', color: '#fecaca', padding: '3px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => handleDeletePanel(pIdx)}
                      >
                        <Trash2 size={11} /> コマ削除
                      </button>
                    )}
                  </div>

                  {/* 1. コマ画像 (PNG) */}
                  <div className="manga-panel-item-section">
                    <div className="manga-panel-item-label">
                      <span>🖼️ コマ画像 (PNG)</span>
                      {pIdx > 0 && !panel.mediaUrl && (
                        <span style={{ fontSize: 10, color: '#10b981', background: '#064e3b', padding: '1px 6px', borderRadius: 4 }}>
                          コマ1の画像をそのまま継続（アニメーションなし）
                        </span>
                      )}
                    </div>
                    <div className="panel-row">
                      <div className="panel-preview-box">
                        {panel.mediaUrl ? (
                          <img src={panel.mediaUrl} alt={`コマ${pIdx+1}プレビュー`} className="panel-preview-img" />
                        ) : pIdx > 0 && (panels.slice(0, pIdx).reverse().find(p => p.mediaUrl)?.mediaUrl) ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <img
                              src={panels.slice(0, pIdx).reverse().find(p => p.mediaUrl)?.mediaUrl}
                              alt="継続表示プレビュー"
                              className="panel-preview-img"
                              style={{ opacity: 0.55 }}
                            />
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#34d399', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                              継続表示
                            </div>
                          </div>
                        ) : (
                          <span className="panel-preview-empty">未設定</span>
                        )}
                      </div>
                      <div className="panel-inputs">
                        <div className="path-input-group">
                          <input
                            type="text"
                            placeholder={pIdx > 0 ? "空欄なら直前のコマ画像がそのまま出続けます (アニメーションなし)" : `画像URL (例: /manga/0002/panel_${String(selectedSceneIndex+1).padStart(2,'0')}.png)`}
                            value={panel.mediaUrl}
                            onChange={e => updateSinglePanel(pIdx, { mediaUrl: e.target.value.trim() })}
                          />
                        </div>
                        <label className="file-select-btn">
                          <Upload size={12} /> PNGファイルを選択
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            style={{ display: 'none' }}
                            onChange={e => handleImageFileChange(e, pIdx)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 2. テキスト ＆ テキスト配置 (上部 / 下部) */}
                  <div className="manga-panel-item-section">
                    <div className="manga-panel-item-label">
                      <span>📝 画面テキスト</span>
                      {/* テキスト配置セレクタ */}
                      <div className="position-switch">
                        <button
                          className={`position-opt ${panel.textPosition === 'top' ? 'selected' : ''}`}
                          onClick={() => updateSinglePanel(pIdx, { textPosition: 'top' })}
                        >
                          <ArrowUp size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                          上部
                        </button>
                        <button
                          className={`position-opt ${panel.textPosition === 'bottom' ? 'selected' : ''}`}
                          onClick={() => updateSinglePanel(pIdx, { textPosition: 'bottom' })}
                        >
                          <ArrowDown size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                          下部
                        </button>
                      </div>
                    </div>

                    <textarea
                      className="manga-textarea"
                      rows={2}
                      placeholder="画面に表示するテキストを入力（改行もそのまま画面に反映されます）"
                      value={panel.text}
                      onChange={e => {
                        const val = e.target.value;
                        updateSinglePanel(pIdx, {
                          text: val,
                          dialogueText: val
                        });
                      }}
                    />
                  </div>

                  {/* 3. セリフ設定 (男性 / 女性 / ナレーション) */}
                  <div className="manga-panel-item-section">
                    <div className="manga-panel-item-label">
                      <span>🗣️ セリフ設定 & 効果音</span>
                      {/* 話者セレクタ (最終シーンのコマ2以降はテロップのため非表示) */}
                      {!isLastScene || pIdx === 0 ? (
                        <div className="speaker-buttons">
                          <button
                            className={`speaker-btn female ${panel.speaker === 'female' ? 'selected' : ''}`}
                            onClick={() => updateSinglePanel(pIdx, { speaker: 'female' })}
                            disabled={isLastScene}
                          >
                            🌸 女性
                          </button>
                          <button
                            className={`speaker-btn male ${panel.speaker === 'male' ? 'selected' : ''}`}
                            onClick={() => updateSinglePanel(pIdx, { speaker: 'male' })}
                            disabled={isLastScene}
                          >
                            👓 男性
                          </button>
                          <button
                            className={`speaker-btn narrator ${panel.speaker === 'narrator' ? 'selected' : ''}`}
                            onClick={() => updateSinglePanel(pIdx, { speaker: 'narrator' })}
                          >
                            🎙️ ナレーション
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 10, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>
                          案内テロップ (ボイス読上げなし)
                        </span>
                      )}
                    </div>

                    {/* 読み上げ話者ガイド */}
                    {isLastScene ? (
                      pIdx === 0 ? (
                        <div style={{ fontSize: 11, color: '#93c5fd', background: '#0b1d3a', border: '1px solid #1e3a8a', padding: '5px 8px', borderRadius: 6, marginBottom: 8 }}>
                          🎙️ 最終シーン: <strong>上部テキストをナレーションで読み上げ</strong>
                        </div>
                      ) : null
                    ) : (
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>
                        🎙️ 読上げ: {panel.speaker === 'female' ? '🌸 女性ボイス (春日部つむぎ)' : panel.speaker === 'male' ? '👓 男性ボイス (玄野武宏)' : '🎙️ ナレーション (青山龍星)'} で画面テキストを読み上げます
                      </div>
                    )}

                    {/* コマ効果音 (SE) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 8 }}>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                        <Volume2 size={12} color="#10b981" /> テキスト出現・コマ切り替え効果音 (SE):
                      </label>
                      <select
                        style={{ flex: 1, background: '#090e1a', border: '1px solid #334155', borderRadius: 4, padding: '5px 8px', color: '#f8fafc', fontSize: 11 }}
                        value={panel.triggerSE || ''}
                        onChange={e => updateSinglePanel(pIdx, { triggerSE: e.target.value })}
                      >
                        {SE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="text-block-footer">
                      <div className="duration-input-group">
                        <span>表示時間:</span>
                        <input
                          type="number"
                          value={panel.durationFrames || 60}
                          onChange={e => updateSinglePanel(pIdx, { durationFrames: parseInt(e.target.value) || 30 })}
                        />
                        <span>F (約{((panel.durationFrames || 60) / 30).toFixed(1)}秒)</span>
                      </div>

                      <div style={{ flex: 1, textAlign: 'right' }}>
                        {!isLastScene || pIdx === 0 ? (
                          <input
                            type="text"
                            style={{ width: '80%', background: '#090e1a', border: '1px solid #334155', borderRadius: 4, padding: '3px 6px', fontSize: 10, color: '#94a3b8' }}
                            placeholder={pIdx > 0 && panels[0]?.audioUrl && !panel.audioUrl ? "🔊 コマ1の音声を継続再生中 (個別指定も可)" : "🔊 音声URL (例: /voices/0002/manga_04_01.wav)"}
                            value={panel.audioUrl || ''}
                            onChange={e => updateSinglePanel(pIdx, { audioUrl: e.target.value.trim() || undefined })}
                          />
                        ) : (
                          <span style={{ fontSize: 10, color: '#64748b' }}>※音声なし (案内テロップ)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ＋ コマを追加ボタン (コマN) */}
            <button className="btn-add-panel" onClick={handleAddPanel}>
              <Plus size={16} /> ＋ 新しいコマを追加 (コマ {panels.length + 1})
            </button>
          </div>
        )}

        {/* シーン演出 & テーマ設定セクション */}
        <div className="manga-card">
          <div className="manga-card-header">
            <div className="manga-card-title">
              <Sparkles size={16} color="#38bdf8" /> シーン切り替え演出 & テーマ設定
            </div>
          </div>

          <div className="scene-fx-grid">
            <div className="fx-item">
              <label>トランジション (画面切り替え)</label>
              <select
                value={props.transition || 'manga-slash'}
                onChange={e => {
                  const val = e.target.value;
                  updateCurrentScene(s => ({
                    ...s,
                    props: { ...s.props, transition: val } as any
                  }));
                }}
              >
                <option value="manga-slash">⚔️ スラッシュコマ割りワイプ (manga-slash)</option>
                <option value="blinds">🪟 ブラインド開閉 (blinds)</option>
                <option value="panel-wipe">📐 パネルワイプ (panel-wipe)</option>
                <option value="none">🚫 トランジションなし (冒頭フック用)</option>
              </select>
            </div>

            <div className="fx-item">
              <label>シーンテーマ (配色・明暗)</label>
              <select
                value={props.theme || 'manga-page'}
                onChange={e => {
                  const val = e.target.value;
                  updateCurrentScene(s => ({
                    ...s,
                    props: { ...s.props, theme: val } as any
                  }));
                }}
              >
                <option value="manga-page">📄 manga-page (通常・明灰＋白コマ)</option>
                <option value="manga-dark">🌙 manga-dark (暗転・クライマックス・CTA)</option>
              </select>
            </div>

            <div className="fx-checkbox-list">
              <label className="fx-checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(props.focusLines)}
                  onChange={e => {
                    const checked = e.target.checked;
                    updateCurrentScene(s => ({
                      ...s,
                      props: { ...s.props, focusLines: checked } as any
                    }));
                  }}
                />
                <span>⚡ 集中線アニメーションを表示（オープニング強調・着弾）</span>
              </label>

              <label className="fx-checkbox">
                <input
                  type="checkbox"
                  checked={props.fallingMangaBg !== undefined ? Boolean(props.fallingMangaBg) : true}
                  onChange={e => {
                    const checked = e.target.checked;
                    updateCurrentScene(s => ({
                      ...s,
                      props: { ...s.props, fallingMangaBg: checked } as any
                    }));
                  }}
                />
                <span>📚 背景で漫画単行本・原稿を流す（全シーン標準）</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
