<template>
  <div class="albums-page">
    <div class="albums-container">
      <AlbumList />
    </div>
  </div>
</template>

<script setup>
import AlbumList from '@/components/album/AlbumList.vue'
</script>

<style scoped>
.albums-page {
  min-height: 100vh;
  background: var(--color-background);
}

.albums-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .albums-container {
    padding: var(--spacing-md);
  }
}
</style> 