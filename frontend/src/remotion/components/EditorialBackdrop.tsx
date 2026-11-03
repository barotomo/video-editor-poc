import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, Img } from 'remotion';
import type { EditorialBaseProps, KineticMotionType } from '../../types/videoSpec';
import { useLayout, useGlobalFrame } from '../useLayout';

const FALLING_MANGA_PANELS = [
  'manga/sakuragi/panel_02a.png',
  'manga/sakuragi/panel_03a.png',
  'manga/sakuragi/panel_04.png',
  'manga/sakuragi/panel_05a.png',
  'manga/sakuragi/panel_06a.png',
  'manga/sakuragi/panel_07.png',
  'manga/sakuragi/panel_08a.png',
  'manga/sakuragi/panel_09.png',
  'manga/sakuragi/panel_10a.png',
  'manga/sakuragi/panel_03b.png'
];

export const DEFAULT_ACCENT = '#e85222';

export const getEditorialPalette = (
  theme: EditorialBaseProps['theme'] = 'light-grid',
  accentColor: string = DEFAULT_ACCENT
) => {
  if (theme === 'dark' || theme === 'manga-dark') {
    return {
      bg: '#121212',
      text: '#f5f4ef',
      muted: '#a1a1aa',
      accent: accentColor,
      cardBg: '#1c1c1c',
      cardBorder: theme === 'manga-dark' ? '#f5f4ef' : 'rgba(255,255,255,0.12)',
      watermarkStroke: 'rgba(255,255,255,0.18)'
    };
  }
  if (theme === 'accent') {
    return {
      bg: accentColor,
      text: '#ffffff',
      muted: 'rgba(255,255,255,0.85)',
      accent: '#181818',
      cardBg: '#ffffff',
      cardBorder: 'rgba(255,255,255,0.3)',
      watermarkStroke: 'rgba(255,255,255,0.38)'
    };
  }
  if (theme === 'manga-page') {
    return {
      bg: '#f7f5ee',
      text: '#141414',
      muted: '#52514c',
      accent: accentColor,
      cardBg: '#ffffff',
      cardBorder: '#141414',
      watermarkStroke: 'rgba(20,20,20,0.13)'
    };
  }
  return {
    bg: '#f4f3ee',
    text: '#181818',
    muted: '#6b6a65',
    accent: accentColor,
    cardBg: '#ffffff',
    cardBorder: 'rgba(24,24,24,0.08)',
    watermarkStroke: 'rgba(24,24,24,0.10)'
  };
};

interface Token {
  type:
    | 'plain'
    | 'accent'
    | 'pink'
    | 'blue'
    | 'red'
    | 'black'
    | 'box'
    | 'underline'
    | 'strike'
    | 'circle'
    | 'burst';
  content: string;
}

/**
 * インライン記法パーサー:
 * [pink:女性セリフ] / [blue:男性セリフ] / [red:赤強調] / [black:黒ナレーション]
 * **強調** / ==マーカーボックス== / __下線__ / ~~取消線~~ / ((丸囲み)) / テキスト//
 */
const parseInlineTokens = (line: string): Token[] => {
  const regex =
    /(\[(?:pink|blue|red|black):[^\]]+\]|\*\*[^*]+\*\*|==[^=]+==|__[^_]+__|~~[^~]+~~|\(\([^)]+\)\)|[^\s*=_~()[\]]+?\/\/)/g;
  const result: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'plain', content: line.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith('[pink:') && raw.endsWith(']')) {
      result.push({ type: 'pink', content: raw.slice(6, -1) });
    } else if (raw.startsWith('[blue:') && raw.endsWith(']')) {
      result.push({ type: 'blue', content: raw.slice(6, -1) });
    } else if (raw.startsWith('[red:') && raw.endsWith(']')) {
      result.push({ type: 'red', content: raw.slice(5, -1) });
    } else if (raw.startsWith('[black:') && raw.endsWith(']')) {
      result.push({ type: 'black', content: raw.slice(7, -1) });
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      result.push({ type: 'accent', content: raw.slice(2, -2) });
    } else if (raw.startsWith('==') && raw.endsWith('==')) {
      result.push({ type: 'box', content: raw.slice(2, -2) });
    } else if (raw.startsWith('__') && raw.endsWith('__')) {
      result.push({ type: 'underline', content: raw.slice(2, -2) });
    } else if (raw.startsWith('~~') && raw.endsWith('~~')) {
      result.push({ type: 'strike', content: raw.slice(2, -2) });
    } else if (raw.startsWith('((') && raw.endsWith('))')) {
      result.push({ type: 'circle', content: raw.slice(2, -2) });
    } else if (raw.endsWith('//')) {
      result.push({ type: 'burst', content: raw.slice(0, -2) });
    } else {
      result.push({ type: 'plain', content: raw });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    result.push({ type: 'plain', content: line.slice(lastIndex) });
  }
  return result;
};

interface KineticRichTextProps {
  text: string;
  startFrame?: number;
  lineDelay?: number;
  fontSize?: number;
  lineHeight?: number;
  color?: string;
  accentColor?: string;
  theme?: EditorialBaseProps['theme'];
  motionStyle?: KineticMotionType;
  fontWeight?: number;
  align?: 'left' | 'center';
  mangaExtruded?: boolean;
}

