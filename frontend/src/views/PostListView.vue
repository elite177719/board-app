<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h2 style="margin:0;">게시글 목록</h2>
      <router-link v-if="authState.user" to="/posts/new">
        <button class="primary">글쓰기</button>
      </router-link>
    </div>

    <div class="form-group" style="display:flex;gap:8px;">
      <input v-model="search" type="text" placeholder="제목 검색" @keyup.enter="load(1)" />
      <button class="secondary" @click="load(1)">검색</button>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th style="width:60px;">번호</th>
            <th>제목</th>
            <th style="width:120px;">작성자</th>
            <th style="width:140px;">작성일</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in items" :key="p.id" :class="{ notice: p.is_notice }">
            <td>{{ p.is_notice ? '공지' : p.id }}</td>
            <td>
              <span v-if="p.is_notice" class="badge">공지</span>
              <router-link :to="`/posts/${p.id}`">{{ p.title }}</router-link>
              <span class="muted"> ({{ p.comment_count }})</span>
            </td>
            <td>{{ p.author_name }}</td>
            <td>{{ formatDate(p.created_at) }}</td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="4" class="muted" style="text-align:center;padding:24px;">게시글이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button
        v-for="p in totalPages"
        :key="p"
        :class="{ active: p === page }"
        @click="load(p)"
      >{{ p }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import http from '../api/http';
import { authState } from '../store/auth';

const items = ref([]);
const page = ref(1);
const totalPages = ref(1);
const search = ref('');

async function load(p = 1) {
  const { data } = await http.get('/posts', { params: { page: p, limit: 10, search: search.value } });
  items.value = data.items;
  page.value = data.page;
  totalPages.value = data.totalPages;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('ko-KR');
}

onMounted(() => load(1));
</script>
