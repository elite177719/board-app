<template>
  <div class="card" style="max-width:400px;margin:40px auto;">
    <h2>로그인</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>아이디</label>
        <input v-model="username" type="text" autocomplete="username" required />
      </div>
      <div class="form-group">
        <label>비밀번호</label>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <button class="primary" type="submit" style="width:100%">로그인</button>
      <p v-if="error" class="error-text">{{ error }}</p>
    </form>
    <p class="muted" style="margin-top:14px;">
      계정이 없으신가요? <router-link to="/register">회원가입</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { login } from '../store/auth';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const route = useRoute();

async function handleSubmit() {
  error.value = '';
  try {
    await login(username.value, password.value);
    router.push(route.query.redirect || '/posts');
  } catch (e) {
    error.value = e.response?.data?.message || '로그인에 실패했습니다.';
  }
}
</script>
