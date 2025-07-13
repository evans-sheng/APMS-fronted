import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAlbumStore = defineStore('album', () => {
  // 状态
  const albums = ref([])
  const currentAlbum = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const albumCount = computed(() => albums.value.length)
  const sortedAlbums = computed(() => {
    // 防御性编程：确保 albums.value 是数组
    if (!Array.isArray(albums.value)) {
      console.warn('albums.value is not an array:', albums.value)
      return []
    }
    return [...albums.value].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  })

  // 方法
  const setAlbums = (albumList) => {
    albums.value = albumList
  }

  const addAlbum = (album) => {
    albums.value.push(album)
  }

  const updateAlbum = (id, updates) => {
    const index = albums.value.findIndex(album => album.id === id)
    if (index !== -1) {
      albums.value[index] = { ...albums.value[index], ...updates }
    }
  }

  const removeAlbum = (id) => {
    const index = albums.value.findIndex(album => album.id === id)
    if (index !== -1) {
      albums.value.splice(index, 1)
    }
  }

  const setCurrentAlbum = (album) => {
    currentAlbum.value = album
  }

  const setLoading = (isLoading) => {
    loading.value = isLoading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    albums,
    currentAlbum,
    loading,
    error,
    // 计算属性
    albumCount,
    sortedAlbums,
    // 方法
    setAlbums,
    addAlbum,
    updateAlbum,
    removeAlbum,
    setCurrentAlbum,
    setLoading,
    setError,
    clearError
  }
}) 