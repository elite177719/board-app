<template>
  <div class="card">
    <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>제목</label>
        <input v-model="title" type="text" maxlength="200" required />
      </div>
      <div class="form-group">
        <label>내용</label>
        <textarea v-model="content" required></textarea>
      </div>
      <div class="form-group" v-if="isAdmin()">
        <label>
          <input type="checkbox" v-model="isNotice" style="width:auto;margin-right:6px;" />
          공지글로 등록
        </label>
      </div>
      <div class="form-group" v-if="!isEdit">
        <label>첨부파일 (이미지/PDF/TXT, 최대 3개, 파일당 10MB)</label>
        <input type="file" multiple accept="image/*,application/pdf,text/plain" @change="onFileChange" />
      </div>
      <button class="primary" type="submit">{{ isEdit ? '수정 완료' : '등록' }}</button>
      <p v-if="error" class="error-text">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '../api/http';
import { isAdmin } from '../store/auth';

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const title = ref('');
const content = ref('');
const isNotice = ref(false);
const files = ref([]);
const error = ref('');

function onFileChange(e) {
  files.value = Array.from(e.target.files).slice(0, 3);
}

async function loadExisting() {
  if (!isEdit.value) return;
  const { data } = await http.get(`/posts/${route.params.id}`);
  title.value = data.post.title;
  content.value = data.post.content;
  isNotice.value = !!data.post.is_notice;
}

async function handleSubmit() {
  error.value = '';
  try {
    if (isEdit.value) {
      await http.patch(`/posts/${route.params.id}`, {
        title: title.value,
        content: content.value,
        isNotice: isNotice.value,
      });
      router.push(`/posts/${route.params.id}`);
    } else {
      const form = new FormData();
      form.append('title', title.value);
      form.append('content', content.value);
      form.append('isNotice', String(isNotice.value));
      files.value.forEach((f) => form.append('files', f));
      const { data } = await http.post('/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push(`/posts/${data.id}`);
    }
  } catch (e) {
    error.value = e.response?.data?.message || '저장 중 오류가 발생했습니다.';
  }
}

onMounted(loadExisting);
</script>
