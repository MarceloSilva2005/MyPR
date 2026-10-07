"use client";

import { Check } from "lucide-react";
import { Menu, MenuItem, MenuTrigger, Popover, ToggleButton } from "react-aria-components";
import { Button } from "./button";
import { cx } from "./cx";
import { fieldStyles } from "./field-styles";
import { dsLabels } from "./labels";
import { NumberField } from "./number-field";
import { PRBadge } from "./pr-badge";
import { formatLoad } from "@/lib/format";

export type SetType = "work" | "warmup" | "drop";

export interface WorkoutSetValue {
  type: SetType;
  load: number | null;
  reps: number | null;
  completed: boolean;
}

interface WorkoutSetRowProps {
  /** Position of the set within the exercise, starting at 1. */
  number: number;
  value: WorkoutSetValue;
  unit: "kg" | "lb";
  /** Load step for the keyboard and the stepper keys. */
  step?: number;
  /** What was done in the previous session for this set, shown without leaving the screen. */
  previous?: { load: number; reps: number };
  /** Objective record annotation, for example "Novo recorde: 120 kg". */
  record?: string;
  onChange: (next: WorkoutSetValue) => void;
}

const typeOrder: SetType[] = ["work", "warmup", "drop"];

function typeBadge(type: SetType, number: number): string {
  if (type === "warmup") return "Aq";
  if (type === "drop") return `${String(number)}D`;
  return String(number);
}

/** The most-used control of the product: one set, editable in place. */
export function WorkoutSetRow({
  number,
  value,
  unit,
  step = 2.5,
  previous,
  record,
  onChange,
}: WorkoutSetRowProps) {
  const typeLabel = dsLabels.set.types[value.type];
  const setName = `Série ${String(number)}`;

  return (
    <div
      className={cx(
        "border-b border-line py-3 transition-colors",
        value.completed && "bg-accent-subtle",
      )}
    >
      <div className="grid grid-cols-[3rem_1fr_1fr_3rem] items-center gap-2 px-1 md:grid-cols-[3.5rem_1fr_1fr_3rem] md:gap-3">
        <MenuTrigger>
          <Button
            variant="ghost"
            size="md"
            aria-label={`${setName}, ${typeLabel}. ${dsLabels.set.changeType}`}
            className="font-mono tabular-nums"
          >
            {typeBadge(value.type, number)}
          </Button>
          <Popover className={fieldStyles.popover}>
            <Menu
              aria-label={dsLabels.set.changeType}
              selectionMode="single"
              selectedKeys={[value.type]}
              disallowEmptySelection
              onSelectionChange={(keys) => {
                const [first] = keys;
                const next = typeOrder.find((type) => type === first);
                if (next) onChange({ ...value, type: next });
              }}
              className="outline-none"
            >
              {typeOrder.map((type) => (
                <MenuItem key={type} id={type} className={fieldStyles.option}>
                  {({ isSelected }) => (
                    <>
                      {dsLabels.set.types[type]}
                      {isSelected ? (
                        <Check aria-hidden className="size-4 text-accent-text" />
                      ) : null}
                    </>
                  )}
                </MenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>

        <NumberField
          label={`${dsLabels.set.load}, ${setName.toLowerCase()}`}
          hideLabel
          size="workout"
          showSteppers={false}
          step={step}
          minValue={0}
          formatOptions={{ maximumFractionDigits: 2 }}
          value={value.load ?? Number.NaN}
          onChange={(load) => {
            onChange({ ...value, load: Number.isNaN(load) ? null : load });
          }}
          unit={unit}
        />
        <NumberField
          label={`${dsLabels.set.reps}, ${setName.toLowerCase()}`}
          hideLabel
          size="workout"
          showSteppers={false}
          step={1}
          minValue={0}
          formatOptions={{ maximumFractionDigits: 0 }}
          value={value.reps ?? Number.NaN}
          onChange={(reps) => {
            onChange({ ...value, reps: Number.isNaN(reps) ? null : reps });
          }}
          unit="rep"
        />

        <ToggleButton
          aria-label={`${setName} ${dsLabels.set.completed}`}
          isSelected={value.completed}
          onChange={(completed) => {
            onChange({ ...value, completed });
          }}
          className={cx(
            "flex size-12 items-center justify-center rounded-md border border-line-control text-fg-subtle transition-colors",
            "data-[hovered]:bg-surface-hover data-[selected]:border-accent data-[selected]:bg-accent data-[selected]:text-accent-fg",
          )}
        >
          <Check aria-hidden className="size-5" />
        </ToggleButton>
      </div>

      {previous || record ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 pl-[3.5rem] text-xs text-fg-muted tabular-nums md:pl-[4.25rem]">
          {previous ? (
            <span>
              {dsLabels.set.previous}: {formatLoad(previous.load, unit)} × {previous.reps}
            </span>
          ) : null}
          {record ? <PRBadge>{record}</PRBadge> : null}
        </div>
      ) : null}
    </div>
  );
}
