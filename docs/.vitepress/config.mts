import { DefaultTheme, defineConfig } from 'vitepress'
import { shared } from './shared'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  ...shared,
  lang: 'zh-Hans',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: '/favicon-32x32.png', width: 24, height: 24 },
    nav: nav(),

    sidebar: {
      '/guide/': {
        base: '/guide/',
        items: sidebarGuide()
      },
      '/examples/': {
        base: '/examples/',
        items: [
          {
            text: 'Examples',
            items: [
              { text: 'Markdown Examples', link: '/markdown-examples' },
              { text: 'Runtime API Examples', link: '/api-examples' }
            ]
          }
        ]
      },
      '/api/': {
        base: '/api/',
        items: [
          {
            text: 'API',
            items: [
              { text: 'Markdown Examples', link: '/markdown-examples' },
              { text: 'Runtime API Examples', link: '/api-examples' }
            ]
          }
        ]
      },
      '/reference/': {
        base: '/reference/',
        items: sidebarReference()
      }
    },

    editLink: {
      pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/geoatlas-cloud/geo-atlas' }
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: `版权所有 © 2024-${new Date().getFullYear()} Fuyi Atlas`
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    outline: {
      label: '页面导航'
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium'
      }
    },

    langMenuLabel: '多语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local'
    }
  }
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: 'Home',
      link: '/'
    },
    { 
      text: '指南', 
      link: '/guide/what-is-geoatlas',
      activeMatch: '/guide/'
    },
    { 
      text: '示例', 
      link: '/examples' ,
      activeMatch: '/examples/'
    },
    { 
      text: 'API', 
      link: '/api/',
      activeMatch: '/api/'
    },
    { 
      text: '参考', 
      link: '/reference/tiling-technology-development',
      activeMatch: '/reference/'
    },
  ]
}


function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '简介',
      collapsed: false,
      items: [
        { text: '什么是 Geo Atlas？', link: 'what-is-geoatlas' },
        { text: '快速开始', link: 'getting-started' },
        { text: '服务端构建', link: 'building' },
        // { text: '部署', link: 'deploy' }
      ]
    },
    {
      text: 'TileMatrixSet',
      collapsed: false,
      items: [
        { text: 'TileMatrixSet 简述', link: 'brief-desc-of-tilematrixset' },
        { text: 'TileMatrixSet 配置', link: 'tilematrixset-config' },
        // { text: 'frontmatter', link: 'frontmatter' },
        // { text: '在 Markdown 使用 Vue', link: 'using-vue' },
        // { text: '国际化', link: 'i18n' }
      ]
    },
    {
      text: '缓存',
      collapsed: false,
      items: [
        { text: '基础理念', link: 'basic-concepts-of-cache' },
        // { text: '扩展默认主题', link: 'extending-default-theme' },
        // { text: '构建时数据加载', link: 'data-loading' },
        // { text: 'SSR 兼容性', link: 'ssr-compat' },
        // { text: '连接 CMS', link: 'cms' }
      ]
    },
    {
      text: '性能优化',
      collapsed: false,
      items: [
        // { text: 'MPA 模式', link: 'mpa-mode' },
        // { text: 'sitemap 生成', link: 'sitemap-generation' }
      ]
    },
    // { text: '示例', base: '/examples/', link: 'tiling-technology-development' },
    // { text: 'API', base: '/api/', link: 'tiling-technology-development' },
    // { text: '参考', base: '/reference/', link: 'tiling-technology-development' }
  ]
}

function sidebarReference(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '参考',
      items: [
        { text: '切片技术发展', link: 'tiling-technology-development' },
        { text: '关于矢量数据分层控制的随笔', link: 'essay-on-layered-control-of-vector-data' },
        { text: '关于矢量瓦片技术支持前端渲染带来的思考', link: 'thoughts-on-mvt-front-end-rendering' },
        { text: '矢量金字塔技术研究', link: 'vector-pyramid-technology' },
        { text: '再谈TileMatrixSet，二维瓦片金字塔结构的标准定义（上）', link: 'what-is-tilematrixset' },
        { text: '再谈TileMatrixSet，二维瓦片金字塔结构的标准定义（下）', link: 'what-is-tilematrixset-calculation-principle' },
        // { text: 'CLI', link: 'cli' },
        // {
        //   text: '默认主题',
        //   base: '/zh/reference/default-theme-',
        //   items: [
        //     { text: '概览', link: 'config' },
        //     { text: '导航栏', link: 'nav' },
        //     { text: '侧边栏', link: 'sidebar' },
        //     { text: '主页', link: 'home-page' },
        //     { text: '页脚', link: 'footer' },
        //     { text: '布局', link: 'layout' },
        //     { text: '徽章', link: 'badge' },
        //     { text: '团队页', link: 'team-page' },
        //     { text: '上下页链接', link: 'prev-next-links' },
        //     { text: '编辑链接', link: 'edit-link' },
        //     { text: '最后更新时间戳', link: 'last-updated' },
        //     { text: '搜索', link: 'search' },
        //     { text: 'Carbon Ads', link: 'carbon-ads' }
        //   ]
        // }
      ]
    }
  ]
}