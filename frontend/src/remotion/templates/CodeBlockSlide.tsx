import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import type { CodeBlockProps } from '../../types/videoSpec';

export const CodeBlockSlide: React.FC<{ props: CodeBlockProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowSpring = spring({ frame, fps, config: { damping: 14 } });
  const windowScale = interpolate(windowSpring, [0, 1], [0.9, 1]);

  // タイピング風アニメーション（フレーム経過に応じて表示文字数を増やす）
  const totalChars = props.code.length;
  const charsToShow = Math.min(totalChars, Math.floor(frame * 1.5));
  const displayedCode = props.code.slice(0, charsToShow);

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
        padding: '50px',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
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
        {/* コードウィンドウコンテナ */}
        <div
          style={{
            transform: `scale(${windowScale})`,
            opacity: windowSpring,
            width: '100%',
            maxWidth: '960px',
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* ウィンドウヘッダー */}
          <div
            style={{
              backgroundColor: '#0f172a',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #334155'
            }}
          >
            {/* macOS風 ボタン */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            </div>

            {/* ファイル名 */}
            <span style={{ color: '#94a3b8', fontSize: '15px', fontFamily: 'monospace', fontWeight: 600 }}>
              {props.fileName || 'script.json'}
            </span>

            <span style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', fontWeight: 700 }}>
              {props.language}
            </span>
          </div>

          {/* コード領域 */}
          <div style={{ padding: '24px 30px', overflowX: 'auto' }}>
            <pre
              style={{
                margin: 0,
                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace",
                fontSize: '22px',
                lineHeight: 1.6,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {displayedCode}
              {charsToShow < totalChars && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '24px',
                    backgroundColor: '#38bdf8',
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    opacity: Math.sin(frame * 0.5) > 0 ? 1 : 0
                  }}
                />
              )}
            </pre>
          </div>
        </div>

        {props.title && (
          <div
            style={{
              marginTop: '28px',
              color: '#cbd5e1',
              fontSize: '24px',
              fontWeight: 600,
              textAlign: 'center'
            }}
          >
            {props.title}
          </div>
        )}
      </div>
    </div>
  );
};
