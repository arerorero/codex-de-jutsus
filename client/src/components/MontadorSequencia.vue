<!--
  UC03 – Montar Sequência de Selos.
  Cada posição só oferece os selos do slot esperado (fonte → tipo → elemento → simbólicos),
  então a frase montada aqui já respeita a gramática; a API valida de novo (RNF04).
  Atalhos com o foco no quadro: W/A/S/D adicionam, Backspace remove, Esc limpa.
-->
<template>
  <div
    class="builder"
    :class="{ foco }"
    tabindex="0"
    @focus="foco = true"
    @blur="foco = false"
    @keydown="tecla"
  >
    <div class="trilha">
      <div
        v-for="(s, i) in modelValue"
        :key="i"
        class="passo"
        :class="{ erro: erroPosicao === i }"
        :style="{ '--c': `var(--${s.slot})` }"
      >
        <small>{{ i + 1 }}º · {{ NOME_SLOT[s.slot] }}</small>
        <span class="kbd">{{ s.tecla }}</span>
        <span>{{ s.significado }}</span>
      </div>
      <div class="passo prox" :style="{ '--c': `var(--${proximoSlot})` }">
        <small>{{ modelValue.length + 1 }}º · {{ NOME_SLOT[proximoSlot] }}</small>
        <span>{{ modelValue.length < 3 ? 'obrigatório' : 'opcional' }}</span>
      </div>
    </div>

    <div class="teclado">
      <button
        v-for="t in TECLAS"
        :key="t"
        type="button"
        :disabled="!opcao(t)"
        :style="{ borderBottomColor: `var(--${proximoSlot})` }"
        @click="adicionar(t)"
      >
        <b>{{ t }}</b>
        <span>{{ opcao(t)?.significado ?? '—' }}</span>
      </button>
    </div>

    <div class="row spread" style="margin-top: 12px">
      <div class="faint">
        Clique no quadro e use <span class="kbd">W</span> <span class="kbd">A</span>
        <span class="kbd">S</span> <span class="kbd">D</span> · Backspace desfaz · Esc limpa
      </div>
      <div class="row">
        <button type="button" class="small ghost" :disabled="!modelValue.length" @click="remover">Desfazer</button>
        <button type="button" class="small ghost" :disabled="!modelValue.length" @click="emit('update:modelValue', [])">
          Limpar
        </button>
      </div>
    </div>

    <p v-if="modelValue.length" class="frase">
      “{{ modelValue.map((s) => s.significado).join(' · ') }}”
      <span class="faint" style="font-style: normal"> — {{ modelValue.map((s) => s.tecla).join('-') }}</span>
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { TECLAS, NOME_SLOT, slotDaPosicao } from '../api.js';

const props = defineProps({
  modelValue: { type: Array, required: true },
  dicionario: { type: Array, required: true },
  erroPosicao: { type: Number, default: null },
});
const emit = defineEmits(['update:modelValue']);
const foco = ref(false);

const proximoSlot = computed(() => slotDaPosicao(props.modelValue.length));
const opcao = (t) => props.dicionario.find((s) => s.tecla === t && s.slot === proximoSlot.value);

function adicionar(t) {
  const s = opcao(t);
  if (s) emit('update:modelValue', [...props.modelValue, s]);
}
function remover() {
  emit('update:modelValue', props.modelValue.slice(0, -1));
}
function tecla(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toUpperCase();
  if (TECLAS.includes(k)) {
    e.preventDefault();
    adicionar(k);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    remover();
  } else if (e.key === 'Escape') {
    emit('update:modelValue', []);
  }
}
</script>
