import { NextRequest, NextResponse } from "next/server";
import { canAccessModule, getAuthFromRequest } from "@/lib/auth";
import {
  deleteOperationTaskForOrganization,
  updateOperationTaskForOrganization,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "operacao")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = operationTaskSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateOperationTaskForOrganization(auth.organizationId, id, parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ task: serializeTask(result.task) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (!canAccessModule(auth.role, "operacao")) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const removed = await deleteOperationTaskForOrganization(auth.organizationId, id);
  if (removed.count === 0) {
    return NextResponse.json({ error: "Tarefa nao encontrada" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
