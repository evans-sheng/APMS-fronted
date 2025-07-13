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
import { ref, computed, onMounted } from 'vue'
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

// 计算属性
const photos = computed(() => photoStore.filteredPhotos)
const photoCount = computed(() => photoStore.photoCount)
const currentPhoto = computed(() => {
  if (currentPhotoIndex.value >= 0 && currentPhotoIndex.value < photos.value.length) {
    return photos.value[currentPhotoIndex.value]
  }
  return null
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

// 处理照片收藏
const handlePhotoFavorite = (photo) => {
  console.log('切换照片收藏状态:', photo)
  // 这里可以添加收藏功能的实现
  photoStore.updatePhoto(photo.id, { isFavorite: !photo.isFavorite })
}

// 生命周期
onMounted(() => {
  loadAlbum()
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
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-xl);
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
}
</style> 