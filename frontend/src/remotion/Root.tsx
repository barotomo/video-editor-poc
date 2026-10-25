import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import { sampleVideoSpec, sampleAnimeClipSpec } from '../types/sampleSpec';
import type { VideoSpec } from '../types/videoSpec';
import { VIDEO_FORMATS } from '../types/videoSpec';

export const calculateTotalFrames = (spec: VideoSpec): number => {
  return spec.scenes.reduce((total, scene) => {
    const sceneFrames = scene.dialogues.reduce(
      (sum, d) => sum + (d.durationFrames || 90),
      0
    );
    return total + sceneFrames;
  }, 0);
};

export const getSceneStartFrame = (spec: VideoSpec, sceneIndex: number): number => {
  let frame = 0;
  for (let i = 0; i < sceneIndex; i++) {
    const scene = spec.scenes[i];
    if (scene) {
      frame += scene.dialogues.reduce((sum, d) => sum + (d.durationFrames || 90), 0);
    }
  }
  return frame;
};

export const getDialogueStartFrame = (spec: VideoSpec, sceneIndex: number, dialogueIndex: number): number => {
  let frame = getSceneStartFrame(spec, sceneIndex);
  const scene = spec.scenes[sceneIndex];
  if (scene) {
    for (let j = 0; j < dialogueIndex; j++) {
      frame += scene.dialogues[j]?.durationFrames || 90;
    }
  }
  return frame;
};


export const RemotionRoot: React.FC = () => {
  const landscapeSpec: VideoSpec = {
    ...sampleVideoSpec,
    width: VIDEO_FORMATS.landscape.width,
    height: VIDEO_FORMATS.landscape.height
  };
  const shortsSpec: VideoSpec = {
    ...sampleVideoSpec,
    width: VIDEO_FORMATS.shorts.width,
    height: VIDEO_FORMATS.shorts.height
  };

  return (
    <>
      {/* 通常動画 (横 16:9) */}
      <Composition
        id="MainVideo"
        component={MainVideo as any}
        durationInFrames={calculateTotalFrames(landscapeSpec) || 300}
        fps={landscapeSpec.fps || 30}
        width={landscapeSpec.width}
        height={landscapeSpec.height}
        defaultProps={{
          spec: landscapeSpec
        }}
      />
      {/* ショート動画 (縦 9:16) */}
      <Composition
        id="MainVideoShorts"
        component={MainVideo as any}
        durationInFrames={calculateTotalFrames(shortsSpec) || 300}
        fps={shortsSpec.fps || 30}
        width={shortsSpec.width}
        height={shortsSpec.height}
        defaultProps={{
          spec: shortsSpec
        }}
      />
      {/* アニメ切り抜きショート (ヤニねこ) */}
      <Composition
        id="AnimeClipShorts"
        component={MainVideo as any}
        durationInFrames={calculateTotalFrames(sampleAnimeClipSpec) || 300}
        fps={sampleAnimeClipSpec.fps || 30}
        width={sampleAnimeClipSpec.width}
        height={sampleAnimeClipSpec.height}
        defaultProps={{
          spec: sampleAnimeClipSpec
        }}
      />
    </>
  );
};
