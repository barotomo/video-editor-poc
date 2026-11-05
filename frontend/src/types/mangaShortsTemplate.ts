import type { VideoSpec, Scene, SpeakerInfo, EditorialKineticProps, EditorialMediaPreset } from './videoSpec';

/**
 * 漫画紹介ショート用：標準話者プリセット
 */
export const DEFAULT_MANGA_SPEAKERS: Record<string, SpeakerInfo> = {
  tsumugi: {
    id: 'tsumugi',
    name: '春日部つむぎ (ヒロイン)',
    color: '#ff69b4',
    avatarBg: '#ffe4e1',
    iconText: '🌸'
  },
  takehiro: {
    id: 'takehiro',
    name: '玄野武宏 (主人公・先輩)',
    color: '#4169e1',
    avatarBg: '#e6e6fa',
    iconText: '👓'
  },
  ryusei: {
    id: 'ryusei',
    name: '青山龍星 (ナレーション)',
    color: '#2e8b57',
    avatarBg: '#f0fff0',
    iconText: '🎙️'
  }
};

/**
 * 漫画紹介ショート：1シーンあたりのダイアログ（セリフ/ナレーション）入力設定
 */
export interface MangaDialogueInput {
  text: string;
  speaker?: 'tsumugi' | 'takehiro' | 'ryusei' | string;
  audioUrl?: string | null;
  durationFrames?: number;
}

/**
 * 漫画紹介ショート：1コマごとの設定 (Nコマ対応)
 */
export interface MangaPanelInput {
  mediaUrl?: string;
  text?: string;
  textPosition?: 'top' | 'bottom';
  speaker?: 'female' | 'male' | 'narrator' | 'tsumugi' | 'takehiro' | 'ryusei' | string;
  dialogueText?: string;
  durationFrames?: number;
  audioUrl?: string;
  seUrl?: string;
}

/**
 * 漫画紹介ショート：カスタム効果音トリガー
 */
export interface CustomSoundEffect {
  frame: number;
  src: string;
  volume?: number;
  durationFrames?: number;
}

/**
 * 漫画紹介ショート：各シーンの入力設定
 */
export interface MangaSceneInput {
  /** シーン番号 (オプション) */
  scene?: number;
  /** シーン識別子（省略時は `${projectId}-${index + 1}`） */
  id?: string;
  /** 水引番号（例: '01', '02', ...） */
  watermark?: string;
  
  /** メインコマ画像URL (例: '/manga/0002/panel_01.png') */
  mediaUrl?: string;
  /** 2コマ切り替え時の2枚目画像URL（オプション） */
  secondaryMediaUrl?: string;
  /** Nコマ設定（省略時は mediaUrl や title/footerHeadline から自動構築） */
  panels?: MangaPanelInput[];
  /** メディアプリセット（例: 'manga-panel' | 'manga-description-guide'） */
  mediaPreset?: EditorialMediaPreset;

  /** 上部見出しテキスト（改行可・インライン装飾タグ可） */
  title?: string;
  /** 上部サブ見出し（オプション） */
  subtitle?: string;

  /** シーン01用：下部先行リード文（例: '[blue:衝撃の光景]を目の当たり\nにしてしまった女の子が'） */
  footerLead?: string;
  /** シーン01〜10用：下部見出し / ナレーション / 着弾パンチライン */
  footerHeadline?: string;
  /** 下部テキストの出現開始フレーム（シーン01の着弾スタンプや、2つ目のセリフ開始タイミング） */
  footerStartFrame?: number;
  /** シーン全体のフレーム尺（省略時は dialogues の合計から自動計算） */
  durationFrames?: number;

  /** シーン01用：着弾パンチライン時に鳴らす効果音 */
  punchlineTriggerSE?: string;

  /** このシーンで話されるセリフ・ナレーションリスト */
  dialogues: MangaDialogueInput[];

