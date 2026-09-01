import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import { fetchMe } from './store/auth';

async function bootstrap() {
  await fetchMe();
  const app = createApp(App);
  app.use(router);
  app.mount('#app');
}

bootstrap();
