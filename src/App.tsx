import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { marked } from 'marked';
import { loadConfig, loadNovels, resolveAssetUrl } from './config';
import type { AppConfig, Novel } from './types';

function AppShell({ config, children }: { config: AppConfig; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{config.siteName}</h1>
          <p>{config.siteDescription}</p>
        </div>
        <Link className="home-link" to="/">
          首页
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
        <h2>还没有小说清单</h2>
        <p>请先配置 `public/novels.json`，把你的小说目录和章节路径写进去。</p>
      </section>
    );
  }

  return (
    <section className="card-grid">
      {novels.map((novel) => (
        <article className="novel-card" key={novel.id}>
          {novel.cover ? <img alt={novel.title} src={resolveAssetUrl(config.baseUrl, novel.cover)} /> : null}
          <div className="novel-card-body">
            <h2>{novel.title}</h2>
            <p className="meta">{novel.author ?? '未知作者'}</p>
            <p>{novel.description ?? '暂无简介'}</p>
            <div className="chapter-list">
              {novel.chapters.map((chapter) => (
                <Link key={chapter.id} to={`/novel/${novel.id}/chapter/${chapter.id}`}>
                  {chapter.title}
                </Link>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function ReaderPage({ config, novels }: { config: AppConfig; novels: Novel[] }) {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
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
        if (!novel || !chapter) {
          throw new Error('章节不存在');
        }
        const response = await fetch(resolveAssetUrl(config.baseUrl, chapter.path), { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`章节加载失败：${response.status}`);
        }
        const text = await response.text();
        if (active) setContent(text);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '读取章节失败');
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [chapter, config.baseUrl, novel]);

  const html = useMemo(() => marked.parse(content), [content]);
  const prevChapter = chapterIndex > 0 ? novel?.chapters[chapterIndex - 1] : undefined;
  const nextChapter = chapterIndex >= 0 && chapterIndex < novel.chapters.length - 1 ? novel.chapters[chapterIndex + 1] : undefined;

  if (!novel || !chapter) {
    return <p>未找到章节，请返回清单页选择小说。</p>;
  }

  return (
    <section className="reader">
      <div className="reader-header">
        <div>
          <p className="breadcrumb">
            <Link to="/">首页</Link>
            <span>/</span>
            <span>{novel.title}</span>
          </p>
          <h2>{novel.title}</h2>
          <p>{chapter.title}</p>
        </div>
        <button type="button" onClick={() => navigate(-1)}>
          返回
        </button>
      </div>
      {loading ? <p>正在加载章节...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {!loading && !error ? <article className="markdown" dangerouslySetInnerHTML={{ __html: html }} /> : null}
      <div className="chapter-nav">
        {prevChapter ? (
          <Link className="nav-button" to={`/novel/${novel.id}/chapter/${prevChapter.id}`}>
            上一章
          </Link>
        ) : (
          <span className="nav-button disabled">上一章</span>
        )}
        {nextChapter ? (
          <Link className="nav-button" to={`/novel/${novel.id}/chapter/${nextChapter.id}`}>
            下一章
          </Link>
        ) : (
          <span className="nav-button disabled">下一章</span>
        )}
      </div>
    </section>
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

  if (error) {
    return <div className="app-shell"><p className="error">{error}</p></div>;
  }

  if (!config) {
    return <div className="app-shell"><p>正在初始化站点...</p></div>;
  }

  return (
    <AppShell config={config}>
      <Routes location={location}>
        <Route path="/" element={<NovelListPage config={config} novels={novels} />} />
        <Route path="/novel/:novelId/chapter/:chapterId" element={<ReaderPage config={config} novels={novels} />} />
      </Routes>
    </AppShell>
  );
}
