export type RegulationConfigDto = {
  id: string;
  eventId: string;
  possuiKids: boolean;
  possuiChip: boolean;
  possuiPremiacaoDinheiro: boolean;
  tempoLimiteMinutos: number;
  plataformaInscricao: string[];
  valorInscricao: string;
  limiteVagas: number;
  emailContato: string;
  whatsappContato: string;
  dataInicioInscricao: string;
  dataFimInscricao: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type RegulationEventDto = {
  id: string;
  nomeEvento: string;
  dataEvento: string;
  cidade: string;
  estado: string;
  localLargada: string;
  organizador: string;
};

export type RegulationConfigInput = {
  eventId: string;
  possuiKids: boolean;
  possuiChip: boolean;
  possuiPremiacaoDinheiro: boolean;
  tempoLimiteMinutos: number;
  plataformaInscricao: string[];
  valorInscricao: number;
  limiteVagas: number;
  emailContato: string;
  whatsappContato: string;
  dataInicioInscricao: string;
  dataFimInscricao: string;
};
