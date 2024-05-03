import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Geo Atlas",
  description: "Basic library for building vector tile services",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Examples', link: '/markdown-examples' },
      { text: 'API', link: '/api/' },
      { text: 'Reference', link: '/reference/tiling-technology-development' },
    ],

    sidebar: {
      '/guide/': {
        base: '/guide/',
        items: [
          {
            text: 'Guide',
            items: [
              { text: 'Markdown Examples', link: '/markdown-examples' },
              { text: 'Runtime API Examples', link: '/api-examples' }
            ]
          }
        ]
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
        items: [
          {
            text: 'Reference',
            items: [
              { text: '切片技术发展', link: '/tiling-technology-development' },
              { text: '关于矢量瓦片技术支持前端渲染带来的思考', link: '/thoughts-on-mvt-front-end-rendering' }
            ]
          }
        ]
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/geoatlas-cloud/geo-atlas' }
    ]
  }
})
