"use client";

import { useState } from "react";
import { ArrowRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/lib/domain";
import { saveProfile, setStoredActiveProfileId } from "@/lib/db";

export function UserSetup({ onComplete }: { onComplete?: (profile: Profile) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    const parsedAge = age.trim() === "" ? undefined : Number(age);
    const parsedWeight = weight.trim() === "" ? undefined : Number(weight);
    const profile = await saveProfile({
      name: trimmedName,
      email: email.trim() || undefined,
      age: Number.isFinite(parsedAge) ? parsedAge : undefined,
      weightKg: Number.isFinite(parsedWeight) ? parsedWeight : undefined,
      weightUnit: "kg",
      theme: "dark",
    });
    setStoredActiveProfileId(profile.id);
    onComplete?.(profile);
    setSaving(false);
  }

  return (
    <div className="grid min-h-[75dvh] place-items-center px-4 py-10">
      <Card className="w-full max-w-lg border-border/70 bg-card/80 shadow-none">
        <CardHeader className="space-y-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="size-7" />
          </div>
          <div>
            <CardTitle className="text-2xl">Crie seu perfil</CardTitle>
            <CardDescription>Seu treino fica pessoal e organizado por usuário, mesmo no modo local.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: João da Silva" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail opcional</Label>
            <Input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-age">Idade</Label>
              <Input id="profile-age" type="number" min="10" max="120" value={age} onChange={(event) => setAge(event.target.value)} placeholder="28" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-weight">Peso (kg)</Label>
              <Input id="profile-weight" type="number" min="20" max="300" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="68.5" />
            </div>
          </div>
          <Button className="w-full" onClick={() => void handleCreate()} disabled={saving || !name.trim()}>
            {saving ? "Criando perfil…" : "Continuar"}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
