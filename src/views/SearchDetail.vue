<template>
  <div class="search-detail">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading">
      加载中...
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error">
      {{ error }}
    </div>

    <!-- 空状态提示 -->
    <div v-if="!isLoading && !error && filesList.length === 0" class="empty">
      未找到相关照片
    </div>

    <!-- 图片列表 -->
    <div v-else-if="filesList.length > 0" class="photos-section">
      <PhotoGrid 
        :photos="filesList"
        @photo-click="openLightbox"
        @photo-favorite="handlePhotoFavorite"
        @photo-deleted="handlePhotoDeleted"
      />
    </div>

    <!-- 灯箱 -->
    <PhotoLightbox 
      v-if="showLightbox"
      :photo="currentPhoto"
      :photos="filesList"
      @close="closeLightbox"
      @previous="previousPhoto"
      @next="nextPhoto"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { FileApiService, TagApiService } from '@/services/api';
import PhotoGrid from '@/components/photo/PhotoGrid.vue';
import PhotoLightbox from '@/components/photo/PhotoLightbox.vue';
import { useTagStore } from '@/stores/tag';

const route = useRoute();
const filesList = ref([]);
const isLoading = ref(false);
const error = ref(null);
const showLightbox = ref(false);
const currentPhotoIndex = ref(0);

// Store 实例
const tagStore = useTagStore();

// 计算属性
const currentPhoto = computed(() => {
  if (currentPhotoIndex.value >= 0 && currentPhotoIndex.value < filesList.value.length) {
    return filesList.value[currentPhotoIndex.value];
  }
  return null;
});

// 方法
const loadFiles = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const params = { search: route.params.query };
    const response = await FileApiService.getFiles(params);
    filesList.value = response.data.files;
  } catch (err) {
    error.value = '加载失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

const openLightbox = (photo) => {
  const index = filesList.value.findIndex(p => p.id === photo.id);
  if (index !== -1) {
    currentPhotoIndex.value = index;
    showLightbox.value = true;
  }
};

const closeLightbox = () => {
  showLightbox.value = false;
};

const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
  } else {
    currentPhotoIndex.value = filesList.value.length - 1;
  }
};

const nextPhoto = () => {
  if (currentPhotoIndex.value < filesList.value.length - 1) {
    currentPhotoIndex.value++;
  } else {
    currentPhotoIndex.value = 0;
  }
};

const handlePhotoFavorite = async (photo) => {
  const photoIndex = filesList.value.findIndex(p => p.id === photo.id)
  
  try {
    console.log('切换照片收藏状态:', photo)
    
    // 立即更新UI状态，提供即时反馈
    if (photoIndex !== -1) {
      const newFavoriteState = !photo.isFavored
      filesList.value[photoIndex].isFavored = newFavoriteState
    }
    
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
    if (photoIndex !== -1) {
      filesList.value[photoIndex].isFavored = photo.isFavored
    }
    
    // 显示用户友好的错误提示
    const operation = !photo.isFavored ? '取消收藏' : '收藏'
    const errorMessage = error.response?.data?.message || error.message || '网络错误'
    alert(`${operation}失败：${errorMessage}`)
  }
};

const handlePhotoDeleted = (photo) => {
  // 搜索结果中禁用删除功能，提供空处理
  console.log('搜索结果中不支持删除操作');
};

// 加载标签数据
const loadTags = async () => {
  try {
    tagStore.setLoading(true);
    const response = await TagApiService.getAllTags();
    if (response.success) {
      tagStore.setTags(response.data);
    }
  } catch (error) {
    tagStore.setError(error.message);
  } finally {
    tagStore.setLoading(false);
  }
};

onMounted(() => {
  loadFiles();
  loadTags();
});
watch(() => route.params.query, loadFiles);
</script>

<style scoped>
.search-detail {
  padding: 20px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.photos-section {
  margin-top: var(--spacing-md);
}
</style> 