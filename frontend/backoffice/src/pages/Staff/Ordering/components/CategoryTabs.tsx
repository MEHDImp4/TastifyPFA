import { MenuCategory } from '../types'

interface CategoryTabsProps {
  categories: MenuCategory[]
  selectedCategoryId: number | null
  onSelect: (categoryId: number | null) => void
}

export const CategoryTabs = ({ categories, selectedCategoryId, onSelect }: CategoryTabsProps) => {
  const tabClass = (isActive: boolean) => (
    [
      'min-h-11 flex-none snap-start rounded-lg px-5 text-sm font-bold transition-[background-color,color,transform] duration-200 active:scale-[0.97]',
      isActive ? 'bg-[#2A9D8F] text-white' : 'border border-white/10 bg-surface text-foreground-muted hover:text-white',
    ].join(' ')
  )

  return (
    <div className="flex snap-x snap-proximity gap-3 overflow-x-auto pb-2 [overscroll-behavior-x:contain]">
      <button type="button" className={tabClass(selectedCategoryId === null)} onClick={() => onSelect(null)}>
        Tout
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={tabClass(selectedCategoryId === category.id)}
          onClick={() => onSelect(category.id)}
        >
          {category.nom}
        </button>
      ))}
    </div>
  )
}
