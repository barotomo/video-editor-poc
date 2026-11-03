import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { EditorialListProps } from '../../types/videoSpec';
import { EditorialBackdrop, DEFAULT_ACCENT, getEditorialPalette } from '../components/EditorialBackdrop';
import { useLayout } from '../useLayout';

export const EditorialListSlide: React.FC<{ props: EditorialListProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait } = useLayout();

  const accentColor = props.accentColor || DEFAULT_ACCENT;
  const palette = getEditorialPalette(props.theme, accentColor);
  const items = props.items || [];

  // モード1: チェックリスト＋上部ビジュアルカード (checklist: iPad mini 00:38〜00:47)
  const renderChecklist = () => {
    const cardSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 14 } });

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPortrait ? '42px' : '24px' }}>
        {props.showTopCard !== false && (
          <div
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '32px',
              padding: isPortrait ? '36px' : '24px',
              boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              transform: `scale(${cardSpring})`
            }}
          >
            <div style={{ alignSelf: 'flex-start', fontSize: '20px', fontWeight: 700, color: '#8c8a82', letterSpacing: '0.08em' }}>
              IMAGE: APPLE
            </div>
            <div
              style={{
                width: '86%',
                height: isPortrait ? '220px' : '140px',
                borderRadius: '26px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '6px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                fontSize: isPortrait ? '76px' : '48px',
                fontWeight: 900,
                fontStyle: 'italic',
                boxShadow: '0 16px 36px rgba(0,0,0,0.25)'
              }}
            >
              {props.topCardLabel || 'mini'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: isPortrait ? '28px' : '18px' }}>
          {items.map((item, idx) => {
            const itemSpring = spring({
              frame: Math.max(0, frame - (12 + idx * 9)),
              fps,
              config: { damping: 14, stiffness: 140 }
            });
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '20px',
                  opacity: itemSpring,
                  transform: `translateY(${interpolate(itemSpring, [0, 1], [24, 0])}px)`
                }}
              >
                <span style={{ fontSize: isPortrait ? '42px' : '28px', fontWeight: 900, color: accentColor }}>
                  ✓
                </span>
                <span style={{ fontSize: isPortrait ? '46px' : '30px', fontWeight: 900, color: palette.text }}>
                  {item.text}
                </span>
                {item.subtext && (
                  <span style={{ fontSize: isPortrait ? '26px' : '18px', fontWeight: 700, color: palette.muted }}>
                    {item.subtext}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // モード2: タイピング風SNSコメントカード (comments: iPhone Duo 00:38〜00:41)
  const renderComments = () => {
    const cursorVisible = Math.floor(frame / 8) % 2 === 0;
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPortrait ? '36px' : '22px' }}>
        {items.map((item, idx) => {
          const startF = 6 + idx * 18;
          const cardSpring = spring({
            frame: Math.max(0, frame - startF),
            fps,
            config: { damping: 14, stiffness: 140 }
          });
          const typedChars = Math.max(0, Math.floor((frame - (startF + 4)) * 1.1));
          const displayText = item.text.slice(0, typedChars);

          return (
            <div
              key={idx}
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '30px',
                padding: isPortrait ? '36px 40px' : '24px 28px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
                opacity: cardSpring,
                transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px) scale(${interpolate(
                  cardSpring,
                  [0, 1],
                  [0.94, 1]
                )})`
              }}
            >
              <div
                style={{
                  width: isPortrait ? '74px' : '52px',
                  height: isPortrait ? '74px' : '52px',
                  borderRadius: '50%',
                  backgroundColor: '#d6d3cb',
                  flexShrink: 0
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  style={{
                    fontSize: isPortrait ? '24px' : '16px',
                    fontWeight: 700,
                    color: '#7c7b74',
                    fontFamily: "'SF Mono', 'Inter', monospace"
                  }}
                >
                  {item.subtext || `@user_${2081 + idx * 1226}`}
                </div>
                <div style={{ fontSize: isPortrait ? '38px' : '26px', fontWeight: 900, color: '#181818' }}>
                  <span>{displayText}</span>
                  {frame >= startF && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '4px',
                        height: isPortrait ? '38px' : '26px',
                        backgroundColor: accentColor,
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        opacity: cursorVisible ? 1 : 0
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // モード3: 2ヶ月カレンダー＋発売日ハイライト (calendar: iPad mini 01:05〜01:07)
  const renderCalendar = () => {
    const calSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 14 } });
    const daysHeader = ['日', '月', '火', '水', '木', '金', '土'];

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPortrait ? '42px' : '24px' }}>
        {/* 2ヶ月カレンダーグリッド */}
        <div
          style={{
            display: 'flex',
            gap: isPortrait ? '24px' : '18px',
            width: '100%',
            opacity: calSpring,
            transform: `translateY(${interpolate(calSpring, [0, 1], [24, 0])}px)`
          }}
        >
          {[
            { title: 'OCTOBER 2026', offset: 4, days: 31 },
            { title: 'NOVEMBER 2026', offset: 0, days: 30 }
          ].map((month, mIdx) => (
            <div
              key={mIdx}
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 14px 36px rgba(0,0,0,0.08)'
              }}
            >
              <div
                style={{
                  backgroundColor: '#262626',
                  color: '#ffffff',
                  textAlign: 'center',
                  padding: '14px',
                  fontSize: isPortrait ? '24px' : '16px',
                  fontWeight: 900,
                  letterSpacing: '0.08em'
                }}
              >
                {month.title}
              </div>
              <div
                style={{
                  padding: isPortrait ? '20px' : '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  rowGap: isPortrait ? '14px' : '8px',
                  textAlign: 'center'
                }}
              >
                {daysHeader.map(d => (
                  <div key={d} style={{ fontSize: isPortrait ? '18px' : '13px', fontWeight: 700, color: '#9ca3af' }}>
                    {d}
                  </div>
                ))}
                {Array.from({ length: month.offset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: month.days }).map((_, i) => {
                  const day = i + 1;
                  const isToday = mIdx === 0 && day === 26;
                  const isPreorder = mIdx === 0 && day === 29;
                  const isRelease = mIdx === 1 && day === 6;
                  const highlightColor = isPreorder
                    ? accentColor
                    : isRelease
                    ? '#181818'
                    : isToday
                    ? '#9ca3af'
                    : 'transparent';

                  return (
                    <div
                      key={day}
                      style={{
                        width: isPortrait ? '42px' : '28px',
                        height: isPortrait ? '42px' : '28px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        backgroundColor: highlightColor,
                        color: isToday || isPreorder || isRelease ? '#ffffff' : '#181818',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isPortrait ? '22px' : '15px',
                        fontWeight: 800
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 下部凡例リスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {items.map((item, idx) => {
            const lSpring = spring({
              frame: Math.max(0, frame - (14 + idx * 8)),
              fps,
              config: { damping: 14 }
            });
            const dotColor =
              item.tag === 'preorder' ? accentColor : item.tag === 'release' ? '#181818' : '#9ca3af';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  opacity: lSpring,
                  transform: `translateX(${interpolate(lSpring, [0, 1], [-20, 0])}px)`
                }}
              >
                <span
                  style={{
                    width: isPortrait ? '30px' : '22px',
                    height: isPortrait ? '30px' : '22px',
                    borderRadius: '50%',
                    backgroundColor: dotColor
                  }}
                />
                <span
                  style={{
                    fontSize: isPortrait ? '42px' : '28px',
                    fontWeight: 900,
                    color: item.tag === 'preorder' ? accentColor : item.tag === 'today' ? '#7c7b74' : '#181818',
                    minWidth: isPortrait ? '220px' : '150px'
                  }}
                >
                  {item.text}
                </span>
                {item.subtext && (
                  <span
                    style={{
                      fontSize: isPortrait ? '44px' : '28px',
                      fontWeight: 900,
                      color: item.tag === 'preorder' ? accentColor : '#181818'
                    }}
                  >
                    {item.subtext}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // モード4: 曜日バッジ順次点灯＋CTA (weekdays-cta: iPhone Duo 01:07〜01:11)
  const renderWeekdaysCta = () => {
    const days = ['月', '火', '水', '木', '金', '土', '日'];
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPortrait ? '48px' : '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', width: '100%' }}>
          {days.map((day, idx) => {
            const activeFrame = 10 + idx * 4;
            const isLit = frame >= activeFrame;
            const dSpring = spring({
              frame: Math.max(0, frame - activeFrame),
              fps,
              config: { damping: 12, stiffness: 180 }
            });
            return (
              <div
                key={day}
                style={{
                  width: isPortrait ? '106px' : '72px',
                  height: isPortrait ? '106px' : '72px',
                  borderRadius: '50%',
                  backgroundColor: isLit ? accentColor : 'transparent',
                  border: isLit ? `3px solid ${accentColor}` : '3px solid #b5b3aa',
                  color: isLit ? '#ffffff' : '#7c7b74',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isPortrait ? '40px' : '26px',
                  fontWeight: 900,
                  transform: `scale(${isLit ? interpolate(dSpring, [0, 0.5, 1], [0.85, 1.12, 1]) : 1})`,
                  boxShadow: isLit ? `0 10px 25px ${accentColor}44` : 'none'
                }}
              >
                {day}
              </div>
            );
          })}
        </div>

        {props.brandFooter && (
          <div
            style={{
              textAlign: 'center',
              fontSize: isPortrait ? '28px' : '20px',
              fontWeight: 800,
              letterSpacing: '0.24em',
              color: '#9ca3af',
              marginTop: isPortrait ? '40px' : '20px'
            }}
          >
            {props.brandFooter}
          </div>
        )}
      </div>
    );
  };

  const mode = props.listMode || 'checklist';

  return (
    <EditorialBackdrop props={props}>
      {mode === 'checklist' && renderChecklist()}
      {mode === 'comments' && renderComments()}
      {mode === 'calendar' && renderCalendar()}
      {mode === 'weekdays-cta' && renderWeekdaysCta()}
    </EditorialBackdrop>
  );
};

