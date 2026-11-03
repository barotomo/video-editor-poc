import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { EditorialComparisonProps, EditorialComparisonItem } from '../../types/videoSpec';
import { EditorialBackdrop, DEFAULT_ACCENT, getEditorialPalette } from '../components/EditorialBackdrop';
import { useLayout } from '../useLayout';

export const EditorialComparisonSlide: React.FC<{ props: EditorialComparisonProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait } = useLayout();

  const accentColor = props.accentColor || DEFAULT_ACCENT;
  const palette = getEditorialPalette(props.theme, accentColor);
  const items = props.items || [];

  // 2枚カード比較のビジュアル内部描画
  const renderCardVisual = (item: EditorialComparisonItem, _idx: number, progress: number) => {
    const visual = item.visual || (item.accent ? 'glow-bright' : 'glow-dim');

    if (visual === 'glow-dim' || visual === 'glow-bright') {
      const isBright = visual === 'glow-bright';
      const glowScale = interpolate(progress, [0, 1], [0.6, 1.05]);
      return (
        <div
          style={{
            width: '100%',
            height: isPortrait ? '420px' : '250px',
            borderRadius: '26px',
            backgroundColor: '#262626',
            border: isBright ? `3px solid ${accentColor}` : '2px solid rgba(255,255,255,0.18)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isBright ? `0 0 60px ${accentColor}66` : 'none'
          }}
        >
          {isBright && (
            <div
              style={{
                width: '130%',
                height: '130%',
                borderRadius: '50%',
                background: `radial-gradient(circle, #fff7ed 0%, #fb923c 38%, ${accentColor} 72%, transparent 100%)`,
                transform: `scale(${glowScale})`,
                opacity: progress
              }}
            />
          )}
        </div>
      );
    }

    if (visual === 'glare-standard' || visual === 'glare-nano') {
      const isStandard = visual === 'glare-standard';
      const glarePos = interpolate(frame, [0, 60], [-20, 35], { extrapolateRight: 'clamp' });
      return (
        <div
          style={{
            width: '100%',
            height: isPortrait ? '430px' : '260px',
            borderRadius: '28px',
            backgroundColor: '#181818',
            border: '8px solid #d6d3cb',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 32px rgba(0,0,0,0.12)'
          }}
        >
          {isStandard ? (
            <div
              style={{
                position: 'absolute',
                inset: '-30%',
                background:
                  'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.85) 48%, rgba(255,255,255,0.15) 60%, transparent 72%)',
                transform: `translateX(${glarePos}%)`
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.10) 0%, transparent 65%)'
              }}
            />
          )}
        </div>
      );
    }

    if (visual === 'fps-60' || visual === 'fps-120') {
      const isSmooth = visual === 'fps-120';
      // 60Hzはカクつき(ステップ関数)、120Hzは滑らかスクロール
      const scrollY = isSmooth
        ? (frame * 3.5) % 90
        : Math.floor((frame * 3.5) / 22) * 22 % 90;

      return (
        <div
          style={{
            width: '100%',
            height: isPortrait ? '420px' : '250px',
            borderRadius: '28px',
            backgroundColor: '#171717',
            border: '4px solid #3f3f46',
            padding: '22px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transform: `translateY(-${scrollY}px)`
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: isPortrait ? '64px' : '42px',
                  borderRadius: '12px',
                  backgroundColor: isSmooth ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.15)'
                }}
              />
            ))}
          </div>
        </div>
      );
    }

    if (visual === 'bezel-thick' || visual === 'bezel-thin') {
      const isThin = visual === 'bezel-thin';
      return (
        <div
          style={{
            width: '100%',
            height: isPortrait ? '430px' : '260px',
            borderRadius: '28px',
            backgroundColor: isThin ? accentColor : '#c7c4b8',
            padding: isThin ? '14px' : '34px',
            boxSizing: 'border-box',
            boxShadow: '0 16px 36px rgba(0,0,0,0.10)',
            display: 'flex'
          }}
        >
          <div
            style={{
              flex: 1,
              borderRadius: isThin ? '18px' : '10px',
              backgroundColor: isThin ? '#262626' : '#ecebe4'
            }}
          />
        </div>
      );
    }

    // デフォルトカード
    return (
      <div
        style={{
          width: '100%',
          height: isPortrait ? '380px' : '230px',
          borderRadius: '28px',
          backgroundColor: item.accent ? accentColor : '#ffffff',
          color: item.accent ? '#ffffff' : '#181818',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 16px 36px rgba(0,0,0,0.08)',
          padding: '24px'
        }}
      >
        <div style={{ fontSize: isPortrait ? '56px' : '38px', fontWeight: 900 }}>
          {item.valueText || item.label}
        </div>
      </div>
    );
  };

  // モード1: 2枚カード比較 (cards-2)
  const renderCards2 = () => {
    const pair = items.slice(0, 2);
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: isPortrait ? '32px' : '28px',
            width: '100%',
            position: 'relative'
          }}
        >
          {pair.map((item, idx) => {
            const cSpring = spring({
              frame: Math.max(0, frame - (8 + idx * 9)),
              fps,
              config: { damping: 14, stiffness: 130 }
            });
            return (
              <React.Fragment key={idx}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    opacity: cSpring,
                    transform: `translateY(${interpolate(cSpring, [0, 1], [30, 0])}px) scale(${interpolate(
                      cSpring,
                      [0, 1],
                      [0.92, 1]
                    )})`
                  }}
                >
                  {renderCardVisual(item, idx, cSpring)}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {item.badge ? (
                      <span
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: item.accent ? accentColor : '#d6d3cb',
                          color: item.accent ? '#ffffff' : '#181818',
                          padding: '4px 14px',
                          borderRadius: '8px',
                          fontSize: isPortrait ? '24px' : '18px',
                          fontWeight: 900
                        }}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <div
                        style={{
                          fontSize: isPortrait ? '32px' : '22px',
                          fontWeight: 900,
                          color: item.accent ? accentColor : palette.text
                        }}
                      >
                        {item.label}
                        {item.valueText && (
                          <span style={{ marginLeft: '12px', fontSize: isPortrait ? '40px' : '26px' }}>
                            {item.valueText}
                          </span>
                        )}
                      </div>
                    )}
                    {item.sublabel && (
                      <div style={{ fontSize: isPortrait ? '24px' : '18px', fontWeight: 700, color: palette.muted }}>
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {/* カード間の曲線矢印 */}
                {idx === 0 && props.showArrowBetweenCards && (
                  <div
                    style={{
                      alignSelf: 'center',
                      fontSize: isPortrait ? '54px' : '38px',
                      fontWeight: 900,
                      color: palette.text,
                      marginTop: '-40px'
                    }}
                  >
                    ↷
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // モード2: 基準線付き縦棒グラフ (bars-vertical: iPad mini 00:50 価格比較)
  const renderBarsVertical = () => {
    const lineSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 15 } });
    const diffSpring = spring({ frame: Math.max(0, frame - 24), fps, config: { damping: 13 } });
    const thresholdBottom = props.thresholdValue ?? 66;

    return (
      <div
        style={{
          width: '100%',
          height: isPortrait ? '640px' : '380px',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: isPortrait ? '64px' : '48px',
          paddingBottom: '110px'
        }}
      >
        {/* 破線ボーダーライン (例: 10万円のライン) */}
        {props.thresholdLabel && (
          <div
            style={{
              position: 'absolute',
              left: '-40px',
              right: '-40px',
              bottom: `${thresholdBottom}%`,
              borderBottom: `4px dashed ${palette.text}`,
              transform: `scaleX(${lineSpring})`,
              transformOrigin: 'left center',
              zIndex: 10
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '40px',
                bottom: '12px',
                fontSize: isPortrait ? '28px' : '20px',
                fontWeight: 900,
                color: palette.text
              }}
            >
              {props.thresholdLabel}
            </span>
          </div>
        )}

        {items.slice(0, 2).map((item, idx) => {
          const barSpring = spring({
            frame: Math.max(0, frame - (10 + idx * 10)),
            fps,
            config: { damping: 14, stiffness: 120 }
          });
          const heightPct = interpolate(barSpring, [0, 1], [0, item.numericValue ?? (idx === 0 ? 52 : 85)]);

          return (
            <div
              key={idx}
              style={{
                width: isPortrait ? '240px' : '170px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  backgroundColor: item.accent ? '#262626' : '#c7c4b8',
                  borderRadius: '14px',
                  boxShadow: item.accent ? '0 16px 36px rgba(0,0,0,0.16)' : 'none'
                }}
              />
              {/* 下部ラベル */}
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 16px)',
                  left: 0,
                  opacity: barSpring
                }}
              >
                <div style={{ fontSize: isPortrait ? '24px' : '18px', fontWeight: 800, color: palette.muted }}>
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: isPortrait ? '44px' : '30px',
                    fontWeight: 900,
                    color: item.accent ? palette.text : '#7c7b74',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.valueText}
                </div>
              </div>

              {/* 右横の +4万円 差分バー */}
              {idx === 1 && props.diffLabel && (
                <div
                  style={{
                    position: 'absolute',
                    left: 'calc(100% + 22px)',
                    bottom: `${items[0]?.numericValue ?? 52}%`,
                    height: `${(item.numericValue ?? 85) - (items[0]?.numericValue ?? 52)}%`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    opacity: diffSpring,
                    transform: `scaleY(${diffSpring})`,
                    transformOrigin: 'bottom center'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 10px)',
                      fontSize: isPortrait ? '36px' : '24px',
                      fontWeight: 900,
                      color: accentColor,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {props.diffLabel}
                  </span>
                  <div
                    style={{
                      width: '8px',
                      height: '100%',
                      backgroundColor: accentColor,
                      borderRadius: '4px'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // モード3: 横バー＆重量差分比較 (bars-horizontal: iPad mini 00:24 サイズ・重量)
  const renderBarsHorizontal = () => {
    const diffSpring = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 13 } });
    const secSpring = spring({ frame: Math.max(0, frame - 28), fps, config: { damping: 14 } });

    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: isPortrait ? '42px' : '24px' }}>
        {/* 横バー比較 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {items.map((item, idx) => {
            const bSpring = spring({
              frame: Math.max(0, frame - (6 + idx * 8)),
              fps,
              config: { damping: 14 }
            });
            const widthPct = interpolate(bSpring, [0, 1], [0, item.numericValue ?? (idx === 0 ? 72 : 62)]);
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div
                  style={{
                    width: `${widthPct}%`,
                    maxWidth: isPortrait ? '520px' : '380px',
                    height: isPortrait ? '52px' : '36px',
                    backgroundColor: item.accent ? '#262626' : '#c7c4b8',
                    borderRadius: '12px'
                  }}
                />
                <span
                  style={{
                    fontSize: isPortrait ? '42px' : '28px',
                    fontWeight: 900,
                    color: item.accent ? palette.text : '#7c7b74',
                    opacity: bSpring
                  }}
                >
                  {item.valueText || item.label}
                </span>
              </div>
            );
          })}

          {props.diffLabel && (
            <div
              style={{
                fontSize: isPortrait ? '86px' : '54px',
                fontWeight: 900,
                color: accentColor,
                letterSpacing: '-0.03em',
                opacity: diffSpring,
                transform: `scale(${interpolate(diffSpring, [0, 1], [0.85, 1])})`,
                transformOrigin: 'left center'
              }}
            >
              {props.diffLabel}
            </div>
          )}
        </div>

        {/* 2段目: 重さ比較ピル (293g → 255g / -38g) */}
        {props.secondaryComparison && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              opacity: secSpring,
              transform: `translateY(${interpolate(secSpring, [0, 1], [24, 0])}px)`
            }}
          >
            <div style={{ fontSize: isPortrait ? '30px' : '20px', fontWeight: 800, color: palette.muted }}>
              {props.secondaryComparison.heading}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div
                style={{
                  backgroundColor: '#d6d3cb',
                  color: '#6b6a63',
                  padding: isPortrait ? '24px 40px' : '16px 28px',
                  borderRadius: '20px',
                  fontSize: isPortrait ? '48px' : '32px',
                  fontWeight: 900
                }}
              >
                {props.secondaryComparison.fromLabel}
              </div>
              <span style={{ fontSize: isPortrait ? '40px' : '28px', fontWeight: 900, color: palette.muted }}>→</span>
              <div
                style={{
                  backgroundColor: '#262626',
                  color: '#ffffff',
                  padding: isPortrait ? '20px 38px' : '14px 26px',
                  borderRadius: '20px',
                  fontSize: isPortrait ? '48px' : '32px',
                  fontWeight: 900
                }}
              >
                {props.secondaryComparison.toLabel}
              </div>
            </div>
            <div
              style={{
                fontSize: isPortrait ? '82px' : '52px',
                fontWeight: 900,
                color: accentColor,
                letterSpacing: '-0.03em'
              }}
            >
              {props.secondaryComparison.diffText}
            </div>
          </div>
        )}
      </div>
    );
  };

  // モード4: 3デバイス比較＋カウントアップ％ (devices-3: iPhone Duo 00:43)
  const renderDevices3 = () => {
    const trio = items.slice(0, 3);
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: isPortrait ? '26px' : '20px', width: '100%' }}>
        {trio.map((item, idx) => {
          const dSpring = spring({
            frame: Math.max(0, frame - (8 + idx * 7)),
            fps,
            config: { damping: 14 }
          });
          const targetPct = item.numericValue ?? (idx === 0 ? 30 : idx === 1 ? 55 : 100);
          const currentPct = Math.round(interpolate(dSpring, [0, 1], [0, targetPct]));

          return (
            <div
              key={idx}
              style={{
                flex: idx === 2 ? 1.35 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                opacity: dSpring,
                transform: `translateY(${interpolate(dSpring, [0, 1], [30, 0])}px)`
              }}
            >
              {/* デバイスアイコン */}
              <div
                style={{
                  height: isPortrait ? '240px' : '160px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center'
                }}
              >
                {idx === 0 && (
                  <div
                    style={{
                      width: isPortrait ? '130px' : '90px',
                      height: isPortrait ? '220px' : '150px',
                      borderRadius: '22px',
                      border: '4px solid #181818',
                      backgroundColor: '#e5e4dc',
                      padding: '14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px'
                    }}
                  >
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: '6px',
                          backgroundColor: i === 2 ? accentColor : i % 2 === 0 ? '#181818' : '#ffffff'
                        }}
                      />
                    ))}
                  </div>
                )}
                {idx === 1 && (
                  <div
                    style={{
                      width: isPortrait ? '220px' : '150px',
                      height: isPortrait ? '220px' : '150px',
                      borderRadius: '22px',
                      border: '4px solid #181818',
                      backgroundColor: '#e5e4dc',
                      padding: '14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px'
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: '6px',
                          backgroundColor: i === 1 || i === 9 ? accentColor : i === 4 ? '#181818' : '#ffffff'
                        }}
                      />
                    ))}
                  </div>
                )}
                {idx === 2 && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '92%',
                        height: isPortrait ? '190px' : '130px',
                        borderRadius: '16px 16px 0 0',
                        border: '6px solid #181818',
                        backgroundColor: '#ffffff',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ width: '40%', height: '14px', borderRadius: '6px', backgroundColor: accentColor }} />
                      <div style={{ width: '85%', height: '12px', borderRadius: '6px', backgroundColor: '#cbd5e1' }} />
                      <div style={{ width: '75%', height: '12px', borderRadius: '6px', backgroundColor: '#cbd5e1' }} />
                    </div>
                    <div
                      style={{
                        width: '104%',
                        height: '16px',
                        backgroundColor: '#181818',
                        borderRadius: '0 0 12px 12px'
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: isPortrait ? '30px' : '20px',
                  fontWeight: 900,
                  color: item.accent ? accentColor : palette.text
                }}
              >
                {item.label}
              </div>

              {/* プログレスバー */}
              <div
                style={{
                  width: '100%',
                  height: '16px',
                  borderRadius: '999px',
                  backgroundColor: '#dfddd4',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${currentPct}%`,
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor: item.accent ? accentColor : '#9ca3af'
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: isPortrait ? '28px' : '20px',
                  fontWeight: 900,
                  color: item.accent ? accentColor : palette.muted,
                  fontFamily: "'SF Mono', 'Inter', monospace"
                }}
              >
                {currentPct}%
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const mode = props.comparisonMode || 'cards-2';

  return (
    <EditorialBackdrop props={props}>
      {mode === 'cards-2' && renderCards2()}
      {mode === 'bars-vertical' && renderBarsVertical()}
      {mode === 'bars-horizontal' && renderBarsHorizontal()}
      {mode === 'devices-3' && renderDevices3()}
    </EditorialBackdrop>
  );
};
