# 家庭相册管理系统 📷

一个现代化的家庭相册管理系统前端，专为记录和分享珍贵家庭时光而设计。

![家庭相册](./public/family.jpg)

## ✨ 功能特性

### 📸 照片管理
- **智能上传**: 支持批量照片上传，实时上传进度显示
- **高质量预览**: 缩略图和原图双重显示，支持全屏查看
- **便捷导航**: 键盘快捷键支持（Enter进入全屏，ESC退出，A/D或箭头键切换）
- **安全删除**: 带确认弹窗的照片删除功能

### 📁 相册组织
- **灵活分类**: 创建和管理多个主题相册
- **封面设置**: 自定义相册封面图片
- **标签系统**: 为相册添加标签便于分类
- **快速搜索**: 按名称和标签搜索相册

### 🎨 用户体验
- **现代设计**: 温馨的家庭风格界面设计
- **响应式布局**: 完美适配桌面、平板和手机设备
- **直观操作**: 拖拽上传、悬停显示、一键操作
- **主题支持**: 亮色/暗色主题切换

### 🔧 技术特性
- **高性能**: 虚拟滚动、图片懒加载、缓存优化
- **渐进式**: PWA支持，离线可用
- **类型安全**: TypeScript支持，减少运行时错误
- **模块化**: 组件化开发，易于维护和扩展

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式JavaScript框架
- **Vue Router** - 官方路由管理器
- **Pinia** - 现代状态管理库

### 构建工具
- **Vite** - 极速的前端构建工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

### 样式技术
- **CSS3** - 现代CSS特性
- **CSS Variables** - 主题系统
- **Flexbox & Grid** - 响应式布局

### 开发体验
- **Hot Module Replacement** - 热模块替换
- **TypeScript 支持** - 类型检查
- **组件化开发** - 可复用组件

## 📦 安装说明

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/your-username/family-album-frontend.git
cd family-album-frontend
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **打开浏览器**
访问 `http://localhost:5173` 查看应用

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🚀 使用指南

### 基本操作

#### 1. 创建相册
1. 点击首页的"创建相册"按钮
2. 填写相册名称和描述
3. 可选择上传封面图片
4. 添加标签便于分类
5. 点击"创建"完成

#### 2. 上传照片
1. 进入目标相册
2. 点击"上传照片"按钮
3. 选择或拖拽照片文件
4. 等待上传完成

#### 3. 查看和管理照片
1. 点击照片进入全屏查看模式
2. 使用键盘快捷键导航：
   - `Enter`: 进入全屏
   - `ESC`: 退出全屏/关闭查看器
   - `←/→` 或 `A/D`: 切换照片
3. 悬停在照片上显示操作按钮
4. 点击删除按钮可删除照片

#### 4. 相册管理
1. 在相册列表中查看所有相册
2. 点击相册进入详情页
3. 使用搜索功能快速找到相册

### 高级功能

#### 键盘快捷键
- `Enter`: 进入全屏查看
- `ESC`: 退出全屏或关闭当前视图
- `←/→`: 在照片间导航
- `A/D`: 在照片间导航（游戏化操作）

#### 响应式特性
- **桌面端**: 完整功能体验
- **平板端**: 触摸优化界面
- **手机端**: 紧凑布局，手势操作

## 📁 项目结构

```
FrontEnd/
├── public/                 # 静态资源
│   ├── favicon.svg        # 网站图标
│   ├── moon.jpg          # Logo图片
│   └── family.jpg        # 背景图片
├── src/
│   ├── assets/           # 样式资源
│   │   ├── base.css      # 基础样式
│   │   ├── main.css      # 主样式
│   │   └── variables.css # CSS变量
│   ├── components/       # 可复用组件
│   │   ├── album/        # 相册相关组件
│   │   ├── photo/        # 照片相关组件
│   │   ├── layout/       # 布局组件
│   │   └── common/       # 通用组件
│   ├── views/            # 页面组件
│   ├── router/           # 路由配置
│   ├── stores/           # 状态管理
│   ├── services/         # API服务
│   └── utils/            # 工具函数
├── package.json          # 项目配置
├── vite.config.js        # Vite配置
└── README.md            # 项目说明
```

