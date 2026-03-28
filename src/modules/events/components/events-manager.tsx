"use client";

import { Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { BaseModal } from "@/components/base-modal";
import { useUiFeedback } from "@/components/ui-feedback-provider";
import { EventDto } from "@/modules/events/types";

type EventPayload = {
  nomeEvento: string;
  dataEvento: string;
  cidade: string;
  estado: string;
  localLargada: string;
  organizador: string;
  cnpjOrganizador: string;
  modalidades: string;
  distancias: string;
  capacidadeMaxima: string;
  limiteTecnico: string;
  cronogramaResumo: string;
  patrocinadores: string;
  fornecedores: string;
  status: "PLANEJAMENTO" | "EM_ANDAMENTO" | "FINALIZADO";
};

type FormStep = 0 | 1 | 2 | 3;

const steps = [
  { title: "Identificação", description: "Nome, data, cidade e base da largada." },
  { title: "Operação", description: "Modalidades, distâncias, capacidade e cronograma." },
  { title: "Organização", description: "Organizador, CNPJ, parceiros e fornecedores." },
  { title: "Revisão", description: "Validação final antes de salvar o evento." },
] as const;

const initialForm: EventPayload = {
  nomeEvento: "",
  dataEvento: "",
  cidade: "",
  estado: "",
  localLargada: "",
  organizador: "",
  cnpjOrganizador: "",
  modalidades: "",
  distancias: "",
  capacidadeMaxima: "",
  limiteTecnico: "",
  cronogramaResumo: "",
  patrocinadores: "",
  fornecedores: "",
  status: "PLANEJAMENTO",
};

function summarize(value: string | null, fallback: string) {
  if (!value) return fallback;
  return value.length > 60 ? `${value.slice(0, 60)}...` : value;
}

function toFormValue(event: EventDto): EventPayload {
  return {
    nomeEvento: event.nomeEvento,
    dataEvento: event.dataEvento.slice(0, 10),
    cidade: event.cidade,
    estado: event.estado,
    localLargada: event.localLargada,
    organizador: event.organizador,
    cnpjOrganizador: event.cnpjOrganizador,
    modalidades: event.modalidades ?? "",
    distancias: event.distancias ?? "",
    capacidadeMaxima: event.capacidadeMaxima ? String(event.capacidadeMaxima) : "",
    limiteTecnico: event.limiteTecnico ?? "",
    cronogramaResumo: event.cronogramaResumo ?? "",
    patrocinadores: event.patrocinadores ?? "",
    fornecedores: event.fornecedores ?? "",
    status: event.status,
  };
}

function getFieldCount(step: FormStep, form: EventPayload) {
  switch (step) {
    case 0:
      return [form.nomeEvento, form.dataEvento, form.cidade, form.estado, form.localLargada].filter(Boolean)
        .length;
    case 1:
      return [
        form.modalidades,
        form.distancias,
        form.capacidadeMaxima,
        form.limiteTecnico,
        form.cronogramaResumo,
      ].filter(Boolean).length;
    case 2:
      return [form.organizador, form.cnpjOrganizador, form.patrocinadores, form.fornecedores].filter(Boolean)
        .length;
    default:
      return 0;
  }
}

function getStepStatus(index: number, currentStep: FormStep, form: EventPayload) {
  if (index === 3) {
    const ready =
      Boolean(form.nomeEvento) &&
      Boolean(form.dataEvento) &&
      Boolean(form.cidade) &&
      Boolean(form.estado) &&
      Boolean(form.localLargada) &&
      Boolean(form.organizador) &&
      Boolean(form.cnpjOrganizador);

    if (currentStep === 3) return "current";
    return ready ? "done" : "pending";
  }

  const count = getFieldCount(index as FormStep, form);
  if (currentStep === index) return "current";
  if (count >= 3 || (index === 0 && count >= 5)) return "done";
  return "pending";
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-lg font-heading text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm text-zinc-800">{value}</p>
    </div>
  );
}

