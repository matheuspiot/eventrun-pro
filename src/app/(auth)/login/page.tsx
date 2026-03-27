"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">EventRun Pro</p>
      <h1 className="mt-2 text-4xl font-heading text-zinc-900">Login</h1>
      <p className="mt-2 text-sm text-zinc-600">Acesse sua organização para gerenciar os projetos.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail"
          className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 outline-none ring-accent transition focus:ring-2"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 outline-none ring-accent transition focus:ring-2"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
        >
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

