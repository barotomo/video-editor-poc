import type { VideoSpec, VideoFormat, SpeakerInfo } from './videoSpec';
import { VIDEO_FORMATS } from './videoSpec';
import { sampleVideoSpec } from './sampleSpec';
import {
  ipadMiniEditorialSpec,
  iphoneDuoEditorialSpec,
  sakuragiMangaEditorialSpec,
  yofukashiMangaEditorialSpec,
  createBlankMangaShortsSpec
} from './editorialSpecs';
import { DEFAULT_MANGA_SCENE01_TITLE } from './mangaShortsTemplate';

/** プロジェクト = 1本の動画 (VideoSpec) + 管理用メタデータ */
export interface Project {
  id: string;
  name: string;
  format: VideoFormat;
  spec: VideoSpec;
  createdAt: number;
  updatedAt: number;
}

/** 新規プロジェクト作成時に選べるテンプレート */
export type ProjectTemplateId =
  | 'editorial-manga-shorts'
  | 'new-manga-shorts'
  | 'editorial-ipad-shorts'
  | 'editorial-fold-shorts'
  | 'blank-shorts'
  | 'blank-landscape';

export interface ProjectTemplate {
  id: ProjectTemplateId;
  label: string;
  description: string;
  icon: string;
  format: VideoFormat;
  build: () => VideoSpec;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** 任意で追加できるキャラクタープリセット（セリフの話者として選ぶと動画に追加される） */
export const CHARACTER_PRESETS: Record<string, SpeakerInfo> = clone(sampleVideoSpec.speakers);

/** 空の1シーンだけを持つ初期Spec。キャラ・ボイスは最初は入れない */
const buildBlankSpec = (format: VideoFormat): VideoSpec => ({
  title: '無題のプロジェクト',
  fps: 30,
  width: VIDEO_FORMATS[format].width,
  height: VIDEO_FORMATS[format].height,
  bgmVolume: 0.15,
  speakers: {},
  scenes: [
    {
      id: 'scene-1',
      template: format === 'shorts' ? 'editorial-kinetic' : 'text-card',
      props:
        format === 'shorts'
          ? {
              theme: 'light-grid',
              badgeType: 'live-pill',
              badgeText: '速報',
              title: '新しいテーマを\n**ここに**入力//',
              mediaPreset: 'tablet-hero',
              mediaCredit: 'IMAGE: SAMPLE',
              transform: { x: 0, y: 0, scale: 1.0 }
            }
          : {
              title: '新しいシーン',
              subtitle: 'サブタイトルを入力してください',
              themeColor: '#6366f1',
              transform: { x: 0, y: 0, scale: 1.0 }
            },
      dialogues: [
        {
          text: 'ここにセリフを入力してください',
          durationFrames: 90
        }
      ]
    }
  ]
});

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'editorial-manga-shorts',
    label: '漫画紹介ショート (完成版: 桜木さん)',
    description: '全12シーン・57秒・YouTube Shorts最適化。コマ枠800px・薄オレンジ集中線・1.08倍速音声・SE同期済み',
    icon: '📖',
    format: 'shorts',
    build: () => clone(sakuragiMangaEditorialSpec)
  },
  {
    id: 'new-manga-shorts',
    label: '漫画紹介ショート (13シーン最新フォーマット)',
    description: 'プロジェクト0001・0002と同一の最新フォーマット。冒頭急ズーム着弾フック→Nコマ展開・継続表示→クライマックス引き→概要欄誘導ガイド（全13シーン・約58秒）',
    icon: '✨',
    format: 'shorts',
    build: () => clone(createBlankMangaShortsSpec())
  },
  {
    id: 'editorial-ipad-shorts',
    label: '速報・比較ショート (iPad mini風)',
    description: 'ドット背景・手書き下線・輝度/価格グラフ・カレンダー等のCSSモーション一式',
    icon: '⚡',
    format: 'shorts',
    build: () => clone(ipadMiniEditorialSpec)
  },
  {
    id: 'editorial-fold-shorts',
    label: 'レビュー・図解ショート (iPhone Duo風)',
    description: 'チャプター扉・ループ矢印フロー・画面分割・タイピングコメント・曜日点灯',
    icon: '🔶',
    format: 'shorts',
    build: () => clone(iphoneDuoEditorialSpec)
  },
  {
    id: 'blank-shorts',
    label: 'ショート動画 (空白)',
    description: '縦 9:16 / 1080×1920。1シーンから自由に作成',
    icon: '📱',
    format: 'shorts',
    build: () => buildBlankSpec('shorts')
  },
  {
    id: 'blank-landscape',
    label: '通常動画 (空白)',
    description: '横 16:9 / 1280×720。YouTube通常動画向け',
    icon: '🖥️',
    format: 'landscape',
    build: () => buildBlankSpec('landscape')
  }
];

