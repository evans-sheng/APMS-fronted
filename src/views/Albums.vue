<template>
  <div class="albums-page">
    <AlbumList />
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
</style> 