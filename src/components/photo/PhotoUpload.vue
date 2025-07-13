<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>上传照片</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="upload-content">
        <!-- 拖拽区域 -->
        <div 
          class="drop-zone"
          :class="{ 'dragover': isDragOver }"
          @drop="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
        >
          <div class="upload-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          <h4>拖拽照片到这里</h4>
          <p>或者点击选择文件</p>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*"
            @change="handleFileSelect"
            class="file-input"
          />
          <button @click="$refs.fileInput.click()" class="select-btn">
            选择照片
          </button>
        </div>

        <!-- 文件列表 -->
        <div v-if="selectedFiles.length > 0" class="file-list">
          <div class="file-list-header">
            <h4>已选择 {{ selectedFiles.length }} 张照片</h4>
            <button @click="clearFiles" class="clear-btn">清空</button>
          </div>
          
          <div class="files-grid">
            <div 
              v-for="(file, index) in selectedFiles" 
              :key="index"
              class="file-item"
            >
              <div class="file-preview">
                <img 
                  v-if="file.preview" 
                  :src="file.preview" 
                  :alt="file.name"
                  class="preview-image"
                />
                <div v-else class="preview-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <button 
                  @click="removeFile(index)"
                  class="remove-file-btn"
                >
                  ×
                </button>
              </div>
              <div class="file-info">
                <p class="file-name">{{ file.name }}</p>
                <p class="file-size">{{ formatFileSize(file.size) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="upload-actions">
          <button @click="$emit('close')" class="btn-secondary">
            取消
          </button>
          <button 
            @click="startUpload"
            :disabled="selectedFiles.length === 0"
            class="btn-primary"
          >
            开始上传
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FileApiService } from '@/services/api'

const props = defineProps({
  albumId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'uploaded'])

const fileInput = ref(null)
const isDragOver = ref(false)
const selectedFiles = ref([])

// 方法
const handleDrop = (event) => {
  isDragOver.value = false
  const files = Array.from(event.dataTransfer.files).filter(file => 
    file.type.startsWith('image/')
  )
  addFiles(files)
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
}

const addFiles = (files) => {
  files.forEach(file => {
    const fileObj = {
      file,
      name: file.name,
      size: file.size,
      preview: null
    }
    
    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      fileObj.preview = e.target.result
    }
    reader.readAsDataURL(file)
    
    selectedFiles.value.push(fileObj)
  })
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
}

const clearFiles = () => {
  selectedFiles.value = []
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

const startUpload = async () => {
  if (selectedFiles.value.length === 0) return
  
  try {
    const files = selectedFiles.value.map(item => item.file)
    const uploadedPhotos = await FileApiService.uploadFiles(files, props.albumId)
    emit('uploaded', uploadedPhotos)
    emit('close')
  } catch (error) {
    console.error('Upload failed:', error)
    alert('上传失败：' + error.message)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-background);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
}

.upload-content {
  padding: 1.5rem;
}

.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  background: var(--color-background-mute);
}

.drop-zone.dragover {
  border-color: var(--color-border-hover);
  background: var(--color-background);
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #FFB6C1, #98D8C8);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.upload-icon svg {
  width: 32px;
  height: 32px;
}

.drop-zone h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.drop-zone p {
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  opacity: 0.8;
}

.file-input {
  display: none;
}

.select-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #FFB6C1, #98D8C8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.4);
}

.file-list {
  margin-top: 1.5rem;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.file-list-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.clear-btn {
  padding: 0.25rem 0.75rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.75rem;
  cursor: pointer;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.file-item {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.file-preview {
  position: relative;
  aspect-ratio: 1;
  background: var(--color-background-mute);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text);
  opacity: 0.5;
}

.preview-placeholder svg {
  width: 24px;
  height: 24px;
}

.remove-file-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
}

.file-info {
  padding: 0.5rem;
}

.file-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-heading);
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.625rem;
  color: var(--color-text);
  margin: 0;
  opacity: 0.7;
}

.upload-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
}

.btn-primary {
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  color: #374151;
  box-shadow: 0 2px 8px rgba(254, 243, 199, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(254, 243, 199, 0.6);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    max-width: none;
  }
  
  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .upload-actions {
    flex-direction: column;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
  }
}
</style> 