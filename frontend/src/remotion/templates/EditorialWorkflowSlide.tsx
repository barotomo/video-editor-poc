import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { EditorialWorkflowProps } from '../../types/videoSpec';
import { EditorialBackdrop, DEFAULT_ACCENT, getEditorialPalette } from '../components/EditorialBackdrop';
import { useLayout } from '../useLayout';

export const EditorialWorkflowSlide: React.FC<{ props: EditorialWorkflowProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait } = useLayout();

  const accentColor = props.accentColor || DEFAULT_ACCENT;
  const palette = getEditorialPalette(props.theme, accentColor);
  const steps = props.steps || [];

  // モード1: 縦ステップ＋ループ矢印 (vertical-loop: iPhone Duo 00:13〜00:18)
  const renderVerticalLoop = () => {
    const loopSpring = spring({
      frame: Math.max(0, frame - (12 + steps.length * 8)),
      fps,
      config: { damping: 14, stiffness: 100 }
    });

    const stepGap = isPortrait ? 130 : 80;
    const totalHeight = Math.max(1, steps.length - 1) * stepGap;

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingLeft: isPortrait ? '36px' : '24px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: `${stepGap - 56}px` }}>
          {/* 縦のベースライン */}
          <div
            style={{
              position: 'absolute',
              left: '21px',
              top: '28px',
              height: `${totalHeight}px`,
              width: '4px',
              backgroundColor: 'rgba(255,255,255,0.18)',
              zIndex: 1
            }}
          />
          {/* オレンジ進行ライン */}
          <div
            style={{
              position: 'absolute',
              left: '21px',
              top: '28px',
              height: `${interpolate(frame, [6, 6 + steps.length * 9], [0, totalHeight], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              })}px`,
              width: '4px',
              backgroundColor: accentColor,
              zIndex: 2
            }}
          />

          {steps.map((step, idx) => {
            const activeFrame = 6 + idx * 9;
            const isActive = frame >= activeFrame;
            const isCurrent = frame >= activeFrame && frame < activeFrame + 10;
            const nodeSpring = spring({
              frame: Math.max(0, frame - activeFrame),
              fps,
              config: { damping: 12, stiffness: 160 }
            });

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isPortrait ? '36px' : '24px',
                  height: '56px',
                  position: 'relative',
                  zIndex: 3
                }}
              >
                {/* ノード丸 */}
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? accentColor : '#1e1e1e',
                    border: isActive ? `4px solid ${accentColor}` : '3px solid rgba(255,255,255,0.28)',
                    boxShadow: isCurrent ? `0 0 28px ${accentColor}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${isActive ? interpolate(nodeSpring, [0, 0.6, 1], [0.8, 1.18, 1]) : 1})`
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  )}
                </div>

                {/* ステップテキスト */}
                <span
                  style={{
                    fontSize: isPortrait ? '56px' : '36px',
                    fontWeight: 900,
                    color: isActive ? palette.text : 'rgba(255,255,255,0.28)',
                    transition: 'color 0.1s'
                  }}
                >
                  {step.label}
                </span>
              </div>
            );
          })}

          {/* 右側の曲線ループ矢印 (送る → 頼む「また頼む」) */}
          {props.loopLabel && steps.length >= 2 && (
            <svg
              viewBox="0 0 360 440"
              style={{
                position: 'absolute',
                left: isPortrait ? '220px' : '160px',
                top: '10px',
                width: isPortrait ? '380px' : '260px',
                height: `${totalHeight + 40}px`,
                overflow: 'visible',
                pointerEvents: 'none'
              }}
            >
              <path
                d="M 10 400 C 260 400, 260 30, 10 30"
                fill="none"
                stroke={accentColor}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="700"
                strokeDashoffset={interpolate(loopSpring, [0, 1], [700, 0])}
              />
              {/* 矢印の先端 */}
              <polyline
                points="28,14 8,30 28,46"
                fill="none"
                stroke={accentColor}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={loopSpring}
              />
              <text
                x="235"
                y="225"
                fill={accentColor}
                fontSize="32"
                fontWeight="900"
                opacity={loopSpring}
              >
                {props.loopLabel}
              </text>
            </svg>
          )}
        </div>
      </div>
    );
  };

  // モード2: 1日の隙間時間バー (day-slots: iPhone Duo 00:46〜00:48)
  const renderDaySlots = () => {
    const barSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 15 } });
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div
          style={{
            fontSize: isPortrait ? '24px' : '18px',
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: palette.muted,
            fontFamily: "'SF Mono', 'Inter', monospace"
          }}
        >
          ONE DAY
        </div>

        {/* タイムバー本体 */}
        <div style={{ position: 'relative', width: '100%', paddingTop: isPortrait ? '90px' : '64px' }}>
          <div
            style={{
              width: '100%',
              height: isPortrait ? '110px' : '76px',
              backgroundColor: '#181818',
              borderRadius: '22px',
              position: 'relative',
              transform: `scaleX(${barSpring})`,
              transformOrigin: 'left center',
              boxShadow: '0 16px 36px rgba(0,0,0,0.12)'
            }}
          />

          {/* 隙間時間スロット（オレンジ縦バー + ピルラベル） */}
          {steps.map((slot, idx) => {
            const slotSpring = spring({
              frame: Math.max(0, frame - (12 + idx * 8)),
              fps,
              config: { damping: 12, stiffness: 150 }
            });
            const posPct = slot.positionPercent ?? (idx === 0 ? 24 : idx === 1 ? 50 : 78);

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${posPct}%`,
                  bottom: '-10px',
                  transform: `translateX(-50%) scale(${slotSpring})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  opacity: slotSpring
                }}
              >
                <div
                  style={{
                    backgroundColor: accentColor,
                    color: '#ffffff',
                    padding: isPortrait ? '12px 26px' : '8px 18px',
                    borderRadius: '999px',
                    fontSize: isPortrait ? '28px' : '18px',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    boxShadow: `0 8px 20px ${accentColor}55`
                  }}
                >
                  {slot.label}
                </div>
                <div
                  style={{
                    width: isPortrait ? '36px' : '26px',
                    height: isPortrait ? '130px' : '92px',
                    backgroundColor: accentColor,
                    borderRadius: '10px',
                    border: '4px solid #f4f3ee'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 時刻ラベル (9:00 ... 21:00) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: isPortrait ? '26px' : '18px',
            fontWeight: 800,
            color: palette.muted,
            fontFamily: "'SF Mono', 'Inter', monospace"
          }}
        >
          <span>{props.dayStartLabel || '9:00'}</span>
          <span>{props.dayEndLabel || '21:00'}</span>
        </div>
      </div>
    );
  };

  // モード3: 横タイムライン＋フォローCTA (horizontal-timeline: iPad mini 01:09〜01:16)
  const renderHorizontalTimeline = () => {
    const ctaSpring = spring({
      frame: Math.max(0, frame - 28),
      fps,
      config: { damping: 13, stiffness: 140 }
    });

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPortrait ? '56px' : '32px' }}>
        {/* 横ライン + ノード */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '20px' }}>
          <div
            style={{
              position: 'absolute',
              left: '24px',
              right: '24px',
              top: '42px',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.28)'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
            {steps.map((step, idx) => {
              const sSpring = spring({
                frame: Math.max(0, frame - (8 + idx * 8)),
                fps,
                config: { damping: 13 }
              });
              const isHighlighted = step.accent ?? idx === 0;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: idx === 0 ? 'flex-start' : idx === steps.length - 1 ? 'flex-end' : 'center',
                    gap: '20px',
                    opacity: sSpring,
                    transform: `translateY(${interpolate(sSpring, [0, 1], [20, 0])}px)`
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: isHighlighted ? accentColor : '#9ca3af',
                      boxShadow: isHighlighted ? `0 0 24px ${accentColor}` : 'none'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: isPortrait ? '42px' : '28px', fontWeight: 900, color: palette.text }}>
                      {step.timeOrDate || step.label}
                    </div>
                    {step.sublabel && (
                      <div style={{ fontSize: isPortrait ? '28px' : '18px', fontWeight: 700, color: palette.muted }}>
                        {step.sublabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* + フォロー CTA ボタン */}
        {props.ctaButtonText && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              marginTop: isPortrait ? '36px' : '16px',
              opacity: ctaSpring,
              transform: `scale(${interpolate(ctaSpring, [0, 1], [0.9, 1])})`
            }}
          >
            <div
              style={{
                padding: isPortrait ? '22px 96px' : '14px 64px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.16)',
                border: '2px solid rgba(255,255,255,0.38)',
                backdropFilter: 'blur(12px)',
                color: '#ffffff',
                fontSize: isPortrait ? '40px' : '26px',
                fontWeight: 900
              }}
            >
              {props.ctaButtonText}
            </div>
            {props.ctaSubtext && (
              <div style={{ fontSize: isPortrait ? '28px' : '18px', fontWeight: 700, color: palette.muted }}>
                {props.ctaSubtext}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const mode = props.workflowMode || 'vertical-loop';

  return (
    <EditorialBackdrop props={props}>
      {mode === 'vertical-loop' && renderVerticalLoop()}
      {mode === 'day-slots' && renderDaySlots()}
      {mode === 'horizontal-timeline' && renderHorizontalTimeline()}
    </EditorialBackdrop>
  );
};

