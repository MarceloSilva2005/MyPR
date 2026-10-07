"use client";

import { useState } from "react";

import { Section, Specimen } from "./sections";
import { ActivityStrip, type ActivityDay } from "@/ds/chart/activity-strip";
import { BarChart, type Bar } from "@/ds/chart/bar-chart";
import { ChartFrame } from "@/ds/chart/chart-frame";
import { LegendMarker } from "@/ds/chart/chart-marker";
import type { ChartSeries } from "@/ds/chart/chart-model";
import { LineChart } from "@/ds/chart/line-chart";
import { DataList } from "@/ds/data-list";
import { DataTable } from "@/ds/data-table";
import { EmptyState } from "@/ds/feedback";
import { Metric } from "@/ds/metric";
import { SegmentedControl } from "@/ds/segmented-control";
import { formatLoad, formatNumber } from "@/lib/format";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 6, 20);

const BENCH = [92, 94, 93, 96, 97, 97.5, 99, 98, 101, 102, 103, 104.5];
const SQUAT = [120, 122, 124, 123, 127, 128, 131, 133, 132, 135, 137, 138];

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const formatX = (x: number): string => dateFormat.format(x).replace(".", "");
const formatY = (y: number): string => formatLoad(y, "kg");

const buildSeries = (count: number): ChartSeries[] => [
  {
    id: "bench",
    label: "Supino reto",
    colorIndex: 1,
    points: BENCH.slice(-count).map((y, i) => ({
      x: START + (BENCH.length - count + i) * WEEK,
      y,
    })),
  },
  {
    id: "squat",
    label: "Agachamento livre",
    colorIndex: 2,
    points: SQUAT.slice(-count).map((y, i) => ({
      x: START + (SQUAT.length - count + i) * WEEK,
      y,
    })),
  },
];

const VOLUME: Bar[] = [8200, 9100, 8700, 10200, 9800, 11000, 10400, 11800].map((value, i) => ({
  id: String(i),
  label: formatX(START + (4 + i) * WEEK),
  value,
}));

const DAYS: ActivityDay[] = [
  { id: "mon", label: "Seg", description: "segunda-feira", sessions: 1 },
  { id: "tue", label: "Ter", description: "terça-feira", sessions: 0 },
  { id: "wed", label: "Qua", description: "quarta-feira", sessions: 1 },
  { id: "thu", label: "Qui", description: "quinta-feira", sessions: 0 },
  { id: "fri", label: "Sex", description: "sexta-feira", sessions: 1 },
  { id: "sat", label: "Sáb", description: "sábado", sessions: 0 },
  { id: "sun", label: "Dom", description: "domingo", sessions: 0 },
];

const RECORDS = [
  { id: "1", exercise: "Supino reto", mark: "104,5 kg", date: "12 out", change: "+1,5 kg" },
  { id: "2", exercise: "Agachamento livre", mark: "138 kg", date: "5 out", change: "+1 kg" },
  { id: "3", exercise: "Remada curvada", mark: "90 kg", date: "28 set", change: "+2,5 kg" },
];

