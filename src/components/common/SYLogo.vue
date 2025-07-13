<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 100 100" 
    xmlns="http://www.w3.org/2000/svg"
    class="sy-logo"
  >
    <!-- 圆形背景 -->
    <circle 
      cx="50" 
      cy="50" 
      r="48" 
      :fill="backgroundColor"
      stroke="none"
    />
    
    <!-- 渐变定义 -->
    <defs>
      <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" :style="`stop-color:${gradientStart};stop-opacity:1`" />
        <stop offset="100%" :style="`stop-color:${gradientEnd};stop-opacity:1`" />
      </linearGradient>
    </defs>
    
    <!-- S 字母 -->
    <path 
      d="M25 25 
         C25 20, 30 15, 35 15 
         L40 15 
         C45 15, 50 20, 50 25 
         C50 30, 45 35, 40 35 
         L35 35 
         C30 35, 25 40, 25 45 
         C25 50, 30 55, 35 55 
         L45 55 
         C50 55, 50 50, 50 50"
      :stroke="textColor"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    
    <!-- Y 字母 -->
    <path 
      d="M55 15 
         L65 35 
         L75 15 
         M65 35 
         L65 55"
      :stroke="textColor"
      stroke-width="4"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: [String, Number],
    default: 40
  },
  backgroundColor: {
    type: String,
    default: '#FEF3C7'
  },
  textColor: {
    type: String,
    default: '#374151'
  },
  gradientStart: {
    type: String,
    default: '#FEF3C7'
  },
  gradientEnd: {
    type: String,
    default: '#FED7AA'
  }
})
</script>

<style scoped>
.sy-logo {
  transition: all 0.3s ease;
}

.sy-logo:hover {
  transform: scale(1.05);
}
</style> 