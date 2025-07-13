<template>
  <div class="photo-grid">
    <PhotoCard 
      v-for="photo in photos" 
      :key="photo.id" 
      :photo="photo"
      @click="$emit('photo-click', photo)"
      @delete="handleDelete(photo)"
      @favorite="$emit('photo-favorite', photo)"
    />
  </div>
</template>

<script setup>
import PhotoCard from './PhotoCard.vue'
import { FileApiService } from '@/services/api'

defineProps({
  photos: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['photo-click', 'photo-deleted', 'photo-favorite'])

// 处理删除照片
const handleDelete = async (photo) => {
  // 显示确认弹窗
  const confirmMessage = `确定要删除这张照片吗？\n\n文件名：${photo.originalName || photo.name}\n\n此操作不可恢复。`
  
  if (!confirm(confirmMessage)) {
    return
  }
  
  try {
    console.log('删除照片:', photo.id)
    
    // 调用删除API
    await FileApiService.deleteFile(photo.id)
    
    console.log('删除成功')
    
    // 通知父组件照片已删除
    emit('photo-deleted', photo)
    
    // 显示成功提示
    alert('照片删除成功')
    
  } catch (error) {
    console.error('删除照片失败:', error)
    alert('删除失败：' + (error.response?.data?.message || error.message))
  }
}
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--spacing-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--spacing-xs);
  }
}
</style> 