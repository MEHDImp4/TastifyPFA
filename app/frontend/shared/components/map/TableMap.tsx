import React, { useMemo, useRef, useState } from 'react';
import { Table } from '../../types/tables';
import { getTableDimensions, TableItem } from './TableItem';

interface TableMapProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
  isEditMode?: boolean;
  onTablePositionChange?: (tableId: number, position: TablePosition) => void;
  allowAllSelectable?: boolean;
}

export interface TablePosition {
  pos_x: number;
  pos_y: number;
}

interface PositionedTable {
  table: Table;
  x: number;
  y: number;
}

interface DragState {
  tableId: number;
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 800;
export const GRID_SIZE = 20;
export const TABLE_SIZE = 80;
export const GAP = 120;
export const COL_COUNT = 4;

export const snapToGrid = (value: number, gridSize = GRID_SIZE) => Math.round(value / gridSize) * gridSize;

export const clampPosition = (table: Table, position: TablePosition): TablePosition => {
  const dimensions = getTableDimensions(table);

  return {
    pos_x: Math.min(Math.max(position.pos_x, 0), VIEW_WIDTH - dimensions.width),
    pos_y: Math.min(Math.max(position.pos_y, 0), VIEW_HEIGHT - dimensions.height),
  };
};

export const getVisualPosition = (table: Table, index: number): TablePosition => {
  if (table.pos_x !== 0 || table.pos_y !== 0) {
    return { pos_x: table.pos_x, pos_y: table.pos_y };
  }

  const row = Math.floor(index / COL_COUNT);
  const col = index % COL_COUNT;

  return {
    pos_x: 100 + col * (TABLE_SIZE + GAP),
    pos_y: 100 + row * (TABLE_SIZE + GAP),
  };
};

export const doBoxesOverlap = (a: PositionedTable, b: PositionedTable) => {
  const aDimensions = getTableDimensions(a.table);
  const bDimensions = getTableDimensions(b.table);

  return (
    a.x < b.x + bDimensions.width &&
    a.x + aDimensions.width > b.x &&
    a.y < b.y + bDimensions.height &&
    a.y + aDimensions.height > b.y
  );
};

export const getOverlappingTableIds = (positionedTables: PositionedTable[]) => {
  const overlappingIds = new Set<number>();

  for (let i = 0; i < positionedTables.length; i += 1) {
    for (let j = i + 1; j < positionedTables.length; j += 1) {
      if (doBoxesOverlap(positionedTables[i], positionedTables[j])) {
        overlappingIds.add(positionedTables[i].table.id);
        overlappingIds.add(positionedTables[j].table.id);
      }
    }
  }

  return overlappingIds;
};

export const TableMap: React.FC<TableMapProps> = ({
  tables,
  onTableClick,
  isEditMode = false,
  onTablePositionChange,
  allowAllSelectable = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewPositions, setPreviewPositions] = useState<Record<number, TablePosition>>({});

  const positionedTables = useMemo<PositionedTable[]>(
    () => tables.map((table, index) => {
      const previewPosition = previewPositions[table.id];
      const position = previewPosition ?? getVisualPosition(table, index);

      return {
        table,
        x: position.pos_x,
        y: position.pos_y,
      };
    }),
    [previewPositions, tables],
  );

  const overlappingTableIds = useMemo(() => getOverlappingTableIds(positionedTables), [positionedTables]);

  const toSvgPoint = (event: React.PointerEvent<SVGSVGElement | SVGGElement>): TablePosition => {
    const rect = svgRef.current?.getBoundingClientRect();
    const width = rect?.width || VIEW_WIDTH;
    const height = rect?.height || VIEW_HEIGHT;

    return {
      pos_x: ((event.clientX - (rect?.left ?? 0)) / width) * VIEW_WIDTH,
      pos_y: ((event.clientY - (rect?.top ?? 0)) / height) * VIEW_HEIGHT,
    };
  };

  const handleDragStart = (tableId: number, event: React.PointerEvent<SVGGElement>) => {
    if (!isEditMode) return;

    const positionedTable = positionedTables.find((item) => item.table.id === tableId);
    if (!positionedTable) return;

    event.preventDefault();
    event.stopPropagation();
    svgRef.current?.setPointerCapture?.(event.pointerId);

    const startPoint = toSvgPoint(event);
    setDragState({
      tableId,
      pointerId: event.pointerId,
      startX: startPoint.pos_x,
      startY: startPoint.pos_y,
      originX: positionedTable.x,
      originY: positionedTable.y,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;

    const table = tables.find((candidate) => candidate.id === dragState.tableId);
    if (!table) return;

    const point = toSvgPoint(event);
    const nextPosition = clampPosition(table, {
      pos_x: dragState.originX + point.pos_x - dragState.startX,
      pos_y: dragState.originY + point.pos_y - dragState.startY,
    });

    setPreviewPositions((current) => ({
      ...current,
      [dragState.tableId]: nextPosition,
    }));
  };

  const finishDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragState) return;

    const table = tables.find((candidate) => candidate.id === dragState.tableId);
    const previewPosition = previewPositions[dragState.tableId];

    if (table && previewPosition) {
      const snappedPosition = clampPosition(table, {
        pos_x: snapToGrid(previewPosition.pos_x),
        pos_y: snapToGrid(previewPosition.pos_y),
      });

      onTablePositionChange?.(dragState.tableId, snappedPosition);
    }

    svgRef.current?.releasePointerCapture?.(dragState.pointerId);
    setPreviewPositions((current) => {
      const next = { ...current };
      delete next[dragState.tableId];
      return next;
    });
    setDragState(null);
    event.preventDefault();
  };

  return (
    <div className="w-full aspect-[10/8] bg-surface-elevated rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <svg
        ref={svgRef}
        data-testid="table-map"
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full h-full relative z-10 p-10"
        xmlns="http://www.w3.org/2000/svg"
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <defs>
          <filter id="table-overlap-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#E76F51" floodOpacity="0.9" />
          </filter>
        </defs>

        {positionedTables.map(({ table, x, y }) => (
          <TableItem
            key={table.id}
            table={table}
            x={x}
            y={y}
            isEditMode={isEditMode}
            isOverlapping={overlappingTableIds.has(table.id)}
            onClick={onTableClick}
            onDragStart={handleDragStart}
            allowAllSelectable={allowAllSelectable}
          />
        ))}
      </svg>
    </div>
  );
};
