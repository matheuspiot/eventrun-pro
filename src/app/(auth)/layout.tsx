export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-zinc-100 to-orange-100 p-4">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}
