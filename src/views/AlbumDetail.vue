<template>
  <div class="album-detail">
    <!-- 加载状态 -->
    <Loading v-if="loading" text="加载相册中..." />
    
    <!-- 相册内容 -->
    <div v-else-if="album" class="album-content">
      <!-- 相册头部 -->
      <div class="album-header">
        <div class="album-info">
          <h1 class="album-title">{{ album.name }}</h1>
          <p v-if="album.description" class="album-description">{{ album.description }}</p>
          <div class="album-meta">
            <span class="meta-item">{{ photoCount }} 张照片</span>
            <span class="meta-item">创建于 {{ formatDate(album.createdAt) }}</span>
          </div>
        </div>
        
        <div class="album-actions">
          <button @click="showUploadForm = true" class="action-btn primary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            上传照片
          </button>
          <button @click="editAlbum" class="action-btn secondary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            编辑相册
          </button>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filters-section">
        <div class="filter-group">
          <div class="tag-filter">
            <div class="tag-input-container">
              <input 
                type="text" 
                placeholder="输入标签名称搜索..." 
                class="tag-search-input"
                v-model="tagSearchQuery"
                @focus="showTagDropdown = true"
                @blur="handleTagInputBlur"
              />
              <div v-if="showTagDropdown && filteredAvailableTags.length > 0" class="tag-dropdown">
                <div 
                  v-for="tag in filteredAvailableTags" 
                  :key="tag.id"
                  class="tag-option"
                  @mousedown="selectTag(tag)"
                >
                  <span class="tag-name">{{ tag.name }}</span>
                  <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                </div>
              </div>
            </div>
            <div v-if="selectedTags.length > 0" class="selected-tags">
              <span 
                v-for="tag in selectedTags" 
                :key="tag.id"
                class="selected-tag"
                :style="{ backgroundColor: tag.color }"
              >
                {{ tag.name }}
                <button @click="removeTag(tag)" class="remove-tag-btn">×</button>
              </span>
            </div>
          </div>
          <label class="favorites-filter">
            <input 
              type="checkbox" 
              v-model="showFavoritesOnly"
              @change="handleFavoritesFilter"
            />
            <span class="checkbox-label">收藏</span>
          </label>
        </div>
      </div>

      <!-- 照片网格 -->
      <div v-if="photos.length > 0" class="photos-section">
        <PhotoGrid 
          :photos="photos"
          @photo-click="openLightbox"
          @photo-deleted="handlePhotoDeleted"
          @photo-favorite="handlePhotoFavorite"
        />
      </div>
      
      <!-- 空状态 -->
      <EmptyState 
        v-else 
        title="相册还是空的"
        description="上传第一张照片，开始记录美好时光"
        icon="photo"
        @action="showUploadForm = true"
        action-text="上传照片"
      />
    </div>
    
    <!-- 错误状态 -->
    <EmptyState 
      v-else 
      title="相册不存在"
      description="您访问的相册可能已被删除或不存在"
      icon="default"
      @action="$router.push('/albums')"
      action-text="返回相册列表"
    />

    <!-- 灯箱 -->
    <PhotoLightbox 
      v-if="showLightbox"
      :photo="currentPhoto"
      :photos="photos"
      @close="closeLightbox"
      @previous="previousPhoto"
      @next="nextPhoto"
    />

    <!-- 上传表单 -->
    <PhotoUpload 
      v-if="showUploadForm"
      :album-id="albumId"
      @close="showUploadForm = false"
      @uploaded="handlePhotoUploaded"
    />

    <!-- 编辑相册表单 -->
    <AlbumForm 
      v-if="showEditForm"
      :editing-album="album"
      @close="showEditForm = false"
      @updated="handleAlbumUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlbumStore } from '@/stores/album'
import { usePhotoStore } from '@/stores/photo'
import { AlbumApiService } from '@/services/api'
import PhotoGrid from '@/components/photo/PhotoGrid.vue'
import PhotoLightbox from '@/components/photo/PhotoLightbox.vue'
import PhotoUpload from '@/components/photo/PhotoUpload.vue'
import AlbumForm from '@/components/album/AlbumForm.vue'
import Loading from '@/components/layout/Loading.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { TagApiService } from '@/services/api'
import { useTagStore } from '@/stores/tag'
import { FileApiService } from '@/services/api'

const route = useRoute()
const router = useRouter()
const albumStore = useAlbumStore()
const photoStore = usePhotoStore()

