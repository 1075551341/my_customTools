/**
 * 默认配置值
 *
 * 定义所有配置项的默认值，当环境变量未设置时使用
 *
 * @module config/defaults
 */
/**
 * 服务配置
 */
export interface ServerConfig {
    port: number;
    nodeEnv: string;
    baseUrl: string;
}
/**
 * JWT 配置
 */
export interface JwtConfig {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
}
/**
 * Redis 配置
 */
export interface RedisConfig {
    host: string;
    port: number;
    password: string;
}
/**
 * 存储配置
 */
export interface StorageConfig {
    uploadDir: string;
    outputDir: string;
    dataDir: string;
    logDir: string;
}
/**
 * 功能开关配置
 */
export interface FeaturesConfig {
    allowRegister: boolean;
    enableRateLimit: boolean;
}
/**
 * FFmpeg 配置
 */
export interface FfmpegConfig {
    path: string;
    ffprobePath: string;
}
/**
 * CORS 配置
 */
export interface CorsConfig {
    origins: string;
}
/**
 * 完整配置接口
 */
export interface DefaultConfig {
    server: ServerConfig;
    jwt: JwtConfig;
    redis: RedisConfig;
    storage: StorageConfig;
    features: FeaturesConfig;
    ffmpeg: FfmpegConfig;
    cors: CorsConfig;
}
/**
 * 默认配置值
 */
declare const defaults: DefaultConfig;
export default defaults;
//# sourceMappingURL=defaults.d.ts.map