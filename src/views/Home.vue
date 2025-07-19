<template>
  <div class="home">
    <!-- 欢迎区域 -->
    <section class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">欢迎来到小俊宝的家</h1>
        <p class="welcome-subtitle">记录每一个美好瞬间，珍藏每一份温馨回忆</p>
        <div class="welcome-stats">
          <div class="stat-item">
            <div class="stat-number">{{ albumCount }}</div>
            <div class="stat-label">个相册</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ totalPhotos }}</div>
            <div class="stat-label">张照片</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ recentUploads }}</div>
            <div class="stat-label">最近上传</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速操作 -->
    <section class="quick-actions">
      <div class="section-header">
        <h2>导航栏</h2>
      </div>
      <div class="action-grid">
        <router-link to="/albums" class="action-card">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
            </svg>
          </div>
          <h3>浏览相册</h3>
          <p>查看您的所有相册</p>
        </router-link>
        
        <router-link to="/upload" class="action-card">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          <h3>上传照片</h3>
          <p>添加新的照片到相册</p>
        </router-link>
        
        <div class="action-card" @click="createNewAlbum">
          <div class="action-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          <h3>创建相册</h3>
          <p>创建新的相册</p>
        </div>
      </div>
    </section>

    <!-- 最近相册 -->
    <section class="recent-albums">
      <div class="section-header">
        <h2>最近相册</h2>
        <router-link to="/albums" class="view-all">查看全部</router-link>
      </div>
      
      <div v-if="loading" class="loading-section">
        <Loading text="加载中..." />
      </div>
      
      <div v-else-if="recentAlbums.length > 0" class="albums-preview">
        <AlbumCard 
          v-for="album in recentAlbums.slice(0, 3)" 
          :key="album.id" 
          :album="album"
          @click="selectAlbum(album)"
        />
      </div>
      
      <EmptyState 
        v-else 
        title="还没有相册"
        description="创建您的第一个相册，开始记录美好时光"
        icon="album"
        @action="createNewAlbum"
        action-text="创建相册"
      />
    </section>

    <!-- 创建相册表单 -->
    <AlbumForm 
      v-if="showCreateForm"
      @close="showCreateForm = false"
      @created="handleAlbumCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAlbumStore } from '@/stores/album'
import AlbumCard from '@/components/album/AlbumCard.vue'
import AlbumForm from '@/components/album/AlbumForm.vue'
import Loading from '@/components/layout/Loading.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
const albumStore = useAlbumStore()

const showCreateForm = ref(false)

// 计算属性
const albums = computed(() => albumStore.sortedAlbums)
const recentAlbums = computed(() => albums.value.slice(0, 3))
const albumCount = computed(() => albumStore.albumCount)
const loading = computed(() => albumStore.loading)

// 模拟数据（实际应该从API获取）
const totalPhotos = ref(0)
const recentUploads = ref(0)

// 方法
const createNewAlbum = () => {
  showCreateForm.value = true
}

const selectAlbum = (album) => {
  albumStore.setCurrentAlbum(album)
  router.push(`/album/${album.id}`)
}

const handleAlbumCreated = (newAlbum) => {
  albumStore.addAlbum(newAlbum)
  showCreateForm.value = false
}

// 生命周期
onMounted(() => {
  // 这里可以加载首页统计数据
  // 暂时使用模拟数据
  totalPhotos.value = 156
  recentUploads.value = 12
})
</script>

<style scoped>
.home {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-lg);
}

/* 欢迎区域 */
.welcome-section {
  background: url('/family.jpg');
  background-size: 100% 150%;
  background-position: center 30%;
  background-repeat: no-repeat;
  background-color: #f8f9fa;
  border-radius: 20px;
  padding: var(--spacing-3xl) var(--spacing-xl);
  margin-bottom: var(--spacing-3xl);
  text-align: center;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  animation: fadeIn 1s ease-in-out;
  min-height: 500px;
  height: auto;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
  pointer-events: none;
}

.welcome-content {
  position: relative;
  z-index: 1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.9),
    0 0 20px rgba(0, 0, 0, 0.6),
    0 0 8px rgba(255, 255, 255, 0.3);
  color: white;
}

.welcome-subtitle {
  font-size: 1.125rem;
  margin: 0 0 2rem 0;
  opacity: 0.95;
  line-height: 1.6;
  text-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 15px rgba(0, 0, 0, 0.6),
    0 0 6px rgba(255, 255, 255, 0.2);
  color: white;
}

.welcome-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: white;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.9),
    0 0 15px rgba(0, 0, 0, 0.6);
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
  color: white;
  text-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 10px rgba(0, 0, 0, 0.6);
}

/* 快速操作 */
.quick-actions {
  margin-bottom: var(--spacing-3xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.view-all {
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.view-all:hover {
  color: var(--color-heading);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-color: var(--color-border-hover);
}

.action-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #FEF3C7, #FED7AA);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}

.action-icon svg {
  width: 32px;
  height: 32px;
}

.action-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0 0 0.5rem 0;
}

.action-card p {
  font-size: 0.875rem;
  color: var(--color-text);
  margin: 0;
  opacity: 0.8;
}

/* 最近相册 */
.recent-albums {
  margin-bottom: var(--spacing-3xl);
}

.loading-section {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.albums-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .welcome-section {
    padding: var(--spacing-xl) var(--spacing-md);
    margin-bottom: var(--spacing-xl);
    background-position: center 15%;
    background-size: 100% auto;
    min-height: 400px;
  }
  
  .welcome-title {
    font-size: 2rem;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
  }
  
  .welcome-stats {
    gap: 2rem;
  }
  
  .action-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .albums-preview {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: var(--spacing-lg) var(--spacing-sm);
    min-height: 350px;
    background-position: center 10%;
  }
  
  .welcome-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .welcome-title {
    font-size: 1.75rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 