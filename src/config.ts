import type { AppConfig, Novel } from './types';

const DEFAULT_CONFIG: AppConfig = {
  siteName: '小说阅读器',
  siteDescription: '基于 Cloudflare Pages 的 Markdown 小说站点',
  baseUrl: '',
  novelIndexPath: '/novels.json',
};

export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' });
    if (!response.ok) {
      return DEFAULT_CONFIG;
    }

    const config = (await response.json()) as Partial<AppConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...config,
      baseUrl: (config.baseUrl ?? DEFAULT_CONFIG.baseUrl).replace(/\/$/, ''),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function loadNovels(config: AppConfig): Promise<Novel[]> {
  const indexUrl = new URL(config.novelIndexPath, window.location.origin);
  const response = await fetch(indexUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`无法加载小说清单：${response.status}`);
  }

  return (await response.json()) as Novel[];
}

export function resolveAssetUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return encodeURI(`${cleanBase}${cleanPath}`);
}
