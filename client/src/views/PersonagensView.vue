<!-- UC04 – Gerenciar Personagens -->
<template>
  <div class="head">
    <div>
      <h1>Personagens</h1>
      <p class="muted">Quem domina cada técnica, e com que nível de domínio.</p>
    </div>
    <button class="primary" @click="editando = {}">+ Novo Personagem</button>
  </div>

  <div v-if="msg" class="alert" :class="msg.tipo" style="margin-bottom: 14px">{{ msg.texto }}</div>

  <div class="grid" v-if="lista.length">
    <article v-for="p in lista" :key="p.id" class="card stack" style="gap: 8px">
      <div class="row spread">
        <h3 style="margin: 0"><RouterLink :to="`/personagens/${p.id}`" style="color: var(--ink)">{{ p.nome }}</RouterLink></h3>
        <span class="tag" :class="p.alinhamento">{{ ALINHAMENTOS[p.alinhamento] }}</span>
      </div>
      <div class="faint">
        {{ p.vila || 'Sem vila' }}<span v-if="p.desertor" style="color: var(--err)"> · desertor</span>
      </div>
      <div class="faint">{{ p.jutsus.length }} jutsu(s): {{ p.jutsus.map((j) => j.nome).join(', ') || '—' }}</div>
      <div class="row" style="margin-top: 4px">
        <RouterLink :to="`/personagens/${p.id}`" class="btn small">Abrir ficha</RouterLink>
        <button class="small ghost" @click="editando = p">Editar</button>
        <button class="small ghost danger" @click="excluir(p)">Excluir</button>
      </div>
    </article>
  </div>
  <div v-else-if="carregado" class="card empty">Nenhum personagem cadastrado.</div>

  <FormPersonagem v-if="editando" :inicial="editando" @fechar="editando = null" @salvo="salvo" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api, ALINHAMENTOS } from '../api.js';
import FormPersonagem from '../components/FormPersonagem.vue';

const lista = ref([]);
const carregado = ref(false);
const editando = ref(null);
const msg = ref(null);

async function carregar() {
  lista.value = await api.personagens.listar();
  carregado.value = true;
}
function salvo(p) {
  editando.value = null;
  msg.value = { tipo: 'ok', texto: `Personagem "${p.nome}" salvo.` };
  carregar();
}
async function excluir(p) {
  if (!confirm(`Excluir o personagem "${p.nome}"?`)) return;
  await api.personagens.excluir(p.id);
  msg.value = { tipo: 'ok', texto: `Personagem "${p.nome}" excluído.` };
  carregar();
}
onMounted(carregar);
</script>
