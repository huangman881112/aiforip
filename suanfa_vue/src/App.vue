<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from './stores/user.js'
import { algorithmCategories } from './data/algorithms.js'
import { languageMenu } from './data/languages.js'

const userStore = useUserStore()
const route = useRoute()

// 算法相关子菜单：分类清单来自 data/algorithms.js，新增分类时这里自动出现
const algorithmMenu = [
  ...algorithmCategories.map((c) => ({ label: c.label, to: c.to })),
  { label: '算法训练', to: '/training' },
]

const algoMenuOpen = ref(false)
const algoMenuItemRef = ref(null)

// 计算机语言子菜单：清单来自 data/languages.js，新增语言时这里自动出现
const langMenuOpen = ref(false)
const langMenuItemRef = ref(null)

// 用户（个人中心）子菜单：登录后点开可看到「修改密码」等入口
const userMenuOpen = ref(false)
const userMenuItemRef = ref(null)

// 当前是否处于算法相关页面（用于一级菜单高亮）
const isAlgorithmSection = computed(() =>
  algorithmMenu.some((item) => isActive(item.to))
)

// 当前是否处于计算机语言相关页面（一级菜单高亮）
const isLanguageSection = computed(() => isActive('/languages'))

// 当前是否处于个人中心相关页面（/account、/admin 都算管理员/个人中心子菜单高亮）
const isAccountSection = computed(() => isActive('/account') || isActive('/admin'))

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function toggleAlgoMenu() {
  algoMenuOpen.value = !algoMenuOpen.value
  userMenuOpen.value = false
}

function closeAlgoMenu() {
  algoMenuOpen.value = false
}

function toggleLangMenu() {
  langMenuOpen.value = !langMenuOpen.value
  algoMenuOpen.value = false
  userMenuOpen.value = false
}

function closeLangMenu() {
  langMenuOpen.value = false
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
  algoMenuOpen.value = false
  langMenuOpen.value = false
}

function closeUserMenu() {
  userMenuOpen.value = false
}

function onDocumentClick(e) {
  if (algoMenuOpen.value && algoMenuItemRef.value && !algoMenuItemRef.value.contains(e.target)) {
    closeAlgoMenu()
  }
  if (langMenuOpen.value && langMenuItemRef.value && !langMenuItemRef.value.contains(e.target)) {
    closeLangMenu()
  }
  if (userMenuOpen.value && userMenuItemRef.value && !userMenuItemRef.value.contains(e.target)) {
    closeUserMenu()
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    closeAlgoMenu()
    closeLangMenu()
    closeUserMenu()
  }
}

onMounted(() => {
  userStore.init()
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})

