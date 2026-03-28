"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { UiIcon } from "@/components/ui-icon";
import { useUiFeedback } from "@/components/ui-feedback-provider";
import { EventDto } from "@/modules/events/types";
import { generateRegulationText } from "../generate-regulation-text";
import { RegulationConfigDto, RegulationTemplateType } from "../types";

const stepDefinitions = [
  ["Template", "Escolha a base do regulamento e a identidade visual."],
  ["Prova", "Defina regras técnicas, faixas e limite da prova."],
  ["Inscrições", "Configure período, plataformas, vagas e transferência."],
  ["Kit e regras", "Explique kit, documentos, premiação e regras extras."],
  ["Contato", "Feche canais de suporte e revise o texto final."],
] as const;

const platformOptions = ["TicketSports", "Sympla", "Minhas Inscrições", "Site próprio"];

const defaultConfig = {
  templateTipo: "CORRIDA_RUA" as RegulationTemplateType,
  possuiKids: false,
  possuiChip: true,
  possuiPremiacaoDinheiro: false,
  permiteTransferencia: false,
  permiteRetiradaTerceiros: true,
  exigeAtestadoMedico: false,
  logoDataUrl: "",
  faixaEtariaInicio: "16",
  faixaEtariaFim: "80",
  intervaloFaixaEtaria: "5",
  tempoLimiteMinutos: "180",
  plataformaInscricao: ["TicketSports"],
  valorInscricao: "0",
  limiteVagas: "1000",
  kitDescricao: "",
  premiacaoDescricao: "",
  regrasGeraisExtra: "",
  documentosObrigatorios: "",
  politicaCancelamento: "",
  emailContato: "",
  whatsappContato: "",
  dataInicioInscricao: "",
  dataFimInscricao: "",
};

const templateCards: Record<RegulationTemplateType, { label: string; summary: string }> = {
  CORRIDA_RUA: {
    label: "Corrida de rua",
    summary: "Base urbana com chip e comunicação direta para o atleta.",
  },
  TRAIL_RUN: {
    label: "Trail run",
    summary: "Fluxo com segurança reforçada e exigências técnicas maiores.",
  },
  CORRIDA_KIDS: {
    label: "Corrida kids",
    summary: "Estrutura infantil com foco em responsável legal e participação segura.",
  },
};

function stepComplete(step: number, form: typeof defaultConfig) {
  if (step === 0) return Boolean(form.templateTipo);
  if (step === 1) return Boolean(form.tempoLimiteMinutos) && Boolean(form.limiteVagas);
  if (step === 2) {
    return (
      form.plataformaInscricao.length > 0 &&
      Boolean(form.valorInscricao) &&
      Boolean(form.dataInicioInscricao) &&
      Boolean(form.dataFimInscricao)
    );
  }
  if (step === 3) return Boolean(form.kitDescricao || form.regrasGeraisExtra);
  return Boolean(form.emailContato) && Boolean(form.whatsappContato);
}