function EventInlineEditor({
  form,
  setForm,
}: {
  form: EventPayload;
  setForm: Dispatch<SetStateAction<EventPayload>>;
}) {
  return (
    <div className="mt-4 grid gap-3 rounded-3xl border border-accent/20 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input value={form.nomeEvento} onChange={(e) => setForm((p) => ({ ...p, nomeEvento: e.target.value }))} placeholder="Nome do evento" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input type="date" value={form.dataEvento} onChange={(e) => setForm((p) => ({ ...p, dataEvento: e.target.value }))} className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <input value={form.cidade} onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))} placeholder="Cidade" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} placeholder="Estado" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.localLargada} onChange={(e) => setForm((p) => ({ ...p, localLargada: e.target.value }))} placeholder="Local de largada" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input value={form.modalidades} onChange={(e) => setForm((p) => ({ ...p, modalidades: e.target.value }))} placeholder="Modalidades" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.distancias} onChange={(e) => setForm((p) => ({ ...p, distancias: e.target.value }))} placeholder="Distâncias" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input type="number" value={form.capacidadeMaxima} onChange={(e) => setForm((p) => ({ ...p, capacidadeMaxima: e.target.value }))} placeholder="Capacidade máxima" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.limiteTecnico} onChange={(e) => setForm((p) => ({ ...p, limiteTecnico: e.target.value }))} placeholder="Limite técnico" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.organizador} onChange={(e) => setForm((p) => ({ ...p, organizador: e.target.value }))} placeholder="Organizador" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.cnpjOrganizador} onChange={(e) => setForm((p) => ({ ...p, cnpjOrganizador: e.target.value }))} placeholder="CNPJ" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input value={form.patrocinadores} onChange={(e) => setForm((p) => ({ ...p, patrocinadores: e.target.value }))} placeholder="Patrocinadores" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.fornecedores} onChange={(e) => setForm((p) => ({ ...p, fornecedores: e.target.value }))} placeholder="Fornecedores" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <textarea rows={3} value={form.cronogramaResumo} onChange={(e) => setForm((p) => ({ ...p, cronogramaResumo: e.target.value }))} placeholder="Cronograma resumido" className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EventPayload["status"] }))} className="rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent">
          <option value="PLANEJAMENTO">Planejamento</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="FINALIZADO">Finalizado</option>
        </select>
      </div>
    </div>
  );
}

