<template>
  <div class="album-tag-filter">
    <div class="filter-header">
      <div class="filter-title">
        <svg viewBox="0 0 24 24" fill="currentColor" class="filter-icon">
          <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
        </svg>
        <span>按标签筛选</span>
      </div>
      <button 
        v-if="selectedTags.length > 0" 
        @click="clearAllTags" 
        class="clear-btn"
        title="清除所有筛选"
      >
        清除
      </button>
    </div>

    <!-- 已选标签 -->
    <div v-if="selectedTags.length > 0" class="selected-tags">
      <span 
        v-for="tagName in selectedTags" 
        :key="tagName"
        class="selected-tag"
        :style="{ backgroundColor: getTagColor(tagName) }"
        @click="removeTag(tagName)"
      >
        {{ tagName }}
        <svg viewBox="0 0 24 24" fill="currentColor" class="remove-icon">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </span>
    </div>

    <!-- 标签下拉选择 -->
    <div class="tag-dropdown" ref="dropdownRef">
      <button @click="toggleDropdown" class="dropdown-toggle">
        <span>选择标签</span>
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          class="dropdown-arrow"
          :class="{ 'rotated': showDropdown }"
        >
          <path d="M7 10l5 5 5-5z"/>
        </svg>
      </button>

      <div v-if="showDropdown" class="dropdown-menu">
        <div v-if="loading" class="dropdown-loading">
          加载标签中...
        </div>
        <div v-else-if="availableTags.length === 0" class="dropdown-empty">
          暂无可用标签
        </div>
        <div v-else class="tag-options">
          <label 
            v-for="tag in availableTags" 
            :key="tag.name"
            class="tag-option"
            :class="{ 'selected': selectedTags.includes(tag.name) }"
          >
            <input 
              type="checkbox"
              :checked="selectedTags.includes(tag.name)"
              @change="toggleTag(tag.name)"
              class="tag-checkbox"
            />
            <span 
              class="tag-label"
              :style="{ backgroundColor: tag.color }"
            >
              {{ tag.name }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- 筛选结果统计 -->
    <div v-if="selectedTags.length > 0" class="filter-stats">
      找到 {{ filteredCount }} 个相册
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAlbumStore } from '@/stores/album'
import { useTagStore } from '@/stores/tag'
import { TagApiService } from '@/services/api'

const albumStore = useAlbumStore()
const tagStore = useTagStore()

const showDropdown = ref(false)
const dropdownRef = ref(null)

// 计算属性
const selectedTags = computed(() => albumStore.selectedTags)
const filteredCount = computed(() => albumStore.filteredAlbumCount)
const loading = computed(() => tagStore.loading)
const availableTags = computed(() => tagStore.sortedTags)

// 方法
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const toggleTag = (tagName) => {
  if (selectedTags.value.includes(tagName)) {
    albumStore.removeSelectedTag(tagName)
  } else {
    albumStore.addSelectedTag(tagName)
  }
}

const removeTag = (tagName) => {
  albumStore.removeSelectedTag(tagName)
}

const clearAllTags = () => {
  albumStore.clearSelectedTags()
}

const getTagColor = (tagName) => {
  const tag = availableTags.value.find(t => t.name === tagName)
  return tag?.color || '#FEF3C7'
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

// 加载标签数据
const loadTags = async () => {
  if (tagStore.tags.length === 0) {
    try {
      tagStore.setLoading(true)
      const response = await TagApiService.getAllTags()
      if (response.success) {
        tagStore.setTags(response.data)
      }
    } catch (error) {
      tagStore.setError(error.message)
    } finally {
      tagStore.setLoading(false)
    }
  }
}

// 生命周期
onMounted(() => {
  loadTags()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.album-tag-filter {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-heading);
}

.filter-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.clear-btn {
  padding: 0.25rem 0.75rem;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: var(--color-border);
}

/* 已选标签 */
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: var(--spacing-md);
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(55, 65, 81, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.selected-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-icon {
  width: 12px;
  height: 12px;
  opacity: 0.6;
}

/* 下拉选择器 */
.tag-dropdown {
  position: relative;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-toggle:hover {
  border-color: var(--color-border-hover);
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.25rem;
}

.dropdown-loading,
.dropdown-empty {
  padding: 1rem;
  text-align: center;
  color: var(--color-text);
  opacity: 0.6;
  font-size: 0.875rem;
}

.tag-options {
  padding: 0.5rem;
}

.tag-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tag-option:hover {
  background: var(--color-border);
}

.tag-option.selected {
  background: rgba(254, 243, 199, 0.3);
}

.tag-checkbox {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.tag-label {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(55, 65, 81, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 筛选统计 */
.filter-stats {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--color-text);
  text-align: center;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .album-tag-filter {
    padding: var(--spacing-md);
  }
  
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .clear-btn {
    align-self: flex-end;
  }
}
</style> 