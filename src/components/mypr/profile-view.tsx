"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
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
import { archiveExercise, exportLocalData, getStoredActiveProfileId, listProfiles, resetLocalData, restoreLocalData, saveExercise, saveProfile } from "@/lib/db";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { syncNow } from "@/lib/sync-service";

export function ProfileView({
  exercises,
  pendingSync,
  quickAdd = false,
  onQuickAddConsumed,
}: {
  exercises: Exercise[];
  pendingSync: number;
  quickAdd?: boolean;
  onQuickAddConsumed?: () => void;
}) {
  const [dark, setDark] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("Todos");
  const [exerciseDialog, setExerciseDialog] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [email, setEmail] = useState("");
  const [authDialog, setAuthDialog] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const [importing, setImporting] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAge, setProfileAge] = useState("");
  const [profileWeight, setProfileWeight] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const configured = isSupabaseConfigured();
  const profiles = useLiveQuery(() => listProfiles(), []);
  const localProfile = profiles?.find((profile) => profile.id === getStoredActiveProfileId()) ?? profiles?.[0] ?? null;

  useEffect(() => {
    if (!localProfile) return;
    const isDark = localProfile.theme === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, [localProfile]);

  useEffect(() => {
    if (!profileDialog) return;
    setProfileName(localProfile?.name ?? "");
    setProfileEmail(localProfile?.email ?? "");
    setProfileAge(localProfile?.age != null ? String(localProfile.age) : "");
    setProfileWeight(localProfile?.weightKg != null ? String(localProfile.weightKg) : "");
  }, [localProfile?.age, localProfile?.email, localProfile?.id, localProfile?.name, localProfile?.weightKg, profileDialog]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (quickAdd) {
      setExerciseDialog(true);
      onQuickAddConsumed?.();
    }
  }, [quickAdd, onQuickAddConsumed]);

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

  const stats = useMemo(() => {
    const active = exercises.filter((exercise) => !exercise.archivedAt).length;
    const archived = exercises.filter((exercise) => exercise.archivedAt).length;
    return { active, archived, pendingSync };
  }, [exercises, pendingSync]);

  const groups = useMemo(() => ["Todos", ...new Set(exercises.filter((exercise) => !exercise.archivedAt && exercise.muscleGroup).map((exercise) => exercise.muscleGroup!))], [exercises]);

  const visibleExercises = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    return exercises.filter((exercise) => {
      if (exercise.archivedAt) return false;
      const matchesSearch = !normalized || exercise.name.toLocaleLowerCase("pt-BR").includes(normalized);
      const matchesGroup = selectedGroup === "Todos" || exercise.muscleGroup === selectedGroup;
      return matchesSearch && matchesGroup;
    });
  }, [exercises, search, selectedGroup]);

  const suggestedExercises = useMemo(() => {
    const query = (name || search).trim().toLocaleLowerCase("pt-BR");
    const baseList = query
      ? exercises.filter((exercise) => !exercise.archivedAt && exercise.name.toLocaleLowerCase("pt-BR").includes(query))
      : exercises.filter((exercise) => !exercise.archivedAt);

    const filteredByGroup = selectedGroup === "Todos"
      ? baseList
      : baseList.filter((exercise) => exercise.muscleGroup === selectedGroup);

    if (filteredByGroup.length > 0) {
      return filteredByGroup.slice(0, 8);
    }

    return exercises.filter((exercise) => !exercise.archivedAt).slice(0, 8);
  }, [exercises, name, search, selectedGroup]);

  function toggleTheme(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);

    if (localProfile) {
      void saveProfile({
        id: localProfile.id,
        name: localProfile.name,
        email: localProfile.email,
        age: localProfile.age,
        weightKg: localProfile.weightKg,
        weightUnit: localProfile.weightUnit,
        theme: next ? "dark" : "light",
      }).catch(() => {
        const previousIsDark = localProfile.theme === "dark";
        setDark(previousIsDark);
        document.documentElement.classList.toggle("dark", previousIsDark);
        toast.error("Não foi possível salvar a preferência de tema.");
      });
    }
  }

  async function createExercise() {
    if (!name.trim()) return;
    await saveExercise({ name, muscleGroup: group });
    setName("");
    setGroup("");
    setExerciseDialog(false);
    toast.success("Exercício cadastrado");
  }

  async function saveProfileChanges() {
    if (!localProfile || !profileName.trim()) return;
    const parsedAge = profileAge.trim() === "" ? undefined : Number(profileAge);
    const parsedWeight = profileWeight.trim() === "" ? undefined : Number(profileWeight);
    await saveProfile({
      id: localProfile.id,
      name: profileName,
      email: profileEmail.trim() || undefined,
      age: Number.isFinite(parsedAge) ? parsedAge : undefined,
      weightKg: Number.isFinite(parsedWeight) ? parsedWeight : undefined,
      weightUnit: localProfile.weightUnit,
      theme: localProfile.theme,
    });
    setProfileDialog(false);
    toast.success("Perfil atualizado");
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

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const json = JSON.parse(text) as Record<string, unknown>;
      await restoreLocalData(json);
      toast.success("Backup restaurado", { description: "Seu histórico foi carregado com sucesso." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Arquivo inválido para restauração.");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6 pb-5">
      <header>
        <p className="text-sm text-muted-foreground">Conta, exercícios e preferências</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Perfil</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Exercícios</p>
            <p className="mt-3 text-3xl font-bold">{stats.active}</p>
            <p className="mt-1 text-xs text-muted-foreground">ativos no catálogo</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Arquivados</p>
            <p className="mt-3 text-3xl font-bold">{stats.archived}</p>
            <p className="mt-1 text-xs text-muted-foreground">mantidos no histórico</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pendentes</p>
            <p className="mt-3 text-3xl font-bold">{stats.pendingSync}</p>
            <p className="mt-1 text-xs text-muted-foreground">alterações locais</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-5">
          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardContent className="flex items-center gap-4 p-5">
              <Avatar className="size-14 border border-primary/25 bg-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary"><UserRound className="size-6" /></AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{localProfile?.name ?? user?.user_metadata?.full_name ?? "Treine sem cadastro"}</p>
                <p className="truncate text-sm text-muted-foreground">{localProfile?.email ?? user?.email ?? "Seus dados estão salvos neste dispositivo"}</p>
                {(localProfile?.age != null || localProfile?.weightKg != null) ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {localProfile?.age != null ? `${localProfile.age} anos` : ""}
                    {localProfile?.age != null && localProfile?.weightKg != null ? " • " : ""}
                    {localProfile?.weightKg != null ? `${localProfile.weightKg.toFixed(1).replace(/\.0$/, "")} kg` : ""}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setProfileDialog(true)}>Editar perfil</Button>
                {user ? <Badge className="bg-emerald-400/15 text-emerald-300">Conectado</Badge> : null}
              </div>
            </CardContent>
          </Card>

          <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar perfil</DialogTitle>
                <DialogDescription>Atualize seu nome e e-mail. Os dados ficam salvos no dispositivo.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name-edit">Nome</Label>
                  <Input id="profile-name-edit" value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email-edit">E-mail</Label>
                  <Input id="profile-email-edit" type="email" value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} placeholder="voce@email.com" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-age-edit">Idade</Label>
                    <Input id="profile-age-edit" type="number" min="10" max="120" value={profileAge} onChange={(event) => setProfileAge(event.target.value)} placeholder="28" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-weight-edit">Peso (kg)</Label>
                    <Input id="profile-weight-edit" type="number" min="20" max="300" step="0.1" value={profileWeight} onChange={(event) => setProfileWeight(event.target.value)} placeholder="68.5" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProfileDialog(false)}>Cancelar</Button>
                <Button onClick={() => void saveProfileChanges()} disabled={!profileName.trim() || !localProfile}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={downloadData}><Download /> Exportar backup</Button>
                <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>{importing ? "Importando…" : "Importar backup"}</Button>
              </div>
              <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
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
              <DialogContent className="max-h-[90dvh] overflow-hidden">
                <DialogHeader><DialogTitle>Novo exercício</DialogTitle><DialogDescription>Crie um exercício personalizado ou escolha um da base de musculação.</DialogDescription></DialogHeader>
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="space-y-3">
                    <div className="space-y-2"><Label htmlFor="exercise-name">Nome</Label><Input id="exercise-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Elevação lateral" /></div>
                    <div className="space-y-2"><Label htmlFor="exercise-group">Grupo muscular</Label><Input id="exercise-group" value={group} onChange={(event) => setGroup(event.target.value)} placeholder="Ex.: Ombros" /></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Base rápida</p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setName(""); setGroup(""); }}>Limpar</Button>
                    </div>
                    <div className="space-y-3">
                      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício" className="h-10" />
                      <div className="flex flex-wrap gap-2">
                        {groups.map((groupName) => (
                          <button key={groupName} type="button" onClick={() => setSelectedGroup(groupName)} className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${selectedGroup === groupName ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}>
                            {groupName}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
                      {suggestedExercises.length > 0 ? suggestedExercises.map((exercise) => (
                        <button key={exercise.id} type="button" onClick={() => { setName(exercise.name); setGroup(exercise.muscleGroup ?? ""); setExerciseDialog(false); toast.success(`${exercise.name} pronto para usar`); }} className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-left transition hover:border-primary/35 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{exercise.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{exercise.muscleGroup ?? "Sem grupo"}</span>
                          </span>
                          <span className="ml-3 rounded-full border border-primary/25 bg-primary/8 px-2 py-1 text-[11px] font-medium text-primary">Usar</span>
                        </button>
                      )) : (
                        <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-3 py-4 text-sm text-muted-foreground">
                          Nenhum exercício encontrado. Digite um nome para buscar ou cadastre um novo abaixo.
                        </div>
                      )}
                    </div>
                  </div>
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
