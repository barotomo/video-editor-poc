import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import type { SpeakerInfo, SpeakerEmotion, ElementTransform } from '../../types/videoSpec';

interface SpeakerAvatarProps {
  speaker: SpeakerInfo;
  emotion?: SpeakerEmotion;
  isSpeaking: boolean;
  position?: 'left' | 'right';
  transform?: ElementTransform;
}

export const SpeakerAvatar: React.FC<SpeakerAvatarProps> = ({
  speaker,
  emotion = 'normal',
  isSpeaking,
  position = 'left',
  transform
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 口パクアニメーション
  const mouthOpen = isSpeaking ? Math.abs(Math.sin(frame * 0.4)) * 12 : 2;

  // 話している時のピョンピョンアニメーション
  const bounceY = isSpeaking ? Math.sin(frame * 0.3) * 8 : 0;

  // 出現アニメーション (Spring)
  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 }
  });

  const baseScale = transform?.scale ?? 1.0;
  const scale = interpolate(entrySpring, [0, 1], [0.6 * baseScale, 1.0 * baseScale]);

  const xPx = transform?.x ?? 0;
  const yPx = transform?.y ?? 0;

  // 立ち絵画像の URL 解決
  // 1. avatarBasePath がある場合: ポーズ別画像 (e.g. /tachie/zundamon/happy.png)
  // 2. avatarImage がある場合: 単一画像フォールバック
  const resolveAvatarUrl = (): string | null => {
    if (speaker.avatarBasePath) {
      const basePath = speaker.avatarBasePath.endsWith('/')
        ? speaker.avatarBasePath
        : speaker.avatarBasePath + '/';
      const posePath = `${basePath}${emotion}.png`;
      if (posePath.startsWith('http')) return posePath;
      // Vite dev環境では public/ 以下のファイルはルートパスで直接参照できる
      // キャッシュバスターを付与して古い（表情なし）キャッシュを破棄
      return `${posePath}?v=2`;
    }
    if (speaker.avatarImage) {
      if (speaker.avatarImage.startsWith('http')) return speaker.avatarImage;
      return speaker.avatarImage;
    }
    return null;
  };

  const avatarSrc = resolveAvatarUrl();
  // デバッグ: 開発時のみ
  console.log('[SpeakerAvatar]', speaker.id, 'emotion=', emotion, 'avatarBasePath=', speaker.avatarBasePath, '=> src=', avatarSrc);

  return (
    <div
      style={{
        transform: `translate(${xPx}px, ${yPx + bounceY}px) scale(${scale})`,
        display: 'flex',
        flexDirection: position === 'right' ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '16px',
        opacity: isSpeaking ? 1 : 0.7,
        transition: 'opacity 0.2s ease-in-out',
        transformOrigin: position === 'right' ? 'bottom right' : 'bottom left'
      }}
    >
      {/* 立ち絵画像が存在する場合 */}
      {avatarSrc ? (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* 本格立ち絵イラスト画像 */}
          <div
            style={{
              height: '320px',
              maxHeight: '40vh',
              display: 'flex',
              alignItems: 'flex-end',
              filter: isSpeaking
                ? `drop-shadow(0 0 15px ${speaker.color}aa)`
                : 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))'
            }}
          >
            <img
              key={avatarSrc}
              src={avatarSrc}
              alt={speaker.name}
              style={{
                height: '100%',
                objectFit: 'contain',
                userSelect: 'none'
              }}
            />
          </div>
        </div>
      ) : (
        /* フォールバック用アバターサークル */
        <div
          style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: speaker.avatarBg,
            border: `4px solid ${speaker.color}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: isSpeaking
              ? `0 0 25px ${speaker.color}88`
              : '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}
        >
          <span style={{ fontSize: '48px', userSelect: 'none' }}>
            {speaker.iconText}
          </span>

          <div
            style={{
              position: 'absolute',
              bottom: '18px',
              width: '16px',
              height: `${mouthOpen}px`,
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              transition: 'height 0.05s linear'
            }}
          />
        </div>
      )}

      {/* ネームタグ & 話中インジケータ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: position === 'right' ? 'flex-end' : 'flex-start',
          marginBottom: '20px'
        }}
      >
        <div
          style={{
            backgroundColor: speaker.color,
            color: '#ffffff',
            padding: '6px 16px',
            borderRadius: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {speaker.name}
          {isSpeaking && (
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'inline-block'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
