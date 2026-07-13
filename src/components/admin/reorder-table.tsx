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
  renderCells,
}: {
  rows: T[];
  onCommit: (ids: string[]) => void;
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
  onDragStart,
  onDragEnd,
}: {
  row: T;
  children: React.ReactNode;
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
      data-slot="table-row"
      className="hover:bg-muted/50 bg-background relative border-b transition-colors"
    >
      <TableCell className="w-0">
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="text-muted-foreground hover:text-foreground flex cursor-grab touch-none items-center active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      {children}
    </Reorder.Item>
  );
}
