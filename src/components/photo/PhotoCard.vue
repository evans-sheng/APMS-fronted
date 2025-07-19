<template>
  <div class="photo-card" @click="$emit('click')" :data-photo-id="photo.id">
    <!-- 照片缩略图 -->
    <div class="photo-thumbnail">
      <img 
        :src="thumbnailUrl" 
        :alt="photo.fileName"
        class="thumbnail-image"
        @load="imageLoaded = true"
        @error="imageError = true"
      />
      
      <!-- 加载状态 -->
      <div v-if="!imageLoaded && !imageError" class="loading-placeholder">
        <div class="loading-spinner"></div>
      </div>
      
      <!-- 错误状态 -->
      <div v-if="imageError" class="error-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </div>
      
      <!-- 操作按钮 -->
      <div class="photo-actions">
        <button 
          @click.stop="$emit('favorite')" 
          class="action-btn favorite-btn"
          :class="{ active: photo.isFavorite }"
          title="收藏"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button 
          @click.stop="$emit('delete')" 
          class="action-btn delete-btn"
          title="删除"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 照片信息 -->
    <div class="photo-info">
      <div class="photo-meta">
        <span class="photo-date">{{ formatDate(photo.createdAt) }}</span>
        <span class="photo-size">{{ formatFileSize(photo.size) }}</span>
      </div>
      
      <!-- 标签 -->
      <div v-if="tagsWithColors.length > 0" class="photo-tags">
        <span 
          v-for="tag in tagsWithColors.slice(0, 2)" 
          :key="tag.name" 
          class="tag"
          :style="{ color: tag.color }"
        >
          {{ tag.name }}
        </span>
        <span v-if="tagsWithColors.length > 2" class="tag more">
          +{{ tagsWithColors.length - 2 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FileApiService } from '@/services/api'
import { useTagStore } from '@/stores/tag'

const props = defineProps({
  photo: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'favorite', 'delete'])

const imageLoaded = ref(false)
const imageError = ref(false)

// Store 实例
const tagStore = useTagStore()

// 计算属性
const thumbnailUrl = computed(() => {
  return FileApiService.getThumbnailUrl(props.photo.id)
})

const tagsWithColors = computed(() => {
  if (!props.photo.tags || props.photo.tags.length === 0) {
    return []
  }
  return props.photo.tags.map(tagName => {
    const tagObj = tagStore.tags?.find(tag => tag.name === tagName)
    return tagObj || { name: tagName, color: '#FEF3C7' } // 默认颜色
  })
})

// 方法
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
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
.photo-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--color-border-hover);
}

/* 缩略图区域 */
.photo-thumbnail {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-background-mute);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover .thumbnail-image {
  transform: scale(1.05);
}

/* 加载状态 */
.loading-placeholder {
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

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-heading);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-mute);
  color: var(--color-text);
  opacity: 0.5;
}

.error-placeholder svg {
  width: 32px;
  height: 32px;
}

/* 操作按钮 */
.photo-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-card:hover .photo-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.action-btn:hover {
  background: white;
  transform: scale(1.1);
}

.favorite-btn.active {
  color: #FF6B6B;
}

.delete-btn:hover {
  color: #F44336;
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

/* 信息区域 */
.photo-info {
  padding: 0.75rem;
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.photo-date,
.photo-size {
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.7;
}

/* 标签 */
.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  padding: 0.125rem 0.375rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 6px;
  font-size: 0.625rem;
  font-weight: 500;
}

.tag.more {
  background: var(--color-border);
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .photo-actions {
    opacity: 1;
  }
  
  .photo-info {
    padding: 0.5rem;
  }
}
</style> 