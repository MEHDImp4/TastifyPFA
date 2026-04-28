import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Table } from '@shared/types/tables'
import {
  clampPosition,
  getOverlappingTableIds,
  getVisualPosition,
  snapToGrid,
  TableMap,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './TableMap'
import { statusColors, TABLE_RECT_HEIGHT, TABLE_RECT_WIDTH } from './TableItem'

const makeTable = (overrides: Partial<Table> = {}): Table => ({
  id: 1,
  numero: 1,
  capacite: 4,
  statut: 'LIBRE',
  pos_x: 0,
  pos_y: 0,
  est_active: true,
  created_at: '2026-04-28T00:00:00Z',
  updated_at: '2026-04-28T00:00:00Z',
  ...overrides,
})

describe('TableMap', () => {
  it('renders small tables as circles and large tables as rounded rectangles', () => {
    render(
      <TableMap
        tables={[
          makeTable({ id: 1, capacite: 4 }),
          makeTable({ id: 2, numero: 2, capacite: 6 }),
        ]}
        onTableClick={vi.fn()}
      />,
    )

    expect(screen.getByTestId('table-1-circle')).toBeInTheDocument()
    expect(screen.getByTestId('table-2-rect')).toBeInTheDocument()
  })

  it('keeps the locked status color contract', () => {
    expect(statusColors).toEqual({
      LIBRE: '#2A9D8F',
      OCCUPEE: '#E76F51',
      RESERVEE: '#264653',
      ENCAISSEMENT: '#E9C46A',
    })
  })

  it('generates fallback grid positions when table coordinates are both zero', () => {
    expect(getVisualPosition(makeTable(), 0)).toEqual({ pos_x: 100, pos_y: 100 })
    expect(getVisualPosition(makeTable({ id: 5, numero: 5 }), 4)).toEqual({ pos_x: 100, pos_y: 300 })
  })

  it('snaps and clamps positions inside the SVG coordinate system', () => {
    const largeTable = makeTable({ capacite: 8 })

    expect(snapToGrid(129)).toBe(120)
    expect(snapToGrid(131)).toBe(140)
    expect(clampPosition(largeTable, { pos_x: -40, pos_y: VIEW_HEIGHT + 40 })).toEqual({
      pos_x: 0,
      pos_y: VIEW_HEIGHT - TABLE_RECT_HEIGHT,
    })
    expect(clampPosition(largeTable, { pos_x: VIEW_WIDTH + 40, pos_y: 40 })).toEqual({
      pos_x: VIEW_WIDTH - TABLE_RECT_WIDTH,
      pos_y: 40,
    })
  })

  it('marks overlapping tables for visual collision feedback', () => {
    const overlappingIds = getOverlappingTableIds([
      { table: makeTable({ id: 1 }), x: 100, y: 100 },
      { table: makeTable({ id: 2, numero: 2 }), x: 130, y: 130 },
      { table: makeTable({ id: 3, numero: 3 }), x: 500, y: 500 },
    ])

    expect(overlappingIds.has(1)).toBe(true)
    expect(overlappingIds.has(2)).toBe(true)
    expect(overlappingIds.has(3)).toBe(false)
  })

  it('renders red warning strokes for overlapping tables', () => {
    render(
      <TableMap
        tables={[
          makeTable({ id: 1, pos_x: 120, pos_y: 120 }),
          makeTable({ id: 2, numero: 2, pos_x: 140, pos_y: 140 }),
        ]}
        onTableClick={vi.fn()}
      />,
    )

    expect(screen.getByTestId('table-1-circle')).toHaveAttribute('stroke', '#E76F51')
    expect(screen.getByTestId('table-2-circle')).toHaveAttribute('stroke', '#E76F51')
  })
})
