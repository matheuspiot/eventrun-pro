"use client";

import { Dispatch, FormEvent, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react";
import { BaseModal } from "@/components/base-modal";
import { UiIcon } from "@/components/ui-icon";
import { useUiFeedback } from "@/components/ui-feedback-provider";
import { EventDto } from "@/modules/events/types";
import { OperationTaskDto } from "../types";

type TaskForm = {
  fase: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  status: OperationTaskDto["status"];
  observacoes: string;
};

const initialTaskForm: TaskForm = {
  fase: "Planejamento",
  titulo: "",
  descricao: "",
  responsavel: "",
  prazo: "",
  status: "PENDENTE",
  observacoes: "",
};

const statusLabels = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
} as const;

const quickPhases = ["Planejamento", "Comercial", "Inscrições", "Produção", "Execução", "Pós-prova"];

function getStatusBadgeClasses(status: OperationTaskDto["status"]) {
  if (status === "CONCLUIDA") return "bg-emerald-100 text-emerald-700";
  if (status === "EM_ANDAMENTO") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTime(value: string | null) {
  if (!value) return "Sem lembrete";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toTaskForm(task: OperationTaskDto): TaskForm {
  return {
    fase: task.fase,
    titulo: task.titulo,
    descricao: task.descricao ?? "",
    responsavel: task.responsavel ?? "",
    prazo: task.prazo ? task.prazo.slice(0, 10) : "",
    status: task.status,
    observacoes: task.observacoes ?? "",
  };
}

function TaskEditor({
  form,
  setForm,
}: {
  form: TaskForm;
  setForm: Dispatch<SetStateAction<TaskForm>>;
}) {
  return (
    <>
      <input
        value={form.fase}
        onChange={(event) => setForm((prev) => ({ ...prev, fase: event.target.value }))}
        placeholder="Fase"
        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        value={form.titulo}
        onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
        placeholder="Título da tarefa"
        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
      />
      <textarea
        rows={3}
        value={form.descricao}
        onChange={(event) => setForm((prev) => ({ ...prev, descricao: event.target.value }))}
        placeholder="Descrição"
        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={form.responsavel}
          onChange={(event) => setForm((prev) => ({ ...prev, responsavel: event.target.value }))}
          placeholder="Responsável"
          className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="date"
          value={form.prazo}
          onChange={(event) => setForm((prev) => ({ ...prev, prazo: event.target.value }))}
          className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <select
        value={form.status}
        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as OperationTaskDto["status"] }))}
        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <textarea
        rows={4}
        value={form.observacoes}
        onChange={(event) => setForm((prev) => ({ ...prev, observacoes: event.target.value }))}
        placeholder="Observações"
        className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
      />
    </>
  );
}

