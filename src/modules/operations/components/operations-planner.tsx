"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  ordem: string;
};

const initialTaskForm: TaskForm = {
  fase: "Planejamento",
  titulo: "",
  descricao: "",
  responsavel: "",
  prazo: "",
  status: "PENDENTE",
  observacoes: "",
  ordem: "100",
};

const statusLabels = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
} as const;

function getStatusBadgeClasses(status: OperationTaskDto["status"]) {
  switch (status) {
    case "CONCLUIDA":
      return "bg-emerald-100 text-emerald-700";
    case "EM_ANDAMENTO":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  return new Date(value).toLocaleDateString("pt-BR");
}

export function OperationsPlanner() {
  const { confirm, showToast } = useUiFeedback();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [tasks, setTasks] = useState<OperationTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TaskForm>(initialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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

      const response = await fetch(`/api/operation-tasks?eventId=${selectedEventId}`, {
        cache: "no-store",
      });

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

  const groupedTasks = useMemo(() => {
    return tasks.reduce<Record<string, OperationTaskDto[]>>((acc, task) => {
      if (!acc[task.fase]) {
        acc[task.fase] = [];
      }
      acc[task.fase].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const summary = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "CONCLUIDA").length;
    const inProgress = tasks.filter((task) => task.status === "EM_ANDAMENTO").length;
    const pending = tasks.filter((task) => task.status === "PENDENTE").length;

    return { total, done, inProgress, pending };
  }, [tasks]);

  function resetForm() {
    setForm(initialTaskForm);
    setEditingTaskId(null);
  }

  function startEdit(task: OperationTaskDto) {
    setEditingTaskId(task.id);
    setForm({
      fase: task.fase,
      titulo: task.titulo,
      descricao: task.descricao ?? "",
      responsavel: task.responsavel ?? "",
      prazo: task.prazo ? task.prazo.slice(0, 10) : "",
      status: task.status,
      observacoes: task.observacoes ?? "",
      ordem: String(task.ordem),
    });
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEventId) {
      setError("Selecione um evento.");
      return;
    }

    setSaving(true);
    setError("");

    const method = editingTaskId ? "PATCH" : "POST";
    const url = editingTaskId ? `/api/operation-tasks/${editingTaskId}` : "/api/operation-tasks";

    const response = await fetch(url, {
      method,
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
        ordem: Number(form.ordem) || 0,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível salvar a tarefa.");
      showToast({
        tone: "error",
        title: "Falha ao salvar tarefa",
        message: "Revise os campos e tente novamente.",
      });
      setSaving(false);
      return;
    }

    const data = await response.json();
    const nextTask = data.task as OperationTaskDto;
    setTasks((prev) => {
      if (editingTaskId) {
        return prev.map((task) => (task.id === nextTask.id ? nextTask : task));
      }
      return [...prev, nextTask].sort((a, b) => a.ordem - b.ordem);
    });

    setSaving(false);
    resetForm();
    showToast({
      tone: "success",
      title: editingTaskId ? "Tarefa atualizada" : "Tarefa criada",
      message: "O checklist operacional foi atualizado com sucesso.",
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
      showToast({
        tone: "error",
        title: "Falha ao atualizar status",
        message: "A tarefa permaneceu no estado anterior.",
      });
      return;
    }

    const data = (await response.json()) as { task: OperationTaskDto };
    setTasks((prev) => prev.map((item) => (item.id === task.id ? data.task : item)));
    showToast({
      tone: "success",
      title: "Status atualizado",
      message: `${task.titulo} foi atualizado para ${statusLabels[status].toLowerCase()}.`,
    });
  }

  async function deleteTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    if (!task) {
      return;
    }

    const confirmed = await confirm({
      title: "Remover tarefa",
      description: `Deseja remover "${task.titulo}" do checklist?`,
      confirmLabel: "Remover tarefa",
      cancelLabel: "Voltar",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/operation-tasks/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Não foi possível remover a tarefa.");
      showToast({
        tone: "error",
        title: "Falha ao remover tarefa",
      });
      return;
    }

    setTasks((prev) => prev.filter((taskItem) => taskItem.id !== id));
    showToast({
      tone: "success",
      title: "Tarefa removida",
      message: "O checklist foi atualizado.",
    });
  }

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm text-slate-600">Carregando operação...</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_48%,#eef8f1_100%)] p-8 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Operação
        </p>
        <h2 className="mt-3 text-4xl font-heading text-slate-950">Checklist da prova</h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-600">
          Controle tarefas por evento, responsável, prazo e fase com menos atrito e mais clareza.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-sm"
        >
          <div>
            <h3 className="text-2xl font-heading text-slate-950">
              {editingTaskId ? "Editar tarefa" : "Nova tarefa"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Preencha só o essencial para manter a operação objetiva e rastreável.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Evento
            </label>
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
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.fase}
              onChange={(event) => setForm((prev) => ({ ...prev, fase: event.target.value }))}
              placeholder="Fase"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              value={form.ordem}
              onChange={(event) => setForm((prev) => ({ ...prev, ordem: event.target.value }))}
              placeholder="Ordem"
              type="number"
              min="0"
              className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

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
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                status: event.target.value as OperationTaskDto["status"],
              }))
            }
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

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingTaskId ? "Salvar tarefa" : "Criar tarefa"}
            </button>
            {editingTaskId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-slate-700"
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Total" value={String(summary.total)} />
              <SummaryCard label="Pendentes" value={String(summary.pending)} />
              <SummaryCard label="Em andamento" value={String(summary.inProgress)} />
              <SummaryCard label="Concluídas" value={String(summary.done)} />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-heading text-slate-950">Tarefas por fase</h3>
                <p className="mt-2 text-sm text-slate-600">
                  As ações mais importantes ficam agrupadas para leitura rápida da operação.
                </p>
              </div>
            </div>

            {tasksLoading ? (
              <p className="mt-4 text-sm text-slate-600">Carregando tarefas...</p>
            ) : Object.keys(groupedTasks).length === 0 ? (
              <div className="mt-5 rounded-3xl border border-dashed border-border bg-surface-muted/70 p-6 text-sm text-slate-600">
                Nenhuma tarefa encontrada para este evento. Crie a primeira tarefa no painel ao lado.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {Object.entries(groupedTasks).map(([fase, phaseTasks]) => (
                  <div key={fase} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-heading text-slate-950">{fase}</h4>
                      <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                        {phaseTasks.length} tarefa(s)
                      </span>
                    </div>
                    {phaseTasks.map((task) => (
                      <article
                        key={task.id}
                        className="rounded-3xl border border-border bg-surface-muted/60 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h5 className="text-lg font-semibold text-slate-950">{task.titulo}</h5>
                            <p className="mt-1 text-sm text-slate-600">
                              {task.descricao || "Sem descrição"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(
                              task.status,
                            )}`}
                          >
                            {statusLabels[task.status]}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <MiniInfo label="Responsável" value={task.responsavel || "Não definido"} />
                          <MiniInfo label="Prazo" value={formatDate(task.prazo)} />
                          <MiniInfo label="Ordem" value={String(task.ordem)} />
                          <MiniInfo
                            label="Observações"
                            value={task.observacoes || "Sem observações"}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(task)}
                            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            Editar
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
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
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
