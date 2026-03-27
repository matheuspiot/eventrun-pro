import { CostCategory, CostType, CostUnit } from "@prisma/client";

export type DefaultCostItemSeed = {
  nome: string;
  categoria: CostCategory;
  tipoCusto: CostType;
  unidade: CostUnit;
  custoPadrao: number;
  descricao?: string;
};

export const defaultCostItemsSeed: DefaultCostItemSeed[] = [
  {
    nome: "Locacao de grades",
    categoria: "ESTRUTURA",
    tipoCusto: "FIXO",
    unidade: "LOTE",
    custoPadrao: 2500,
  },
  {
    nome: "Ambulancia",
    categoria: "SEGURANCA",
    tipoCusto: "FIXO",
    unidade: "UN",
    custoPadrao: 900,
  },
  {
    nome: "Equipe de apoio",
    categoria: "STAFF",
    tipoCusto: "VARIAVEL_UNIDADE",
    unidade: "PESSOA",
    custoPadrao: 120,
  },
  {
    nome: "Camiseta atleta",
    categoria: "MATERIAIS",
    tipoCusto: "VARIAVEL_ATLETA",
    unidade: "ATLETA",
    custoPadrao: 22,
  },
  {
    nome: "Medalha",
    categoria: "MATERIAIS",
    tipoCusto: "VARIAVEL_ATLETA",
    unidade: "ATLETA",
    custoPadrao: 17.9,
  },
  {
    nome: "Numero de peito + alfinetes",
    categoria: "MATERIAIS",
    tipoCusto: "VARIAVEL_ATLETA",
    unidade: "ATLETA",
    custoPadrao: 7,
  },
  {
    nome: "Chip de cronometragem",
    categoria: "MATERIAIS",
    tipoCusto: "VARIAVEL_ATLETA",
    unidade: "ATLETA",
    custoPadrao: 9.5,
  },
  {
    nome: "Lanche pos-prova",
    categoria: "MATERIAIS",
    tipoCusto: "VARIAVEL_ATLETA",
    unidade: "ATLETA",
    custoPadrao: 3,
  },
  {
    nome: "Lanche staff",
    categoria: "STAFF",
    tipoCusto: "VARIAVEL_UNIDADE",
    unidade: "UN",
    custoPadrao: 3,
  },
  {
    nome: "Setup/Saques da plataforma",
    categoria: "TAXAS",
    tipoCusto: "FIXO",
    unidade: "LOTE",
    custoPadrao: 800,
  },
  {
    nome: "Anuncios em redes sociais",
    categoria: "COMUNICACAO",
    tipoCusto: "FIXO",
    unidade: "LOTE",
    custoPadrao: 1500,
  },
  {
    nome: "Logística de entrega de kits",
    categoria: "LOGISTICA",
    tipoCusto: "FIXO",
    unidade: "LOTE",
    custoPadrao: 1200,
  },
];
