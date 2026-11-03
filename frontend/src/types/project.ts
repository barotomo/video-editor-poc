import type { VideoSpec, VideoFormat, SpeakerInfo } from './videoSpec';
import { VIDEO_FORMATS } from './videoSpec';
import { sampleVideoSpec } from './sampleSpec';
import {
  ipadMiniEditorialSpec,
  iphoneDuoEditorialSpec,
  sakuragiMangaEditorialSpec
} from './editorialSpecs';

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
    label: '漫画紹介ショート (エディトリアル再構成)',
    description: '漫画のコマ＋各シーンのセリフをエディトリアルCSSモーションに当てはめた全11シーン',
    icon: '📖',
    format: 'shorts',
    build: () => clone(sakuragiMangaEditorialSpec)
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

const STORAGE_KEY = 'video-editor-poc:projects:v1';
const SEEDED_MANGA_ID = 'proj-editorial-manga-sakuragi-v12';

const newId = (): string =>
  `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const loadProjects = (): Project[] => {
  const defaultMangaProject: Project = {
    id: SEEDED_MANGA_ID,
    name: sakuragiMangaEditorialSpec.title,
    format: 'shorts',
    spec: clone(sakuragiMangaEditorialSpec),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveProjects([defaultMangaProject]);
      return [defaultMangaProject];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [defaultMangaProject];
    const list = (parsed as Project[])
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
        if (p.spec?.scenes?.some(s => s.id === 'manga-1')) {
          return {
            ...p,
            spec: clone(sakuragiMangaEditorialSpec)
          };
        }
        return p;
      });
    if (!list.some(p => p.id === SEEDED_MANGA_ID)) {
      const next = [defaultMangaProject, ...list];
      saveProjects(next);
      return next;
    }
    saveProjects(list);
    return list;
  } catch {
    return [defaultMangaProject];
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