function EventCreateForm({
  form,
  setForm,
  formStep,
  setFormStep,
  reviewItems,
  error,
  submitting,
  onSubmit,
  onReset,
}: {
  form: EventPayload;
  setForm: Dispatch<SetStateAction<EventPayload>>;
  formStep: FormStep;
  setFormStep: Dispatch<SetStateAction<FormStep>>;
  reviewItems: Array<{ label: string; value: string }>;
  error: string;
  submitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  function handleNextStep() {
    setFormStep((prev) => Math.min(3, prev + 1) as FormStep);
  }

  function handlePreviousStep() {
    setFormStep((prev) => Math.max(0, prev - 1) as FormStep);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Cadastro assistido</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Preencha por etapas. A edição depois acontece direto no card do evento.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(index, formStep, form);

          return (
            <button
              key={step.title}
              type="button"
              onClick={() => setFormStep(index as FormStep)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                status === "current"
                  ? "border-accent bg-accent-soft"
                  : status === "done"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-border bg-surface-muted/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Etapa {index + 1}
                  </p>
                  <p className="mt-2 text-lg font-heading text-zinc-900">{step.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{step.description}</p>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {status === "current" ? "Em edição" : status === "done" ? "OK" : "Pendente"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-surface-muted/60 p-4">
        {formStep === 0 ? <CreateStepOne form={form} setForm={setForm} /> : null}
        {formStep === 1 ? <CreateStepTwo form={form} setForm={setForm} /> : null}
        {formStep === 2 ? <CreateStepThree form={form} setForm={setForm} /> : null}
        {formStep === 3 ? (
          <div className="space-y-4">
            <SectionHeader title="Revisão final" description="Confira o resumo antes de salvar o evento no sistema." />
            <div className="grid gap-3 sm:grid-cols-2">
              {reviewItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-surface p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm text-zinc-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handlePreviousStep} disabled={formStep === 0} className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-semibold text-zinc-700 disabled:opacity-50">Voltar</button>
        {formStep < 3 ? (
          <button type="button" onClick={handleNextStep} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-800">Avançar etapa</button>
        ) : (
          <button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">{submitting ? "Salvando..." : "Criar evento"}</button>
        )}
        <button type="button" onClick={onReset} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-zinc-700">Limpar</button>
      </div>
    </form>
  );
}

export function EventsManager() {
  const { confirm, showToast } = useUiFeedback();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [form, setForm] = useState<EventPayload>(initialForm);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<EventPayload>(initialForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [formStep, setFormStep] = useState<FormStep>(0);

  const reviewItems = useMemo(
    () => [
      { label: "Evento", value: form.nomeEvento || "Não informado" },
      {
        label: "Data e local",
        value:
          form.dataEvento && form.cidade && form.estado
            ? `${new Date(form.dataEvento).toLocaleDateString("pt-BR")} · ${form.cidade}/${form.estado}`
            : "Não informado",
      },
      { label: "Largada", value: form.localLargada || "Não informado" },
      { label: "Modalidades", value: form.modalidades || "Não informado" },
      { label: "Distâncias", value: form.distancias || "Não informado" },
      { label: "Capacidade", value: form.capacidadeMaxima ? `${form.capacidadeMaxima} atletas` : "Não informada" },
      { label: "Organizador", value: form.organizador || "Não informado" },
      { label: "CNPJ", value: form.cnpjOrganizador || "Não informado" },
      { label: "Patrocinadores", value: form.patrocinadores || "Não informado" },
      { label: "Fornecedores", value: form.fornecedores || "Não informado" },
    ],
    [form],
  );

  async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  const loadEvents = useCallback(async (showLoading = true) => {
    try {
      setError("");
      if (showLoading) setLoading(true);
      const response = await fetchWithTimeout("/api/events", { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar os eventos.");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as { events?: EventDto[] };
      setEvents(Array.isArray(data.events) ? data.events : []);
      setLoading(false);
    } catch {
      setError("Falha de conexão ao carregar eventos.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents(false);
  }, [loadEvents]);

  function resetCreateForm() {
    setForm(initialForm);
    setFormStep(0);
    setError("");
  }

  function openCreateModal() {
    resetCreateForm();
    setShowCreateModal(true);
  }

  function closeCreateModal() {
    setShowCreateModal(false);
    resetCreateForm();
  }

  function startInlineEdit(item: EventDto) {
    setInlineEditId(item.id);
    setInlineForm(toFormValue(item));
    setError("");
  }

  function cancelInlineEdit() {
    setInlineEditId(null);
    setInlineForm(initialForm);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetchWithTimeout("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacidadeMaxima: form.capacidadeMaxima ? Number(form.capacidadeMaxima) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível salvar o evento.");
        showToast({ tone: "error", title: "Falha ao salvar evento", message: "Revise os dados obrigatórios e tente novamente." });
        return;
      }

      closeCreateModal();
      await loadEvents(false);
      showToast({ tone: "success", title: "Evento criado", message: "O cadastro foi salvo com sucesso." });
    } catch {
      setError("Falha de conexão ao salvar evento.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInlineSave(id: string) {
    setInlineSaving(true);
    setError("");
    try {
      const response = await fetchWithTimeout(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...inlineForm,
          capacidadeMaxima: inlineForm.capacidadeMaxima ? Number(inlineForm.capacidadeMaxima) : null,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível atualizar o evento.");
        showToast({ tone: "error", title: "Falha ao atualizar evento", message: "Revise os dados e tente novamente." });
        return;
      }
      await loadEvents(false);
      cancelInlineEdit();
      showToast({ tone: "success", title: "Evento atualizado", message: "As informações foram ajustadas no próprio card." });
    } catch {
      setError("Falha de conexão ao atualizar evento.");
    } finally {
      setInlineSaving(false);
    }
  }

  async function handleDelete(id: string, eventName: string) {
    const confirmed = await confirm({
      title: "Remover evento",
      description: `Deseja remover "${eventName}"? Essa ação não pode ser desfeita.`,
      confirmLabel: "Remover evento",
      cancelLabel: "Cancelar",
      tone: "danger",
    });

    if (!confirmed) return;

    try {
      const response = await fetchWithTimeout(`/api/events/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Não foi possível remover o evento.");
        return;
      }
      await loadEvents(false);
      if (inlineEditId === id) cancelInlineEdit();
      showToast({ tone: "info", title: "Evento removido", message: "A lista foi atualizada." });
    } catch {
      setError("Falha de conexão ao remover evento.");
    }
  }

  return (
    <>
      <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Eventos</p>
            <h3 className="mt-2 text-3xl font-heading text-zinc-900">Pipeline de projetos</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Crie novos eventos em modal e edite direto no card, sem ocupar espaço fixo na tela.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Total</p>
              <p className="mt-1 text-2xl font-heading text-zinc-900">{events.length}</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
            >
              Novo evento
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-600">Carregando eventos...</p>
        ) : (
          <div className="mt-5 space-y-3">
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-6 text-center text-zinc-500">
                Nenhum evento cadastrado ainda.
              </div>
            ) : (
              events.map((item) => {
                const isEditing = inlineEditId === item.id;

                return (
                  <article key={item.id} className="rounded-3xl border border-border bg-surface-muted/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-2xl font-heading text-zinc-900">{item.nomeEvento}</h4>
                        <p className="text-sm text-zinc-600">
                          {new Date(item.dataEvento).toLocaleDateString("pt-BR")} · {item.cidade}/{item.estado}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!isEditing ? (
                          <button type="button" onClick={() => startInlineEdit(item)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-zinc-700">Editar no card</button>
                        ) : (
                          <>
                            <button type="button" onClick={() => void handleInlineSave(item.id)} disabled={inlineSaving} className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{inlineSaving ? "Salvando..." : "Salvar"}</button>
                            <button type="button" onClick={cancelInlineEdit} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-zinc-700">Cancelar</button>
                          </>
                        )}
                        <button type="button" onClick={() => void handleDelete(item.id, item.nomeEvento)} className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600">Remover</button>
                      </div>
                    </div>

                    {isEditing ? (
                      <EventInlineEditor form={inlineForm} setForm={setInlineForm} />
                    ) : (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InfoCard label="Status" value={item.status.replace("_", " ")} />
                        <InfoCard label="Modalidades" value={summarize(item.modalidades, "Não informado")} />
                        <InfoCard label="Distâncias" value={summarize(item.distancias, "Não informado")} />
                        <InfoCard label="Capacidade" value={item.capacidadeMaxima ? `${item.capacidadeMaxima} atletas` : "Não informada"} />
                        <InfoCard label="Limite técnico" value={summarize(item.limiteTecnico, "Não informado")} />
                        <InfoCard label="Patrocinadores" value={summarize(item.patrocinadores, "Não informado")} />
                        <InfoCard label="Fornecedores" value={summarize(item.fornecedores, "Não informado")} />
                        <InfoCard label="Cronograma" value={summarize(item.cronogramaResumo, "Não informado")} />
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        )}
      </section>

      <BaseModal
        open={showCreateModal}
        onClose={closeCreateModal}
        title="Novo evento"
        description="Crie um evento novo sem ocupar espaço fixo na tela."
      >
        <EventCreateForm
          form={form}
          setForm={setForm}
          formStep={formStep}
          setFormStep={setFormStep}
          reviewItems={reviewItems}
          error={error}
          submitting={submitting}
          onSubmit={handleCreate}
          onReset={resetCreateForm}
        />
      </BaseModal>
    </>
  );
}

function CreateStepOne({ form, setForm }: { form: EventPayload; setForm: Dispatch<SetStateAction<EventPayload>> }) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Identificação do evento" description="Cadastre o básico para o time reconhecer a prova rapidamente." />
      <input required value={form.nomeEvento} onChange={(e) => setForm((p) => ({ ...p, nomeEvento: e.target.value }))} placeholder="Nome do evento" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <input type="date" required value={form.dataEvento} onChange={(e) => setForm((p) => ({ ...p, dataEvento: e.target.value }))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <div className="grid grid-cols-2 gap-3">
        <input required value={form.cidade} onChange={(e) => setForm((p) => ({ ...p, cidade: e.target.value }))} placeholder="Cidade" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input required value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} placeholder="Estado" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <input required value={form.localLargada} onChange={(e) => setForm((p) => ({ ...p, localLargada: e.target.value }))} placeholder="Local de largada" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
    </div>
  );
}

function CreateStepTwo({ form, setForm }: { form: EventPayload; setForm: Dispatch<SetStateAction<EventPayload>> }) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Configuração operacional" description="Defina o porte da prova e os dados de execução do evento." />
      <input value={form.modalidades} onChange={(e) => setForm((p) => ({ ...p, modalidades: e.target.value }))} placeholder="Modalidades: corrida, caminhada, kids" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <input value={form.distancias} onChange={(e) => setForm((p) => ({ ...p, distancias: e.target.value }))} placeholder="Distâncias: 5K, 10K, 21K" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <div className="grid gap-3 md:grid-cols-2">
        <input type="number" min="1" value={form.capacidadeMaxima} onChange={(e) => setForm((p) => ({ ...p, capacidadeMaxima: e.target.value }))} placeholder="Capacidade máxima" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
        <input value={form.limiteTecnico} onChange={(e) => setForm((p) => ({ ...p, limiteTecnico: e.target.value }))} placeholder="Limite técnico" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <textarea rows={4} value={form.cronogramaResumo} onChange={(e) => setForm((p) => ({ ...p, cronogramaResumo: e.target.value }))} placeholder="Resumo do cronograma principal" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
    </div>
  );
}

function CreateStepThree({ form, setForm }: { form: EventPayload; setForm: Dispatch<SetStateAction<EventPayload>> }) {
  return (
    <div className="space-y-3">
      <SectionHeader title="Organização e parceiros" description="Garanta que a base legal e comercial esteja ligada ao evento." />
      <input required value={form.organizador} onChange={(e) => setForm((p) => ({ ...p, organizador: e.target.value }))} placeholder="Organizador responsável" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <input required value={form.cnpjOrganizador} onChange={(e) => setForm((p) => ({ ...p, cnpjOrganizador: e.target.value }))} placeholder="CNPJ do organizador" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <input value={form.patrocinadores} onChange={(e) => setForm((p) => ({ ...p, patrocinadores: e.target.value }))} placeholder="Patrocinadores principais" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <input value={form.fornecedores} onChange={(e) => setForm((p) => ({ ...p, fornecedores: e.target.value }))} placeholder="Fornecedores principais" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" />
      <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EventPayload["status"] }))} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent">
        <option value="PLANEJAMENTO">Planejamento</option>
        <option value="EM_ANDAMENTO">Em andamento</option>
        <option value="FINALIZADO">Finalizado</option>
      </select>
    </div>
  );
}
