import React from 'react';
import { motion } from 'framer-motion';
import { Table, TableStatus } from '@shared/types/tables';

interface TableItemProps {
  table: Table;
  onClick: (table: Table) => void;
  x: number;
  y: number;
}

const statusColors: Record<TableStatus, string> = {
  LIBRE: '#2A9D8F',        // Teal
  OCCUPEE: '#E76F51',      // Red/Coral
  RESERVEE: '#264653',     // Dark Slate
  ENCAISSEMENT: '#E9C46A', // Amber
};

export const TableItem: React.FC<TableItemProps> = ({ table, onClick, x, y }) => {
  const size = 80; // Standard table size in SVG units
  
  return (
    <motion.g
      initial={false}
      animate={{ x, y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(table)}
      style={{ cursor: 'pointer' }}
    >
      <motion.rect
        width={size}
        height={size}
        rx={12}
        animate={{ fill: statusColors[table.statut] }}
        transition={{ duration: 0.4 }}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={2}
        className="shadow-lg"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {table.numero}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 20}
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