  /** トランジション（省略時はシーンに応じた推奨設定） */
  transition?: 'none' | 'manga-slash' | 'blinds' | 'panel-wipe';
  /** テーマ（通常: 'manga-page' / クライマックス・CTA: 'manga-dark'） */
  theme?: 'manga-page' | 'manga-dark';
  /** モーション（'zoom-out' | 'blur-in' | 'slide-up'） */
  motionStyle?: 'zoom-out' | 'blur-in' | 'slide-up';
  /** 集中線表示フラグ（薄オレンジ集中線） */
  focusLines?: boolean;
  /** 落下本背景フラグ（CTAシーン等） */
  fallingMangaBg?: boolean;
  /** 3点メニュー・タイトルへの誘導矢印・図解フラグ（CTAシーン等） */
  ctaArrow?: boolean;

  /** 個別SEの追加・上書き（オプション） */
  soundEffects?: CustomSoundEffect[];
}

/**
 * 漫画紹介ショート動画（約57秒・全12シーン）全体の定義設定
 */
export interface MangaShortsConfig {
  /** プロジェクト/作品識別子 (例: '0001_sakuragi', '0002_tsubasa') */
  id: string;
  /** 動画タイトル */
  title: string;
  /** BGM音量（デフォルト: 0.15） */
  bgmVolume?: number;
  /** 話者マップ（省略時は DEFAULT_MANGA_SPEAKERS） */
  speakers?: Record<string, SpeakerInfo>;
  /** シーン設定（通常全12シーン） */
  scenes: MangaSceneInput[];
}

/**
 * 漫画紹介ショート共通：シーン01（冒頭フック）上部固定見出しテキスト（2行表示・各行折り返しなし）
 */
export const DEFAULT_MANGA_SCENE01_TITLE = '大人の[red:99%]が読んでいる\n[pink:ムフフ]な江戸漫画';

/**
 * 文字数から自然な読み上げフレーム数を概算（30fps換算 / 1.08倍速テンポ）
 * 1秒あたり約7〜8文字 ＋ 末尾に0.2秒（6フレーム）の余白
 */
export const estimateDurationFrames = (text: string): number => {
  const clean = text.replace(/\[(pink|blue|red):([^\]]+)\]/g, '$2').replace(/[\s\n\r]/g, '');
  const charCount = Math.max(clean.length, 1);
  const seconds = charCount / 7.5;
  return Math.max(45, Math.round(seconds * 30) + 6);
};

/**
 * プロジェクト「0001」で完成したエディトリアル設計システムに基づき、
 * 任意の作品設定から完全な VideoSpec を自動組み立てるファクトリ関数
 */
