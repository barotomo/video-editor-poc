import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import type { StatGraphProps } from '../../types/videoSpec';
import { useLayout } from '../useLayout';

export const StatGraphSlide: React.FC<{ props: StatGraphProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait, slideBottomInset } = useLayout();

  const containerSpring = spring({ frame, fps, config: { damping: 14 } });

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
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isPortrait ? `40px 48px ${40 + slideBottomInset}px` : '50px 80px',
        background: 'linear-gradient(135deg, #0b1329 0%, #172554 100%)',
        color: '#ffffff',
        position: 'relative'
      }}
    >
      <div
        style={{
          transform: `translate(${customX}px, ${customY}px) scale(${customScale})`,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transformOrigin: 'center center',
          transition: 'transform 0.05s ease-out'
        }}
      >
        {/* タイトル */}
        <h2
          style={{
            fontSize: isPortrait ? '56px' : '44px',
            fontWeight: 800,
            margin: '0 0 10px 0',
            textAlign: 'center',
            opacity: containerSpring,
            transform: `translateY(${interpolate(containerSpring, [0, 1], [30, 0])}px)`
          }}
        >
          {props.title}
        </h2>

        {props.subtitle && (
          <p
            style={{
              fontSize: isPortrait ? '30px' : '22px',
              color: '#93c5fd',
              margin: '0 0 40px 0',
              textAlign: 'center',
              opacity: containerSpring
            }}
          >
            {props.subtitle}
          </p>
        )}

        {/* グラフカードリスト */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}
        >
          {props.items.map((item, index) => {
            const itemDelay = 10 + index * 8;
            const barSpring = spring({
              frame: Math.max(0, frame - itemDelay),
              fps,
              config: { damping: 15, mass: 0.6 }
            });

            const barWidthPercent = interpolate(barSpring, [0, 1], [0, item.value]);
            const barColor = item.color || '#3b82f6';

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  opacity: barSpring
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isPortrait ? '28px' : '20px', fontWeight: 600, gap: '16px' }}>
                  <span>{item.label}</span>
                  <span style={{ color: barColor, fontWeight: 700 }}>{Math.round(barWidthPercent)}%</span>
                </div>

                {/* バー背景 */}
                <div
                  style={{
                    width: '100%',
                    height: isPortrait ? '32px' : '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {/* 伸びるバー */}
                  <div
                    style={{
                      width: `${barWidthPercent}%`,
                      height: '100%',
                      backgroundColor: barColor,
                      borderRadius: '12px',
                      boxShadow: `0 0 15px ${barColor}aa`,
                      transition: 'width 0.1s linear'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
