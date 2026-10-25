import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';
import type { VideoSpec, Scene, Dialogue } from '../types/videoSpec';
import { TextCardSlide } from './templates/TextCardSlide';
import { CodeBlockSlide } from './templates/CodeBlockSlide';
import { StatGraphSlide } from './templates/StatGraphSlide';
import { SocialPostSlide } from './templates/SocialPostSlide';
import { SpeakerAvatar } from './components/SpeakerAvatar';
import { SubtitleBox } from './components/SubtitleBox';
import { useLayout } from './useLayout';

interface MainVideoProps {
  spec: VideoSpec;
}

const renderSlideTemplate = (scene: Scene) => {
  switch (scene.template) {
    case 'text-card':
      return <TextCardSlide props={scene.props as any} />;
    case 'code-block':
      return <CodeBlockSlide props={scene.props as any} />;
    case 'stat-graph':
      return <StatGraphSlide props={scene.props as any} />;
    case 'social-post':
      return <SocialPostSlide props={scene.props as any} />;
    default:
      return <TextCardSlide props={scene.props as any} />;
  }
};

export const MainVideo: React.FC<MainVideoProps> = ({ spec }) => {
  const { isPortrait } = useLayout();
  let currentStartFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', fontFamily: "'Inter', sans-serif" }}>
      {spec.scenes.map((scene, sceneIndex) => {
        const sceneDuration = scene.dialogues.reduce(
          (sum, d) => sum + (d.durationFrames || 90),
          0
        );

        const sceneFrom = currentStartFrame;
        currentStartFrame += sceneDuration;

        return (
          <Sequence
            key={scene.id || `scene-${sceneIndex}`}
            from={sceneFrom}
            durationInFrames={sceneDuration}
          >
            <AbsoluteFill>
              {/* 1. バックグラウンド スライド（「型」テンプレート）
                  ショート(縦)ではスライドを上部に収め、下部を立ち絵+字幕に充てる */}
              <div style={{ width: '100%', height: '100%' }}>
                {renderSlideTemplate(scene)}
              </div>

              {/* 2. 対話（ダイアログ）オーバーレイ & 話者アバター & 字幕 */}
              {(() => {
                let dialogueStartFrame = 0;
                return scene.dialogues.map((dialogue, dialogueIndex) => {
                  const dialogueDuration = dialogue.durationFrames || 90;
                  const dialogueFrom = dialogueStartFrame;
                  dialogueStartFrame += dialogueDuration;

                  const speakerInfo =
                    spec.speakers[dialogue.speaker] || {
                      id: dialogue.speaker,
                      name: dialogue.speaker,
                      color: '#6366f1',
                      avatarBg: '#e0e7ff',
                      iconText: '💬'
                    };

                  return (
                    <Sequence
                      key={`dialogue-${dialogueIndex}`}
                      from={dialogueFrom}
                      durationInFrames={dialogueDuration}
                    >
                      <AbsoluteFill
                        style={{
                          pointerEvents: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          // ショートはUI(タイトル/ボタン)と被らないよう下部に安全余白を確保
                          padding: isPortrait ? '40px 32px 200px' : '40px'
                        }}
                      >
                        <div />

                        {/* 下部領域: 話者アバター (左/右) と 字幕ボックス */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            alignItems: 'center'
                          }}
                        >
                          <div
                            style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: dialogueIndex % 2 === 0 ? 'flex-start' : 'flex-end',
                              padding: isPortrait ? '0 8px' : '0 40px'
                            }}
                          >
                            <SpeakerAvatar
                              speaker={speakerInfo}
                              emotion={dialogue.emotion}
                              isSpeaking={true}
                              position={dialogueIndex % 2 === 0 ? 'left' : 'right'}
                              facing={dialogue.facing}
                              transform={dialogue.transform}
                            />
                          </div>

                          <SubtitleBox text={dialogue.text} speaker={speakerInfo} />
                        </div>
                      </AbsoluteFill>
                    </Sequence>
                  );
                });
              })()}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