## 🔧 配置说明

### API配置
编辑 `src/utils/config.js` 文件：

```javascript
export const ConfigService = {
  fileServerUrl: 'http://localhost:3000/api', // API服务器地址
  uploadConfig: {
    timeout: 30000,           // 上传超时时间
    maxFileSize: 10 * 1024 * 1024, // 最大文件大小 (10MB)
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'] // 允许的文件类型
  }
}
```

### 样式定制
主要样式变量在 `src/assets/variables.css`：

```css
:root {
  --color-primary: #FEF3C7;      /* 主色调 */
  --color-secondary: #FED7AA;    /* 次要色调 */
  --color-background: #ffffff;   /* 背景色 */
  --color-text: #374151;         /* 文字色 */
  /* ... 更多变量 */
}
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork 项目**
2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交更改**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **创建 Pull Request**

### 开发规范

#### 代码风格
- 使用 ESLint 和 Prettier 保持代码风格一致
- 遵循 Vue 3 Composition API 最佳实践
- 组件名使用 PascalCase
- 文件名使用 kebab-case

#### 提交信息
使用语义化提交信息：
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 其他更改

#### 组件开发
```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 使用 Composition API
import { ref, computed } from 'vue'

// Props定义
const props = defineProps({
  // props定义
})

// 事件定义
const emit = defineEmits(['event-name'])

// 响应式数据
const data = ref('')

// 计算属性
const computed = computed(() => {
  // 计算逻辑
})

// 方法
const method = () => {
  // 方法实现
}
</script>

<style scoped>
/* 组件样式 */
</style>
```

## 🐛 问题报告

如果您发现了问题，请通过以下方式报告：

1. 检查现有 [Issues](https://github.com/your-username/family-album-frontend/issues) 避免重复
2. 使用 Issue 模板创建新问题
3. 提供详细的重现步骤
4. 包含系统环境信息

### Issue 模板

```markdown
## 问题描述
简要描述遇到的问题

## 重现步骤
1. 进入...
2. 点击...
3. 看到错误...

## 期望行为
描述您期望发生的情况

## 实际行为
描述实际发生的情况

## 环境信息
- 操作系统: [例如 Windows 10]
- 浏览器: [例如 Chrome 91]
- Node.js版本: [例如 16.14.0]
```

## 📄 许可证

本项目采用 GPL-3.0 许可证 - 查看 [LICENSE.md](LICENSE.md) 文件了解详细信息。

### GPL-3.0 许可证要点

- ✅ **自由使用**: 可以自由运行程序
- ✅ **查看源码**: 可以获取和查看源代码
- ✅ **修改程序**: 可以修改程序以满足需求
- ✅ **分发副本**: 可以分发程序副本
- ✅ **分发修改**: 可以分发修改后的版本

- ⚠️ **开源要求**: 分发时必须提供源代码
- ⚠️ **许可证继承**: 衍生作品必须使用相同许可证
- ⚠️ **版权声明**: 必须保留原始版权声明

## 🙏 致谢

感谢以下开源项目和贡献者：

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - Vue的状态管理库
- 所有为项目贡献代码、报告问题和提供建议的开发者

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/family-album-frontend)
- 问题反馈: [GitHub Issues](https://github.com/your-username/family-album-frontend/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-username/family-album-frontend/discussions)

## 🎯 路线图

### 即将发布的功能

- [ ] 照片批量编辑功能
- [ ] 相册分享功能
- [ ] 照片元数据显示（EXIF信息）
- [ ] 高级搜索过滤器
- [ ] 照片标签系统
- [ ] 幻灯片播放模式

### 长期规划

- [ ] 移动端原生应用
- [ ] 云存储集成
- [ ] AI智能分类
- [ ] 人脸识别功能
- [ ] 多语言支持
- [ ] 团队协作功能

---

**俊宝世家** - 让每一个珍贵时刻都值得被记录和分享 ❤️

[![GPL License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE.md)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.x-646CFF.svg)](https://vitejs.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