export const KineticRichText: React.FC<KineticRichTextProps> = ({
  text,
  startFrame = 0,
  lineDelay = 8,
  fontSize = 66,
  lineHeight = 1.24,
  color = '#181818',
  accentColor = DEFAULT_ACCENT,
  theme = 'light-grid',
  motionStyle = 'blur-in',
  fontWeight = 900,
  align = 'left',
  mangaExtruded = false
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text) return null;
  const lines = text.split('\n');

  // インライン装飾タグを除いた各行の表示文字数を計測し、
  // 文字数が少ない（横に余裕がある）テキストほど程よく横幅を占めるよう文字サイズを自動拡大する
  const maxLineChars = Math.max(
    1,
    ...lines.map(line =>
      parseInlineTokens(line).reduce((sum, tok) => sum + Array.from(tok.content).length, 0)
    )
  );

  const effectiveFontSize = (() => {
    if (!mangaExtruded) return fontSize;
    // 「ヤバすぎた」(5文字) のような短い1行パンチラインはインパクトが出るよう大きめ(最大132px)に拡大し、
    // 9〜12文字の通常行は画面幅の約80〜85%(845〜875px程度)、13〜14文字以上は元のサイズ(72px/68px)を維持する
    const isShortPunchline = lines.length === 1 && maxLineChars <= 6;
    const isTitleScale = fontSize >= 70;
    const targetWidthPx = isShortPunchline ? 680 : isTitleScale ? 875 : 845;
    const maxAllowedFontSize = isShortPunchline ? 132 : isTitleScale ? 90 : 84;
    const charAdvanceRatio = 0.97; // letterSpacing: -0.02em〜-0.03em 相当
    const autoSized = Math.round(targetWidthPx / (maxLineChars * charAdvanceRatio));
    return Math.min(maxAllowedFontSize, Math.max(fontSize, autoSized));
  })();

  // 漫画ショート風・白フチ＋立体押し出しシャドウスタイル
  const extrudedBaseStyle: React.CSSProperties = mangaExtruded
    ? {
        WebkitTextStroke: `${Math.max(8, Math.round(effectiveFontSize * 0.19))}px #ffffff`,
        paintOrder: 'stroke fill',
        filter:
          'drop-shadow(0px 4px 0px #8a8a8a) drop-shadow(0px 7px 0px #383838) drop-shadow(0px 10px 10px rgba(0,0,0,0.32))',
        fontFamily:
          "'M PLUS Rounded 1c', 'Hiragino Kaku Gothic StdN', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
        fontWeight: 900,
        letterSpacing: '-0.02em'
      }
    : {};

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        gap: `${Math.round(effectiveFontSize * (mangaExtruded ? 0.14 : 0.12))}px`,
        width: '100%'
      }}
    >
      {lines.map((line, lineIdx) => {
        const localFrame = frame - (startFrame + lineIdx * lineDelay);
        const revealSpring = spring({
          frame: Math.max(0, localFrame),
          fps,
          config: { damping: 14, stiffness: 150, mass: 0.7 }
        });

        const decorSpring = spring({
          frame: Math.max(0, localFrame - 6),
          fps,
          config: { damping: 16, stiffness: 120 }
        });

        const translateY =
          motionStyle === 'slide-up'
            ? interpolate(revealSpring, [0, 1], [36, 0])
            : motionStyle === 'pop'
            ? interpolate(revealSpring, [0, 1], [18, 0])
            : motionStyle === 'zoom-out'
            ? interpolate(revealSpring, [0, 1], [-12, 0])
            : interpolate(revealSpring, [0, 1], [20, 0]);

        const scale =
          motionStyle === 'pop'
            ? interpolate(revealSpring, [0, 0.7, 1], [0.86, 1.03, 1])
            : motionStyle === 'zoom-out'
            ? interpolate(revealSpring, [0, 1], [1.36, 1])
            : 1;

        const blurPx =
          motionStyle === 'blur-in'
            ? interpolate(revealSpring, [0, 1], [14, 0])
            : motionStyle === 'zoom-out'
            ? interpolate(revealSpring, [0, 1], [10, 0])
            : 0;

        const opacity = localFrame < 0 ? 0 : interpolate(revealSpring, [0, 0.5, 1], [0, 0.85, 1]);

        // タイプライターモードの場合
        const visibleChars =
          motionStyle === 'typewriter'
            ? Math.max(0, Math.floor(localFrame * 0.9))
            : 9999;

        const tokens =
          motionStyle === 'typewriter'
            ? [{ type: 'plain' as const, content: line.slice(0, visibleChars) }]
            : parseInlineTokens(line);

        const effectiveAccent = theme === 'accent' ? '#181818' : accentColor;
        // 漫画立体文字モードでは地の文（ナレーション）は常に視認性の高い黒(#181818)
        const baseTextColor = mangaExtruded ? '#181818' : color;

        return (
          <div
            key={lineIdx}
            style={{
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none',
              fontSize: `${effectiveFontSize}px`,
              fontWeight,
              lineHeight,
              color: baseTextColor,
              letterSpacing: '-0.03em',
              textAlign: align,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: align === 'center' ? 'center' : 'flex-start',
              alignItems: 'baseline',
              columnGap: mangaExtruded ? '2px' : '4px',
              position: 'relative',
              width: '100%'
            }}
          >
            {tokens.map((tok, tIdx) => {
              if (tok.type === 'plain') {
                return (
                  <span key={tIdx} style={extrudedBaseStyle}>
                    {tok.content}
                  </span>
                );
              }
              if (tok.type === 'pink' || tok.type === 'blue' || tok.type === 'red' || tok.type === 'black') {
                const roleColor =
                  tok.type === 'pink'
                    ? '#f01c74' // 女性セリフ（マゼンタピンク）
                    : tok.type === 'blue'
                    ? '#2262dc' // 男性セリフ（ブルー）
                    : tok.type === 'red'
                    ? '#dc1e28' // 強調（レッド）
                    : '#181818'; // ナレーション（黒）
                return (
                  <span
                    key={tIdx}
                    style={{
                      ...extrudedBaseStyle,
                      color: roleColor,
                      display: 'inline-block',
                      transform: `scale(${interpolate(decorSpring, [0, 1], [0.94, 1])})`
                    }}
                  >
                    {tok.content}
                  </span>
                );
              }
              if (tok.type === 'accent') {
                return (
                  <span
                    key={tIdx}
                    style={{
                      ...extrudedBaseStyle,
                      color: effectiveAccent,
                      display: 'inline-block',
                      transform: `scale(${interpolate(decorSpring, [0, 1], [0.94, 1])})`
                    }}
                  >
                    {tok.content}
                  </span>
                );
              }
              if (tok.type === 'box') {
                return (
                  <span
                    key={tIdx}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      padding: '0 12px',
                      margin: '0 4px',
                      zIndex: 1
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        inset: '6% 0 4% 0',
                        backgroundColor:
                          theme === 'dark'
                            ? 'rgba(232, 82, 34, 0.28)'
                            : theme === 'accent'
                            ? 'rgba(24, 24, 24, 0.22)'
                            : 'rgba(232, 82, 34, 0.22)',
                        borderRadius: '8px',
                        transform: `scaleX(${decorSpring})`,
                        transformOrigin: 'left center',
                        zIndex: -1
                      }}
                    />
                    <span>{tok.content}</span>
                  </span>
                );
              }
              if (tok.type === 'underline') {
                return (
                  <span
                    key={tIdx}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      paddingBottom: '8px'
                    }}
                  >
                    <span>{tok.content}</span>
                    <svg
                      viewBox="0 0 200 18"
                      preserveAspectRatio="none"
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: '-4px',
                        width: '100%',
                        height: '16px',
                        overflow: 'visible'
                      }}
                    >
                      <path
                        d="M 2 11 Q 50 5, 100 11 T 198 9"
                        fill="none"
                        stroke={effectiveAccent}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="220"
                        strokeDashoffset={interpolate(decorSpring, [0, 1], [220, 0])}
                      />
                    </svg>
                  </span>
                );
              }
              if (tok.type === 'strike') {
                return (
                  <span
                    key={tIdx}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      color: theme === 'dark' ? '#6b7280' : '#8c8a82'
                    }}
                  >
                    <span>{tok.content}</span>
                    <svg
                      viewBox="0 0 200 20"
                      preserveAspectRatio="none"
                      style={{
                        position: 'absolute',
                        left: '-2%',
                        top: '44%',
                        width: '104%',
                        height: '16px',
                        overflow: 'visible'
                      }}
                    >
                      <path
                        d="M 0 10 L 200 8"
                        fill="none"
                        stroke={theme === 'dark' ? '#f5f4ef' : '#181818'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="210"
                        strokeDashoffset={interpolate(decorSpring, [0, 1], [210, 0])}
                      />
                    </svg>
                  </span>
                );
              }
              if (tok.type === 'circle') {
                return (
                  <span
                    key={tIdx}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      color: effectiveAccent,
                      padding: '0 14px',
                      margin: '0 4px'
                    }}
                  >
                    <span>{tok.content}</span>
                    <svg
                      viewBox="0 0 160 70"
                      preserveAspectRatio="none"
                      style={{
                        position: 'absolute',
                        inset: '-10px -8px',
                        width: 'calc(100% + 16px)',
                        height: 'calc(100% + 20px)',
                        overflow: 'visible',
                        pointerEvents: 'none'
                      }}
                    >
                      <ellipse
                        cx="80"
                        cy="35"
                        rx="74"
                        ry="29"
                        fill="none"
                        stroke={effectiveAccent}
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        transform="rotate(-4 80 35)"
                        strokeDasharray="360"
                        strokeDashoffset={interpolate(decorSpring, [0, 1], [360, 0])}
                      />
                    </svg>
                  </span>
                );
              }
              if (tok.type === 'burst') {
                return (
                  <span
                    key={tIdx}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      color: effectiveAccent,
                      paddingRight: '26px'
                    }}
                  >
                    <span>{tok.content}</span>
                    <svg
                      viewBox="0 0 36 36"
                      style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '-10px',
                        width: `${Math.round(fontSize * 0.52)}px`,
                        height: `${Math.round(fontSize * 0.52)}px`,
                        transform: `scale(${decorSpring})`,
                        transformOrigin: 'bottom left',
                        overflow: 'visible'
                      }}
                    >
                      <line x1="6" y1="22" x2="18" y2="4" stroke={effectiveAccent} strokeWidth="4.5" strokeLinecap="round" />
                      <line x1="14" y1="28" x2="32" y2="14" stroke={effectiveAccent} strokeWidth="4.5" strokeLinecap="round" />
                    </svg>
                  </span>
                );
              }
              return null;
            })}
          </div>
        );
      })}
    </div>
  );
};

