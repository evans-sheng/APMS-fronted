import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUploadStore = defineStore('upload', () => {
  // 状态
  const uploadQueue = ref([])
  const uploading = ref(false)
  const progress = ref({})
  const error = ref(null)

  // 计算属性
  const queueLength = computed(() => uploadQueue.value.length)
  const totalProgress = computed(() => {
    if (uploadQueue.value.length === 0) return 0
    
    const total = uploadQueue.value.reduce((sum, item) => {
      return sum + (progress.value[item.id] || 0)
    }, 0)
    
    return Math.round(total / uploadQueue.value.length)
  })

  const completedCount = computed(() => {
    return uploadQueue.value.filter(item => progress.value[item.id] === 100).length
  })

  // 方法
  const addToQueue = (file, albumId = null) => {
    const uploadItem = {
      id: Date.now() + Math.random(),
      file,
      albumId,
      status: 'pending', // pending, uploading, completed, error
      error: null
    }
    
    uploadQueue.value.push(uploadItem)
    progress.value[uploadItem.id] = 0
  }

  const removeFromQueue = (id) => {
    const index = uploadQueue.value.findIndex(item => item.id === id)
    if (index !== -1) {
      uploadQueue.value.splice(index, 1)
      delete progress.value[id]
    }
  }

  const updateProgress = (id, percent) => {
    progress.value[id] = percent
  }

  const updateStatus = (id, status, error = null) => {
    const item = uploadQueue.value.find(item => item.id === id)
    if (item) {
      item.status = status
      item.error = error
    }
  }

  const setUploading = (isUploading) => {
    uploading.value = isUploading
  }

  const setError = (errorMessage) => {
    error.value = errorMessage
  }

  const clearError = () => {
    error.value = null
  }

  const clearQueue = () => {
    uploadQueue.value = []
    progress.value = {}
  }

  const clearCompleted = () => {
    uploadQueue.value = uploadQueue.value.filter(item => item.status !== 'completed')
  }

  return {
    // 状态
    uploadQueue,
    uploading,
    progress,
    error,
    // 计算属性
    queueLength,
    totalProgress,
    completedCount,
    // 方法
    addToQueue,
    removeFromQueue,
    updateProgress,
    updateStatus,
    setUploading,
    setError,
    clearError,
    clearQueue,
    clearCompleted
  }
}) 