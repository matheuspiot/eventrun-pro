import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  deleteEventForOrganization,
  updateEventForOrganization,
} from "@/modules/events/events.service";
import { eventFormSchema } from "@/modules/events/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = eventFormSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await updateEventForOrganization(auth.organizationId, id, parsed.data);

  if (updated.count === 0) {
    return NextResponse.json({ error: "Projeto nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await deleteEventForOrganization(auth.organizationId, id);

  if (removed.count === 0) {
    return NextResponse.json({ error: "Projeto nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