export function DataSections() {
  const [period, setPeriod] = useState<"4w" | "12w">("12w");
  const series = buildSeries(period === "4w" ? 5 : 12);

  return (
    <>
      <Section
        id="metrics"
        title="Métricas e listas"
        description="Valor, unidade, variação e referência de tempo sempre juntos."
      >
        <Specimen label="Métricas" className="grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
          <Metric
            label="Volume"
            period="esta semana"
            value={11800}
            fractionDigits={0}
            unit="kg"
            delta={{ value: 1400, unit: "kg", trend: "positive", context: "vs. semana anterior" }}
          />
          <Metric
            label="Séries de trabalho"
            period="esta semana"
            value={42}
            fractionDigits={0}
            delta={{ value: -3, trend: "negative", context: "vs. semana anterior" }}
          />
          <Metric
            label="Sessões"
            period="esta semana"
            value={3}
            fractionDigits={0}
            delta={{ value: 0, trend: "neutral", context: "vs. semana anterior" }}
          />
          <Metric label="1RM estimado" value={104.5} unit="kg" />
        </Specimen>
        <Specimen label="Tabela" className="block">
          <DataTable
            label="Recordes recentes"
            columns={[
              { id: "exercise", label: "Exercício", isRowHeader: true },
              { id: "mark", label: "Marca", numeric: true },
              { id: "date", label: "Data" },
              { id: "change", label: "Variação", numeric: true },
            ]}
            rows={RECORDS.map((record) => ({
              id: record.id,
              cells: {
                exercise: record.exercise,
                mark: record.mark,
                date: record.date,
                change: record.change,
              },
            }))}
          />
        </Specimen>
        <Specimen label="Lista compacta" className="block max-w-md">
          <DataList
            label="Recordes recentes"
            items={RECORDS.map((record) => ({
              id: record.id,
              title: record.exercise,
              meta: `${record.date} · ${record.change}`,
              value: record.mark,
            }))}
          />
        </Specimen>
        <Specimen label="Atividade da semana" className="block max-w-md">
          <ActivityStrip label="Treinos desta semana" days={DAYS} />
        </Specimen>
      </Section>

      <Section
        id="charts"
        title="Gráficos"
        description="Valores exatos no tooltip, tabela alternativa e navegação pelo teclado."
      >
        <ChartFrame
          title="1RM estimado"
          description="Melhor série de cada semana."
          height={260}
          controls={
            <SegmentedControl
              label="Período"
              value={period}
              onChange={setPeriod}
              options={[
                { id: "4w", label: "4 semanas" },
                { id: "12w", label: "12 semanas" },
              ]}
            />
          }
          legend={series.map((item) => (
            <span key={item.id} className="inline-flex items-center gap-1.5">
              <LegendMarker colorIndex={item.colorIndex} />
              {item.label}
            </span>
          ))}
          table={{
            columns: [
              { id: "date", label: "Semana", isRowHeader: true },
              ...series.map((item) => ({ id: item.id, label: item.label, numeric: true })),
            ],
            rows: (series[0]?.points ?? []).map((point, index) => ({
              id: String(point.x),
              cells: {
                date: formatX(point.x),
                ...Object.fromEntries(
                  series.map((item) => [item.id, formatY(item.points[index]?.y ?? 0)]),
                ),
              },
            })),
          }}
        >
          <LineChart
            series={series}
            label="Evolução do 1RM estimado por exercício"
            summary="O 1RM estimado do supino reto subiu de 92 para 104,5 kg e o do agachamento livre de 120 para 138 kg nas últimas 12 semanas."
            height={260}
            formatX={formatX}
            formatY={formatY}
          />
        </ChartFrame>

        <ChartFrame
          title="Volume semanal"
          description="Soma de carga × repetições das séries de trabalho."
          height={220}
        >
          <BarChart
            bars={VOLUME}
            label="Volume semanal em quilogramas"
            summary="O volume semanal subiu de 8.200 para 11.800 kg em oito semanas."
            height={220}
            formatValue={(value) => `${formatNumber(value, 0)} kg`}
          />
        </ChartFrame>

        <Specimen label="Estados" className="grid gap-6 md:grid-cols-3">
          <ChartFrame title="Carregando" height={120} state="loading">
            <span />
          </ChartFrame>
          <ChartFrame
            title="Sem dados suficientes"
            height={120}
            state="empty"
            emptyState={
              <EmptyState
                headingLevel="h3"
                className="py-4"
                title="Ainda não há séries neste período."
                description="Registre um treino para ver a evolução."
              />
            }
          >
            <span />
          </ChartFrame>
          <ChartFrame title="Com erro" height={120} state="error" onRetry={() => undefined}>
            <span />
          </ChartFrame>
        </Specimen>
      </Section>
    </>
  );
}
