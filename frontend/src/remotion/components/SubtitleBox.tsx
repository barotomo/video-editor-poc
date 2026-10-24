import React from 'react';
import { useCurrentFrame, spring, useVideoConfig } from 'remotion';
import type { SpeakerInfo } from '../../types/videoSpec';

interface SubtitleBoxProps {
  text: string;
  speaker?: SpeakerInfo;
}

export const SubtitleBox: React.FC<SubtitleBoxProps> = ({ text, speaker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrySpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.4 }
  });

  const translateY = (1 - entrySpring) * 20;

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: entrySpring,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 40px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          borderLeft: speaker ? `6px solid ${speaker.color}` : '6px solid #6366f1',
          borderRadius: '12px',
          padding: '18px 28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {speaker && (
          <span
            style={{
              color: speaker.color,
              fontSize: '16px',
              fontWeight: 'bold',
              letterSpacing: '0.05em'
            }}
          >
            {speaker.name}
          </span>
        )}
        <p
          style={{
            margin: 0,
            color: '#f8fafc',
            fontSize: '28px',
            fontWeight: '600',
            lineHeight: 1.4,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.02em'
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};
