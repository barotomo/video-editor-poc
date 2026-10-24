export type TemplateType = 'text-card' | 'code-block' | 'social-post' | 'stat-graph';

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

export type SceneProps = TextCardProps | CodeBlockProps | SocialPostProps | StatGraphProps;

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

