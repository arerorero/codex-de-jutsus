<!-- UC05 – Consultar Codex -->
<template>
  <div class="head">
    <div>
      <h1>Consultar Codex</h1>
      <p class="muted">Filtre por fonte, tipo, elemento e raridade, ou digite as teclas da frase (ex.: D-D).</p>
    </div>
  </div>

  <section class="card" style="margin-bottom: 20px">
    <div class="form-grid">
      <label class="full">
        Sequência de teclas
        <input
          v-model="f.sequencia"
          placeholder="Digite W, A, S, D… (ex.: W-D-D-W)"
          @input="f.sequencia = f.sequencia.toUpperCase()"
          style="font-family: var(--f-mono); font-size: 1.05rem; letter-spacing: .1em"
        />
      </label>
      <label v-for="slot in ['FONTE', 'TIPO', 'ELEMENTO']" :key="slot">
        <span class="slot" :style="{ '--c': `var(--${slot})` }">{{ NOME_SLOT[slot] }}</span>
        <select v-model="f[slot.toLowerCase()]">
          <option value="">Todos</option>
          <option v-for="s in porSlot(slot)" :key="s.id" :value="s.tecla">{{ s.tecla }} · {{ s.significado }}</option>
        </select>
      </label>
      <label>
        Raridade
        <select v-model="f.raridade">
          <option value="">Todas</option>
          <option v-for="(n, k) in RARIDADES" :key="k" :value="k">{{ n }}</option>
        </select>
      </label>
    </div>
    <div class="row spread" style="margin-top: 14px">
      <span class="faint" v-if="resultado">{{ resultado.total }} jutsu(s) encontrado(s)</span>
      <button class="ghost small" @click="limpar">Limpar filtros</button>
    </div>
  </section>

  <div v-if="erro" class="alert err">{{ erro }}</div>
  <div v-else-if="resultado && !resultado.total" class="card empty">{{ resultado.mensagem }}</div>
  <div v-else-if="resultado" class="grid">
    <CartaoJutsu v-for="j in resultado.jutsus" :key="j.id" :j="j" />
  </div>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from 'vue';
import { api, NOME_SLOT, RARIDADES } from '../api.js';
import CartaoJutsu from '../components/CartaoJutsu.vue';

const vazio = { sequencia: '', fonte: '', tipo: '', elemento: '', raridade: '' };
const f = reactive({ ...vazio });
const selos = ref([]);
const resultado = ref(null);
const erro = ref('');
const porSlot = (slot) => selos.value.filter((s) => s.slot === slot);

let timer;
async function buscar() {
  try {
    erro.value = '';
    resultado.value = await api.codex(f);
  } catch (e) {
    erro.value = e.message;
  }
}
watch(f, () => {
  clearTimeout(timer);
  timer = setTimeout(buscar, 200);
});
function limpar() {
  Object.assign(f, vazio);
}
onMounted(async () => {
  selos.value = await api.selos.listar().catch(() => []);
  buscar();
});
</script>
