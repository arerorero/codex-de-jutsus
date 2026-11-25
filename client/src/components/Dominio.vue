<template>
  <span class="dots" :title="`Domínio ${valor} de 5`">
    <span v-for="n in 5" :key="n" :class="{ off: n > valor }">●</span>
  </span>
</template>

<script setup>
defineProps({ valor: Number });
</script>
