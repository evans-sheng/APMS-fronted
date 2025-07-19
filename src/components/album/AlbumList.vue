<template>
  <div class="album-list">
    <!-- 标题和操作栏 -->
    <div class="album-header">
      <div class="album-title">
        <h2>我的相册</h2>
        <span class="album-count">{{ displayedAlbumCount }} 个相册</span>
      </div>
      <div class="album-controls">
        <label class="favorite-filter">
          <input 
            type="checkbox" 
            v-model="albumStore.showFavoritesOnly" 
            @change="handleFavoriteFilterChange"
          />
          <span class="checkbox-label">仅显示收藏</span>
        </label>
        <button @click="showCreateForm = true" class="create-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          创建相册
        </button>
      </div>
    </div>

    <!-- 标签筛选 -->
    <AlbumTagFilter />

    <!-- 加载状态 -->
    <Loading v-if="loading" text="加载相册中..." />

    <!-- 相册网格 -->
    <div v-else-if="displayedAlbums.length > 0" class="album-grid">
      <AlbumCard 
        v-for="album in displayedAlbums" 
        :key="album.id" 
        :album="album"
        @click="selectAlbum(album)"
        @delete="deleteAlbum(album)"
        @favorite="handleAlbumFavorite(album.id)"
      />
    </div>

    <!-- 空状态 -->
    <EmptyState 
      v-else-if="selectedTags.length === 0"
      title="还没有相册"
      description="创建您的第一个相册，开始记录美好时光"
      icon="album"
      @action="showCreateForm = true"
      action-text="创建相册"
    />

    <!-- 筛选无结果状态 -->
    <EmptyState 
      v-else
      title="没有找到匹配的相册"
      description="尝试调整筛选条件或清除所有筛选"
      icon="search"
      @action="clearFilters"
      action-text="清除筛选"
    />

    <!-- 创建相册表单 -->
    <AlbumForm 
      v-if="showCreateForm"
      @close="showCreateForm = false"
      @created="handleAlbumCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlbumStore } from '@/stores/album'
import { AlbumApiService } from '@/services/api'
import AlbumCard from './AlbumCard.vue'
import AlbumForm from './AlbumForm.vue'
import AlbumTagFilter from './AlbumTagFilter.vue'
import Loading from '../layout/Loading.vue'
import EmptyState from '../common/EmptyState.vue'

const router = useRouter()
const albumStore = useAlbumStore()

const showCreateForm = ref(false)

// 计算属性
const displayedAlbums = computed(() => albumStore.filteredAlbums)
const displayedAlbumCount = computed(() => albumStore.filteredAlbumCount)
const selectedTags = computed(() => albumStore.selectedTags)
const loading = computed(() => albumStore.loading)

// 方法
const loadAlbums = async () => {
  try {
    albumStore.setLoading(true)
    albumStore.clearError()
    
    const response = await AlbumApiService.getAlbums()
    // 从API响应中正确提取相册列表
    const albumList = response.data?.list || []
    // 新增：为每个没有封面图片的相册请求第一张图片
    const albumsWithFirstPhoto = await Promise.all(albumList.map(async (album) => {
      // 兼容不同字段名
      const coverId = album.coverPhoto || album.coverPhotoId || album.coverImageId
      if (!coverId && album.photoCount > 0) {
        // 获取第一张图片
        try {
          const photosResp = await AlbumApiService.getAlbumPhotos(album.id, { page: 1, limit: 1, sortBy: 'created_at', sortOrder: 'asc' })
          const firstPhoto = photosResp.data?.photos?.[0] || photosResp.data?.list?.[0]
          if (firstPhoto && firstPhoto.id) {
            return { ...album, firstPhotoId: firstPhoto.id }
          }
        } catch (e) {
          // 忽略单个相册失败
        }
      }
      return album
    }))
    console.log('albumsWithFirstPhoto', albumsWithFirstPhoto)
    albumStore.setAlbums(albumsWithFirstPhoto)
    console.log('albumStore.albums', albumStore.albums)
  } catch (error) {
    albumStore.setError('加载相册失败：' + error.message)
    console.error('Failed to load albums:', error)
  } finally {
    albumStore.setLoading(false)
  }
}

const selectAlbum = (album) => {
  albumStore.setCurrentAlbum(album)
  router.push(`/album/${album.id}`)
}

const deleteAlbum = async (album) => {
  if (confirm(`确定要删除相册"${album.name}"吗？此操作不可恢复。`)) {
    try {
      await AlbumApiService.deleteAlbum(album.id)
      albumStore.removeAlbum(album.id)
    } catch (error) {
      albumStore.setError('删除相册失败：' + error.message)
      console.error('Failed to delete album:', error)
    }
  }
}

const handleAlbumCreated = (newAlbum) => {
  albumStore.addAlbum(newAlbum)
  showCreateForm.value = false
}

const clearFilters = () => {
  albumStore.clearSelectedTags()
}

const handleFavoriteFilterChange = () => {
  // 收藏过滤状态已通过v-model自动更新
}

const handleAlbumFavorite = (albumId) => {
  albumStore.toggleAlbumFavorite(albumId)
}

// 生命周期
onMounted(() => {
  loadAlbums()
})
</script>

<style scoped>
.album-list {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.album-title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
}

.album-title h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.album-count {
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.7;
}

.album-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.favorite-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.favorite-filter input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--color-text);
  user-select: none;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  color: #374151;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(254, 243, 199, 0.4);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(254, 243, 199, 0.6);
}

.create-btn svg {
  width: 18px;
  height: 18px;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .album-list {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .album-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .album-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .album-grid {
    grid-template-columns: 1fr;
  }
}
</style> 