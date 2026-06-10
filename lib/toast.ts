import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error' | 'warning';
export type Toast = { id: number; msg: string; kind: ToastKind };

type ToastState = {
  items: Toast[];
  show: (msg: string, kind?: ToastKind) => void;
  remove: (id: number) => void;
};

let nextId = 1;

export const useToast = create<ToastState>((set) => ({
  items: [],
  show: (msg, kind = 'info') => {
    const id = nextId++;
    set((s) => ({ items: [...s.items, { id, msg, kind }] }));
    setTimeout(() => {
      set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
    }, 2500);
  },
  remove: (id) =>
    set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));
