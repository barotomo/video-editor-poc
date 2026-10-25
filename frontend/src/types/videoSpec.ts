export type TemplateType = 'text-card' | 'code-block' | 'social-post' | 'stat-graph' | 'video-clip';

export type SpeakerEmotion = 'normal' | 'happy' | 'thinking' | 'surprised' | 'explaining' | 'sad' | 'angry';

export interface ElementTransform {
  x?: number;     // % (e.g. 0% is left/center, -50 ~ 50)
  y?: number;     // % (e.g. -50 ~ 50)
  scale?: number; // e.g. 1.0 = 100%, 1.2 = 120%
  width?: number; // %
}

export interface Dialogue {
  id?: string;
  speaker: string; // e.g. 'zundamon', 'shikotan'
  emotion?: SpeakerEmotion;
  text: string;
  audioUrl?: string;
  durationFrames: number;
  transform?: ElementTransform; // アバター個別の位置・倍率
  facing?: 'left' | 'right'; // キャラの向き(画面から見て)。未指定なら配置位置に応じて画面中央を向く
}

export interface BaseTemplateProps {
  transform?: ElementTransform; // スライド要素全体の位置・倍率
}

export interface TextCardProps extends BaseTemplateProps {
  title: string;
  subtitle?: string;
  badge?: string;
  themeColor?: string;
}

export interface CodeBlockProps extends BaseTemplateProps {
  title?: string;
  language: string;
  code: string;
  fileName?: string;
  highlightLine?: number;
}

export interface SocialPostProps extends BaseTemplateProps {
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  content: string;
  timestamp?: string;
  likesCount?: string;
  repostsCount?: string;
}

export interface StatGraphProps extends BaseTemplateProps {
  title: string;
  subtitle?: string;
  items: {
    label: string;
    value: number;
    color?: string;
  }[];
}

/** アニメ切り抜き / 動画クリップ用テンプレートProps (ショート動画向け) */
export interface VideoClipProps extends BaseTemplateProps {
  videoUrl: string;             // 動画URL・パス (e.g. '/videos/yanineko_raw_clip.mp4')
  title?: string;               // フォールバック用タイトル（セリフ未指定時に上部表示）
  logoUrl?: string;             // 下部に配置するロゴ画像URL (e.g. '/logos/yanineko_logo.svg')
  logoText?: string;            // ロゴ代替テキスト
  logoSubtext?: string;         // 下部補足テキスト (e.g. 'アニメ『ヤニねこ』公式切り抜き')
  backgroundColor?: string;     // 背景色 (デフォルト '#ffffff')
  textColor?: string;           // 上部セリフ文字色 (デフォルト '#000000')
  accentColor?: string;         // 強調色
  showSpeakerAvatar?: boolean;  // 立ち絵アバターを表示するか (デフォルト: false)
  showSubtitleBox?: boolean;    // 下部通常字幕ボックスを表示するか (デフォルト: false)
  videoFit?: 'contain' | 'cover';
  videoStartTime?: number;      // 動画再生開始秒 (秒数)
  videoVolume?: number;         // 音量 (0~1)
}

export type SceneProps =
  | TextCardProps
  | CodeBlockProps
  | SocialPostProps
  | StatGraphProps
  | VideoClipProps;

export interface Scene {
  id: string;
  template: TemplateType;
  props: SceneProps;
  dialogues: Dialogue[];
  transform?: ElementTransform;
}

export interface SpeakerInfo {
  id: string;
  name: string;
  color: string;
  avatarBg: string;
  iconText: string;
  avatarImage?: string; // 立ち絵画像パス (e.g. '/tachie/zundamon.png') - 単一画像フォールバック用
  avatarBasePath?: string; // ポーズ別画像のベースディレクトリ (e.g. '/tachie/zundamon/')
  spriteFacing?: 'left' | 'right'; // 立ち絵画像の元の向き(画面から見て)。セリフの向き指定に合わせて左右反転する基準
  defaultTransform?: ElementTransform;
}

export interface VideoSpec {
  title: string;
  fps: number;
  width: number;
  height: number;
  bgmUrl?: string;
  bgmVolume?: number;
  speakers: Record<string, SpeakerInfo>;
  scenes: Scene[];
}

export const VIDEO_SPEC_VERSION = '1.0';

/** 動画フォーマット: 通常動画 (横 16:9) / ショート動画 (縦 9:16) */
export type VideoFormat = 'landscape' | 'shorts';

export const VIDEO_FORMATS: Record<
  VideoFormat,
  { label: string; icon: string; ratio: string; width: number; height: number }
> = {
  landscape: { label: '通常動画', icon: '🖥️', ratio: '16:9', width: 1280, height: 720 },
  shorts: { label: 'ショート動画', icon: '📱', ratio: '9:16', width: 1080, height: 1920 }
};

/** 幅と高さから縦動画（ショート）かどうかを判定 */
export const isPortraitSize = (width?: number, height?: number): boolean =>
  !!width && !!height && height > width;

/** VideoSpec のサイズからフォーマットを判定 */
export const getVideoFormat = (spec: Pick<VideoSpec, 'width' | 'height'>): VideoFormat =>
  isPortraitSize(spec.width, spec.height) ? 'shorts' : 'landscape';

