import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePhotoStore = defineStore('photo', () => {
  // 状态
  const photos = ref([])
  const currentPhoto = ref(null)
  const selectedPhotos = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    tags: [],
    dateRange: null,
    search: ''
  })

  // 计算属性
  const photoCount = computed(() => photos.value.length)
  const selectedCount = computed(() => selectedPhotos.value.length)
  
  const filteredPhotos = computed(() => {
    // 防御性编程：确保 photos.value 是数组
    if (!Array.isArray(photos.value)) {
      console.warn('photos.value is not an array:', photos.value)
      return []
    }
    
    let filtered = [...photos.value]
    
    // 标签筛选
    if (filters.value.tags.length > 0) {
      filtered = filtered.filter(photo => 
        filters.value.tags.some(tag => photo.tags?.includes(tag))
      )
    }
    
    // 搜索筛选
    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(photo => 
        photo.originalName?.toLowerCase().includes(search) ||
        photo.name?.toLowerCase().includes(search) ||
        photo.tags?.some(tag => tag.toLowerCase().includes(search))
      )
    }
    
    // 日期筛选
    if (filters.value.dateRange) {
      const { start, end } = filters.value.dateRange
      filtered = filtered.filter(photo => {
        const photoDate = new Date(photo.createdAt)
        return (!start || photoDate >= start) && (!end || photoDate <= end)
      })
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  // 方法
  const setPhotos = (photoList) => {
    photos.value = photoList
  }

  const addPhoto = (photo) => {
    photos.value.push(photo)
  }

  const addPhotos = (photoList) => {
    if (!Array.isArray(photoList)) {
      console.error('addPhotos: expected array, got:', typeof photoList, photoList)
      return
    }
    photos.value.push(...photoList)
  }

  const updatePhoto = (id, updates) => {
    const index = photos.value.findIndex(photo => photo.id === id)
    if (index !== -1) {
      photos.value[index] = { ...photos.value[index], ...updates }
    }
  }

  const removePhoto = (id) => {
    const index = photos.value.findIndex(photo => photo.id === id)
    if (index !== -1) {
      photos.value.splice(index, 1)
    }
  }

  const removePhotos = (ids) => {
    photos.value = photos.value.filter(photo => !ids.includes(photo.id))
  }

  const setCurrentPhoto = (photo) => {
    currentPhoto.value = photo
  }

  const selectPhoto = (id) => {
    if (!selectedPhotos.value.includes(id)) {
      selectedPhotos.value.push(id)
    }
  }

  const deselectPhoto = (id) => {
    const index = selectedPhotos.value.indexOf(id)
    if (index !== -1) {
      selectedPhotos.value.splice(index, 1)
    }
  }

  const selectAll = () => {
    selectedPhotos.value = filteredPhotos.value.map(photo => photo.id)
  }

  const deselectAll = () => {
    selectedPhotos.value = []
  }

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      tags: [],
      dateRange: null,
      search: ''
    }
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
    photos,
    currentPhoto,
    selectedPhotos,
    loading,
    error,
    filters,
    // 计算属性
    photoCount,
    selectedCount,
    filteredPhotos,
    // 方法
    setPhotos,
    addPhoto,
    addPhotos,
    updatePhoto,
    removePhoto,
    removePhotos,
    setCurrentPhoto,
    selectPhoto,
    deselectPhoto,
    selectAll,
    deselectAll,
    setFilters,
    clearFilters,
    setLoading,
    setError,
    clearError
  }
}) 