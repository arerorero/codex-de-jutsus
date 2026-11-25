import { criarApp } from './app.js';

const PORTA = Number(process.env.API_PORT) || 3000;

criarApp().listen(PORTA, () => {
  console.log(`Codex de Jutsus API em http://localhost:${PORTA}`);
});
