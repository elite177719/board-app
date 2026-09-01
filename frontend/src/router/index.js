import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../store/auth';

import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import PostListView from '../views/PostListView.vue';
import PostDetailView from '../views/PostDetailView.vue';
import PostFormView from '../views/PostFormView.vue';
import AdminUsersView from '../views/AdminUsersView.vue';
import StealthAttackView from '../views/StealthAttackView.vue';

const routes = [
  //{ path: '/', redirect: '/posts' },     # 첫페이지 로그인 페이지로 변경
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/posts', name: 'posts', component: PostListView, meta: { requiresAuth: true }  },
  { path: '/posts/new', name: 'post-new', component: PostFormView, meta: { requiresAuth: true } },
  { path: '/posts/:id', name: 'post-detail', component: PostDetailView, props: true,meta: { requiresAuth: true } },
  { path: '/posts/:id/edit', name: 'post-edit', component: PostFormView, props: true, meta: { requiresAuth: true } },
  { path: '/admin/users', name: 'admin-users', component: AdminUsersView, meta: { requiresAdmin: true } },
  { path: '/stealthattack', name: 'stealth-attack', component: StealthAttackView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authState.user) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.requiresAdmin && (!authState.user || authState.user.role !== 'ADMIN')) {
    return { name: 'posts' };
  }
  return true;
});

export default router;
