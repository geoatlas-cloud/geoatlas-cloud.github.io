# 什么是TileMatrixSet？

TileMatrixSet，即Tile Matrix Set，源自 [**OGC Two Dimensional Tile Matrix Set**](https://www.ogc.org/standard/tms/)(目前已更新到v2)。该标准定义了瓦片矩阵集的规则和要求，作为一种基于一组规则网格对空间进行索引的方式，这些规则网格为坐标参考系统中有限比例列表定义了一个域（瓦片矩阵）。

>💡 The OGC Two Dimensional Tile Matrix Set and Tile Set Metadata Standard defines the rules and requirements for a tile matrix set as a way to index space based on a set of regular grids defining a domain (tile matrix) for a limited list of scales in a Coordinate Reference System.

在瓦片矩阵集中，每个瓦片矩阵被划分为规则的瓦片。在瓦片矩阵集合中，瓦片可以由瓦片列、瓦片行和瓦片矩阵标识符（即矩阵集标识与层标识）来唯一地标识。

>💡 In a tile matrix set, each tile matrix is divided into regular tiles. In a tile matrix set, a tile can be univocally identified by a tile column, a tile row, and a tile matrix identifier.

再来看看[Tiles API](https://docs.ogc.org/is/20-057/20-057.html)中的描述：该标准定义了用于指定瓦片矩阵集和描述瓦片集的逻辑模型和编码。一个瓦片矩阵集代表一种切片方案，它使得应用程序能够基于坐标参考系统 (CRS) 中为多个尺度（比例分级）定义的一组规则网格来分区和索引空间。

>💡 That Standard defines logical models and encodings for specifying tile matrix sets and describing tile sets. A tile matrix set is a tiling scheme that enables an application to partition and index space based on a set of regular grids defined for multiple scales in a Coordinate Reference System (CRS).

从上面我们可以获取到如下几个信息：

- 它是用于对空间进行分区和索引的一种方式方法
- 基于某个坐标参考系统，并基于该坐标参考系统持有的一组有限比例列表（尺度分级）
- 表现为一组规则格网，且该组格网与有限尺度分级列表一一对应

基于此，可以确定TileMatrixSet正是对应着[瓦片金字塔结构](https://fuyi-atlas.github.io/posts/gis/vector-pyramid-technology/#%E7%93%A6%E7%89%87%E9%87%91%E5%AD%97%E5%A1%94%E5%88%86%E5%9D%97)。TileMatrixSet基于的坐标系对应着瓦片金字塔的瓦片投影坐标系，格网表达对应着瓦片组织结构与瓦片坐标系，有限尺度分级对应瓦片金字塔尺度分层。从瓦片金字塔模型来说，TileMatrixSet基于多尺度分级实现金字塔的多尺度分层表达，并基于此为每一个尺度定义了一个边界，而后基于一定规则进行格网划分进而形成一个域（瓦片矩阵），此为分块。

对于分层以及分层分块的差异可参见如下两图：

<div style="display: flex; justify-content: space-between; align-items: center;">
  <img src="https://zhou-fuyi.github.io/picx-images-hosting/HasPyramid.67x9qxbduu.webp" alt="金字塔分层示意" style="margin: 5px;"><img src="https://zhou-fuyi.github.io/picx-images-hosting/金字塔分层分块示意图.92q0bkasp1.webp" alt="瓦片金字塔分层分块示意图" style="margin: 5px; width: 310px">
</div>

---

> ps: 更多内容可参见：
> - [再谈TileMatrixSet，二维瓦片金字塔结构的标准定义（上）](/reference/what-is-tilematrixset)
> - [再谈TileMatrixSet，二维瓦片金字塔结构的标准定义（下）](/reference/what-is-tilematrixset-calculation-principle)