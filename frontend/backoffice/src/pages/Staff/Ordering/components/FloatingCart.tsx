import { AnimatePresence, motion } from 'framer-motion'

interface FloatingCartProps {
  itemCount: number
  total: number
  onOpen: () => void
}

export const FloatingCart = ({ itemCount, total, onOpen }: FloatingCartProps) => (
  <AnimatePresence>
    {itemCount > 0 && (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        onClick={onOpen}
        className="fixed bottom-5 left-1/2 z-50 flex min-h-14 w-[min(calc(100%-2rem),560px)] -translate-x-1/2 items-center justify-between rounded-lg bg-[#2A9D8F] px-5 text-white shadow-2xl transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.97]"
      >
        <span className="font-bold">{itemCount} article{itemCount > 1 ? 's' : ''}</span>
        <span className="font-bold tabular-nums">Total: {total.toFixed(2)} DH</span>
      </motion.button>
    )}
  </AnimatePresence>
)
