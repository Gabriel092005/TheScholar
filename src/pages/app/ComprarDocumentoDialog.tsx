import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { gestorApi, type DocumentoPublico } from "@/api/gestor";
import type { MetodoPagamento, PagamentoMomenu } from "@/api/pagamentos";
import {
  EstadoPagamento, SeletorPagamento, cupomCobreTudo, normalizarTelefone, telefoneValido,
} from "@/components/pagamento-momenu";
import type { CupomAplicado } from "@/api/cupons";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface ComprarDocumentoDialogProps {
  documento: DocumentoPublico | null;
  onClose: () => void;
}

export function ComprarDocumentoDialog({ documento, onClose }: ComprarDocumentoDialogProps) {
  const queryClient = useQueryClient();
  const [metodo, setMetodo] = useState<MetodoPagamento>("momenu-mcx");
  const [telefone, setTelefone] = useState("");
  const [pagamento, setPagamento] = useState<PagamentoMomenu | null>(null);
  const [erro, setErro] = useState("");
  const [cupom, setCupom] = useState<CupomAplicado | null>(null);

  const documentoId = documento?.id;
  useEffect(() => {
    setPagamento(null);
    setErro("");
    setCupom(null);
  }, [documentoId]);

  const atualizarLista = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["documentos-publicos"] });
  }, [queryClient]);

  const comprar = useMutation({
    mutationFn: () =>
      gestorApi.comprarDocumento(documento!.id, {
        metodo: cupomCobreTudo(cupom) ? undefined : metodo,
        phoneNumber: !cupomCobreTudo(cupom) && metodo === "momenu-mcx" ? normalizarTelefone(telefone) : undefined,
        cupom: cupom?.codigo,
      }),
    onSuccess: ({ pagamento: novo }) => {
      setPagamento(novo);
      atualizarLista();
    },
    onError: (e: { response?: { status?: number; data?: { message?: string } } }) => {
      setErro(
        e.response?.status === 401
          ? "Inicie sessão para comprar este documento."
          : e.response?.data?.message || "Não foi possível iniciar o pagamento. Tente novamente."
      );
    },
  });

  const pagar = () => {
    setErro("");
    if (!cupomCobreTudo(cupom) && metodo === "momenu-mcx" && !telefoneValido(telefone)) {
      setErro("Indique um telefone válido com 9 dígitos, a começar por 9.");
      return;
    }
    comprar.mutate();
  };

  const confirmado = useCallback(() => {
    toast.success("Pagamento confirmado! Já pode abrir o documento.");
    atualizarLista();
  }, [atualizarLista]);

  return (
    <Dialog open={!!documento} onOpenChange={(aberto) => !aberto && !comprar.isPending && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Comprar documento</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
            {documento?.titulo}
          </DialogDescription>
        </DialogHeader>

        {pagamento ? (
          <EstadoPagamento
            pagamento={pagamento}
            onConfirmado={confirmado}
            onFechar={(status) => (status === "FALHADO" ? setPagamento(null) : onClose())}
          />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/[0.03]">
              <span className="text-sm text-gray-500 dark:text-zinc-400">Total</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {cupom
                  ? cupomCobreTudo(cupom) ? "Grátis" : `${cupom.valorFinal.toLocaleString("pt-PT")} Kz`
                  : `${documento?.preco.toLocaleString("pt-PT")} Kz`}
              </span>
            </div>

            <SeletorPagamento
              metodo={metodo}
              onMetodo={setMetodo}
              telefone={telefone}
              onTelefone={setTelefone}
              cupom={documento ? { tipo: "DOCUMENTO", itemId: documento.id, valor: documento.preco, aplicado: cupom, onAplicado: setCupom } : undefined}
            />

            {erro && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                {erro}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={comprar.isPending} className="h-11 rounded-xl dark:text-white">
                Cancelar
              </Button>
              <Button onClick={pagar} disabled={comprar.isPending} className="h-11 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
                {comprar.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A processar...</>
                ) : cupomCobreTudo(cupom) ? "Obter documento" : metodo === "reference" ? "Gerar referência" : "Pagar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