export function createMangaShortsSpec(config: MangaShortsConfig): VideoSpec {
  const {
    id: projectId,
    title,
    bgmVolume = 0.15,
    speakers = DEFAULT_MANGA_SPEAKERS,
    scenes: sceneInputs
  } = config;

  const scenes: Scene[] = sceneInputs.map((input, index) => {
    const sceneNum = index + 1;
    const watermark = input.watermark || String(sceneNum).padStart(2, '0');
    const sceneId = input.id || `${projectId}-${sceneNum}`;

    // デフォルトの演出規則（0001の黄金律を継承）
    let defaultTheme: 'manga-page' | 'manga-dark' = 'manga-page';
    let defaultTransition: 'none' | 'manga-slash' | 'blinds' | 'panel-wipe' = 'manga-slash';
    let defaultMotion: 'zoom-out' | 'blur-in' | 'slide-up' = 'blur-in';
    let defaultFocusLines = false;
    let defaultFallingMangaBg = false;
    let defaultCtaArrow = false;

    if (sceneNum === 1) {
      // シーン1: 冒頭フック特大演出
      defaultTheme = 'manga-page';
      defaultTransition = 'none';
      defaultMotion = 'zoom-out';
      defaultFocusLines = true;
    } else if (sceneNum === 3) {
      defaultMotion = 'blur-in';
    } else if (sceneNum === 4 || sceneNum === 8) {
      // シーン4 & 8: ブラインド開閉
      defaultTransition = 'blinds';
    } else if (sceneNum === 6) {
      // シーン6: パネルワイプ
      defaultTransition = 'panel-wipe';
    } else if (sceneNum === 11) {
      // シーン11: 暗転・最大の引き
      defaultTheme = 'manga-dark';
      defaultTransition = 'manga-slash';
      defaultMotion = 'slide-up';
    } else if (sceneNum === 12) {
      // シーン12: YouTube Shorts 概要欄CTA
      defaultTheme = 'manga-dark';
      defaultTransition = 'manga-slash';
      defaultFallingMangaBg = true;
      defaultCtaArrow = true;
    }

    const theme = input.theme || defaultTheme;
    const transition = input.transition || defaultTransition;
    const motionStyle = input.motionStyle || defaultMotion;
    const focusLines = input.focusLines !== undefined ? input.focusLines : defaultFocusLines;
    const fallingMangaBg = input.fallingMangaBg !== undefined ? input.fallingMangaBg : defaultFallingMangaBg;
    const ctaArrow = input.ctaArrow !== undefined ? input.ctaArrow : defaultCtaArrow;

    // panels から dialogues が未指定の場合は自動展開
    let effectiveDialoguesInput = input.dialogues || [];
    if (effectiveDialoguesInput.length === 0 && input.panels && input.panels.length > 0) {
      effectiveDialoguesInput = input.panels.map(p => ({
        text: p.dialogueText || p.text || '',
        speaker: p.speaker,
        durationFrames: p.durationFrames,
        audioUrl: p.audioUrl
      }));
    }

    // ダイアログの durationFrames 自動補正
    const dialogues = effectiveDialoguesInput.map((d) => {
      let duration = d.durationFrames;
      if (!duration || duration <= 0) {
        duration = estimateDurationFrames(d.text);
      }
      return {
        text: d.text,
        audioUrl: d.audioUrl || undefined,
        speaker: d.speaker,
        durationFrames: duration
      };
    });

    const totalDialoguesFrames = dialogues.reduce((sum, d) => sum + (d.durationFrames || 60), 0);
    const sceneDurationFrames = input.durationFrames || totalDialoguesFrames || 90;

    // footerStartFrame の自動算出（指定がない場合、第1セリフの長さを基準にする）
    let footerStartFrame = input.footerStartFrame;
    if (footerStartFrame === undefined && dialogues.length >= 2) {
      footerStartFrame = dialogues[0].durationFrames;
    }

    const titleText = sceneNum === 1 ? (input.title || DEFAULT_MANGA_SCENE01_TITLE) : (input.title ?? '');

    const props: EditorialKineticProps & Record<string, any> = {
      theme,
      transition,
      badgeType: 'none',
      watermark,
      title: titleText,
      subtitle: input.subtitle,
      footerLead: input.footerLead,
      footerHeadline: input.footerHeadline,
      footerStartFrame,
      mediaPreset: input.mediaPreset || 'manga-panel',
      mediaUrl: input.mediaUrl,
      secondaryMediaUrl: input.secondaryMediaUrl,
      panels: input.panels,
      punchlineTriggerSE: input.punchlineTriggerSE,
      durationFrames: sceneDurationFrames,
      motionStyle,
      focusLines,
      fallingMangaBg,
      ctaArrow,
      soundEffects: input.soundEffects
    };

    return {
      id: sceneId,
      template: 'editorial-kinetic',
      props,
      dialogues
    };
  });

  return {
    title,
    fps: 30,
    width: 1080,
    height: 1920,
    bgmVolume,
    speakers,
    scenes
  };
}