export function RegulationBuilder() {
  const { showToast } = useUiFeedback();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(defaultConfig);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );
  const completion = useMemo(
    () => stepDefinitions.filter((_, index) => stepComplete(index, form)).length,
    [form],
  );

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar eventos.");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as { events: EventDto[] };
      setEvents(data.events);
      setSelectedEventId(data.events[0]?.id ?? "");
      setLoading(false);
    }
    void loadEvents();
  }, []);

  useEffect(() => {
    async function loadConfig() {
      if (!selectedEventId) return;
      setError("");
      const response = await fetch(`/api/regulation-config?eventId=${selectedEventId}`, { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar a configuração do regulamento.");
        return;
      }
      const data = (await response.json()) as { config: RegulationConfigDto | null };
      if (!data.config) {
        setForm(defaultConfig);
        return;
      }
      setForm({
        templateTipo: data.config.templateTipo,
        possuiKids: data.config.possuiKids,
        possuiChip: data.config.possuiChip,
        possuiPremiacaoDinheiro: data.config.possuiPremiacaoDinheiro,
        permiteTransferencia: data.config.permiteTransferencia,
        permiteRetiradaTerceiros: data.config.permiteRetiradaTerceiros,
        exigeAtestadoMedico: data.config.exigeAtestadoMedico,
        logoDataUrl: data.config.logoDataUrl ?? "",
        faixaEtariaInicio: String(data.config.faixaEtariaInicio),
        faixaEtariaFim: String(data.config.faixaEtariaFim),
        intervaloFaixaEtaria: String(data.config.intervaloFaixaEtaria),
        tempoLimiteMinutos: String(data.config.tempoLimiteMinutos),
        plataformaInscricao: data.config.plataformaInscricao,
        valorInscricao: data.config.valorInscricao,
        limiteVagas: String(data.config.limiteVagas),
        kitDescricao: data.config.kitDescricao ?? "",
        premiacaoDescricao: data.config.premiacaoDescricao ?? "",
        regrasGeraisExtra: data.config.regrasGeraisExtra ?? "",
        documentosObrigatorios: data.config.documentosObrigatorios ?? "",
        politicaCancelamento: data.config.politicaCancelamento ?? "",
        emailContato: data.config.emailContato,
        whatsappContato: data.config.whatsappContato,
        dataInicioInscricao: data.config.dataInicioInscricao.slice(0, 10),
        dataFimInscricao: data.config.dataFimInscricao.slice(0, 10),
      });
    }
    void loadConfig();
  }, [selectedEventId]);

  function applyTemplate(templateTipo: RegulationTemplateType) {
    setForm((prev) => ({ ...prev, templateTipo }));
    setSuccess(`Template aplicado: ${templateCards[templateTipo].label}.`);
    showToast({ tone: "success", title: "Template aplicado" });
  }

  function togglePlatform(platform: string) {
    setForm((prev) => ({
      ...prev,
      plataformaInscricao: prev.plataformaInscricao.includes(platform)
        ? prev.plataformaInscricao.filter((item) => item !== platform)
        : [...prev.plataformaInscricao, platform],
    }));
  }

  function handleLogoUpload(file: File | null) {
    if (!file) {
      setForm((prev) => ({ ...prev, logoDataUrl: "" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido para a logo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, logoDataUrl: String(reader.result || "") }));
    reader.onerror = () => setError("Não foi possível ler o arquivo da logo.");
    reader.readAsDataURL(file);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventId) {
      setError("Selecione um evento.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    const response = await fetch("/api/regulation-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEventId,
        templateTipo: form.templateTipo,
        possuiKids: form.possuiKids,
        possuiChip: form.possuiChip,
        possuiPremiacaoDinheiro: form.possuiPremiacaoDinheiro,
        permiteTransferencia: form.permiteTransferencia,
        permiteRetiradaTerceiros: form.permiteRetiradaTerceiros,
        exigeAtestadoMedico: form.exigeAtestadoMedico,
        logoDataUrl: form.logoDataUrl || null,
        faixaEtariaInicio: Number(form.faixaEtariaInicio),
        faixaEtariaFim: Number(form.faixaEtariaFim),
        intervaloFaixaEtaria: Number(form.intervaloFaixaEtaria),
        tempoLimiteMinutos: Number(form.tempoLimiteMinutos),
        plataformaInscricao: form.plataformaInscricao,
        valorInscricao: Number(form.valorInscricao),
        limiteVagas: Number(form.limiteVagas),
        kitDescricao: form.kitDescricao || null,
        premiacaoDescricao: form.premiacaoDescricao || null,
        regrasGeraisExtra: form.regrasGeraisExtra || null,
        documentosObrigatorios: form.documentosObrigatorios || null,
        politicaCancelamento: form.politicaCancelamento || null,
        emailContato: form.emailContato,
        whatsappContato: form.whatsappContato,
        dataInicioInscricao: form.dataInicioInscricao,
        dataFimInscricao: form.dataFimInscricao,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar o regulamento.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSuccess("Regulamento salvo com sucesso.");
    showToast({ tone: "success", title: "Regulamento salvo" });
  }

  const previewText = useMemo(() => {
    if (!selectedEvent) return "Selecione um evento para gerar o preview do regulamento.";
    return generateRegulationText(
      {
        id: "preview",
        eventId: selectedEvent.id,
        templateTipo: form.templateTipo,
        possuiKids: form.possuiKids,
        possuiChip: form.possuiChip,
        possuiPremiacaoDinheiro: form.possuiPremiacaoDinheiro,
        permiteTransferencia: form.permiteTransferencia,
        permiteRetiradaTerceiros: form.permiteRetiradaTerceiros,
        exigeAtestadoMedico: form.exigeAtestadoMedico,
        logoDataUrl: form.logoDataUrl || null,
        faixaEtariaInicio: Number(form.faixaEtariaInicio || 16),
        faixaEtariaFim: Number(form.faixaEtariaFim || 80),
        intervaloFaixaEtaria: Number(form.intervaloFaixaEtaria || 5),
        tempoLimiteMinutos: Number(form.tempoLimiteMinutos || 0),
        plataformaInscricao: form.plataformaInscricao,
        valorInscricao: form.valorInscricao || "0",
        limiteVagas: Number(form.limiteVagas || 0),
        kitDescricao: form.kitDescricao || null,
        premiacaoDescricao: form.premiacaoDescricao || null,
        regrasGeraisExtra: form.regrasGeraisExtra || null,
        documentosObrigatorios: form.documentosObrigatorios || null,
        politicaCancelamento: form.politicaCancelamento || null,
        emailContato: form.emailContato || "contato@evento.com",
        whatsappContato: form.whatsappContato || "(00) 00000-0000",
        dataInicioInscricao: form.dataInicioInscricao || new Date().toISOString(),
        dataFimInscricao: form.dataFimInscricao || new Date().toISOString(),
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      },
      {
        id: selectedEvent.id,
        nomeEvento: selectedEvent.nomeEvento,
        dataEvento: selectedEvent.dataEvento,
        cidade: selectedEvent.cidade,
        estado: selectedEvent.estado,
        localLargada: selectedEvent.localLargada,
        organizador: selectedEvent.organizador,
      },
    );
  }, [form, selectedEvent]);

  if (loading) {
    return <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm"><p className="text-sm text-zinc-600">Carregando módulo de regulamento...</p></section>;
  }

  return (
    <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Regulamento guiado</p>
          <h2 className="mt-2 text-3xl font-heading text-zinc-900">Preenchimento por progresso</h2>
          <p className="mt-2 text-sm text-zinc-600">Menos densidade visual, mais contexto por etapa e preview sempre acessível.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Concluído</p><p className="mt-1 text-2xl font-heading text-zinc-900">{Math.round((completion / stepDefinitions.length) * 100)}%</p></div>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid gap-6 xl:grid-cols-[300px_1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface-muted/50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Evento</label>
            <select value={selectedEventId} onChange={(event) => setSelectedEventId(event.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent">
              {events.map((event) => <option key={event.id} value={event.id}>{event.nomeEvento} · {event.cidade}/{event.estado}</option>)}
            </select>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Logo do regulamento</label>
              <input type="file" accept="image/*" onChange={(event) => handleLogoUpload(event.target.files?.[0] ?? null)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface-muted/50 p-4">
            <div className="space-y-2">
              {stepDefinitions.map(([title, description], index) => (
                <button key={title} type="button" onClick={() => setStep(index)} className={`w-full rounded-2xl border px-4 py-4 text-left ${step === index ? "border-accent bg-accent-soft" : stepComplete(index, form) ? "border-emerald-200 bg-emerald-50" : "border-border bg-surface"}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Etapa {index + 1}</p>
                  <p className="mt-2 text-lg font-heading text-zinc-900">{title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface-muted/45 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Etapa {step + 1}</p>
            <h3 className="mt-2 text-2xl font-heading text-zinc-900">{stepDefinitions[step][0]}</h3>
            <p className="mt-2 text-sm text-zinc-600">{stepDefinitions[step][1]}</p>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-5">
            {step === 0 ? <div className="grid gap-3 md:grid-cols-3">{(Object.keys(templateCards) as RegulationTemplateType[]).map((template) => <button key={template} type="button" onClick={() => applyTemplate(template)} className={`rounded-2xl border p-4 text-left ${form.templateTipo === template ? "border-accent bg-accent-soft" : "border-border bg-surface-muted/60"}`}><p className="text-base font-heading text-zinc-900">{templateCards[template].label}</p><p className="mt-2 text-sm text-zinc-600">{templateCards[template].summary}</p></button>)}</div> : null}
            {step === 1 ? <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><Toggle checked={form.possuiKids} onChange={(checked) => setForm((prev) => ({ ...prev, possuiKids: checked }))} label="Possui corrida kids" /><Toggle checked={form.possuiChip} onChange={(checked) => setForm((prev) => ({ ...prev, possuiChip: checked }))} label="Possui chip de cronometragem" /><Toggle checked={form.exigeAtestadoMedico} onChange={(checked) => setForm((prev) => ({ ...prev, exigeAtestadoMedico: checked }))} label="Exige atestado médico" /></div><div className="grid gap-3 sm:grid-cols-2"><input type="number" min="1" value={form.tempoLimiteMinutos} onChange={(event) => setForm((prev) => ({ ...prev, tempoLimiteMinutos: event.target.value }))} placeholder="Tempo limite (minutos)" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><input type="number" min="1" value={form.limiteVagas} onChange={(event) => setForm((prev) => ({ ...prev, limiteVagas: event.target.value }))} placeholder="Limite de vagas" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></div><div className="grid gap-3 sm:grid-cols-3"><input type="number" min="1" value={form.faixaEtariaInicio} onChange={(event) => setForm((prev) => ({ ...prev, faixaEtariaInicio: event.target.value }))} placeholder="Faixa inicial" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><input type="number" min="1" value={form.faixaEtariaFim} onChange={(event) => setForm((prev) => ({ ...prev, faixaEtariaFim: event.target.value }))} placeholder="Faixa final" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><select value={form.intervaloFaixaEtaria} onChange={(event) => setForm((prev) => ({ ...prev, intervaloFaixaEtaria: event.target.value }))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent"><option value="2">2 em 2</option><option value="5">5 em 5</option><option value="10">10 em 10</option></select></div></div> : null}
            {step === 2 ? <div className="space-y-4"><div className="grid gap-2 sm:grid-cols-2">{platformOptions.map((platform) => <Toggle key={platform} checked={form.plataformaInscricao.includes(platform)} onChange={() => togglePlatform(platform)} label={platform} />)}</div><div className="grid gap-3 sm:grid-cols-2"><input type="number" min="0" step="0.01" value={form.valorInscricao} onChange={(event) => setForm((prev) => ({ ...prev, valorInscricao: event.target.value }))} placeholder="Valor da inscrição" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><input value={form.politicaCancelamento} onChange={(event) => setForm((prev) => ({ ...prev, politicaCancelamento: event.target.value }))} placeholder="Política de cancelamento" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></div><div className="grid gap-3 sm:grid-cols-2"><input type="date" value={form.dataInicioInscricao} onChange={(event) => setForm((prev) => ({ ...prev, dataInicioInscricao: event.target.value }))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><input type="date" value={form.dataFimInscricao} onChange={(event) => setForm((prev) => ({ ...prev, dataFimInscricao: event.target.value }))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></div><Toggle checked={form.permiteTransferencia} onChange={(checked) => setForm((prev) => ({ ...prev, permiteTransferencia: checked }))} label="Permite transferência de inscrição" /></div> : null}
            {step === 3 ? <div className="space-y-4"><textarea rows={4} value={form.kitDescricao} onChange={(event) => setForm((prev) => ({ ...prev, kitDescricao: event.target.value }))} placeholder="Descreva o kit do atleta" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><textarea rows={4} value={form.documentosObrigatorios} onChange={(event) => setForm((prev) => ({ ...prev, documentosObrigatorios: event.target.value }))} placeholder="Documentos obrigatórios" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><textarea rows={4} value={form.premiacaoDescricao} onChange={(event) => setForm((prev) => ({ ...prev, premiacaoDescricao: event.target.value }))} placeholder="Descreva a premiação" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><textarea rows={4} value={form.regrasGeraisExtra} onChange={(event) => setForm((prev) => ({ ...prev, regrasGeraisExtra: event.target.value }))} placeholder="Regras gerais extras" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><Toggle checked={form.permiteRetiradaTerceiros} onChange={(checked) => setForm((prev) => ({ ...prev, permiteRetiradaTerceiros: checked }))} label="Permite retirada do kit por terceiros" /><Toggle checked={form.possuiPremiacaoDinheiro} onChange={(checked) => setForm((prev) => ({ ...prev, possuiPremiacaoDinheiro: checked }))} label="Possui premiação em dinheiro" /></div> : null}
            {step === 4 ? <div className="space-y-4"><input type="email" value={form.emailContato} onChange={(event) => setForm((prev) => ({ ...prev, emailContato: event.target.value }))} placeholder="E-mail de contato" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><input value={form.whatsappContato} onChange={(event) => setForm((prev) => ({ ...prev, whatsappContato: event.target.value }))} placeholder="WhatsApp de contato" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /><textarea rows={3} value={form.politicaCancelamento} onChange={(event) => setForm((prev) => ({ ...prev, politicaCancelamento: event.target.value }))} placeholder="Resumo final da política de cancelamento" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></div> : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" disabled={step === 0} onClick={() => setStep((prev) => Math.max(0, prev - 1))} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-50">Voltar etapa</button>
            <div className="flex flex-wrap gap-2">
              {step < stepDefinitions.length - 1 ? <button type="button" onClick={() => setStep((prev) => Math.min(stepDefinitions.length - 1, prev + 1))} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-800">Próxima etapa</button> : null}
              <button type="submit" disabled={saving} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70">{saving ? "Salvando..." : "Salvar regulamento"}</button>
              <a href={selectedEventId ? `/api/regulation/export?eventId=${selectedEventId}` : "#"} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-zinc-700"><UiIcon name="download" className="h-4 w-4" />Exportar PDF</a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-surface-muted/45 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Resumo rápido</p>
            <div className="mt-4 space-y-3">
              <StatusRow label="Template" value={templateCards[form.templateTipo].label} />
              <StatusRow label="Plataformas" value={form.plataformaInscricao.length > 0 ? form.plataformaInscricao.join(", ") : "Nenhuma selecionada"} />
              <StatusRow label="Contato" value={form.emailContato || form.whatsappContato || "Ainda não informado"} />
              <StatusRow label="Inscrições" value={form.dataInicioInscricao && form.dataFimInscricao ? `${new Date(form.dataInicioInscricao).toLocaleDateString("pt-BR")} até ${new Date(form.dataFimInscricao).toLocaleDateString("pt-BR")}` : "Período ainda não definido"} />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface-muted/40 p-4">
            <h3 className="text-xl font-heading text-zinc-900">Preview do regulamento</h3>
            <pre className="mt-3 max-h-[820px] overflow-auto whitespace-pre-wrap rounded-2xl bg-white/80 p-4 font-sans text-sm leading-7 text-zinc-800">{previewText}</pre>
          </div>
        </div>
      </form>
    </section>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/50 px-4 py-3 text-sm text-zinc-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-white/80 p-3"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">{label}</p><p className="mt-2 text-sm text-zinc-800">{value}</p></div>;
}
