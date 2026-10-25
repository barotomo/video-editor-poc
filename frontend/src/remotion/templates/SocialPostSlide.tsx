import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import type { SocialPostProps } from '../../types/videoSpec';
import { useLayout } from '../useLayout';

export const SocialPostSlide: React.FC<{ props: SocialPostProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait, slideBottomInset } = useLayout();

  const cardSpring = spring({ frame, fps, config: { damping: 13, mass: 0.5 } });
  const cardScale = interpolate(cardSpring, [0, 1], [0.85, 1]);
  const cardOpacity = cardSpring;

  // ユーザー手動調整値
  const customX = props.transform?.x ?? 0;
  const customY = props.transform?.y ?? 0;
  const customScale = props.transform?.scale ?? 1.0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isPortrait ? `32px 32px ${32 + slideBottomInset}px` : '50px',
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        color: '#ffffff',
        position: 'relative'
      }}
    >
      <div
        style={{
          transform: `translate(${customX}px, ${customY}px) scale(${cardScale * customScale})`,
          opacity: cardOpacity,
          width: '100%',
          maxWidth: '800px',
          backgroundColor: '#000000',
          border: '1px solid #1e293b',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out'
        }}
      >
        {/* アカウント情報 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#38bdf8',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '28px',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
            }}
          >
            🐦
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: isPortrait ? '30px' : '22px', fontWeight: 800, color: '#f8fafc' }}>
              {props.authorName}
            </span>
            <span style={{ fontSize: isPortrait ? '22px' : '16px', color: '#64748b' }}>
              {props.authorHandle}
            </span>
          </div>
        </div>

        {/* 投稿本文 */}
        <p
          style={{
            margin: 0,
            fontSize: isPortrait ? '36px' : '26px',
            lineHeight: 1.5,
            color: '#e2e8f0',
            fontWeight: 500
          }}
        >
          {props.content}
        </p>

        {/* 投稿日時 & リアクション */}
        <div
          style={{
            borderTop: '1px solid #1e293b',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            color: '#64748b',
            fontSize: isPortrait ? '22px' : '16px'
          }}
        >
          <span>{props.timestamp || '2026/09/12 09:00'}</span>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span>🔁 {props.repostsCount || '120'}</span>
            <span>❤️ {props.likesCount || '850'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
