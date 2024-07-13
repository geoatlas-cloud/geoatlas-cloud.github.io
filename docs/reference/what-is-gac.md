# Geo Atlas Cache，一个精简的GWC组件

## 前言

瓦片缓存组件是绝大部分瓦片服务所应该有的模块之一，而[Geo Atlas](https://github.com/geoatlas-cloud/geo-atlas)同样实现了其瓦片缓存模块。本文用于描述Geo Atlas中的Cache模块的设计与实现过程。

## 什么是GAC？

GAC，全称是Geo Atlas Cache，是Geo Atlas类库中的Cache模块，用于提供矢量瓦片的缓存功能。GAC源自GWC（GeoWebCache），是在GWC的基础上进行了适应性的调整而来。目前支持基于内存、文件系统两种缓存方式，且此两种缓存方式可任意组合。对于瓦片缓存处理策略，目前支持Seed、Reseed、Truncate三种，与GWC保持一致。

## GAC的基本理念

GWC中声明并强调TileLayer的概念，并基于此抽象，用以适配数据来源与瓦片存储（缓存）。也就如同GeoServer中，一个图层如果需要拥有缓存能力，那么还需要创建一个TileLayer；也就是说，一个拥有缓存的图层，将会同时持有两个Layer，一个是 Map Layer（FeatureType），另一个是TileLayer。 TileLayer中进行瓦片存储相关内容的配置，可以随意配置存储容器对象（文件系统、对象存储、数据库等）。

而目前Geo Atlas Cache的实现则将大大简化这一操作，没有TileLayer对象，全局共用同一个存储容器对象，无需繁琐的存储配置，通过自动装配快速启用缓存，我认为这是中小项目中所需要的。

目前对于瓦片缓存（Tile Cache）的清理，也就是同GWC中提供的Seed、Reseed、Truncate一般。Truncate只需持有BlobStore的句柄即可完成，但Seed和Reseed则需前往数据的源端获取瓦片，进而才可完成操作，也就是需要持有获取源端瓦片Generate的句柄才可。或许这就是为什么GWC中提出TileLayer的原因之一也未可知 😮。 不过，我却由此认为GWC的边界不清晰，我认为缓存就做缓存的事情就可以了，应当把Layer、TileMatrixSet（GridSet）和Cache分开。但如此，若想要支持Seed和Reseed这两种给策略的话，至少需要提供一个拓展点才可。我在此将其命名为TileSource，是为Cache与Source（源端瓦片）之间的适配组件。其实，这不也是一种等同TileLayer的存在，但我并不通过Layer来进行关联控制，也没有TileLayer的概念，缓存就是缓存。

## GAC的设计与实现

因为GeoServer沉重的历史包袱以及大而全的臃肿，所以有了Geo Atlas项目。GAC也将延续此理念，去除Cache特定于Layer的概念，无需为图层单独配置缓存，因为绝大部分情况下，都是使用相同的缓存配置。同时，他应该是可以被快速集成，且易于配置的。为了提升缓存组件的易用性、兼容性及稳定性，至少应该提供两种不同的缓存存储对象，且其中一种应该是基于内存的，另外一种是支持持久化的。当数据量很少时，可以关闭缓存或仅开启内存缓存；当数据量较大时，可以仅开启持久化缓存或同时开启内存缓存。内存缓存与可持久化缓存可自由搭配，任意组合。当两者全开启时，可形成两级缓存，此时需注意两级缓存间数据的同步。

### GAC的需求与设计

接下来，再次确定一下GAC的需求：

- 支持矢量瓦片缓存
- 提供两类缓存存储对象，其中一种应该是基于内存的，另外一种是支持持久化的，且两者可任意组合，同时开启可形成二级缓存结构
- 提供Seed、Reseed、Truncate此三种瓦片缓存清理策略
- 全局共用同一个缓存存储对象，提供快速集成能力

其中，二级缓存是此前没有接触过的内容。结合自我臆想，给出了如下设想 🫣：

此二级缓存，可自行确定组合方式，并非需要两者同时开启。难点：状态同步（数据一致性）

- 一级缓存（基于内存）： Local Mem Cache + LRU
    - Guava
    - Caffeine
- 二级缓存（可持久化）：Outer Cache
    - Redis
    - File System
    - Database
        - GeoPackage
            - 每一个Level一个gpkg文件，提升并发读写能力（支持配置为所有Level用一个gpkg，但是不推荐）
        - PostGIS

不过，在经过一番调研之后，还是决定抄GeoWebCache的作业 😧。一是确实有一定的难度，二是目前时间有限，GAP中的我早已瑟瑟发抖 🙄。最重要的是，GeoWebCache中的`MemoryBlobStore`已经实现了上述二级缓存的需求呀 🫡，如此操作可直接覆盖掉前三个需求。而此时二级缓存的实现确定为：

- 基于内存的缓存（Guava）
- 基于文件系统的缓存

需要特别注意的是，此`MemoryBlobStore`二级缓存是可拓展架构，后续可自行拓展不同的Provider。

>💡 对于Seed与Reseed的处理，则与GAC的理念中所述一致，通过TileSource对外提供拓展。也就是默认情况下，Cache模块只提供Seed与Reseed的声明，无法提供具体实现（无法直接与Source进行链接）。

那么此刻只剩下最后一个需求了，其主旨围绕快速配置、易用。在此基于GeoWebCache中的`DefaultStorageBroker` 类进行缓存存储对象的代理，其符合GWC中缓存存储对象设计架构，也为后续提供了更多的拓展点，同时将其暴露给全局，即全局共用的缓存存储对象。对于快速集成能力，此处将结合Spring Boot的`AutoConfiguration`特性，为GAC提供自动装配能力。与此同时，将缓存存储对象的可设置属性通过配置的方式暴露出来，可直接在`application.yml`或`application.properties`中进行配置。具体可配置内容如下所示：

- geo-atlas.cache.enabled=false（是否启用缓存，默认为false）

---

- geo-atlas.cache.inner-caching-enabled=false（是否启用内存缓存，默认为false）
- geo-atlas.cache.inner.storage.provider=guava（可选值：guava，暂不支持，保留）
- geo-atlas.cache.inner.storage.memory-limit=16（内存大小限制，单位MB，默认16）
- geo-atlas.cache.inner.storage.concurrency-level=4（缓存并发级别的默认值，默认为4）
- geo-atlas.cache.inner.storage.eviction-policy=null（缓存驱逐政策，即缓存淘汰算法，可选值：NULL、LRU、LFU、EXPIRE_AFTER_WRITE、EXPIRE_AFTER_ACCESS，默认值为NULL）
    
    >💡 LRU、LFU暂时不支持
    
- geo-atlas.cache.inner.storage.eviction-time=2*60（缓存驱逐时间的默认值，单位：秒，默认：2 minutes）

---

- geo-atlas.cache.persistence-enabled=false（是否启用持久化缓存，默认为false）
- geo-atlas.cache.persistence.storage.provider=file-system（持久化缓存存储策略对象，可选值：file-system、geopackage，现只支持file-system）
- geo-atlas.cache.persistence.storage.base-directory（即最终瓦片持久化的目录基础路径，默认读取：java.io.tmpdir，可拓展）

---

- geo-atlas.cache.persistence.storage.file-system.path-generator-type=default（即瓦片存储路径算法，可选值：default、tms、xyz，默认为default）
- geo-atlas.cache.persistence.storage.fs.block-size=4096（The default block size is 4096 bytes.）
    
    This setting determines how the tile cache calculates disk usage. The value for this setting should be equivalent to the disk block size of the storage medium where the cache is located. The default block size is 4096 bytes.（此设置确定切片缓存如何计算磁盘使用情况。 该设置的值应等于缓存所在存储介质的磁盘块大小。 默认块大小为 4096 字节。）
    
    >💡 目前该设置应没有什么用，毕竟又没做磁盘使用情况的统计。 🤨
    

### GAC的实现

既然决定抄GeoWebCache的作业，那主要内容就是对其Cache部分内容进行移植，同时将Geo Atlas的开源协议变更为LGPL（MIT → LGPL）。当所有内容都被自我吸收转换后，就可以自由控制协议了，比如再转为MIT或Apache。

![gac-1](https://zhou-fuyi.github.io/picx-images-hosting/gac-1.7sn3jfycfh.webp)

#### BlobStore

这里可以先看一下`BlobStore`的现有结构设计，`BlobStore`是缓存存储对象的顶层接口，`MemoryBlobStore`、`FileBlobStore`、`NullBlobStore`等均是`BlobStore`的具体实现。这里可以注意到`MemoryBlobStore`中有一个`store`属性（类型为`BlobStore`）和一个`cacheProvider`属性（类型为`CacheProvider`），这也就是前面提到的二级缓存实现。

![BlobStore](https://zhou-fuyi.github.io/picx-images-hosting/BlobStore.5j42zydlyn.webp)

展开`MemoryBlobStore`，可以从其构造函数发现，默认情况下只提供了基于Guava的内存缓存，包装的`BlobStore`是一个空实现，且在此处注释，告知其默认行为和提示的操作。也就是说，包装的`BlobStore`实例对象可以是`BlobStore`接口的任意实现，我在此将使用基于文件系统的实现（`FileBlobStore`）进行填充。

![gac-2](https://zhou-fuyi.github.io/picx-images-hosting/gac-2.839xcldkkq.webp)

最终，将二级缓存构建的整体逻辑结合可配置性封装于一个注册类中，在此将其命名为：`StorageBrokerRegister`，此即为全局共用的缓存存储对象，主要代码如下所示：

```java
public class StorageBrokerRegister implements EnvironmentAware, ImportBeanDefinitionRegistrar {

    private static final Logger log = LoggerFactory.getLogger(StorageBrokerRegister.class);

    private static final String FILE_SYSTEM_PROVIDER = "file-system";

    private static final String GEO_PACKAGE = "geo-package";

    private Environment environment;

    private DefaultStorageFinder storageFinder = new DefaultStorageFinder(null);

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
        // FIXME: 2024/5/10 其实目前TransientCache并没有什么使用场景，不过暂时先留下
        // TransientCache 早于MemoryStore出现, 前者应该是2012年, 后者应该是2014年
        TransientCache transientCache = new TransientCache(100, 1024, 2000);
        BlobStore blobStore = new NullBlobStore();
        Boolean cacheEnabled = getApplicationValue(GeoAtlasCacheEnvKeys.getCacheEnabled(), Boolean.class, Boolean.FALSE);
        if (cacheEnabled) {
            Boolean innerCachingEnabled = getApplicationValue(GeoAtlasCacheEnvKeys.getInnerCachingEnabled(), Boolean.class, Boolean.FALSE);
            Boolean persistenceEnabled = getApplicationValue(GeoAtlasCacheEnvKeys.getPersistenceEnabled(), Boolean.class, Boolean.FALSE);
            if (innerCachingEnabled) {
                MemoryBlobStore memoryBlobStore = buildInnerCache();
                if (persistenceEnabled) {
                    memoryBlobStore.setStore(buildPersistenceCache());
                }
                blobStore = memoryBlobStore;
            }else if (persistenceEnabled) {
                blobStore = buildPersistenceCache();
            }else {
                log.warn("The cache configuration can be turned on, but the memory cache and persistent cache are turned off and cannot be further configured." +
                        " Please check your configuration items.");
                log.warn("This blobStore configuration fails and will enter a no-cache state.");
            }
        }

        BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(DefaultStorageBroker.class);
        builder.addConstructorArgValue(blobStore).addConstructorArgValue(transientCache);
        AbstractBeanDefinition beanDefinition = builder.getBeanDefinition();
        beanDefinition.setSynthetic(true);

        registry.registerBeanDefinition("storageBroker", beanDefinition);
        log.info("The BlobStore registration is complete");
    }
    
    ...
}
```

#### Seed、Reseed&Truncate

对于Truncate来说，直接进行全面移植即可。由于此处移除了TileLayer概念，所以Seed与Reseed无法全面移植处理，而是仅移植其最终实现部分，对于这两者与源端瓦片的链接则通过`TileSource`接口来实现。即默认情况下，GAC无法提供完整的Seed与Reseed功能，需要接入端实现`TileSource`中的`seedTile`方法，GAC中仅提供一个`TileSource`的空实现。

```java
public interface TileSource {
    /**
     * 即默认不使用MetaTiles
     */
    int[] META_TILING_FACTORS = {1,1};

    /**
     * The size of a metatile in tiles.
     *
     * @return the {x,y} metatiling factors
     */
    default int[] getMetaTilingFactors() {
        return META_TILING_FACTORS;
    }

    void seedTile(ConveyorTile tile, boolean tryCache)
            throws GeoAtlasCacheException, IOException;
}
```

```java
public abstract class AbstractTileSource implements TileSource{
    private final Logger log = LoggerFactory.getLogger(getClass());

    protected static final ThreadLocal<ByteArrayResource> TILE_BUFFER = new ThreadLocal<>();

    public void seedTile(ConveyorTile tile, boolean tryCache)
            throws GeoAtlasCacheException, IOException {
        // Cache模块无法自主执行seed&reseed操作，需要集成方自行实现
        if (log.isWarnEnabled()){
            log.warn("The Cache module cannot perform seed & reseed operations autonomously, and the integrator needs to implement it by itself.");
        }
    }

    protected void transferTile(TileObject tile, ConveyorTile tileProto, long requestTime, boolean persistent) throws GeoAtlasCacheException {
        ByteArrayResource resource = this.getTileBuffer(TILE_BUFFER);
        // copy resource
        tileProto.setBlob(resource);
        try {
            writeTileToStream(tile, resource);
            tile.setCreated(requestTime);
            if (persistent){
                tileProto.getStorageBroker().put(tile);
            }
            tileProto.getStorageObject().setCreated(tile.getCreated());
        } catch (StorageException var18) {
            throw new GeoAtlasCacheException(var18);
        } catch (IOException e) {
            log.error("Unable to write image tile to ByteArrayOutputStream", e);
        }
    }

    protected ByteArrayResource getTileBuffer(ThreadLocal<ByteArrayResource> tl) {
        ByteArrayResource buffer = (ByteArrayResource) tl.get();
        if (buffer == null) {
            buffer = new ByteArrayResource(16 * 1024);
            tl.set(buffer);
        }

        buffer.truncate();
        return buffer;
    }

    public boolean writeTileToStream(final TileObject raw, Resource target) throws IOException {
        try (OutputStream outStream = target.getOutputStream()) {
            IOUtils.copy(raw.getBlob().getInputStream(), outStream);
        }
        return true;
    }
}

// GAC中TileSource的默认实现
public class DefaultTileSource extends AbstractTileSource {
}
```

>💡 这里需要注意的是，GWC中有一个Metatiles技术，是一个针对地图瓦片（PNG|JPEG）的优化技术。但是在GWC现有的架构组织上，Metatiles是无法支持矢量瓦片技术的，也就是会还原为1x1的组合。所以我在此处直接将Metatiles默认设置为1x1的组合，同时暂时去除了瓦片转存部分中Metatiles拆分逻辑。

#### TileMatrixSubset拓展

先讲一下当指定BBox后，Truncate、Seed、Reseed的大体执行逻辑。GAC对于瓦片清理策略的执行与GWC保持高度一致，同样支持指定BBox进行瓦片清理，BBox用于限定可清理范围。在前文中对于TileMatrixSet和TileMatrixSubset做过解释，前者用于定义瓦片矩阵集，后者用于在瓦片矩阵集中描述数据的实际范围，同时限定瓦片可请求的范围，此两者分别对应GWC中的GridSet及GridSubset。在GWC携带BBox的瓦片清理策略执行过程中，会获取对应TileLayer的GridSubset，并与给定的BBox计算相交范围，而后就可以精确的确定哪些瓦片是需要被清理的了。对于GAC来说，并没有如TileLayer的概念，也无法与源端或图层（FeatureLayer）进行直接链接，所以是无法获取到图层所持有的TileMatrixSubset对象（如果有的话）。

当然，并不是说没有TileMatrixSubset对象就无法进行瓦片缓存的清理了。就拿我们实际应用中大部分场景来说，一般都会使用基于Web墨卡托或CGCS2000经纬度等间隔直投的瓦片矩阵集作为TileMatrixSet，用数据的实际范围构建TileMatrixSubset。此时可认为前者为全球范围，后者为局部范围。但无论与全球范围还是局部范围进行相交计算，其最终计算结果是一致的，都是可以正常工作的。只不过直觉告诉我，使用局部范围计算应该会更快一些 也未可知啊 🤔（我没有数据支持，纯属瞎咧咧 😛），所以继续留下TileMatrixSubset的拓展点。

也就是说，默认情况下，GAC是无法获取到图层的TileMatrixSubset对象的，那么会使用TileMatrixSet对应的范围进行TileMatrixSubset的构建。可能你会问，既然可以在全局获取到TileMatrixSet对象，那么为什么就不能如此处理TileMatrixSubset对象呢？这是因为TileMatrixSet是强制需要有的，而且Geo Atlas中的TileMatrixSet并不与图层绑定，声明即支持；而TileMatrixSubset是可选的，且是特定于图层的，所以无法如此设置。

```java
public abstract class AbstractTileSeedService implements TileSeedService{

    private TileBreeder breeder;

    public AbstractTileSeedService(TileBreeder breeder) {
        this.breeder = breeder;
    }

    public void doSeed(SeedRequest request) throws GeoAtlasCacheException {
        TileMatrixSet matrixSet = TileMatrixSetContext.getTileMatrixSet(request.getMatrixSetId());
        if (matrixSet == null) {
            throw new GeoAtlasCacheException("TileMatrixSet not found");
        }
        breeder.seed(request, getSubset(request, matrixSet));
    }

    /**
     * 必须实现获取subset的方法
     * @param request
     * @param matrixSet
     * @return
     */
    protected abstract TileMatrixSubset getSubset(SeedRequest request, TileMatrixSet matrixSet) throws GeoAtlasCacheException;
}

public class DefaultTileSeedService extends AbstractTileSeedService{

    public DefaultTileSeedService(TileBreeder breeder) {
        super(breeder);
    }

    @Override
    protected TileMatrixSubset getSubset(SeedRequest request, TileMatrixSet matrixSet) throws GeoAtlasCacheException {
        // 由于目前并不存在如Tile Layer的概念, 所以在Cache模块里面无法获取到FeatureLayer的TileMatrixSubset, 所以这里直接返回null,
        // 那么将会使用 request中给定的matrixSetId 来创建 TileMatrixSubset(也就是是一个范围与TileMatrixSet相同的TileMatrixSubset)
        // 继承方可以自行实现该接口, 从而注入FeatureLayer的TileMatrixSubset
        return null;
    }
}
```

#### 快速集成

此处基于Spring Boot的`AutoConfiguration`特性对外提供快速集成能力，也就是说GAC是具备自动装配功能的。这里将需要被自动装配的内容封装到一块，命名为`GeoAtlasCacheAutoConfiguration`，并将其添加到`spring.factories`配置文件中。

```java
@ConditionalOnProperty(value = "geo-atlas.cache.enabled", havingValue = "true", matchIfMissing = true)
@Import(StorageBrokerRegister.class)
public class GeoAtlasCacheAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(value = SeederThreadPoolExecutor.class)
    public SeederThreadPoolExecutor seederThreadPoolExecutor() {
        return new SeederThreadPoolExecutor(16, 32);
    }

    @Bean
    @ConditionalOnMissingBean(value = TileSource.class)
    public TileSource tileSource() {
        return new DefaultTileSource();
    }

    @Bean
    @ConditionalOnMissingBean(value = TileBreeder.class)
    public TileBreeder tileBreeder(StorageBroker storageBroker, TileSource tileSource, SeederThreadPoolExecutor stpe) {
        return new TileBreeder(tileSource, storageBroker, stpe);
    }

    @Bean
    @ConditionalOnMissingBean(value = TileSeedService.class)
    public TileSeedService tileSeedService(TileBreeder tileBreeder){
        return new DefaultTileSeedService(tileBreeder);
    }

    @Bean
    @ConditionalOnMissingBean(value = TileSeedEndpoint.class)
    public TileSeedEndpoint tileSeedEndpoint(TileSeedService tileSeedService) {
        return new TileSeedEndpoint(tileSeedService);
    }
}
```

![gac-3](https://zhou-fuyi.github.io/picx-images-hosting/gac-3.7egnskq1k6.webp)

>💡 需要特别注意的是，此处所述的自动装配，仅仅只能完成缓存模块的装配，并暴露出全局唯一的`BlobStore`代理对象：`StorageBroker`，但是并没有完成与图层或源端的链接，需要接入方自行处理。对于GAC的接入示例，可参考附录部分。

## 小结

GAC，即Geo Atlas Cache，自此已全部完成。通过GAC开发，对于GWC（GeoWebCache）的理解又多了一些🫣。

事务的产生必有其原因与其使命，即要解决的问题，同时还会受产生阶段的环境影响。GAC之所以出现是因为需要构建Geo Atlas的生态，同时希望可以保持缓存模块的纯粹性和易用性，且可以快速进行集成，以便投入项目开发中。受制于个人经历与眼界的影响，GAC、Geo Atlas并没有达成其理想的状态，虽不影响正常的使用。（这似乎是一个悖论，人是复杂的，或许是冥冥之中有人告诉我，让我有了此段描述也未可知啊 😑）

我愿集众家之所长，塑于Geo Atlas。期待你的进步，加油！

>💡 ps：更多实现情况，请参见GAC源码：[Geo Atlas Cache@Github](https://github.com/geoatlas-cloud/geo-atlas/tree/main/component/tile-cache)

## 参考

- [Java二级高速缓存架构设计_缓存_元年技术洞察_InfoQ写作社区](https://xie.infoq.cn/article/0c8c163899a5425dd19c7b48f)

- [多级缓存 架构设计 - 疯狂创客圈 - 博客园](https://www.cnblogs.com/crazymakercircle/p/17673609.html)

- [微服务架构中的多级缓存设计还有人不懂？](https://juejin.cn/post/7202479313228218428)

- [彻底弄懂浏览器缓存策略](https://www.jiqizhixin.com/articles/2020-07-24-12)

- [MBTiles 与 SMTiles 格式的地图瓦片](http://support.supermap.com.cn/DataWarehouse/WebDocHelp/iServer/Subject_introduce/Cache/MapCache/TileFormat/MBTiles_Support.htm)

- [BlobStores — GeoServer 2.26.x User Manual](https://docs.geoserver.org/main/en/user/geowebcache/webadmin/blobstores.html)

- [GeoWebCache Metatiles](https://geowebcache.osgeo.org/docs/current/concepts/metatiles.html)

## 附录

### GAC的集成示例

我在ogc-api模块中集成了tile-cache（即GAC），下面对本次集成做简要描述：

- 第一要素，依赖
    
    ```xml
    <dependency>
        <groupId>org.geo-atlas.component</groupId>
        <artifactId>tile-cache</artifactId>
        <version>${revision}</version>
    </dependency>
    ```
    
- 实现源端（Data Source）于GAC的链接 & 实现`TileSource`拓展
    
    ```java
    @Component
    public class DefaultTileGenerator extends AbstractTileSource implements GeoAtlasTileGenerator {
    
        private final FeatureSourceHelper featureSourceHelper;
    
        private String lockProvider;
    
        private transient LockProvider lockProviderInstance;
    
        private static final Logger log = LoggerFactory.getLogger(DefaultTileGenerator.class);
    
        public DefaultTileGenerator(FeatureSourceHelper featureSourceHelper) {
            this.featureSourceHelper = featureSourceHelper;
        }
    
        public ConveyorTile generator(ConveyorTile tile) throws IOException, GeoAtlasCacheException, OutsideCoverageException {
            // FIXME: 2024/5/10 可以再次检查 MimeType, 在应用层面控制MimeType的支持
            // checkMimeType(tile);
    
            TileMatrixSet tileMatrixSet = TileMatrixSetContext.getTileMatrixSet(tile.getGridSetId());
            if (tileMatrixSet == null) {
                throw new IllegalArgumentException("TileMatrixSet not found by identifier: " + tile.getGridSetId());
            }
            // FIXME: 2024/5/10 需要在metadata中给featureLayer指定coverage, 可以选择从数据源读取或者是自行设定(更推荐自行设定, 性能友好且更通用)
            final TileMatrixSubset gridSubset = tile.getGridSubset();
            if (gridSubset == null) {
                throw new IllegalArgumentException("Requested gridset not found: " + tile.getRequest().getSchema());
            }
            final long[] gridLoc = tile.getTileIndex();
            checkNotNull(gridLoc);
            // Final preflight check, throws OutsideCoverageException if necessary
            gridSubset.checkCoverage(gridLoc);
    
            // FIXME: 2024/5/10 暂时不对meta tiles做支持
            int metaX;
            int metaY;
            if (tile.getMimeType().supportsTiling()) {
                metaX = getMetaTilingFactors()[0];
                metaY = getMetaTilingFactors()[1];
            } else {
                metaX = metaY = 1;
            }
    
            ConveyorTile tileResponse;
            if (tile.getStorageBroker() == null) {
                tileResponse = getNonCachedTile(tile);
            }else {
                tileResponse = getTileResponse(tile, true, true, metaX, metaY);
            }
    
    //        sendTileRequestedEvent(returnTile);
            return tileResponse;
        }
        public ConveyorTile getNonCachedTile(ConveyorTile tile) throws GeoAtlasCacheException {
            try {
                return getTileResponse(tile, false, false, 1, 1);
            } catch (IOException e) {
                throw new GeoAtlasCacheException(e);
            }
        }
    
        @Override
        public void seedTile(ConveyorTile tile, boolean tryCache) throws GeoAtlasCacheException, IOException {
            // Ignore a seed call on a tile that's outside the cached grid levels range
            // 忽略缓存网格级别范围之外的图块上的种子调用
            final TileMatrixSubset subset = tile.getGridSubset();
            final int zLevel = (int) tile.getTileIndex()[2];
            if (!subset.shouldCacheAtZoom(zLevel)) {
                if (log.isDebugEnabled()) {
                    log.debug(
                            "Ignoring seed call on tile "
                                    + tile
                                    + " as it's outside the cacheable zoom level range");
                }
                return;
            }
    
            int metaX = getMetaTilingFactors()[0];
            int metaY = getMetaTilingFactors()[1];
            if (!tile.getMimeType().supportsTiling()) {
                metaX = metaY = 1;
            }
            getTileResponse(tile, tryCache, true, metaX, metaY);
        }
    
        protected ConveyorTile getTileResponse(
                ConveyorTile tile, final boolean tryCache, final boolean persistent, final int metaX, final int metaY)
                throws GeoAtlasCacheException, IOException {
    
            if (tryCache && tryCacheFetch(tile)) {
                return finalizeTile(tile);
            }
    
            TileObject target = null;
            TileRequest request = tile.getRequest();
            LockProvider.Lock lock = null;
            try {
                /* ****************** Acquire lock ******************* */
                lock = getLockProvider().getLock(buildLockKey(tile));
                // got the lock on the tile, try again
                if (tryCache && tryCacheFetch(tile)) {
                    log.debug("--> {} returns cache hit for {}", Thread.currentThread().getName(), Arrays.toString(tile.getTileIndex()));
                } else {
                    log.debug("--> {} submitting getTile request for tile matrix location on {}", Thread.currentThread().getName(), Arrays.toString(tile.getTileIndex()));
                    long requestTime = System.currentTimeMillis();
                    try {
                        FeatureSourceConveyor wrapper = featureSourceHelper.getFeatureSource(request.getNamespace(), request.getLayer());
                        Pyramid pyramid = findPyramid(request, wrapper.getRules());
                        target = pyramid.getTile(request, wrapper.getFeatureSource(), wrapper.getCrs());

                        // 此处便完成了瓦片数据对象到瓦片缓存的转换
                        transferTile(target, tile, requestTime, persistent);
                    }catch (Exception e) {
                        Throwables.throwIfInstanceOf(e, GeoAtlasCacheException.class);
                        throw new GeoAtlasCacheException("Problem communicating with GeoAtlas TileAPI", e);
                    }
                }
            } finally {
                if (lock != null) {
                    lock.release();
                }
            }
    
            return finalizeTile(tile);
        }
        
        ...
    }
    ```
    
- 实现TileMatrixSubset拓展
    
    ```java
    @Component
    @ConditionalOnBean(TileBreeder.class)
    public class SimpleTileSeedService extends AbstractTileSeedService {
    
        private final FeatureTileMatrixSubsetContext subsetContext;
        private final FeatureSourceHelper featureSourceHelper;
    
        public SimpleTileSeedService(TileBreeder breeder, FeatureTileMatrixSubsetContext subsetContext,
                                     FeatureSourceHelper featureSourceHelper) {
            super(breeder);
            this.subsetContext = subsetContext;
            this.featureSourceHelper = featureSourceHelper;
        }
    
        @Override
        protected TileMatrixSubset getSubset(SeedRequest request, TileMatrixSet matrixSet) throws GeoAtlasCacheException {
            NamespaceInfo namespaceInfo = featureSourceHelper.getNamespaceInfo(request.getNamespace());
            if (namespaceInfo == null) {
                throw new GeoAtlasCacheException("namespace not found");
            }
            FeatureLayerInfo featureLayerInfo = featureSourceHelper.getFeatureLayerInfo(request.getNamespace(), request.getLayerName(), namespaceInfo);
            if (featureLayerInfo == null){
                throw new GeoAtlasCacheException("layer not found");
            }
            return subsetContext.getTileMatrixSubset(featureLayerInfo, matrixSet);
        }
    }
    ```
- 缓存配置（此配置来自于：[geoatlas-tile-instance](https://github.com/geoatlas-cloud/geo-atlas/blob/main/app/geoatlas-tile-instance/src/main/resources/application-dev.yml)），并未展示出全部配置内容
    
    ```yaml
    geo-atlas:
      cache:
        enabled: true
        inner-caching-enabled: true
        persistence-enabled: true # 默认是file-system
        inner:
          storage:
            eviction-policy: EXPIRE_AFTER_ACCESS
            memory-limit: 256
        persistence:
          storage:
            base-directory: ${PERSISTENCE_CACHE_DIR:/tmp/gac}
    ```