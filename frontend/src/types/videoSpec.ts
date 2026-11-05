export type TemplateType =
  | 'text-card'
  | 'code-block'
  | 'social-post'
  | 'stat-graph'
  | 'editorial-kinetic'
  | 'editorial-comparison'
  | 'editorial-workflow'
  | 'editorial-list';

export type EditorialTheme = 'light-grid' | 'dark' | 'accent' | 'manga-page' | 'manga-dark';
export type EditorialTransition = 'none' | 'blinds' | 'panel-wipe' | 'diagonal-wedge' | 'manga-slash';
export type EditorialBadgeType = 'none' | 'live-pill' | 'step-pill' | 'mono-label' | 'manga-box';
export type KineticMotionType = 'slide-up' | 'blur-in' | 'pop' | 'zoom-out' | 'typewriter';

export interface EditorialBaseProps extends BaseTemplateProps {
  theme?: EditorialTheme;
  accentColor?: string; // default '#e85222'
  transition?: EditorialTransition;
  badgeType?: EditorialBadgeType;
  badgeText?: string; // e.g. '速報', 'CHANGE 01', 'CHAPTER 01 - AIに頼む時代'
  stepNumber?: string; // e.g. '①', '②', '01'
  watermark?: string; // 背景の特大中抜き文字 e.g. '01', '02', '100%'
  /**
   * 複数行のキネティック見出し（改行区切りまたは配列）
   * インライン記法に対応:
   * - **テキスト** : アクセントカラー強調
   * - ==テキスト== : マーカー背景ボックスアニメーション
   * - __テキスト__ : 手書き風アンダーライン描画
   * - ~~テキスト~~ : 手書き風取り消し線アニメーション
   * - ((テキスト)) : 手書き風丸囲みアニメーション
   * - テキスト//   : 右上の強調スラッシュ演出
   */
  title: string;
  subtitle?: string;
  footerLead?: string; // フッターの主見出しの前に先行して表示されるリード文 (例: '[blue:衝撃の光景]を目の当たり\nにしてしまった女の子が')
  footerLeadStartFrame?: number; // リード文の出現フレーム (未指定時は2フレーム目)
  footerHeadline?: string; // 下部に遅れて出る結論コピー (例: 'こういう作業が、\n**結構多い。**')
  footerStartFrame?: number; // 下部コピー・2枚目画像の出現フレーム (未指定時は2セリフ目の開始フレーム)
  caption?: string; // 注釈テキスト (例: '※ピーク輝度', 'IMAGE: APPLE')
  motionStyle?: KineticMotionType;
  focusLines?: boolean; // 集中線アニメーション（オープニング強調・衝撃演出）
  fallingMangaBg?: boolean; // 背景で漫画単行本・原稿が上から下に流れる演出（漫画テーマ時はデフォルトON）
  backdropBlurImage?: string; // 背景に直前シーンの漫画コマ・要素をぼかしてうっすら敷く (例: '/manga/sakuragi/panel_11.png')
  hideBottomSubtitle?: boolean; // trueなら下部の汎用字幕ボックスを非表示にする（デフォルトtrue）
  soundEffects?: { frame: number; src: string; volume?: number; durationFrames?: number }[];
  transitionSE?: string; // シーン切り替え時の効果音
  textTriggerSE?: string; // テキスト・2コマ目出現時の効果音
  punchlineTriggerSE?: string; // 着弾パンチライン出現時の効果音 (シーン01等)
  durationFrames?: number; // シーン全体の表示フレーム数（コマやボイスの合計フレーム）
}

export type EditorialMediaPreset =
  | 'none'
  | 'image'
  | 'manga-panel'
  | 'fold-phone'
  | 'phone-chat-overflow'
  | 'phone-toggle-ai'
  | 'fold-icon-2x'
  | 'fold-split-callouts'
  | 'tablet-hero'
  | 'tablet-oled'
  | 'tablet-thin'
  | 'tablet-dual-stack'
  | 'manga-description-guide';

export interface MangaPanelSpec {
  mediaUrl: string;
  text?: string;
  textPosition?: 'top' | 'bottom';
  speaker?: 'tsumugi' | 'takehiro' | 'ryusei' | string;
  dialogueText?: string;
  durationFrames?: number;
  audioUrl?: string;
  triggerSE?: string;
  punchlineTriggerSE?: string; // シーン01着弾パンチライン用効果音
}

