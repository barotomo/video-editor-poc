import React, { useState, useRef } from 'react';
import type { VideoSpec, ElementTransform } from '../types/videoSpec';
import { Move, Maximize2, RotateCcw, Eye } from 'lucide-react';
import './InteractiveCanvas.css';

export type CanvasMode = 'preview' | 'slide' | 'avatar';

interface InteractiveCanvasProps {
  spec: VideoSpec;
  activeSceneIndex: number;
  activeDialogueIndex: number;
  selectedTarget?: CanvasMode;
  onSelectTarget?: (target: CanvasMode) => void;
  onUpdateTransform: (
    target: 'slide' | 'avatar',
    transform: ElementTransform
  ) => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  spec,
  activeSceneIndex,
  activeDialogueIndex,
  selectedTarget: propSelectedTarget,
  onSelectTarget,
  onUpdateTransform
}) => {
  const [internalTarget, setInternalTarget] = useState<CanvasMode>('slide');
  const selectedTarget = propSelectedTarget ?? internalTarget;
  const handleSelectTarget = (target: CanvasMode) => {
    if (onSelectTarget) {
      onSelectTarget(target);
    } else {
      setInternalTarget(target);
    }
  };

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  const resizeStartRef = useRef<{ startY: number; startX: number; initialScale: number }>({
    startY: 0,
    startX: 0,
    initialScale: 1.0
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  const currentScene = spec.scenes[activeSceneIndex] || spec.scenes[0];
  const currentDialogue = currentScene?.dialogues[activeDialogueIndex] || currentScene?.dialogues[0];

  const currentTransform: ElementTransform =
    selectedTarget === 'slide'
      ? currentScene?.props?.transform || { x: 0, y: 0, scale: 1.0 }
      : selectedTarget === 'avatar'
      ? currentDialogue?.transform || { x: 0, y: 0, scale: 1.0 }
      : { x: 0, y: 0, scale: 1.0 };

  const x = currentTransform.x ?? 0;
  const y = currentTransform.y ?? 0;
  const scale = currentTransform.scale ?? 1.0;

  const isRightSideSpeaker = activeDialogueIndex % 2 !== 0;

  // ポインターダウン (ドラッグ移動開始)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: x,
      initialY: y
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // リサイズ開始
  const handleResizeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialScale: scale
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // ポインタームーブ
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && (selectedTarget === 'slide' || selectedTarget === 'avatar')) {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      onUpdateTransform(selectedTarget, {
        ...currentTransform,
        x: Math.round(dragStartRef.current.initialX + dx),
        y: Math.round(dragStartRef.current.initialY + dy)
      });
    } else if (isResizing && (selectedTarget === 'slide' || selectedTarget === 'avatar')) {
      const dy = e.clientY - resizeStartRef.current.startY;
      const dx = e.clientX - resizeStartRef.current.startX;
      const distDelta = (dx + dy) * 0.005;
      const newScale = Math.max(0.3, Math.min(3.0, parseFloat((resizeStartRef.current.initialScale + distDelta).toFixed(2))));

      onUpdateTransform(selectedTarget, {
        ...currentTransform,
        scale: newScale
      });
    }
  };

  // ポインターアップ
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) setIsDragging(false);
    if (isResizing) setIsResizing(false);
  };

  // リセット
  const handleReset = () => {
    if (selectedTarget === 'slide' || selectedTarget === 'avatar') {
      onUpdateTransform(selectedTarget, { x: 0, y: 0, scale: 1.0 });
    }
  };

  return (
    <div className="interactive-canvas-overlay" ref={canvasRef}>
      {/* 上部編集コントロールツールバー */}
      <div className="canvas-toolbar" onClick={(e) => e.stopPropagation()}>
        <div className="target-toggle">
          <button
            className={`toggle-btn ${selectedTarget === 'preview' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTarget('preview');
            }}
          >
            <Eye size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            プレビュー
          </button>
          <button
            className={`toggle-btn ${selectedTarget === 'slide' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTarget('slide');
            }}
          >
            🖼️ スライド配置
          </button>
          <button
            className={`toggle-btn ${selectedTarget === 'avatar' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTarget('avatar');
            }}
          >
            👤 話者アバター配置
          </button>
        </div>

        {selectedTarget !== 'preview' ? (
          <div className="transform-values">
            <span>X: <strong>{x > 0 ? `+${x}` : x}px</strong></span>
            <span>Y: <strong>{y > 0 ? `+${y}` : y}px</strong></span>
            <span>Scale: <strong>{scale}x</strong></span>
            <button className="btn-reset" onClick={handleReset} title="位置・サイズをリセット">
              <RotateCcw size={14} />
            </button>
          </div>
        ) : (
          <div className="preview-hint" style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>💡 画面タップで再生 / 一時停止</span>
          </div>
        )}
      </div>

      {/* ドラッグ＆リサイズ バウンディングボックス枠（スライドまたはアバター配置時のみ表示） */}
      {selectedTarget !== 'preview' && (
        <div
          className={`bounding-box ${selectedTarget === 'avatar' ? (isRightSideSpeaker ? 'avatar-box-right' : 'avatar-box-left') : 'slide-box'} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
          style={{
            transform: `translate(${x}px, ${y}px) scale(${scale})`
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="box-label">
            <Move size={14} />
            <span>{selectedTarget === 'slide' ? 'スライドテンプレート' : `${currentDialogue?.speaker || '話者'} アバター`}</span>
          </div>

          {/* 四隅のリサイズハンドル */}
          <div
            className="resize-handle top-left"
            onPointerDown={handleResizeStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            className="resize-handle top-right"
            onPointerDown={handleResizeStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            className="resize-handle bottom-left"
            onPointerDown={handleResizeStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div
            className="resize-handle bottom-right"
            onPointerDown={handleResizeStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <Maximize2 size={10} />
          </div>
        </div>
      )}
    </div>
  );
};