// 路由切换后关闭下拉
watch(() => route.fullPath, () => {
  closeAlgoMenu()
  closeLangMenu()
  closeUserMenu()
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1><router-link to="/" class="logo">小白学算法</router-link></h1>
        <nav class="app-nav">
          <ul>
            <li><router-link to="/">首页</router-link></li>
            <li class="nav-dropdown" ref="algoMenuItemRef">
              <a
                href="#"
                class="nav-dropbtn"
                :class="{ 'active-link': isAlgorithmSection }"
                :aria-expanded="algoMenuOpen ? 'true' : 'false'"
                aria-haspopup="true"
                @click.prevent="toggleAlgoMenu"
              >
                算法<span class="caret" :class="{ open: algoMenuOpen }">▾</span>
              </a>
              <ul class="dropdown-menu" v-show="algoMenuOpen">
                <li v-for="item in algorithmMenu" :key="item.to">
                  <router-link
                    :to="item.to"
                    :class="{ 'active-link': isActive(item.to) }"
                    @click="closeAlgoMenu"
                  >{{ item.label }}</router-link>
                </li>
              </ul>
            </li>
            <li class="nav-dropdown" ref="langMenuItemRef">
              <a
                href="#"
                class="nav-dropbtn"
                :class="{ 'active-link': isLanguageSection }"
                :aria-expanded="langMenuOpen ? 'true' : 'false'"
                aria-haspopup="true"
                @click.prevent="toggleLangMenu"
              >
                计算机语言<span class="caret" :class="{ open: langMenuOpen }">▾</span>
              </a>
              <ul class="dropdown-menu" v-show="langMenuOpen">
                <li v-for="item in languageMenu" :key="item.to">
                  <router-link
                    :to="item.to"
                    :class="{ 'active-link': isActive(item.to) }"
                    @click="closeLangMenu"
                  >{{ item.label }}</router-link>
                </li>
              </ul>
            </li>
            <li><router-link to="/calendar" active-class="active-link">学习日历</router-link></li>
            <li><router-link to="/ai" active-class="active-link">AI 助教</router-link></li>
            <li><router-link to="/progress" active-class="active-link">我的进度</router-link></li>
            <li class="nav-auth">
              <template v-if="userStore.isLoggedIn">
                <div class="nav-dropdown nav-user-wrap" ref="userMenuItemRef">
                  <a
                    href="#"
                    class="nav-dropbtn nav-user-btn"
                    :class="{ 'active-link': isAccountSection }"
                    :aria-expanded="userMenuOpen ? 'true' : 'false'"
                    aria-haspopup="true"
                    @click.prevent="toggleUserMenu"
                  >
                    <span class="nav-user-name">{{ userStore.user.username }}</span>
                    <span v-if="userStore.isAdmin" class="nav-user-tag">管理员</span>
                    <span class="caret" :class="{ open: userMenuOpen }">▾</span>
                  </a>
                  <ul class="dropdown-menu nav-user-menu" v-show="userMenuOpen">
                    <li>
                      <router-link
                        to="/account/password"
                        :class="{ 'active-link': isActive('/account/password') }"
                        @click="closeUserMenu"
                      >修改密码</router-link>
                    </li>
                    <template v-if="userStore.isAdmin">
                      <li class="menu-divider" role="separator"></li>
                      <li class="menu-group">管理员</li>
                      <li>
                        <router-link
                          to="/admin/users"
                          :class="{ 'active-link': isActive('/admin') }"
                          @click="closeUserMenu"
                        >用户管理</router-link>
                      </li>
                      <li>
                        <router-link to="/ai" @click="closeUserMenu">AI 中转站配置</router-link>
                      </li>
                    </template>
                  </ul>
                </div>
                <a href="#" class="nav-logout" @click.prevent="userStore.logout()">退出</a>
              </template>
              <router-link v-else to="/login" class="nav-login" active-class="active-link">登录</router-link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <router-view></router-view>
    </main>
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <h3>小白学算法</h3>
          <p>致力于提供高质量的算法学习资源，帮助开发者掌握各类算法的原理和应用。</p>
        </div>
        <div class="footer-links">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/algorithms">算法总览</router-link></li>
            <li><router-link to="/languages">计算机语言</router-link></li>
            <li><router-link to="/training">算法训练</router-link></li>
            <li><router-link to="/ai">AI 助教</router-link></li>
            <li><router-link to="/about">关于我们</router-link></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>联系我们</h4>
          <p>有任何问题或建议，请随时联系我们。</p>
          <!-- 这里可以添加社交媒体图标或联系方式 -->
        </div>
      </div>
      <div class="footer-copyright">
        <p>© 2023 小白学算法. 保留所有权利.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  /* 背景由 body 提供（深色画布 + 品牌色微光），此处保持透明以免遮挡 */
  background-color: transparent;
}

.app-header {
  background-color: var(--nav-bg-sticky);
  backdrop-filter: var(--nav-backdrop-blur);
  -webkit-backdrop-filter: var(--nav-backdrop-blur);
  border-bottom: 1px solid var(--nav-border);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--nav-shadow);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 20px;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.2;
  text-align: left;
  white-space: nowrap;
}

.logo {
  color: var(--nav-logo-start);
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  display: inline-block;
}

/* 主色渐变 Logo（不支持 background-clip 时自动回退为单色） */
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .logo {
    background-image: linear-gradient(120deg, var(--nav-logo-start), var(--nav-logo-end));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
    letter-spacing: 0.5px;
    transition: filter var(--nav-transition);
  }

  .logo:hover {
    filter: brightness(0.9);
  }
}

.app-nav {
  margin: 0;
}

.app-nav ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.app-nav a {
  color: var(--nav-text);
  text-decoration: none;
  padding: 8px 12px;
  font-size: 0.95em;
  border-radius: var(--nav-radius);
  display: inline-block;
  transition: background-color var(--nav-transition), color var(--nav-transition),
    box-shadow var(--nav-transition);
  white-space: nowrap;
}

.app-nav a:hover {
  background-color: var(--nav-hover-bg);
  color: var(--nav-text-hover);
}

.app-nav a.active-link {
  background-color: var(--nav-active-bg);
  color: var(--nav-active-text);
  font-weight: 600;
}

/* 一级菜单：不用底色，改用主色文字 + 底部指示条，与 hover 态拉开层次 */
.app-nav > ul > li:not(.nav-auth) > a {
  position: relative;
}

.app-nav > ul > li:not(.nav-auth) > a.active-link {
  background-color: transparent;
}

.app-nav > ul > li:not(.nav-auth) > a.active-link:hover {
  background-color: var(--nav-hover-bg);
}

.app-nav > ul > li:not(.nav-auth) > a.active-link::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 2px;
  height: 2px;
  border-radius: 2px;
  background-color: var(--nav-accent);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding-left: 16px;
  border-left: 1px solid var(--nav-divider);
}

