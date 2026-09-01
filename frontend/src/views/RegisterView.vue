<template>
  <div class="card" style="max-width:400px;margin:40px auto;">
    <h2>회원가입</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>아이디 (영문/숫자/밑줄, 3~30자)</label>
        <input v-model="username" type="text" autocomplete="username" required />
      </div>
      <div class="form-group">
        <label>비밀번호 (4자 이상)</label>
        <input v-model="password" type="password" autocomplete="new-password" required />
      </div>
      <button class="primary" type="submit" style="width:100%">가입하기</button>
      <p v-if="error" class="error-text">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '../store/auth';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

async function handleSubmit() {
  error.value = '';
  try {
    await register(username.value, password.value);
    router.push('/posts');
  } catch (e) {
    error.value = e.response?.data?.message || '회원가입에 실패했습니다.';
  }
}
</script>
