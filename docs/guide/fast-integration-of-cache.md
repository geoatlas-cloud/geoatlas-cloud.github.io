# GAC的集成示例

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

> 更多关于Geo Atlas Cache的描述可参见：[Geo Atlas Cache，一个精简的GWC组件](/reference/what-is-gac)