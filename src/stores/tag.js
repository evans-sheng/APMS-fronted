import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTagStore = defineStore('tag', () => {
  // 状态
  const tags = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const tagCount = computed(() => tags.value.length)
  const sortedTags = computed(() => {
    // 防御性编程：确保 tags.value 是数组
    if (!Array.isArray(tags.value)) {
      console.warn('tags.value is not an array:', tags.value)
      return []
    }
    return [...tags.value].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  })

  // 根据颜色分组的标签
  const tagsByColor = computed(() => {
    const grouped = {}
    tags.value.forEach(tag => {
      if (!grouped[tag.color]) {
        grouped[tag.color] = []
      }
      grouped[tag.color].push(tag)
    })
    return grouped
  })

  // 根据ID查找标签
  const getTagById = computed(() => {
    return (id) => tags.value.find(tag => tag.id === id)
  })

  // 根据名称查找标签
  const getTagByName = computed(() => {
    return (name) => tags.value.find(tag => tag.name === name)
  })

  // 方法
  const setTags = (tagList) => {
    tags.value = tagList
  }

  const addTag = (tag) => {
    tags.value.push(tag)
  }

  const updateTag = (id, updates) => {
    const index = tags.value.findIndex(tag => tag.id === id)
    if (index !== -1) {
      tags.value[index] = { ...tags.value[index], ...updates }
    }
  }

  const removeTag = (id) => {
    const index = tags.value.findIndex(tag => tag.id === id)
    if (index !== -1) {
      tags.value.splice(index, 1)
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

  // 清空所有标签
  const clearTags = () => {
    tags.value = []
  }

  return {
    // 状态
    tags,
    loading,
    error,
    // 计算属性
    tagCount,
    sortedTags,
    tagsByColor,
    getTagById,
    getTagByName,
    // 方法
    setTags,
    addTag,
    updateTag,
    removeTag,
    setLoading,
    setError,
    clearError,
    clearTags
  }
}) 