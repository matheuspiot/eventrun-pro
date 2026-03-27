import { describe, expect, it } from "vitest";
import { regulationConfigSchema } from "./validation";

const validConfig = {
  eventId: "evt-1",
  templateTipo: "CORRIDA_RUA",
  possuiKids: false,
  possuiChip: true,
  possuiPremiacaoDinheiro: false,
  permiteTransferencia: false,
  permiteRetiradaTerceiros: true,
  exigeAtestadoMedico: false,
  logoDataUrl: null,
  faixaEtariaInicio: 18,
  faixaEtariaFim: 70,
  intervaloFaixaEtaria: 5,
  tempoLimiteMinutos: 120,
  plataformaInscricao: ["Ticket Sports"],
  valorInscricao: 89.9,
  limiteVagas: 1000,
  kitDescricao: "Camiseta e medalha",
  premiacaoDescricao: null,
  regrasGeraisExtra: null,
  documentosObrigatorios: null,
  politicaCancelamento: null,
  emailContato: "contato@evento.com",
  whatsappContato: "11999999999",
  dataInicioInscricao: "2026-03-01",
  dataFimInscricao: "2026-03-20",
};

describe("regulationConfigSchema", () => {
  it("aceita configuracao valida", () => {
    const parsed = regulationConfigSchema.parse(validConfig);

    expect(parsed.templateTipo).toBe("CORRIDA_RUA");
    expect(parsed.intervaloFaixaEtaria).toBe(5);
  });

  it("rejeita faixa etaria invertida", () => {
    const result = regulationConfigSchema.safeParse({
      ...validConfig,
      faixaEtariaInicio: 60,
      faixaEtariaFim: 18,
    });

    expect(result.success).toBe(false);
  });

  it("rejeita periodo de inscricao invertido", () => {
    const result = regulationConfigSchema.safeParse({
      ...validConfig,
      dataInicioInscricao: "2026-03-20",
      dataFimInscricao: "2026-03-01",
    });

    expect(result.success).toBe(false);
  });
});
