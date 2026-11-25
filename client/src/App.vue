<template>
  <div class="shell">
    <aside class="side">
      <div class="brand">Codex de <span>Jutsus</span></div>
      <div class="sub">O Projeto · catálogo de técnicas</div>
      <nav>
        <RouterLink to="/">Consultar Codex</RouterLink>
        <RouterLink to="/jutsus" :class="{ ativo: $route.path.startsWith('/jutsus') }">Jutsus</RouterLink>
        <RouterLink to="/selos">Dicionário de Selos</RouterLink>
        <RouterLink to="/personagens" :class="{ ativo: $route.path.startsWith('/personagens') }">Personagens</RouterLink>
      </nav>
    </aside>
    <main>
      <RouterView :key="$route.fullPath" />
    </main>
  </div>
</template>
