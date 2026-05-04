import { ReactNode } from 'react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ isOpen, onClose, children }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        data-testid="drawer-overlay"
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-surface shadow-2xl p-6 z-50 overflow-y-auto animate-enter">
        {children}
      </div>
    </>
  );
}
