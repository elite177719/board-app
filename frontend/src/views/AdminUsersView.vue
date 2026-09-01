<template>
  <div class="card">
    <h2>회원 관리</h2>
    <p v-if="errorMessage" class="muted" style="color:#b00020;">{{ errorMessage }}</p>
    <table>
      <thead>
        <tr>
          <th style="width:60px;">ID</th>
          <th>아이디</th>
          <th style="width:100px;">권한</th>
          <th style="width:170px;">잠금 상태</th>
          <th style="width:120px;">관리</th>
          <th style="width:160px;">가입일</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in items" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.role === 'ADMIN' ? '관리자' : '일반' }}</td>
          <td>
            <span v-if="u.lock && u.lock.locked">
              잠김 ({{ u.lock.retryAfter }}초)
            </span>
            <span v-else>
              정상
            </span>
          </td>
          <td>
            <button
              class="secondary"
              :disabled="!u.lock || !u.lock.locked || unlockingUsername === u.username"
              @click="unlockUser(u.username)"
            >
              {{ unlockingUsername === u.username ? '처리 중...' : '잠금 해제' }}
            </button>
          </td>
          <td>{{ formatDate(u.created_at) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '../api/http';

const items = ref([]);
const errorMessage = ref('');
const unlockingUsername = ref('');

async function loadUsers() {
  const { data } = await http.get('/admin/users');
  items.value = data.items;
}

function formatDate(d) {
  return new Date(d).toLocaleString('ko-KR');
}

async function unlockUser(username) {
  if (!confirm(`${username} 계정 잠금을 해제할까요?`)) return;

  try {
    errorMessage.value = '';
    unlockingUsername.value = username;
    await http.post(`/admin/users/${encodeURIComponent(username)}/unlock`);
    await loadUsers();
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || '잠금 해제 요청에 실패했습니다.';
  } finally {
    unlockingUsername.value = '';
  }
}

onMounted(async () => {
  try {
    await loadUsers();
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || '회원 목록을 불러오지 못했습니다.';
  }
});
</script>
