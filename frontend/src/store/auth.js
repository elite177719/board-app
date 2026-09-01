import { reactive } from 'vue';
import http from '../api/http';

export const authState = reactive({
  user: null,
  loaded: false,
});

export async function fetchMe() {
  try {
    const { data } = await http.get('/auth/me');
    authState.user = data.user;
  } catch (e) {
    authState.user = null;
  } finally {
    authState.loaded = true;
  }
}

export async function login(username, password) {
  const { data } = await http.post('/auth/login', { username, password });
  authState.user = data.user;
}

export async function register(username, password) {
  const { data } = await http.post('/auth/register', { username, password });
  authState.user = data.user;
}

export async function logout() {
  await http.post('/auth/logout');
  authState.user = null;
}

export function isAdmin() {
  return authState.user && authState.user.role === 'ADMIN';
}
