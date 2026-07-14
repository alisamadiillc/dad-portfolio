import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";

import { TableCell } from "@/components/ui/table";

/**
 * Drag-to-reorder <tbody> for the admin collection tables. Rows reorder
 * locally while dragging (optimistic); the resulting id order is committed
 * once on drop via `onCommit`. Pair with a leading empty <TableHead> for the
 * handle column.
 */
export function ReorderTableBody<T extends { id: string }>({
  rows,
  onCommit,
  onRowClick,
  renderCells,
}: {
  rows: T[];
  onCommit: (ids: string[]) => void;
  onRowClick?: (row: T) => void;
  renderCells: (row: T) => React.ReactNode;
}) {
  const [order, setOrder] = useState(rows);
  // Blocks server echoes from clobbering the local order mid-drag.
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!draggingRef.current) setOrder(rows);
  }, [rows]);

  return (
    <Reorder.Group
      as="tbody"
      axis="y"
      values={order}
      onReorder={setOrder}
      data-slot="table-body"
      className="[&_tr:last-child]:border-0"
    >
      {order.map((row) => (
        <ReorderRow
          key={row.id}
          row={row}
          onRowClick={onRowClick}
          onDragStart={() => {
            draggingRef.current = true;
          }}
          onDragEnd={() => {
            draggingRef.current = false;
            onCommit(order.map((r) => r.id));
          }}
        >
          {renderCells(row)}
        </ReorderRow>
      ))}
    </Reorder.Group>
  );
}

function ReorderRow<T extends { id: string }>({
  row,
  children,
  onRowClick,
  onDragStart,
  onDragEnd,
}: {
  row: T;
  children: React.ReactNode;
  onRowClick?: (row: T) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  // Handle-only dragging — row content (menus, buttons) stays clickable.
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="tr"
      value={row}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      data-slot="table-row"
      className={`hover:bg-muted/50 bg-background relative border-b transition-colors ${
        onRowClick ? "cursor-pointer" : ""
      }`}
    >
      <TableCell className="w-0">
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          // Don't let a click on the handle (e.g. after a drag) open the row.
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground flex cursor-grab touch-none items-center active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {children}
    </Reorder.Item>
  );
}
