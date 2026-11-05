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
              {/* 0. 漫画ショート演出効果音 (SE) - ユーザー提供の「効果音」フォルダ音源を適用 */}
              {isEditorial && (() => {
                // お手本プロジェクト0001 (桜木さん) のみ、黄金パターンのデフォルトSEをプリセット適用
                const isSakuragiManga = scene.id?.startsWith('manga-') || spec.title?.includes('桜木');
                const isScene1 = isSakuragiManga && (sceneIndex === 0 || (scene.props as any).watermark === '01' || scene.id === 'manga-1');
                const isScene2 = isSakuragiManga && (sceneIndex === 1 || (scene.props as any).watermark === '02' || scene.id === 'manga-2');
                const isScene6 = isSakuragiManga && (sceneIndex === 5 || (scene.props as any).watermark === '06' || scene.id === 'manga-6');
                const isScene7 = isSakuragiManga && (sceneIndex === 6 || (scene.props as any).watermark === '07' || scene.id === 'manga-7');
                const isScene11 = isSakuragiManga && ((sceneIndex === 10 || (scene.props as any).watermark === '11') && ((scene.props as any).theme === 'manga-dark' || scene.id === 'manga-11'));
                const customSEList: Array<{ frame: number; src: string; volume?: number; durationFrames?: number }> = (scene.props as any).soundEffects || [];

                return (
                  <>
                    {/* シーン1: 右上「！？」出現時に「驚く.mp3」 (※桜木さん専用) */}
                    {isScene1 && (
                      <Sequence from={3} durationInFrames={30}>
                        <Audio src={resolveAudioSrc('/se/驚く.mp3')} volume={0.65} />
                      </Sequence>
                    )}
                    {/* シーン1: 「ヤバすぎた」スタンプ着弾時に「小パンチ.mp3」＋「和太鼓でドドン.mp3」 (※桜木さん専用) */}
                    {isScene1 && (
                      <Sequence
                        from={(scene.props as any).footerStartFrame ?? 84}
                        durationInFrames={45}
                      >
                        <Audio src={resolveAudioSrc('/se/小パンチ.mp3')} volume={0.8} />
                        <Audio src={resolveAudioSrc('/se/和太鼓でドドン.mp3')} volume={0.7} />
                      </Sequence>
                    )}
                    {/* スラッシュコマ割りワイプ時 (manga-slash): 「シーン切り替え1.mp3」 (※桜木さん専用) */}
                    {isSakuragiManga && (scene.props as any).transition === 'manga-slash' && !isScene1 && !isScene7 && !isScene11 && (
                      <Sequence from={0} durationInFrames={30}>
                        <Audio src={resolveAudioSrc('/se/シーン切り替え1.mp3')} volume={0.55} />
                      </Sequence>
                    )}
                    {/* ブラインドストライプ時 (blinds): 「パパッ.mp3」 (※桜木さん専用) */}
                    {isSakuragiManga && (scene.props as any).transition === 'blinds' && (
                      <Sequence from={0} durationInFrames={25}>
                        <Audio src={resolveAudioSrc('/se/パパッ.mp3')} volume={0.5} />
                      </Sequence>
                    )}
                    {/* シーン2: ヒロインのセリフ吹き出しポップイン時に「ニュッ1.mp3」 (※桜木さん専用) */}
                    {isScene2 && (
                      <Sequence from={2} durationInFrames={15}>
                        <Audio src={resolveAudioSrc('/se/ニュッ1.mp3')} volume={0.6} />
                      </Sequence>
                    )}
                    {/* シーン6: 「彼女は〜」からのセリフのタイミングで「涙のしずく.mp3」 (※桜木さん専用) */}
                    {isScene6 && (
                      <Sequence
                        from={(scene.props as any).footerStartFrame ?? (scene.dialogues[0]?.durationFrames || 65)}
                        durationInFrames={50}
                      >
                        <Audio src={resolveAudioSrc('/se/涙のしずく.mp3')} volume={0.75} />
                      </Sequence>
                    )}
                    {/* シーン7: 先輩の肯定セリフ・登場時に「シャキーン1.mp3」 (※桜木さん専用) */}
                    {isScene7 && (
                      <Sequence from={0} durationInFrames={55}>
                        <Audio src={resolveAudioSrc('/se/シャキーン1.mp3')} volume={0.75} />
                      </Sequence>
                    )}
                    {/* シーン11: 最大の引き・暗転目撃時に「ショック1.mp3」 (※桜木さん専用) */}
                    {isScene11 && (
                      <Sequence from={2} durationInFrames={74}>
                        <Audio src={resolveAudioSrc('/se/ショック1.mp3')} volume={0.75} />
                      </Sequence>
                    )}
                    {/* ユーザー指定シーン切り替えSE */}
                    {(scene.props as any).transitionSE && (
                      <Sequence from={0} durationInFrames={45}>
                        <Audio src={resolveAudioSrc((scene.props as any).transitionSE)} volume={0.65} />
                      </Sequence>
                    )}
                    {/* ユーザー指定テキスト・コマ切り替えSE (後方互換用: panels側に指定がない場合のみ再生) */}
                    {(scene.props as any).textTriggerSE && (!Array.isArray((scene.props as any).panels) || !(scene.props as any).panels.some((p: any) => p.triggerSE)) && (
                      <Sequence
                        from={(scene.props as any).footerStartFrame ?? (scene.dialogues[0]?.durationFrames || 45)}
                        durationInFrames={45}
                      >
                        <Audio src={resolveAudioSrc((scene.props as any).textTriggerSE)} volume={0.7} />
                      </Sequence>
                    )}
                    {/* コマごとの指定効果音 (panels[i].triggerSE) */}
                    {Array.isArray((scene.props as any).panels) && (() => {
                      let cumFrames = 0;
                      return (scene.props as any).panels.map((p: any, pIdx: number) => {
                        const startF = cumFrames;
                        cumFrames += (p.durationFrames || 60);
                        if (!p.triggerSE) return null;
                        return (
                          <Sequence
                            key={`panel-trigger-se-${pIdx}`}
                            from={startF}
                            durationInFrames={45}
                          >
                            <Audio src={resolveAudioSrc(p.triggerSE)} volume={0.7} />
                          </Sequence>
                        );
                      });
                    })()}
                    {/* 着弾パンチライン指定効果音 (punchlineTriggerSE: シーン01等の着弾時再生) */}
                    {((scene.props as any).punchlineTriggerSE || (scene.props as any).panels?.[0]?.punchlineTriggerSE) && (
                      <Sequence
                        from={(scene.props as any).footerStartFrame ?? 45}
                        durationInFrames={45}
                      >
                        <Audio
                          src={resolveAudioSrc(
                            (scene.props as any).punchlineTriggerSE || (scene.props as any).panels?.[0]?.punchlineTriggerSE
                          )}
                          volume={0.8}
                        />
                      </Sequence>
                    )}
                    {/* ユーザー定義カスタムSE */}
                    {customSEList.map((cse, idx) => (
                      <Sequence
                        key={`custom-se-${idx}`}
                        from={cse.frame}
                        durationInFrames={cse.durationFrames || 45}
                      >
                        <Audio src={resolveAudioSrc(cse.src)} volume={cse.volume ?? 0.7} />
                      </Sequence>
                    ))}
                  </>
                );
              })()}

              {/* 1. バックグラウンド スライド（「型」テンプレート） */}
              <div style={{ width: '100%', height: '100%' }}>
                {renderSlideTemplate(scene)}
              </div>

              {/* 2. 音声（ボイス）再生: 次の独自音声が始まるまで（またはシーン末尾まで）途切れず再生 */}
              {(() => {
                let currentAudioStartFrame = 0;
                return scene.dialogues.map((dialogue, dialogueIndex) => {
                  const dialogueDuration = dialogue.durationFrames || 90;
                  const dialogueFrom = currentAudioStartFrame;
                  currentAudioStartFrame += dialogueDuration;

                  if (!dialogue.audioUrl) return null;

                  // 後続のダイアログに別の audioUrl が指定されるまで、またはシーン末尾までの尺を算出
                  let audioDuration = dialogueDuration;
                  for (let nextIdx = dialogueIndex + 1; nextIdx < scene.dialogues.length; nextIdx++) {
                    const nextD = scene.dialogues[nextIdx];
                    if (nextD.audioUrl) {
                      break; // 別の独自音声ファイルがある場合はそこで終了
                    }
                    audioDuration += (nextD.durationFrames || 90);
                  }

                  return (
                    <Sequence
                      key={`dialogue-audio-${dialogueIndex}`}
                      from={dialogueFrom}
                      durationInFrames={audioDuration}
                    >
                      <Audio src={resolveAudioSrc(dialogue.audioUrl)} />
                    </Sequence>
                  );
                });
              })()}

              {/* 3. 対話（ダイアログ）オーバーレイ & 話者アバター & 字幕 */}
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
                        <div />

                        {/* 下部領域: 話者アバター (左/右) と 字幕ボックス (エディトリアルテンプレートでは非表示) */}
                        {!isEditorial && (
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
    </GlobalFrameContext.Provider>
  );
};
