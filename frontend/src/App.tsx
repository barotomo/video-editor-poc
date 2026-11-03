import React, { useState } from 'react';
import { Thumbnail } from '@remotion/player';
import { Film, Plus, Trash2, Copy, Clock } from 'lucide-react';
import { MainVideo } from './remotion/MainVideo';
import { calculateTotalFrames } from './remotion/Root';
import { VIDEO_FORMATS } from './types/videoSpec';
import {
  PROJECT_TEMPLATES,
  createProject,
  duplicateProject,
  loadProjects,
  saveProjects,
  type Project,
  type ProjectTemplateId
} from './types/project';
import Editor from './Editor';
import './Home.css';

const formatDate = (ts: number): string =>
  new Date(ts).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplateId>('editorial-manga-shorts');
  const [newName, setNewName] = useState('');

  const persist = (next: Project[]) => {
    setProjects(next);
    saveProjects(next);
  };

  const openModal = () => {
    setSelectedTemplate('editorial-manga-shorts');
    setNewName('');
    setIsNewModalOpen(true);
  };

  const handleCreate = () => {
    const project = createProject(selectedTemplate, newName);
    persist([project, ...projects]);
    setIsNewModalOpen(false);
    setOpenProjectId(project.id);
  };

  const handleSave = (updated: Project) => {
    // エディタ側の自動保存。最新の一覧を元に差し替える
    setProjects(prev => {
      const next = prev.map(p => (p.id === updated.id ? updated : p));
      saveProjects(next);
      return next;
    });
  };

  const handleDelete = (project: Project) => {
    if (!window.confirm(`「${project.name}」を削除しますか？この操作は元に戻せません。`)) return;
    persist(projects.filter(p => p.id !== project.id));
  };

  const handleDuplicate = (project: Project) => {
    persist([duplicateProject(project), ...projects]);
  };

  const openProject = projects.find(p => p.id === openProjectId);

  if (openProject) {
    return (
      <Editor
        key={openProject.id}
        project={openProject}
        onSave={handleSave}
        onBack={() => setOpenProjectId(null)}
      />
    );
  }

  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-brand">
          <Film className="home-brand-icon" />
          <div>
            <h1>Video Editor</h1>
            <p>プロジェクトを作成して、JSON×直感キャンバスで動画を編集</p>
          </div>
        </div>
        <button id="new-project-btn" className="home-primary-btn" onClick={openModal}>
          <Plus size={18} /> 新規プロジェクト
        </button>
      </header>

      <main className="home-main">
        <h2 className="home-section-title">あなたのプロジェクト</h2>

        <div className="project-grid">
          <button className="project-card project-card-new" onClick={openModal}>
            <div className="project-new-plus">
              <Plus size={32} />
            </div>
            <span>新規プロジェクトを作成</span>
          </button>

          {sorted.map(project => {
            const { width, height } = project.spec;
            const isPortrait = height > width;
            const frames = Math.max(1, calculateTotalFrames(project.spec));
            return (
              <div key={project.id} className="project-card">
                <button
                  className="project-thumb"
                  onClick={() => setOpenProjectId(project.id)}
                  aria-label={`${project.name}を開く`}
                >
                  <div className={`project-thumb-inner ${isPortrait ? 'portrait' : 'landscape'}`}>
                    <Thumbnail
                      component={MainVideo as any}
                      inputProps={{ spec: project.spec }}
                      compositionWidth={width}
                      compositionHeight={height}
                      frameToDisplay={0}
                      durationInFrames={frames}
                      fps={project.spec.fps || 30}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                  <span className="project-badge">
                    {VIDEO_FORMATS[project.format]?.icon} {VIDEO_FORMATS[project.format]?.ratio}
                  </span>
                </button>
                <div className="project-info">
                  <div className="project-text">
                    <div className="project-name" title={project.name}>
                      {project.name}
                    </div>
                    <div className="project-meta">
                      <Clock size={12} /> {formatDate(project.updatedAt)}
                    </div>
                  </div>
                  <div className="project-actions">
                    <button
                      className="icon-btn"
                      title="複製"
                      onClick={() => handleDuplicate(project)}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      className="icon-btn danger"
                      title="削除"
                      onClick={() => handleDelete(project)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sorted.length === 0 && (
          <p className="home-empty">まだプロジェクトがありません。「新規プロジェクト」から作成してみましょう。</p>
        )}
      </main>

      {isNewModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="新規プロジェクト">
            <h2>新規プロジェクト</h2>

            <label className="modal-label">プロジェクト名</label>
            <input
              className="modal-input"
              autoFocus
              placeholder="無題のプロジェクト"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />

            <label className="modal-label">フォーマット / テンプレート</label>
            <div className="template-grid">
              {PROJECT_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  id={`template-${t.id}`}
                  className={`template-card ${selectedTemplate === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  <span className="template-icon">{t.icon}</span>
                  <span className="template-label">{t.label}</span>
                  <span className="template-desc">{t.description}</span>
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button className="home-secondary-btn" onClick={() => setIsNewModalOpen(false)}>
                キャンセル
              </button>
              <button id="create-project-btn" className="home-primary-btn" onClick={handleCreate}>
                作成して編集を開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;