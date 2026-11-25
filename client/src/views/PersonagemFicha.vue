<!-- UC04 – Vincular jutsu a personagem -->
<template>
  <div v-if="p">
    <div class="head">
      <div>
        <RouterLink to="/personagens" class="faint">← Personagens</RouterLink>
        <h1>{{ p.nome }}</h1>
        <div class="row">
          <span class="tag" :class="p.alinhamento">Alma {{ ALINHAMENTOS[p.alinhamento].toLowerCase() }}</span>
          <span class="faint">{{ p.vila || 'Sem vila' }}</span>
          <span v-if="p.desertor" class="tag MALIGNO">Desertor</span>
        </div>
      </div>
      <button @click="editando = true">Editar dados</button>
    </div>

    <section class="card" style="margin-bottom: 16px">
      <h2>Ensinar jutsu</h2>
      <form class="row" @submit.prevent="vincular" style="align-items: flex-end">
        <label style="flex: 1; min-width: 220px">
          Jutsu
          <select v-model="novo.jutsuId" required>
            <option value="" disabled>Escolha…</option>
            <option v-for="j in disponiveis" :key="j.id" :value="j.id">{{ j.nome }} ({{ j.assinatura }})</option>
          </select>
        </label>
        <label>
          Domínio (1 a 5)
          <input type="number" v-model.number="novo.dominio" min="1" max="5" step="1" style="width: 110px" />
        </label>
        <button class="primary" type="submit">Vincular</button>
      </form>
      <div v-if="msg" class="alert" :class="msg.tipo" style="margin-top: 12px">{{ msg.texto }}</div>
    </section>

    <section class="card" style="padding: 6px 8px">
      <table v-if="p.jutsus.length">
        <thead><tr><th>Jutsu</th><th>Sequência</th><th>Raridade</th><th>Domínio</th><th></th></tr></thead>
        <tbody>
          <tr v-for="j in p.jutsus" :key="j.id">
            <td><RouterLink :to="`/jutsus/${j.id}`" style="color: var(--ink); font-weight: 600">{{ j.nome }}</RouterLink></td>
            <td style="font-family: var(--f-mono)">{{ j.assinatura }}</td>
            <td><span class="tag" :class="j.raridade">{{ RARIDADES[j.raridade] }}</span></td>
            <td>
              <select :value="j.dominio" @change="alterar(j, +$event.target.value)" style="padding: 3px 6px">
                <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
              </select>
              <Dominio :valor="j.dominio" style="margin-left: 8px" />
            </td>
            <td style="text-align: right"><button class="small ghost danger" @click="desvincular(j)">Desvincular</button></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty">Este personagem ainda não conhece nenhum jutsu.</div>
    </section>

    <FormPersonagem v-if="editando" :inicial="p" @fechar="editando = false" @salvo="(np) => { p = np; editando = false; }" />
  </div>
  <div v-else-if="erro" class="alert err">{{ erro }}</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { api, ALINHAMENTOS, RARIDADES } from '../api.js';
import Dominio from '../components/Dominio.vue';
import FormPersonagem from '../components/FormPersonagem.vue';

const props = defineProps({ id: String });
const p = ref(null);
const jutsus = ref([]);
const erro = ref('');
const msg = ref(null);
const editando = ref(false);
const novo = reactive({ jutsuId: '', dominio: 1 });

const disponiveis = computed(() => jutsus.value.filter((j) => !p.value?.jutsus.some((pj) => pj.id === j.id)));

onMounted(async () => {
  try {
    [p.value, jutsus.value] = await Promise.all([api.personagens.obter(props.id), api.jutsus.listar()]);
  } catch (e) {
    erro.value = e.message;
  }
});

async function vincular() {
  try {
    p.value = await api.personagens.vincular(props.id, novo.jutsuId, novo.dominio);
    msg.value = { tipo: 'ok', texto: 'Jutsu vinculado.' };
    novo.jutsuId = '';
    novo.dominio = 1;
  } catch (e) {
    msg.value = { tipo: 'err', texto: e.message };
  }
}
async function alterar(j, dominio) {
  try {
    p.value = await api.personagens.vincular(props.id, j.id, dominio);
  } catch (e) {
    msg.value = { tipo: 'err', texto: e.message };
  }
}
async function desvincular(j) {
  p.value = await api.personagens.desvincular(props.id, j.id);
  msg.value = { tipo: 'ok', texto: `"${j.nome}" removido da ficha.` };
}
</script>
