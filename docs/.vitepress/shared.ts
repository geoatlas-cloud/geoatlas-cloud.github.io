import { defineConfig } from 'vitepress'

export const shared = defineConfig({
  title: "Geo Atlas",
  description: '用于构建矢量切片服务的 Java 基础库',

  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,

  // markdown: {
  //   math: true,
  //   codeTransformers: [
  //     // We use `[!!code` in demo to prevent transformation, here we revert it back.
  //     {
  //       postprocess(code) {
  //         return code.replace(/\[\!\!code/g, '[!code')
  //       }
  //     }
  //   ]
  // },

  sitemap: {
    hostname: 'https://geoatlas-cloud.github.io',
    transformItems(items) {
      return items.filter((item) => !item.url.includes('migration'))
    }
  },

  /* prettier-ignore */
  head: [
    // ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vitepress-logo-mini.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Geo Atlas | Java Powered Basic library for building vector tile services' }],
    ['meta', { property: 'og:site_name', content: 'Geo Atlas' }],
    ['meta', { property: 'og:image', content: 'https://geoatlas-cloud.github.io/favicon-32x32.png' }],
    ['meta', { property: 'og:url', content: 'https://geoatlas-cloud.github.io/' }],
    ['script', { src: 'https://cdn.usefathom.com/script.js', 'data-site': 'AZBRSFGG', 'data-spa': 'auto', defer: '' }]
  ],

  themeConfig: {
    // logo: { src: '/vitepress-logo-mini.svg', width: 24, height: 24 },

    // socialLinks: [
    //   { icon: 'github', link: 'https://github.com/geoatlas-cloud/geo-atlas' }
    // ],

    // search: {
    //   provider: 'algolia',
    //   options: {
    //     appId: '8J64VVRP8K',
    //     apiKey: 'a18e2f4cc5665f6602c5631fd868adfd',
    //     indexName: 'vitepress',
    //     locales: { ...zhSearch, ...ptSearch, ...ruSearch }
    //   }
    // },

    // carbonAds: { code: 'CEBDT27Y', placement: 'vuejsorg' }
  }
})
