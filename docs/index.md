---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: Geo Atlas
titleTemplate: 用于构建矢量切片服务的 Java 基础库

hero:
  name: Geo Atlas
  text: 用于构建矢量切片服务的 Java 基础库
  tagline: 更轻量、更简单、更友好
  actions:
    - theme: brand
      text: 什么是Geo Atlas?
      link: /guide/what-is-geoatlas
    - theme: alt
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/geoatlas-cloud/geo-atlas
  image:
    src: /geo-atlas-large-logo.png
    alt: Geo Atlas

features:
  - title: 快速集成能力
    details: Geo Atlas基于 Java 8 进行构建, 所以起始支持的JDK版本为 1.8。同时基于Springboot构建上层组件, 可提供快速的对外集成能力。
  - title: 常用TileMatrixSet支持
    details: 默认使用Google瓦片坐标系, 切片原点在左上角。默认支持3857投影以及4490经纬度投影, 可自行拓展。
  - title: 稳定的切片缓存
    details: 基于GeoWebCache, 提供全局统一的, 可快速集成的瓦片缓存组件。支持基于内存和文件系统的缓存, 支持Seed、Reseed、Truncate三种切片处理策略。
  - title: 性能优化
    details: 提供基于自定义数据属性分级能力, 在较大数据量下可大幅度减小切片数据的大小。支持自定义数据范围(OGC TileMatrixSet Limits), 可限定切片请求范围, 提高访问效率以及一定程度提升安全性。
---

<!-- <p>
  <h2>Geo Atlas 特性展示</h2>

  <video controls width="100%">
    <source src="/geo-atlas-preview.mp4" type="video/mp4">
    您的浏览器不支持视频播放。
  </video>
</p> -->
