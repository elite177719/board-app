<template>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
      <div>
        <h2 style="margin:0 0 6px;">셸 명령어 실행</h2>
        <p class="muted" style="margin:0;">⚠️ 관리자용 - 실제 셸 명령어를 실행합니다 (exec 사용)</p>
      </div>
      <span class="badge" style="background:#fee2e2;color:#b91c1c;">⚠️ Exec Enabled</span>
    </div>

    <form @submit.prevent="runCheck" style="margin-top:18px;">
      <div class="form-group">
        <label>cmd 입력 (실제 실행됨)</label>
        <input
          v-model="cmd"
          type="text"
          placeholder="예: ls -al / pwd / whoami"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      <button class="primary" type="submit">명령어 실행</button>
    </form>

    <div v-if="result" class="card" style="margin-top:16px;background:#f8fafc;border:1px solid #e5e7eb;box-shadow:none;">
      <strong :style="{ color: result.allowed ? '#15803d' : '#b91c1c' }">{{ result.allowed ? '✓ 실행됨' : '✗ 실패' }}</strong>
      <p style="margin:8px 0 0;">{{ result.message }}</p>
      <div v-if="result.command" style="margin-top:12px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:6px;">실행 명령</div>
        <pre style="margin:0;padding:10px 12px;background:#0f172a;color:#e2e8f0;border-radius:8px;overflow:auto;">{{ result.command }}</pre>
      </div>
      <div v-if="result.output !== undefined && result.output !== null" style="margin-top:12px;">
        <div style="font-size:12px;color:#64748b;margin-bottom:6px;">stdout</div>
        <pre style="margin:0;padding:10px 12px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;overflow:auto;white-space:pre-wrap;font-size:12px;">{{ result.output }}</pre>
      </div>
      <div v-if="result.stderr" style="margin-top:12px;">
        <div style="font-size:12px;color:#b91c1c;margin-bottom:6px;">stderr</div>
        <pre style="margin:0;padding:10px 12px;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;overflow:auto;white-space:pre-wrap;font-size:12px;">{{ result.stderr }}</pre>
      </div>
    </div>

    <div class="card" style="margin-top:16px;background:#fee2e2;border:1px solid #fecaca;box-shadow:none;">
      <strong>⚠️ 주의</strong>
      <ul style="margin:10px 0 0;padding-left:18px;line-height:1.7;font-size:13px;">
        <li>이는 개발/테스트 전용 기능입니다</li>
        <li>본 페이지는 관리자만 접근 가능합니다</li>
        <li>실제로 셸 명령어가 실행됩니다 (Node.js exec 사용)</li>
        <li>잘못된 명령어는 서버에 손상을 줄 수 있습니다</li>
      </ul>
    </div>

    <div class="card" style="margin-top:16px;">
      <strong>빠른 테스트</strong>
      <div class="chips">
        <button v-for="sample in samples" :key="sample" type="button" class="chip" @click="cmd = sample">{{ sample }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const cmd = ref('');
const result = ref(null);

const samples = [
  'pwd',
  'ls -al',
  'whoami',
  'date',
  'uname -a',
  'echo hello world',
];

async function runCheck() {
  const value = cmd.value.trim();

  if (!value) {
    result.value = {
      allowed: false,
      message: '입력값이 비어 있습니다.',
    };
    return;
  }

  try {
    // 백엔드의 /api/admin/exec 엔드포인트 호출
    const response = await fetch('/api/admin/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: value })
    });

    const data = await response.json();

    if (!response.ok) {
      result.value = {
        allowed: false,
        message: `오류: ${data.message || '명령어 실행 실패'}`,
        error: data.error,
        command: value,
      };
      return;
    }

    // 성공 시 실제 실행 결과 표시
    result.value = {
      allowed: true,
      command: value,
      output: data.stdout || data.stderr || '(결과 없음)',
      message: '명령어가 실제로 실행되었습니다.',
      stderr: data.stderr,
    };
  } catch (err) {
    result.value = {
      allowed: false,
      message: `네트워크 오류: ${err.message}`,
      command: value,
    };
  }
}
</script>
