<!-- Exibe a frase de selos como teclas coloridas pelo slot -->
<template>
  <span class="seq" v-if="selos?.length">
    <span
      v-for="(s, i) in selos"
      :key="i"
      class="kbd"
      :class="{ lg: grande }"
      :style="{ '--c': `var(--${s.slot})` }"
      :title="`${NOME_SLOT[s.slot]}: ${s.significado}`"
    >{{ s.tecla }}</span>
  </span>
  <span v-else class="faint">sem sequência</span>
</template>

<script setup>
import { NOME_SLOT } from '../api.js';
defineProps({ selos: Array, grande: Boolean });
</script>
