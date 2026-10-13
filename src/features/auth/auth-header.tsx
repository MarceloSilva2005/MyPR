/** Title block of an authentication page. The only h1 of the screen. */
export function AuthHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
      {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
    </header>
  );
}
