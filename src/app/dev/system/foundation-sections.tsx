"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Section, Specimen } from "./sections";
import { Badge } from "@/ds/badge";
import { Button, ButtonLink } from "@/ds/button";
import { ComboBox } from "@/ds/combo-box";
import { EmptyState, ErrorState, InlineAlert, Skeleton, Spinner } from "@/ds/feedback";
import { Link } from "@/ds/link";
import { ConfirmDialog, Modal } from "@/ds/modal";
import { NumberField } from "@/ds/number-field";
import { SegmentedControl } from "@/ds/segmented-control";
import { Select } from "@/ds/select";
import { Tabs } from "@/ds/tabs";
import { TextField } from "@/ds/text-field";
import { useToast } from "@/ds/toast";
import { Tooltip } from "@/ds/tooltip";

const COLORS = [
  { name: "bg", className: "bg-bg" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-hover", className: "bg-surface-hover" },
  { name: "overlay", className: "bg-overlay" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-subtle", className: "bg-accent-subtle" },
  { name: "success", className: "bg-success" },
  { name: "danger", className: "bg-danger" },
  { name: "warning", className: "bg-warning" },
  { name: "series-1", className: "bg-series-1" },
  { name: "series-2", className: "bg-series-2" },
  { name: "series-3", className: "bg-series-3" },
  { name: "series-4", className: "bg-series-4" },
  { name: "series-5", className: "bg-series-5" },
];

const TYPE_SCALE = [
  { token: "3xl", className: "text-3xl font-semibold tracking-tight" },
  { token: "2xl", className: "text-2xl font-semibold tracking-tight" },
  { token: "xl", className: "text-xl font-semibold tracking-tight" },
  { token: "lg", className: "text-lg font-medium" },
  { token: "base", className: "text-base" },
  { token: "sm", className: "text-sm" },
  { token: "xs", className: "text-xs" },
];

const GROUPS = [
  { id: "chest", label: "Peito" },
  { id: "back", label: "Costas" },
  { id: "legs", label: "Pernas" },
  { id: "shoulders", label: "Ombros" },
];

const EXERCISES = [
  { id: "bench", label: "Supino reto", detail: "Peito · Barra", keywords: ["bench press"] },
  { id: "squat", label: "Agachamento livre", detail: "Pernas · Barra", keywords: ["squat"] },
  { id: "row", label: "Remada curvada", detail: "Costas · Barra", keywords: ["bent over row"] },
  { id: "press", label: "Desenvolvimento", detail: "Ombros · Halteres", keywords: ["overhead"] },
  { id: "raise", label: "Elevação lateral", detail: "Ombros · Halteres", keywords: [] },
];

export function FoundationSections() {
  return (
    <>
      <Section
        id="tokens"
        title="Cores e tipografia"
        description="Cada cor existe uma vez e muda com o tema. Verde, vermelho e âmbar são reservados a sucesso, erro e atenção."
      >
        <Specimen label="Cores" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map((color) => (
            <div key={color.name} className="space-y-1.5">
              <div className={`h-12 rounded-md border border-line ${color.className}`} />
              <p className="font-mono text-xs text-fg-muted">{color.name}</p>
            </div>
          ))}
        </Specimen>
        <Specimen label="Escala tipográfica" className="space-y-2">
          {TYPE_SCALE.map((sample) => (
            <p key={sample.token} className="flex items-baseline gap-4">
              <span className="w-10 font-mono text-xs text-fg-muted">{sample.token}</span>
              <span className={sample.className}>Registre cada série com precisão</span>
            </p>
          ))}
        </Specimen>
        <Specimen label="Números tabulares">
          <p className="font-mono text-sm tabular-nums">
            82,5 kg · 100 kg · 1.234,5 kg · 0:45 · 12:09
          </p>
        </Specimen>
      </Section>

      <Section
        id="buttons"
        title="Botões"
        description="Ação principal única por tela; as demais são secundárias."
      >
        <Specimen label="Variantes">
          <Button variant="primary">Salvar treino</Button>
          <Button variant="secondary">Cancelar</Button>
          <Button variant="tonal">Iniciar treino</Button>
          <Button variant="ghost">Ver detalhes</Button>
          <Button variant="destructive">Excluir sessão</Button>
          <Button variant="destructive-solid">Excluir definitivamente</Button>
        </Specimen>
        <Specimen label="Estados">
          <Button variant="primary" isPending>
            Salvando
          </Button>
          <Button variant="primary" isDisabled>
            Indisponível
          </Button>
          <Button variant="secondary" isDisabled>
            Indisponível
          </Button>
        </Specimen>
        <Specimen label="Tamanhos e ícones">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Padrão</Button>
          <Button size="lg" variant="primary">
            Grande
          </Button>
          <Button variant="secondary">
            <Plus aria-hidden className="size-4" />
            Adicionar série
          </Button>
          <Tooltip content="Remover exercício">
            <Button variant="ghost" iconOnly aria-label="Remover exercício">
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </Tooltip>
        </Specimen>
        <Specimen label="Navegação">
          <ButtonLink href="/app" variant="secondary">
            Abrir a visão geral
          </ButtonLink>
          <Link href="/app/history">Link no texto</Link>
        </Specimen>
      </Section>

      <FormSection />
      <FeedbackSection />
      <OverlaySection />
    </>
  );
}

function FormSection() {
  const [group, setGroup] = useState<string | null>("chest");
  const [exercise, setExercise] = useState<string | null>(null);
  const [period, setPeriod] = useState<"4w" | "12w" | "6m">("12w");

  return (
    <Section
      id="forms"
      title="Campos"
      description="Rótulo sempre visível, ajuda e erro ligados ao campo."
    >
      <Specimen label="Texto" className="grid max-w-3xl gap-6 md:grid-cols-2">
        <TextField label="Nome da rotina" placeholder="Ex.: Push A" />
        <TextField
          label="Nome da rotina"
          description="Aparece na lista de rotinas."
          defaultValue="Push A"
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          error="Informe um e-mail válido."
          defaultValue="nome@"
        />
        <TextField label="Observações" showOptional multiline />
        <TextField label="Usuário" prefix="@" placeholder="nome" />
      </Specimen>
      <Specimen label="Número" className="grid max-w-3xl gap-6 md:grid-cols-2">
        <NumberField label="Descanso padrão" unit="s" defaultValue={90} step={15} minValue={0} />
        <NumberField
          label="Carga"
          unit="kg"
          defaultValue={82.5}
          step={2.5}
          minValue={0}
          size="workout"
        />
      </Specimen>
      <Specimen label="Seleção" className="grid max-w-3xl gap-6 md:grid-cols-2">
        <Select label="Grupo muscular" options={GROUPS} value={group} onChange={setGroup} />
        <ComboBox
          label="Exercício"
          options={EXERCISES}
          selectedId={exercise}
          onSelect={setExercise}
          placeholder="Digite para buscar"
          description="A busca ignora acentos e aceita nomes alternativos."
        />
      </Specimen>
      <Specimen label="Escolha curta e abas" className="space-y-6">
        <SegmentedControl
          label="Período"
          value={period}
          onChange={setPeriod}
          options={[
            { id: "4w", label: "4 semanas" },
            { id: "12w", label: "12 semanas" },
            { id: "6m", label: "6 meses" },
          ]}
        />
        <Tabs
          label="Exemplo de abas"
          className="max-w-xl"
          items={[
            {
              id: "a",
              label: "Resumo",
              content: <p className="text-sm">Conteúdo da aba Resumo.</p>,
            },
            {
              id: "b",
              label: "Séries",
              content: <p className="text-sm">Conteúdo da aba Séries.</p>,
            },
            { id: "c", label: "Notas", content: <p className="text-sm">Conteúdo da aba Notas.</p> },
          ]}
        />
      </Specimen>
    </Section>
  );
}

function FeedbackSection() {
  const toast = useToast();

  return (
    <Section
      id="feedback"
      title="Estados e feedback"
      description="Vazio, erro e carregamento são telas projetadas, não improvisadas."
    >
      <Specimen label="Selos">
        <Badge>Neutro</Badge>
        <Badge tone="accent">Em andamento</Badge>
        <Badge tone="success">Sincronizado</Badge>
        <Badge tone="warning">Atenção</Badge>
        <Badge tone="danger">Falhou</Badge>
      </Specimen>
      <Specimen label="Avisos persistentes" className="grid max-w-3xl gap-3">
        <InlineAlert tone="info" title="Nova versão disponível">
          Ela será aplicada quando você terminar o treino.
        </InlineAlert>
        <InlineAlert tone="success">Treino salvo.</InlineAlert>
        <InlineAlert tone="warning" title="Sem conexão">
          Seus registros continuam salvos neste dispositivo.
        </InlineAlert>
        <InlineAlert
          tone="danger"
          title="Não foi possível sincronizar"
          action={<Button size="sm">Tentar novamente</Button>}
        >
          Seus dados continuam salvos neste dispositivo.
        </InlineAlert>
      </Specimen>
      <Specimen label="Vazio e erro" className="grid gap-8 md:grid-cols-2">
        <EmptyState
          title="Você ainda não registrou treinos."
          description="Crie uma rotina ou inicie um treino livre."
          actions={
            <>
              <Button variant="primary">Montar rotina</Button>
              <Button>Iniciar treino livre</Button>
            </>
          }
        />
        <ErrorState
          title="Não foi possível carregar o histórico."
          description="Seus dados registrados continuam salvos. Tente novamente."
          actions={<Button variant="primary">Tentar novamente</Button>}
        />
      </Specimen>
      <Specimen label="Carregamento" className="grid max-w-xl gap-3">
        <Skeleton className="w-full" height={20} />
        <Skeleton className="w-3/4" height={20} />
        <Skeleton className="w-full" height={64} />
        <Spinner />
      </Specimen>
      <Specimen label="Confirmação rápida">
        <Button
          onPress={() => {
            toast.show({ message: "Treino salvo.", tone: "success" });
          }}
        >
          Mostrar notificação
        </Button>
      </Specimen>
    </Section>
  );
}

function OverlaySection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Section
      id="overlays"
      title="Diálogos e painéis"
      description="No celular viram folhas ancoradas na base da tela."
    >
      <Specimen label="Abrir">
        <Button
          onPress={() => {
            setDialogOpen(true);
          }}
        >
          Diálogo
        </Button>
        <Button
          onPress={() => {
            setDrawerOpen(true);
          }}
        >
          Painel lateral
        </Button>
        <Button
          variant="destructive"
          onPress={() => {
            setConfirmOpen(true);
          }}
        >
          Confirmação destrutiva
        </Button>
      </Specimen>

      <Modal
        title="Adicionar exercício"
        description="Escolha um exercício da biblioteca."
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <p className="text-sm text-fg-muted">Conteúdo do diálogo.</p>
      </Modal>
      <Modal
        title="Detalhes do exercício"
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        variant="drawer"
      >
        <p className="text-sm text-fg-muted">Conteúdo do painel lateral.</p>
      </Modal>
      <ConfirmDialog
        title="Excluir sessão?"
        description="A sessão sai do histórico e pode ser recuperada por 30 dias."
        confirmLabel="Excluir sessão"
        cancelLabel="Cancelar"
        destructive
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
        }}
      />
    </Section>
  );
}
