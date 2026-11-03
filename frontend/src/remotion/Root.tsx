import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import { sampleVideoSpec } from '../types/sampleSpec';
import {
  sakuragiMangaEditorialSpec,
  ipadMiniEditorialSpec,
  iphoneDuoEditorialSpec
} from '../types/editorialSpecs';
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
      {/* 漫画紹介：桜木さん（コマ割モーション Shorts） */}
      <Composition
        id="SakuragiMangaShorts"
        component={MainVideo as any}
        durationInFrames={calculateTotalFrames(sakuragiMangaEditorialSpec) || 300}
        fps={sakuragiMangaEditorialSpec.fps || 30}
        width={sakuragiMangaEditorialSpec.width}
        height={sakuragiMangaEditorialSpec.height}
        defaultProps={{
          spec: sakuragiMangaEditorialSpec
        }}
      />
      {/* 新型iPad mini エディトリアル Shorts */}
      <Composition
        id="IpadMiniShorts"
        component={MainVideo as any}
        durationInFrames={calculateTotalFrames(ipadMiniEditorialSpec) || 300}
        fps={ipadMiniEditorialSpec.fps || 30}
        width={ipadMiniEditorialSpec.width}
        height={ipadMiniEditorialSpec.height}
        defaultProps={{
          spec: ipadMiniEditorialSpec
        }}
      />
      {/* iPhone Duo エディトリアル Shorts */}
      <Composition
        id="IphoneDuoShorts"
        component={MainVideo as any}
        durationInFrames={calculateTotalFrames(iphoneDuoEditorialSpec) || 300}
        fps={iphoneDuoEditorialSpec.fps || 30}
        width={iphoneDuoEditorialSpec.width}
        height={iphoneDuoEditorialSpec.height}
        defaultProps={{
          spec: iphoneDuoEditorialSpec
        }}
      />
    </>
  );
};
