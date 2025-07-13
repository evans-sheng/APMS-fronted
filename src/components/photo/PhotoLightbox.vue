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
      <div class="photo-display" :class="{ 'fullscreen': isFullscreen }">
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
      <div v-if="photo && !isFullscreen" class="photo-info">
        <div class="info-header">
          <h3 class="photo-title">{{ photo.fileName }}</h3>
          <div class="photo-counter" v-if="photos.length > 1">
            {{ currentIndex + 1 }} / {{ photos.length }}
          </div>
        </div>
        
        <div class="info-details">
          <div class="detail-item">
            <span class="label">上传时间：</span>
            <span>{{ formatDate(photo.createdAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">文件大小：</span>
            <span>{{ formatFileSize(photo.size) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">原始文件名：</span>
            <span>{{ photo.originalName || photo.name }}</span>
          </div>
        </div>
        
        <!-- 标签 -->
        <div v-if="photo.tags && photo.tags.length > 0" class="photo-tags">
          <span 
            v-for="tag in photo.tags" 
            :key="tag" 
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { FileApiService } from '@/services/api'
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

const emit = defineEmits(['close', 'previous', 'next'])

const imageLoaded = ref(false)
const imageError = ref(false)
const isFullscreen = ref(false)
const showShortcuts = ref(true)

// 计算属性
const originalUrl = computed(() => {
  return FileApiService.getOriginalUrl(props.photo.id)
})

const currentIndex = computed(() => {
  return props.photos.findIndex(p => p.id === props.photo.id)
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

// 键盘事件处理
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      if (isFullscreen.value) {
        isFullscreen.value = false
      } else {
        emit('close')
      }
      break
    case 'Enter':
      if (!isFullscreen.value) {
        isFullscreen.value = true
      }
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (props.photos.length > 1) {
        emit('previous')
      }
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (props.photos.length > 1) {
        emit('next')
      }
      break
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // 6秒后隐藏快捷键提示
  setTimeout(() => {
    showShortcuts.value = false
  }, 6000)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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

.photo-counter {
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.7;
}

.info-details {
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.detail-item .label {
  color: var(--color-text);
  opacity: 0.7;
  min-width: 80px;
}

.detail-item span:last-child {
  color: var(--color-heading);
}

/* 标签 */
.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
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
  }
  
  .info-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .shortcuts-hint {
    bottom: 1rem;
    right: 1rem;
    font-size: 0.7rem;
    padding: 0.75rem;
  }
}
</style> 