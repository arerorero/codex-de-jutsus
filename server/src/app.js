import express from 'express';
import cors from 'cors';
import selos from './routes/selos.js';
import jutsus from './routes/jutsus.js';
import personagens from './routes/personagens.js';
import codex from './routes/codex.js';
import { tratarErros } from './lib/http.js';

export function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) =>
    res.json({ nome: 'Codex de Jutsus API', recursos: ['/selos', '/jutsus', '/personagens', '/codex'] }),
  );
  app.use('/selos', selos);
  app.use('/jutsus', jutsus);
  app.use('/personagens', personagens);
  app.use('/codex', codex);

  app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
  app.use(tratarErros);
  return app;
}
