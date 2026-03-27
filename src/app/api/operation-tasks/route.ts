import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import {
  createOperationTaskForEvent,
  listOperationTasksByEvent,
} from "@/modules/operations/service";
import { OperationTaskDto } from "@/modules/operations/types";
import { operationTaskSchema } from "@/modules/operations/validation";

type OperationTaskRecord = Omit<
  OperationTaskDto,
  "prazo" | "criadoEm" | "atualizadoEm"
> & {
  prazo: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

function serializeTask(task: OperationTaskRecord) {
  return {
    ...task,
    prazo: task.prazo?.toISOString() ?? null,
    criadoEm: task.criadoEm.toISOString(),
    atualizadoEm: task.atualizadoEm.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "operacao")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId e obrigatorio" }, { status: 400 });
  }

  const tasks = await listOperationTasksByEvent(auth.organizationId, eventId);
  if (!tasks) {
    return NextResponse.json({ error: "Evento nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "operacao")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = operationTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createOperationTaskForEvent(auth.organizationId, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ task: serializeTask(result.task) });
}
