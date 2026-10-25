import { AbsoluteFill, Video, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile } from 'remotion';
import type { VideoClipProps } from '../../types/videoSpec';
import { useLayout } from '../useLayout';

export const resolveMediaSrc = (src?: string): string => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  const cleanPath = src.startsWith('/') ? src.slice(1) : src;
  return staticFile(cleanPath);
};

interface VideoClipSlideProps {
  props: VideoClipProps;
  activeDialogueText?: string; // 現在のセリフ（MainVideoから渡される）
}

export const VideoClipSlide: React.FC<VideoClipSlideProps> = ({
  props,
  activeDialogueText
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait } = useLayout();

  const displayText = activeDialogueText || '';
  const bgColor = props.backgroundColor || '#ffffff';
  const textColor = props.textColor || '#000000';

  // セリフ表示時のポップイン・アニメーション（テンポ感アップ）
  const popSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 }
  });
  const textScale = interpolate(popSpring, [0, 1], [0.92, 1]);
  const textOpacity = interpolate(popSpring, [0, 1], [0, 1]);

  // 文字数に応じたフォントサイズ調整（文字が長くてもはみ出さない）
  const textLength = displayText.replace(/\n/g, '').length;
  let dynamicFontSize = isPortrait ? 68 : 42;
  if (textLength > 20) {
    dynamicFontSize = isPortrait ? 52 : 32;
  } else if (textLength > 30) {
    dynamicFontSize = isPortrait ? 42 : 26;
  }

  // スライド全体の変形
  const transform = props.transform || {};
  const translateX = `${transform.x || 0}%`;
  const translateY = `${transform.y || 0}%`;
  const scale = transform.scale ?? 1.0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        transform: `translate(${translateX}, ${translateY}) scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* 1. 上部セリフエリア (ショート動画の黄金比: 高さ約30〜35%) */}
      <div
        style={{
          flex: isPortrait ? '0 0 33%' : '0 0 26%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isPortrait ? '40px 32px 10px' : '20px 40px',
          boxSizing: 'border-box',
          zIndex: 10
        }}
      >
        {displayText ? (
          <div
            style={{
              opacity: textOpacity,
              transform: `scale(${textScale})`,
              fontFamily: "'M PLUS Rounded 1c', 'Dela Gothic One', 'Noto Sans JP', sans-serif",
              fontSize: `${dynamicFontSize}px`,
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.32,
              letterSpacing: '-0.02em',
              whiteSpace: 'pre-wrap',
              textShadow: bgColor === '#ffffff' ? 'none' : '0 2px 12px rgba(0,0,0,0.4)',
              maxWidth: '92%'
            }}
          >
            {displayText}
          </div>
        ) : null}
      </div>

      {/* 2. 中央動画エリア (アニメクリップを中央に配置) */}
      <div
        style={{
          flex: isPortrait ? '0 0 auto' : '1',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: '#000000',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }}
      >
        {props.videoUrl ? (
          <Video
            src={resolveMediaSrc(props.videoUrl)}
            startFrom={Math.round((props.videoStartTime || 0) * fps)}
            volume={props.videoVolume ?? 1}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: isPortrait ? '560px' : '480px',
              objectFit: props.videoFit || 'contain',
              display: 'block'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: isPortrait ? '405px' : '360px',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '32px' }}>🎬</span>
            <span style={{ fontSize: '18px', fontWeight: 600 }}>動画URLが指定されていません</span>
          </div>
        )}
      </div>

      {/* 3. 下部ロゴ / 作品名エリア (ショート動画の余白部分: 高さ約30〜35%) */}
      <div
        style={{
          flex: isPortrait ? '0 0 33%' : '0 0 24%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isPortrait ? '10px 32px 40px' : '16px 40px',
          boxSizing: 'border-box',
          gap: '12px',
          zIndex: 10
        }}
      >
        {/* ロゴ画像 or ロゴバッジ */}
        {props.logoUrl ? (
          <img
            src={resolveMediaSrc(props.logoUrl)}
            alt="Anime Logo"
            style={{
              maxWidth: isPortrait ? '380px' : '260px',
              maxHeight: isPortrait ? '140px' : '90px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.12))'
            }}
          />
        ) : props.logoText ? (
          <div
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #ff4380, #8b5cf6)',
              borderRadius: '999px',
              color: '#ffffff',
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              fontSize: isPortrait ? '26px' : '20px',
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(255, 67, 128, 0.3)'
            }}
          >
            {props.logoText}
          </div>
        ) : null}

        {/* 補足テキスト（サブタイトルや公式表記など） */}
        {props.logoSubtext && (
          <div
            style={{
              fontSize: isPortrait ? '18px' : '14px',
              fontWeight: 700,
              color: bgColor === '#ffffff' ? '#475569' : '#cbd5e1',
              letterSpacing: '0.04em',
              textAlign: 'center'
            }}
          >
            {props.logoSubtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
