<template>
  <div class="lightbox-overlay" :class="{ 'fullscreen-mode': isFullscreen }" @click="isFullscreen ? null : $emit('close')">
    <div class="lightbox-content" :class="{ 'fullscreen-mode': isFullscreen }" @click.stop>
      <!-- 关闭按钮 -->
      <button v-if="!isFullscreen" @click="$emit('close')" class="close-btn">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

      <!-- 照片显示区域 -->
      <div class="photo-display" :class="{ 'fullscreen': isFullscreen, 'editing-mode': isEditing }">
        <!-- 导航按钮 -->
        <button 
          v-if="photos.length > 1"
          @click="$emit('previous')" 
          class="nav-btn prev-btn"
          title="上一张 (A键或←键)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>

        <button 
          v-if="photos.length > 1"
          @click="$emit('next')" 
          class="nav-btn next-btn"
          title="下一张 (D键或→键)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
        <img 
          v-if="photo" 
          :src="originalUrl" 
          :alt="photo.fileName"
          class="display-image"
          :title="isFullscreen ? '双击或按ESC键退出全屏' : '双击或按Enter键进入全屏'"
          @load="imageLoaded = true"
          @error="imageError = true"
          @dblclick="toggleFullscreen"
        />
        
        <!-- 全屏提示 -->
        <div v-if="isFullscreen" class="fullscreen-hint">
          双击图片或按ESC键退出全屏
        </div>
        
        <!-- 快捷键提示 -->
        <div v-if="!isFullscreen && showShortcuts" class="shortcuts-hint">
          <div class="shortcuts-content">
            <div class="shortcut-item">Enter: 进入全屏</div>
            <div class="shortcut-item">ESC: 退出</div>
            <div class="shortcut-item">←→ 或 A/D: 切换图片</div>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="!imageLoaded && !imageError" class="loading-overlay">
          <Loading text="加载中..." />
        </div>
        
        <!-- 错误状态 -->
        <div v-if="imageError" class="error-overlay">
          <div class="error-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <p>图片加载失败</p>
          </div>
        </div>
      </div>

      <!-- 照片信息 -->
      <div v-if="photo && !isFullscreen" class="photo-info" :class="{ 'editing-mode': isEditing }">
        <div class="info-header">
          <h3 class="photo-title">{{ photo.fileName }}</h3>
          <div class="header-actions" v-if="!isEditing">
            <div class="photo-counter" v-if="photos.length > 1">
              {{ currentIndex + 1 }} / {{ photos.length }}
            </div>
            <!-- 相册名称显示 -->
            <div v-if="photo.albumId" class="album-info-section">
              <button 
                @click="goToAlbum" 
                class="album-link"
                :title="'跳转到相册：' + (albumInfo?.name || '加载中...')"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
                </svg>
                <span v-if="loadingAlbum">加载中...</span>
                <span v-else-if="albumInfo">{{ albumInfo.name }}</span>
                <span v-else>未知相册</span>
              </button>
            </div>
            <button 
              @click="toggleEditMode" 
              class="edit-btn"
              :class="{ 'active': isEditing }"
              :title="isEditing ? '取消编辑' : '编辑信息'"
            >
              <svg v-if="!isEditing" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="info-details">
          <!-- 第一行：上传时间、文件大小、原始文件名 -->
          <div class="detail-row">
            <div v-if="!isEditing" class="detail-item">
              <span class="label">上传时间：</span>
              <span>{{ formatDate(photo.createdAt) }}</span>
            </div>
            <div v-if="!isEditing" class="detail-item">
              <span class="label">文件大小：</span>
              <span>{{ formatFileSize(photo.size) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">原始文件名：</span>
              <input 
                v-if="isEditing"
                v-model="editForm.originalName"
                type="text"
                class="edit-input"
                placeholder="输入原始文件名"
              />
              <span v-else>{{ photo.originalName || photo.name }}</span>
            </div>
          </div>
          
          <!-- 第二行：描述 -->
          <div class="detail-item description-item">
            <span class="label">描述：</span>
            <textarea 
              v-if="isEditing"
              v-model="editForm.description"
              class="edit-textarea"
              placeholder="输入描述信息"
              rows="1"
            ></textarea>
            <span v-else>{{ photo.description || '暂无描述' }}</span>
          </div>
        </div>
        
        <!-- 标签 -->
        <div class="tags-section">
          <div class="tags-row">
            <span class="label">标签：</span>
            <div v-if="isEditing" class="tag-editor">
              <div class="tag-selector">
                <div class="tag-dropdown" :class="{ 'active': showTagDropdown }">
                  <div class="dropdown-trigger" @click="toggleTagDropdown">
                    <span v-if="editForm.tags.length === 0" class="placeholder">选择标签</span>
                    <span v-else class="selected-count">已选择 {{ editForm.tags.length }} 个标签</span>
                    <svg class="dropdown-arrow" :class="{ 'rotated': showTagDropdown }" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                  </div>
                  <div v-if="showTagDropdown" class="dropdown-menu">
                    <div v-if="tagStore.loading" class="dropdown-loading">
                      加载标签中...
                    </div>
                    <div v-else-if="availableTags.length === 0" class="dropdown-empty">
                      暂无可用标签
                    </div>
                    <div v-else class="dropdown-options">
                      <label 
                        v-for="tag in availableTags" 
                        :key="tag.id"
                        class="dropdown-option"
                      >
                        <input 
                          type="checkbox" 
                          :value="tag.name"
                          :checked="editForm.tags.includes(tag.name)"
                          @change="toggleTag(tag.name)"
                        />
                        <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                        <span class="tag-name">{{ tag.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 已选择的标签 -->
              <div v-if="editForm.tags.length > 0" class="selected-tags">
                <span 
                  v-for="tag in selectedTags" 
                  :key="tag.name" 
                  class="tag editable"
                >
                  <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                  <span class="tag-name">{{ tag.name }}</span>
                  <button 
                    type="button" 
                    @click="removeTag(tag.name)"
                    class="tag-remove"
                  >
                    ×
                  </button>
                </span>
              </div>
            </div>
            
            <!-- 查看模式下的标签显示 -->
            <div v-else class="photo-tags">
              <span 
                v-for="tag in photoTags" 
                :key="tag.name" 
                class="tag"
              >
                <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                <span class="tag-name">{{ tag.name }}</span>
              </span>
              <span v-if="!photo.tags || photo.tags.length === 0" class="no-tags">暂无标签</span>
            </div>
          </div>
        </div>
        
        <!-- 编辑模式下的操作按钮 -->
        <div v-if="isEditing" class="edit-actions">
          <button @click="cancelEdit" class="btn-secondary">
            取消
          </button>
          <button @click="saveEdit" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileApiService, TagApiService, AlbumApiService } from '@/services/api'
import { useTagStore } from '@/stores/tag'
import { usePhotoStore } from '@/stores/photo'
import Loading from '../layout/Loading.vue'

const props = defineProps({
  photo: {
    type: Object,
    required: true
  },
  photos: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'previous', 'next', 'updated'])

const router = useRouter()
const imageLoaded = ref(false)
const imageError = ref(false)
const isFullscreen = ref(false)
const showShortcuts = ref(true)
const isEditing = ref(false)
const showTagDropdown = ref(false)
const saving = ref(false)
const albumInfo = ref(null)
const loadingAlbum = ref(false)

// 编辑表单
const editForm = reactive({
  originalName: '',
  description: '',
  tags: []
})

// Store 实例
const tagStore = useTagStore()
const photoStore = usePhotoStore()

// 计算属性
const originalUrl = computed(() => {
  return FileApiService.getOriginalUrl(props.photo.id)
})

const currentIndex = computed(() => {
  return props.photos.findIndex(p => p.id === props.photo.id)
})

const availableTags = computed(() => {
  return tagStore.tags || []
})

const selectedTags = computed(() => {
  return editForm.tags.map(tagName => {
    const tagObj = availableTags.value.find(tag => tag.name === tagName)
    return tagObj || { name: tagName, color: '#9CA3AF' }
  })
})

const photoTags = computed(() => {
  if (!props.photo.tags || props.photo.tags.length === 0) {
    return []
  }
  return props.photo.tags.map(tagName => {
    const tagObj = availableTags.value.find(tag => tag.name === tagName)
    return tagObj || { name: tagName, color: '#9CA3AF' }
  })
})

// 方法
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const toggleEditMode = () => {
  if (isEditing.value) {
    cancelEdit()
  } else {
    startEdit()
  }
}

const startEdit = () => {
  isEditing.value = true
  editForm.originalName = props.photo.originalName || props.photo.name || ''
  editForm.description = props.photo.description || ''
  editForm.tags = [...(props.photo.tags || [])]
  
  // 加载标签数据
  if (availableTags.value.length === 0) {
    loadTags()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  showTagDropdown.value = false
  editForm.originalName = ''
  editForm.description = ''
  editForm.tags = []
}

const saveEdit = async () => {
  if (saving.value) return
  
  try {
    saving.value = true
    
    const updates = {
      name: editForm.originalName.trim() || props.photo.fileName,
      description: editForm.description.trim(),
      tags: editForm.tags
    }
    
    const response = await FileApiService.updateFile(props.photo.id, updates)
    
    if (response.success) {
      // 更新本地状态
      const updatedPhoto = {
        ...props.photo,
        originalName: updates.name,
        name: updates.name,
        description: updates.description,
        tags: updates.tags
      }
      
      // 更新 photoStore 中的照片信息
      photoStore.updatePhoto(props.photo.id, updatedPhoto)
      
      // 通知父组件照片已更新
      emit('updated', updatedPhoto)
      
      // 退出编辑模式
      isEditing.value = false
      showTagDropdown.value = false
    } else {
      throw new Error(response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存照片信息失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

const toggleTagDropdown = () => {
  showTagDropdown.value = !showTagDropdown.value
}

const toggleTag = (tagName) => {
  const index = editForm.tags.indexOf(tagName)
  if (index > -1) {
    editForm.tags.splice(index, 1)
  } else {
    editForm.tags.push(tagName)
  }
}

const removeTag = (tagName) => {
  const index = editForm.tags.indexOf(tagName)
  if (index > -1) {
    editForm.tags.splice(index, 1)
  }
}

const loadTags = async () => {
  try {
    tagStore.setLoading(true)
    const response = await TagApiService.getAllTags()
    if (response.success) {
      tagStore.setTags(response.data)
    }
  } catch (error) {
    tagStore.setError(error.message)
  } finally {
    tagStore.setLoading(false)
  }
}

// 加载相册信息
const loadAlbumInfo = async (albumId) => {
  if (!albumId) return
  
  try {
    loadingAlbum.value = true
    const response = await AlbumApiService.getAlbum(albumId)
    albumInfo.value = response.data || response
  } catch (error) {
    console.error('加载相册信息失败:', error)
    albumInfo.value = null
  } finally {
    loadingAlbum.value = false
  }
}

// 跳转到相册详情页并定位到当前图片
const goToAlbum = () => {
  if (!props.photo.albumId) return
  
  // 构建路由，添加查询参数来定位到当前图片
  router.push({
    name: 'AlbumDetail',
    params: { id: props.photo.albumId },
    query: { photoId: props.photo.id }
  })
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.tag-dropdown')) {
    showTagDropdown.value = false
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      if (isEditing.value) {
        cancelEdit()
      } else if (isFullscreen.value) {
        isFullscreen.value = false
      } else {
        emit('close')
      }
      break
    case 'Enter':
      if (!isFullscreen.value && !isEditing.value) {
        isFullscreen.value = true
      }
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (props.photos.length > 1 && !isEditing.value) {
        emit('previous')
      }
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (props.photos.length > 1 && !isEditing.value) {
        emit('next')
      }
      break
  }
}

// 监听照片变化，重置编辑状态并加载相册信息
watch(() => props.photo.id, () => {
  if (isEditing.value) {
    cancelEdit()
  }
  imageLoaded.value = false
  imageError.value = false
  
  // 加载相册信息
  if (props.photo.albumId) {
    loadAlbumInfo(props.photo.albumId)
  } else {
    albumInfo.value = null
  }
})

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
  
  // 6秒后隐藏快捷键提示
  setTimeout(() => {
    showShortcuts.value = false
  }, 6000)
  
  // 加载相册信息
  if (props.photo.albumId) {
    loadAlbumInfo(props.photo.albumId)
  }
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--color-background);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

/* 全屏状态下的特殊处理 */
.lightbox-overlay.fullscreen-mode {
  padding: 0 !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}

.lightbox-content.fullscreen-mode {
  position: static !important;
  max-width: none !important;
  max-height: none !important;
  background: transparent !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
  width: 100vw !important;
  height: 100vh !important;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.close-btn:hover {
  background: white;
  transform: scale(1.1);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

/* 导航按钮 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.95);
  color: #374151;
  border-radius: 50%;
  cursor: pointer;
  z-index: 15;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* 鼠标悬停在照片显示区域时显示导航按钮 */
.photo-display:hover .nav-btn {
  opacity: 1;
  pointer-events: auto;
}

.nav-btn:hover {
  background: white;
  border-color: white;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.prev-btn {
  left: 1rem;
}

.next-btn {
  right: 1rem;
}

/* 全屏状态样式 */
.photo-display.fullscreen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: none !important;
  max-height: none !important;
  z-index: 9999 !important;
  background: rgba(0, 0, 0, 0.95) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: zoom-out !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.photo-display.fullscreen .display-image {
  max-width: 95vw !important;
  max-height: 95vh !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  cursor: zoom-out !important;
}

/* 全屏状态下隐藏导航按钮 */
.photo-display.fullscreen .nav-btn {
  display: none;
}

/* 全屏提示 */
.fullscreen-hint {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  z-index: 10000;
  animation: fadeInOut 4s ease-in-out;
  pointer-events: none;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; }
}

/* 快捷键提示 */
.shortcuts-hint {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  z-index: 10000;
  backdrop-filter: blur(4px);
  animation: fadeInOut 6s ease-in-out;
  pointer-events: none;
}

.shortcuts-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.shortcut-item {
  opacity: 0.9;
}

.nav-btn svg {
  width: 24px;
  height: 24px;
}

/* 照片显示区域 */
.photo-display {
  position: relative;
  max-height: 70vh;
  overflow: hidden;
}

.photo-display.editing-mode {
  max-height: 60vh;
}

.display-image {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  cursor: zoom-in;
}

/* 加载和错误状态 */
.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-mute);
}

.error-content {
  text-align: center;
  color: var(--color-text);
}

.error-content svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.error-content p {
  margin: 0;
  font-size: 0.875rem;
}

/* 照片信息 */
.photo-info {
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
  max-height: 40vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.photo-info.editing-mode {
  max-height: 50vh;
  padding: 0.75rem;
}

.photo-info.editing-mode .info-header {
  margin-bottom: 0.5rem;
}

.photo-info.editing-mode .info-details {
  margin-bottom: 0.5rem;
}

.photo-info.editing-mode .tags-section {
  margin-bottom: 0.5rem;
}

.photo-info.editing-mode .edit-actions {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.photo-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.photo-counter {
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.7;
}

.edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

.edit-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.edit-btn svg {
  width: 16px;
  height: 16px;
}

/* 相册信息区域 */
.album-info-section {
  display: flex;
  align-items: center;
}

.album-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
}

.album-link:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
  color: var(--color-primary);
}

.album-link svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.album-link:hover svg {
  opacity: 1;
}

.info-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  font-size: 0.875rem;
  flex: 1;
  min-width: 0;
}

.detail-item .label {
  color: var(--color-text);
  opacity: 0.7;
  min-width: 60px;
  flex-shrink: 0;
}

.detail-item span:last-child {
  color: var(--color-heading);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description-item {
  margin-top: 0.5rem;
}

.description-item span:last-child {
  white-space: normal;
}

/* 编辑输入框 */
.edit-input {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.edit-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.edit-textarea {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* 标签区域 */
.tags-section {
  margin-bottom: 1rem;
}

.tags-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.tags-row .label {
  color: var(--color-text);
  opacity: 0.7;
  flex-shrink: 0;
  line-height: 1.5;
  padding-top: 0.125rem;
}

.tags-row .tag-editor,
.tags-row .photo-tags {
  flex: 1;
  min-width: 0;
}

.tag-editor {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag-selector {
  position: relative;
  width: 100%;
  margin-bottom: 0.75rem;
}

.tag-dropdown {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.tag-dropdown.active {
  border-color: var(--color-primary);
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
}

.placeholder {
  color: var(--color-text-mute);
}

.selected-count {
  color: var(--color-text);
  font-size: 0.875rem;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 150px;
  overflow-y: auto;
  margin-top: 0.25rem;
}

.dropdown-loading,
.dropdown-empty {
  padding: 0.75rem 1rem;
  text-align: center;
  color: var(--color-text-mute);
  font-size: 0.875rem;
}

.dropdown-options {
  padding: 0.25rem 0;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-option:hover {
  background: var(--color-background-mute);
}

.dropdown-option input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--color-primary);
}

.tag-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tag-name {
  flex-grow: 1;
  font-size: 0.875rem;
  color: var(--color-text);
}

/* 标签显示 */
.photo-tags,
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.tag.editable:hover {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.tag .tag-color {
  width: 8px;
  height: 8px;
}

.tag .tag-name {
  font-size: 0.75rem;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  background: none;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 50%;
  font-size: 10px;
  transition: all 0.2s ease;
  margin-left: 0.125rem;
}

.tag-remove:hover {
  background: var(--color-border);
}

.no-tags {
  color: var(--color-text-mute);
  font-size: 0.875rem;
  font-style: italic;
}

/* 编辑操作按钮 */
.edit-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}

.btn-secondary,
.btn-primary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
}

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-text);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .lightbox-overlay {
    padding: 1rem;
  }
  
  .lightbox-content {
    max-width: 95vw;
    max-height: 95vh;
  }
  
  .nav-btn {
    width: 40px;
    height: 40px;
  }
  
  .nav-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .photo-info {
    padding: 1rem;
    max-height: 50vh;
  }
  
  .photo-info.editing-mode {
    max-height: 60vh;
    padding: 0.5rem;
  }
  
  .photo-info.editing-mode .info-header {
    margin-bottom: 0.375rem;
  }
  
  .photo-info.editing-mode .info-details {
    margin-bottom: 0.375rem;
  }
  
  .photo-info.editing-mode .tags-section {
    margin-bottom: 0.375rem;
  }
  
  .photo-info.editing-mode .edit-actions {
    margin-top: 0.375rem;
    padding-top: 0.375rem;
  }
  
  .photo-display.editing-mode {
    max-height: 50vh;
  }
  
  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .album-link {
    font-size: 0.8rem;
    padding: 0.375rem 0.5rem;
  }
  
  .album-link svg {
    width: 12px;
    height: 12px;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .detail-item .label {
    min-width: 70px;
  }
  
  .shortcuts-hint {
    bottom: 1rem;
    right: 1rem;
    font-size: 0.7rem;
    padding: 0.75rem;
  }
  
  .edit-actions {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    gap: 0.5rem;
  }
  
  .btn-secondary,
  .btn-primary {
    flex: 1;
  }

  .tags-row {
    flex-direction: column;
    gap: 0.25rem;
  }

  .tags-row .label {
    padding-top: 0;
  }

  .tag-editor {
    margin-bottom: 0.25rem;
  }

  .dropdown-menu {
    max-height: 120px;
  }
}

/* 自定义滚动条样式 */
.photo-info::-webkit-scrollbar {
  width: 6px;
}

.photo-info::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 3px;
}

.photo-info::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.photo-info::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
</style> 