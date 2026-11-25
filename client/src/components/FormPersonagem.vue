<template>
  <div class="modal-bg" @click.self="emit('fechar')">
    <form class="card modal stack" @submit.prevent="salvar">
      <h2>{{ inicial?.id ? 'Editar personagem' : 'Novo personagem' }}</h2>
      <div class="form-grid">
        <label class="full">Nome *<input v-model="d.nome" required /></label>
        <label>
          Alinhamento da alma
          <select v-model="d.alinhamento">
            <option v-for="(n, k) in ALINHAMENTOS" :key="k" :value="k">{{ n }}</option>
          </select>
        </label>
        <label>Vila<input v-model="d.vila" /></label>
        <label class="check full"><input type="checkbox" v-model="d.desertor" /> Desertor</label>
      </div>
      <div v-if="erro" class="alert err">{{ erro }}</div>
      <div class="row">
        <button class="primary" type="submit">Salvar</button>
        <button type="button" class="ghost" @click="emit('fechar')">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api, ALINHAMENTOS } from '../api.js';

const props = defineProps({ inicial: Object });
const emit = defineEmits(['fechar', 'salvo']);
const d = reactive({
  nome: props.inicial?.nome ?? '',
  alinhamento: props.inicial?.alinhamento ?? 'INDECISO',
  vila: props.inicial?.vila ?? '',
  desertor: props.inicial?.desertor ?? false,
});
const erro = ref('');

async function salvar() {
  try {
    const p = props.inicial?.id ? await api.personagens.editar(props.inicial.id, d) : await api.personagens.criar(d);
    emit('salvo', p);
  } catch (e) {
    erro.value = e.message;
  }
}
</script>
