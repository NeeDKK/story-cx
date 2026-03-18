# 小说阅读器

这是一个可部署到 Cloudflare Pages 的纯前端小说阅读器，小说内容来自公开可访问的腾讯云 OSS Markdown 文件。

## 功能

- 读取 `public/config.json` 作为站点配置
- 读取 `public/novels.json` 作为小说清单
- 点击章节后直接渲染 Markdown 阅读页

## 本地开发

```bash
npm install
npm run dev
```

## 配置说明

### `public/config.json`

```json
{
  "siteName": "我的小说阅读器",
  "siteDescription": "基于 Cloudflare Pages 的 Markdown 小说站点",
  "baseUrl": "https://your-oss-public-domain.com",
  "novelIndexPath": "/novels.json"
}
```

- `baseUrl`：你的 OSS 公网资源前缀。
- `novelIndexPath`：小说清单文件路径。默认读取站点根目录下的 `novels.json`。

## OSS 跨域说明

如果前端直接读取腾讯云 OSS 上的 Markdown 文件，OSS 必须开启 CORS，否则浏览器会报跨域错误。

建议在 OSS 控制台配置允许来源：

- `http://127.0.0.1:5173`
- 你的 Cloudflare Pages 域名

建议允许的方法：

- `GET`
- `HEAD`

建议允许的请求头：

- `*`

如果你只是本地调试，可以先把 OSS CORS 配好，再继续测页面加载。

### `public/novels.json`

每本小说一个对象，每一章一个 `chapters` 条目。

```json
[
  {
    "id": "novel-id",
    "title": "小说名",
    "author": "作者",
    "description": "简介",
    "cover": "/cover.jpg",
    "tags": ["标签1", "标签2"],
    "chapters": [
      {
        "id": "chapter-1",
        "title": "第一章",
        "path": "/novel-id/chapter-1.md"
      }
    ]
  }
]
```

## Cloudflare Pages 部署

1. 将仓库推到 GitHub。
2. 在 Cloudflare Pages 新建项目并连接仓库。
3. 构建命令填写 `npm run build`。
4. 输出目录填写 `dist`。
5. 部署后修改 `public/config.json` 和 `public/novels.json`，重新触发构建即可。

## 资源组织建议

- 建议 OSS 中每本小说按目录保存 Markdown 文件。
- 建议额外维护一个 `novels.json` 作为索引文件。
- 如果你想自动生成 `novels.json`，可以在本地或 CI 中用脚本扫描 Markdown 文件后再上传。
