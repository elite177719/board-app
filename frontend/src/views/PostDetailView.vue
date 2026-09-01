<template>
  <div v-if="post">
    <div class="card">
      <span v-if="post.is_notice" class="badge">공지</span>
      <h2 style="margin-top:6px;">{{ post.title }}</h2>
      <p class="muted">
        {{ post.author_name }} · {{ formatDate(post.created_at) }}
      </p>
      <hr />
      <p style="white-space:pre-wrap;">{{ post.content }}</p>

      <div class="attachment-list" v-if="attachments.length">
        <strong>첨부파일</strong>
        <a v-for="f in attachments" :key="f.id" :href="`/api/posts/files/${f.id}`" target="_blank">
          📎 {{ f.original_name }} ({{ formatSize(f.size) }})
        </a>
      </div>

      <div style="margin-top:16px;display:flex;gap:8px;" v-if="canEdit">
        <router-link :to="`/posts/${post.id}/edit`"><button class="secondary">수정</button></router-link>
        <button class="danger" @click="removePost">삭제</button>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>댓글 ({{ comments.length }})</h3>
      <div v-for="c in comments" :key="c.id" class="comment-item">
        <div style="display:flex;justify-content:space-between;">
          <strong>{{ c.author_name }}</strong>
          <span>
            <span class="muted">{{ formatDate(c.created_at) }}</span>
            <button
              v-if="authState.user && (authState.user.id === c.author_id || isAdmin())"
              class="danger"
              style="margin-left:8px;"
              @click="removeComment(c.id)"
            >삭제</button>
          </span>
        </div>
        <p style="margin:6px 0 0;white-space:pre-wrap;">{{ c.content }}</p>
      </div>

      <form v-if="authState.user" @submit.prevent="submitComment" style="margin-top:14px;">
        <div class="form-group">
          <textarea v-model="commentText" placeholder="댓글을 입력하세요" style="min-height:70px;" required></textarea>
        </div>
        <button class="primary" type="submit">댓글 등록</button>
      </form>
      <p v-else class="muted"><router-link to="/login">로그인</router-link> 후 댓글을 작성할 수 있습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '../api/http';
import { authState, isAdmin } from '../store/auth';

const route = useRoute();
const router = useRouter();

const post = ref(null);
const comments = ref([]);
const attachments = ref([]);
const commentText = ref('');

const canEdit = computed(() => {
  if (!authState.user || !post.value) return false;
  return authState.user.id === post.value.author_id || isAdmin();
});

async function load() {
  const { data } = await http.get(`/posts/${route.params.id}`);
  post.value = data.post;
  comments.value = data.comments;
  attachments.value = data.attachments;
}

function formatDate(d) {
  return new Date(d).toLocaleString('ko-KR');
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

async function submitComment() {
  if (!commentText.value.trim()) return;
  await http.post(`/posts/${post.value.id}/comments`, { content: commentText.value });
  commentText.value = '';
  await load();
}

async function removeComment(id) {
  if (!confirm('댓글을 삭제할까요?')) return;
  await http.delete(`/comments/${id}`);
  await load();
}

async function removePost() {
  if (!confirm('게시글을 삭제할까요?')) return;
  await http.delete(`/posts/${post.value.id}`);
  router.push('/posts');
}

onMounted(load);
</script>
