# TileMatrixSet 配置

默认实现中，摒弃如GeoServer中需要为每一个图层单独配置TileMatrixSet的操作。而是声明即支持，不论图层。

> 其实此种实现方式不利于构建如TileJson信息，不是不可以，只是数据组织的问题。

## TileMatrixSet默认配置

- 切片原点默认为左上角，可配置为左下角（不过左下角未进行测试验证）
- 默认提供3857&4490（其实3857就是900913，只不过GeoTools原生并没有提供900913的坐标系声明；此处4490是遵循天地图CGCS2000经纬度等间隔直投的尺度分级构建，包含0级）
    
    ```java
    TileMatrixSet WORLD_EPSG_3857 =
                        TileMatrixSetFactory.createTileMatrixSet(
                                projectedName,
                                CRS.decode("EPSG:3857", true),
                                BoundingBox.WORLD3857,
                                CornerOfOrigin.TOP_LEFT,
                                TileMatrixSetFactory.DEFAULT_LEVELS,
                                null,
                                TileMatrixSetFactory.DEFAULT_PIXEL_SIZE_METER,
                                256,
                                256,
                                false);
    
    TileMatrixSet WORLD_EPSG_4490 =
                        TileMatrixSetFactory.createTileMatrixSet(
                                projectedName,
                                CRS.decode("EPSG:4490", true),
                                BoundingBox.WORLD4490,
                                CornerOfOrigin.TOP_LEFT,
                                1.40625d, // 天地图经纬度投影0级的分辨率
                                TileMatrixSetFactory.DEFAULT_LEVELS,
                                TileMatrixSetFactory.EPSG_4326_TO_METERS, // 0.00026458
                                TileMatrixSetFactory.CGCS2000_PIXEL_SIZE_METER,
                                256,
                                256,
                                false);
    ```

## 自定义TileMatrixSet

如[再谈TileMatrixSet，二维瓦片金字塔结构的标准定义（下）](/reference/what-is-tilematrixset-calculation-principle)一文中格网划分部分所述，只要确定如下参数，即可定义一个TileMatrixSet：

- crs：坐标参考系统，即格网所使用的空间参考
- extent：格网范围，通常是所用参考系统的最大范围
- PPI：一般默认使用96，不过OGC使用90.71428571428572
- Tile Size：一般默认使用256 x 256，像素为单位
- CornerOfOrigin：原点角，通常为左上角，TMS惯用的则是左下角
- Scale Set：尺度分级列表。

> ps：尺度分级列表也可以自行基于给定的extent进行计算。

如下，我在此构建了基于4550高斯投影的瓦片矩阵集，这便是先基于给定的Extent进行尺度分级的计算，而后进行瓦片矩阵集的构建

```java
String projectedName = "EPSG:4550";
TileMatrixSet WORLD_EPSG_4550 =
        TileMatrixSetFactory.createTileMatrixSet(
                projectedName,
                CRS.decode("EPSG:4550", true), // 标准 4550 crs
                BoundingBox.CHINA_4550, // [352748.56930578063, 3122822.417358633, 647251.4306942169, 5937990.422299586]
                CornerOfOrigin.TOP_LEFT,
                TileMatrixSetFactory.DEFAULT_LEVELS, // 22
                null,
                TileMatrixSetFactory.DEFAULT_PIXEL_SIZE_METER, // 0.00028
                256,
                256,
                false);
```
