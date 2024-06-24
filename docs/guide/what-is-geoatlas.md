# Geo Atlas 是什么？ {#what-is-geoatlas}

Geo Atlas，译为地理地图册(地理地图集)，就像小时候买到的纸质的地理地图册书本，里面填充着各式各样的地图。所以, 我也希望有那么一个东西，同样可以对外提供各种各样的地图以供使用。

目前来说，他还只是一个基于Java的开发的，可用于快速构建矢量切片服务的基础库。

> 本例中基于Geo Atlas实现了一个精简版本的矢量切片服务，从结果来看，可以将其看作为仅实现了矢量切片功能的GeoServer的精简提升版本。

## 背景与动机

首先，我是一个主做服务端开发的GIS开发工程师，平时接触最多的就是管网地图服务发布。此前的工作中没有使用任何平台技术，比如：ArcGIS、超图等，而是使用开源技术。技术栈大体可以总结为：SpringBoot + GeoServer + Mapbox + 空间数据库。

其次，目前在业务应用上，二维地图还是主流。而二维地图技术里面，属Mapbox Vector Tile的体验最好。所以，目前的技术路线是通过 GeoServer 来发布Vector Tile。

然后，在 GeoServer 使用中，我发现了这个几个问题：

- 受限于其开源协议（GPL 2.0）的约束，你无法通过修改部分源代码的方式，将其直接集成到系统内部。只能是单独部署，通过其提供的REST接口进行交互。基于此，部署方式同样受限。
- GeoServer 是一个大而全的东西，同时他是一个单体项目。也就是说，哪怕我只需要提供MWTS+MVT服务，我也需要部署一个全功能的节点，无法按需使用（这里不得不提一下GeoServer Cloud项目，但是它提出得要求更多了，需要一套微服务的环境）
- 从公谨[《WebGIS数据不切片或是时代必然》](https://zhuanlan.zhihu.com/p/512298212)一文推论，GeoServer中提供的MVT技术（指数据切片过程）已经算是切片起源时代的产物了，而今已经跨过了矢量切片时代（数据还是预切），进入了动态矢量切片时代了
- GeoServer中Vector Tile与GeoWebcache中的Tile Meta技术有冲突，瓦片清理存在BUG。可以理解为，GeoServer对于矢量瓦片的支持并不是很好。
- 不能很好的处理瓦片缓存与动态业务数据的矛盾，即使GeoWebcache提供缓存清理的策略。（Layer中Boundingbox范围问题）

> GeoServer完全是栅格金字塔技术的实现，不过是将栅格金字塔技术同时应用在栅格数据和矢量数据上，同时他并没有很好的针对不同层级对数据进行抽稀简化（其尝试从服务端配图SLD中获取数据分级规则，我没有测试过，但反对，理由参见: [关于矢量瓦片技术支持前端渲染带来的思考](https://fuyi-atlas.github.io/posts/gis/thoughts-on-mvt-front-end-rendering/)），那么就出现了一个pbf有近20M的情况。同时也回答了为什么现在大家都直接在数据库层面实现矢量瓦片（或者说是在数据源中），一是可以无视数据传递的时间损耗；二是可以直接做抽稀简化，这样出去的数据少了，传输速度自然也快了；三是数据库空间支持已经很成熟了；四是门槛高啊（护城河）

最后，我也想对我目前的状态做一次总结。那么，Geo Atlas应该就是我最好的总结方式。因为它既可以丰富我的简历🫣，又可以帮助我绘制技能树，完成这一次的总结。

---

ps: 当然，还有当下信创的背景原因。就当，抛砖引玉了😧，哈哈哈😬

## 特性

- [x] 遵循 [OGC Two Dimensional Tile Matrix Set and Tile Set Metadata Standard 2.0](https://docs.ogc.org/is/17-083r4/17-083r4.html) [并不完全遵循]
- [ ] 尝试遵循 [NEW OGC API](https://ogcapi.ogc.org/#standards)
- [x] 提供矢量切片能力
- [x] 支持自定义数据属性分级规则
- [x] 支持Google瓦片坐标系(原点在左上角, 默认即为Google瓦片坐标系)
- [x] 支持3857(900913), 4490投影(即默认提供相应的TileMatrixSet)
- [ ] 支持自定义坐标系及自定义坐标转换行为(源数据坐标系)
- [x] 支持自定义数据范围(OGC TileMatrixSet Limits，拒绝范围外请求)
- [x] 提供全局统一的，可快速集成的瓦片缓存组件， 
- [x] 支持基于内存和文件系统的缓存
- [ ] 支持使用GeoPackage进行缓存
- [x] 支持Seed, Reseed, Truncate三种瓦片缓存处理策略
- [x] 提供Namespace, Datastore, FeatureLayer元数据管理模块，并提供一个可视化操作界面(Geo Atlas Dashboard)
- [ ] 提供栅格数据切片能力
- [ ] 提供地形数据切片能力
- [x] 提供按需快速集成能力(将常用功能封装为各种stater)


## 截图

![geo-atlas-001](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-001.969lwd4n6p.webp)
![geo-atlas-002](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-002.51e0k97h42.webp)
![geo-atlas-cover-pic](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-cover-pic.7w6oq1mnx0.webp)
![geo-atlas-003](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-003.1e8gwqbomb.webp)
![geo-atlas-004](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-004.1ovapvqwrv.webp)
![geo-atlas-005](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-005.ibzha206k.webp)
![geo-atlas-006](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-006.77df60z4vw.webp)
![geo-atlas-007](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-007.6f0joaij65.webp)

## 技术概览

基于GeoTools、GeoWebCache进行Geo Atlas构建，基于Spring Boot Framework对外提供快速集成能力。

- GeoTools提供矢量数据读取以及坐标转换能力
- 在此对GeoWebCache进行了拆分为两个部分：分别是金字塔(pyramid, 提供瓦片索引与瓦片生成能力)与瓦片缓存(tile-cache, 提供瓦片缓存能力)

> Mapbox Vector Tile Generator 由 [java-vector-tile](https://github.com/ElectronicChartCentre/java-vector-tile) 提供支持

### 系统架构概述

下图描述了系统的总体架构。

![geo_atlas_architecture_overview_diagram](https://zhou-fuyi.github.io/picx-images-hosting/geo_atlas_architecture_overview_diagram.6bgxqkpgf3.svg)

> 此处更多的表达了内部结构与层次关系，无关部署

### 组件概述

- APP
  - Geo Atlas Dashboard: 可视化操作界面
  - Tiles API Application: 提供矢量切片服务的应用程序(同时支持Dashboard)

- Boot
  - Tiles API Boot Stater: 对Tiles API的快速集成封装, 约定大于配置

- Component
  - Metadata Mgmt: 提供Namespace, Datastore, FeatureLayer元数据管理模块
  - Tile Cache: 提供瓦片缓存能力, 目前支持基于内存, 文件系统两种缓存方式, 可任意组合
  - OGC APIS: 提供OGC APIs, 目前仅支持Tiles API

- Library
  - Base References: 基础依赖声明
  - Pyramid Model: 金字塔模型, 用于构建瓦片金字塔结构索引, 同时提供切片管道
  - Tile Generator: 瓦片生成器, 目前仅支持Mapbox Vector Tile Generator

- External Data Sources
  - Config Storage: 用于存储Namespace, Datastore, FeatureLayer等元数据
  - Geospatial Data Source: 用于存储矢量数据, 如PostGIS、SQLServer

## 支持
- thread.zhou@gmail.com
- thread_zhou@126.com

## 声明与致谢

- Geo Atlas现版本参照[GeoServer](https://github.com/geoserver/geoserver)应用模式构建，并参考了[GeoServer](https://github.com/geoserver/geoserver)以及[GeoServer Cloud](https://github.com/geoserver/geoserver-cloud)的实现方式
- Pyramid、IO(in Library)、Tile Cache模块均来自GeoWebCache, 是对其进行了拆解和少量变更
- 矢量数据的读取与坐标转换使用GeoTools
- Mapbox Vector Tile Generator由 [java-vector-tile](https://github.com/ElectronicChartCentre/java-vector-tile) 提供支持

## 版权许可
[LGPL-3.0 license](https://github.com/geoatlas-cloud/geo-atlas/blob/main/LICENSE)

版权所有 (c) 2024-至今，Geo Atlas。