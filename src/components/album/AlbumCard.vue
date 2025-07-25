<template>
  <div class="album-card" @click="$emit('click')">
    <!-- 封面图片 -->
    <div class="album-cover">
      <img 
        v-if="coverImageUrl" 
        :src="coverImageUrl" 
        :alt="album.name"
        class="cover-image"
      />
      <div v-else class="cover-placeholder">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
        </svg>
      </div>
      
      <!-- 操作按钮 -->
      <div class="album-actions">
        <button 
          @click.stop="$emit('favorite')" 
          class="action-btn favorite-btn"
          :class="{ active: album.isFavored }"
          title="收藏相册"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <button 
          @click.stop="$emit('delete')" 
          class="action-btn delete-btn"
          title="删除相册"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 相册信息 -->
    <div class="album-info">
      <h3 class="album-name">{{ album.name }}</h3>
      <p v-if="album.description" class="album-description">{{ album.description }}</p>
      
      <div class="album-meta">
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>{{ album.photoCount || 0 }} 张照片</span>
        </div>
        <div class="meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          <span>{{ formatDate(album.updatedAt) }}</span>
        </div>
      </div>

      <!-- 标签 -->
      <div v-if="tagsWithColors.length > 0" class="album-tags">
        <span 
          v-for="tag in tagsWithColors.slice(0, 3)" 
          :key="tag.name" 
          class="tag"
          :style="{ color: tag.color }"
        >
          {{ tag.name }}
        </span>
        <span v-if="tagsWithColors.length > 3" class="tag more">
          +{{ tagsWithColors.length - 3 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { FileApiService, TagApiService } from '@/services/api'
import { useTagStore } from '@/stores/tag'

const props = defineProps({
  album: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'delete', 'favorite'])

const tagStore = useTagStore()

// 计算属性
const coverImageUrl = computed(() => {
  // 兼容不同字段名 - 优先使用coverPhotoId
  const coverId = props.album.coverPhotoId || props.album.coverImageId || props.album.coverPhoto
  if (coverId) {
    return FileApiService.getOriginalUrl(coverId)
  }
  if (props.album.firstPhotoId) {
    return FileApiService.getOriginalUrl(props.album.firstPhotoId)
  }
  return null
})

// 计算带颜色的标签对象
const tagsWithColors = computed(() => {
  if (!props.album.tags || props.album.tags.length === 0) {
    return []
  }
  
  return props.album.tags.map(tagName => {
    const tagObj = tagStore.getTagByName(tagName)
    return tagObj || { name: tagName, color: '#FEF3C7' } // 默认颜色
  })
})

// 加载标签数据
const loadTags = async () => {
  if (tagStore.tags.length === 0) {
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
}

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

// 生命周期
onMounted(() => {
  loadTags()
})
</script>

<style scoped>
.album-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--color-border-hover);
}

/* 封面区域 */
.album-cover {
  position: relative;
  height: 260px;
  overflow: hidden;
  background: linear-gradient(135deg, #FFB6C1, #98D8C8);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-card:hover .cover-image {
  transform: scale(1.05);
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.8);
}

.cover-placeholder svg {
  width: 48px;
  height: 48px;
}

/* 操作按钮 */
.album-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.album-card:hover .album-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
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

.delete-btn:hover {
  color: #F44336;
}

.favorite-btn {
  color: #666;
}

.favorite-btn:hover {
  color: #E91E63;
}

.favorite-btn.active {
  color: #E91E63;
}

.favorite-btn.active:hover {
  color: #C2185B;
}

.action-btn svg {
  width: 16px;
  height: 16px;
}

/* 信息区域 */
.album-info {
  padding: 1rem;
}

.album-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.album-description {
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 元数据 */
.album-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.7;
}

.meta-item svg {
  width: 14px;
  height: 14px;
}

/* 标签 */
.album-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(55, 65, 81, 0.8); /* 深色文字确保在浅色背景上可读 */
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag.more {
  background: var(--color-border) !important;
  color: var(--color-text) !important;
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .album-cover {
    height: 200px;
  }
  
  .album-info {
    padding: 0.75rem;
  }
  
  .album-actions {
    opacity: 1;
  }
}
</style> 