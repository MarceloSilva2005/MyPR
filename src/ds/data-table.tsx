"use client";

import type { ReactNode } from "react";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "react-aria-components";

import { cx } from "./cx";

export interface DataColumn {
  id: string;
  label: string;
  /** Right-aligns the column and uses tabular figures. */
  numeric?: boolean;
  /** The cell that names the row for assistive technology. One per table. */
  isRowHeader?: boolean;
}

export interface DataRow {
  id: string;
  cells: Record<string, ReactNode>;
}

interface DataTableProps {
  /** Names the table for assistive technology; it is not rendered. */
  label: string;
  columns: readonly DataColumn[];
  rows: readonly DataRow[];
  className?: string;
}

/** Dense tabular data for desktop. On narrow screens prefer a DataList. */
export function DataTable({ label, columns, rows, className }: DataTableProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cx("overflow-x-auto rounded-lg border border-line outline-offset-2", className)}
    >
      <Table aria-label={label} className="w-full border-collapse text-left text-sm">
        <TableHeader className="border-b border-line bg-surface">
          {columns.map((column) => (
            <Column
              key={column.id}
              id={column.id}
              {...(column.isRowHeader ? { isRowHeader: true } : {})}
              className={cx(
                "px-3 py-2 text-xs font-medium whitespace-nowrap text-fg-muted outline-none",
                column.numeric && "text-right",
              )}
            >
              {column.label}
            </Column>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <Row
              key={row.id}
              id={row.id}
              columns={columns}
              className="border-b border-line last:border-b-0 data-[hovered]:bg-surface-hover"
            >
              {(column) => (
                <Cell
                  className={cx(
                    "px-3 py-2 align-middle text-fg outline-none",
                    column.numeric && "text-right tabular-nums",
                  )}
                >
                  {row.cells[column.id]}
                </Cell>
              )}
            </Row>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