const albumId = route.params.id
const loading = ref(false)
const album = ref(null)
const showLightbox = ref(false)
const showUploadForm = ref(false)
const showEditForm = ref(false)
const currentPhotoIndex = ref(0)
const showFavoritesOnly = ref(false)
const selectedTags = ref([])
const tagSearchQuery = ref('')
const showTagDropdown = ref(false)

// 在组件中使用
const tagStore = useTagStore()
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

// 计算属性
const photos = computed(() => photoStore.filteredPhotos)
console.log(photos.value)
const photoCount = computed(() => photoStore.photoCount)
const currentPhoto = computed(() => {
  if (currentPhotoIndex.value >= 0 && currentPhotoIndex.value < photos.value.length) {
    return photos.value[currentPhotoIndex.value]
  }
  return null
})

// 过滤可用标签（排除已选择的标签）
const filteredAvailableTags = computed(() => {
  const availableTags = tagStore.tags.filter(tag => 
    !selectedTags.value.some(selected => selected.id === tag.id)
  )
  
  if (!tagSearchQuery.value.trim()) {
    return availableTags
  }
  
  const query = tagSearchQuery.value.toLowerCase()
  return availableTags.filter(tag => 
    tag.name.toLowerCase().includes(query)
  )
})

// 方法
const loadAlbum = async () => {
  try {
    loading.value = true
    
    // 加载相册信息
    const albumResponse = await AlbumApiService.getAlbum(albumId)
    // 从API响应中正确提取相册信息
    const albumData = albumResponse.data || albumResponse
    album.value = albumData
    albumStore.setCurrentAlbum(albumData)
    
    // 加载相册照片
    const photosResponse = await AlbumApiService.getAlbumPhotos(albumId)
    // 从API响应中正确提取照片列表
    const photosList = photosResponse.data?.photos?.list || []
    photoStore.setPhotos(photosList)
    
  } catch (error) {
    console.error('Failed to load album:', error)
    album.value = null
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const openLightbox = (photo) => {
  const index = photos.value.findIndex(p => p.id === photo.id)
  if (index !== -1) {
    currentPhotoIndex.value = index
    showLightbox.value = true
  }
}

const closeLightbox = () => {
  showLightbox.value = false
}

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else {
    currentPhotoIndex.value = photos.value.length - 1
  }
}

const nextPhoto = () => {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++
  } else {
    currentPhotoIndex.value = 0
  }
}

const editAlbum = () => {
  showEditForm.value = true
}

const handlePhotoUploaded = (uploadResponse) => {
  console.log('handlePhotoUploaded received:', uploadResponse)
  
  // 根据服务器返回的数据结构提取文件数组
  let photosArray = []
  
  if (uploadResponse && uploadResponse.success && uploadResponse.data && uploadResponse.data.files) {
    photosArray = uploadResponse.data.files
  } else if (Array.isArray(uploadResponse)) {
    // 兼容直接返回数组的情况
    photosArray = uploadResponse
  } else {
    console.error('Invalid upload response structure:', uploadResponse)
    alert('上传响应格式错误')
    return
  }
  
  console.log('Adding photos to store:', photosArray)
  photoStore.addPhotos(photosArray)
  
  // 显示上传结果
  if (uploadResponse.data.errorCount > 0) {
    console.warn('Some files failed to upload:', uploadResponse.data.errors)
    alert(`上传完成。成功：${uploadResponse.data.successCount}张，失败：${uploadResponse.data.errorCount}张`)
  } else {
    console.log(`Successfully uploaded ${uploadResponse.data.successCount} photos`)
  }
  
  showUploadForm.value = false
}

const handleAlbumUpdated = (updatedAlbum) => {
  album.value = updatedAlbum
  albumStore.updateAlbum(updatedAlbum.id, updatedAlbum)
  showEditForm.value = false
}

// 处理照片删除
const handlePhotoDeleted = (deletedPhoto) => {
  console.log('照片已删除:', deletedPhoto)
  
  // 从store中移除照片
  photoStore.removePhoto(deletedPhoto.id)
  
  // 如果当前正在显示被删除的照片，关闭lightbox
  if (showLightbox.value && currentPhoto.value && currentPhoto.value.id === deletedPhoto.id) {
    closeLightbox()
  }
}

// 处理收藏筛选
const handleFavoritesFilter = () => {
  photoStore.setFilters({ 
    showFavoritesOnly: showFavoritesOnly.value,
    tags: selectedTags.value.map(tag => tag.name)
  })
}

// 处理标签选择
const selectTag = (tag) => {
  if (!selectedTags.value.some(selected => selected.id === tag.id)) {
    selectedTags.value.push(tag)
    updateTagFilters()
  }
  tagSearchQuery.value = ''
  showTagDropdown.value = false
}

