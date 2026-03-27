import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export const TOKEN_COOKIE = "eventrun_token";

export type UserRole = "ADMIN" | "FINANCEIRO" | "OPERACIONAL" | "MARKETING";
export type AppModule =
  | "dashboard"
  | "orcamento"
  | "operacao"
  | "regulamento"
  | "marketing"
  | "configuracoes";

export type AuthTokenPayload = {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
};

const modulePermissions: Record<AppModule, UserRole[]> = {
  dashboard: ["ADMIN", "FINANCEIRO", "OPERACIONAL", "MARKETING"],
  orcamento: ["ADMIN", "FINANCEIRO"],
  operacao: ["ADMIN", "OPERACIONAL"],
  regulamento: ["ADMIN", "OPERACIONAL"],
  marketing: ["ADMIN", "MARKETING"],
  configuracoes: ["ADMIN"],
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function createAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyAuthToken(token?: string | null): AuthTokenPayload | null {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function getAuthFromRequest(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  return verifyAuthToken(token);
}

export function canAccessModule(role: UserRole, module: AppModule) {
  return modulePermissions[module].includes(role);
}

export function getModuleLabel(module: AppModule) {
  const labels: Record<AppModule, string> = {
    dashboard: "Dashboard",
    orcamento: "Orcamento",
    operacao: "Operacao",
    regulamento: "Regulamento",
    marketing: "Marketing",
    configuracoes: "Configuracoes",
  };

  return labels[module];
}
