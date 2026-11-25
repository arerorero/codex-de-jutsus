<!-- UC02 – cadastrar/editar jutsu, com UC03 – Montar Sequência de Selos -->
<template>
  <div class="head">
    <div>
      <RouterLink to="/jutsus" class="faint">← Jutsus</RouterLink>
      <h1>{{ id ? 'Editar Jutsu' : 'Novo Jutsu' }}</h1>
    </div>
  </div>

  <form v-if="pronto" class="stack" @submit.prevent="salvar">
    <section class="card">
      <h2>Dados</h2>
      <div class="form-grid">
        <label>Nome *<input v-model="d.nome" required maxlength="80" /></label>
        <label>
          Raridade *
          <select v-model="d.raridade">
            <option v-for="(n, k) in RARIDADES" :key="k" :value="k">{{ n }}</option>
          </select>
        </label>
        <label class="full">Descrição<textarea v-model="d.descricao" /></label>
        <label>Gesto de finalização<input v-model="d.gestoFinalizacao" /></label>
        <label>Efeito ao segurar o Alt<input v-model="d.efeitoSegurar" /></label>
      </div>
    </section>

    <section class="card">
      <div class="row spread" style="margin-bottom: 10px">
        <h2 style="margin: 0">Sequência de selos</h2>
        <span class="faint">Fonte → Tipo → Elemento → Simbólicos (opcionais)</span>
      </div>
      <MontadorSequencia v-model="seq" :dicionario="selos" :erro-posicao="erroPosicao" />
      <div v-if="conflitoLocal" class="alert err" style="margin-top: 12px">
        A sequência {{ assinatura }} já é usada por
        <RouterLink :to="`/jutsus/${conflitoLocal.id}`">{{ conflitoLocal.nome }}</RouterLink>.
      </div>
    </section>

    <div v-if="erro" class="alert err">
      {{ erro }}
      <template v-if="conflito"> — <RouterLink :to="`/jutsus/${conflito.id}`">abrir “{{ conflito.nome }}”</RouterLink></template>
    </div>
    <div v-if="ok" class="alert ok">{{ ok }}</div>

    <div class="row">
      <button class="primary" type="submit" :disabled="salvando">{{ salvando ? 'Salvando…' : 'Salvar' }}</button>
      <RouterLink to="/jutsus" class="btn ghost">Cancelar</RouterLink>
      <span class="faint" v-if="seq.length < 3">A sequência precisa de ao menos 3 selos.</span>
    </div>
  </form>
  <div v-else-if="erro" class="alert err">{{ erro }}</div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { api, RARIDADES } from '../api.js';
import MontadorSequencia from '../components/MontadorSequencia.vue';

const props = defineProps({ id: String });
const router = useRouter();

const d = reactive({ nome: '', raridade: 'COMUM', descricao: '', gestoFinalizacao: '', efeitoSegurar: '' });
const seq = ref([]);
const selos = ref([]);
const outros = ref([]);
const pronto = ref(false);
const salvando = ref(false);
const erro = ref('');
const ok = ref('');
const erroPosicao = ref(null);
const conflito = ref(null);

const assinatura = computed(() => seq.value.map((s) => s.tecla).join('-'));
const conflitoLocal = computed(() =>
  seq.value.length >= 3 ? outros.value.find((j) => j.assinatura === assinatura.value && String(j.id) !== props.id) : null,
);
watch(seq, () => {
  erroPosicao.value = null;
  ok.value = '';
});

onMounted(async () => {
  try {
    const [s, todos] = await Promise.all([api.selos.listar(), api.jutsus.listar()]);
    selos.value = s;
    outros.value = todos;
    if (props.id) {
      const j = await api.jutsus.obter(props.id);
      for (const k of Object.keys(d)) d[k] = j[k] ?? '';
      seq.value = j.sequencia;
    }
    pronto.value = true;
  } catch (e) {
    erro.value = e.message;
  }
});

async function salvar() {
  erro.value = '';
  ok.value = '';
  conflito.value = null;
  if (seq.value.length < 3) {
    erro.value = 'Monte a sequência com ao menos fonte, tipo e elemento.';
    return;
  }
  salvando.value = true;
  try {
    const corpo = { ...d, selos: seq.value.map((s) => s.id) };
    const j = props.id ? await api.jutsus.editar(props.id, corpo) : await api.jutsus.criar(corpo);
    if (!props.id) return router.push('/jutsus');
    ok.value = 'Jutsu salvo.';
    seq.value = j.sequencia;
  } catch (e) {
    erro.value = e.message;
    erroPosicao.value = e.corpo?.posicao ?? null;
    conflito.value = e.corpo?.jutsu ?? null;
  } finally {
    salvando.value = false;
  }
}
</script>
