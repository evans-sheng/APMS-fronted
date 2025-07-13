<template>
  <div class="cover-upload">
    <label class="cover-label">相册封面</label>
    
    <!-- 上传区域 -->
    <div 
      class="cover-upload-area"
      :class="{ 'has-cover': hasImagePreview, 'dragover': isDragOver }"
      @click="triggerFileInput"
      @drop="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
    >
      <!-- 预览图片 -->
      <div v-if="hasImagePreview" class="cover-preview">
        <img :src="imagePreview" :alt="fileName" class="preview-image" />
        <div class="cover-overlay">
          <div class="overlay-content">
            <svg viewBox="0 0 24 24" fill="currentColor" class="edit-icon">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <span>更换封面</span>
          </div>
        </div>
        <button 
          @click.stop="removeCover"
          class="remove-cover-btn"
          title="移除封面"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="cover-empty">
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </div>
        <p class="upload-text">点击上传封面图片</p>
        <p class="upload-hint">支持 JPG、PNG、GIF 格式，建议尺寸 400x300</p>
      </div>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="handleFileSelect"
      style="display: none"
    />
    
    <!-- 文件信息 -->
    <div v-if="selectedFile && !isUploading" class="file-info">
      <div class="file-details">
        <span class="file-name">{{ fileName }}</span>
        <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
      </div>
    </div>
    
    <!-- 上传进度 -->
    <div v-if="isUploading" class="upload-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
      </div>
      <span class="progress-text">{{ uploadProgress }}%</span>
    </div>
    
    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { FileApiService } from '@/services/api'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  existingCoverUrl: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'uploaded', 'removed'])

// 响应式数据
const fileInput = ref(null)
const selectedFile = ref(null)
const imagePreview = ref(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const error = ref(null)

// 计算属性
const hasImagePreview = computed(() => {
  return imagePreview.value || props.existingCoverUrl
})

const fileName = computed(() => {
  if (selectedFile.value) {
    return selectedFile.value.name
  }
  return ''
})

// 监听外部传入的封面URL
watch(() => props.existingCoverUrl, (newUrl) => {
  if (newUrl && !selectedFile.value) {
    imagePreview.value = newUrl
  }
}, { immediate: true })

// 方法
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

const handleDrop = (event) => {
  isDragOver.value = false
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processFile(file)
  }
}

const processFile = (file) => {
  // 验证文件
  if (!file.type.startsWith('image/')) {
    error.value = '请选择图片文件'
    return
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB
    error.value = '图片大小不能超过10MB'
    return
  }
  
  error.value = null
  selectedFile.value = file
  
  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  
  // 开始上传
  uploadFile(file)
}

const uploadFile = async (file) => {
  try {
    isUploading.value = true
    uploadProgress.value = 0
    error.value = null
    
    const response = await FileApiService.uploadFile(file, null, (progressEvent) => {
      const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      uploadProgress.value = progress
    })
    
    console.log('封面上传响应:', response)
    
    // 上传成功 - 尝试多种可能的文件ID字段
    const fileId = response.file?.id || response.id || response.fileId || response.data?.id || response.data?.file?.id
    
    if (!fileId) {
      console.error('无法获取文件ID，响应数据:', response)
      throw new Error('无法获取文件ID')
    }
    
    console.log('获取到文件ID:', fileId)
    emit('update:modelValue', fileId)
    emit('uploaded', { ...response, fileId })
    
  } catch (err) {
    console.error('Upload failed:', err)
    error.value = '上传失败，请重试'
    selectedFile.value = null
    imagePreview.value = props.existingCoverUrl
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

const removeCover = () => {
  selectedFile.value = null
  imagePreview.value = null
  error.value = null
  emit('update:modelValue', null)
  emit('removed')
  
  // 清空文件输入
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<style scoped>
.cover-upload {
  margin-bottom: 1.5rem;
}

.cover-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.cover-upload-area {
  position: relative;
  width: 100%;
  height: 200px;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  background: var(--color-background-mute);
}

.cover-upload-area:hover {
  border-color: var(--color-border-hover);
  background: var(--color-background);
}

.cover-upload-area.dragover {
  border-color: var(--color-border-hover);
  background: var(--color-background);
  transform: scale(1.02);
}

.cover-upload-area.has-cover {
  border: 1px solid var(--color-border);
}

/* 预览区域 */
.cover-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-align: center;
}

.edit-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 0.5rem;
}

.remove-cover-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.remove-cover-btn:hover {
  background: rgba(220, 53, 69, 0.8);
}

.remove-cover-btn svg {
  width: 16px;
  height: 16px;
}

/* 空状态 */
.cover-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text);
}

.upload-icon {
  margin-bottom: 1rem;
  opacity: 0.6;
}

.upload-icon svg {
  width: 48px;
  height: 48px;
}

.upload-text {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.upload-hint {
  font-size: 0.875rem;
  opacity: 0.7;
  margin: 0;
}

/* 文件信息 */
.file-info {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: var(--color-background-mute);
  border-radius: 8px;
}

.file-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-size: 0.875rem;
  color: var(--color-text);
  truncate: true;
  max-width: 60%;
}

.file-size {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* 上传进度 */
.upload-progress {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: 500;
  min-width: 40px;
}

/* 错误信息 */
.error-message {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.2);
  border-radius: 8px;
  color: #d32f2f;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message svg {
  width: 16px;
  height: 16px;
}
</style> 