export const STORAGE_KEY = 'video-editor-poc:projects:v1';
const SEEDED_MANGA_ID = 'proj-editorial-manga-sakuragi-v12';
const SEEDED_MANGA_0002_ID = 'proj-editorial-manga-0002-v1';

const newId = (): string =>
  `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * ユーザーがブラウザ（ワークスペース）上で設定した効果音（SE）や編集内容を、
 * コード側の最新スペック（新ボイスやバグ修正など）にスマートマージして保護する関数
 */
export const mergeUserCustomizations = (existingSpec: VideoSpec, freshSpec: VideoSpec): VideoSpec => {
  if (!existingSpec || !Array.isArray(existingSpec.scenes)) {
    return clone(freshSpec);
  }

  const mergedScenes = freshSpec.scenes.map((freshScene, sIdx) => {
    const existingScene = existingSpec.scenes[sIdx];
    if (!existingScene) return freshScene;

    const freshProps = { ...(freshScene.props as any) };
    const existingProps = { ...(existingScene.props as any) };

    // 1. シーンレベルの効果音・演出設定を引き継ぐ
    if (existingProps.transitionSE !== undefined) {
      freshProps.transitionSE = existingProps.transitionSE;
    }
    if (existingProps.punchlineTriggerSE !== undefined) {
      freshProps.punchlineTriggerSE = existingProps.punchlineTriggerSE;
    }
    if (existingProps.textTriggerSE !== undefined) {
      freshProps.textTriggerSE = existingProps.textTriggerSE;
    }

    // 2. 着弾タイミングやカスタム尺の引き継ぎ
    if (typeof existingProps.footerStartFrame === 'number') {
      freshProps.footerStartFrame = existingProps.footerStartFrame;
    }

    // 3. コマ一覧 (panels) の効果音・カスタム設定を引き継ぐ
    if (Array.isArray(existingProps.panels) && existingProps.panels.length > 0) {
      if (Array.isArray(freshProps.panels) && freshProps.panels.length > 0) {
        // コマ単位でマージ
        freshProps.panels = freshProps.panels.map((fp: any, pIdx: number) => {
          const ep = existingProps.panels[pIdx];
          if (!ep) return fp;

          // シーン01のコマ1で、過去のバグにより上部固定タイトルが text に入ってしまっていた場合は freshProps.footerLead で自動修復
          const isInvalidScene01Text = sIdx === 0 && pIdx === 0 && (ep.text === freshProps.title || ep.text === DEFAULT_MANGA_SCENE01_TITLE);
          const mergedText = isInvalidScene01Text
            ? (freshProps.footerLead || ep.text)
            : (ep.text !== undefined && ep.text !== '' ? ep.text : fp.text);

          return {
            ...fp,
            // 効果音設定はユーザーのブラウザ上の指定を最優先で維持
            triggerSE: ep.triggerSE !== undefined ? ep.triggerSE : fp.triggerSE,
            punchlineTriggerSE: ep.punchlineTriggerSE !== undefined ? ep.punchlineTriggerSE : fp.punchlineTriggerSE,
            // ユーザーが変更した画像やテキストがあれば尊重
            mediaUrl: ep.mediaUrl !== undefined && ep.mediaUrl !== '' ? ep.mediaUrl : fp.mediaUrl,
            text: mergedText,
            speaker: ep.speaker || fp.speaker,
            durationFrames: ep.durationFrames || fp.durationFrames,
            audioUrl: ep.audioUrl !== undefined ? ep.audioUrl : fp.audioUrl
          };
        });
      } else {
        // freshProps に panels がない場合は existingProps.panels を活用
        freshProps.panels = existingProps.panels.map((ep: any, pIdx: number) => {
          const fd = freshScene.dialogues[pIdx];
          return {
            ...ep,
            audioUrl: fd?.audioUrl || ep.audioUrl
          };
        });
      }
    }

    // 4. シーン01のリード文・パンチラインの引き継ぎ
    if (sIdx === 0) {
      if (existingProps.footerLead && existingProps.footerLead !== freshProps.title && existingProps.footerLead !== DEFAULT_MANGA_SCENE01_TITLE) {
        freshProps.footerLead = existingProps.footerLead;
      }
      if (existingProps.footerHeadline) freshProps.footerHeadline = existingProps.footerHeadline;
      if (existingProps.punchlineTriggerSE) freshProps.punchlineTriggerSE = existingProps.punchlineTriggerSE;
    }

    return {
      ...freshScene,
      props: freshProps
    };
  });

  return {
    ...freshSpec,
    scenes: mergedScenes,
    syncVersion: freshSpec.syncVersion
  };
};

export const loadProjects = (): Project[] => {
  const defaultMangaProject: Project = {
    id: SEEDED_MANGA_ID,
    name: sakuragiMangaEditorialSpec.title,
    format: 'shorts',
    spec: clone(sakuragiMangaEditorialSpec),
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000
  };

  const project0002: Project = {
    id: SEEDED_MANGA_0002_ID,
    name: yofukashiMangaEditorialSpec.title,
    format: 'shorts',
    spec: clone(yofukashiMangaEditorialSpec),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProjects([project0002, defaultMangaProject]);
      return [project0002, defaultMangaProject];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [project0002, defaultMangaProject];
    let list = (parsed as Project[])
      .filter(
        p =>
          p.id !== 'proj-editorial-manga-sakuragi' &&
          p.id !== 'proj-editorial-manga-sakuragi-v2' &&
          p.id !== 'proj-editorial-manga-sakuragi-v3' &&
          p.id !== 'proj-editorial-manga-sakuragi-v4' &&
          p.id !== 'proj-editorial-manga-sakuragi-v5' &&
          p.id !== 'proj-editorial-manga-sakuragi-v6' &&
          p.id !== 'proj-editorial-manga-sakuragi-v7' &&
          p.id !== 'proj-editorial-manga-sakuragi-v8' &&
          p.id !== 'proj-editorial-manga-sakuragi-v9' &&
          p.id !== 'proj-editorial-manga-sakuragi-v10' &&
          p.id !== 'proj-editorial-manga-sakuragi-v11'
      )
      .map(p => {
        // プロジェクト0001 (桜木さん): ユーザー設定の効果音や編集を保護しつつ最新スペックを同期
        if (p.id === SEEDED_MANGA_ID) {
          if (p.spec) {
            return {
              ...p,
              spec: mergeUserCustomizations(p.spec, sakuragiMangaEditorialSpec)
            };
          }
          return {
            ...p,
            spec: clone(sakuragiMangaEditorialSpec)
          };
        }
        // プロジェクト0002: 新バージョンが配信された場合も、ユーザーが設定した効果音・編集内容を完全保持してマージ！
        if (p.id === SEEDED_MANGA_0002_ID) {
          if (p.spec?.syncVersion !== yofukashiMangaEditorialSpec.syncVersion) {
            return {
              ...p,
              name: yofukashiMangaEditorialSpec.title,
              spec: mergeUserCustomizations(p.spec, yofukashiMangaEditorialSpec),
              updatedAt: Date.now()
            };
          }
          return p;
        }
        // ユーザーが編集する新規作成プロジェクト等は、変更内容を上書きせずそのまま保持！
        return p;
      });

    if (!list.some(p => p.id === SEEDED_MANGA_ID)) {
      list = [...list, defaultMangaProject];
    }
    if (!list.some(p => p.id === SEEDED_MANGA_0002_ID)) {
      list = [project0002, ...list];
    }
    saveProjects(list);
    return list;
  } catch {
    return [project0002, defaultMangaProject];
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('プロジェクトの保存に失敗しました', err);
  }
};

export const createProject = (templateId: ProjectTemplateId, name?: string): Project => {
  const template = PROJECT_TEMPLATES.find(t => t.id === templateId) ?? PROJECT_TEMPLATES[0];
  const spec = template.build();
  const now = Date.now();
  const projectName = name?.trim() || spec.title || template.label;
  return {
    id: newId(),
    name: projectName,
    format: template.format,
    spec: { ...spec, title: projectName },
    createdAt: now,
    updatedAt: now
  };
};

export const duplicateProject = (project: Project): Project => {
  const now = Date.now();
  const name = `${project.name} のコピー`;
  return {
    ...project,
    id: newId(),
    name,
    spec: { ...clone(project.spec), title: name },
    createdAt: now,
    updatedAt: now
  };
};
