import axios from 'axios'
import { ConfigService } from '../utils/config.js'

// 创建axios实例
const api = axios.create({
  baseURL: ConfigService.fileServerUrl,
  timeout: ConfigService.uploadConfig.timeout,
  withCredentials: true, // 支持跨域请求携带cookie
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    // 注意：Access-Control-Allow-Credentials 应该由服务器设置，不应该在客户端请求中设置
    console.log('发送请求:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.status, response.config.url)
    return response
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      // 服务器返回错误状态码
      console.error('API Error:', error.response.status, error.response.data)
      
      // 特殊处理常见的跨域相关错误
      if (error.response.status === 403) {
        console.error('访问被拒绝，可能是CORS配置问题')
      }
    } else if (error.request) {
      // 请求发送失败 - 可能是CORS问题
      if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
        console.error('CORS Error: 跨域请求失败，请检查服务器CORS配置')
        console.error('当前请求地址:', error.config?.baseURL || 'unknown')
        console.error('建议检查：1. 服务器是否启动 2. CORS配置是否正确 3. 代理配置是否生效')
      } else if (error.code === 'ECONNREFUSED') {
        console.error('连接被拒绝，请检查服务器是否启动')
      } else {
        console.error('Network Error:', error.request)
      }
    } else {
      // 其他错误
      console.error('Error:', error.message)
    }
    return Promise.reject(error)
  }
)

// 文件API服务
export class FileApiService {
  // 获取文件列表
  static async getFiles(params = {}) {
    const response = await api.get('/list', { params })
    return response.data
  }

  // 获取单个文件
  static async getFile(fileId) {
    const response = await api.get(`/query/${fileId}`)
    return response.data
  }

  // 上传文件
  static async uploadFile(file, albumId = null, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)
    if (albumId) {
      formData.append('albumId', albumId)
    }

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress,
      withCredentials: true // 确保上传请求也支持跨域
    })
    return response.data
  }

  // 批量上传文件
  static async uploadFiles(files, albumId = null, onProgress = null) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    if (albumId) {
      formData.append('albumId', albumId)
    }

    const response = await api.post('/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress,
      withCredentials: true // 确保批量上传请求也支持跨域
    })
    return response.data
  }

  // 删除文件
  static async deleteFile(fileId) {
    const response = await api.delete(`/delete/${fileId}`)
    return response.data
  }

  // 批量删除文件
  static async deleteFiles(fileIds) {
    const response = await api.delete('/batch', {
      data: { fileIds }
    })
    return response.data
  }

  // 更新文件信息
  static async updateFile(fileId, updates) {
    const response = await api.put(`/update/${fileId}`, updates)
    return response.data
  }

  // 获取文件缩略图URL
  static getThumbnailUrl(fileId) {
    return `${ConfigService.fileServerUrl}/getFile/${fileId}?type=thumbnail`
  }

  // 获取原图URL
  static getOriginalUrl(fileId) {
    return `${ConfigService.fileServerUrl}/getFile/${fileId}`
  }

  // 收藏照片
  static async favoritePhoto(fileId) {
    const response = await api.post(`/favorite/${fileId}`)
    return response.data
  }

  // 取消收藏照片
  static async unfavoritePhoto(fileId) {
    const response = await api.delete(`/favorite/${fileId}`)
    return response.data
  }
}

// 相册API服务
export class AlbumApiService {
  // 获取相册列表
  static async getAlbums() {
    const response = await api.get('/albums')
    return response.data
  }

  // 获取相册详情
  static async getAlbum(albumId) {
    const response = await api.get(`/albums/${albumId}`)
    return response.data
  }

  // 创建相册
  static async createAlbum(albumData) {
    const response = await api.post('/albums', albumData)
    return response.data
  }

  // 更新相册
  static async updateAlbum(albumId, updates) {
    const response = await api.put(`/albums/${albumId}`, updates)
    return response.data
  }

  // 删除相册
  static async deleteAlbum(albumId) {
    const response = await api.delete(`/albums/${albumId}`)
    return response.data
  }

  // 获取相册内的照片
  static async getAlbumPhotos(albumId, params = {}) {
    const response = await api.get(`/albums/${albumId}/photos`, { params })
    return response.data
  }

  // 收藏相册
  static async addAlbumFavorite(albumId) {
    const response = await api.post(`/album/favorite/${albumId}`)
    return response.data
  }

  // 取消收藏相册
  static async removeAlbumFavorite(albumId) {
    const response = await api.delete(`/album/favorite/${albumId}`)
    return response.data
  }
}

// 标签API服务
export class TagApiService {
  // 获取所有标签
  static async getAllTags() {
    const response = await api.get('/tags/all')
    return response.data
  }
}

export default api