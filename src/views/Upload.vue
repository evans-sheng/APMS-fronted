<template>
  <div class="upload-page">
    <div class="upload-header">
      <h1>上传照片</h1>
      <p>选择相册并上传您的照片</p>
    </div>

    <div class="upload-content">
      <!-- 相册选择 -->
      <div class="album-selector">
        <label for="album-select">选择相册：</label>
        <select 
          id="album-select"
          v-model="selectedAlbumId"
          class="album-select"
        >
          <option value="">选择相册</option>
          <option 
            v-for="album in albums" 
            :key="album.id" 
            :value="album.id"
          >
            {{ album.name }}
          </option>
        </select>
        <button @click="showCreateAlbum = true" class="create-album-btn">
          创建新相册
        </button>
      </div>

      <!-- 上传组件 -->
      <PhotoUpload 
        v-if="selectedAlbumId"
        :album-id="selectedAlbumId"
        @close="handleUploadClose"
        @uploaded="handleUploaded"
      />
      
      <!-- 空状态 -->
      <EmptyState 
        v-else 
        title="请先选择相册"
        description="选择一个相册来上传照片，或者创建新的相册"
        icon="upload"
        @action="showCreateAlbum = true"
        action-text="创建相册"
      />
    </div>

    <!-- 创建相册表单 -->
    <AlbumForm 
      v-if="showCreateAlbum"
      @close="showCreateAlbum = false"
      @created="handleAlbumCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlbumStore } from '@/stores/album'
import { AlbumApiService } from '@/services/api'
import PhotoUpload from '@/components/photo/PhotoUpload.vue'
import AlbumForm from '@/components/album/AlbumForm.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const albumStore = useAlbumStore()

const selectedAlbumId = ref('')
const showCreateAlbum = ref(false)

// 计算属性
const albums = computed(() => albumStore.sortedAlbums)

// 方法
const handleUploadClose = () => {
  // 上传关闭时的处理
}

const handleUploaded = (newPhotos) => {
  // 上传成功后的处理
  console.log('上传成功:', newPhotos)
}

const handleAlbumCreated = (newAlbum) => {
  albumStore.addAlbum(newAlbum)
  selectedAlbumId.value = newAlbum.id
  showCreateAlbum.value = false
}

// 生命周期
onMounted(() => {
  // 加载相册列表
  if (albums.value.length === 0) {
    albumStore.setLoading(true)
    AlbumApiService.getAlbums()
      .then(albumsData => {
        albumStore.setAlbums(albumsData)
      })
      .catch(error => {
        console.error('Failed to load albums:', error)
      })
      .finally(() => {
        albumStore.setLoading(false)
      })
  }
})
</script>

<style scoped>
.upload-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

.upload-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
}

.upload-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.upload-header p {
  font-size: 1rem;
  color: var(--color-text);
  margin: 0;
  opacity: 0.8;
}

.upload-content {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: var(--spacing-xl);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.album-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.album-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-heading);
  white-space: nowrap;
}

.album-select {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.album-select:focus {
  outline: none;
  border-color: var(--color-border-hover);
  box-shadow: 0 0 0 3px rgba(254, 243, 199, 0.3);
}

.create-album-btn {
  padding: 0.75rem 1rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.create-album-btn:hover {
  background: var(--color-border);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-page {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .upload-header h1 {
    font-size: 1.5rem;
  }
  
  .upload-content {
    padding: var(--spacing-lg);
  }
  
  .album-selector {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .album-select {
    width: 100%;
  }
  
  .create-album-btn {
    width: 100%;
  }
}
</style> 