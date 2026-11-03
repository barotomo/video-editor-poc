import React from 'react';
import { Sequence, AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { VideoSpec, Scene } from '../types/videoSpec';
import { isEditorialTemplate } from '../types/videoSpec';
import { TextCardSlide } from './templates/TextCardSlide';
import { CodeBlockSlide } from './templates/CodeBlockSlide';
import { StatGraphSlide } from './templates/StatGraphSlide';
import { SocialPostSlide } from './templates/SocialPostSlide';
import { EditorialKineticSlide } from './templates/EditorialKineticSlide';
import { EditorialComparisonSlide } from './templates/EditorialComparisonSlide';
import { EditorialWorkflowSlide } from './templates/EditorialWorkflowSlide';
import { EditorialListSlide } from './templates/EditorialListSlide';
import { SpeakerAvatar } from './components/SpeakerAvatar';
import { SubtitleBox } from './components/SubtitleBox';
import { useLayout, GlobalFrameContext } from './useLayout';

interface MainVideoProps {
  spec: VideoSpec;
}

/** `/voices/a.mp3` のような public 配下パスは staticFile で解決し、http(s) はそのまま使う */
const resolveAudioSrc = (src: string): string =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src.replace(/^\//, ''));

const renderSlideTemplate = (scene: Scene) => {
  const autoFooterStart =
    scene.dialogues.length >= 2 ? scene.dialogues[0]?.durationFrames || 45 : undefined;
  const effectiveProps =
    isEditorialTemplate(scene.template) &&
    (scene.props as any).footerStartFrame === undefined &&
    autoFooterStart !== undefined
      ? { ...scene.props, footerStartFrame: autoFooterStart }
      : scene.props;

  switch (scene.template) {
    case 'text-card':
      return <TextCardSlide props={effectiveProps as any} />;
    case 'code-block':
      return <CodeBlockSlide props={effectiveProps as any} />;
    case 'stat-graph':
      return <StatGraphSlide props={effectiveProps as any} />;
    case 'social-post':
      return <SocialPostSlide props={effectiveProps as any} />;
    case 'editorial-kinetic':
      return <EditorialKineticSlide props={effectiveProps as any} />;
    case 'editorial-comparison':
      return <EditorialComparisonSlide props={effectiveProps as any} />;
    case 'editorial-workflow':
      return <EditorialWorkflowSlide props={effectiveProps as any} />;
    case 'editorial-list':
      return <EditorialListSlide props={effectiveProps as any} />;
    default:
      return <TextCardSlide props={effectiveProps as any} />;
  }
};

export const MainVideo: React.FC<MainVideoProps> = ({ spec }) => {
  const { isPortrait } = useLayout();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const hasEditorialScenes = spec.scenes.some(s => isEditorialTemplate(s.template));
  let currentStartFrame = 0;

  return (
    <GlobalFrameContext.Provider value={frame}>
      <AbsoluteFill style={{ backgroundColor: '#000000', fontFamily: "'Inter', sans-serif" }}>
      {/* エディトリアル・モーション動画用の最上部プログレスバー */}
      {hasEditorialScenes && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: isPortrait ? '10px' : '6px',
            backgroundColor: 'rgba(0,0,0,0.08)',
            zIndex: 100,
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              width: `${Math.min(100, ((frame + 1) / Math.max(1, durationInFrames)) * 100)}%`,
              height: '100%',
              backgroundColor: '#e85222'
            }}
          />
        </div>
      )}

      {spec.scenes.map((scene, sceneIndex) => {
        const sceneDuration = scene.dialogues.reduce(
          (sum, d) => sum + (d.durationFrames || 90),
          0
        );

        const sceneFrom = currentStartFrame;
        currentStartFrame += sceneDuration;
        const isEditorial = isEditorialTemplate(scene.template);
        const hideBottomSubtitle = isEditorial && (scene.props as any).hideBottomSubtitle !== false;

        return (
          <Sequence
            key={scene.id || `scene-${sceneIndex}`}
            from={sceneFrom}
            durationInFrames={sceneDuration}
          >
            <AbsoluteFill>
              {/* 1. バックグラウンド スライド（「型」テンプレート） */}
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

                  // キャラ(話者)はオプション。未指定のセリフは字幕のみ表示する
                  const speakerInfo = dialogue.speaker
                    ? spec.speakers[dialogue.speaker] || {
                        id: dialogue.speaker,
                        name: dialogue.speaker,
                        color: '#6366f1',
                        avatarBg: '#e0e7ff',
                        iconText: '💬'
                      }
                    : undefined;

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
                        {/* ボイス(オプション): セリフの表示開始と同時に再生 */}
                        {dialogue.audioUrl && <Audio src={resolveAudioSrc(dialogue.audioUrl)} />}

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
                          {speakerInfo && (
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

                          {(!hideBottomSubtitle || speakerInfo) && (
                            <SubtitleBox text={dialogue.text} speaker={speakerInfo} />
                          )}
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
    </GlobalFrameContext.Provider>
  );
};
