"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UiIcon } from "@/components/ui-icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Credenciais inválidas");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
        <UiIcon name="spark" className="h-4 w-4" />
        EventRun Pro
      </div>
      <h1 className="mt-4 text-4xl text-zinc-950">Entrar na sua organização</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-600">
        Acesse seu ambiente para acompanhar eventos, operação, orçamento e proposta comercial.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <AuthMiniCard title="Checklist" description="Tarefas e prazos" />
        <AuthMiniCard title="Financeiro" description="Custos e margem" />
        <AuthMiniCard title="Comercial" description="Pacotes e PDF" />
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none ring-accent transition focus:ring-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            className="w-full rounded-2xl border border-border bg-surface-muted px-4 py-3 outline-none ring-accent transition focus:ring-2"
          />
        </label>

        {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
        >
          <UiIcon name="spark" className="h-4 w-4" />
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-zinc-900">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

function AuthMiniCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/80 p-4">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}
