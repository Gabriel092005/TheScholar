import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({ open: false, title: "", description: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((description: string, title = "Confirmação") => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, title, description });
    });
  }, []);

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setState((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setState((prev) => ({ ...prev, open: false }));
  };

  const ConfirmDialog = () => (
    <AlertDialog open={state.open} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <AlertDialogContent className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-gray-900 dark:text-white">{state.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 dark:text-zinc-400">{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} className="dark:text-white">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-red-600 hover:bg-red-700">Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
}
