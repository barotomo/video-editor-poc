import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { MainVideo } from './remotion/MainVideo';
import { calculateTotalFrames, getDialogueStartFrame } from './remotion/Root';
import type { VideoSpec, Scene, TemplateType, ElementTransform } from './types/videoSpec';
import { VIDEO_FORMATS, getVideoFormat, isEditorialTemplate } from './types/videoSpec';
import type { Project } from './types/project';
import { CHARACTER_PRESETS } from './types/project';
import { InteractiveCanvas, type CanvasMode } from './components/InteractiveCanvas';
import { MangaWorkspace } from './components/MangaWorkspace';
import { Code, Layout, Plus, Trash2, Film, Sparkles, AlertCircle, Move, ArrowLeft, BookOpen } from 'lucide-react';
import './App.css';

interface EditorProps {
  project: Project;
  onBack: () => void;
  onSave: (project: Project) => void;
}

export const Editor: React.FC<EditorProps> = ({ project, onBack, onSave }) => {
  const [videoSpec, setVideoSpec] = useState<VideoSpec>(project.spec);
  const [projectName, setProjectName] = useState<string>(project.name);
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(project.spec, null, 2)
  );

  const isMangaProject = useMemo(() => {
    return (
      project.format === 'shorts' &&
      videoSpec.scenes.some(
        s =>
          (s.props as any)?.theme === 'manga-page' ||
          (s.props as any)?.theme === 'manga-dark' ||
          (s.props as any)?.mediaPreset === 'manga-panel' ||
          s.id?.startsWith('manga-') ||
          s.id?.startsWith('yofukashi-') ||
          s.id?.startsWith('blank-manga')
      )
    );
  }, [project.format, videoSpec]);

  const [activeTab, setActiveTab] = useState<'manga' | 'form' | 'json'>(() =>
    project.format === 'shorts' ? 'manga' : 'form'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [selectedDialogueIndex, setSelectedDialogueIndex] = useState<number>(0);
  const [isCanvasEditMode, setIsCanvasEditMode] = useState<boolean>(true);
  const [canvasTarget, setCanvasTarget] = useState<CanvasMode>('preview');

  // 「スライド配置」または「話者アバター配置」が選択されている時は画面内タップでの再生を無効化
  const isPlacementModeActive = isCanvasEditMode && (canvasTarget === 'slide' || canvasTarget === 'avatar');

  const playerRef = useRef<PlayerRef>(null);

  // 変更を自動保存（連続編集は少し待ってからまとめて保存）
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoSpec === project.spec && projectName === project.name) return;
      onSave({
        ...project,
        name: projectName.trim() || '無題のプロジェクト',
        format: getVideoFormat(videoSpec),
        spec: { ...videoSpec, title: projectName.trim() || videoSpec.title },
        updatedAt: Date.now()
      });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSpec, projectName]);

  // ページアンロード直前（リロードやタブ閉じ）にも未保存分を確実に即時保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      onSave({
        ...project,
        name: projectName.trim() || '無題のプロジェクト',
        format: getVideoFormat(videoSpec),
        spec: { ...videoSpec, title: projectName.trim() || videoSpec.title },
        updatedAt: Date.now()
      });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [project, projectName, videoSpec, onSave]);

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

  // テンプレート切り替え時の初期プロップス生成
  const buildDefaultPropsForTemplate = (template: TemplateType, prevProps: any = {}) => {
    const baseTitle = prevProps.title || '新しい見出しを\n**ここに**入力';
    const transform = prevProps.transform || { x: 0, y: 0, scale: 1.0 };

    switch (template) {
      case 'editorial-kinetic':
        return {
          theme: prevProps.theme || 'light-grid',
          transition: prevProps.transition || 'none',
          badgeType: prevProps.badgeType || 'live-pill',
          badgeText: prevProps.badgeText || '速報',
          title: baseTitle,
          mediaPreset: prevProps.mediaPreset || 'tablet-hero',
          mediaCredit: prevProps.mediaCredit || 'IMAGE: APPLE',
          footerHeadline: prevProps.footerHeadline || '',
          transform
        };
      case 'editorial-comparison':
        return {
          theme: prevProps.theme || 'light-grid',
          transition: prevProps.transition || 'none',
          badgeType: prevProps.badgeType || 'step-pill',
          stepNumber: prevProps.stepNumber || '1',
          badgeText: prevProps.badgeText || 'スペック比較',
          title: baseTitle,
          comparisonMode: prevProps.comparisonMode || 'cards-2',
          items: prevProps.items || [
            { label: '前モデル', valueText: '500ニト', numericValue: 50, visual: 'glow-dim' },
            { label: '新型', valueText: '1,200ニト', numericValue: 90, accent: true, visual: 'glow-bright' }
          ],
          diffLabel: prevProps.diffLabel || '+4万円',
          thresholdLabel: prevProps.thresholdLabel || '10万円のライン',
          footerHeadline: prevProps.footerHeadline || '2倍以上//',
          transform
        };
      case 'editorial-workflow':
        return {
          theme: prevProps.theme || 'dark',
          transition: prevProps.transition || 'none',
          badgeType: prevProps.badgeType || 'mono-label',
          badgeText: prevProps.badgeText || 'WORKFLOW',
          title: baseTitle,
          workflowMode: prevProps.workflowMode || 'vertical-loop',
          steps: prevProps.steps || [
            { label: '頼む', timeOrDate: '10/26', sublabel: 'Step 1', positionPercent: 25, accent: true },
            { label: 'レビュー', timeOrDate: '10/28', sublabel: 'Step 2', positionPercent: 52 },
            { label: '指示', timeOrDate: '10/29', sublabel: 'Step 3', positionPercent: 78 },
            { label: '送る' }
          ],
          loopLabel: prevProps.loopLabel || 'また頼む',
          footerHeadline: prevProps.footerHeadline || 'こういう作業が、\n**結構多い。**',
          transform
        };
      case 'editorial-list':
        return {
          theme: prevProps.theme || 'light-grid',
          transition: prevProps.transition || 'blinds',
          badgeType: prevProps.badgeType || 'mono-label',
          badgeText: prevProps.badgeText || 'CHECKPOINT',
          title: baseTitle,
          listMode: prevProps.listMode || 'checklist',
          items: prevProps.items || [
            { text: '防水防塵に対応', subtext: 'IP67', tag: 'today' },
            { text: 'チップは A20 Pro', subtext: '最新のiPhoneと同じ', tag: 'preorder' },
            { text: 'フロントカメラが横に', subtext: 'ビデオ通話がしやすい', tag: 'release' }
          ],
          footerHeadline: prevProps.footerHeadline || '',
          brandFooter: prevProps.brandFooter || 'PAULNOROMAN.',
          transform
        };
      case 'code-block':
        return {
          title: prevProps.title || 'サンプルコード',
          language: 'typescript',
          fileName: 'index.ts',
          code: 'console.log("Hello Video!");',
          transform
        };
      case 'stat-graph':
        return {
          title: prevProps.title || 'データ比較',
          items: [
            { label: '項目 A', value: 80, color: '#3b82f6' },
            { label: '項目 B', value: 45, color: '#10b981' }
          ],
          transform
        };
      case 'social-post':
        return {
          authorName: prevProps.authorName || 'ユーザー名',
          authorHandle: '@user_handle',
          content: 'ここにSNS投稿テキストを入力します。',
          likesCount: '1,200',
          repostsCount: '340',
          transform
        };
      default:
        return {
          title: prevProps.title || '新しいシーン',
          subtitle: prevProps.subtitle || 'サブタイトルを入力してください',
          themeColor: '#6366f1',
          transform
        };
    }
  };

  // シーン追加
  const addScene = () => {
    const useEditorial = videoSpec.scenes.some(s => isEditorialTemplate(s.template)) || getVideoFormat(videoSpec) === 'shorts';
    const defaultTemplate: TemplateType = useEditorial ? 'editorial-kinetic' : 'text-card';
    const newScene: Scene = {
      id: `scene-${videoSpec.scenes.length + 1}`,
      template: defaultTemplate,
      props: buildDefaultPropsForTemplate(defaultTemplate) as any,
      dialogues: [
        {
          text: '新しいセリフを入力してください',
          durationFrames: 90
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
          text: 'セリフを入力してください',
          durationFrames: 90
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

  // 動画フォーマット（通常動画 / ショート動画）。幅と高さから判定する
  const currentFormat = getVideoFormat(videoSpec);
  const isShorts = currentFormat === 'shorts';

  return (
    <div className="app-container">
      {/* 1. トップナビゲーションバー */}
      <header className="app-header">
        <div className="header-brand">
          <button className="btn btn-secondary" onClick={onBack} title="プロジェクト一覧に戻る">
            <ArrowLeft size={16} /> プロジェクト
          </button>
          <Film className="brand-icon" />
          <div>
            <input
              className="project-name-input"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              aria-label="プロジェクト名"
            />
            <p>変更は自動で保存されます</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="stats-badge">
            <span>
              {VIDEO_FORMATS[currentFormat].icon} {VIDEO_FORMATS[currentFormat].label} ({VIDEO_FORMATS[currentFormat].ratio})
            </span>
            <span>⏱️ {totalSeconds}秒 ({totalFrames} frames)</span>
            <span>📐 {videoSpec.width}x{videoSpec.height} @ {videoSpec.fps}fps</span>
          </div>
        </div>
      </header>

      {/* 2. メインコンテンツ（左右2カラム） */}
      <main className="main-layout">
        {/* 左カラム: JSON / フォーム エディター */}
        <section className="editor-section">
          {/* タブ切り替え */}
          <div className="editor-tabs">
            {isMangaProject && (
              <button
                className={`tab-btn ${activeTab === 'manga' ? 'active' : ''}`}
                onClick={() => setActiveTab('manga')}
                style={{
                  color: activeTab === 'manga' ? '#fb7185' : undefined,
                  fontWeight: activeTab === 'manga' ? 700 : undefined
                }}
              >
                <BookOpen size={16} /> 漫画ワークスペース
              </button>
            )}
            {!isMangaProject && (
              <button
                className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}
                onClick={() => setActiveTab('form')}
              >
                <Layout size={16} /> 詳細フォーム編集
              </button>
            )}
            <button
              className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
              onClick={() => setActiveTab('json')}
            >
              <Code size={16} /> JSON直接編集
            </button>
          </div>

          {/* 漫画紹介ショート専用ワークスペース */}
          {activeTab === 'manga' && (
            <MangaWorkspace
              videoSpec={videoSpec}
              updateSpec={updateSpec}
              selectedSceneIndex={selectedSceneIndex}
              setSelectedSceneIndex={setSelectedSceneIndex}
              playerRef={playerRef}
            />
          )}

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
                          template: newTemplate,
                          props: buildDefaultPropsForTemplate(newTemplate, scene.props) as any
                        }));
                      }}
                    >
                      <optgroup label="✨ エディトリアル・モーション (参考動画スタイル)">
                        <option value="editorial-kinetic">✨ 見出し＋デバイス・メディア演出 (editorial-kinetic)</option>
                        <option value="editorial-comparison">📊 スペック・価格・カード比較 (editorial-comparison)</option>
                        <option value="editorial-workflow">🔄 ステップフロー・隙間時間・タイムライン (editorial-workflow)</option>
                        <option value="editorial-list">☑️ チェックリスト・コメント・カレンダー・曜日CTA (editorial-list)</option>
                      </optgroup>
                      <optgroup label="📌 ベーシックテンプレート">
                        <option value="text-card">テキストカード (タイトル & メッセージ)</option>
                        <option value="code-block">コードブロック (ソースコード表示)</option>
                        <option value="stat-graph">統計データ / 比較グラフ</option>
                        <option value="social-post">SNSポスト風 (X/Twitter)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* エディトリアル共通スタイル設定 */}
                  {isEditorialTemplate(currentScene.template) && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        padding: '12px',
                        backgroundColor: 'rgba(232, 82, 34, 0.06)',
                        border: '1px solid rgba(232, 82, 34, 0.2)',
                        borderRadius: '10px',
                        marginBottom: '12px'
                      }}
                    >
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>🎨 背景テーマ</label>
                        <select
                          value={(currentScene.props as any).theme || 'light-grid'}
                          onChange={e => {
                            const val = e.target.value;
                            updateCurrentScene(s => ({
                              ...s,
                              props: { ...s.props, theme: val } as any
                            }));
                          }}
                        >
                          <option value="manga-page">📖 漫画原稿＋スクリーントーン＋コマ割り線</option>
                          <option value="manga-dark">🖤 漫画クライマックス黒ベタ＋微細集中線</option>
                          <option value="light-grid">⬜ オフホワイト＋ドット格子</option>
                          <option value="dark">⬛ マットブラック＋回転アーク</option>
                          <option value="accent">🟧 ビビッドオレンジ (チャプター扉)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>🎬 トランジション演出</label>
                        <select
                          value={(currentScene.props as any).transition || 'none'}
                          onChange={e => {
                            const val = e.target.value;
                            updateCurrentScene(s => ({
                              ...s,
                              props: { ...s.props, transition: val } as any
                            }));
                          }}
                        >
                          <option value="none">なし</option>
                          <option value="manga-slash">🗡️ 漫画コマ枠・斜めカッティングワイプ</option>
                          <option value="blinds">🟧 ブラインド・ストライプ開閉</option>
                          <option value="panel-wipe">⬛ パネル・スライドワイプ</option>
                          <option value="diagonal-wedge">📐 右上斜めオレンジ帯</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>🏷️ バッジ種別</label>
                        <select
                          value={(currentScene.props as any).badgeType || 'none'}
                          onChange={e => {
                            const val = e.target.value;
                            updateCurrentScene(s => ({
                              ...s,
                              props: { ...s.props, badgeType: val } as any
                            }));
                          }}
                        >
                          <option value="none">なし</option>
                          <option value="manga-box">📖 漫画ネーム枠スタンプ (#01 放課後)</option>
                          <option value="live-pill">🔴 速報ピル (● 速報)</option>
                          <option value="step-pill">🔢 番号ステップピル (① 画面)</option>
                          <option value="mono-label">🔤 英語見出し (CHAPTER 01)</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>🏷️ バッジ文字 / 背景透かし数字</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="例: 速報 / CHANGE 01"
                            value={(currentScene.props as any).badgeText || ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateCurrentScene(s => ({
                                ...s,
                                props: { ...s.props, badgeText: val } as any
                              }));
                            }}
                          />
                          <input
                            type="text"
                            style={{ width: '74px' }}
                            placeholder="透かし(01)"
                            title="背景の特大中抜き文字 (例: 01, 02, 100%)"
                            value={(currentScene.props as any).watermark || ''}
                            onChange={e => {
                              const val = e.target.value;
                              updateCurrentScene(s => ({
                                ...s,
                                props: { ...s.props, watermark: val } as any
                              }));
                            }}
                          />
                        </div>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '8px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean((currentScene.props as any).focusLines)}
                            onChange={e => {
                              const checked = e.target.checked;
                              updateCurrentScene(s => ({
                                ...s,
                                props: { ...s.props, focusLines: checked } as any
                              }));
                            }}
                          />
                          <span>⚡ 集中線アニメーションを表示（オープニング・強調演出）</span>
                        </label>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              (currentScene.props as any).fallingMangaBg !== undefined
                                ? Boolean((currentScene.props as any).fallingMangaBg)
                                : (currentScene.props as any).theme === 'manga-page' ||
                                  (currentScene.props as any).theme === 'manga-dark'
                            }
                            onChange={e => {
                              const checked = e.target.checked;
                              updateCurrentScene(s => ({
                                ...s,
                                props: { ...s.props, fallingMangaBg: checked } as any
                              }));
                            }}
                          />
                          <span>📚 背景で漫画単行本・原稿を上から下に流す</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* シーンプロップス（タイトル・インラインモーション記法）編集 */}
                  <div className="form-group">
                    <label>
                      メインタイトル / キネティック見出し（改行で段階アニメーション）
                    </label>
                    {isEditorialTemplate(currentScene.template) && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                          marginBottom: '6px',
                          fontSize: '11px'
                        }}
                      >
                        {[
                          { label: '🩷 女性セリフ(ピンク)', sample: '[pink:女性セリフ]' },
                          { label: '💙 男性セリフ(青)', sample: '[blue:男性セリフ]' },
                          { label: '❤️ 赤強調', sample: '[red:強調]' },
                          { label: '🟧 **オレンジ強調**', sample: '**強調**' },
                          { label: '🖍️ ==マーカー箱==', sample: '==もする==' },
                          { label: '〰️ __手書き下線__', sample: '__進化してる。__' },
                          { label: '❌ ~~取消線~~', sample: '~~マイナー~~' },
                          { label: '⭕ ((丸囲み))', sample: '((-24%))' },
                          { label: '💥 強調スラッシュ//', sample: 'が発表。//' }
                        ].map(tag => (
                          <button
                            key={tag.label}
                            type="button"
                            className="btn-sm"
                            style={{ padding: '2px 8px', fontSize: '11px' }}
                            onClick={() => {
                              updateCurrentScene(scene => {
                                const prev = (scene.props as any).title || '';
                                return {
                                  ...scene,
                                  props: { ...scene.props, title: `${prev}${tag.sample}` } as any
                                };
                              });
                            }}
                          >
                            + {tag.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {isMangaProject && selectedSceneIndex === 0 && (
                      <div style={{ fontSize: '11px', color: '#fb7185', fontWeight: 700, marginBottom: '6px' }}>
                        🔒 シーン01の上部タイトルは「大人の99%が読んでいるムフフな江戸漫画」で固定されています
                      </div>
                    )}
                    <textarea
                      rows={isEditorialTemplate(currentScene.template) ? 3 : 2}
                      disabled={isMangaProject && selectedSceneIndex === 0}
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

                  {/* エディトリアル専用: テンプレート別ビジュアル設定 & 下部結論コピー */}
                  {isEditorialTemplate(currentScene.template) && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginBottom: '14px'
                      }}
                    >
                      {currentScene.template === 'editorial-kinetic' && (() => {
                        const isImagePreset =
                          (currentScene.props as any).mediaPreset === 'image' ||
                          (currentScene.props as any).mediaPreset === 'manga-panel';
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>📱 中央モーション図解プリセット</label>
                                <select
                                  value={(currentScene.props as any).mediaPreset || 'none'}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateCurrentScene(s => ({
                                      ...s,
                                      props: { ...s.props, mediaPreset: val } as any
                                    }));
                                  }}
                                >
                                  <option value="none">なし (テキストのみ / 3要点カード)</option>
                                  <option value="manga-panel">📖 漫画コマ枠（太黒枠＋ソリッド影＋重ねコマ）</option>
                                  <option value="image">🖼️ 角丸カード画像 (ガジェット・一般)</option>
                                  <option value="tablet-hero">📱 新型タブレット斜めヒーロー (iPad mini)</option>
                                  <option value="tablet-oled">✨ OLEDコントラスト発光タブレット</option>
                                  <option value="fold-phone">📖 折りたたみスマホ展開モーション (iPhone Duo)</option>
                                  <option value="phone-chat-overflow">💬 スマホ画面＋「×もう入らない」カード</option>
                                  <option value="phone-toggle-ai">⇄ 成果物・AI 切り替えトグルスマホ</option>
                                  <option value="fold-icon-2x">🔲 スマホ2個分グリッドアイコン</option>
                                  <option value="fold-split-callouts">🪧 2画面分割＋引き出し線ピル</option>
                                  <option value="tablet-dual-stack">📑 上下2段タブレット＋プロンプト指示</option>
                                </select>
                              </div>
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>
                                  {isImagePreset
                                    ? '🖼️ 1コマ目 画像パス (mediaUrl)'
                                    : '🏷️ クレジット表記 (mediaCredit)'}
                                </label>
                                <input
                                  type="text"
                                  placeholder="例: /manga/sakuragi/panel_02a.png"
                                  value={
                                    isImagePreset
                                      ? (currentScene.props as any).mediaUrl || ''
                                      : (currentScene.props as any).mediaCredit || ''
                                  }
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateCurrentScene(s => ({
                                      ...s,
                                      props: isImagePreset
                                        ? ({ ...s.props, mediaUrl: val } as any)
                                        : ({ ...s.props, mediaCredit: val } as any)
                                    }));
                                  }}
                                />
                              </div>
                            </div>

                            {isImagePreset && (
                              <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>🖼️ 2コマ目 画像パス (secondaryMediaUrl: 2セリフ目で自動切替・任意)</label>
                                <input
                                  type="text"
                                  placeholder="例: /manga/sakuragi/panel_02b.png (空欄なら1コマ目のまま)"
                                  value={(currentScene.props as any).secondaryMediaUrl || ''}
                                  onChange={e => {
                                    const val = e.target.value.trim();
                                    updateCurrentScene(s => {
                                      const { secondaryMediaUrl: _omit, ...rest } = s.props as any;
                                      return {
                                        ...s,
                                        props: val ? { ...rest, secondaryMediaUrl: val } : rest
                                      };
                                    });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {currentScene.template === 'editorial-comparison' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>📊 比較レイアウトモード</label>
                            <select
                              value={(currentScene.props as any).comparisonMode || 'cards-2'}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(s => ({
                                  ...s,
                                  props: { ...s.props, comparisonMode: val } as any
                                }));
                              }}
                            >
                              <option value="cards-2">🃏 2枚カード比較 (輝度・反射・Hz・ベゼル)</option>
                              <option value="bars-vertical">📊 基準破線＋縦棒グラフ (価格比較)</option>
                              <option value="bars-horizontal">📏 横バー＋重量ピル比較 (薄さ・重さ)</option>
                              <option value="devices-3">💻 3デバイス比較＋カウントアップ％</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>🔥 差分強調ラベル (例: +4万円 / -0.9mm)</label>
                            <input
                              type="text"
                              value={(currentScene.props as any).diffLabel || ''}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(s => ({
                                  ...s,
                                  props: { ...s.props, diffLabel: val } as any
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {currentScene.template === 'editorial-workflow' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>🔄 ワークフロー・タイムライン種別</label>
                            <select
                              value={(currentScene.props as any).workflowMode || 'vertical-loop'}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(s => ({
                                  ...s,
                                  props: { ...s.props, workflowMode: val } as any
                                }));
                              }}
                            >
                              <option value="vertical-loop">🔁 縦ステップ＋ループ矢印 (AIワークフロー)</option>
                              <option value="day-slots">⏰ 1日の隙間時間タイムバー (ONE DAY)</option>
                              <option value="horizontal-timeline">📅 横タイムライン＋フォローボタン</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>🏷️ ループ文字 / CTAボタン文字</label>
                            <input
                              type="text"
                              placeholder="例: また頼む / + フォロー"
                              value={(currentScene.props as any).loopLabel || (currentScene.props as any).ctaButtonText || ''}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(s => ({
                                  ...s,
                                  props:
                                    (s.props as any).workflowMode === 'horizontal-timeline'
                                      ? ({ ...s.props, ctaButtonText: val } as any)
                                      : ({ ...s.props, loopLabel: val } as any)
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {currentScene.template === 'editorial-list' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>☑️ リスト・スケジュール種別</label>
                            <select
                              value={(currentScene.props as any).listMode || 'checklist'}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(s => ({
                                  ...s,
                                  props: { ...s.props, listMode: val } as any
                                }));
                              }}
                            >
                              <option value="checklist">✅ チェックマーク箇条書き＋画像カード</option>
                              <option value="comments">💬 タイピング風SNSコメントカード</option>
                              <option value="calendar">🗓️ 2ヶ月カレンダー＋発売日ハイライト</option>
                              <option value="weekdays-cta">🟠 曜日バッジ順次点灯＋フォローCTA</option>
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>🏷️ ブランドフッター / カード文字</label>
                            <input
                              type="text"
                              placeholder="例: PAULNOROMAN. / mini"
                              value={(currentScene.props as any).brandFooter || (currentScene.props as any).topCardLabel || ''}
                              onChange={e => {
                                const val = e.target.value;
                                updateCurrentScene(s => ({
                                  ...s,
                                  props:
                                    (s.props as any).listMode === 'weekdays-cta'
                                      ? ({ ...s.props, brandFooter: val } as any)
                                      : ({ ...s.props, topCardLabel: val } as any)
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>🎯 下部結論コピー (footerHeadline: 遅れて下に出現する強調テキスト)</label>
                        <input
                          type="text"
                          placeholder="例: こういう作業が、\n**結構多い。** / 2倍以上//"
                          value={(currentScene.props as any).footerHeadline || ''}
                          onChange={e => {
                            const val = e.target.value;
                            updateCurrentScene(s => ({
                              ...s,
                              props: { ...s.props, footerHeadline: val } as any
                            }));
                          }}
                        />
                      </div>
                    </div>
                  )}

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
                              title="キャラクター（オプション）"
                              value={dialogue.speaker || ''}
                              onChange={e => {
                                const val = e.target.value;
                                // プリセットキャラを選んだときだけ動画のキャラ一覧に追加する
                                const speakers =
                                  val && !videoSpec.speakers[val] && CHARACTER_PRESETS[val]
                                    ? { ...videoSpec.speakers, [val]: CHARACTER_PRESETS[val] }
                                    : videoSpec.speakers;
                                const newScenes = [...videoSpec.scenes];
                                const newD = [...newScenes[selectedSceneIndex].dialogues];
                                const { speaker: _s, emotion: _e, facing: _f, ...rest } = newD[dIdx];
                                newD[dIdx] = val ? { ...rest, speaker: val, emotion: _e ?? 'normal' } : rest;
                                newScenes[selectedSceneIndex] = { ...newScenes[selectedSceneIndex], dialogues: newD };
                                updateSpec({ ...videoSpec, speakers, scenes: newScenes });
                              }}
                            >
                              <option value="">🚫 キャラなし</option>
                              {Object.entries({ ...CHARACTER_PRESETS, ...videoSpec.speakers }).map(([id, info]) => (
                                <option key={id} value={id}>
                                  {info.iconText} {info.name}
                                </option>
                              ))}
                            </select>

                            {dialogue.speaker && (
                              <>
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

                                <select
                                  title="キャラの向き"
                                  value={dialogue.facing || 'auto'}
                                  onChange={e => {
                                    const val = e.target.value;
                                    updateCurrentScene(scene => {
                                      const newD = [...scene.dialogues];
                                      const { facing: _omit, ...rest } = newD[dIdx];
                                      newD[dIdx] = val === 'auto' ? rest : { ...rest, facing: val as 'left' | 'right' };
                                      return { ...scene, dialogues: newD };
                                    });
                                  }}
                                >
                                  <option value="auto">🧭 向き: 自動</option>
                                  <option value="right">➡️ 右向き</option>
                                  <option value="left">⬅️ 左向き</option>
                                </select>
                              </>
                            )}

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

                          <input
                            type="text"
                            className="voice-url-input"
                            value={dialogue.audioUrl || ''}
                            placeholder="🔊 ボイス音声のURL / パス（任意。例: /voices/line1.mp3）"
                            onClick={e => e.stopPropagation()}
                            onChange={e => {
                              const val = e.target.value.trim();
                              updateCurrentScene(scene => {
                                const newD = [...scene.dialogues];
                                const { audioUrl: _omit, ...rest } = newD[dIdx];
                                newD[dIdx] = val ? { ...rest, audioUrl: val } : rest;
                                return { ...scene, dialogues: newD };
                              });
                            }}
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
            <div
              className={`player-wrapper ${isShorts ? 'player-wrapper-shorts' : ''}`}
              style={{ position: 'relative' }}
            >
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
                  isPortrait={isShorts}
                />
              )}
            </div>

            <div className="preview-footer">
              <div className="render-info">
                <h4>MP4 レンダリング（手動微調整結果を反映）</h4>
                <p>以下のコマンドを実行すると、画面上で操作した配置・サイズ・JSON設定でMP4動画が出力されます:</p>
                <code className="cmd-code">
                  {`npx remotion render src/remotion/index.ts ${isShorts ? 'MainVideoShorts' : 'MainVideo'} out/${isShorts ? 'shorts' : 'video'}.mp4`}
                </code>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Editor;