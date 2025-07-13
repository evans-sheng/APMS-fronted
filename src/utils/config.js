// 配置管理服务
export class ConfigService {
  static get fileServerUrl() {
    // 开发环境下使用代理，直接使用相对路径
    if (import.meta.env.DEV && import.meta.env.VITE_USE_PROXY === 'true') {
      const baseUrl = import.meta.env.VITE_FILE_SERVER_BASE_URL || '/api/files';
      return baseUrl;
    }
    
    // 生产环境或非代理模式使用完整URL
    const protocol = import.meta.env.VITE_FILE_SERVER_PROTOCOL || 'http';
    const host = import.meta.env.VITE_FILE_SERVER_HOST || 'localhost';
    const port = import.meta.env.VITE_FILE_SERVER_PORT || '8888';
    const baseUrl = import.meta.env.VITE_FILE_SERVER_BASE_URL || '/api/files';
    
    return `${protocol}://${host}:${port}${baseUrl}`;
  }
  
  static get uploadConfig() {
    return {
      timeout: parseInt(import.meta.env.VITE_UPLOAD_TIMEOUT) || 30000,
      maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760,
      supportedFormats: import.meta.env.VITE_SUPPORTED_FORMATS?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'webp']
    };
  }
  
  // 获取当前环境是否使用代理
  static get useProxy() {
    return import.meta.env.DEV && import.meta.env.VITE_USE_PROXY === 'true';
  }
}

// 配置验证
export class ConfigValidator {
  static validate() {
    // 如果不使用代理，则验证完整URL配置
    if (!ConfigService.useProxy) {
      const required = [
        'VITE_FILE_SERVER_HOST',
        'VITE_FILE_SERVER_PORT',
        'VITE_FILE_SERVER_PROTOCOL'
      ];
      
      const missing = required.filter(key => !import.meta.env[key]);
      
      if (missing.length > 0) {
        console.warn('Missing required environment variables:', missing);
      }
      
      // 验证端口号
      const port = parseInt(import.meta.env.VITE_FILE_SERVER_PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('Invalid port number in configuration');
      }
    }
  }
}

// 开发时显示配置
if (import.meta.env.DEV) {
  console.log('File Server Configuration:', {
    url: ConfigService.fileServerUrl,
    uploadConfig: ConfigService.uploadConfig,
    useProxy: ConfigService.useProxy
  });
} 