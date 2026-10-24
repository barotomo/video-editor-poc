import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';
import { sampleVideoSpec } from '../types/sampleSpec';
import type { VideoSpec } from '../types/videoSpec';

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
  const totalFrames = calculateTotalFrames(sampleVideoSpec);

  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={totalFrames || 300}
        fps={sampleVideoSpec.fps || 30}
        width={sampleVideoSpec.width || 1280}
        height={sampleVideoSpec.height || 720}
        defaultProps={{
          spec: sampleVideoSpec
        }}
      />
    </>
  );
};
