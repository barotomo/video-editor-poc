import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import type { TextCardProps } from '../../types/videoSpec';
import { useLayout } from '../useLayout';

export const TextCardSlide: React.FC<{ props: TextCardProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait, slideBottomInset } = useLayout();

  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const subtitleSpring = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 14 } });

  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = titleSpring;

  const subtitleY = interpolate(subtitleSpring, [0, 1], [30, 0]);
  const subtitleOpacity = subtitleSpring;

  const themeColor = props.themeColor || '#6366f1';

  // ユーザーのドラッグ＆リサイズ手動調整値
  const customX = props.transform?.x ?? 0;
  const customY = props.transform?.y ?? 0;
  const customScale = props.transform?.scale ?? 1.0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `60px 60px ${60 + slideBottomInset}px`,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 背景のダイナミックグロー効果 */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColor}33 0%, transparent 70%)`,
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* 手動調整可能なコンテンツラッパー */}
      <div
        style={{
          transform: `translate(${customX}px, ${customY}px) scale(${customScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out'
        }}
      >
        {/* バッジ表示 */}
        {props.badge && (
          <div
            style={{
              transform: `scale(${titleSpring})`,
              backgroundColor: `${themeColor}22`,
              border: `1px solid ${themeColor}66`,
              color: themeColor,
              padding: '6px 18px',
              borderRadius: '20px',
              fontSize: isPortrait ? '26px' : '18px',
              fontWeight: 'bold',
              marginBottom: '24px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            {props.badge}
          </div>
        )}

        {/* メインタイトル */}
        <h1
          style={{
            transform: `translateY(${titleY}px)`,
            opacity: titleOpacity,
            color: '#ffffff',
            fontSize: isPortrait ? '80px' : '64px',
            fontWeight: 800,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            maxWidth: isPortrait ? '940px' : '1000px',
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          {props.title}
        </h1>

        {/* サブタイトル */}
        {props.subtitle && (
          <p
            style={{
              transform: `translateY(${subtitleY}px)`,
              opacity: subtitleOpacity,
              color: '#94a3b8',
              fontSize: isPortrait ? '40px' : '28px',
              fontWeight: 400,
              textAlign: 'center',
              marginTop: '24px',
              marginBottom: 0,
              maxWidth: isPortrait ? '900px' : '800px',
              lineHeight: 1.5
            }}
          >
            {props.subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