export function OperationsPlanner() {
  const { confirm, showToast } = useUiFeedback();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [tasks, setTasks] = useState<OperationTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TaskForm>(initialTaskForm);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<TaskForm>(initialTaskForm);
  const [selectedPhase, setSelectedPhase] = useState("Todas");
  const [reminderTask, setReminderTask] = useState<OperationTaskDto | null>(null);
  const [reminderValue, setReminderValue] = useState("");

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) {
        setError("Não foi possível carregar os eventos.");
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
    async function loadTasks() {
      if (!selectedEventId) {
        setTasks([]);
        return;
      }

      setTasksLoading(true);
      setError("");

      const response = await fetch(`/api/operation-tasks?eventId=${selectedEventId}`, { cache: "no-store" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Não foi possível carregar as tarefas.");
        setTasksLoading(false);
        return;
      }

      const data = (await response.json()) as { tasks: OperationTaskDto[] };
      setTasks(data.tasks);
      setTasksLoading(false);
    }

    void loadTasks();
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );

  const filteredTasks = useMemo(
    () => (selectedPhase === "Todas" ? tasks : tasks.filter((task) => task.fase === selectedPhase)),
    [selectedPhase, tasks],
  );

  const groupedTasks = useMemo(
    () =>
      filteredTasks.reduce<Record<string, OperationTaskDto[]>>((acc, task) => {
        if (!acc[task.fase]) acc[task.fase] = [];
        acc[task.fase].push(task);
        return acc;
      }, {}),
    [filteredTasks],
  );

  const summary = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "CONCLUIDA").length;
    const inProgress = tasks.filter((task) => task.status === "EM_ANDAMENTO").length;
    const pending = tasks.filter((task) => task.status === "PENDENTE").length;
    return { total, done, inProgress, pending };
  }, [tasks]);

  function sortTasks(nextTasks: OperationTaskDto[]) {
    return [...nextTasks].sort((a, b) => a.ordem - b.ordem || a.titulo.localeCompare(b.titulo, "pt-BR"));
  }

  function resetCreateForm() {
    setForm(initialTaskForm);
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

  function startInlineEdit(task: OperationTaskDto) {
    setInlineEditId(task.id);
    setInlineForm(toTaskForm(task));
    setError("");
  }

  function cancelInlineEdit() {
    setInlineEditId(null);
    setInlineForm(initialTaskForm);
  }

  function openReminderModal(task: OperationTaskDto) {
    setReminderTask(task);
    setReminderValue(toDateTimeLocal(task.lembreteEm));
    setShowReminderModal(true);
  }

  function closeReminderModal() {
    setReminderTask(null);
    setReminderValue("");
    setShowReminderModal(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventId) {
      setError("Selecione um evento.");
      return;
    }

    setSaving(true);
    setError("");

    const response = await fetch("/api/operation-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: selectedEventId,
        fase: form.fase,
        titulo: form.titulo,
        descricao: form.descricao || null,
        responsavel: form.responsavel || null,
        prazo: form.prazo || null,
        status: form.status,
        observacoes: form.observacoes || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar a tarefa.");
      showToast({ tone: "error", title: "Falha ao salvar tarefa", message: "Revise os campos e tente novamente." });
      setSaving(false);
      return;
    }

    const data = (await response.json()) as { task: OperationTaskDto };
    setTasks((prev) => sortTasks([...prev, data.task]));
    setSaving(false);
    closeCreateModal();
    showToast({ tone: "success", title: "Tarefa criada", message: "O checklist operacional foi atualizado com sucesso." });
  }

  async function saveInlineTask(id: string) {
    setInlineSaving(true);
    setError("");

    const response = await fetch(`/api/operation-tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fase: inlineForm.fase,
        titulo: inlineForm.titulo,
        descricao: inlineForm.descricao || null,
        responsavel: inlineForm.responsavel || null,
        prazo: inlineForm.prazo || null,
        status: inlineForm.status,
        observacoes: inlineForm.observacoes || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível atualizar a tarefa.");
      showToast({ tone: "error", title: "Falha ao atualizar tarefa", message: "Revise os campos e tente novamente." });
      setInlineSaving(false);
      return;
    }

    const data = (await response.json()) as { task: OperationTaskDto };
    setTasks((prev) => sortTasks(prev.map((item) => (item.id === data.task.id ? data.task : item))));
    cancelInlineEdit();
    setInlineSaving(false);
    showToast({ tone: "success", title: "Tarefa atualizada", message: "A edição foi feita no próprio card." });
  }

  async function saveReminder() {
    if (!reminderTask) return;

    setReminderSaving(true);
    const response = await fetch(`/api/operation-tasks/${reminderTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lembreteEm: reminderValue ? new Date(reminderValue).toISOString() : null,
      }),
    });

    if (!response.ok) {
      setReminderSaving(false);
      showToast({ tone: "error", title: "Falha ao salvar lembrete", message: "Tente novamente em alguns instantes." });
      return;
    }

    const data = (await response.json()) as { task: OperationTaskDto };
    setTasks((prev) => sortTasks(prev.map((item) => (item.id === data.task.id ? data.task : item))));
    setReminderSaving(false);
    closeReminderModal();
    showToast({
      tone: "success",
      title: "Lembrete atualizado",
      message: data.task.lembreteEm ? "O lembrete foi programado com sucesso." : "O lembrete foi removido.",
    });
  }

  async function updateTaskStatus(task: OperationTaskDto, status: OperationTaskDto["status"]) {
    const response = await fetch(`/api/operation-tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError("Não foi possível atualizar o status da tarefa.");
      showToast({ tone: "error", title: "Falha ao atualizar status", message: "A tarefa permaneceu no estado anterior." });
      return;
    }

    const data = (await response.json()) as { task: OperationTaskDto };
    setTasks((prev) => prev.map((item) => (item.id === task.id ? data.task : item)));
    showToast({ tone: "success", title: "Status atualizado", message: `${task.titulo} foi atualizado para ${statusLabels[status].toLowerCase()}.` });
  }

  async function deleteTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const confirmed = await confirm({
      title: "Remover tarefa",
      description: `Deseja remover "${task.titulo}" do checklist?`,
      confirmLabel: "Remover tarefa",
      cancelLabel: "Voltar",
      tone: "danger",
    });
    if (!confirmed) return;

    const response = await fetch(`/api/operation-tasks/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Não foi possível remover a tarefa.");
      showToast({ tone: "error", title: "Falha ao remover tarefa" });
      return;
    }

    setTasks((prev) => prev.filter((taskItem) => taskItem.id !== id));
    if (inlineEditId === id) cancelInlineEdit();
    showToast({ tone: "success", title: "Tarefa removida", message: "O checklist foi atualizado." });
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-slate-600">Carregando operação...</p>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
        <header className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_48%,#eef8f1_100%)] p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Operação</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-heading text-slate-950">Checklist da prova</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">
                Crie tarefas em modal, edite direto no card e programe lembretes sem poluir a tela.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
            >
              <UiIcon name="plus" className="h-4 w-4" />
              Nova tarefa
            </button>
          </div>
        </header>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Total" value={String(summary.total)} />
              <SummaryCard label="Pendentes" value={String(summary.pending)} />
              <SummaryCard label="Em andamento" value={String(summary.inProgress)} />
              <SummaryCard label="Concluídas" value={String(summary.done)} />
            </div>
          </section>

          <section className="rounded-[32px] border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-heading text-slate-950">Leitura da operação</h3>
                <p className="mt-2 text-sm text-slate-600">Filtre por fase e atualize o checklist sem perder visão do todo.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterChip active={selectedPhase === "Todas"} onClick={() => setSelectedPhase("Todas")}>
                  Todas
                </FilterChip>
                {Array.from(new Set(tasks.map((task) => task.fase))).map((phase) => (
                  <FilterChip key={phase} active={selectedPhase === phase} onClick={() => setSelectedPhase(phase)}>
                    {phase}
                  </FilterChip>
                ))}
              </div>
            </div>

            {tasksLoading ? (
              <p className="mt-4 text-sm text-slate-600">Carregando tarefas...</p>
            ) : Object.keys(groupedTasks).length === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-border bg-surface-muted/70 p-6 text-sm text-slate-600">
                Nenhuma tarefa encontrada para este evento.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {Object.entries(groupedTasks).map(([fase, phaseTasks]) => (
                  <div key={fase} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-heading text-slate-950">{fase}</h4>
                      <span className="text-xs uppercase tracking-[0.15em] text-slate-500">{phaseTasks.length} tarefa(s)</span>
                    </div>

                    {phaseTasks.map((task) => {
                      const isEditing = inlineEditId === task.id;

                      return (
                        <article key={task.id} className="rounded-3xl border border-border bg-surface-muted/60 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h5 className="text-lg font-semibold text-slate-950">{task.titulo}</h5>
                              <p className="mt-1 text-sm text-slate-600">{task.descricao || "Sem descrição"}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(task.status)}`}>
                              {statusLabels[task.status]}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="mt-4 rounded-3xl border border-accent/20 bg-white p-4">
                              <TaskEditor form={inlineForm} setForm={setInlineForm} />
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void saveInlineTask(task.id)}
                                  disabled={inlineSaving}
                                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                  {inlineSaving ? "Salvando..." : "Salvar"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelInlineEdit}
                                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-slate-700"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="mt-4 grid gap-3 md:grid-cols-4">
                                <MiniInfo label="Responsável" value={task.responsavel || "Não definido"} />
                                <MiniInfo label="Prazo" value={formatDate(task.prazo)} />
                                <MiniInfo label="Lembrete" value={formatDateTime(task.lembreteEm)} />
                                <MiniInfo label="Observações" value={task.observacoes || "Sem observações"} />
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(task)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  <UiIcon name="edit" className="h-3.5 w-3.5" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReminderModal(task)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                                >
                                  <UiIcon name="calendar" className="h-3.5 w-3.5" />
                                  Lembrete
                                </button>
                                {task.status !== "EM_ANDAMENTO" ? (
                                  <button
                                    type="button"
                                    onClick={() => void updateTaskStatus(task, "EM_ANDAMENTO")}
                                    className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700"
                                  >
                                    Marcar em andamento
                                  </button>
                                ) : null}
                                {task.status !== "CONCLUIDA" ? (
                                  <button
                                    type="button"
                                    onClick={() => void updateTaskStatus(task, "CONCLUIDA")}
                                    className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700"
                                  >
                                    Concluir
                                  </button>
                                ) : null}
                                {task.status !== "PENDENTE" ? (
                                  <button
                                    type="button"
                                    onClick={() => void updateTaskStatus(task, "PENDENTE")}
                                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                                  >
                                    Voltar para pendente
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => void deleteTask(task.id)}
                                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                                >
                                  Remover
                                </button>
                              </div>
                            </>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <BaseModal
        open={showCreateModal}
        onClose={closeCreateModal}
        title="Nova tarefa"
        description="Crie uma tarefa sem ocupar espaço fixo na tela."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Evento</label>
            <select
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              className="w-full rounded-2xl border border-border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.nomeEvento} - {event.cidade}/{event.estado}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm text-slate-600">
              Evento ativo: <strong>{selectedEvent?.nomeEvento ?? "-"}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Fase rápida</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {quickPhases.map((phase) => (
                <FilterChip
                  key={phase}
                  active={form.fase === phase}
                  onClick={() => setForm((prev) => ({ ...prev, fase: phase }))}
                >
                  {phase}
                </FilterChip>
              ))}
            </div>
          </div>

          <TaskEditor form={form} setForm={setForm} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <UiIcon name="plus" className="h-4 w-4" />
            {saving ? "Salvando..." : "Criar tarefa"}
          </button>
        </form>
      </BaseModal>

      <BaseModal
        open={showReminderModal}
        onClose={closeReminderModal}
        title="Lembrete da tarefa"
        description="Escolha quando o sistema deve destacar essa tarefa no sino de notificações."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
            <p className="text-sm font-semibold text-slate-950">{reminderTask?.titulo ?? "Tarefa"}</p>
            <p className="mt-1 text-sm text-slate-600">Evento: {selectedEvent?.nomeEvento ?? "-"}</p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Data e hora do lembrete
            </label>
            <input
              type="datetime-local"
              value={reminderValue}
              onChange={(event) => setReminderValue(event.target.value)}
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="mt-2 text-xs text-slate-500">Deixe em branco para remover o lembrete atual.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void saveReminder()}
              disabled={reminderSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              <UiIcon name="calendar" className="h-4 w-4" />
              {reminderSaving ? "Salvando..." : "Salvar lembrete"}
            </button>
            <button
              type="button"
              onClick={closeReminderModal}
              className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-xs font-semibold shadow-sm transition ${
        active
          ? "bg-accent text-white shadow-[0_10px_24px_rgba(0,122,255,0.2)]"
          : "border border-border bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-heading text-slate-950">{value}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-3">
      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-800">{value}</p>
    </div>
  );
}
