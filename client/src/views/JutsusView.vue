<!-- UC02 – Gerenciar Jutsus (lista) -->
<template>
  <div class="head">
    <div>
      <h1>Jutsus</h1>
      <p class="muted">Técnicas cadastradas e as frases de selos que as ativam.</p>
    </div>
    <RouterLink to="/jutsus/novo" class="btn primary">+ Novo Jutsu</RouterLink>
  </div>

  <div v-if="msg" class="alert" :class="msg.tipo" style="margin-bottom: 14px">{{ msg.texto }}</div>

  <div class="card" style="padding: 6px 8px">
    <table v-if="jutsus.length">
      <thead>
        <tr><th>Nome</th><th>Sequência</th><th>Elemento</th><th>Raridade</th><th>Personagens</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="j in jutsus" :key="j.id">
          <td><RouterLink :to="`/jutsus/${j.id}`" style="color: var(--ink); font-weight: 600">{{ j.nome }}</RouterLink></td>
          <td><Sequencia :selos="j.sequencia" /></td>
          <td>{{ j.elemento?.significado ?? '—' }}</td>
          <td><span class="tag" :class="j.raridade">{{ RARIDADES[j.raridade] }}</span></td>
          <td class="faint">{{ j.personagens.map((p) => p.nome).join(', ') || '—' }}</td>
          <td style="text-align: right; white-space: nowrap">
            <RouterLink :to="`/jutsus/${j.id}`" class="btn small ghost">Editar</RouterLink>
            <button class="small ghost danger" @click="excluir(j)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else-if="carregado" class="empty">Nenhum jutsu cadastrado ainda.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api, RARIDADES } from '../api.js';
import Sequencia from '../components/Sequencia.vue';

const jutsus = ref([]);
const carregado = ref(false);
const msg = ref(null);

async function carregar() {
  try {
    jutsus.value = await api.jutsus.listar();
  } catch (e) {
    msg.value = { tipo: 'err', texto: e.message };
  }
  carregado.value = true;
}
async function excluir(j) {
  if (!confirm(`Excluir o jutsu "${j.nome}"? Os vínculos com personagens também serão removidos.`)) return;
  try {
    await api.jutsus.excluir(j.id);
    msg.value = { tipo: 'ok', texto: `Jutsu "${j.nome}" excluído.` };
    carregar();
  } catch (e) {
    msg.value = { tipo: 'err', texto: e.message };
  }
}
onMounted(carregar);
</script>