/* 登录按钮：主色胶囊，与导航文字区分 */
.app-nav .nav-login {
  background-color: var(--nav-auth-btn-bg);
  color: var(--nav-auth-btn-text);
  font-weight: 600;
  padding: 7px 18px;
  border-radius: 999px;
  box-shadow: 0 2px 8px var(--nav-accent-soft);
}

.app-nav .nav-login:hover,
.app-nav .nav-login.active-link {
  background-color: var(--nav-auth-btn-bg-hover);
  color: var(--nav-auth-btn-text);
}

/* 算法下拉菜单 */
.nav-dropdown {
  position: relative;
}

.app-nav .nav-dropbtn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.caret {
  font-size: 0.75em;
  line-height: 1;
  color: var(--nav-caret);
  transition: transform var(--nav-transition), color var(--nav-transition);
}

.caret.open {
  transform: rotate(180deg);
  color: var(--nav-accent);
}

.app-nav ul.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  display: block;
  flex-direction: column;
  gap: 2px;
  min-width: 148px;
  margin: 0;
  padding: 6px;
  list-style-type: none;
  background-color: var(--nav-menu-bg);
  border: 1px solid var(--nav-menu-border);
  border-radius: var(--nav-radius-menu);
  box-shadow: var(--nav-menu-shadow);
  z-index: 200;
}

/* 防止菜单上沿 hover 间隙造成误关闭（仅辅助，开关以点击为主） */
.dropdown-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 8px;
}

.dropdown-menu li {
  margin: 0;
}

.app-nav ul.dropdown-menu a {
  position: relative;
  display: block;
  padding: 8px 12px 8px 18px;
  border-radius: var(--nav-radius);
  color: var(--nav-text);
}

.app-nav ul.dropdown-menu a:hover {
  background-color: var(--nav-menu-hover-bg);
  color: var(--nav-text-hover);
}

.app-nav ul.dropdown-menu a.active-link {
  background-color: var(--nav-menu-active-bg);
  color: var(--nav-active-text);
}

/* 子菜单选中项：左侧主色指示条 */
.app-nav ul.dropdown-menu a.active-link::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  border-radius: 2px;
  background-color: var(--nav-menu-indicator);
}

/* 个人中心下拉（登录后顶部的用户名） */
.nav-user-wrap {
  display: flex;
  align-items: center;
}

.app-nav .nav-user-btn {
  font-size: 0.9rem;
  color: var(--nav-text-muted);
  max-width: 180px;
}

.nav-user-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-user-tag {
  font-size: 0.7rem;
  line-height: 1;
  padding: 3px 6px;
  border-radius: 999px;
  background-color: var(--nav-active-bg);
  color: var(--nav-active-text);
}

/* 靠右边栏对齐，避免菜单超出视口 */
.app-nav ul.dropdown-menu.nav-user-menu {
  left: auto;
  right: 0;
  min-width: 168px;
}

.app-nav ul.dropdown-menu .menu-divider {
  height: 1px;
  margin: 4px 6px;
  background-color: var(--nav-menu-border);
}

.app-nav ul.dropdown-menu .menu-group {
  padding: 6px 18px 2px;
  font-size: 0.72rem;
  letter-spacing: 0.5px;
  color: var(--nav-text-muted);
}

.nav-logout {
  color: var(--nav-link-plain);
  text-decoration: none;
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: var(--nav-radius);
  transition: background-color var(--nav-transition), color var(--nav-transition);
}

.nav-logout:hover {
  background-color: var(--nav-hover-bg);
  color: var(--nav-link-plain-hover);
}

.app-main {
  flex: 1;
  margin: 0 auto;
  width: 100%;
  background-color: transparent;
}

.app-footer {
  background-color: var(--footer-bg);
  color: var(--footer-text);
  padding: 40px 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 20px;
  border-bottom: 1px solid var(--footer-border);
}

.footer-logo,
.footer-links,
.footer-contact {
  flex: 1;
  margin-right: 30px;
}

/* 窄屏下三栏堆叠，避免页脚被挤成一竖条 */
@media (max-width: 720px) {
  .footer-content {
    flex-direction: column;
    gap: 22px;
  }

  .footer-logo,
  .footer-links,
  .footer-contact {
    margin-right: 0;
  }
}

.footer-logo h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: var(--footer-title);
}

.footer-logo p {
  color: var(--footer-text);
  line-height: 1.6;
}

.footer-links h4,
.footer-contact h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.footer-links ul {
  list-style-type: none;
  padding: 0;
  /* 4 条入口挤成两列（窄屏自动回退到一列），页脚不会被拉得很长 */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(130px, 100%), 1fr));
  column-gap: 18px;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: var(--footer-text);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--footer-text-strong);
}

.footer-contact p {
  color: var(--footer-text);
  margin-bottom: 15px;
}

.footer-copyright {
  text-align: center;
  padding-top: 20px;
  color: var(--footer-text);
  font-size: 0.9rem;
}

.vue-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--surface);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
</style>
