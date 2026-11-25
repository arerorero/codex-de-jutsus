import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import CodexView from './views/CodexView.vue';
import JutsusView from './views/JutsusView.vue';
import JutsuForm from './views/JutsuForm.vue';
import SelosView from './views/SelosView.vue';
import PersonagensView from './views/PersonagensView.vue';
import PersonagemFicha from './views/PersonagemFicha.vue';
import './style.css';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: CodexView, meta: { titulo: 'Consultar Codex' } },
    { path: '/jutsus', component: JutsusView, meta: { titulo: 'Jutsus' } },
    { path: '/jutsus/novo', component: JutsuForm, meta: { titulo: 'Novo Jutsu' } },
    { path: '/jutsus/:id', component: JutsuForm, props: true, meta: { titulo: 'Editar Jutsu' } },
    { path: '/selos', component: SelosView, meta: { titulo: 'Dicionário de Selos' } },
    { path: '/personagens', component: PersonagensView, meta: { titulo: 'Personagens' } },
    { path: '/personagens/:id', component: PersonagemFicha, props: true, meta: { titulo: 'Ficha do Personagem' } },
  ],
});

router.afterEach((to) => {
  document.title = `${to.meta.titulo ?? ''} · Codex de Jutsus`;
});

createApp(App).use(router).mount('#app');
