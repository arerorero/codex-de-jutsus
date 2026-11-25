# Codex de Jutsus

Sistema web para cadastro e consulta dos jutsus de **O Projeto**, com validação automática da gramática dos selos de mão.
Projeto e Desenvolvimento de Sistema I e II, por Filippo Bruschi Grassano.

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js 20+ e Express (API REST em JSON) |
| Banco | SQLite com o ORM Prisma |
| Front-end | Vue.js 3, Vite e Vue Router |

## Como executar (RNF08)

```bash
npm install     # instala tudo, cria o banco SQLite e roda o seed (16 selos base + exemplos)
npm run dev     # sobe a API em http://localhost:3000 e a interface em http://localhost:5173
```

Outros comandos:

- `npm test` roda os testes da gramática (RN01 a RN03).
- `npm run db:reset` apaga o banco e recria só com o seed. Pare o `npm run dev` antes de rodar.
- `SEED_EXEMPLOS=0` faz o seed criar apenas os 16 selos, sem os jutsus e personagens de exemplo.

## Estrutura

```
server/
  prisma/schema.prisma     modelos SELO, JUTSU, SEQUENCIA_SELO, PERSONAGEM, PERSONAGEM_JUTSU (DER)
  prisma/seed.js           dicionário dos 16 selos base (RF10)
  src/lib/dominio.js       gramática dos selos: validarGramatica, gerarAssinatura
  src/lib/jutsus.js        montagem e validação da sequência; unicidade da assinatura
  src/routes/*.js          endpoints do Quadro 11
  test/                    testes das regras de negócio
client/
  src/views/               Consultar Codex, Jutsus, Novo/Editar Jutsu, Dicionário de Selos, Personagens, Ficha
  src/components/          MontadorSequencia (UC03), Sequencia, CartaoJutsu…
```

## API (Quadro 11)

| Método | Rota | Descrição |
|---|---|---|
| GET / POST | `/selos` | Lista ou cadastra selos |
| PUT / DELETE | `/selos/:id` | Edita ou exclui um selo |
| GET / POST | `/jutsus` | Lista ou cadastra jutsus (a sequência pode vir junto) |
| GET / PUT / DELETE | `/jutsus/:id` | Detalha, edita ou exclui um jutsu |
| PUT | `/jutsus/:id/sequencia` | Grava a sequência de selos com validação |
| GET / POST | `/personagens` | Lista ou cadastra personagens |
| GET / PUT / DELETE | `/personagens/:id` | Detalha (ficha), edita ou exclui um personagem |
| POST | `/personagens/:id/jutsus` | Vincula um jutsu `{ jutsuId, dominio }` |
| DELETE | `/personagens/:id/jutsus/:jutsuId` | Desvincula um jutsu |
| GET | `/codex` | Consulta por `fonte`, `tipo`, `elemento` (tecla), `raridade` e `sequencia` |

A sequência pode ser enviada de duas formas: `{ "selos": [1, 8, 12, 13] }` com os ids em ordem, ou
`{ "teclas": "W-D-D-W" }`. No segundo caso, cada tecla é resolvida para o selo do slot esperado naquela posição.

### Respostas de erro

| Situação | Status |
|---|---|
| Campo obrigatório vazio ou valor inválido | 400 |
| Registro não encontrado | 404 |
| Tecla/slot já existe (RN04), selo em uso (RN05), assinatura em uso (RN03), nome repetido | 409 |
| Gramática inválida (RN01/RN02, com `posicao` do selo fora de ordem), domínio fora de 1 a 5 (RN06) | 422 |

## Regras de negócio

- **RN01/RN02**: a frase é fonte, tipo, elemento e depois zero ou mais selos simbólicos, que podem se repetir.
- **RN03**: a assinatura (ex.: `W-D-D-W`) é única entre os jutsus.
- **RN04**: não podem existir dois selos com a mesma tecla no mesmo slot.
- **RN05**: um selo usado em alguma sequência não pode ser excluído, nem ter a tecla ou o slot alterados.
- **RN06**: o domínio é um inteiro de 1 a 5.

Fonte, tipo e elemento não ficam gravados no jutsu. São obtidos dos três primeiros selos da sequência (seção 2.7).

## Interface

No **Novo Jutsu**, clique no quadro da sequência e use as teclas **W A S D** como no jogo
(Backspace desfaz, Esc limpa). Cada posição só oferece os selos do slot esperado e mostra a frase montada.
