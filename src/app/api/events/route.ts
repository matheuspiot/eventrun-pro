import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import {
  createEventForOrganization,
  listEventsByOrganization,
} from "@/modules/events/events.service";
import { eventFormSchema } from "@/modules/events/validation";

export async function GET(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const events = await listEventsByOrganization(auth.organizationId);

  return NextResponse.json({
    events: events.map((event) => ({
      ...event,
      dataEvento: event.dataEvento.toISOString(),
      criadoEm: event.criadoEm.toISOString(),
      atualizadoEm: event.atualizadoEm.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = getAuthFromRequest(request);

  if (!auth) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = eventFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados invalidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const created = await createEventForOrganization(auth.organizationId, parsed.data);

  return NextResponse.json({
    event: {
      ...created,
      dataEvento: created.dataEvento.toISOString(),
      criadoEm: created.criadoEm.toISOString(),
      atualizadoEm: created.atualizadoEm.toISOString(),
    },
  });
}
