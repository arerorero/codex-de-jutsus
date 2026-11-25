<template>
  <article class="card stack" style="gap: 10px">
    <div class="row spread">
      <h3 style="margin: 0">
        <RouterLink :to="`/jutsus/${j.id}`" style="color: var(--ink)">{{ j.nome }}</RouterLink>
      </h3>
      <span class="tag" :class="j.raridade">{{ RARIDADES[j.raridade] }}</span>
    </div>
    <Sequencia :selos="j.sequencia" />
    <div class="faint" v-if="j.fonte">
      <span class="slot" style="--c: var(--FONTE)">{{ j.fonte.significado }}</span> ·
      <span class="slot" style="--c: var(--TIPO)">{{ j.tipo.significado }}</span> ·
      <span class="slot" style="--c: var(--ELEMENTO)">{{ j.elemento.significado }}</span>
      <template v-if="j.sequencia.length > 3">
        · <span class="slot" style="--c: var(--SIMBOLICO)">{{ j.sequencia.slice(3).map((s) => s.significado).join(', ') }}</span>
      </template>
    </div>
    <p v-if="j.descricao" class="muted" style="margin: 0">{{ j.descricao }}</p>
    <div class="faint">
      <template v-if="j.personagens.length">
        Dominado por:
        <span v-for="(p, i) in j.personagens" :key="p.id">
          <RouterLink :to="`/personagens/${p.id}`">{{ p.nome }}</RouterLink> ({{ p.dominio }}/5){{ i < j.personagens.length - 1 ? ', ' : '' }}
        </span>
      </template>
      <template v-else>Nenhum personagem conhece este jutsu.</template>
    </div>
  </article>
</template>

<script setup>
import Sequencia from './Sequencia.vue';
import { RARIDADES } from '../api.js';
defineProps({ j: Object });
</script>
