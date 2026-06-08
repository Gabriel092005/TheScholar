import { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Copy, Check, Loader2,
  Video, VideoOff, ExternalLink, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aulasApi } from "@/api/aulas";
import { useUser } from "@/api/useGetProfile";
import { toast } from "sonner";

const JITSI_DOMAIN = "8x8.vc";
const JITSI_APP_ID = "vpaas-magic-cookie-8cfdf63af8c64cc19cacf064555e00f3";

export function AulaOnlineRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [jitsiLoaded, setJitsiLoaded] = useState(false);
  const [jitsiError, setJitsiError] = useState(false);
  const [gravacaoInput, setGravacaoInput] = useState("");
  const [editandoGravacao, setEditandoGravacao] = useState(false);

  const { data: aula, isLoading } = useQuery({
    queryKey: ["aula", id],
    queryFn: () => aulasApi.get(id!),
    enabled: !!id,
  });

  const { user } = useUser();

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status?: "AO_VIVO" | "FINALIZADA"; gravacaoUrl?: string | null }) =>
      aulasApi.updateStatus(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aula", id] });
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
    },
    onError: () => toast.error("Erro ao atualizar aula"),
  });

  const participarMutation = useMutation({
    mutationFn: () => aulasApi.participar(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aula", id] });
    },
    onError: () => {},
  });

  useEffect(() => {
    if (!aula || !jitsiContainerRef.current || jitsiLoaded) return;

    participarMutation.mutate();

    const domain = JITSI_DOMAIN;
    const roomName = `${JITSI_APP_ID}/afroscholars-${aula.roomId}`;
    const container = jitsiContainerRef.current;
    const token = aula.jitsiToken ?? undefined;

    if ((window as any).JitsiMeetExternalAPI) {
      initJitsi(domain, roomName, container, token);
    } else {
      const script = document.createElement("script");
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        try {
          initJitsi(domain, roomName, container, token);
        } catch {
          setJitsiError(true);
        }
      };
      script.onerror = () => setJitsiError(true);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(script);
      };
    }

    if (aula.status === "AGENDADA") {
      updateStatusMutation.mutate({ status: "AO_VIVO" });
    }

    return () => {
      if ((window as any).jitsiApi) {
        (window as any).jitsiApi.dispose();
        (window as any).jitsiApi = null;
      }
    };
  }, [aula?.id]);

  function initJitsi(domain: string, roomName: string, parentNode: HTMLDivElement, token?: string) {
    try {
      const api = new (window as any).JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode,
        width: "100%",
        height: "100%",
        ...(token ? { jwt: token } : {}),
        configOverrides: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          prejoinPageEnabled: false,
          toolbarButtons: [
            "microphone", "camera", "desktop", "chat",
            "raisehand", "tileview", "fullscreen",
            "settings", "filmstrip", "recording",
          ],
          fileRecordingsEnabled: true,
          liveStreamingEnabled: true,
        },
        interfaceConfigOverrides: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
      });
      (window as any).jitsiApi = api;
      setJitsiLoaded(true);
      api.addEventListener("readyToClose", () => {
        if (aula?.status === "AO_VIVO") {
          updateStatusMutation.mutate({ status: "FINALIZADA" });
        }
      });
    } catch {
      setJitsiError(true);
    }
  }

  const salvarGravacaoMutation = useMutation({
    mutationFn: (gravacaoUrl: string | null) =>
      aulasApi.updateStatus(id!, { gravacaoUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aula", id] });
      setEditandoGravacao(false);
      toast.success("Gravação salva!");
    },
    onError: () => toast.error("Erro ao salvar gravação"),
  });

  const podeEditarGravacao = user?.id === aula?.hostId;

  useEffect(() => {
    if (gravacaoInput === "" && aula?.gravacaoUrl) {
      setGravacaoInput(aula.gravacaoUrl);
    }
  }, [aula?.gravacaoUrl]);

  const linkCompartilhar = aula ? `${window.location.origin}/aulas/${aula.id}` : "";

  function copiarLink() {
    navigator.clipboard.writeText(linkCompartilhar).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!aula) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-3 px-5">
        <VideoOff className="h-10 w-10 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Aula não encontrada</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center max-w-sm">
           Esta aula pode não existir ou necessitas de uma inscrição ativa na bolsa para aceder.
        </p>
        <Button variant="outline" onClick={() => navigate("/aulas")} className="rounded-xl">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/aulas")}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-500 dark:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {aula.titulo}
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">
              {aula.host.nome}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copiarLink}
            className="h-8 text-[11px] font-semibold rounded-lg"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 mr-1" />Copiado</>
            ) : (
              <><Copy className="h-3.5 w-3.5 mr-1" />Link</>
            )}
          </Button>
        </div>
      </header>

      {/* Recording section (when aula is finalizada) */}
      {aula.status === "FINALIZADA" ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-black/20 px-5">
          {aula.gravacaoUrl ? (
            <div className="w-full max-w-4xl">
              <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe
                  src={aula.gravacaoUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Gravação da aula"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Gravação disponível
                </p>
                <a
                  href={aula.gravacaoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir no YouTube
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <VideoOff className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Aula finalizada
              </h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">
                A gravação ainda não foi disponibilizada.
              </p>
            </div>
          )}

          {podeEditarGravacao && (
            <div className="mt-6 w-full max-w-4xl border-t border-gray-200 dark:border-white/[0.06] pt-6">
              {editandoGravacao ? (
                <div className="flex gap-2">
                  <Input
                    value={gravacaoInput}
                    onChange={(e) => setGravacaoInput(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 h-10 rounded-xl text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => salvarGravacaoMutation.mutate(gravacaoInput || null)}
                    disabled={salvarGravacaoMutation.isPending}
                    className="rounded-xl h-10 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold"
                  >
                    {salvarGravacaoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditandoGravacao(false); setGravacaoInput(aula.gravacaoUrl || ""); }}
                    className="rounded-xl h-10 text-xs"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditandoGravacao(true); setGravacaoInput(aula.gravacaoUrl || ""); }}
                  className="rounded-xl h-10 text-xs"
                >
                  <Link2 className="h-3.5 w-3.5 mr-1.5" />
                  {aula.gravacaoUrl ? "Alterar gravação" : "Adicionar gravação"}
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Loading overlay for Jitsi */}
          {!jitsiLoaded && !jitsiError && (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black/20">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-zinc-500">A carregar videochamada...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {jitsiError && (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black/20 px-5">
              <div className="text-center max-w-sm">
                <VideoOff className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Não foi possível carregar a videochamada
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">
                  Verifique a sua conexão ou tente novamente.
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-600 mb-4 break-all bg-gray-50 dark:bg-white/[0.04] p-3 rounded-xl">
                  Link da sala: {linkCompartilhar}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-bold"
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {/* Jitsi container */}
          <div
            ref={jitsiContainerRef}
            className={`flex-1 ${jitsiLoaded ? "" : "hidden"}`}
          />
        </>
      )}
    </div>
  );
}
