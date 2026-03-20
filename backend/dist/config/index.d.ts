/**
 * 配置模块主入口
 *
 * 功能说明：
 * - 合并环境变量和持久化配置
 * - 提供统一的配置访问接口
 * - 支持配置热更新
 *
 * @module config
 */
/**
 * 视频配置接口
 */
interface VideoConfig {
    parallelLimit: number;
    maxFileSize: number;
    allowedInputFormats: string[];
}
/**
 * 图片配置接口
 */
interface ImgConfig {
    parallelLimit: number;
    maxFileSize: number;
    allowedInputFormats: string[];
}
/**
 * 上传配置接口
 */
interface UploadConfig {
    chunkSize: number;
    maxParallelUploads: number;
}
/**
 * 应用配置接口
 */
interface AppConfig {
    server: {
        port: number;
        nodeEnv: string;
        baseUrl: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
    };
    storage: {
        uploadDir: string;
        outputDir: string;
        dataDir: string;
        logDir: string;
    };
    features: {
        allowRegister: boolean;
        enableRateLimit: boolean;
    };
    ffmpeg: {
        path: string;
        ffprobePath: string;
    };
    cors: {
        origins: string[];
    };
    video: VideoConfig;
    img: ImgConfig;
    upload: UploadConfig;
}
/**
 * 应用配置对象
 *
 * 包含所有配置项，按模块分组
 */
declare const config: AppConfig;
export default config;
//# sourceMappingURL=index.d.ts.map