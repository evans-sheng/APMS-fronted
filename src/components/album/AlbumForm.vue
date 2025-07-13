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
          <input
            id="tags"
            v-model="tagInput"
            type="text"
            placeholder="输入标签，用逗号分隔"
            @keydown.enter.prevent="addTag"
            class="form-input"
          />
          <div v-if="form.tags.length > 0" class="tags-list">
            <span 
              v-for="tag in form.tags" 
              :key="tag" 
              class="tag"
            >
              {{ tag }}
              <button 
                type="button" 
                @click="removeTag(tag)"
                class="tag-remove"
              >
                ×
              </button>
            </span>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { AlbumApiService, FileApiService } from '@/services/api'
import CoverUpload from './CoverUpload.vue'

const props = defineProps({
  editingAlbum: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created', 'updated'])

const submitting = ref(false)
const tagInput = ref('')

const form = reactive({
  name: '',
  description: '',
  tags: [],
  coverImageId: null
})

// 计算现有封面URL
const existingCoverUrl = computed(() => {
  if (props.editingAlbum && (props.editingAlbum.coverPhotoId || props.editingAlbum.coverImageId)) {
    return FileApiService.getOriginalUrl(props.editingAlbum.coverPhotoId || props.editingAlbum.coverImageId)
  }
  return null
})

// 初始化表单
onMounted(() => {
  if (props.editingAlbum) {
    form.name = props.editingAlbum.name || ''
    form.description = props.editingAlbum.description || ''
    form.tags = [...(props.editingAlbum.tags || [])]
    // 优先使用coverPhotoId，如果没有则使用coverImageId
    form.coverImageId = props.editingAlbum.coverPhotoId || props.editingAlbum.coverImageId || null
  }
})

// 添加标签
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
    tagInput.value = ''
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
  overflow-y: auto;
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

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
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
  margin-top: 2rem;
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