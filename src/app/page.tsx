import { Wordmark } from "@/ds/brand";
import { linkClassName } from "@/ds/link-styles";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <Wordmark className="text-2xl" />
      <div className="space-y-3">
        <h1 className="text-xl font-semibold tracking-tight">
          Sua performance, registrada com precisão.
        </h1>
        <p className="text-fg-muted">
          Plataforma de acompanhamento de performance para musculação. Em desenvolvimento: a
          primeira versão pública ainda não está disponível.
        </p>
      </div>
      <p className="text-sm text-fg-muted">
        Projeto de{" "}
        <a href="https://github.com/MarceloSilva2005" className={linkClassName}>
          MarceloSilva2005
        </a>{" "}
        e{" "}
        <a href="https://github.com/Felipe1dev" className={linkClassName}>
          Felipe1dev
        </a>
        .
      </p>
    </main>
  );
}