/**
 * 新規漫画作品をゼロから作成する際の最新13シーン構成テンプレートSpec
 * プロジェクト0001・0002と完全に同一の黄金フォーマット（Nコマ・継続表示・着弾演出・CTAガイド）
 */
export function createBlankMangaShortsSpec(customTitle?: string): VideoSpec {
  const title = customTitle || '新規漫画紹介ショート (13シーン最新フォーマット)';
  const blankScenes: MangaSceneInput[] = [
    {
      mediaUrl: '/manga/sakuragi/panel_11.png',
      title: DEFAULT_MANGA_SCENE01_TITLE,
      footerLead: '最後の日に会った女性で\n卒業したら',
      footerHeadline: '[red:ヤバすぎた]',
      footerStartFrame: 74,
      durationFrames: 120,
      focusLines: true,
      fallingMangaBg: true,
      motionStyle: 'zoom-out',
      dialogues: [
        {
          text: '最後の日に会った女性で 卒業したら……ヤバすぎた',
          speaker: 'ryusei',
          durationFrames: 120
        }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_01.png',
      title: '深夜の[red:森の中]',
      footerHeadline: '車の中で独り\n[red:誰か]を待つ男',
      footerStartFrame: 38,
      durationFrames: 94,
      dialogues: [
        { text: '深夜の森の中 車の中で独り誰かを待つ男', speaker: 'ryusei', durationFrames: 94 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_02a.png',
      durationFrames: 137,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_02a.png',
          text: '[pink:初めまして]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: '初めまして',
          durationFrames: 45
        },
        {
          mediaUrl: '/manga/sakuragi/panel_02b.png',
          text: 'そこに若い女の子が現れ\n男は彼女を車へ迎え入れた',
          textPosition: 'bottom',
          speaker: 'narrator',
          dialogueText: 'そこに若い女の子が現れ 男は彼女を車へ迎え入れた',
          durationFrames: 92
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_04.png',
      durationFrames: 161,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_04.png',
          text: '[pink:すみません何もかも]\n[pink:用意してもらって…]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: 'すみません、何もかも用意してもらって…',
          durationFrames: 74
        },
        {
          mediaUrl: '/manga/sakuragi/panel_04.png',
          text: '[blue:来て貰えただけで嬉しいです]',
          textPosition: 'top',
          speaker: 'male',
          dialogueText: '来て貰えただけで嬉しいです',
          durationFrames: 48
        },
        {
          mediaUrl: '',
          text: '[blue:ひとりだと心細く...]',
          textPosition: 'top',
          speaker: 'male',
          dialogueText: 'ひとりだと心細く...',
          durationFrames: 39
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_03a.png',
      title: '[red:SNS]をきっかけに\n集まった彼らは',
      footerHeadline: '互いに[red:人生]に\n絶望していた',
      footerStartFrame: 64,
      durationFrames: 116,
      dialogues: [
        { text: 'SNSをきっかけに集まった彼らは 互いに人生に絶望していた', speaker: 'ryusei', durationFrames: 116 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_06a.png',
      durationFrames: 79,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_06a.png',
          text: '[blue:お若いのになんでこんなことを…？]',
          textPosition: 'top',
          speaker: 'male',
          dialogueText: 'お若いのになんでこんなことを…？',
          durationFrames: 46
        },
        {
          mediaUrl: '/manga/sakuragi/panel_06b.png',
          text: '[pink:イジメですね…]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: 'イジメですね…',
          durationFrames: 33
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_07.png',
      title: 'どうやら[red:根暗]で\n愛想が悪いことが',
      footerHeadline: '[red:ターゲット]にされた\n原因なのだという',
      footerStartFrame: 57,
      durationFrames: 113,
      dialogues: [
        { text: 'どうやら根暗で愛想が悪いことが ターゲットにされた原因なのだという', speaker: 'ryusei', durationFrames: 113 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_08a.png',
      durationFrames: 170,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_08a.png',
          text: '[pink:お兄さんは借金が理由でしたっけ]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: 'お兄さんは借金が理由でしたっけ',
          durationFrames: 66
        },
        {
          mediaUrl: '/manga/sakuragi/panel_08b.png',
          text: '男は毎日残業に追われ\n稼いだ金も借金に消えていた',
          textPosition: 'top',
          speaker: 'narrator',
          dialogueText: '男は毎日残業に追われ、稼いだ金も借金に消えていた',
          durationFrames: 104
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_09.png',
      durationFrames: 145,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_09.png',
          text: '[pink:でも今日で]\n[pink:苦しいのも終わり]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: 'でも今日で苦しいのも終わり',
          durationFrames: 58
        },
        {
          mediaUrl: '',
          text: 'いざ準備に取り掛かると\n男は思い悩んでしまう',
          textPosition: 'top',
          speaker: 'narrator',
          dialogueText: 'いざ準備に取り掛かると 男は思い悩んでしまう',
          durationFrames: 87
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_10a.png',
      durationFrames: 161,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_10a.png',
          text: '[pink:やり残したことでもあるんですか…？]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: 'やり残したことでもあるんですか…？',
          durationFrames: 58
        },
        {
          mediaUrl: '/manga/sakuragi/panel_10b.png',
          text: '[blue:なけなしの財産で最後の晩餐をと]',
          textPosition: 'top',
          speaker: 'male',
          dialogueText: 'なけなしの財産で最後の晩餐をと',
          durationFrames: 52
        },
        {
          mediaUrl: '',
          text: '[blue:でもまったく食欲わかなくて…]',
          textPosition: 'top',
          speaker: 'male',
          dialogueText: 'でもまったく食欲わかなくて…',
          durationFrames: 51
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_05a.png',
      durationFrames: 152,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_05a.png',
          text: '[blue:どうせなら初めてを卒業したかったな…]',
          textPosition: 'top',
          speaker: 'male',
          dialogueText: 'どうせなら初めてを卒業したかったな…',
          durationFrames: 68
        },
        {
          mediaUrl: '/manga/sakuragi/panel_05b.png',
          text: '最後の日だと言うのに\n突然未練を語り始めた男',
          textPosition: 'bottom',
          speaker: 'narrator',
          dialogueText: '最後の日だと言うのに 突然未練を語り始めた男',
          durationFrames: 84
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_11.png',
      durationFrames: 160,
      panels: [
        {
          mediaUrl: '/manga/sakuragi/panel_11.png',
          text: 'すると彼女から',
          textPosition: 'top',
          speaker: 'narrator',
          dialogueText: 'すると彼女から',
          durationFrames: 34
        },
        {
          mediaUrl: '',
          text: '[pink:じゃあ未練]\n[pink:解消しましょうか]',
          textPosition: 'top',
          speaker: 'female',
          dialogueText: 'じゃあ未練 解消しましょうか',
          durationFrames: 61
        },
        {
          mediaUrl: '',
          text: '[pink:私の身体なら]\n[pink:お好きにどうぞ…]',
          textPosition: 'bottom',
          speaker: 'female',
          dialogueText: '私の身体なら お好きにどうぞ…',
          durationFrames: 65
        }
      ],
      dialogues: []
    },
    {
      mediaUrl: '/manga/sakuragi/panel_01.png',
      mediaPreset: 'manga-description-guide',
      title: '作品の詳細は動画の\n[red:説明欄]からチェックしてね！',
      footerHeadline: '説明欄は右上の[red:3点]を押す\nor\n左下の[red:タイトル]から',
      footerStartFrame: 20,
      durationFrames: 94,
      dialogues: [
        {
          text: '作品の詳細は動画の 説明欄からチェックしてね！',
          speaker: 'ryusei',
          durationFrames: 94
        }
      ]
    }
  ];

  return createMangaShortsSpec({
    id: 'blank-manga',
    title,
    scenes: blankScenes
  });
}
