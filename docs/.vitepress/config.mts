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
              { text: '切片技术发展', link: '/reference/tiling-technology-development' }
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
