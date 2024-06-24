# 构建 {#building}

此处仅描述服务端代码的构建情况, Dashboard的构建还请查看[Geo Atlas Dashboard Building](/dashboard-building)

1. 克隆代码
    ```shell
    git clone https://github.com/geoatlas-cloud/geo-atlas.git
    cd geo-atlas/
    ```
2. 要构建应用程序，请从根项目目录运行以下命令, 或者使用IDEA的Maven插件

    ```shell
    mvn clean install -DskipTests
    ```

## 运行调试

1. 配置环境变量, 默认使用dev环境(当然，你可以直接修改dev.yml文件, 而不是通过环境变量控制)

   ![tiles-api-app-dev-env-config](https://zhou-fuyi.github.io/picx-images-hosting/tiles-api-app-dev-env-config.49152iqvfa.webp)

2. 自行用IDEA打开项目，然后运行Application类。

