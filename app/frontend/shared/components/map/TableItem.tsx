import React from 'react';
import { motion } from 'framer-motion';
import { Table, TableStatus } from '../../types/tables';

interface TableItemProps {
  table: Table;
  onClick: (table: Table) => void;
  onDragStart?: (tableId: number, event: React.PointerEvent<SVGGElement>) => void;
  x: number;
  y: number;
  isEditMode?: boolean;
  isOverlapping?: boolean;
}

export const statusColors: Record<TableStatus, string> = {
  LIBRE: '#2A9D8F',        // Teal
  OCCUPEE: '#E76F51',      // Red/Coral
  RESERVEE: '#264653',     // Dark Slate
  ENCAISSEMENT: '#E9C46A', // Amber
};

export const TABLE_CIRCLE_SIZE = 82;
export const TABLE_RECT_WIDTH = 118;
export const TABLE_RECT_HEIGHT = 78;

export const getTableDimensions = (table: Pick<Table, 'capacite'>) => {
  if (table.capacite <= 4) {
    return { width: TABLE_CIRCLE_SIZE, height: TABLE_CIRCLE_SIZE };
  }

  return { width: TABLE_RECT_WIDTH, height: TABLE_RECT_HEIGHT };
};

export const isRoundTable = (table: Pick<Table, 'capacite'>) => table.capacite <= 4;

export const TableItem: React.FC<TableItemProps> = ({
  table,
  onClick,
  onDragStart,
  x,
  y,
  isEditMode = false,
  isOverlapping = false,
}) => {
  const dimensions = getTableDimensions(table);
  const isRound = isRoundTable(table);
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const isSelectable = isEditMode || (table.est_disponible !== false && table.statut === 'LIBRE');

  const handleClick = () => {
    if (!isEditMode && isSelectable) {
      onClick(table);
    }
  };

  const handlePointerDown = (event: React.PointerEvent<SVGGElement>) => {
    if (isEditMode) {
      onDragStart?.(table.id, event);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<SVGGElement>) => {
    if (!isEditMode && isSelectable) {
      event.preventDefault();
      handleClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
    if (isSelectable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };
  
  return (
    <motion.g
      data-testid={`table-${table.id}`}
      role="button"
      tabIndex={isEditMode || !isSelectable ? -1 : 0}
      aria-disabled={!isSelectable}
      aria-label={`Table ${table.numero}, ${table.capacite} places, statut ${table.statut}`}
      initial={false}
      animate={{ x, y }}
      whileHover={isSelectable ? { scale: isEditMode ? 1.02 : 1.05 } : undefined}
      whileTap={isSelectable ? { scale: 0.95 } : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      style={{
        cursor: isEditMode ? 'grab' : isSelectable ? 'pointer' : 'not-allowed',
        opacity: isSelectable ? 1 : 0.72,
        touchAction: 'none',
      }}
    >
      {isRound ? (
        <motion.circle
          data-testid={`table-${table.id}-circle`}
          cx={centerX}
          cy={centerY}
          r={TABLE_CIRCLE_SIZE / 2}
          animate={{ fill: statusColors[table.statut] }}
          transition={{ duration: 0.2 }}
          stroke={isOverlapping ? '#E76F51' : 'rgba(255,255,255,0.16)'}
          strokeWidth={isOverlapping ? 5 : 2}
          filter={isOverlapping ? 'url(#table-overlap-glow)' : undefined}
        />
      ) : (
        <motion.rect
          data-testid={`table-${table.id}-rect`}
          width={dimensions.width}
          height={dimensions.height}
          rx={14}
          animate={{ fill: statusColors[table.statut] }}
          transition={{ duration: 0.2 }}
          stroke={isOverlapping ? '#E76F51' : 'rgba(255,255,255,0.16)'}
          strokeWidth={isOverlapping ? 5 : 2}
          filter={isOverlapping ? 'url(#table-overlap-glow)' : undefined}
        />
      )}

      {isEditMode && (
        <rect
          x={-7}
          y={-7}
          width={dimensions.width + 14}
          height={dimensions.height + 14}
          rx={isRound ? dimensions.width / 2 : 18}
          fill="none"
          stroke="rgba(233,196,106,0.7)"
          strokeDasharray="8 8"
          strokeWidth={2}
          pointerEvents="none"
        />
      )}

      <text
        x={centerX}
        y={centerY - 7}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="18"
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {table.numero}
      </text>
      <text
        x={centerX}
        y={centerY + 17}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize="10"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {table.capacite}p
      </text>
    </motion.g>
  );
};
