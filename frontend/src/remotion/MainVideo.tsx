import React from 'react';
import { Sequence, AbsoluteFill } from 'remotion';
import type { VideoSpec, Scene } from '../types/videoSpec';
import { TextCardSlide } from './templates/TextCardSlide';
import { CodeBlockSlide } from './templates/CodeBlockSlide';
import { StatGraphSlide } from './templates/StatGraphSlide';
import { SocialPostSlide } from './templates/SocialPostSlide';
import { VideoClipSlide } from './templates/VideoClipSlide';
import { SpeakerAvatar } from './components/SpeakerAvatar';
import { SubtitleBox } from './components/SubtitleBox';
import { useLayout } from './useLayout';
import type { VideoClipProps } from '../types/videoSpec';

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
    case 'video-clip':
      return <VideoClipSlide props={scene.props as any} />;
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
                const isVideoClip = scene.template === 'video-clip';
                const videoProps = isVideoClip ? (scene.props as VideoClipProps) : null;
                const showAvatar = isVideoClip ? !!videoProps?.showSpeakerAvatar : true;
                const showSubtitle = isVideoClip ? !!videoProps?.showSubtitleBox : true;

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
                          padding: isPortrait
                            ? isVideoClip
                              ? '0px'
                              : '40px 32px 200px'
                            : '40px'
                        }}
                      >
                        {/* video-clip テンプレート時の上部特大セリフ */}
                        {isVideoClip ? (
                          <div
                            style={{
                              flex: isPortrait ? '0 0 33%' : '0 0 26%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              padding: isPortrait ? '40px 32px 10px' : '20px 40px',
                              boxSizing: 'border-box',
                              zIndex: 20
                            }}
                          >
                            <div
                              style={{
                                fontFamily:
                                  "'M PLUS Rounded 1c', 'Dela Gothic One', 'Noto Sans JP', sans-serif",
                                fontSize: isPortrait
                                  ? dialogue.text.length > 20
                                    ? '50px'
                                    : '68px'
                                  : '38px',
                                fontWeight: 900,
                                color: videoProps?.textColor || '#000000',
                                textAlign: 'center',
                                lineHeight: 1.32,
                                letterSpacing: '-0.02em',
                                whiteSpace: 'pre-wrap',
                                maxWidth: '92%'
                              }}
                            >
                              {dialogue.text}
                            </div>
                          </div>
                        ) : (
                          <div />
                        )}

                        {/* 下部領域: 話者アバター (左/右) と 字幕ボックス (通常テンプレートまたは明示的に有効な場合) */}
                        {(showAvatar || showSubtitle) && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '20px',
                              alignItems: 'center',
                              paddingBottom: isPortrait && isVideoClip ? '40px' : '0'
                            }}
                          >
                            {showAvatar && (
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
                            )}

                            {showSubtitle && (
                              <SubtitleBox text={dialogue.text} speaker={speakerInfo} />
                            )}
                          </div>
                        )}
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
