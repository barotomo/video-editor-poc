import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate, staticFile, Img } from 'remotion';
import type { EditorialKineticProps } from '../../types/videoSpec';
import { EditorialBackdrop, DEFAULT_ACCENT, getEditorialPalette } from '../components/EditorialBackdrop';
import { useLayout } from '../useLayout';

const resolveMediaSrc = (src: string): string =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src.replace(/^\//, ''));

export const EditorialKineticSlide: React.FC<{ props: EditorialKineticProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait } = useLayout();

  const accentColor = props.accentColor || DEFAULT_ACCENT;
  const palette = getEditorialPalette(props.theme, accentColor);

  const cardSpring = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 14, stiffness: 130 }
  });

  const renderSummaryIcon = (icon: string) => {
    if (icon === 'screen') {
      return (
        <div
          style={{
            width: '54px',
            height: '68px',
            borderRadius: '10px',
            backgroundColor: '#181818',
            border: '4px solid #3f3f46'
          }}
        />
      );
    }
    if (icon === 'size') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ width: '58px', height: '12px', borderRadius: '4px', backgroundColor: '#b5b3aa' }} />
          <div style={{ width: '58px', height: '7px', borderRadius: '4px', backgroundColor: '#181818' }} />
        </div>
      );
    }
    return (
      <div
        style={{
          width: '44px',
          height: '58px',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          backgroundColor: '#9ca3af'
        }}
      />
    );
  };

  // 3つの要点アイコンカード (iPad mini 00:06)
  const renderSummaryCards = () => {
    if (!props.summaryCards || props.summaryCards.length === 0) return null;
    return (
      <div style={{ width: '100%', marginTop: isPortrait ? '36px' : '20px' }}>
        {props.summaryHeading && (
          <div
            style={{
              fontSize: isPortrait ? '30px' : '22px',
              fontWeight: 800,
              color: palette.muted,
              marginBottom: '24px',
              opacity: cardSpring
            }}
          >
            {props.summaryHeading}
          </div>
        )}
        <div style={{ display: 'flex', gap: isPortrait ? '24px' : '18px', width: '100%' }}>
          {props.summaryCards.map((item, idx) => {
            const itemSpring = spring({
              frame: Math.max(0, frame - (16 + idx * 7)),
              fps,
              config: { damping: 13, stiffness: 150 }
            });
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: isPortrait ? '230px' : '160px',
                  backgroundColor: '#ffffff',
                  borderRadius: '28px',
                  boxShadow: '0 14px 34px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                  transform: `scale(${interpolate(itemSpring, [0, 1], [0.75, 1])}) translateY(${interpolate(
                    itemSpring,
                    [0, 1],
                    [30, 0]
                  )}px)`,
                  opacity: itemSpring
                }}
              >
                {renderSummaryIcon(item.icon)}
                <span style={{ fontSize: isPortrait ? '32px' : '22px', fontWeight: 900, color: '#181818' }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // デバイス＆メディアモックアップ描画
  const renderMediaPreset = () => {
    const preset = props.mediaPreset || (props.mediaUrl ? 'image' : 'none');
    if (preset === 'none') return null;

    // 1. 折りたたみスマホ展開アニメーション (fold-phone)
    if (preset === 'fold-phone') {
      const unfoldProgress = spring({
        frame: Math.max(0, frame - 14),
        fps,
        config: { damping: 15, stiffness: 90 }
      });
      const phoneWidth = interpolate(unfoldProgress, [0, 1], [isPortrait ? 260 : 180, isPortrait ? 520 : 360]);

      return (
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '32px',
            padding: isPortrait ? '44px 32px' : '28px',
            boxShadow: '0 18px 45px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            opacity: cardSpring,
            transform: `translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`
          }}
        >
          <div
            style={{
              width: `${phoneWidth}px`,
              height: isPortrait ? '360px' : '230px',
              backgroundColor: '#181818',
              borderRadius: '36px',
              padding: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
              display: 'flex',
              gap: '4px',
              position: 'relative'
            }}
          >
            {/* 左画面 */}
            <div
              style={{
                flex: 1,
                borderRadius: '26px',
                background: 'linear-gradient(145deg, #2d3748 0%, #1a202c 100%)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: interpolate(unfoldProgress, [0, 0.4, 1], [0.3, 0.8, 1])
              }}
            >
              <div style={{ width: '65%', height: '42%', borderRadius: '14px', backgroundColor: '#60a5fa' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '10px',
                      backgroundColor: i % 2 === 0 ? accentColor : '#f4f3ee'
                    }}
                  />
                ))}
              </div>
            </div>
            {/* 右画面 */}
            {unfoldProgress > 0.2 && (
              <div
                style={{
                  flex: unfoldProgress,
                  borderRadius: '26px',
                  background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
                  padding: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  alignContent: 'center'
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '10px',
                      backgroundColor: i === 2 || i === 7 ? accentColor : i % 3 === 0 ? '#38bdf8' : 'rgba(255,255,255,0.22)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          {props.mediaCredit && (
            <div style={{ alignSelf: 'flex-start', fontSize: '20px', fontWeight: 700, color: '#8c8a82', letterSpacing: '0.08em' }}>
              {props.mediaCredit}
            </div>
          )}
        </div>
      );
    }

    // 2. スマホ画面だけでは足りない (phone-chat-overflow: iPhone Duo 00:20)
    if (preset === 'phone-chat-overflow') {
      const pop2 = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 13 } });
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isPortrait ? '28px' : '20px',
            width: '100%'
          }}
        >
          {/* メインスマホ枠 */}
          <div
            style={{
              width: isPortrait ? '380px' : '260px',
              height: isPortrait ? '640px' : '400px',
              backgroundColor: '#ffffff',
              borderRadius: '44px',
              border: '6px solid #181818',
              boxShadow: '0 20px 50px rgba(0,0,0,0.10)',
              padding: '28px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              transform: `scale(${cardSpring})`
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#6b7280' }}>● AI</div>
            {['この画像どう？', '22秒のところを上に', '見ながら直したい'].map((msg, i) => {
              const bSpring = spring({ frame: Math.max(0, frame - (10 + i * 7)), fps, config: { damping: 14 } });
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: 'flex-end',
                    backgroundColor: i === 0 ? accentColor : 'rgba(232, 82, 34, 0.25)',
                    color: i === 0 ? '#ffffff' : accentColor,
                    padding: '12px 20px',
                    borderRadius: '20px',
                    fontSize: isPortrait ? '24px' : '16px',
                    fontWeight: 800,
                    transform: `scale(${bSpring})`,
                    opacity: bSpring
                  }}
                >
                  {msg}
                </div>
              );
            })}
          </div>

          {/* 右側の「× もう入らない」カード */}
          <div
            style={{
              width: isPortrait ? '300px' : '210px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              transform: `scale(${pop2}) translateX(${interpolate(pop2, [0, 1], [40, 0])}px)`,
              opacity: pop2
            }}
          >
            <div
              style={{
                backgroundColor: accentColor,
                color: '#ffffff',
                padding: '10px 22px',
                borderRadius: '999px',
                fontSize: isPortrait ? '26px' : '18px',
                fontWeight: 900,
                boxShadow: `0 8px 20px ${accentColor}55`
              }}
            >
              × もう入らない
            </div>
            <div
              style={{
                width: '100%',
                height: isPortrait ? '420px' : '270px',
                backgroundColor: '#ffffff',
                borderRadius: '32px',
                border: '4px solid #181818',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.08)'
              }}
            >
              <span
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(232,82,34,0.15)',
                  color: accentColor,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '18px',
                  fontWeight: 800
                }}
              >
                ● 成果物
              </span>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#181818' }}>36万円もする</div>
              <div
                style={{
                  flex: 1,
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '42px'
                }}
              >
                📱
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 3. 成果物 ⇄ AI 切り替えトグル (phone-toggle-ai: iPhone Duo 00:24)
    if (preset === 'phone-toggle-ai') {
      const isShowingAi = Math.floor(frame / 28) % 2 === 1;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: isPortrait ? '380px' : '260px',
              height: isPortrait ? '560px' : '360px',
              backgroundColor: '#ffffff',
              borderRadius: '44px',
              border: '6px solid #181818',
              padding: '26px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.10)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {isShowingAi ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#6b7280' }}>● AI チャット</div>
                <div
                  style={{
                    alignSelf: 'flex-end',
                    backgroundColor: accentColor,
                    color: '#fff',
                    padding: '12px 18px',
                    borderRadius: '18px',
                    fontSize: '22px',
                    fontWeight: 800
                  }}
                >
                  ここ直して
                </div>
                <div
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: '#f3f4f6',
                    color: '#181818',
                    padding: '12px 18px',
                    borderRadius: '18px',
                    fontSize: '22px',
                    fontWeight: 700
                  }}
                >
                  どこですか？
                </div>
                <div
                  style={{
                    alignSelf: 'flex-end',
                    backgroundColor: accentColor,
                    color: '#fff',
                    padding: '12px 18px',
                    borderRadius: '18px',
                    fontSize: '22px',
                    fontWeight: 800
                  }}
                >
                  えっと…18秒だっけ
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                <span
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(232,82,34,0.18)',
                    color: accentColor,
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '20px',
                    fontWeight: 800
                  }}
                >
                  ● 成果物プレビュー
                </span>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#181818' }}>36万円もする</div>
                <div
                  style={{
                    flex: 1,
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, #e5e7eb, #cbd5e1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '56px'
                  }}
                >
                  🎬
                </div>
              </div>
            )}
          </div>

          {/* 下部トグルピル: 成果物 ⇄ AI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span
              style={{
                padding: '10px 26px',
                borderRadius: '999px',
                backgroundColor: !isShowingAi ? '#181818' : '#d6d3cb',
                color: !isShowingAi ? '#ffffff' : '#6b7280',
                fontSize: '26px',
                fontWeight: 900
              }}
            >
              成果物
            </span>
            <span style={{ fontSize: '30px', fontWeight: 900, color: '#6b7280' }}>⇄</span>
            <span
              style={{
                padding: '10px 26px',
                borderRadius: '999px',
                backgroundColor: isShowingAi ? '#181818' : '#d6d3cb',
                color: isShowingAi ? '#ffffff' : '#6b7280',
                fontSize: '26px',
                fontWeight: 900
              }}
            >
              AI
            </span>
          </div>
        </div>
      );
    }

    // 4. スマホ2個分の大きさアイコン (fold-icon-2x: iPhone Duo 00:28)
    if (preset === 'fold-icon-2x') {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <div
            style={{
              width: isPortrait ? '360px' : '260px',
              height: isPortrait ? '360px' : '260px',
              backgroundColor: '#e5e4dc',
              borderRadius: '38px',
              border: '5px solid #181818',
              display: 'flex',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.10)',
              transform: `scale(${cardSpring})`
            }}
          >
            {[0, 1].map(half => (
              <div
                key={half}
                style={{
                  flex: 1,
                  borderRight: half === 0 ? '4px solid #181818' : 'none',
                  padding: '28px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '14px',
                  alignContent: 'center'
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '10px',
                      backgroundColor:
                        (half === 0 && (i === 0 || i === 10)) || (half === 1 && (i === 2 || i === 9))
                          ? accentColor
                          : i === 4 || i === 8
                          ? '#181818'
                          : '#ffffff'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. 画面分割 + 引き出し線コールアウト (fold-split-callouts: iPhone Duo 00:32)
    if (preset === 'fold-split-callouts') {
      const callouts = props.callouts || [
        { label: 'AIとやり取り', accent: false },
        { label: 'メールの返信', accent: true }
      ];
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              height: isPortrait ? '460px' : '300px',
              borderRadius: '32px',
              background: 'linear-gradient(135deg, #2b2927 0%, #181818 100%)',
              padding: isPortrait ? '36px' : '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.16)',
              transform: `scale(${cardSpring})`
            }}
          >
            {/* 折りたたみ2画面タブレットUI */}
            <div
              style={{
                width: '86%',
                height: '86%',
                backgroundColor: '#111111',
                borderRadius: '28px',
                padding: '10px',
                display: 'flex',
                gap: '8px',
                boxShadow: '0 14px 36px rgba(0,0,0,0.4)'
              }}
            >
              {/* 左画面: AIチャット */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#f8fafc',
                  borderRadius: '20px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#64748b' }}>AI Assistant</div>
                <div style={{ width: '80%', height: '24px', borderRadius: '8px', backgroundColor: '#cbd5e1' }} />
                <div style={{ width: '65%', height: '24px', borderRadius: '8px', backgroundColor: '#93c5fd', alignSelf: 'flex-end' }} />
                <div style={{ width: '85%', height: '38px', borderRadius: '10px', backgroundColor: '#e2e8f0' }} />
              </div>
              {/* 右画面: メール/アプリ */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 800, color: accentColor }}>Inbox • 返信作成</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', flex: 1 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        borderRadius: '12px',
                        backgroundColor: i === 0 ? accentColor : i === 1 ? '#38bdf8' : '#f1f5f9'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 引き出し線 + ピルラベル */}
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '84%', marginTop: '-6px' }}>
            {callouts.map((c, idx) => {
              const cSpring = spring({
                frame: Math.max(0, frame - (14 + idx * 8)),
                fps,
                config: { damping: 14 }
              });
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: cSpring,
                    transform: `translateY(${interpolate(cSpring, [0, 1], [16, 0])}px)`
                  }}
                >
                  <div
                    style={{
                      width: '3px',
                      height: isPortrait ? '56px' : '36px',
                      backgroundColor: c.accent ? accentColor : '#181818'
                    }}
                  />
                  <div
                    style={{
                      backgroundColor: c.accent ? accentColor : '#181818',
                      color: '#ffffff',
                      padding: isPortrait ? '14px 34px' : '10px 24px',
                      borderRadius: '999px',
                      fontSize: isPortrait ? '30px' : '20px',
                      fontWeight: 900,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.12)'
                    }}
                  >
                    {c.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 6. 新型iPad mini ヒーローモック (tablet-hero / tablet-oled / tablet-thin)
    if (preset === 'tablet-hero' || preset === 'tablet-oled' || preset === 'tablet-thin') {
      const tilt = preset === 'tablet-hero' ? -14 : 0;
      return (
        <div
          style={{
            width: '100%',
            backgroundColor: preset === 'tablet-oled' ? '#1a1a1a' : '#ffffff',
            borderRadius: '34px',
            padding: isPortrait ? '42px' : '28px',
            boxShadow: '0 22px 50px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            transform: `scale(${cardSpring})`
          }}
        >
          <div
            style={{
              width: isPortrait ? '480px' : '360px',
              height: isPortrait ? '600px' : '360px',
              backgroundColor: '#111111',
              borderRadius: '42px',
              border: '10px solid #27272a',
              padding: '16px',
              transform: `rotate(${tilt}deg)`,
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '28px',
                background:
                  preset === 'tablet-oled'
                    ? 'radial-gradient(circle at 50% 45%, #ff6b2b 0%, #c2410c 38%, #09090b 78%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #6366f1 45%, #ec4899 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <span
                style={{
                  fontSize: isPortrait ? '110px' : '72px',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  letterSpacing: '-0.04em',
                  textShadow: '0 10px 30px rgba(0,0,0,0.4)'
                }}
              >
                {preset === 'tablet-oled' ? 'OLED' : preset === 'tablet-thin' ? '5.4mm' : 'mini'}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 700, opacity: 0.9, marginTop: '8px' }}>
                {preset === 'tablet-oled'
                  ? '1,200 nits • Pro Contrast'
                  : preset === 'tablet-thin'
                  ? 'Ultra Thin & Light'
                  : 'All-New Design'}
              </span>
            </div>
          </div>
          {props.mediaCredit && (
            <div style={{ alignSelf: 'flex-start', fontSize: '20px', fontWeight: 700, color: '#8c8a82', letterSpacing: '0.08em' }}>
              {props.mediaCredit}
            </div>
          )}
        </div>
      );
    }

    // 7. 2段タブレットカード (tablet-dual-stack: iPhone Duo 00:50〜00:53)
    if (preset === 'tablet-dual-stack') {
      const bottomSpring = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 14 } });
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', alignItems: 'center' }}>
          {/* 上段: 成果物確認カード */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '32px',
              padding: '28px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
              display: 'flex',
              gap: '20px',
              transform: `scale(${cardSpring})`
            }}
          >
            <div
              style={{
                flex: 1,
                height: isPortrait ? '240px' : '150px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '28px',
                fontWeight: 900
              }}
            >
              📄 企画プレビュー
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#181818' }}>Getting Started</div>
              <div style={{ width: '90%', height: '14px', borderRadius: '6px', backgroundColor: '#e5e7eb' }} />
              <div style={{ width: '75%', height: '14px', borderRadius: '6px', backgroundColor: '#e5e7eb' }} />
              <div style={{ width: '60%', height: '14px', borderRadius: '6px', backgroundColor: accentColor }} />
            </div>
          </div>

          {/* 下段: キーボード指示カード */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '32px',
              padding: '28px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              opacity: bottomSpring,
              transform: `translateY(${interpolate(bottomSpring, [0, 1], [30, 0])}px)`
            }}
          >
            <div
              style={{
                alignSelf: 'center',
                backgroundColor: '#181818',
                color: '#ffffff',
                padding: '16px 24px',
                borderRadius: '18px',
                fontSize: '22px',
                fontWeight: 700
              }}
            >
              💬 「この部分のレイアウトをもう少し整理して」
            </div>
            <div
              style={{
                height: isPortrait ? '120px' : '80px',
                backgroundColor: '#27272a',
                borderRadius: '16px',
                padding: '12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '6px'
              }}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: '6px',
                    backgroundColor: i === 19 ? '#3b82f6' : '#52525b'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 8. 漫画紹介・説明欄（概要欄）誘導ガイド (manga-description-guide)
    //    他シーンの漫画コマと同じ「太い黒枠＋オフセット影＋スクリーントーン」で統一したデザイン
    if (preset === 'manga-description-guide') {
      const EMPHASIS_RED = '#dc1e28';
      const INK = '#141414';

      const panelSpring = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 14, stiffness: 140 } });
      const step1Spring = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 11, stiffness: 170 } });
      const arrowSpring = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 12, stiffness: 160 } });
      const step2Spring = spring({ frame: Math.max(0, frame - 24), fps, config: { damping: 11, stiffness: 170 } });

      const arrowBounce = Math.sin(frame * 0.28) * 7;
      // 3点リーダーのタップ波紋（約1秒ごとにループ）
      const tapCycle = (Math.max(0, frame - 28) % 32) / 32;
      const rippleScale = interpolate(tapCycle, [0, 1], [0.9, 1.6]);
      const rippleOpacity = frame < 28 ? 0 : interpolate(tapCycle, [0, 0.15, 1], [0, 0.85, 0]);
      const menuPulse = interpolate(Math.sin(frame * 0.22), [-1, 1], [0.98, 1.03]);

      const iconSize = isPortrait ? 150 : 104;

      const renderStepNumber = (num: string) => (
        <div
          style={{
            position: 'absolute',
            top: '-22px',
            left: '-22px',
            width: isPortrait ? '52px' : '38px',
            height: isPortrait ? '52px' : '38px',
            borderRadius: '50%',
            backgroundColor: EMPHASIS_RED,
            border: `4px solid ${INK}`,
            color: '#ffffff',
            fontSize: isPortrait ? '28px' : '20px',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            zIndex: 3
          }}
        >
          {num}
        </div>
      );

      return (
        <div style={{ position: 'relative', width: '100%' }}>
          {/* メインの漫画コマ枠（他シーンと同じ太い黒枠＋アクセントカラーのソリッド影） */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              backgroundColor: '#ffffff',
              padding: isPortrait ? '14px' : '10px',
              border: `5px solid ${INK}`,
              boxShadow: props.theme === 'manga-dark' ? `12px 12px 0px ${accentColor}` : `12px 12px 0px ${INK}`,
              boxSizing: 'border-box',
              transform: `translateY(${interpolate(panelSpring, [0, 1], [28, 0])}px) scale(${interpolate(
                panelSpring,
                [0, 1],
                [0.94, 1]
              )}) rotate(-0.4deg)`,
              opacity: interpolate(panelSpring, [0, 0.35, 1], [0, 0.9, 1])
            }}
          >
            {/* コマ内側（細枠＋スクリーントーン） */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                border: `2px solid ${INK}`,
                backgroundColor: '#ffffff',
                backgroundImage: 'radial-gradient(rgba(20,20,20,0.11) 2.2px, transparent 2.2px)',
                backgroundSize: '14px 14px',
                padding: isPortrait ? '64px 24px 58px' : '40px 16px 36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isPortrait ? '34px' : '24px',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* STEP 1: Shorts右上の3点リーダー */}
              <div
                style={{
                  position: 'relative',
                  transform: `scale(${interpolate(step1Spring, [0, 1], [0.6, 1])})`,
                  opacity: step1Spring
                }}
              >
                {renderStepNumber('1')}
                {/* タップ波紋 */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: `5px solid ${EMPHASIS_RED}`,
                    transform: `scale(${rippleScale})`,
                    opacity: rippleOpacity,
                    pointerEvents: 'none'
                  }}
                />
                <div
                  style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`,
                    backgroundColor: INK,
                    border: `4px solid ${INK}`,
                    boxShadow: `6px 6px 0px ${EMPHASIS_RED}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isPortrait ? '12px' : '8px',
                    boxSizing: 'border-box'
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: isPortrait ? '16px' : '11px',
                        height: isPortrait ? '16px' : '11px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 矢印（漫画風・赤ベタ＋黒フチ） */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  transform: `translateX(${arrowBounce}px) scale(${interpolate(arrowSpring, [0, 1], [0.4, 1])})`,
                  opacity: arrowSpring
                }}
              >
                <svg width={isPortrait ? '104' : '72'} height={isPortrait ? '84' : '58'} viewBox="20 4 92 76" fill="none">
                  {/* 矢印本体 */}
                  <path
                    d="M 26 30 L 66 30 L 66 10 L 106 42 L 66 74 L 66 54 L 26 54 Z"
                    fill={EMPHASIS_RED}
                    stroke={INK}
                    strokeWidth="6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* STEP 2: メニュー内の「説明」項目 */}
              <div
                style={{
                  position: 'relative',
                  transform: `scale(${interpolate(step2Spring, [0, 1], [0.6, 1]) * (frame > 40 ? menuPulse : 1)})`,
                  opacity: step2Spring
                }}
              >
                {renderStepNumber('2')}
                <div
                  style={{
                    height: `${iconSize}px`,
                    minWidth: isPortrait ? '300px' : '210px',
                    backgroundColor: '#ffffff',
                    border: `4px solid ${INK}`,
                    boxShadow: `6px 6px 0px ${EMPHASIS_RED}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isPortrait ? '20px' : '14px',
                    padding: isPortrait ? '0 34px' : '0 24px',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* 説明（概要）アイコン */}
                  <svg
                    width={isPortrait ? '46' : '32'}
                    height={isPortrait ? '40' : '28'}
                    viewBox="0 0 24 21"
                    fill="none"
                    stroke={INK}
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  >
                    <line x1="2" y1="3" x2="22" y2="3" />
                    <line x1="2" y1="10.5" x2="15" y2="10.5" />
                    <line x1="2" y1="18" x2="22" y2="18" />
                  </svg>
                  <span
                    style={{
                      fontSize: isPortrait ? '56px' : '38px',
                      fontWeight: 900,
                      color: INK,
                      letterSpacing: '0.02em',
                      fontFamily:
                        "'M PLUS Rounded 1c', 'Hiragino Kaku Gothic StdN', 'Hiragino Sans', 'Noto Sans JP', sans-serif"
                    }}
                  >
                    説明
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 9. カスタム画像 / 漫画コマカード (image / manga-panel)
    if (props.mediaUrl) {
      const switchFrame = props.footerStartFrame ?? 45;
      const hasSecond = Boolean(props.secondaryMediaUrl);
      const isSecondActive = hasSecond && frame >= switchFrame;
      const secondSpring = spring({
        frame: Math.max(0, frame - switchFrame),
        fps,
        config: { damping: 14, stiffness: 150 }
      });

      const activeUrl = isSecondActive && props.secondaryMediaUrl ? props.secondaryMediaUrl : props.mediaUrl;
      const activeSpring = isSecondActive ? secondSpring : cardSpring;
      const subtleZoom = interpolate(
        isSecondActive ? frame - switchFrame : frame,
        [0, 90],
        [1.0, 1.03],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

      const isMangaStyle =
        props.mediaPreset === 'manga-panel' ||
        props.theme === 'manga-page' ||
        props.theme === 'manga-dark';

      if (isMangaStyle) {
        const isPinkScene01 = Boolean(props.focusLines || props.watermark === '01');
        const panelBorderColor = '#141414';
        const panelShadowColor = '#141414';

        // シーン01冒頭フック演出（案1）：
        // 0〜14フレームは「扉の隙間から覗く女の子の目元（左上26%, 24%）」に2.35倍で超ドアップし、
        // 15フレーム目（『ヤバすぎた』着弾直前）から一気に全体像（1.0倍）へ急ズームアウトする
        const pullBackStart = (props.footerStartFrame ?? 16) - 2;
        const pullBackSpring = spring({
          frame: Math.max(0, frame - pullBackStart),
          fps,
          config: { damping: 12, stiffness: 210, mass: 0.6 }
        });
        const scene01EyeScale =
          frame < pullBackStart
            ? interpolate(frame, [0, pullBackStart], [2.38, 2.26], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              })
            : interpolate(pullBackSpring, [0, 1], [2.26, 1.0]) +
              interpolate(frame, [pullBackStart + 12, 85], [0, 0.05], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp'
              });

        // シーン01用：漫画描き文字（右上『！？』）のポップイン＆小刻みな震え（案3）
        const sfx1Spring = spring({
          frame: Math.max(0, frame - 3),
          fps,
          config: { damping: 10, stiffness: 240, mass: 0.5 }
        });
        const sfxJitterX = Math.sin(frame * 2.4) * 2.5;
        const sfxJitterY = Math.cos(frame * 3.1) * 2.5;

        return (
          <div style={{ position: 'relative', width: '100%' }}>
            {/* 2コマ目表示時に背後に少しずれて残る1コマ目の重なり枠（漫画の重ねコマ表現） */}
            {isSecondActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#ffffff',
                  border: `4px solid ${panelBorderColor}`,
                  transform: 'translate(-14px, -14px) rotate(-1.5deg)',
                  opacity: 0.45,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                <Img
                  src={resolveMediaSrc(props.mediaUrl)}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'grayscale(100%) contrast(1.1)'
                  }}
                />
              </div>
            )}

            {/* メインの漫画コマ枠（太い枠線＋ソリッド影） */}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                backgroundColor: '#ffffff',
                padding: isPortrait ? '14px' : '10px',
                border: `5px solid ${panelBorderColor}`,
                boxShadow:
                  props.theme === 'manga-dark'
                    ? `12px 12px 0px ${accentColor}`
                    : `12px 12px 0px ${panelShadowColor}`,
                display: 'flex',
                flexDirection: 'column',
                transform:
                  props.motionStyle === 'zoom-out'
                    ? `translateY(${interpolate(activeSpring, [0, 1], [-12, 0])}px) scale(${interpolate(
                        activeSpring,
                        [0, 1],
                        [1.08, 1]
                      )}) rotate(${isSecondActive ? '0.6deg' : '-0.4deg'})`
                    : `translateY(${interpolate(activeSpring, [0, 1], [28, 0])}px) scale(${interpolate(
                        activeSpring,
                        [0, 1],
                        [0.94, 1]
                      )}) rotate(${isSecondActive ? '0.6deg' : '-0.4deg'})`,
                opacity: interpolate(activeSpring, [0, 0.35, 1], [0, 0.9, 1])
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  border: `2px solid ${panelBorderColor}`,
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Img
                  src={resolveMediaSrc(activeUrl)}
                  alt={props.title}
                  style={{
                    width: '100%',
                    maxHeight: isPortrait ? '740px' : '380px',
                    objectFit: 'contain',
                    transformOrigin: isPinkScene01 ? '26% 24%' : 'center center',
                    transform: `scale(${
                      isPinkScene01
                        ? scene01EyeScale
                        : props.motionStyle === 'zoom-out'
                        ? interpolate(frame, [0, 85], [1.14, 1.0], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp'
                          })
                        : props.focusLines
                        ? interpolate(frame, [0, 85], [1.0, 1.08], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp'
                          })
                        : subtleZoom
                    })`
                  }}
                />
              </div>

              {/* シーン01用：漫画描き文字エフェクト（右上『！？』） */}
              {isPinkScene01 && (
                <div
                  style={{
                    position: 'absolute',
                    top: isPortrait ? '-34px' : '-22px',
                    right: isPortrait ? '-18px' : '-12px',
                    zIndex: 6,
                    pointerEvents: 'none',
                    opacity: interpolate(sfx1Spring, [0, 0.3, 1], [0, 1, 1]),
                    transform: `translate(${sfxJitterX}px, ${sfxJitterY}px) scale(${interpolate(
                      sfx1Spring,
                      [0, 0.75, 1],
                      [0.2, 1.18, 1]
                    )}) rotate(11deg) skewX(-10deg)`,
                    fontFamily:
                      "'M PLUS Rounded 1c', 'Hiragino Kaku Gothic StdN', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
                    fontSize: isPortrait ? '88px' : '56px',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: '#e01e26',
                    WebkitTextStroke: isPortrait ? '15px #ffffff' : '10px #ffffff',
                    paintOrder: 'stroke fill',
                    filter:
                      'drop-shadow(0px 4px 0px #141414) drop-shadow(5px 7px 0px #141414) drop-shadow(0px 10px 14px rgba(0,0,0,0.28))',
                    letterSpacing: '-0.06em'
                  }}
                >
                  ！？
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '28px',
            padding: isPortrait ? '20px' : '16px',
            border: '2px solid rgba(24,24,24,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            transform: `translateY(${interpolate(activeSpring, [0, 1], [24, 0])}px) scale(${interpolate(
              activeSpring,
              [0, 1],
              [0.95, 1]
            )})`,
            opacity: interpolate(activeSpring, [0, 0.4, 1], [0.2, 0.9, 1])
          }}
        >
          <div
            style={{
              width: '100%',
              borderRadius: '18px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Img
              src={resolveMediaSrc(activeUrl)}
              alt={props.title}
              style={{
                width: '100%',
                maxHeight: isPortrait ? '740px' : '380px',
                objectFit: 'contain',
                transform: `scale(${subtleZoom})`
              }}
            />
          </div>
          {props.mediaCredit && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: '#8c8a82',
                letterSpacing: '0.08em',
                fontFamily: "'SF Mono', 'Inter', monospace"
              }}
            >
              <span>{props.mediaCredit}</span>
              {hasSecond && (
                <span style={{ color: accentColor }}>
                  PANEL {isSecondActive ? '02 / 02' : '01 / 02'}
                </span>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <EditorialBackdrop props={props}>
      {renderMediaPreset()}
      {renderSummaryCards()}
    </EditorialBackdrop>
  );
};

