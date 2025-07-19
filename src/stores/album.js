import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AlbumApiService } from '@/services/api'

export const useAlbumStore = defineStore('album', () => {
  // 状态
  const albums = ref([])
  const currentAlbum = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const selectedTags = ref([])
  const showFavoritesOnly = ref(false)

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

  // 过滤后的相册
  const filteredAlbums = computed(() => {
    let filtered = sortedAlbums.value
    
    // 收藏筛选
    if (showFavoritesOnly.value) {
      filtered = filtered.filter(album => album.isFavored === true)
    }
    
    // 标签筛选 - 支持多选
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(album => {
        // 如果相册没有标签，则不显示
        if (!album.tags || album.tags.length === 0) {
          return false
        }
        // 检查相册是否包含任一选中的标签
        return selectedTags.value.some(selectedTag => 
          album.tags.includes(selectedTag)
        )
      })
    }
    
    return filtered
  })

  // 过滤后的相册数量
  const filteredAlbumCount = computed(() => filteredAlbums.value.length)

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

  // 标签筛选相关方法
  const setSelectedTags = (tags) => {
    selectedTags.value = tags
  }

  const addSelectedTag = (tag) => {
    if (!selectedTags.value.includes(tag)) {
      selectedTags.value.push(tag)
    }
  }

  const removeSelectedTag = (tag) => {
    const index = selectedTags.value.indexOf(tag)
    if (index !== -1) {
      selectedTags.value.splice(index, 1)
    }
  }

  const clearSelectedTags = () => {
    selectedTags.value = []
  }

  // 收藏相关方法
  const toggleAlbumFavorite = async (albumId) => {
    try {
      // 找到相册
      const album = albums.value.find(a => a.id === albumId)
      if (!album) {
        console.error('相册未找到:', albumId)
        return
      }

      // 乐观更新UI
      const originalState = album.isFavored
      album.isFavored = !originalState

      // 调用API
      if (album.isFavored) {
        await AlbumApiService.addAlbumFavorite(albumId)
      } else {
        await AlbumApiService.removeAlbumFavorite(albumId)
      }
    } catch (error) {
      console.error('切换相册收藏状态失败:', error)
      // 回滚状态
      const album = albums.value.find(a => a.id === albumId)
      if (album) {
        album.isFavored = !album.isFavored
      }
      // 设置错误信息
      setError('操作失败，请重试')
    }
  }

  const setShowFavoritesOnly = (value) => {
    showFavoritesOnly.value = value
  }

  return {
    // 状态
    albums,
    currentAlbum,
    loading,
    error,
    selectedTags,
    showFavoritesOnly,
    // 计算属性
    albumCount,
    sortedAlbums,
    filteredAlbums,
    filteredAlbumCount,
    // 方法
    setAlbums,
    addAlbum,
    updateAlbum,
    removeAlbum,
    setCurrentAlbum,
    setLoading,
    setError,
    clearError,
    setSelectedTags,
    addSelectedTag,
    removeSelectedTag,
    clearSelectedTags,
    toggleAlbumFavorite,
    setShowFavoritesOnly
  }
}) 