<template>
  <div>
    <header class="navbar">
      <router-link class="brand" to="/posts">로그인 게시판</router-link>
      <nav>
        <router-link to="/posts">게시글</router-link>
        <router-link to="/stealthattack">보안 테스트</router-link>
        <template v-if="authState.user">
          <router-link v-if="isAdmin()" to="/admin/users">회원관리</router-link>
          <span class="muted" style="color:#e5e7eb">{{ authState.user.username }}님</span>
          <button @click="handleLogout">로그아웃</button>
        </template>
        <template v-else>
          <router-link to="/login">로그인</router-link>
          <router-link to="/register">회원가입</router-link>
        </template>
      </nav>
    </header>
    <div class="container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { authState, logout, isAdmin } from './store/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

async function handleLogout() {
  await logout();
  router.push('/login');
}
</script>
