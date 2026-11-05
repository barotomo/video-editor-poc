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

    // ダイアログの durationFrames 自動補正
    const dialogues = input.dialogues.map((d) => {
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
 * 新規漫画作品をゼロから作成する際のブランク（未入力）テンプレートSpec
 */
export function createBlankMangaShortsSpec(customTitle?: string): VideoSpec {
  const title = customTitle || '新規漫画紹介ショート (テンプレート)';
  const blankScenes: MangaSceneInput[] = [
    {
      mediaUrl: '/manga/sakuragi/panel_11.png',
      title: DEFAULT_MANGA_SCENE01_TITLE,
      footerLead: '[blue:衝撃の展開]に直面\nしてしまった主人公が',
      footerHeadline: '[red:ヤバすぎた]',
      footerStartFrame: 80,
      focusLines: true,
      dialogues: [
        {
          text: '衝撃の展開に直面してしまった主人公がヤバすぎた',
          speaker: 'ryusei',
          durationFrames: 100
        }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_02a.png',
      secondaryMediaUrl: '/manga/sakuragi/panel_02b.png',
      title: '[pink:セリフを入力してください]',
      footerHeadline: 'と状況を説明するナレーション',
      footerStartFrame: 50,
      dialogues: [
        { text: '「セリフを入力してください」', speaker: 'tsumugi', durationFrames: 50 },
        { text: 'と状況を説明するナレーション', speaker: 'ryusei', durationFrames: 70 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_03a.png',
      secondaryMediaUrl: '/manga/sakuragi/panel_03b.png',
      title: '二人の日常や関係性の描写',
      footerHeadline: '普段の様子をナレーション',
      dialogues: [
        { text: '二人の日常や関係性の描写', speaker: 'ryusei', durationFrames: 70 },
        { text: '普段の様子をナレーション', speaker: 'ryusei', durationFrames: 80 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_04.png',
      title: '日常に訪れる小さな変化',
      footerHeadline: '変化に気づくモノローグ',
      dialogues: [
        { text: '日常に訪れる小さな変化', speaker: 'ryusei', durationFrames: 70 },
        { text: '変化に気づくモノローグ', speaker: 'ryusei', durationFrames: 70 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_05.png',
      title: 'ライバルの存在や新たな事実',
      footerHeadline: '主人公の前に立ちはだかる壁',
      dialogues: [
        { text: 'ライバルの存在や新たな事実', speaker: 'ryusei', durationFrames: 75 },
        { text: '主人公の前に立ちはだかる壁', speaker: 'ryusei', durationFrames: 80 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_06.png',
      title: '[pink:『自信のない私の提案』]',
      footerHeadline: '思い切って口に出してみるが',
      dialogues: [
        { text: '自信のない私の提案', speaker: 'tsumugi', durationFrames: 60 },
        { text: 'と思い切って口に出してみるが', speaker: 'ryusei', durationFrames: 85 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_07.png',
      title: '[blue:そんなことないよ]',
      footerHeadline: 'と優しく肯定してくれる相手',
      dialogues: [
        { text: 'そんなことないよ。お前は素敵だよ', speaker: 'takehiro', durationFrames: 60 },
        { text: 'と優しく肯定してくれる相手', speaker: 'ryusei', durationFrames: 70 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_08a.png',
      secondaryMediaUrl: '/manga/sakuragi/panel_08b.png',
      title: 'しかし不穏な知らせが届く',
      footerHeadline: '周囲のからかいと募る不安',
      dialogues: [
        { text: 'しかし不穏な知らせが届く', speaker: 'ryusei', durationFrames: 75 },
        { text: '周囲のからかいと募る不安', speaker: 'ryusei', durationFrames: 75 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_09a.png',
      secondaryMediaUrl: '/manga/sakuragi/panel_09b.png',
      title: '仲間からの[red:アドバイス]',
      footerHeadline: 'ついに決意を固める主人公',
      dialogues: [
        { text: '仲間からの温かいアドバイスをもらい', speaker: 'ryusei', durationFrames: 75 },
        { text: 'ついに決意を固める主人公', speaker: 'ryusei', durationFrames: 75 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_10a.png',
      secondaryMediaUrl: '/manga/sakuragi/panel_10b.png',
      title: '思い立ったらすぐ行動',
      footerHeadline: '真実を確かめるため扉を開くと',
      dialogues: [
        { text: '思い立ったらすぐ行動へ移る彼女', speaker: 'ryusei', durationFrames: 70 },
        { text: '真実を確かめるため扉を開くと', speaker: 'ryusei', durationFrames: 65 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_11.png',
      title: '[red:そこには信じられない光景が…]',
      footerHeadline: '衝撃の結末は本編で…',
      dialogues: [
        { text: 'そこには信じられない光景が…', speaker: 'ryusei', durationFrames: 85 }
      ]
    },
    {
      mediaUrl: '/manga/sakuragi/panel_01.png',
      title: '作品の詳細は動画の\n[red:説明欄]からチェックしてね！',
      footerHeadline: '説明欄は右上の[red:3点]を押す\nor\n左下の[red:タイトル]から',
      footerStartFrame: 20,
      dialogues: [
        {
          text: '作品の詳細は動画の説明欄からチェックしてね！',
          speaker: 'ryusei',
          durationFrames: 85
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
