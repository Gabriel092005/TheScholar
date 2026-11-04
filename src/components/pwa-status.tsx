import { useEffect, useState } from "react";
import { Share, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type EventoInstalar = Event & { prompt: () => Promise<void> };

const CHAVE_DISPENSADO = "pwa-instalar-dispensado-em";
const DIAS_ATE_VOLTAR_A_SUGERIR = 30;

function jaInstalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function eIos() {
  // O iPad recente identifica-se como Mac: distingue-se pelo ecrã tátil.
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function foiDispensado() {
  try {
    const em = Number(localStorage.getItem(CHAVE_DISPENSADO));
    return Date.now() - em < DIAS_ATE_VOLTAR_A_SUGERIR * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function PwaStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  // O iOS não tem pedido de instalação: só dá para explicar o caminho no Safari.
  const [mostrarIos, setMostrarIos] = useState(() => eIos() && !jaInstalada() && !foiDispensado());

  useEffect(() => {
    const aoFicarOffline = () => setOffline(true);
    const aoFicarOnline = () => setOffline(false);
    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      if (!foiDispensado()) setEvento(e as EventoInstalar);
    };
    const aoInstalar = () => setEvento(null);

    window.addEventListener("offline", aoFicarOffline);
    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("offline", aoFicarOffline);
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  function dispensar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
    } catch {
      // Sem armazenamento, a sugestão volta na próxima visita.
    }
    setEvento(null);
    setMostrarIos(false);
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    setEvento(null);
  }

  return (
    <>
      {offline && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white"
        >
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Sem ligação à internet. Os dados não serão atualizados.
        </div>
      )}

      {(evento || mostrarIos) && (
        <div className="fixed inset-x-3 bottom-3 z-[60] flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-xl dark:border-white/[0.08] dark:bg-[#111113] sm:left-auto sm:right-4 sm:w-96">
          <img src="/icons/pwa-64x64.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Instalar a Afroscholars</p>
            {evento ? (
              <>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                  Abra a plataforma como uma app, a partir do ecrã principal.
                </p>
                <Button size="sm" onClick={instalar} className="mt-2.5 rounded-lg">
                  Instalar
                </Button>
              </>
            ) : (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                No Safari, toque em <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-label="Partilhar" /> e
                depois em “Adicionar ao ecrã principal”.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dispensar}
            aria-label="Dispensar"
            className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
