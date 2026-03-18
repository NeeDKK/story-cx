export type AppConfig = {
  siteName: string;
  siteDescription: string;
  baseUrl: string;
  novelIndexPath: string;
};

export type Chapter = {
  id: string;
  title: string;
  path: string;
};

export type Novel = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cover?: string;
  tags?: string[];
  chapters: Chapter[];
};
