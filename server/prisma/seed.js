// RF10 – dicionário dos 16 selos base (Quadro 5) + exemplos opcionais.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DICIONARIO = {
  W: { FONTE: 'Respiração', TIPO: 'Projétil', ELEMENTO: 'Ar', SIMBOLICO: 'Vida' },
  A: { FONTE: 'Agilidade', TIPO: 'Controle', ELEMENTO: 'Água', SIMBOLICO: 'Servo' },
  S: { FONTE: 'Músculos', TIPO: 'Invocação', ELEMENTO: 'Terra', SIMBOLICO: 'Morte' },
  D: { FONTE: 'Alma', TIPO: 'Dano em área', ELEMENTO: 'Fogo', SIMBOLICO: 'Rei' },
};

const EXEMPLOS_JUTSU = [
  {
    nome: 'Sopro do Dragão Solar',
    teclas: ['W', 'D', 'D', 'W'],
    raridade: 'RARO',
    descricao: 'Uma explosão de fogo soprada pelo personagem.',
    gestoFinalizacao: 'Mãos em concha diante da boca',
    efeitoSegurar: 'O cone de fogo aumenta de alcance',
  },
  {
    nome: 'Lâmina de Vento',
    teclas: ['A', 'W', 'W'],
    raridade: 'COMUM',
    descricao: 'Um corte de ar disparado em linha reta.',
    gestoFinalizacao: 'Golpe horizontal com a mão aberta',
    efeitoSegurar: 'Dispara três lâminas em leque',
  },
  {
    nome: 'Correntes do Rio Servo',
    teclas: ['D', 'A', 'A', 'A'],
    raridade: 'RARO',
    descricao: 'Tentáculos de água prendem o alvo.',
    gestoFinalizacao: 'Punhos cruzados',
    efeitoSegurar: 'Prende por mais tempo',
  },
  {
    nome: 'Coroa de Pedra do Rei Morto',
    teclas: ['S', 'S', 'S', 'D', 'S'],
    raridade: 'LENDARIO',
    descricao: 'Invoca um guardião de pedra coroado.',
    gestoFinalizacao: 'Palmas no chão',
    efeitoSegurar: 'O guardião surge já em postura de ataque',
  },
];

const EXEMPLOS_PERSONAGEM = [
  { nome: 'Kaito', alinhamento: 'PURO', vila: 'Vila da Folha Rubra', desertor: false, jutsus: [['Sopro do Dragão Solar', 4], ['Lâmina de Vento', 5]] },
  { nome: 'Ren', alinhamento: 'INDECISO', vila: 'Vila do Rio', desertor: true, jutsus: [['Correntes do Rio Servo', 3]] },
  { nome: 'Mestre Gorō', alinhamento: 'MALIGNO', vila: 'Vila da Montanha', desertor: false, jutsus: [['Coroa de Pedra do Rei Morto', 5]] },
];

async function main() {
  for (const [tecla, slots] of Object.entries(DICIONARIO)) {
    for (const [slot, significado] of Object.entries(slots)) {
      await prisma.selo.upsert({
        where: { tecla_slot: { tecla, slot } },
        create: { tecla, slot, significado },
        update: {},
      });
    }
  }
  console.log('Seed: 16 selos base garantidos.');

  if (process.env.SEED_EXEMPLOS === '0' || (await prisma.jutsu.count()) > 0) return;

  const selos = await prisma.selo.findMany();
  const slotDaPosicao = (i) => (i < 3 ? ['FONTE', 'TIPO', 'ELEMENTO'][i] : 'SIMBOLICO');
  const ids = {};
  for (const { teclas, ...dados } of EXEMPLOS_JUTSU) {
    const seq = teclas.map((t, i) => selos.find((s) => s.tecla === t && s.slot === slotDaPosicao(i)));
    const j = await prisma.jutsu.create({
      data: {
        ...dados,
        assinatura: teclas.join('-'),
        sequencia: { create: seq.map((s, posicao) => ({ seloId: s.id, posicao })) },
      },
    });
    ids[j.nome] = j.id;
  }
  for (const { jutsus, ...dados } of EXEMPLOS_PERSONAGEM) {
    await prisma.personagem.create({
      data: { ...dados, jutsus: { create: jutsus.map(([nome, dominio]) => ({ jutsuId: ids[nome], dominio })) } },
    });
  }
  console.log('Seed: jutsus e personagens de exemplo criados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