interface EditorialBackdropProps {
  props: EditorialBaseProps;
  children?: React.ReactNode;
}

export const EditorialBackdrop: React.FC<EditorialBackdropProps> = ({ props, children }) => {
  const frame = useCurrentFrame();
  const globalFrame = useGlobalFrame();
  const { fps } = useVideoConfig();
  const { isPortrait } = useLayout();

  const theme = props.theme || 'light-grid';
  const accentColor = props.accentColor || DEFAULT_ACCENT;
  const palette = getEditorialPalette(theme, accentColor);

  const customX = props.transform?.x ?? 0;
  const customY = props.transform?.y ?? 0;
  const customScale = props.transform?.scale ?? 1.0;

  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 160 }
  });

  const footerStart = props.footerStartFrame ?? 28;
  const footerSpring = spring({
    frame: Math.max(0, frame - footerStart),
    fps,
    config: { damping: 14, stiffness: 140 }
  });

  // 1. ブラインドストライプ・トランジション (0〜14フレーム)
  const renderBlindsTransition = () => {
    if (props.transition !== 'blinds' || frame > 16) return null;
    const progress = interpolate(frame, [0, 14], [1, 0], { extrapolateRight: 'clamp' });
    const stripes = 7;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'none'
        }}
      >
        {Array.from({ length: stripes }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#f4f3ee',
              borderBottom: `14px solid ${accentColor}`,
              transform: `scaleY(${progress})`,
              transformOrigin: 'top center'
            }}
          />
        ))}
      </div>
    );
  };

  // 2. パネルワイプ・トランジション (0〜15フレーム)
  const renderPanelWipeTransition = () => {
    if (props.transition !== 'panel-wipe' || frame > 16) return null;
    const x1 = interpolate(frame, [0, 12], [0, -105], { extrapolateRight: 'clamp' });
    const x2 = interpolate(frame, [2, 14], [0, -105], { extrapolateRight: 'clamp' });
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#7c7b76',
            transform: `translateX(${x2}%)`
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#181818',
            transform: `translateX(${x1}%)`
          }}
        />
      </div>
    );
  };

  // 3. 斜めウェッジ装飾 (iPhone Duo 冒頭のような右上斜めオレンジ帯)
  const renderDiagonalWedge = () => {
    if (props.transition !== 'diagonal-wedge') return null;
    const wedgeSpring = spring({
      frame: Math.max(0, frame - 8),
      fps,
      config: { damping: 16, stiffness: 100 }
    });
    const slideX = interpolate(wedgeSpring, [0, 1], [320, 0]);
    return (
      <div
        style={{
          position: 'absolute',
          top: '-5%',
          right: '-12%',
          width: '48%',
          height: '110%',
          backgroundColor: accentColor,
           opacity: 0.72,
          transform: `translateX(${slideX}px) rotate(-18deg)`,
          transformOrigin: 'top right',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
    );
  };

  // 4. ダークテーマ時のコーナー回転アーク装飾
  const renderDarkCornerArcs = () => {
    if (theme !== 'dark') return null;
    const rot = frame * 1.2;
    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '-70px',
            left: '-70px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            border: '1.5px dashed rgba(255,255,255,0.14)',
            transform: `rotate(${rot}deg)`,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '120px',
            right: '-60px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.12)',
            borderTopColor: accentColor,
            transform: `rotate(${-rot * 0.8}deg)`,
            pointerEvents: 'none'
          }}
        />
      </>
    );
  };

  const isMangaTheme = theme === 'manga-page' || theme === 'manga-dark';

  // 4b. 漫画斜めカッティングワイプ (manga-slash: コマ枠のガター線で上下左右にスパッと割れる演出)
  const renderMangaSlashTransition = () => {
    if (props.transition !== 'manga-slash' || frame > 16) return null;
    const progress = interpolate(frame, [0, 14], [0, 115], { extrapolateRight: 'clamp' });
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 55, pointerEvents: 'none', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-25%',
            left: '-20%',
            width: '140%',
            height: '80%',
            backgroundColor: '#141414',
            borderBottom: `10px solid ${accentColor}`,
            transform: `translateY(-${progress}%) rotate(-7deg)`
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-25%',
            left: '-20%',
            width: '140%',
            height: '80%',
            backgroundColor: '#f7f5ee',
            borderTop: '8px solid #141414',
            transform: `translateY(${progress}%) rotate(-7deg)`
          }}
        />
      </div>
    );
  };

  // 4c. 漫画原稿用紙フレーム・スクリーントーン・背景斜めコマ割り線
  const renderMangaPageDecor = () => {
    if (!isMangaTheme) return null;
    const isDarkManga = theme === 'manga-dark';
    const isPinkScene01 = Boolean(props.focusLines || props.watermark === '01');
    const borderColor = isPinkScene01
      ? '#f48fb1'
      : isDarkManga
      ? 'rgba(255,255,255,0.32)'
      : '#141414';
    const dotColor = isDarkManga ? 'rgba(255,255,255,0.14)' : 'rgba(20,20,20,0.13)';

    return (
      <>
        {/* 1. コーナーのアミ点スクリーントーン */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '55%',
            height: '38%',
            backgroundImage: `radial-gradient(${dotColor} 2.2px, transparent 2.2px)`,
            backgroundSize: '14px 14px',
            maskImage: 'linear-gradient(225deg, rgba(0,0,0,0.9) 0%, transparent 72%)',
            WebkitMaskImage: 'linear-gradient(225deg, rgba(0,0,0,0.9) 0%, transparent 72%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '60%',
            height: '36%',
            backgroundImage: `radial-gradient(${dotColor} 2.2px, transparent 2.2px)`,
            backgroundSize: '14px 14px',
            maskImage: 'linear-gradient(45deg, rgba(0,0,0,0.85) 0%, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(45deg, rgba(0,0,0,0.85) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* 2. クライマックス用・微細な集中線 (manga-darkのみ) */}
        {isDarkManga && (
          <div
            style={{
              position: 'absolute',
              inset: '-20%',
              background:
                'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.05) 0deg 1.2deg, transparent 1.2deg 4.5deg)',
              maskImage: 'radial-gradient(circle, transparent 38%, rgba(0,0,0,0.85) 90%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 38%, rgba(0,0,0,0.85) 90%)',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        )}

        {/* 3. 背景の斜めコマ割りガターライン */}
        <svg
          viewBox="0 0 1080 1920"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: '28px',
            width: 'calc(100% - 56px)',
            height: 'calc(100% - 56px)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        >
          {/* 上部コマ境界線（斜め） */}
          <line
            x1="0"
            y1="440"
            x2="1080"
            y2="395"
            stroke={isDarkManga ? 'rgba(255,255,255,0.18)' : 'rgba(20,20,20,0.15)'}
            strokeWidth="3"
          />
          {/* 下部コマ境界線（逆斜め） */}
          <line
            x1="0"
            y1="1470"
            x2="1080"
            y2="1520"
            stroke={isDarkManga ? 'rgba(255,255,255,0.18)' : 'rgba(20,20,20,0.15)'}
            strokeWidth="3"
          />
        </svg>

        {/* 4. 漫画原稿の外枠（内枠線）＋四隅のトンボ */}
        <div
          style={{
            position: 'absolute',
            inset: isPortrait ? '28px' : '20px',
            border: `3.5px solid ${borderColor}`,
            pointerEvents: 'none',
            zIndex: 3
          }}
        >
          {/* 右上の原稿ページ番号スタンプ */}
          <div
            style={{
              position: 'absolute',
              top: '-18px',
              right: '24px',
              backgroundColor: palette.bg,
              padding: '0 12px',
              fontSize: isPortrait ? '20px' : '14px',
              fontWeight: 900,
              letterSpacing: '0.14em',
              color: borderColor,
              fontFamily: "'SF Mono', 'Inter', monospace"
            }}
          >
            MANGA SHOKAI // {props.watermark ? `P.${props.watermark}` : 'PAGE'}
          </div>
        </div>
      </>
    );
  };

  // 4c-2. 背景で3D漫画単行本・原稿ページが上から下に流れる演出
  const renderFallingMangaBg = () => {
    const showFalling =
      props.fallingMangaBg !== undefined ? props.fallingMangaBg : isMangaTheme;
    if (!showFalling) return null;

    const isDarkManga = theme === 'manga-dark' || theme === 'dark';
    const items = [
      { x: 7, startY: 120, speed: 4.6, scale: 0.92, rotX: 24, rotY: -22, rotZ: -16, spin: 0.25, blur: 3.2, isBook: true, panelIdx: 0 },
      { x: 78, startY: 480, speed: 5.2, scale: 1.02, rotX: -20, rotY: 26, rotZ: 18, spin: -0.22, blur: 3.6, isBook: true, panelIdx: 1 },
      { x: 22, startY: 880, speed: 3.8, scale: 0.72, rotX: 32, rotY: 18, rotZ: 24, spin: 0.18, blur: 4.5, isBook: false, panelIdx: 2 },
      { x: 66, startY: 1320, speed: 4.9, scale: 0.86, rotX: 18, rotY: -28, rotZ: -14, spin: -0.26, blur: 3.4, isBook: true, panelIdx: 3 },
      { x: 10, startY: 1680, speed: 5.5, scale: 1.05, rotX: -26, rotY: -20, rotZ: 15, spin: 0.21, blur: 2.8, isBook: false, panelIdx: 4 },
      { x: 82, startY: 2040, speed: 4.2, scale: 0.78, rotX: 28, rotY: 24, rotZ: -22, spin: -0.19, blur: 4.2, isBook: true, panelIdx: 5 },
      { x: 38, startY: 320, speed: 3.5, scale: 0.66, rotX: 35, rotY: -16, rotZ: 12, spin: 0.15, blur: 5.2, isBook: false, panelIdx: 6 },
      { x: 54, startY: 1540, speed: 4.1, scale: 0.7, rotX: -28, rotY: 22, rotZ: -19, spin: -0.17, blur: 4.8, isBook: true, panelIdx: 7 }
    ];

    const loopHeight = 2480;

    return (
      <div
        style={{
          position: 'absolute',
          inset: isPortrait ? '28px' : '20px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 2,
          perspective: '1000px'
        }}
      >
        {items.map((item, idx) => {
          const yPos = ((item.startY + globalFrame * item.speed) % loopHeight) - 340;
          const xSway = Math.sin(globalFrame * 0.025 + idx * 1.7) * 18;
          const curRotX = item.rotX + Math.sin(globalFrame * 0.02 + idx) * 10;
          const curRotY = item.rotY + Math.cos(globalFrame * 0.018 + idx) * 12;
          const curRotZ = item.rotZ + globalFrame * item.spin;
          const panelPath = FALLING_MANGA_PANELS[item.panelIdx % FALLING_MANGA_PANELS.length];

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${yPos}px`,
                width: isPortrait ? '210px' : '150px',
                height: isPortrait ? '296px' : '210px',
                transform: `translate3d(${xSway}px, 0, 0) scale(${item.scale}) rotateX(${curRotX.toFixed(1)}deg) rotateY(${curRotY.toFixed(1)}deg) rotateZ(${curRotZ.toFixed(1)}deg)`,
                transformStyle: 'preserve-3d',
                filter: `blur(${item.blur}px)`,
                opacity: isDarkManga ? 0.28 : 0.42
              }}
            >
              {/* 単行本の厚み（背表紙・小口ブロック影） */}
              {item.isBook && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#262626',
                    borderRadius: '4px',
                    transform: 'translate(14px, 16px)',
                    boxShadow: '6px 8px 20px rgba(0,0,0,0.32)',
                    border: '2px solid #141414'
                  }}
                />
              )}

              {/* 漫画原稿・単行本ページ本体 */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff',
                  border: '3px solid #181818',
                  borderRadius: '3px',
                  padding: '8px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: item.isBook
                    ? '4px 5px 0px #d4d2c8, 8px 10px 0px #181818'
                    : '0 12px 26px rgba(0,0,0,0.22)'
                }}
              >
                {/* 上段2コマ割り */}
                <div style={{ display: 'flex', gap: '5px', height: '34%' }}>
                  <div
                    style={{
                      flex: 1.2,
                      border: '2px solid #181818',
                      backgroundColor: '#e5e5e5',
                      overflow: 'hidden'
                    }}
                  >
                    <Img
                      src={staticFile(panelPath)}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'grayscale(100%) contrast(1.15)'
                      }}
                    />
                  </div>
                  <div
                    style={{
                      flex: 0.8,
                      border: '2px solid #181818',
                      backgroundColor: '#222222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '55%',
                        height: '72%',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #181818'
                      }}
                    />
                  </div>
                </div>

                {/* 下段メインコマ */}
                <div
                  style={{
                    flex: 1,
                    border: '2px solid #181818',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <Img
                    src={staticFile(panelPath)}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'grayscale(100%) contrast(1.1)'
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 4d. 漫画風・集中線アニメーション (props.focusLines === true のとき表示)
  const renderFocusLines = () => {
    if (!props.focusLines) return null;
    const lineColor = '#f48fb1'; // やわらかいパステル・ローズピンク
    const subLineColor = 'rgba(248, 180, 206, 0.45)'; // 淡いサブピンクライン

    // 2フレームごとに位相が切り替わるアニメ・漫画風の2コマ打ち振動
    const tick = Math.floor(frame / 2);
    const impactBurst = spring({
      frame,
      fps,
      config: { damping: 11, stiffness: 160, mass: 0.6 }
    });
    // 開始直後はグッと中心まで迫り、その後呼吸するように微振動する
    const burstOffset = interpolate(impactBurst, [0, 1], [-110, 0]);
    const pulseOffset = Math.sin(frame * 0.45) * 18;

    const cx = 540;
    const cy = 980;
    const rOuter = 1320;
    const numRays = 88;

    const wedges: React.ReactNode[] = [];
    for (let i = 0; i < numRays; i++) {
      // 決定論的ハッシュで2フレームごとに線の長さと太さを入れ替える
      const hashA = Math.abs(Math.sin((i + 1) * 12.9898 + (tick % 3) * 78.233));
      const hashB = Math.abs(Math.cos((i + 3) * 45.164 + (tick % 2) * 31.71));

      // 一部の線はフレームによって抜き差しして激しい集中線感を出す
      if (hashA < 0.16) continue;

      const baseAngleDeg = (i / numRays) * 360 + (hashB - 0.5) * 1.6;
      const angleRad = (baseAngleDeg * Math.PI) / 180;

      // 上下のテキスト領域（90°付近と270°付近）は文字と被りすぎないよう内径を少し広めにとり、
      // 斜め・左右方向は鋭く中央のコマへ突き刺さる楕円状のクリアゾーンにする
      const verticalFactor = Math.abs(Math.sin(angleRad)); // 上下=1, 左右=0
      const baseInner = 430 + verticalFactor * 220;
      const jitterInner = hashA * 185 + burstOffset + pulseOffset;
      const rInner = Math.max(320, baseInner + jitterInner);

      // 外周での楔の太さ（角度幅）
      const halfSpreadRad = ((0.22 + hashB * 0.72) * Math.PI) / 180;

      const xTip = cx + rInner * Math.cos(angleRad);
      const yTip = cy + rInner * Math.sin(angleRad);
      const xOuter1 = cx + rOuter * Math.cos(angleRad - halfSpreadRad);
      const yOuter1 = cy + rOuter * Math.sin(angleRad - halfSpreadRad);
      const xOuter2 = cx + rOuter * Math.cos(angleRad + halfSpreadRad);
      const yOuter2 = cy + rOuter * Math.sin(angleRad + halfSpreadRad);

      const isSub = i % 3 === 0;
      wedges.push(
        <polygon
          key={i}
          points={`${xTip.toFixed(1)},${yTip.toFixed(1)} ${xOuter1.toFixed(1)},${yOuter1.toFixed(1)} ${xOuter2.toFixed(1)},${yOuter2.toFixed(1)}`}
          fill={isSub ? subLineColor : lineColor}
          opacity={isSub ? 0.38 : 0.56}
        />
      );
    }

    return (
      <svg
        viewBox="0 0 1080 1920"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: isPortrait ? '28px' : '20px',
          width: isPortrait ? 'calc(100% - 56px)' : 'calc(100% - 40px)',
          height: isPortrait ? 'calc(100% - 56px)' : 'calc(100% - 40px)',
          pointerEvents: 'none',
          zIndex: 4,
          overflow: 'hidden'
        }}
      >
        {wedges}
      </svg>
    );
  };

  // 5. 特大中抜きウォーターマーク数字 (01, 02, 03, 100% など)
  const renderWatermark = () => {
    if (!props.watermark) return null;
    const wmSpring = spring({
      frame: Math.max(0, frame - 4),
      fps,
      config: { damping: 16, stiffness: 90 }
    });
    const isPercent = props.watermark.includes('%');
    return (
      <div
        style={{
          position: 'absolute',
          left: isPercent ? '50%' : '-20px',
          bottom: isPercent ? '12%' : '4%',
          transform: isPercent
            ? `translateX(-50%) scale(${interpolate(wmSpring, [0, 1], [0.85, 1])})`
            : `translateY(${interpolate(wmSpring, [0, 1], [60, 0])}px)`,
          fontSize: isPortrait ? (isPercent ? '300px' : '460px') : '260px',
          fontWeight: 900,
          lineHeight: 0.85,
          letterSpacing: '-0.05em',
          color: isPercent ? 'rgba(232, 82, 34, 0.14)' : 'transparent',
          WebkitTextStroke: isPercent ? 'none' : `3px ${palette.watermarkStroke}`,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 1,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif"
        }}
      >
        {props.watermark}
      </div>
    );
  };

  // 6. バッジ / アイブロウラベル
  const renderBadge = () => {
    const badgeType = props.badgeType || (props.badgeText ? 'mono-label' : 'none');
    if (badgeType === 'none' || !props.badgeText) return null;

    if (badgeType === 'manga-box' || isMangaTheme) {
      const isDarkManga = theme === 'manga-dark';
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: isDarkManga ? accentColor : '#ffffff',
            color: isDarkManga ? '#ffffff' : '#141414',
            border: `3.5px solid ${isDarkManga ? '#ffffff' : '#141414'}`,
            boxShadow: `6px 6px 0px ${isDarkManga ? 'rgba(255,255,255,0.28)' : '#141414'}`,
            padding: isPortrait ? '8px 22px' : '6px 16px',
            fontSize: isPortrait ? '26px' : '18px',
            fontWeight: 900,
            marginBottom: isPortrait ? '22px' : '14px',
            transform: `scale(${badgeSpring}) rotate(-1deg)`,
            transformOrigin: 'left center',
            letterSpacing: '0.06em'
          }}
        >
          {props.stepNumber && (
            <span
              style={{
                backgroundColor: isDarkManga ? '#141414' : accentColor,
                color: '#ffffff',
                padding: '2px 10px',
                fontSize: isPortrait ? '22px' : '15px',
                fontWeight: 900
              }}
            >
              #{props.stepNumber}
            </span>
          )}
          <span>{props.badgeText}</span>
        </div>
      );
    }

    if (badgeType === 'live-pill') {
      const pulse = 0.65 + 0.35 * Math.sin(frame * 0.25);
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: accentColor,
            color: '#ffffff',
            padding: isPortrait ? '10px 24px' : '8px 18px',
            borderRadius: '999px',
            fontSize: isPortrait ? '28px' : '20px',
            fontWeight: 800,
            marginBottom: isPortrait ? '28px' : '18px',
            transform: `scale(${badgeSpring})`,
            transformOrigin: 'left center',
            boxShadow: `0 6px 20px ${accentColor}44`
          }}
        >
          <span
            style={{
              width: isPortrait ? '16px' : '12px',
              height: isPortrait ? '16px' : '12px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: pulse
            }}
          />
          <span>{props.badgeText}</span>
        </div>
      );
    }

    if (badgeType === 'step-pill') {
      const pillBg = theme === 'dark' ? '#262626' : '#e4e2da';
      const pillText = theme === 'dark' ? '#ffffff' : '#181818';
      return (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: pillBg,
            color: pillText,
            padding: isPortrait ? '10px 26px 10px 14px' : '8px 20px 8px 12px',
            borderRadius: '999px',
            fontSize: isPortrait ? '28px' : '20px',
            fontWeight: 800,
            marginBottom: isPortrait ? '28px' : '18px',
            transform: `scale(${badgeSpring})`,
            transformOrigin: 'left center'
          }}
        >
          {props.stepNumber && (
            <span
              style={{
                width: isPortrait ? '36px' : '28px',
                height: isPortrait ? '36px' : '28px',
                borderRadius: '50%',
                backgroundColor: accentColor,
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isPortrait ? '22px' : '16px',
                fontWeight: 900
              }}
            >
              {props.stepNumber}
            </span>
          )}
          <span>{props.badgeText}</span>
        </div>
      );
    }

    // mono-label (e.g. CHAPTER 01 - AIに頼む時代, WHAT CHANGED, WORKFLOW)
    return (
      <div
        style={{
          fontSize: isPortrait ? '24px' : '18px',
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: theme === 'accent' ? 'rgba(255,255,255,0.9)' : theme === 'dark' ? accentColor : '#75736c',
          marginBottom: isPortrait ? '20px' : '14px',
          opacity: badgeSpring,
          transform: `translateY(${interpolate(badgeSpring, [0, 1], [12, 0])}px)`,
          fontFamily: "'SF Mono', 'JetBrains Mono', 'Inter', monospace"
        }}
      >
        {props.badgeText}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: palette.bg,
        backgroundImage:
          theme === 'light-grid'
            ? 'radial-gradient(#c5c2b7 1.7px, transparent 1.7px)'
            : 'none',
        backgroundSize: theme === 'light-grid' ? '28px 28px' : 'auto',
        color: palette.text,
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: isPortrait
          ? isMangaTheme
            ? '110px 40px 110px'
            : '130px 72px 110px'
          : '64px 96px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {renderBlindsTransition()}
      {renderPanelWipeTransition()}
      {renderMangaSlashTransition()}
      {renderDiagonalWedge()}
      {renderDarkCornerArcs()}

      {/* 直前シーンの漫画コマ・要素を背景に敷いてぼかす演出 (backdropBlurImage) */}
      {props.backdropBlurImage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {/* 直前コマの配置（少し暗く落としてぼかしを適用） */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: isPortrait ? '920px' : '640px',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(10px) brightness(0.68) contrast(1.15)',
              opacity: 0.72
            }}
          >
            <div
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                padding: '12px',
                border: '5px solid #141414',
                boxShadow: `12px 12px 0px ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              <Img
                src={staticFile(props.backdropBlurImage.replace(/^\//, ''))}
                alt=""
                style={{
                  width: '100%',
                  maxHeight: isPortrait ? '700px' : '360px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
          {/* 黒の薄い暗転グラデーションオーバーレイで文字の視認性を確保 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(10, 10, 10, 0.52)'
            }}
          />
        </div>
      )}

      {renderMangaPageDecor()}
      {renderFallingMangaBg()}
      {renderFocusLines()}
      {renderWatermark()}

      {/* ドラッグ＆リサイズ可能なメインコンテンツ領域 */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          height: isMangaTheme ? 'auto' : '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isMangaTheme ? 'center' : 'flex-start',
          gap: isMangaTheme ? (isPortrait ? '38px' : '22px') : undefined,
          transform: `translate(${customX}px, ${customY}px) scale(${customScale})`,
          transformOrigin: 'center center'
        }}
      >
        {/* 上部バッジ + キネティック見出し */}
        <div
          style={
            isMangaTheme
              ? {
                  width: '100%',
                  marginBottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }
              : { width: '100%', marginBottom: isPortrait ? '36px' : '24px' }
          }
        >
          {renderBadge()}

          <KineticRichText
            text={props.title}
            startFrame={2}
            lineDelay={7}
            fontSize={isPortrait ? (isMangaTheme ? 72 : 68) : 48}
            color={palette.text}
            accentColor={accentColor}
            theme={theme}
            motionStyle={props.motionStyle || 'blur-in'}
            align={isMangaTheme ? 'center' : 'left'}
            mangaExtruded={isMangaTheme}
          />

          {props.subtitle && (
            <div style={{ marginTop: isPortrait ? '18px' : '12px', width: '100%' }}>
              <KineticRichText
                text={props.subtitle}
                startFrame={14}
                lineDelay={7}
                fontSize={isPortrait ? 48 : 30}
                fontWeight={800}
                color={theme === 'accent' ? '#ffffff' : palette.muted}
                accentColor={accentColor}
                theme={theme}
                motionStyle="slide-up"
                align={isMangaTheme ? 'center' : 'left'}
                mangaExtruded={isMangaTheme}
              />
            </div>
          )}
        </div>

        {/* 中央ビジュアル・図解スロット */}
        <div
          style={{
            flex: isMangaTheme ? '0 0 auto' : 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {children}
        </div>

        {/* 下部結論コピー (footerHeadline) */}
        {props.footerHeadline && (
          <div
            style={
              isMangaTheme
                ? {
                    marginTop: '6px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: footerSpring,
                    transform: `translateY(${interpolate(footerSpring, [0, 1], [24, 0])}px)`
                  }
                : {
                    marginTop: isPortrait ? '28px' : '16px',
                    opacity: footerSpring,
                    transform: `translateY(${interpolate(footerSpring, [0, 1], [24, 0])}px)`
                  }
            }
          >
            <KineticRichText
              text={props.footerHeadline}
              startFrame={footerStart}
              lineDelay={7}
              fontSize={isPortrait ? (isMangaTheme ? 68 : 58) : 40}
              color={palette.text}
              accentColor={accentColor}
              theme={theme}
              motionStyle={props.motionStyle || 'blur-in'}
              align={isMangaTheme ? 'center' : 'left'}
              mangaExtruded={isMangaTheme}
            />
          </div>
        )}

        {/* 注釈・クレジット (caption) */}
        {props.caption && (
          <div
            style={{
              marginTop: '14px',
              fontSize: isPortrait ? '22px' : '16px',
              fontWeight: 600,
              color: palette.muted,
              letterSpacing: '0.04em'
            }}
          >
            {props.caption}
          </div>
        )}
      </div>
    </div>
  );
};

