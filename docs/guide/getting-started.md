# 快速开始 {#getting-started}


以下说明旨在快速搭建一个基于Docker的矢量切片服务示例。

- Geospatial Data Source(With some data)
  ![china_bounds_data_structure](https://zhou-fuyi.github.io/picx-images-hosting/china_bounds_data_structure.ibzha2066.webp)
  > 💡 <font style="color:red">提供下载的是矢量数据，不是最终地图，与符号化后的地图再可视化表达上存在一定差异。用户利用此数据编制地图，应当严格执行《地图管理条例》有关规定；编制的地图如需向社会公开的，还应当依法履行地图审核程序。</font>

  > 💡 <font style="color:orange"> 数据仅供学习研究使用</font>
- Tiles API Service(Backend)
- Geo Atlas Dashboard(Frontend)

> 请确保你已经安装好了Java, Maven, Docker以及Docker Compose。
> 我测试使用Wsl2(Windows11) + Docker Desktop(4.30.0) + Apache Maven 3.8.7 + Oracle jdk 11.0.20

1. 克隆代码
    ```shell
    git clone --recursive https://github.com/geoatlas-cloud/geo-atlas.git
    cd geo-atlas/
    ```
2. 配置环境变量
    ```shell
    cp .env.production.local.template .env.production.local
    ```
   然后手动修改配置文件, 将其中的配置项修改为你自己的配置，如:

   - HOST_IP：宿主机IP
   - POSTGRES_PASSWORD：PostgreSQL数据库初始化密码
   - JASYPT_ENCRYPTOR_PASSWORD：用于加密数据库账户信息的密钥
   - CACHE_ENABLED：是否开启缓存
   - NEXT_PUBLIC_BASE_MAP_TYPE：地图类型, osm|tianditu
   - NEXT_PUBLIC_BASE_MAP_TILE_KEY：当使用天地图时需要填写key，4490经纬度投影默认使用天地图，如果需要进行4490经纬度投影预览还请填写天地图Key
   
3. 执行构建脚本, 拉起服务

    ```shell
    chmod +x ./build2run.sh
    ./build2run.sh
    ```
等待服务启动完成后访问: `http://localhost:11003`, 而后按照GeoServer的使用习惯, 逐步创建
- namespace
- datastore
- feature layer
可通过预览的方式检查瓦片服务是否正常

> 默认给出的数据为我国的境界与政区数据, 来自[省市县数据CTAmap](https://www.shengshixian.com/), 源自[1：100万公众版基础地理信息数据（2021）](https://www.webmap.cn/commres.do?method=result100W)
> 其实我也曾提取过境界与政区数据([全国1:100万基础地理信息数据-境界与政区提取](https://fuyi-atlas.github.io/posts/program/micro-weather/006/)), 不过与上述数据相比而言比较粗糙, 后由于时间关系没有进行细化, 所以没有使用
> 
> 在提供境界与政区数据的同时, 还支持切换为[OSM China](https://hub.docker.com/repository/docker/threadzhou/ga-geospatial-osm-china/general)的数据。 OSM-China数据的处理过程大致为: 将源数据通过Osm2pgsql入库, 而后使用pg_dump制作转储文件, 并基于此转储文件制作PostGIS镜像, 在容器初始化的时候会自动恢复数据。
> 但是转储后的文件比较大, 导致镜像也比较大, 同时数据比较多导致恢复的时候比较慢。如果将其作为示例中的数据源的话, 那么三个服务全部启动完成耗时估计得有5分钟了, 所以并未将其作为默认得数据源。
> 
> 如果你想要使用OSM的数据测试, 可以将其作为额外的数据源进行连接, 这样就不会影响示例应用的初步体验了

### 指南

点击图片跳转B站

[![Geo Atlas Quickstart-封面](https://zhou-fuyi.github.io/picx-images-hosting/geo-atlas-cover-pic.7w6oq1mnx0.webp)](https://www.bilibili.com/video/BV1oAgSenEq5/?vd_source=a3d6ac851199bb1b577a99305af58486)