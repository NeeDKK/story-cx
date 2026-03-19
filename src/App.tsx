import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { loadConfig, loadNovels, resolveAssetUrl } from './config';
import type { AppConfig, Novel } from './types';

function AppShell({ config, children }: { config: AppConfig; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-text">
          <h1>{config.siteName}</h1>
          <p>{config.siteDescription}</p>
        </div>
        <Link className="home-link" to="/">
          🏠 书架
        </Link>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}

function NovelListPage({ config, novels }: { config: AppConfig; novels: Novel[] }) {
  if (!novels.length) {
    return (
      <section className="empty-state">
        <h2>书架还空着</h2>
        <p>先在 novels.json 里放入你的第一本小说，之后这里就会慢慢热闹起来。</p>
      </section>
    );
  }

  return (
    <section className="novel-list">
      {novels.map((novel) => (
        <article className="novel-card" key={novel.id}>
          <div className="novel-card-info">
            {novel.cover
              ? <img className="novel-cover" alt={novel.title} src={resolveAssetUrl(config.baseUrl, novel.cover)} />
              : <div className="novel-cover-placeholder">📖</div>
            }
            <div className="novel-meta-block">
              <h2>{novel.title}</h2>
              <p className="meta">✍️ {novel.author ?? '无名作者'}</p>
              <p className="novel-desc">{novel.description ?? '还没有简介，像一页静静等待翻开的纸。'}</p>
              <div className="novel-tags">
                {(novel.tags ?? []).map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
              <p className="chapter-count">共 {novel.chapters.length} 章</p>
            </div>
          </div>
          <div className="chapter-grid">
            {novel.chapters.map((chapter) => (
              <Link key={chapter.id} className="chapter-item" to={`/novel/${novel.id}/chapter/${chapter.id}`}>
                {chapter.title}
              </Link>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function ReaderPage({ config, novels }: { config: AppConfig; novels: Novel[] }) {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [tocOpen, setTocOpen] = useState(true);

  const novel = novels.find((item) => item.id === novelId);
  const chapterIndex = novel?.chapters.findIndex((item) => item.id === chapterId) ?? -1;
  const chapter = chapterIndex >= 0 ? novel?.chapters[chapterIndex] : undefined;
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        setLoading(true);
        setError('');
        if (!novel || !chapter) throw new Error('章节不存在');
        const response = await fetch(resolveAssetUrl(config.baseUrl, chapter.path), { cache: 'no-store' });
        if (!response.ok) throw new Error(`章节加载失败：${response.status}`);
        const text = await response.text();
        if (active) setContent(text);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '读取章节失败');
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => { active = false; };
  }, [chapter, config.baseUrl, novel]);

  // 切章节时滚回顶部
  useEffect(() => { window.scrollTo({ top: 0 }); }, [chapterId]);

  const html = useMemo(() => marked.parse(content), [content]);

  if (!novel || !chapter) {
    return <p style={{ color: '#b07848', padding: '20px' }}>未找到章节，请返回书架重新选择。</p>;
  }

  const prevChapter = chapterIndex > 0 ? novel.chapters[chapterIndex - 1] : undefined;
  const nextChapter = chapterIndex < novel.chapters.length - 1 ? novel.chapters[chapterIndex + 1] : undefined;

  return (
    <div className="reader-layout">
      {/* 目录侧栏 */}
      <aside className={`toc-sidebar${tocOpen ? '' : ' toc-collapsed'}`}>
        <div className="toc-header">
          <span className="toc-title">📑 目录</span>
          <button className="toc-toggle" type="button" onClick={() => setTocOpen(false)} title="收起目录">
            ‹
          </button>
        </div>
        <div className="toc-book-title">{novel.title}</div>
        <nav className="toc-list">
          {novel.chapters.map((ch, idx) => (
            <Link
              key={ch.id}
              className={`toc-item${ch.id === chapterId ? ' toc-active' : ''}`}
              to={`/novel/${novel.id}/chapter/${ch.id}`}
            >
              <span className="toc-index">{idx + 1}</span>
              <span className="toc-name">{ch.title}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* 展开目录按钮（目录收起时显示） */}
      {!tocOpen && (
        <button className="toc-open-btn" type="button" onClick={() => setTocOpen(true)} title="展开目录">
          目<br />录
        </button>
      )}

      {/* 正文区域 */}
      <div className="reader-main">
        {/* 顶部导航 */}
        <div className="reader-topbar">
          <div className="breadcrumb">
            <Link to="/">🏠 书架</Link>
            <span>/</span>
            <span>{novel.title}</span>
          </div>
          <button type="button" onClick={() => navigate('/')}>返回书架</button>
        </div>

        {/* 章节标题 */}
        <div className="reader-chapter-header">
          <h2>{chapter.title}</h2>
        </div>

        {/* 正文 */}
        <div className="reader-content">
          {loading && <p className="reader-loading">📖 章节正在翻页过来...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <article className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>

        {/* 上一章 / 下一章 */}
        <div className="chapter-nav">
          {prevChapter
            ? <Link className="nav-button" to={`/novel/${novel.id}/chapter/${prevChapter.id}`}>‹ 前一章</Link>
            : <span className="nav-button disabled">‹ 前一章</span>
          }
          {nextChapter
            ? <Link className="nav-button" to={`/novel/${novel.id}/chapter/${nextChapter.id}`}>下一章 ›</Link>
            : <span className="nav-button disabled">下一章 ›</span>
          }
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    async function run() {
      try {
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
        setNovels(await loadNovels(loadedConfig));
      } catch (err) {
        setError(err instanceof Error ? err.message : '初始化失败');
      }
    }
    run();
  }, []);

  if (error) return <div className="app-shell"><p className="error">{error}</p></div>;
  if (!config) return <div className="app-shell"><p style={{ color: '#b06040', padding: '40px 0' }}>🌸 书页正在展开...</p></div>;

  return (
    <AppShell config={config}>
      <Routes location={location}>
        <Route path="/" element={<NovelListPage config={config} novels={novels} />} />
        <Route path="/novel/:novelId/chapter/:chapterId" element={<ReaderPage config={config} novels={novels} />} />
      </Routes>
    </AppShell>
  );
}
