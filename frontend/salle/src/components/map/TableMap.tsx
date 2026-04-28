import React from 'react';
import { Table } from '@shared/types/tables';
import { TableItem } from './TableItem';

interface TableMapProps {
  tables: Table[];
  onTableClick: (table: Table) => void;
}

export const TableMap: React.FC<TableMapProps> = ({ tables, onTableClick }) => {
  const VIEW_WIDTH = 1000;
  const VIEW_HEIGHT = 800;
  const TABLE_SIZE = 80;
  const GAP = 120;
  const COL_COUNT = 4;

  return (
    <div className="w-full aspect-[10/8] bg-surface-elevated rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ 
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full h-full relative z-10 p-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        {tables.map((table, index) => {
          // Fallback Grid Logic: If pos is 0,0, put in a grid
          const hasPosition = table.pos_x !== 0 || table.pos_y !== 0;
          
          let x = table.pos_x;
          let y = table.pos_y;

          if (!hasPosition) {
            const row = Math.floor(index / COL_COUNT);
            const col = index % COL_COUNT;
            x = 100 + col * (TABLE_SIZE + GAP);
            y = 100 + row * (TABLE_SIZE + GAP);
          }

          return (
            <TableItem
              key={table.id}
              table={table}
              x={x}
              y={y}
              onClick={onTableClick}
            />
          );
        })}
      </svg>
    </div>
  );
};
