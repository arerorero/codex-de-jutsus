<!-- UC01 – Gerenciar Selos -->
<template>
  <div class="head">
    <div>
      <h1>Dicionário de Selos</h1>
      <p class="muted">O significado de cada tecla depende da posição em que ela aparece na frase.</p>
    </div>
    <button class="primary" @click="abrir()">+ Novo Selo</button>
  </div>

  <section class="dict" style="margin-bottom: 24px">
    <div class="h"></div>
    <div v-for="slot in SLOTS" :key="slot" class="h" :style="{ '--c': `var(--${slot})` }">
      {{ NOME_SLOT[slot] }} <span class="faint">({{ slot === 'SIMBOLICO' ? '4º em diante' : SLOTS.indexOf(slot) + 1 + 'º' }})</span>
    </div>
    <template v-for="t in TECLAS" :key="t">
      <div class="k"><span class="kbd lg">{{ t }}</span></div>
      <div v-for="slot in SLOTS" :key="slot" :style="{ borderTop: `2px solid var(--${slot})` }">
        <template v-if="celula(t, slot)">
          <div style="font-weight: 600">{{ celula(t, slot).significado }}</div>
          <div class="faint">{{ celula(t, slot).usos }} uso(s)</div>
        </template>
        <span v-else class="faint">—</span>
      </div>
    </template>
  </section>

  <div v-if="msg" class="alert" :class="msg.tipo" style="margin-bottom: 14px">{{ msg.texto }}</div>

  <div class="card" style="padding: 6px 8px">
    <table>
      <thead><tr><th>Tecla</th><th>Slot</th><th>Significado</th><th>Descrição</th><th>Usos</th><th></th></tr></thead>
      <tbody>
        <tr v-for="s in selos" :key="s.id">
          <td><span class="kbd" :style="{ '--c': `var(--${s.slot})`, color: `var(--${s.slot})` }">{{ s.tecla }}</span></td>
          <td><span class="slot" :style="{ '--c': `var(--${s.slot})` }">{{ NOME_SLOT[s.slot] }}</span></td>
          <td>{{ s.significado }}</td>
          <td class="faint">{{ s.descricao || '—' }}</td>
          <td>{{ s.usos }}</td>
          <td style="text-align: right; white-space: nowrap">
            <button class="small ghost" @click="abrir(s)">Editar</button>
            <button class="small ghost danger" @click="excluir(s)" :title="s.usos ? 'Selo em uso (RN05)' : ''">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-if="form" class="modal-bg" @click.self="form = null">
    <form class="card modal stack" @submit.prevent="salvar">
      <h2>{{ form.id ? 'Editar selo' : 'Novo selo' }}</h2>
      <div class="form-grid">
        <label>
          Tecla
          <select v-model="form.tecla" :disabled="form.usos > 0">
            <option v-for="t in TECLAS" :key="t">{{ t }}</option>
          </select>
        </label>
        <label>
          Slot
          <select v-model="form.slot" :disabled="form.usos > 0">
            <option v-for="s in SLOTS" :key="s" :value="s">{{ NOME_SLOT[s] }}</option>
          </select>
        </label>
        <label class="full">Significado *<input v-model="form.significado" required /></label>
        <label class="full">Descrição<textarea v-model="form.descricao" /></label>
      </div>
      <p v-if="form.usos > 0" class="faint">Selo em uso: tecla e slot não podem mudar.</p>
      <div v-if="erroForm" class="alert err">{{ erroForm }}</div>
      <div class="row">
        <button class="primary" type="submit">Salvar</button>
        <button type="button" class="ghost" @click="form = null">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api, SLOTS, TECLAS, NOME_SLOT } from '../api.js';

const selos = ref([]);
const msg = ref(null);
const form = ref(null);
const erroForm = ref('');

const celula = (t, slot) => selos.value.find((s) => s.tecla === t && s.slot === slot);

async function carregar() {
  selos.value = await api.selos.listar();
}
function abrir(s) {
  erroForm.value = '';
  form.value = s ? { ...s, descricao: s.descricao ?? '' } : { tecla: 'W', slot: 'SIMBOLICO', significado: '', descricao: '', usos: 0 };
}
async function salvar() {
  const { id, tecla, slot, significado, descricao } = form.value;
  try {
    if (id) await api.selos.editar(id, { tecla, slot, significado, descricao });
    else await api.selos.criar({ tecla, slot, significado, descricao });
    msg.value = { tipo: 'ok', texto: `Selo ${tecla} (${NOME_SLOT[slot]}) salvo.` };
    form.value = null;
    carregar();
  } catch (e) {
    erroForm.value = e.message;
  }
}
async function excluir(s) {
  if (!confirm(`Excluir o selo ${s.tecla} – ${s.significado}?`)) return;
  try {
    await api.selos.excluir(s.id);
    msg.value = { tipo: 'ok', texto: 'Selo excluído.' };
    carregar();
  } catch (e) {
    const nomes = e.corpo?.jutsus?.map((j) => j.nome).join(', ');
    msg.value = { tipo: 'err', texto: e.message + (nomes ? ` (${nomes})` : '') };
  }
}
onMounted(carregar);
</script>
