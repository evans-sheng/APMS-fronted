<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ editingAlbum ? '编辑相册' : '创建相册' }}</h3>
        <button @click="$emit('close')" class="close-btn">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="album-form">
        <div class="form-content">
          <div class="form-group">
            <label for="name">相册名称 *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="输入相册名称"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="description">相册描述</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="描述这个相册的内容..."
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>

          <!-- 封面上传 -->
          <CoverUpload
            v-model="form.coverImageId"
            :existing-cover-url="existingCoverUrl"
            @uploaded="onCoverUploaded"
            @removed="onCoverRemoved"
          />

          <div class="form-group">
            <label for="tags">标签</label>
            <div class="tag-selector">
              <div class="tag-dropdown" :class="{ 'active': showDropdown }">
                <div class="dropdown-trigger" @click="toggleDropdown">
                  <span v-if="form.tags.length === 0" class="placeholder">选择标签</span>
                  <span v-else class="selected-count">已选择 {{ form.tags.length }} 个标签</span>
                  <svg class="dropdown-arrow" :class="{ 'rotated': showDropdown }" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                  </svg>
                </div>
                <div v-if="showDropdown" class="dropdown-menu">
                  <div v-if="tagStore.loading" class="dropdown-loading">
                    加载标签中...
                  </div>
                  <div v-else-if="availableTags.length === 0" class="dropdown-empty">
                    暂无可用标签
                  </div>
                  <div v-else class="dropdown-options">
                    <label 
                      v-for="tag in availableTags" 
                      :key="tag.id"
                      class="dropdown-option"
                    >
                      <input 
                        type="checkbox" 
                        :value="tag.name"
                        :checked="form.tags.includes(tag.name)"
                        @change="toggleTag(tag.name)"
                      />
                      <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                      <span class="tag-name">{{ tag.name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="form.tags.length > 0" class="tags-list">
              <span 
                v-for="tag in selectedTags" 
                :key="tag.name" 
                class="tag"
              >
                <span class="tag-color" :style="{ backgroundColor: tag.color }"></span>
                <span class="tag-name">{{ tag.name }}</span>
                <button 
                  type="button" 
                  @click="removeTag(tag.name)"
                  class="tag-remove"
                >
                  ×
                </button>
              </span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">
            取消
          </button>
          <button type="submit" class="btn-primary" :disabled="submitting">
            {{ submitting ? '保存中...' : (editingAlbum ? '更新' : '创建') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { AlbumApiService, FileApiService, TagApiService } from '@/services/api'
import CoverUpload from './CoverUpload.vue'
import { useTagStore } from '@/stores/tag'

const props = defineProps({
  editingAlbum: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const submitting = ref(false)
const showDropdown = ref(false)

const form = reactive({
  name: '',
  description: '',
  tags: [],
  coverImageId: null
})

const tagStore = useTagStore()

// 计算现有封面URL
const existingCoverUrl = computed(() => {
  if (props.editingAlbum && (props.editingAlbum.coverPhotoId || props.editingAlbum.coverImageId)) {
    return FileApiService.getOriginalUrl(props.editingAlbum.coverPhotoId || props.editingAlbum.coverImageId)
  }
  return null
})

// 计算可用标签
const availableTags = computed(() => {
  return tagStore.tags || []
})

// 计算选中的标签对象（包含颜色信息）
const selectedTags = computed(() => {
  return form.tags.map(tagName => {
    const tagObj = availableTags.value.find(tag => tag.name === tagName)
    return tagObj || { name: tagName, color: '#9CA3AF' } // 默认颜色
  })
})

// 加载标签
const loadTags = async () => {
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

// 初始化表单
onMounted(() => {
  if (props.editingAlbum) {
    form.name = props.editingAlbum.name || ''
    form.description = props.editingAlbum.description || ''
    form.tags = [...(props.editingAlbum.tags || [])]
    // 优先使用coverPhotoId，如果没有则使用coverImageId
    form.coverImageId = props.editingAlbum.coverPhotoId || props.editingAlbum.coverImageId || null
  }
  
  // 加载标签数据
  loadTags()
  
  // 点击外部关闭下拉菜单
  document.addEventListener('click', handleClickOutside)
})

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.tag-dropdown')) {
    showDropdown.value = false
  }
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 切换下拉菜单
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 切换标签选中状态
const toggleTag = (tagName) => {
  const index = form.tags.indexOf(tagName)
  if (index > -1) {
    form.tags.splice(index, 1)
  } else {
    form.tags.push(tagName)
  }
}

// 移除标签
const removeTag = (tag) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

// 封面上传相关事件
const onCoverUploaded = (response) => {
  console.log('封面上传成功:', response)
  console.log('当前表单coverImageId (将作为coverPhotoId提交):', form.coverImageId)
  
  // 由于使用了v-model，文件ID应该已经自动更新到form.coverImageId
  // 但我们可以再次确认和验证
  if (response.fileId && response.fileId !== form.coverImageId) {
    console.warn('文件ID不匹配，手动更新:', response.fileId)
    form.coverImageId = response.fileId
  }
}

const onCoverRemoved = () => {
  console.log('封面已移除')
  console.log('当前表单coverImageId (将作为coverPhotoId提交):', form.coverImageId)
  
  // 确保coverImageId被正确清空
  form.coverImageId = null
}

// 提交表单
const handleSubmit = async () => {
  if (!form.name.trim()) {
    alert('请输入相册名称')
    return
  }

  try {
    submitting.value = true
    
    const albumData = {
      name: form.name.trim(),
      description: form.description.trim(),
      tags: form.tags,
      coverPhotoId: form.coverImageId  // 修改为coverPhotoId
    }

    console.log('提交相册数据:', albumData)
    console.log('封面图片ID (coverPhotoId):', form.coverImageId)

    if (props.editingAlbum) {
      // 更新相册
      console.log('更新相册:', props.editingAlbum.id)
      const updatedAlbum = await AlbumApiService.updateAlbum(props.editingAlbum.id, albumData)
      console.log('更新成功:', updatedAlbum)
      emit('updated', updatedAlbum)
    } else {
      // 创建相册
      console.log('创建新相册')
      const newAlbum = await AlbumApiService.createAlbum(albumData)
      console.log('创建成功:', newAlbum)
      emit('created', newAlbum)
    }
    
    emit('close')
  } catch (error) {
    console.error('Failed to save album:', error)
    console.error('错误详情:', error.response?.data || error.message)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--color-background);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-border);
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.album-form {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-border-hover);
  box-shadow: 0 0 0 3px rgba(254, 243, 199, 0.3);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.tag-selector {
  position: relative;
  width: 100%;
}

.tag-dropdown {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.tag-dropdown.active {
  border-color: var(--color-border-hover);
  box-shadow: 0 0 0 3px rgba(254, 243, 199, 0.3);
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
}

.placeholder {
  color: var(--color-text-mute);
}

.selected-count {
  color: var(--color-text-mute);
  font-size: 0.875rem;
}

.dropdown-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.5rem;
}

.dropdown-loading,
.dropdown-empty {
  padding: 0.75rem 1rem;
  text-align: center;
  color: var(--color-text-mute);
  font-size: 0.875rem;
}

.dropdown-options {
  padding: 0.5rem 0;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-option:hover {
  background: var(--color-background-mute);
}

.dropdown-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary); /* For better checkbox appearance */
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  flex-grow: 1;
  font-size: 0.875rem;
  color: var(--color-text);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.25rem;
  border-radius: 8px;
  background: var(--color-background-soft);
}

.tags-list::-webkit-scrollbar {
  width: 6px;
}

.tags-list::-webkit-scrollbar-track {
  background: var(--color-background-mute);
  border-radius: 3px;
}

.tags-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.tags-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.tag:hover {
  background: var(--color-background-soft);
  border-color: var(--color-border-hover);
}

.tag .tag-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.tag .tag-name {
  flex-grow: 1;
  font-size: 0.75rem;
  color: var(--color-text);
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background: none;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 50%;
  font-size: 12px;
  transition: all 0.2s ease;
}

.tag-remove:hover {
  background: var(--color-border);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: var(--color-border);
}

.btn-primary {
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  color: #374151;
  box-shadow: 0 2px 8px rgba(254, 243, 199, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(254, 243, 199, 0.6);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    margin: 1rem;
    max-width: none;
  }
  
  .modal-header,
  .album-form {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
  }
}
</style> 