export interface EditorialKineticProps extends EditorialBaseProps {
  mediaPreset?: EditorialMediaPreset;
  mediaUrl?: string;
  secondaryMediaUrl?: string; // シーン後半（2セリフ目）で切り替わる2コマ目の画像URL
  panels?: MangaPanelSpec[]; // 複数コマ（コマ1、コマ2、コマN）の順次切り替え設定
  ctaArrow?: boolean; // 最終CTA用の概要欄誘導アニメーション矢印
  mediaCredit?: string; // e.g. 'IMAGE: APPLE'
  callouts?: {
    label: string;
    accent?: boolean;
  }[];
  summaryCards?: {
    icon: 'screen' | 'size' | 'waterproof' | 'chip' | 'camera' | 'sparkle';
    label: string;
  }[];
  summaryHeading?: string; // e.g. '▼ ポイントをまとめていきます'
}

export type EditorialComparisonMode =
  | 'cards-2'
  | 'bars-vertical'
  | 'bars-horizontal'
  | 'devices-3';

export type ComparisonCardVisual =
  | 'plain'
  | 'glow-dim'
  | 'glow-bright'
  | 'glare-standard'
  | 'glare-nano'
  | 'fps-60'
  | 'fps-120'
  | 'bezel-thick'
  | 'bezel-thin';

export interface EditorialComparisonItem {
  label: string;
  sublabel?: string;
  valueText?: string; // e.g. '78,800円', '6.3mm', '500ニト'
  numericValue?: number; // 0-100 for bars/percentages
  accent?: boolean;
  visual?: ComparisonCardVisual;
  badge?: string;
}

export interface EditorialComparisonProps extends EditorialBaseProps {
  comparisonMode: EditorialComparisonMode;
  items: EditorialComparisonItem[];
  thresholdLabel?: string; // e.g. '10万円のライン'
  thresholdValue?: number; // 0-100
  diffLabel?: string; // e.g. '+4万円', '-0.9mm', '-24%'
  secondaryComparison?: {
    heading: string; // e.g. '重さは'
    fromLabel: string; // e.g. '293g'
    toLabel: string; // e.g. '255g'
    diffText: string; // e.g. '-38g'
  };
  showArrowBetweenCards?: boolean;
}

export type EditorialWorkflowMode =
  | 'vertical-loop'
  | 'day-slots'
  | 'horizontal-timeline';

export interface EditorialWorkflowStep {
  label: string;
  sublabel?: string;
  timeOrDate?: string; // e.g. '10/26', 'コンビニ 5分'
  positionPercent?: number; // day-slots用 (e.g. 25, 50, 78)
  accent?: boolean;
}

export interface EditorialWorkflowProps extends EditorialBaseProps {
  workflowMode: EditorialWorkflowMode;
  steps: EditorialWorkflowStep[];
  loopLabel?: string; // e.g. 'また頼む'
  dayStartLabel?: string; // e.g. '9:00'
  dayEndLabel?: string; // e.g. '21:00'
  ctaButtonText?: string; // e.g. '+ フォロー'
  ctaSubtext?: string; // e.g. 'ご視聴ありがとうございました'
}

export type EditorialListMode =
  | 'checklist'
  | 'comments'
  | 'calendar'
  | 'weekdays-cta';

export interface EditorialListItem {
  text: string;
  subtext?: string; // checklistの横補足 or commentsのユーザーID (@user_2081)
  tag?: 'today' | 'preorder' | 'release';
}

export interface EditorialListProps extends EditorialBaseProps {
  listMode: EditorialListMode;
  items: EditorialListItem[];
  showTopCard?: boolean;
  topCardLabel?: string;
  brandFooter?: string; // e.g. 'PAULNOROMAN.'
}

export type SpeakerEmotion = 'normal' | 'happy' | 'thinking' | 'surprised' | 'explaining' | 'sad' | 'angry';

export interface ElementTransform {
  x?: number;     // % (e.g. 0% is left/center, -50 ~ 50)
  y?: number;     // % (e.g. -50 ~ 50)
  scale?: number; // e.g. 1.0 = 100%, 1.2 = 120%
  width?: number; // %
}

export interface Dialogue {
  id?: string;
  speaker?: string; // キャラ(オプション)。e.g. 'zundamon', 'shikotan'。未指定なら字幕のみ
  emotion?: SpeakerEmotion;
  text: string;
  audioUrl?: string; // ボイス音声(オプション)。e.g. '/voices/line1.mp3'
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

export type SceneProps =
  | TextCardProps
  | CodeBlockProps
  | SocialPostProps
  | StatGraphProps
  | EditorialKineticProps
  | EditorialComparisonProps
  | EditorialWorkflowProps
  | EditorialListProps;

export const isEditorialTemplate = (template: TemplateType): boolean =>
  template.startsWith('editorial-');

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
  syncVersion?: string;
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

