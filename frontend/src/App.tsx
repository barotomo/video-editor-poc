import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { MainVideo } from './remotion/MainVideo';
import { calculateTotalFrames, getSceneStartFrame, getDialogueStartFrame } from './remotion/Root';
import { sampleVideoSpec } from './types/sampleSpec';
import type { VideoSpec, Scene, TemplateType, ElementTransform } from './types/videoSpec';
import { InteractiveCanvas, type CanvasMode } from './components/InteractiveCanvas';
import { Code, Layout, Plus, Trash2, RefreshCw, Film, Sparkles, AlertCircle, Move } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  const [videoSpec, setVideoSpec] = useState<VideoSpec>(sampleVideoSpec);
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(sampleVideoSpec, null, 2)
  );
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [selectedDialogueIndex, setSelectedDialogueIndex] = useState<number>(0);
  const [isCanvasEditMode, setIsCanvasEditMode] = useState<boolean>(true);
  const [canvasTarget, setCanvasTarget] = useState<CanvasMode>('preview');

  // 「スライド配置」または「話者アバター配置」が選択されている時は画面内タップでの再生を無効化
  const isPlacementModeActive = isCanvasEditMode && (canvasTarget === 'slide' || canvasTarget === 'avatar');

  const playerRef = useRef<PlayerRef>(null);

  // 総フレーム数と総秒数の計算
  const totalFrames = useMemo(() => {
    return calculateTotalFrames(videoSpec);
  }, [videoSpec]);

  const totalSeconds = (totalFrames / (videoSpec.fps || 30)).toFixed(1);

  // シーン・ダイアログ変更時に該当フレームに自動シーク
  useEffect(() => {
    if (playerRef.current) {
      const targetFrame = getDialogueStartFrame(videoSpec, selectedSceneIndex, selectedDialogueIndex);
      playerRef.current.seekTo(targetFrame);
    }
  }, [selectedSceneIndex, selectedDialogueIndex]);

  // JSONテキスト変更時のリアルタイム更新
  const handleJsonChange = (text: string) => {
    setJsonInput(text);
    try {
      const parsed = JSON.parse(text);
      setVideoSpec(parsed);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || '無効なJSONフォーマットです');
    }
  };

  // VideoSpecオブジェクト更新ヘルパー
  const updateSpec = (newSpec: VideoSpec) => {
    setVideoSpec(newSpec);
    setJsonInput(JSON.stringify(newSpec, null, 2));
    setJsonError(null);
  };

  // キャンバスからのトランスフォーム座標更新（双方向同期）
  const handleUpdateTransform = (
    target: 'slide' | 'avatar',
    transform: ElementTransform
  ) => {
    const newScenes = [...videoSpec.scenes];
    const currentScene = { ...newScenes[selectedSceneIndex] };

    if (target === 'slide') {
      currentScene.props = {
        ...currentScene.props,
        transform
      };
    } else {
      const newDialogues = [...currentScene.dialogues];
      const targetDialogue = { ...newDialogues[selectedDialogueIndex] };
      targetDialogue.transform = transform;
      newDialogues[selectedDialogueIndex] = targetDialogue;
      currentScene.dialogues = newDialogues;
    }

    newScenes[selectedSceneIndex] = currentScene;
    updateSpec({ ...videoSpec, scenes: newScenes });
  };

  // シーン追加
  const addScene = () => {
    const newScene: Scene = {
      id: `scene-${videoSpec.scenes.length + 1}`,
      template: 'text-card',
      props: {
        title: '新しいシーン',
        subtitle: 'サブタイトルを入力してください',
        themeColor: '#6366f1',
        transform: { x: 0, y: 0, scale: 1.0 }
      },
      dialogues: [
        {
          speaker: 'zundamon',
          emotion: 'normal',
          text: '新しいセリフを追加したのだ！',
          durationFrames: 90,
          transform: { x: 0, y: 0, scale: 1.0 }
        }
      ]
    };
    const newScenes = [...videoSpec.scenes, newScene];
    updateSpec({ ...videoSpec, scenes: newScenes });
    setSelectedSceneIndex(newScenes.length - 1);
    setSelectedDialogueIndex(0);
  };

  // シーン削除
  const removeScene = (index: number) => {
    if (videoSpec.scenes.length <= 1) return;
    const newScenes = videoSpec.scenes.filter((_, i) => i !== index);
    updateSpec({ ...videoSpec, scenes: newScenes });
    if (selectedSceneIndex >= newScenes.length) {
      setSelectedSceneIndex(newScenes.length - 1);
      setSelectedDialogueIndex(0);
    }
  };

  // 選択中シーンの変更
  const updateCurrentScene = (updater: (prev: Scene) => Scene) => {
    const newScenes = [...videoSpec.scenes];
    newScenes[selectedSceneIndex] = updater(newScenes[selectedSceneIndex]);
    updateSpec({ ...videoSpec, scenes: newScenes });
  };

  // セリフの追加
  const addDialogue = () => {
    updateCurrentScene(scene => ({
      ...scene,
      dialogues: [
        ...scene.dialogues,
        {
          speaker: 'zundamon',
          emotion: 'happy',
          text: '追加されたセリフなのだ！',
          durationFrames: 90,
          transform: { x: 0, y: 0, scale: 1.0 }
        }
      ]
    }));
  };

  // セリフの削除
  const removeDialogue = (dialogueIndex: number) => {
    updateCurrentScene(scene => ({
      ...scene,
      dialogues: scene.dialogues.filter((_, i) => i !== dialogueIndex)
    }));
    if (selectedDialogueIndex >= currentScene.dialogues.length - 1) {
      setSelectedDialogueIndex(Math.max(0, currentScene.dialogues.length - 2));
    }
  };

  const currentScene = videoSpec.scenes[selectedSceneIndex] || videoSpec.scenes[0];

  return (
    <div className="app-container">
      {/* 1. トップナビゲーションバー */}
      <header className="app-header">
        <div className="header-brand">
          <Film className="brand-icon" />
          <div>
            <h1>JSON Hybrid Video Editor</h1>
            <p>自動動画生成 × 直感キャンバス編集 (D&D / Resize / JSON同期)</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="stats-badge">
            <span>⏱️ {totalSeconds}秒 ({totalFrames} frames)</span>
            <span>📐 {videoSpec.width}x{videoSpec.height} @ {videoSpec.fps}fps</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => updateSpec(sampleVideoSpec)}
          >
            <RefreshCw size={16} /> サンプルJSONリセット
          </button>
        </div>
      </header>

      {/* 2. メインコンテンツ（左右2カラム） */}
      <main className="main-layout">
        {/* 左カラム: JSON / フォーム エディター */}
        <section className="editor-section">
          {/* タブ切り替え */}
          <div className="editor-tabs">
            <button
              className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
              onClick={() => setActiveTab('form')}
            >
              <Layout size={16} /> フォーム編集
            </button>
            <button
              className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <Code size={16} /> JSON直接編集
            </button>
          </div>

          {/* フォーム編集モード */}
          {activeTab === 'form' && (
            <div className="form-editor">
              {/* シーンセレクター */}
              <div className="scene-selector-bar">
                <div className="scene-chips">
                  {videoSpec.scenes.map((scene, idx) => (
                    <button
                      key={scene.id || idx}
                      className={`scene-chip ${selectedSceneIndex === idx ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSceneIndex(idx);
                        setSelectedDialogueIndex(0);
                      }}
                    >
                      <span>シーン {idx + 1}</span>
                      <span className="template-badge">{scene.template}</span>
                    </button>
                  ))}
                </div>
                <button className="btn-icon-add" onClick={addScene} title="新しいシーンを追加">
                  <Plus size={18} />
                </button>
              </div>

              {/* 選択中シーンの編集 */}
              {currentScene && (
                <div className="scene-edit-card">
                  <div className="card-header">
                    <h3>シーン {selectedSceneIndex + 1} の設定</h3>
                    {videoSpec.scenes.length > 1 && (
                      <button
                        className="btn-danger-icon"
                        onClick={() => removeScene(selectedSceneIndex)}
                        title="このシーンを削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* テンプレート選択 */}
                  <div className="form-group">
                    <label>スライド型（テンプレート）</label>
                    <select
                      value={currentScene.template}
                      onChange={e => {
                        const newTemplate = e.target.value as TemplateType;
                        updateCurrentScene(scene => ({
                          ...scene,
                          template: newTemplate
                        }));
                      }}
                    >
                      <option value="text-card">テキストカード (タイトル & メッセージ)</option>
                      <option value="code-block">コードブロック (ソースコード表示)</option>
                      <option value="stat-graph">統計データ / 比較グラフ</option>
                      <option value="social-post">SNSポスト風 (X/Twitter)</option>
                    </select>
                  </div>

                  {/* シーンプロップス（タイトル等）簡易編集 */}
                  <div className="form-group">
                    <label>メインタイトル / 見出し</label>
                    <input
                      type="text"
                      value={(currentScene.props as any).title || (currentScene.props as any).authorName || ''}
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentScene(scene => {
                          const newProps = { ...scene.props };
                          if (scene.template === 'social-post') {
                            (newProps as any).authorName = val;
                          } else {
                            (newProps as any).title = val;
                          }
                          return { ...scene, props: newProps };
                        });
                      }}
                    />
                  </div>

                  {/* セリフ一覧編集 */}
                  <div className="dialogues-section">
                    <div className="section-title">
                      <h4>セリフ & 話者演出</h4>
                      <button className="btn-sm" onClick={addDialogue}>
                        <Plus size={14} /> セリフ追加
                      </button>
                    </div>

                    <div className="dialogues-list">
                      {currentScene.dialogues.map((dialogue, dIdx) => (
                        <div
                          key={dIdx}
                          className={`dialogue-card ${selectedDialogueIndex === dIdx ? 'selected' : ''}`}
                          onClick={() => setSelectedDialogueIndex(dIdx)}
                        >
                          <div className="dialogue-header">
                            <select
                              value={dialogue.speaker}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(scene => {
                                  const newD = [...scene.dialogues];
                                  newD[dIdx].speaker = val;
                                  return { ...scene, dialogues: newD };
                                });
                              }}
                            >
                              {Object.entries(videoSpec.speakers).map(([id, info]) => (
                                <option key={id} value={id}>
                                  {info.iconText} {info.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={dialogue.emotion || 'normal'}
                              onChange={e => {
                                const val = e.target.value as any;
                                updateCurrentScene(scene => {
                                  const newD = [...scene.dialogues];
                                  newD[dIdx].emotion = val;
                                  return { ...scene, dialogues: newD };
                                });
                              }}
                            >
                              <option value="normal">😊 普通</option>
                              <option value="happy">😄 笑顔</option>
                              <option value="surprised">😲 驚き</option>
                              <option value="thinking">🤔 思考</option>
                              <option value="explaining">💡 解説</option>
                              <option value="sad">😢 悲しい</option>
                              <option value="angry">😠 怒り</option>
                            </select>

                            <div className="frame-input">
                              <label>表示時間(F):</label>
                              <input
                                type="number"
                                value={dialogue.durationFrames}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 30;
                                  updateCurrentScene(scene => {
                                    const newD = [...scene.dialogues];
                                    newD[dIdx].durationFrames = val;
                                    return { ...scene, dialogues: newD };
                                  });
                                }}
                              />
                            </div>

                            <button
                              className="btn-danger-sm"
                              onClick={e => {
                                e.stopPropagation();
                                removeDialogue(dIdx);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <textarea
                            rows={2}
                            value={dialogue.text}
                            onChange={e => {
                              const val = e.target.value;
                              updateCurrentScene(scene => {
                                const newD = [...scene.dialogues];
                                newD[dIdx].text = val;
                                return { ...scene, dialogues: newD };
                              });
                            }}
                            placeholder="セリフテキストを入力..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON直接編集モード */}
          {activeTab === 'json' && (
            <div className="json-editor">
              {jsonError && (
                <div className="json-error-banner">
                  <AlertCircle size={18} />
                  <span>{jsonError}</span>
                </div>
              )}
              <textarea
                className="json-textarea"
                value={jsonInput}
                onChange={e => handleJsonChange(e.target.value)}
                spellCheck={false}
              />
            </div>
          )}
        </section>

        {/* 右カラム: Remotion Player & インタラクティブ・キャンバス */}
        <section className="preview-section">
          <div className="preview-card">
            <div className="preview-header">
              <h3>
                <Sparkles size={18} className="icon-glow" /> リアルタイム動画プレビュー
              </h3>

              {/* D&D編集モード トグルスイッチ */}
              <button
                className={`canvas-toggle-btn ${isCanvasEditMode ? 'active' : ''}`}
                onClick={() => setIsCanvasEditMode(!isCanvasEditMode)}
              >
                <Move size={14} />
                <span>{isCanvasEditMode ? '操作バー ON' : '操作バー OFF'}</span>
              </button>
            </div>

            {/* Remotion Player & インタラクティブ・オーバーレイ */}
            <div className="player-wrapper" style={{ position: 'relative' }}>
              <Player
                ref={playerRef}
                component={MainVideo}
                inputProps={{ spec: videoSpec }}
                durationInFrames={Math.max(1, totalFrames)}
                compositionWidth={videoSpec.width || 1280}
                compositionHeight={videoSpec.height || 720}
                fps={videoSpec.fps || 30}
                style={{
                  width: '100%',
                  aspectRatio: `${videoSpec.width}/${videoSpec.height}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
                controls
                autoPlay={false}
                loop
                clickToPlay={!isPlacementModeActive}
                doubleClickToFullscreen={!isPlacementModeActive}
              />

              {/* 直感ドラッグ＆ドロップ編集オーバーレイ */}
              {isCanvasEditMode && (
                <InteractiveCanvas
                  spec={videoSpec}
                  activeSceneIndex={selectedSceneIndex}
                  activeDialogueIndex={selectedDialogueIndex}
                  selectedTarget={canvasTarget}
                  onSelectTarget={setCanvasTarget}
                  onUpdateTransform={handleUpdateTransform}
                />
              )}
            </div>

            <div className="preview-footer">
              <div className="render-info">
                <h4>MP4 レンダリング（手動微調整結果を反映）</h4>
                <p>以下のコマンドを実行すると、画面上で操作した配置・サイズ・JSON設定でMP4動画が出力されます:</p>
                <code className="cmd-code">
                  npx remotion render src/remotion/index.ts MainVideo out/video.mp4
                </code>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;