// 移除标签
const removeTag = (tagToRemove) => {
  selectedTags.value = selectedTags.value.filter(tag => tag.id !== tagToRemove.id)
  updateTagFilters()
}

// 更新标签筛选
const updateTagFilters = () => {
  photoStore.setFilters({
    tags: selectedTags.value.map(tag => tag.name),
    showFavoritesOnly: showFavoritesOnly.value
  })
}

// 处理标签输入框失去焦点
const handleTagInputBlur = () => {
  // 延迟隐藏下拉框，以便点击事件能够正常触发
  setTimeout(() => {
    showTagDropdown.value = false
  }, 200)
}

// 处理照片收藏
const handlePhotoFavorite = async (photo) => {
  try {
    console.log('切换照片收藏状态:', photo)
    
    // 立即更新UI状态，提供即时反馈
    const newFavoriteState = !photo.isFavored
    photoStore.setPhotoFavorite(photo.id, newFavoriteState)
    
    // 异步调用后端接口
    if (photo.isFavored) {
      await FileApiService.unfavoritePhoto(photo.id)
      console.log('取消收藏成功')
    } else {
      await FileApiService.favoritePhoto(photo.id)
      console.log('收藏成功')
    }
    
  } catch (error) {
    console.error('收藏操作失败:', error)
    
    // 如果API调用失败，回滚UI状态
    photoStore.setPhotoFavorite(photo.id, photo.isFavored)
    
    // 显示用户友好的错误提示
    const operation = !photo.isFavored ? '取消收藏' : '收藏'
    const errorMessage = error.response?.data?.message || error.message || '网络错误'
    alert(`${operation}失败：${errorMessage}`)
  }
}

// 处理照片定位
const scrollToPhoto = (photoId) => {
  if (!photoId) return
  
  // 等待DOM更新后再滚动
  nextTick(() => {
    const photoElement = document.querySelector(`[data-photo-id="${photoId}"]`)
    if (photoElement) {
      photoElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      // 添加高亮效果
      photoElement.style.boxShadow = '0 0 0 3px var(--color-primary)'
      setTimeout(() => {
        photoElement.style.boxShadow = ''
      }, 2000)
    }
  })
}

// 生命周期
onMounted(() => {
  loadAlbum().then(() => {
    // 如果有photoId查询参数，滚动到对应图片
    const photoId = route.query.photoId
    if (photoId) {
      scrollToPhoto(photoId)
    }
  })
  loadTags()
})
</script>

<style scoped>
.album-detail {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.album-content {
  min-height: 100vh;
}

.album-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  /* margin-bottom: var(--spacing-xl); */
  padding-bottom: var(--spacing-xl);
  margin-bottom: 0;
  /* padding-bottom: 0; */
  border-bottom: 1px solid var(--color-border);
}

.album-info {
  flex: 1;
}

.album-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.album-description {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0 0 1rem 0;
  line-height: 1.6;
  opacity: 0.8;
}

.album-meta {
  display: flex;
  gap: var(--spacing-md);
}

.meta-item {
  font-size: 0.875rem;
  color: var(--color-text);
  opacity: 0.7;
}

.album-actions {
  display: flex;
  gap: var(--spacing-md);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  color: #374151;
  box-shadow: 0 2px 8px rgba(254, 243, 199, 0.4);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(254, 243, 199, 0.6);
}

.action-btn.secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.action-btn.secondary:hover {
  background: var(--color-border);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

.filters-section {
  margin: 0 0 var(--spacing-lg) 0;
  padding: var(--spacing-md);
  background: var(--color-background-mute);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.filter-group {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.filter-group > .favorites-filter {
  margin-top: 0.75rem;
  margin-left: auto;
}

.tag-filter {
  flex: 0 1 300px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tag-input-container {
  position: relative;
}

.tag-search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: border-color 0.3s ease;
}

.tag-search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.tag-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tag-option:hover {
  background: var(--color-background-mute);
}

.tag-name {
  font-size: 0.875rem;
  color: var(--color-text);
}

.tag-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.remove-tag-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.remove-tag-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.favorites-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.favorites-filter input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: 500;
}

.photos-section {
  margin-top: var(--spacing-xl);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .album-detail {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .album-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .album-title {
    font-size: 1.5rem;
  }
  
  .album-actions {
    width: 100%;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
  
  .filter-group {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .tag-filter {
    width: 100%;
  }
  
  .tag-search-input {
    width: 100%;
  }
  
  .selected-tags {
    justify-content: flex-start;
  }
  
  .favorites-filter {
    align-self: flex-start;
    margin-top: var(--spacing-sm);
  }
}
</style> 