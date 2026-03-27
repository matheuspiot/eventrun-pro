import { describe, expect, it } from "vitest";
import { eventFormSchema } from "./validation";

const validEvent = {
  nomeEvento: "Corrida da Cidade",
  dataEvento: "2026-04-10",
  cidade: "Sao Paulo",
  estado: "SP",
  localLargada: "Parque Central",
  organizador: "Clube Piot",
  cnpjOrganizador: "45.723.174/0001-10",
  modalidades: "5K, 10K",
  distancias: "5K, 10K",
  capacidadeMaxima: 1000,
  limiteTecnico: "90 minutos",
  cronogramaResumo: "Largada 7h",
  patrocinadores: "Marca A",
  fornecedores: "Fornecedor B",
  status: "PLANEJAMENTO",
};

describe("eventFormSchema", () => {
  it("aceita CNPJ valido e normaliza os digitos", () => {
    const parsed = eventFormSchema.parse(validEvent);

    expect(parsed.cnpjOrganizador).toBe("45723174000110");
  });

  it("rejeita CNPJ invalido", () => {
    const result = eventFormSchema.safeParse({
      ...validEvent,
      cnpjOrganizador: "11.111.111/1111-11",
    });

    expect(result.success).toBe(false);
  });
});
