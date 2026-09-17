"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Archive,
  Cloud,
  Database,
  Download,
  LogIn,
  Mail,
  Moon,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Exercise } from "@/lib/domain";
import { archiveExercise, exportLocalData, resetLocalData, saveExercise } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { syncNow } from "@/lib/sync-service";

export function ProfileView({ exercises, pendingSync }: { exercises: Exercise[]; pendingSync: number }) {
  const [dark, setDark] = useState(true);
  const [search, setSearch] = useState("");
  const [exerciseDialog, setExerciseDialog] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [email, setEmail] = useState("");
  const [authDialog, setAuthDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const visibleExercises = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    return exercises.filter((exercise) => !exercise.archivedAt && (!normalized || exercise.name.toLocaleLowerCase("pt-BR").includes(normalized)));
  }, [exercises, search]);

  function toggleTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }

  async function createExercise() {
    if (!name.trim()) return;
    await saveExercise({ name, muscleGroup: group });
    setName("");
    setGroup("");
    setExerciseDialog(false);
    toast.success("Exercício cadastrado");
  }

  async function signInGoogle() {
    const supabase = getSupabaseClient();
    if (!supabase) return toast.error("Configure o Supabase para entrar com Google.");
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  }

  async function signInEmail() {
    const supabase = getSupabaseClient();
    if (!supabase || !email.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) return toast.error(error.message);
    toast.success("Link enviado", { description: "Confira sua caixa de entrada." });
    setAuthDialog(false);
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const count = await syncNow();
      toast.success("Dados sincronizados", { description: `${count} alterações enviadas com segurança.` });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar.");
    } finally {
      setSyncing(false);
    }
  }

  async function downloadData() {
    const data = await exportLocalData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mypr-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado");
  }

  return (
    <div className="space-y-6 pb-5">
      <header>
        <p className="text-sm text-muted-foreground">Conta, exercícios e preferências</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Perfil</h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5">
          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <Avatar className="size-14 border border-primary/25 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary"><UserRound className="size-6" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{user?.user_metadata?.full_name ?? "Treine sem cadastro"}</p>
                <p className="truncate text-sm text-muted-foreground">{user?.email ?? "Seus dados estão salvos neste dispositivo"}</p>
              </div>
              {user ? <Badge className="bg-emerald-400/15 text-emerald-300">Conectado</Badge> : null}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardHeader><CardTitle className="text-base">Backup e sincronização</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-secondary/45 p-3">
                <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Cloud className="size-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{user ? "Conta conectada" : "Modo local"}</p>
                  <p className="text-xs text-muted-foreground">{pendingSync} alterações aguardando backup</p>
                </div>
                <span className={`size-2 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400"}`} />
              </div>
              {user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleSync} disabled={syncing}><RefreshCw className={syncing ? "animate-spin" : ""} /> Sincronizar</Button>
                  <Button variant="outline" onClick={() => void getSupabaseClient()?.auth.signOut()}>Sair</Button>
                </div>
              ) : (
                <Dialog open={authDialog} onOpenChange={setAuthDialog}>
                  <DialogTrigger asChild><Button className="w-full"><LogIn /> Entrar para fazer backup</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Conecte sua conta</DialogTitle>
                      <DialogDescription>O uso local continua disponível. A conta adiciona backup e sincronização entre dispositivos.</DialogDescription>
                    </DialogHeader>
                    {configured ? (
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full" onClick={signInGoogle}><ShieldCheck /> Continuar com Google</Button>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou por e-mail<span className="h-px flex-1 bg-border" /></div>
                        <Label htmlFor="auth-email">E-mail</Label>
                        <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
                        <Button className="w-full" onClick={signInEmail} disabled={!email.trim()}><Mail /> Enviar link de acesso</Button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-muted-foreground">
                        O modo local está ativo. Adicione as variáveis públicas do Supabase para liberar Google, e-mail e sincronização.
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" className="w-full" onClick={downloadData}><Download /> Exportar backup JSON</Button>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardHeader><CardTitle className="text-base">Preferências</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Moon className="size-4 text-primary" /><div><p className="text-sm font-medium">Tema escuro</p><p className="text-xs text-muted-foreground">Melhor contraste durante o treino</p></div></div>
                <Switch checked={dark} onCheckedChange={toggleTheme} aria-label="Alternar tema escuro" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3"><Database className="size-4 text-primary" /><div><p className="text-sm font-medium">Unidade de peso</p><p className="text-xs text-muted-foreground">Armazenamento canônico</p></div></div>
                <Badge variant="secondary">kg</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-border/70 bg-card/70 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div><CardTitle className="text-base">Catálogo de exercícios</CardTitle><p className="mt-1 text-xs text-muted-foreground">Arquivar preserva todo o histórico</p></div>
            <Dialog open={exerciseDialog} onOpenChange={setExerciseDialog}>
              <DialogTrigger asChild><Button size="sm"><Plus /> Novo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo exercício</DialogTitle><DialogDescription>Crie um exercício personalizado para usar nos próximos treinos.</DialogDescription></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2"><Label htmlFor="exercise-name">Nome</Label><Input id="exercise-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Elevação lateral" /></div>
                  <div className="space-y-2"><Label htmlFor="exercise-group">Grupo muscular</Label><Input id="exercise-group" value={group} onChange={(event) => setGroup(event.target.value)} placeholder="Ex.: Ombros" /></div>
                </div>
                <DialogFooter><Button onClick={createExercise} disabled={!name.trim()}>Cadastrar exercício</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício" className="pl-9" /></div>
            <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
              {visibleExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary/45">
                  <span className="grid size-9 place-items-center rounded-xl bg-secondary text-muted-foreground"><Database className="size-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{exercise.name}</p><p className="text-xs text-muted-foreground">{exercise.muscleGroup ?? "Sem grupo"} · {exercise.source === "default" ? "Padrão" : "Personalizado"}</p></div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Arquivar ${exercise.name}`} onClick={() => void archiveExercise(exercise.id)}><Archive /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild><Button variant="ghost" className="text-destructive hover:text-destructive">Apagar e restaurar dados de demonstração</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Restaurar dados locais?</AlertDialogTitle><AlertDialogDescription>Todos os treinos e exercícios deste dispositivo serão removidos e os dados de demonstração serão recriados. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void resetLocalData().then(() => toast.success("Dados restaurados"))}>Restaurar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
