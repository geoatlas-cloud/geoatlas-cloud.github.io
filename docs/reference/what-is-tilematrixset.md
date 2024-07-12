# 再谈TileMatrixSet，二维瓦片金字塔结构的标准定义（上）

## 前言

其实，在此前[矢量金字塔技术研究](https://fuyi-atlas.github.io/posts/gis/vector-pyramid-technology/)一文中已经大致提及了瓦片金字塔与TileMatrixSet的关系，为什么还要在这里再次说明呢？主要是前文更侧重于矢量金字塔的概念定义，对于TileMatrixSet的描述过少，所以才会再次对TileMatrixSet进行说明。本文将基于 OGC Two Dimensional Tile Matrix Set 标准对TileMatrixSet进行研究探讨，将侧重于说明其基本构成要素的定义以及整体的技术实现。而GeoWebCache中的GridSet作为典型实现，本文将会对其进行再次说明，以印证OGC 关于TileMatrixSet的定义。由于内容较多，本文将分为下上两个篇章进行描述。上篇是对TileMatrixSet以及其构成要素的基本概念进行描述，而下篇则是对GeoWebCache中的GridSet实现进行研究，同时结合我国CGCS2000切片方案对TileMatrixSet格网划分计算原理进行探讨，另附带说明Geo Atlas中关于此模块的实现细节。

本章节为上篇：TileMatrixSet及其构成要素的基本概念。

## 什么是TileMatrixSet？

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

## 术语

### Cell（单元）

minimum geometrical spaces delimited by the grid lines of a regular grid.

由规则网格的网格线界定的最小几何空间。

- Note 1 : in 2D spaces, cells are often referred as pixels.
    
    在二维空间中，单元通常称为像素。
    
- Note 2 : In this standard, the term pixel is reserved to the individual elements of a visualization device. Tiles are composed by regular grid cells that can be made partially coincident with the pixels of a visualization device for display purposes.
    
    在本标准中，术语“像素”专指可视化设备的单个元素。瓦片由规则网格单元组成，这些网格单元可以部分与可视化设备的像素重合，以用于显示目的。
    

### Raster Tile（栅格切片）

tile that contains information in a gridded form. Commonly the values of the grid represent colors of each cell in the grid for immediate pictorial representation on visualization devices, but can also be coverage subsets.

包含网格形式信息的切片。通常，网格的值表示网格中每个单元格的颜色，以便在可视化设备上立即进行图形表示，但也可以是覆盖子集。

>💡 Coverage：表示空间上变化的现象（可以是离散的或连续的）。覆盖可以是多种形式的数据，例如栅格、点云、多边形等。用于描述和存储空间现象的变化，可以是温度、降水量、高程等。例如，数字高程模型（DEM）是一种覆盖，表示地形的高程。可以以多种格式存储，包括 NetCDF、GeoTIFF、HDF 等。
>
> Coverage Subsets：这指的是从更大的覆盖数据集中提取特定部分。例如，你可能拥有一个全球温度数据集，但只需要覆盖欧洲的子集。子集提取使你可以提取并处理你需要的那部分数据，通常基于空间或时间标准。
>
> 栅格是Coverage的一种特定形式，表示为一个网格，每个网格单元（像素）都有一个值。栅格数据通常用于表示连续的空间现象。栅格数据广泛用于遥感图像、土地覆盖分类、气象数据等。例如，卫星图像是一种常见的栅格数据，每个像素表示该位置的反射率值。栅格数据通常以图像格式存储，例如 GeoTIFF、JPEG、PNG 等，也可以以网格格式存储，例如 ASCII Grid、ESRI Grid 等。
>
> ps: 本段内容来自ChatGPT 

### space partitioning（空间分区）

process of dividing a geometric space (usually a Euclidean space) into two or more disjoint subsets (see also partition of a set). Space partitioning divides a space into non-overlapping regions. Any point in the space can then be identified to lie in exactly one of the regions.

将几何空间（通常是欧几里得空间）划分为两个或多个不相交子集的过程（另请参见集合的划分）。空间分区将空间划分为不重叠的区域。然后可以识别空间中的任何点恰好位于其中一个区域

### tessellation（[**细分曲面**](https://support.esri.com/zh-cn/gis-dictionary/tessellation)）

partitioning of a space into a set of conterminous subspaces having the same dimension as the space being partitioned.

将空间划分为一组与被划分空间具有相同维度的连续子空间。

Note 1 : A tessellation composed of congruent regular polygons or polyhedra is a regular tessellation. One composed of regular, but non-congruent polygons or polyhedra is a semiregular tessellation. Otherwise the tessellation is irregular.

由全等的正多边形或多面体组成的镶嵌是正则镶嵌。由规则但不全等的多边形或多面体组成的一种是半规则镶嵌。否则镶嵌是不规则的。

>💡 [tessellation](https://support.esri.com/zh-cn/gis-dictionary/tessellation)：将二维区域划分为多边形块，或将三维区域划分为多面体块，这样就不会存在图形重叠和任何间隙。（来自ESRI的GIS字典）


### Tile（瓦片）

In the context of a 2D tile matrix, a tile is one of the rectangular regions of space, which can be uniquely identified by an integer row and column, making up the tile matrix.  

在 2D 瓦片矩阵的上下文中，瓦片是空间的矩形区域之一，可以通过构成瓦片矩阵的整数行和列来唯一标识。

In the context of a geospatial data tile set, a tile contains data for such a partition of space as part of an overall set of tiles for that tiled geospatial data.

在地理空间数据瓦片集的上下文中，瓦片包含这样的空间分区的数据，作为该瓦片地理空间数据的整个瓦片组的一部分

- Note 2 : Tiles are useful to efficiently request, transfer, cache, display, store and process geospatial data for a specific resolution and area of interest, providing deterministic performance and scalability for arbitrarily large datasets.
    
    瓦片可有效地请求、传输、缓存、显示、存储和处理特定分辨率和感兴趣区域的地理空间数据，为任意大的数据集提供确定性的性能和可扩展性。 
    
- Note 3: Tiles can contain a variety of data types, such as grid-based pictorial representations (map tiles), coverage subsets (coverage tiles), or feature-based representations (vector tiles).
    
    瓦片可以包含多种数据类型，例如基于网格的瓦片表示（栅格地图瓦片）、覆盖子集（覆盖瓦片）或基于特征的表示（矢量瓦片）。
    

### Tiling Schema（切片方案）

scheme that defines how space is partitioned into individual tiles, potentially featuring multiple levels of detail (each tiling at a different granularity to reflect a different resolution or scale).

定义如何将空间划分为各个瓦片的方案，可能具有多个细节层次（每个层次瓦片的粒度不同，以反映不同的分辨率或比例）

A tiling scheme defines the spatial reference system and the geometric properties of each tile defined by the scheme. Those properties include which space each tile occupies, i.e. its extent, as well as a tile coordinate origin if a particular corner of origin convention is established.

切片方案定义了空间参考系统以及该方案定义的每个切片的几何属性。这些属性（几何属性）包括每个切片占据的空间，即其范围，以及切片坐标原点（如果建立了特定的原点约定角）。


>💡 ps：难道不应该强制要求，必须进行切片坐标原点的指定吗？无论是左上角还是左下角还是其他🤔

### Tile Matrix（瓦片矩阵）

tiling grid in a given 2D coordinate reference system, associated to a specific scale and partitioning space into regular conterminous tiles, each of which being assigned a unique identifier.

在给定的二维坐标参考系统中平铺网格，与特定比例相关联，并将空间划分为规则的连续瓦片，每块瓦片都被分配一个唯一的标识符。

- Note 1 to entry: Each tile of a tile matrix is uniquely identifiable by a row and a column integer indices. The number of rows is referred to as the matrix height, while the maximum number of columns is referred to as the matrix width (the number of columns can vary for different rows in variable width tile matrices).
    
    瓦片矩阵的每块瓦片都可以通过行和列整数索引来唯一标识。行数称为矩阵高度，而最大列数称为矩阵宽度（可变宽度瓦片矩阵中的不同行的列数可能不同）。

>💡 瓦片矩阵，对应的是瓦片金字塔结构中的金字塔分层，是在特定比例（尺度）下，基于某种规则进行格网划分后形成的一个域。

### Tile Matrix Set（瓦片矩阵集）

tiling scheme consisting of a set of tile matrices defined at different scales covering approximately the same area and having a common coordinate reference system.

切片方案由一组以不同比例定义的切片矩阵组成，覆盖大致相同的区域并具有公共坐标参考系。

>💡 Tile Matrix Set即为切片方案（Tiling Schema）的一种具体实现，故在此可将其称为切片方案。这也对应着OGC Tiles API中所述：一个瓦片矩阵集代表一种切片方案（A tile matrix set is a tiling scheme）

### Tile Indexing Scheme（瓦片索引方案）

scheme allowing to uniquely reference a tile in a tiling scheme by the use of a unique identifier (or set of identifiers), and reversely, which unique identifier (or unique set of identifiers) corresponds to a space satisfying the geometric properties of a specific tile.

允许通过使用唯一标识符（或标识符集）来唯一引用切片方案中的瓦片的方案，反之亦然，该唯一标识符（或唯一标识符集）对应于满足特定瓦片的几何属性的空间。

>💡 瓦片索引方案对应瓦片坐标系，上面描述的是瓦片坐标系（唯一标识符或标识符集，如：x、y、z）与基于空间参考下瓦片占据的空间（即其范围，BBox）之间的对应关系，可以相互转换。

### Tile Set（切片集）

a set of tiles resulting from tiling data according to a particular tiling scheme.

根据特定切片方案由切片数据生成的一组切片。

>💡 从使用上来说，可以是逻辑的（逻辑存在，但还未生成的），也可以是物理存在的。

### Tile Set Metadata（切片集元数据）

additional metadata beyond the common properties defining the tile set. Such metadata could be an abstract, the owner, the author, or other common metadata.

除了定义切片集的公共属性之外的其他元数据。此类元数据可以是摘要、所有者、作者或其他常见元数据。

metadata describing common properties defining a tile set, layers and styles used to produce the tile set, the limits of the tile matrix with actual data and common metadata such as abstract, owner, author, etc.

描述定义切片集的公共属性的元数据、用于生成切片集的图层和样式、具有实际数据的瓦片矩阵的限制以及公共元数据（例如摘要、所有者、作者等）。

>💡 总的来说，切片集元数据提供有关切片集的预期用途以及其中包含的原点、访问限制、切片方案、图层、要素属性以及公共元数据（例如摘要、所有者、作者等）信息

### Vector Tile（矢量切片）

tile that contains vector information that has been generalized (simplified) at the tile scale resolution and clipped by the tile boundaries.

包含已按瓦片比例分辨率概括（简化）并由瓦片边界裁剪的矢量信息的切片。

>💡 实际情况下，如GeoServer所支持的矢量切片，其对于矢量数据的概括（简化）做的并不好。

### Well-Known Scale Set（通用比例集）

well-known combination of a coordinate reference system and a set of scales that a tile matrix set declares support for.

众所周知的坐标参考系统和瓦片矩阵集声明支持的一组比例的组合。

>💡 其实就是一些通用的，公知的比例尺分级方案，比如：基于Web墨卡托投影的比例尺分级。需要注意的是，它仅仅只有比例尺分级，只是TileMatrixSet的一部分，两个并不相等。

## 构成要素的基本理念与模型定义

此处主要描述在二维空间中，TileMatrixSet的构成要素与逻辑模型定义。

从TileMatrixSet的定义（切片方案由一组以不同比例定义的切片矩阵组成，覆盖大致相同的区域并具有公共坐标参考系）可知，Tile Matrix、尺度分级集合以及瓦片坐标系就是TileMatrixSet的主要构成要素。

### Tile Matrix

可以为瓦片定义两个主要用例：存储和可视化。当瓦片在可视化设备中渲染时，空间以像素为单位进行量化，并以尺寸为特征，就会出现比例的概念。然后，前两个空间维度的CRS单位的瓦片大小和可视化设备像素的大小变得相关。两个空间维度与设备的像素轴对齐。

在栅格瓦片中，定义了与瓦片矩阵重合但更密集的第二个规则网格（单元尺寸较小，但为该尺寸的精确约数）。这个新的更高分辨率网格的每个网格单元称为网格单元。网格单元是通过使用瓦片中渲染单元的数量（瓦片宽度和瓦片高度）将原始瓦片平均划分为网格单元来定义的。在常见的平铺 2D 可视化客户端中，网格单元的一部分与设备像素重合，并且网格的这一部分在设备中渲染：第二个网格在此被命名为外推设备网格。换句话说，瓦片在 CRS 的每个维度上被划分为多个单元，其方式创建的单元在可视化期间将变得与可视化设备的像素完全相同。

>💡 第二个规则网格（外推设备网格）是一个更高分辨率的网格，相比原始瓦片矩阵，它更密集。通过将原始瓦片划分为多个更小的网格单元（256x256 → 64x64），这些网格单元在可视化设备上与设备像素重合，从而在可视化过程中提供更高的分辨率和更清晰的显示效果。这种方法确保了地图或图像在不同设备上的渲染效果达到最佳。
>
> 总感觉这是在要求瓦片的实现端需要满足不同设备的渲染兼容性。

#### Tile Matrix 的构成要素

- 原点：规则网格覆盖的边界框的二维空间中的原点和原点角（例如，整数坐标为0的左上角的CRS坐标）。这是切片集原点，定义整个切片集的空间原点参考点的位置。
- 瓦片大小：CRS 每个维度的瓦片大小（以 CRS 单位表示）
    
    这里隐含的是每个维度（尺度层级）下瓦片大小要一致，但是不同维度的瓦片大小可以不一致。不过在实际使用中，基本上全维度都使用相同的瓦片大小。同时，瓦片的大小基本都使用像素作为单位进行换算。
    
- 以瓦片单位表示的瓦片矩阵的大小（即瓦片数量），用于封闭（关闭，合围）瓦片空间的边界框。通常，前两个维度的大小称为矩阵宽度和矩阵高度。
- 比例（表示为比例分母），可以基于给定的BBox进行计算

由于服务无法预测客户端可视化设备的像素大小，因此在本标准中，比例分母是针对“标准化渲染像素大小”0.28  mm x 0.28  mm（毫米）定义的。该定义与 Web 地图服务 WMS 1.3.0 OGC 06-042 和后来被 WMTS 1.0 OGC 07-057r7 采用的符号编码 (SE) 实现规范 1.1.0 OGC 05-077r4 中使用的定义相同。通常，设备的真实像素尺寸是未知的，0.28 毫米是 2005 年普通显示器的实际像素尺寸。即使当前的显示设备采用小得多的像素尺寸，该值仍被用作参考。

>1. 自 20 世纪 80 年代以来，Microsoft Windows 操作系统已将其默认的标准显示每英寸像素 (PPI) 设置为 96。该值的结果约为每像素 0.264 mm。该值与本标准中采用的实际 0.28mm 的相似性可能会造成一些混乱。
>
>2. 现代显示设备（屏幕）的像素非常小，以至于操作系统允许定义大于 1 的呈现比例因子（例如 150%）。在这些情况下，设备像素的实际大小与操作系统使用的大小不同。

通常，矩阵宽度是恒定的，并且在这种情况下，使用单个标准化渲染单元尺寸的两个维度的单个比例因子会导致单元在前两个维度中具有相同的尺寸。这通常称为方形像素。

>💡 保持矩阵宽度恒定，并在两个维度上使用单个标准化渲染单元尺寸的比例因子，可以确保像素在两个维度上具有相同的尺寸，即方形像素。方形像素保证了数据在空间分析中的一致性和准确性，避免了由于像素尺寸不一致而导致的图像变形和数据误差。这在 GIS、遥感和其他空间数据处理应用中是至关重要的。
>
>不过，WMS 可以允许非方形像素（尽管许多实现无法正确支持非方形像素）。

#### 瓦片空间

对于二维空间的情况，当给定瓦片矩阵的 CRS 坐标左上角点（tileMatrixMinX、tileMatrixMaxY）、瓦片矩阵的瓦片单位宽和高（matrixWidth、matrixHeight）、瓦片中的渲染单元格值（tileWidth、tileHeight）、将坐标参考系 (CRS) 单位转换为米的系数（metersPerUnit）和比例尺（1：scaleDenominator），瓦片矩阵边界框的右下角（tileMatrixMaxX、tileMatrixMinY）可以按如下方式计算：

![tile-space-1](https://zhou-fuyi.github.io/picx-images-hosting/tile-space-1.1021j1itu3.webp)

>💡 metersPerUnit (crs)： 将坐标参考系统 (CRS) 单位转换为米的系数。也就是说，这个参数表示的是将给定的CRS中一个单位转换为米的系数。换句话说，也就是在指定的CRS中，一个单位表示多少米。目前常用的就两种投影，一是以米为单位的（即metersPerUnit为1）；其次是以度为单位的经纬度投影（metersPerUnit表示为1度代表多少米，即：360/赤道周长，不同CRS使用不同的椭球体，所以其赤道周长也会存在一定差异。）例如，WGS84 metersPerUnit (crs) 为 111319.4908 米/度。

![tile-space-2](https://zhou-fuyi.github.io/picx-images-hosting/tile-space-2.wiflbpr4a.webp)

瓦片矩阵中的每个瓦片均由其瓦片列索引和瓦片行索引来标识，这些索引的 0,0 原点位于瓦片矩阵的一个角。当使用左上角时，tileCol向右增加，TileRow向底部增加，如图5所示（左下角也可以用作原点，使TileRow向顶部增加）。

>1. 图块矩阵可以实现为文件夹中的一组图像文件（例如，PNG 或 JPEG），每个文件代表一个图块。
>
>2. TIFF 规范 v6 的第 6 节以与本标准中相同的方式定义了 2D 图块。切片矩阵中的所有切片都可以存储在单个 TIFF 文件中。 TIFF 文件仅包含一组共享公共单一比例的连续图块。


### Tile Matrix Set

根据需要在客户端屏幕中表示的比例范围，单个瓦片矩阵（即单层次的矩阵）是不切实际的，并且可能会迫使软件在渲染之前花费太多时间来简化/概括数据集。（因为它仅仅是实现了数据横向上的分块，并没有其他的加成，这也是多尺度分级出现的原因）

通常，会逐步定义多个瓦片矩阵，以覆盖应用程序所需的预期比例范围。瓦片矩阵集是由一组瓦片矩阵组成的切片方案，针对特定比例进行了优化（所谓优化即为概括|简化等处理，使得数据可以更好、更快的显示），并由瓦片矩阵标识符标识。每个瓦片矩阵集都有一个可选的近似边界框（即BBox，之所以近似应是因为一般取是最小外接矩形MBR →Minimum Bounding Rectangle，并非完全一致。Maybe🤔），但每个瓦片矩阵都有一个精确的边界框，该边界框是从其他参数间接推导出来的。由于单元格对齐方式不同，每个比例下的瓦片矩阵边界框通常会略有不同（比如4490经纬度投影的0级和1级的边界框就不同）。

![ogc-tilematrixset-def](https://zhou-fuyi.github.io/picx-images-hosting/ogc-tilematrixset-def.1e8eusx720.webp)

瓦片矩阵在瓦片矩阵集中具有唯一的字母数字标识符。一些基于瓦片的实现更喜欢使用缩放级别编号或细节级别指定 (LoD)，其优点是建议瓦片矩阵列表中的某种顺序。本标准不使用缩放级别概念，但为了在更喜欢数字缩放级别的实现中轻松采用本标准，附件 D 中定义的许多瓦片矩阵集使用数字作为瓦片矩阵标识符。在这种情况下，瓦片矩阵集中定义的瓦片矩阵列表中的索引顺序仍然可以在内部用作缩放级别排序。

在一些其他标准中，瓦片矩阵集概念称为图像金字塔😯，如 OGC KML 2.2 OGC 07-147r2 标准的第 11.6 条中所示。 JPEG2000 (ISO/IEC 15444-1) 和 JPIP (ISO/IEC 15444-9) 也使用类似的空间划分，称为分辨率级别。然而，在这些情况下，金字塔是自定义的，从更详细的瓦片矩阵（使用方形瓦片）开始，并通过连续聚合前一个尺度的 4 个瓦片来构造下一个尺度的瓦片，依此类推（见图 6） ，并将前一个尺度的每 4 个连续值插值到下一个尺度的一个值中。该方法涉及更严格的结构，该结构具有与二的幂相关的比例以及与较低比例分母上的图块完美重叠的图块（四叉树结构，自底向上进行瓦片金字塔构建）。本文档中介绍的平铺矩阵集更加灵活，但 KML superoverlays 或基于 JPEG2000 的实现可以使用此标准以及一些额外的规则来描述其瓦片矩阵集。本文档描述了一些与附录 D 中的 2 的幂相关的比例集的瓦片矩阵集。【可视为通用规范与细分规范的区别，如图像金字塔的基础理论便是与瓦片矩阵集相同的】

>💡 注意：客户端和服务器在比较浮点数与公差时必须小心（必须使用双精度、16 位数字）。

### Well-known scale sets（通用比例集）

当在集成客户端中需要重叠和呈现不同瓦片矩阵集中编码的瓦片时，由于这些瓦片不具有公共比例分母集和相同的 CRS，将瓦片重新缩放或重新投影到视图的公共比例可能需要重新采样计算，从而导致视觉效果质量下降。

防止此问题的推荐方法是使用相同的全局瓦片矩阵集。如果数据的地理范围仅覆盖瓦片矩阵集区域的一部分，则瓦片集元数据的瓦片矩阵限制元素（Tile Matrix Limits）可用于通知这些限制。

如果无法使用相同的瓦片矩阵集，则使用公共 CRS 以及由尽可能多的层和服务共享的公共尺度集也可以是一种解决方案。由此，引入了众所周知的尺度集（WKSS → well-known scale set）的概念。【众口难调，不如统一】

请注意，WKSS 仅定义了完整定义瓦片矩阵集所需内容的一小部分。 WKSS 是一项可选功能，它不能取代定义瓦片矩阵集及其瓦片矩阵的需要。如果服务共享并引用通用瓦片矩阵集定义（通用的切片方案，例如基于Web墨卡托投影的切片方案），则不再需要 WKSS 的最初目的。

>💡 从结果来看，Well-known scale sets更像是一个过程中的产物。现如今大家基本都会直接使用通用的切片方案，或者是自定义切片方案。

### Tile based coordinates in a tile matrix set（瓦片坐标系）

基于瓦片的坐标中的瓦片可以通过其在瓦片矩阵维度中的瓦片位置和瓦片矩阵集中的瓦片矩阵标识符来引用。在二维空间中，瓦片由以下 3 个离散索引名称来标识：瓦片行、瓦片列和瓦片矩阵标识符。【也就是我们常说的瓦片坐标系】

在栅格图块中，外推设备网格域集中的网格单元可以通过 CRS 中的一组浮点坐标以及通过不存在舍入问题的两种方式之一来标识，如下所示。

- 网格单元由瓦片索引（通过其在瓦片矩阵维度中的瓦片位置和瓦片矩阵集中的瓦片矩阵标识符引用）和瓦片内的单元索引（i、j、...）组成。在二维空间中，一个单元由 5 个离散索引标识，这些索引名为：瓦片行、瓦片列、瓦片矩阵标识符、i 和 j。这就是 GetFeatureInfo 在 WMTS 中的工作方式。这组坐标称为“瓦片坐标”。
    
    >💡 在大部分情况下，瓦片行、瓦片列、瓦片矩阵标识符已经足够使用，i和j应是在需要精确获知点位坐标的时候才需要使用吧🤔
    
- 通过瓦片矩阵的外推设备网格域集（从瓦片空间的左上角开始）和瓦片矩阵集中的瓦片矩阵标识符定义的网格单元位置。在二维空间中，网格单元由 3 个离散索引标识，分别为：i '、j ' 和瓦片矩阵标识符。请注意，i ' 和 j ' 可以是非常大的整数，并且对于非常详细的比例，如果将瓦片矩阵存储为二进制数，则可能需要 64 位整数表示法。这组索引称为“瓦片矩阵坐标”。
    
    >💡 基于此可以随意的进行二次网格划分，可以更好的适配不同设备分辨率。我没有去调研过，但相信如今不同设备分辨率下瓦片渲染效果应当是各地图渲染引擎给做好了适配兼容了吧。毕竟，现如今基本都是全端设备共用一个tile size（如：256x256）。当然，这和现今设备的分辨率都比较高应该也有很大的关系吧🤔

![tile-coordinates](https://zhou-fuyi.github.io/picx-images-hosting/tile-coordinates.7p3h7t2z88.webp)

>💡 在目前瓦片服务中，基本上只需要给定瓦片行、瓦片列、瓦片矩阵标识即可，大部分时候所述的瓦片坐标系就是这三者组合。当然，瓦片坐标系各种各样，可以基于四叉树，可以是其他任意的法则，只不过瓦片行、瓦片列、瓦片矩阵标识的组合更加通用而已。


### Variable width tile matrices（可变宽矩阵）

到目前为止，假设所有瓦片行的矩阵宽度（matrixWidth）都是恒定的。这是不使地球扭曲太多的投影的常见用法。但是，当使用等距矩形板方形投影（参见附件 D 第 2 款，经纬度投影，如：[WorldCRS84Quad](https://raw.githubusercontent.com/opengeospatial/2D-Tile-Matrix-Set/master/registry/json/WorldCRS84Quad.json)）时，靠近两极的瓷砖的畸变会增加。在极端情况下，上方瓦片的上行（代表北极的那一行）包含一系列重复值，这些值代表空间中几乎相同的位置。对于下方瓦片的下排（代表南极的那一个）也可以这样说。当瓦片以平面投影表示时，这是无法避免的效果，但是当数据以虚拟地球表示时，失真会导致极点中出现冗余信息，需要客户端在渲染过程中消除这些冗余信息。失真补偿最好在服务器端完成。

解决方案包括减少高纬度行中的瓦片数量（matrixWidth），并在纵向维度上生成具有压缩比例的瓦片（见图 8）。为了实现此解决方案，必须扩展瓦片模型以指定合并系数（c），通过聚合 c 个水平瓦片但保持瓦片宽度（和瓦片高度）来减少宽度方向上的瓦片数量。合并系数不适用于赤道附近，但适用于中高纬度地区（纬度越高，系数越大）。

即使瓦片可以合并，也不会改变索引或瓦片矩阵集，它们将与未应用合并时相同。例如，如果 c 系数为 4，则第一个瓦片的 tileCol 将为 0，第二个瓦片的 tileCol 将为 4，第三个瓦片的 tileCol 将为 8，依此类推。换句话说，对于同一个示例，tileCol 0、1、2 和 3 指向同一个瓦片。

注意：此解决方案是必要的，以便仍然能够根据瓦片索引在空间中定义一个矩形。（即不脱离TileMatrixSet架构）

![Variable-width-tile-matrices](https://zhou-fuyi.github.io/picx-images-hosting/Variable-width-tile-matrices.1021j28j6d.webp)

>💡 可变宽矩阵，在此更多先做介绍。我目前所接触到的二维场景中，还没有见过可变宽矩阵的使用。当然，也可能是人家做了支持，但是我没有发现， 🫣

### TileMatrixSet Requirements Classes（模型定义）

![TileMatrixSet-UML-Model](https://zhou-fuyi.github.io/picx-images-hosting/TileMatrixSet-UML-Model.8z6ee4qarm.webp)

![TileMatrixSet-Data-Structure](https://zhou-fuyi.github.io/picx-images-hosting/TileMatrixSet-Data-Structure.1aovc7qewx.webp)

>💡 e：在某些需要高精度的情况下，需要使用相同CRS的精确实现，或者CRS是动态的（随时间略有变化）并且需要伴随一个epoch。对于此数据结构，Tile MatrixSet 由通用 CRS 名称定义。具体瓦片集使用的 CRS 实现和纪元在瓦片集元数据中指定。在大多数情况下，瓦片集共享相同的通用 CRS 重叠，但对于某些高精度应用程序和非常细粒度的比例，客户端可以执行运行时校正以根据该信息准确地覆盖瓦片集，或者拒绝重叠瓦片集具有相同的 CRS 实现或纪元。
>
>f：该元素并不是要覆盖 CRS 轴顺序，而是通过重复 CRS 定义中已包含的信息使其对开发人员可见。
>
>瓦片的像元大小（cell size）可以通过将scaleDenominator乘以0.28 x 10^(- 3)/metesPerUnit 来获得。如果 CRS 使用米作为水平尺寸的测量单位，则 metesPerUnit = 1 ；如果使用度数，则metersPerUnit = 2 * pi * a / 360（a是地球椭球体的最大半径；也称为赤道半径）。
>
>Cell Size（像元大小）：即一个像元表示多少米，也可以看作为一个像元表达的地图单位。
>
>这里只贴我认为比较重要的信息，如果你想要查看更多请查看原文。

## TileSet Metadata

瓦片由tileMatrix id、tileRow 编号和tileCol 编号来标识。这三个元素仅在与 TileMatrixSet 描述相关联时才有意义，该描述包含将索引转换为已知 CRS 中的坐标所需的信息（以scaleDenominator、cellSize、pointOfOrigin 和cornerOfOrigin 的形式）。 TileSet Metadata 的主要目的是将 TileSet 与 TileMatrixSet 描述链接起来。此外，该模型还包含描述 TileSet 主要特征的元素，保留从 TileSet 到原始数据集合和样式的连接以及开始导航的推荐中心点。

>💡 其实，我认为这个和[TileJson](https://github.com/mapbox/tilejson-spec/tree/master)的目的一致，即给出TileSet的描述与限制。

### TileMatrixSet limits

想象一种情况，瓦片集覆盖瓦片矩阵集的整个边界框。现在，想象一下瓦片集范围需要扩展到每个瓦片矩阵的原点和原点之外。更改原点会更改任何瓦片行索引和瓦片列索引的位置。换句话说，在新的瓦片集中，覆盖与前一个瓦片集相同的边界框的瓦片接收不同的瓦片行索引和瓦片列索引。这会使客户端可能已存储的任何缓存切片失效，并且所有客户端副本都需要更新。为了克服这个问题，数据集可以选择使用更通用的 TileMatrixSet 来覆盖更大的区域（甚至整个地球，例如附录 D 中定义的区域之一）。事实上，定义未来可能被数据集覆盖的区域的 TileMatrixSet 可以轻松地重新用于许多其他数据集，并成为通用的 TileMatrixSet。

为了通知客户端有关tileset中tile索引的有效范围，引入了TileMatrixSetLimits概念。 TileMatrixSetLimits 列表告知包含实际数据的每个 TileMatrix 的这些索引的最小和最大限制。这些限制之外的区域被视为空白区域，并且不被瓦片集覆盖。

![tilematrixset-limits](https://zhou-fuyi.github.io/picx-images-hosting/tilematrixset-limits.8vmsgf7oan.webp)

>💡 其实这里就解释了GeoWebCache中GridSet和GridSubset的关系，同时这就对应了GeoServer中404的响应，GeoServer通过此法可以避免大量无效的请求打到数据库（缓存或数据源），也在一定程度上提高了系统整体的安全性。但是此法有个缺点：就是需要提前确定数据源的范围（BoundingBox，GeoServer会读取数据的MBR范围并缓存）。当然，我们可以手动的设置该范围，而不是每次都从数据库进行获取，或者是周期性的更新该范围。总而言之，我觉得利是大于弊的，可以通过一些其他的手段进行优化。

### TileSetMetadata requirements class

![tilesetmetadata-uml-model](https://zhou-fuyi.github.io/picx-images-hosting/tilesetmetadata-uml-model.2krsijk7qx.webp)

>💡 🤔，其实我感觉有些过于复杂了。在当下的环境中，我认为可以结合TileJson规范实现，并进行必要的简化。

## 小结

上篇主要是对 [**OGC Two Dimensional Tile Matrix Set and Tile Set Metadata](https://docs.ogc.org/is/17-083r4/17-083r4.html)** 一文中重点内容的翻译，并附上部分注解。不过个人理解有限，如有存在偏颇的方法，还希望大家多指教 😬 🤝！

>💡 文中许多部分附上原文（英文），是担心翻译不一定能够表达原文的意思，所以保留原文。但如果全部都附上原文将会导致篇幅激增，所以仅在较为简短且相对重要的地方附上原文。

> ps：附录也是重点内容，不要错过哦🙄

## 附录

### ANNEX D (INFORMATIVE) COMMON TILEMATRIXSET DEFINITIONS

本附件包括一些常用的 TileMatrixSet 定义。

#### WebMercator [web墨卡托投影]

![WebMercator-Tilematrixset-def-1](https://zhou-fuyi.github.io/picx-images-hosting/WebMercator-Tilematrixset-def-1.1ovb34b9x9.webp)
![WebMercator-Tilematrixset-def-2](https://zhou-fuyi.github.io/picx-images-hosting/WebMercator-Tilematrixset-def-2.8dwqrv8em2.webp)

- 人们可以定义任意数量的缩放级别，并且不需要包括此处定义的所有缩放级别。这里，示出了25个缩放级别。
- 墨卡托投影越靠近两极，单元尺寸就会变形。此处提供的像元大小仅在靠近赤道的东西方向上有效。
- EPSG CRS 代码 3857 是 Web Mercator 的官方代码。最初分配了一个非官方代码“900913”（GOOGLE 用数字拼写），有时仍在使用。

![WebMercator-Tilematrixset-tilematrix-1](https://zhou-fuyi.github.io/picx-images-hosting/WebMercator-Tilematrixset-tilematrix-1.sytno1lh3.webp)

该瓦片矩阵集是大众市场中最常用的瓦片矩阵集：例如，Google 地图、Microsoft Bing 地图和 OpenStreetMap。然而，它长期以来一直受到批评，因为它是基于球形墨卡托而不是椭球体。 WebMercatorQuad 的使用应仅限于可视化。任何附加用途（包括距离测量、路由等）都需要首先使用墨卡托球面表达式将坐标转换为适当的 CRS。

>💡 其实目前很多人都注意到该问题了（且应该注意到），一般的做法是，使用3857进行可视化，使用4326（4490）进行分析计算。数据的存储上也是存两份（也可能只存一份），也就是3857和4326（4490）。这样的存储还有一个比较好的地方，也就是可视化不再需要动态投影。毕竟动态投影相对而言还是比较慢的，算是性能损耗点，此方式也是空间换时间了。
>
>ps：无谓好坏，只有适合！ 😉


>💡 注：EPSG 数据库版本 8.9 关于 3857 的描述是：“使用椭球坐标的球面展开。相对于WGS 84 / World Mercator (CRS code 3395)，地图上可能会出现 0.7% 的比例误差和北向差异达 43 公里（相当于地面 21 公里）。”
>
>所以使用 Web 墨卡托可能生成错误的地理空间定位信息，对全球导航活动安全以及需要精确定位和导航的国防部、情报界和盟军合作伙伴系统、任务和操作构成不可接受的风险信息。”建议使用 WorldMercatorWGS84Quad（因为其基于椭球体墨卡托投影） 🫣

#### WorldCRS84Quad/Variant 1: World CRS84 Quad (recommended)

![WorldCRS84Quad-Variant-1-(recommended)-1](https://zhou-fuyi.github.io/picx-images-hosting/WorldCRS84Quad-Variant-1-(recommended)-1.5j42m2zn66.webp)
![WorldCRS84Quad-Variant-1-(recommended)-2](https://zhou-fuyi.github.io/picx-images-hosting/WorldCRS84Quad-Variant-1-(recommended)-2.5tqwf8evbg.webp)
![WorldCRS84Quad-Variant-1-(recommended)-tilematrix-0](https://zhou-fuyi.github.io/picx-images-hosting/WorldCRS84Quad-Variant-1-(recommended)-tilematrix-0.esdwszpxk.webp)

此 TileMatrixSet 中的缩放级别标识符不对应于 WMTS 1.0 的附件 E.3 中的相同比例值。在这个TileMatrixSet中，标识符为“-1”的TileMatrix只有一个图块，有128行留空。因此，许多实施者不想提供这一级别（包括 INSPIRE 技术指南），而是更喜欢从仅用 2 个瓦片（一个用于负经度，一个用于正经度）表示世界的 TileMatrix 开始。

此 TileMatrixSet 和 WorldMercatorWGS84Quad 和 WebMercatorQuad 的比例分母相同，但标识符被替换为 1（本例中为0）。这可能会产生混乱。【因为相对WorldMercatorWGS84Quad 和 WebMercatorQuad ，本例少了一层。】

>💡 上图中的id应该是0才对，从定义上0级是2x1。同时，相对WorldMercatorWGS84Quad、 WebMercatorQuad 以及我国的CGCS2000经纬度切片方案，本例少了一层（也就是0级是1x1的状态）。

#### WorldCRS84Quad/Variant 2: World EPSG:4326 Quad

尽管第 6.2.1.1 条中有规定，一些实现者更喜欢使用 CRS http://www.opengis.net/def/crs/EPSG/0/4326 定义以前的 TileMatrixSet。 该定义与使用 http://www.opengis.net/def/crs/OGC/1.3/CRS84 定义的变体相同，只是 CRS 坐标（EPSG:4326）以纬度、经度顺序表示（CRS84是经度、纬度顺序的表示），仅影响 PointOfOrigin 和 BoundingBox 编码。 对于大多数实际目的，这两种变体是等效的，因为 TileMatrixSet 主要定义瓦片平铺结构以及每个瓦片矩阵的比例/分辨率，而不是每个平铺内的数据的存储方式。 

> 对于许多栅格和矢量切片格式，CRS84 和 EPSG:4326 是等效的，因为强制执行特定的轴顺序。 例如，API 的附加参数还可以通过将 CRS 指定为 CRS84 或 EPSG:4326 来覆盖默认轴顺序。
>
> ps：其实这两种都是 基于WGS84经纬度投影的切片方案，唯一的差异就是轴顺序的问题。国内使用肯定是选择经度优先的使用，也就是经度、纬度顺序的表示。
>
> ps：在GeoTools中可以如此使用以引入CRS84：CRS.decode("CRS:84");
>GEOGCS["WGS84", 
>
>  DATUM["WGS84", 
>
>    SPHEROID["WGS84", 6378137.0, 298.257223563]], 
>
>  PRIMEM["Greenwich", 0.0], 
>
>  UNIT["degree", 0.017453292519943295], 
>
>  AXIS["Geodetic longitude", EAST], 
>
>  AXIS["Geodetic latitude", NORTH], 
>
>  AUTHORITY["Web Map Service CRS","84"]]
>
> 当然，你也可以这样引入：CRS.decode("EPSG:4326", true); 可以指定轴顺序。或者是在全局指定轴顺序：System.setProperty("org.geotools.referencing.forceXY", "true"); 参考：[GeoTools Axis Order](https://docs.geotools.org/maintenance/userguide/library/referencing/order.html)
>
> 更多信息请参考GeoTools，且应以官方所述为主。

#### WorldMercatorWGS84Quad

![WorldMercatorWGS84Quad-1](https://zhou-fuyi.github.io/picx-images-hosting/WorldMercatorWGS84Quad-1.77dfjbfe3l.webp)
![WorldMercatorWGS84Quad-2](https://zhou-fuyi.github.io/picx-images-hosting/WorldMercatorWGS84Quad-2.2krsimgufz.webp)
![WorldMercatorWGS84Quad-3](https://zhou-fuyi.github.io/picx-images-hosting/WorldMercatorWGS84Quad-3.39l22n4dgb.webp)

此瓦片矩阵集看起来与前一个（Web Mercator Quad）类似，但该矩阵基于椭圆体墨卡托。请注意，此覆盖的最北纬度是 85.08405903（与 Web Mercator 不同）。

![WorldMercatorWGS84Quad-4](https://zhou-fuyi.github.io/picx-images-hosting/WorldMercatorWGS84Quad-4.8dwqrx4aop.webp)

>💡 美国国防部 (DoD) 下属的国家地理空间情报局 (NGA) 测绘办公室提醒公众在所有关键任务活动中使用国防部批准的 1984 年世界大地测量系统 (WGS 84) 应用程序，并鼓励使用像这样的（WorldMercatorWGS84Quad）基于 WGS84 的切片矩阵集，并阻止使用基于 Web 墨卡托的 Web 墨卡托瓦片矩阵集，例如 WebMercatorQuad。
>
>NGA 测绘办公室建议使用通用缩放级别比例集，该比例集定义为纬度 +-31.0606963703645 处的真实像元大小，这意味着赤道处的比例缩小了 0.857385503731176。为方便起见，本标准建议在赤道处使用比例分母。

### ANNEX I (INFORMATIVE) PSEUDOCODE

本信息附件提供了伪代码，说明如何获取覆盖边界框矩形的瓦片以及如何获取绑定瓦片的 CRS 坐标。（也就是瓦片坐标系与瓦片对应的空间范围CRS坐标的相互转换）

#### 从 BBOX 到瓦片索引

以下伪代码片段可用于将 CRS 坐标中的所需边界框 (bBoxMinX、bBoxMinY、bBoxMaxX、bBoxMaxY) 转换为一系列瓦片集索引。此伪代码使用与子条款 6.1.1 相同的符号。在此伪代码中，假设 bBoxMinX、bBoxMinY、bBoxMaxX、bBoxMaxY、tileMatrixMinX、tileMatrixMinY、tileMatrixMinY、tileMatrixMaxY、tileSpanX 和 tileSpanY 是浮点变量 (IEEE-754)，其精度问题源于表示的有限精度。这些精度问题可能会在典型的 floor() 向下舍入函数中被放大，该函数可能返回比预期值 ±1 的值。为了解决这个问题，此代码使用在 CRS 坐标精度不受影响的地方添加或减去一个小值 (epsilon)。

![PSEUDOCODE-1](https://zhou-fuyi.github.io/picx-images-hosting/PSEUDOCODE-1.7egner4jyd.webp)

要获取覆盖此边界框的所有瓦片，客户端将扫描从tileMinCol到tileMaxCol以及从tileMinRow到tileMaxRow（全部包含在内）。总共将获取 (tileMaxCol -tileMinCol + 1) x (tileMaxRow -tileMinRow + 1)。

#### 从瓦片索引到 BBOX

以下伪代码可用于将一对瓦片索引（tileCol、tileRow）转换为由瓦片左上角（leftX、upperY）定义的此瓦片的边界框（以 CRS 坐标表示）：

![PSEUDOCODE-2](https://zhou-fuyi.github.io/picx-images-hosting/PSEUDOCODE-2.wiflftkp0.webp)

## 参考

- [**OGC Two Dimensional Tile Matrix Set and Tile Set Metadata**](https://docs.ogc.org/is/17-083r4/17-083r4.html)
- [**Esri 支持 GIS 字典**](https://support.esri.com/zh-cn/gis-dictionary)
- [**矢量金字塔技术研究**](https://fuyi-atlas.github.io/posts/gis/vector-pyramid-technology/)