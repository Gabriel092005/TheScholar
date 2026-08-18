import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Send, Users, MessageCircle, Loader2,
  MoreHorizontal, LogOut, Paperclip, FileText, Image,
  Music, Video, X, FileIcon, Headphones, Mic, UserPlus, Search,
  Check, X as XIcon, UserCheck, Trash2, GraduationCap,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUser } from "@/api/useGetProfile";
import {
  buscarComunidade, listarMensagens, enviarMensagem,
  sairComunidade, entrarComunidade,
  convidarUsuario, searchUsuarios,
  listarMembros, listarSolicitacoes, responderSolicitacao, removerMensagem, removerMembro,
  listarDuvidas, criarDuvida, removerDuvida, criarResposta, removerResposta,
  type CommunityMessage, type MensagemTipo, type UserSearchResult,
  type CommunityQuestion,
} from "@/api/comunidades";
import { socket, connectSocket } from "@/lib/socket";
import { api, getUploadUrl } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

const FILE_ICONS: Record<string, React.ReactNode> = {
  IMAGE: <Image className="w-5 h-5" />,
  AUDIO: <Music className="w-5 h-5" />,
  VIDEO: <Video className="w-5 h-5" />,
  DOCUMENT: <FileText className="w-5 h-5" />,
};

function getFileTypeFromName(name: string): MensagemTipo {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "IMAGE";
  if (["mp3", "wav", "ogg", "aac", "flac", "m4a"].includes(ext)) return "AUDIO";
  if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext)) return "VIDEO";
  return "DOCUMENT";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ComunidadeChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [membrosOpen, setMembrosOpen] = useState(false);
  const [solicitacoesOpen, setSolicitacoesOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "duvidas">("chat");
  const [duvidaTitulo, setDuvidaTitulo] = useState("");
  const [duvidaConteudo, setDuvidaConteudo] = useState("");
  const [respondendoDuvida, setRespondendoDuvida] = useState<string | null>(null);
  const [respostaConteudo, setRespostaConteudo] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ usuarioId: string; nome: string }[]>([]);
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingEmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useAudioRecorder();

  const { data: comunidade, isLoading: loadingComunidade } = useQuery({
    queryKey: ["comunidade", id],
    queryFn: () => buscarComunidade(id!),
    enabled: !!id,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["mensagens", id],
    queryFn: () => listarMensagens(id!),
    enabled: !!id,
  });

  const { data: membros = [] } = useQuery({
    queryKey: ["membros", id],
    queryFn: () => listarMembros(id!),
    enabled: !!id && membrosOpen,
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["solicitacoes", id],
    queryFn: () => listarSolicitacoes(id!),
    enabled: !!id && solicitacoesOpen && comunidade?.meuPapel === "ADMIN",
  });

  useEffect(() => {
    if (!id || !user) return;
    connectSocket();
    socket.emit("entrar_comunidade", id);

    const handler = (msg: CommunityMessage) => {
      if (msg.comunidadeId === id) {
        setTypingUsers((prev) => prev.filter((u) => u.usuarioId !== msg.usuarioId));
        queryClient.setQueryData<CommunityMessage[]>(["mensagens", id], (old) => {
          if (!old) return [msg];
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        });
      }
    };

    socket.on("nova_mensagem", handler);

    const removeHandler = (mensagemId: string) => {
      queryClient.setQueryData<CommunityMessage[]>(["mensagens", id], (old) => {
        if (!old) return old;
        return old.filter((m) => m.id !== mensagemId);
      });
    };
    socket.on("mensagem_removida", removeHandler);

    const typingHandler = (data: { comunidadeId: string; usuarioId: string; nome: string }) => {
      if (data.usuarioId === user.id) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.usuarioId === data.usuarioId)) return prev;
        return [...prev, { usuarioId: data.usuarioId, nome: data.nome }];
      });
      if (typingTimeoutsRef.current.has(data.usuarioId)) {
        clearTimeout(typingTimeoutsRef.current.get(data.usuarioId)!);
      }
      typingTimeoutsRef.current.set(
        data.usuarioId,
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.usuarioId !== data.usuarioId));
          typingTimeoutsRef.current.delete(data.usuarioId);
        }, 3000)
      );
    };
    socket.on("alguem_escrevendo", typingHandler);

    return () => {
      socket.off("nova_mensagem", handler);
      socket.off("mensagem_removida", removeHandler);
      socket.off("alguem_escrevendo", typingHandler);
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
      socket.emit("sair_comunidade", id);
    };
  }, [id, user, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loadingMessages && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loadingMessages]);

  useEffect(() => {
    if (!inviteOpen) { setInviteSearch(""); setInviteResults([]); return; }
  }, [inviteOpen]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!inviteSearch || inviteSearch.length < 2) { setInviteResults([]); return; }
    setSearchingUsers(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const r = await searchUsuarios(inviteSearch);
        setInviteResults(r);
      } catch (e: any) {
        console.error("Search error:", e);
        setInviteResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [inviteSearch]);

  const enviarMutation = useMutation({
    mutationFn: () => {
      const fileTipo = selectedFile ? getFileTypeFromName(selectedFile.name) : "TEXT";
      return enviarMensagem(id!, input, fileTipo, selectedFile);
    },
    onSuccess: () => {
      setInput("");
      setSelectedFile(null);
      setFilePreview(null);
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  const enviarAudioMutation = useMutation({
    mutationFn: (blob: Blob) => {
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
      return enviarMensagem(id!, "", "AUDIO", file);
    },
    onSuccess: () => {
      recorder.discardAudio();
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
    },
    onError: () => toast.error("Erro ao enviar áudio"),
  });

  const convidarMutation = useMutation({
    mutationFn: (usuarioId: string) => convidarUsuario(id!, usuarioId),
    onSuccess: (_data, usuarioId) => {
      queryClient.invalidateQueries({ queryKey: ["comunidade", id] });
      setInviteResults((prev) => prev.filter((u) => u.id !== usuarioId));
      toast.success("Usuário adicionado à comunidade!");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erro ao convidar"),
  });

  const responderMutation = useMutation({
    mutationFn: ({ membroId, acao }: { membroId: string; acao: "APROVAR" | "REJEITAR" }) =>
      responderSolicitacao(id!, membroId, acao),
    onSuccess: (_data, { acao }) => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes", id] });
      queryClient.invalidateQueries({ queryKey: ["comunidade", id] });
      queryClient.invalidateQueries({ queryKey: ["membros", id] });
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      toast.success(acao === "APROVAR" ? "Solicitação aprovada!" : "Solicitação rejeitada.");
    },
    onError: () => toast.error("Erro ao responder solicitação"),
  });

  const entrarMutation = useMutation({
    mutationFn: () => entrarComunidade(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidade", id] });
      queryClient.invalidateQueries({ queryKey: ["mensagens", id] });
      toast.success("Entrou na comunidade!");
    },
    onError: () => toast.error("Erro ao entrar na comunidade"),
  });

  const sairMutation = useMutation({
    mutationFn: () => sairComunidade(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      toast.success("Saiu da comunidade");
      navigate("/comunidades");
    },
    onError: () => toast.error("Erro ao sair da comunidade"),
  });

  const deleteMsgMutation = useMutation({
    mutationFn: (mensagemId: string) => removerMensagem(id!, mensagemId),
    onSuccess: () => {
      toast.success("Mensagem removida");
    },
    onError: () => toast.error("Erro ao remover mensagem"),
  });

  const removerMembroMutation = useMutation({
    mutationFn: (membroId: string) => removerMembro(id!, membroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membros", id] });
      queryClient.invalidateQueries({ queryKey: ["comunidade", id] });
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      toast.success("Membro removido da comunidade");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erro ao remover membro"),
  });

  const { data: duvidas = [] } = useQuery({
    queryKey: ["duvidas", id],
    queryFn: () => listarDuvidas(id!),
    enabled: !!id && tab === "duvidas",
  });

  const criarDuvidaMutation = useMutation({
    mutationFn: () => criarDuvida(id!, duvidaTitulo, duvidaConteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duvidas", id] });
      setDuvidaTitulo("");
      setDuvidaConteudo("");
      toast.success("Dúvida publicada!");
    },
    onError: () => toast.error("Erro ao publicar dúvida"),
  });

  const removerDuvidaMutation = useMutation({
    mutationFn: (duvidaId: string) => removerDuvida(id!, duvidaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duvidas", id] });
      toast.success("Dúvida removida");
    },
    onError: () => toast.error("Erro ao remover dúvida"),
  });

  const criarRespostaMutation = useMutation({
    mutationFn: ({ duvidaId, conteudo }: { duvidaId: string; conteudo: string }) =>
      criarResposta(id!, duvidaId, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duvidas", id] });
      setRespondendoDuvida(null);
      setRespostaConteudo("");
      toast.success("Resposta publicada!");
    },
    onError: () => toast.error("Erro ao publicar resposta"),
  });

  const removerRespostaMutation = useMutation({
    mutationFn: ({ duvidaId, respostaId }: { duvidaId: string; respostaId: string }) =>
      removerResposta(id!, duvidaId, respostaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duvidas", id] });
      toast.success("Resposta removida");
    },
    onError: () => toast.error("Erro ao remover resposta"),
  });

  const sendingRef = useRef(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || enviarMutation.isPending || sendingRef.current) return;
    sendingRef.current = true;
    enviarMutation.mutate(undefined, {
      onSettled: () => { sendingRef.current = false; },
    });
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleMicPointerDown = useCallback(() => {
    recorder.startRecording();
  }, [recorder]);

  useEffect(() => {
    if (!recorder.isRecording) return;
    const up = () => {
      if (recorder.isRecording) recorder.stopRecording();
    };
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [recorder.isRecording, recorder]);

  if (loadingComunidade) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!comunidade) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] gap-3">
        <p className="text-gray-500 dark:text-zinc-400">Comunidade não encontrada</p>
        <Button variant="outline" onClick={() => navigate("/comunidades")} className="rounded-xl">
          Voltar
        </Button>
      </div>
    );
  }

  const avatarColor = COLORS[comunidade.nome.length % COLORS.length];
  const groupedByDate = groupMessagesByDate(messages);

  const canSend = (input.trim() || selectedFile) && !enviarMutation.isPending;
  const showInput = !recorder.isRecording && !recorder.audioUrl && !recorder.isPreparing;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {comunidade.capa && (
        <div className="h-32 sm:h-44 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/[0.04]">
          <img
            src={getUploadUrl(comunidade.capa)}
            alt="Capa da comunidade"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/comunidades")}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-500 dark:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-white/[0.08]" />
          <div className="flex items-center gap-3 min-w-0">
            {comunidade.imagem ? (
              <img
                src={getUploadUrl(comunidade.imagem)}
                alt={comunidade.nome}
                className="w-9 h-9 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0", avatarColor)}>
                {comunidade.nome.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {comunidade.nome}
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                {comunidade._count.membros} membro{comunidade._count.membros !== 1 ? "s" : ""}
              </p>
              {comunidade.bolsa && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {comunidade.bolsa.titulo}
                </p>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-500 dark:text-zinc-400 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border border-gray-100 dark:border-white/[0.06] dark:bg-[#111113] p-2">
            <DropdownMenuItem
              onClick={() => setMembrosOpen(true)}
              className="flex items-center gap-2 p-2.5 text-sm rounded-lg cursor-pointer text-gray-700 dark:text-zinc-300 font-medium hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              <Users className="h-4 w-4" />
              Ver Membros
            </DropdownMenuItem>
            {comunidade.meuPapel === "ADMIN" && (
              <DropdownMenuItem
                onClick={() => setSolicitacoesOpen(true)}
                className="flex items-center gap-2 p-2.5 text-sm rounded-lg cursor-pointer text-gray-700 dark:text-zinc-300 font-medium hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              >
                <UserCheck className="h-4 w-4" />
                Solicitações Pendentes
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-2 p-2.5 text-sm rounded-lg cursor-pointer text-gray-700 dark:text-zinc-300 font-medium hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              <UserPlus className="h-4 w-4" />
              Convidar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => sairMutation.mutate()}
              className="flex items-center gap-2 p-2.5 text-sm rounded-lg cursor-pointer text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sair da comunidade
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {comunidade.souMembro && (
        <div className="flex gap-1 px-4 sm:px-6 pt-3 pb-0 bg-gray-50/50 dark:bg-black/[0.02] shrink-0">
          <button
            onClick={() => setTab("chat")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
              tab === "chat"
                ? "bg-white dark:bg-[#111113] text-emerald-600 dark:text-emerald-400 border border-b-0 border-gray-100 dark:border-white/[0.06]"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            )}
          >
            Chat
          </button>
          <button
            onClick={() => setTab("duvidas")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
              tab === "duvidas"
                ? "bg-white dark:bg-[#111113] text-emerald-600 dark:text-emerald-400 border border-b-0 border-gray-100 dark:border-white/[0.06]"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            )}
          >
            Dúvidas
          </button>
        </div>
      )}

      {tab === "duvidas" && comunidade.souMembro ? (
        <DuvidasPanel
          duvidas={duvidas}
          duvidaTitulo={duvidaTitulo}
          duvidaConteudo={duvidaConteudo}
          respondendoDuvida={respondendoDuvida}
          respostaConteudo={respostaConteudo}
          user={user}
          comunidade={comunidade}
          onDuvidaTituloChange={setDuvidaTitulo}
          onDuvidaConteudoChange={setDuvidaConteudo}
          onCriarDuvida={() => criarDuvidaMutation.mutate()}
          onRemoverDuvida={(id) => removerDuvidaMutation.mutate(id)}
          onResponderDuvida={(id) => setRespondendoDuvida(respondendoDuvida === id ? null : id)}
          onRespostaConteudoChange={setRespostaConteudo}
          onEnviarResposta={(duvidaId) => criarRespostaMutation.mutate({ duvidaId, conteudo: respostaConteudo })}
          onRemoverResposta={(duvidaId, respostaId) => removerRespostaMutation.mutate({ duvidaId, respostaId })}
          isCreating={criarDuvidaMutation.isPending}
          isSendingAnswer={criarRespostaMutation.isPending}
        />
      ) : (
        <>
        <ScrollArea className="flex-1 px-4 sm:px-6 py-4 bg-gray-50/50 dark:bg-black/[0.02]">
          <div className="space-y-6">
        {!comunidade.souMembro ? (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white text-lg font-bold", avatarColor)}>
              {comunidade.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{comunidade.nome}</h2>
              {comunidade.descricao && <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">{comunidade.descricao}</p>}
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3">
                {comunidade._count.membros} membro{comunidade._count.membros !== 1 ? "s" : ""} &middot; {comunidade._count.mensagens} mensagen{comunidade._count.mensagens !== 1 ? "ns" : ""}
              </p>
            </div>
            {comunidade.solicitacaoPendente ? (
              <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Solicitação pendente
              </div>
            ) : (
              <Button
                onClick={() => entrarMutation.mutate()}
                disabled={entrarMutation.isPending}
                className="h-11 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
              >
                {entrarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Users className="h-4 w-4 mr-2" />
                )}
                Entrar na comunidade
              </Button>
            )}
          </div>
        ) : loadingMessages ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Nenhuma mensagem ainda</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedByDate).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
                <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                  {date === hoje() ? "Hoje" : date === ontem() ? "Ontem" : date}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-white/[0.06]" />
              </div>
              <div className="space-y-3">
                {msgs.map((msg) => {
                  const isOwn = msg.usuarioId === user?.id;
                  const msgColor = COLORS[msg.usuario.nome.length % COLORS.length];
                  const avatarSrc = msg.usuario.image_path
                    ? getUploadUrl(`/uploads/${msg.usuario.image_path}`)
                    : "";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-3 group", isOwn ? "flex-row-reverse" : "")}
                    >
                      <Avatar className="w-8 h-8 border-2 border-white dark:border-[#111113] shrink-0 mt-0.5">
                        <AvatarImage src={avatarSrc} className="object-cover" />
                        <AvatarFallback className={cn(msgColor, "text-white text-[9px] font-bold")}>
                          {msg.usuario.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("max-w-[75%]", isOwn ? "items-end" : "items-start")}>
                        <div className={cn("flex items-baseline gap-2 mb-1", isOwn ? "flex-row-reverse" : "")}>
                          <span className="text-[11px] font-medium text-gray-700 dark:text-zinc-300">
                            {isOwn ? "Você" : msg.usuario.nome}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-zinc-600">
                            {formatMsgTime(msg.created_at)}
                          </span>
                          {(isOwn || comunidade.meuPapel === "ADMIN" || user?.role === "ADMIN") && (
                            <button
                              onClick={() => deleteMsgMutation.mutate(msg.id)}
                              disabled={deleteMsgMutation.isPending}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-500/20 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <MessageBubble message={msg} isOwn={isOwn} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
        </ScrollArea>

      {typingUsers.length > 0 && (
        <div className="px-4 sm:px-6 py-1.5 bg-white dark:bg-[#111113] shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0].nome} está a escrever...`
                : typingUsers.length === 2
                  ? `${typingUsers[0].nome} e ${typingUsers[1].nome} estão a escrever...`
                  : `${typingUsers[0].nome} e mais ${typingUsers.length - 1} pessoas estão a escrever...`}
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSend}
        className="flex flex-col px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] shrink-0 gap-2"
      >
        {selectedFile && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]">
            {filePreview ? (
              <img src={filePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-white/[0.08] flex items-center justify-center text-gray-500">
                {FILE_ICONS[getFileTypeFromName(selectedFile.name)] || <FileIcon className="w-5 h-5" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={removeSelectedFile}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {recorder.audioUrl && !recorder.isRecording && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-white/[0.08] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <audio controls className="flex-1 h-9" src={recorder.audioUrl}>
              <a href={recorder.audioUrl} download>Download</a>
            </audio>
            <button
              type="button"
              onClick={recorder.discardAudio}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (recorder.audioBlob) enviarAudioMutation.mutate(recorder.audioBlob);
              }}
              disabled={enviarAudioMutation.isPending}
              className="h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shrink-0"
            >
              {enviarAudioMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Enviar"
              )}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-3">
          {showInput && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors shrink-0"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 p-2 rounded-xl border border-gray-100 dark:border-white/[0.06] dark:bg-[#111113]">
                  {[
                    { label: "Imagem", icon: Image, accept: "image/*" },
                    { label: "Áudio", icon: Music, accept: "audio/*" },
                    { label: "Vídeo", icon: Video, accept: "video/*" },
                    { label: "Documento", icon: FileText, accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" },
                  ].map(({ label, icon: Icon, accept }) => (
                    <DropdownMenuItem
                      key={label}
                      onClick={() => {
                        const input = fileInputRef.current;
                        if (input) {
                          input.accept = accept;
                          input.click();
                        }
                      }}
                      className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (e.target.value.trim() && user) {
                    if (!typingEmitRef.current) {
                      socket.emit("typing", { comunidadeId: id!, nome: user.nome });
                    }
                    if (typingEmitRef.current) clearTimeout(typingEmitRef.current);
                    typingEmitRef.current = setTimeout(() => {
                      typingEmitRef.current = null;
                    }, 2000);
                  }
                }}
                placeholder="Escreva uma mensagem..."
                disabled={enviarMutation.isPending}
                className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-sm focus-visible:ring-emerald-500/40"
              />
            </>
          )}

          {recorder.isRecording && (
            <RecordingIndicator duration={recorder.duration} />
          )}

          {recorder.isPreparing && (
            <div className="flex-1 flex items-center justify-center h-11">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <span className="ml-2 text-sm text-gray-500 dark:text-zinc-400">A preparar microfone...</span>
            </div>
          )}

          {showInput && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onMouseDown={handleMicPointerDown}
                onTouchStart={handleMicPointerDown}
                title="Gravar áudio (segurar)"
                className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-400 dark:text-zinc-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors shrink-0"
              >
                <Mic className="h-5 w-5" />
              </button>
              <Button
                type="submit"
                disabled={!canSend}
                size="icon"
                className="h-11 w-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 disabled:opacity-40"
              >
                {enviarMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </form>
      </>

      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Convidar para {comunidade?.nome}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
              Pesquise por nome ou email do usuário.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              placeholder="Pesquisar usuários..."
              className="h-11 pl-10 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-sm focus-visible:ring-emerald-500/40"
              autoFocus
            />
          </div>

          <ScrollArea className="max-h-60 -mx-2 px-2">
            <div className="space-y-1">
            {searchingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : inviteSearch.length >= 2 && inviteResults.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-zinc-500 py-8">
                Nenhum usuário encontrado.
              </p>
            ) : inviteSearch.length < 2 ? (
              <p className="text-center text-sm text-gray-400 dark:text-zinc-600 py-8">
                Digite pelo menos 2 caracteres.
              </p>
            ) : (
              inviteResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors group"
                >
                  <Avatar className="w-9 h-9 border-2 border-white dark:border-[#111113] shrink-0">
                    <AvatarImage src={u.image_path ? getUploadUrl(`/uploads/${u.image_path}`) : ""} className="object-cover" />
                    <AvatarFallback className="bg-emerald-500 text-white text-[9px] font-bold">
                      {u.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nome}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate">{u.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => convidarMutation.mutate(u.id)}
                    disabled={convidarMutation.isPending}
                    className="h-8 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    Adicionar
                  </Button>
                </div>
              ))
            )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={membrosOpen} onOpenChange={setMembrosOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Membros — {comunidade?.nome}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
              {comunidade?._count.membros} membro{comunidade?._count.membros !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80 -mx-2 px-2">
            <div className="space-y-1">
            {membros.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-zinc-500 py-8">Nenhum membro encontrado.</p>
            ) : (
              membros.map((m) => {
                const podeRemover =
                  (comunidade?.meuPapel === "ADMIN" || user?.role === "ADMIN") &&
                  m.usuarioId !== comunidade?.criadorId &&
                  m.usuarioId !== user?.id;

                return (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group">
                  <Avatar className="w-9 h-9 border-2 border-white dark:border-[#111113] shrink-0">
                    <AvatarImage src={m.usuario.image_path ? getUploadUrl(`/uploads/${m.usuario.image_path}`) : ""} className="object-cover" />
                    <AvatarFallback className={cn(COLORS[m.usuario.nome.length % COLORS.length], "text-white text-[9px] font-bold")}>
                      {m.usuario.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.usuario.nome}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate">{m.usuario.email}</p>
                  </div>
                  {m.role === "ADMIN" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1 rounded-lg shrink-0">
                      Admin
                    </span>
                  )}
                  {podeRemover && (
                    <button
                      onClick={() => removerMembroMutation.mutate(m.id)}
                      disabled={removerMembroMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                );
              })
            )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={solicitacoesOpen} onOpenChange={setSolicitacoesOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Solicitações Pendentes
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
              {solicitacoes.length} solicitaç{ solicitacoes.length !== 1 ? "ões" : "ão"} aguardando aprovação
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80 -mx-2 px-2">
            <div className="space-y-1">
            {solicitacoes.length === 0 ? (
              <p className="text-center text-sm text-gray-500 dark:text-zinc-500 py-8">Nenhuma solicitação pendente.</p>
            ) : (
              solicitacoes.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl group">
                  <Avatar className="w-9 h-9 border-2 border-white dark:border-[#111113] shrink-0">
                    <AvatarImage src={s.usuario.image_path ? getUploadUrl(`/uploads/${s.usuario.image_path}`) : ""} className="object-cover" />
                    <AvatarFallback className={cn(COLORS[s.usuario.nome.length % COLORS.length], "text-white text-[9px] font-bold")}>
                      {s.usuario.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.usuario.nome}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate">{s.usuario.email}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => responderMutation.mutate({ membroId: s.id, acao: "APROVAR" })}
                      disabled={responderMutation.isPending}
                      className="h-8 w-8 p-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {responderMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => responderMutation.mutate({ membroId: s.id, acao: "REJEITAR" })}
                      disabled={responderMutation.isPending}
                      variant="outline"
                      className="h-8 w-8 p-0 rounded-xl border-red-200 dark:border-red-500/20 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: CommunityMessage; isOwn: boolean }) {
  const fileUrl = message.anexoUrl
    ? getUploadUrl(message.anexoUrl)
    : null;

  const hasContent = message.content && message.content !== "";
  const hasFile = !!message.anexoUrl;

  return (
    <div className={cn(
      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed space-y-2",
      isOwn
        ? "bg-emerald-500 text-white rounded-tr-sm"
        : "bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white border border-gray-100 dark:border-white/[0.06] rounded-tl-sm"
    )}>
      {hasFile && message.tipo === "IMAGE" && (
        <a href={fileUrl!} target="_blank" rel="noopener noreferrer" className="block -mx-1 -mt-1">
          <img
            src={fileUrl!}
            alt="Imagem"
            className="max-w-full rounded-xl max-h-80 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            loading="lazy"
          />
        </a>
      )}

      {hasFile && message.tipo === "AUDIO" && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-white/[0.08] flex items-center justify-center shrink-0">
            <Headphones className={cn("w-4 h-4", isOwn ? "text-emerald-700" : "text-emerald-500")} />
          </div>
          <audio controls className="max-w-full h-8 flex-1" src={fileUrl!} preload="metadata">
            <a href={fileUrl!} download>Download áudio</a>
          </audio>
        </div>
      )}

      {hasFile && message.tipo === "VIDEO" && (
        <div className="relative">
          <video
            controls
            className="max-w-full rounded-xl max-h-80"
            src={fileUrl!}
            preload="metadata"
          >
            <a href={fileUrl!} download>Download vídeo</a>
          </video>
        </div>
      )}

      {hasFile && message.tipo === "DOCUMENT" && (
        <a
          href={fileUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-colors",
            isOwn
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-gray-50 dark:bg-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.08]"
          )}
        >
          <FileText className="w-8 h-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {message.anexoUrl?.split("/").pop() || "Documento"}
            </p>
            <p className={cn("text-[10px]", isOwn ? "text-emerald-100" : "text-gray-500 dark:text-zinc-500")}>
              Abrir documento
            </p>
          </div>
        </a>
      )}

      {hasContent && <p>{message.content}</p>}

      {!hasContent && !hasFile && <p className="italic opacity-60">Mensagem vazia</p>}
    </div>
  );
}

function RecordingIndicator({ duration }: { duration: number }) {
  return (
    <div className="flex-1 flex items-center gap-3 h-11 px-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
      <span className="flex h-3 w-3 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>
      <span className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
        {formatDuration(duration)}
      </span>
      <div className="flex-1 flex items-center gap-0.5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="w-0.5 bg-red-400 dark:bg-red-500 rounded-full animate-pulse"
            style={{
              height: `${Math.random() * 24 + 4}px`,
              animationDelay: `${i * 0.05}s`,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>
      <span className="text-[11px] text-red-500 dark:text-red-400 font-medium whitespace-nowrap">
        Largar para enviar
      </span>
    </div>
  );
}

function groupMessagesByDate(messages: CommunityMessage[]): Record<string, CommunityMessage[]> {
  const groups: Record<string, CommunityMessage[]> = {};
  for (const msg of messages) {
    const date = new Date(msg.created_at).toLocaleDateString("pt-PT");
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
  }
  return groups;
}

function hoje() {
  return new Date().toLocaleDateString("pt-PT");
}

function ontem() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("pt-PT");
}

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function DuvidasPanel({
  duvidas,
  duvidaTitulo,
  duvidaConteudo,
  respondendoDuvida,
  respostaConteudo,
  user,
  comunidade,
  onDuvidaTituloChange,
  onDuvidaConteudoChange,
  onCriarDuvida,
  onRemoverDuvida,
  onResponderDuvida,
  onRespostaConteudoChange,
  onEnviarResposta,
  onRemoverResposta,
  isCreating,
  isSendingAnswer,
}: {
  duvidas: CommunityQuestion[];
  duvidaTitulo: string;
  duvidaConteudo: string;
  respondendoDuvida: string | null;
  respostaConteudo: string;
  user: { id: string; role: string } | null;
  comunidade: any;
  onDuvidaTituloChange: (v: string) => void;
  onDuvidaConteudoChange: (v: string) => void;
  onCriarDuvida: () => void;
  onRemoverDuvida: (id: string) => void;
  onResponderDuvida: (id: string) => void;
  onRespostaConteudoChange: (v: string) => void;
  onEnviarResposta: (duvidaId: string) => void;
  onRemoverResposta: (duvidaId: string, respostaId: string) => void;
  isCreating: boolean;
  isSendingAnswer: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <ScrollArea className="flex-1 px-4 sm:px-6 py-4 bg-gray-50/50 dark:bg-black/[0.02]">
      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {duvidas.length} dúvida{duvidas.length !== 1 ? "s" : ""}
        </p>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold"
        >
          {showForm ? "Cancelar" : "Nova Dúvida"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Título</Label>
            <Input
              value={duvidaTitulo}
              onChange={(e) => onDuvidaTituloChange(e.target.value)}
              placeholder="Ex: Como candidatar-me a bolsas?"
              className="h-10 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Descrição</Label>
            <Textarea
              value={duvidaConteudo}
              onChange={(e) => onDuvidaConteudoChange(e.target.value)}
              placeholder="Descreva a sua dúvida em detalhe..."
              className="rounded-xl text-sm resize-none"
              rows={3}
            />
          </div>
          <Button
            onClick={onCriarDuvida}
            disabled={!duvidaTitulo.trim() || !duvidaConteudo.trim() || isCreating}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publicar Dúvida
          </Button>
        </div>
      )}

      {duvidas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <MessageCircle className="w-10 h-10 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Nenhuma dúvida ainda</p>
          <p className="text-xs text-gray-500 dark:text-zinc-500">Seja o primeiro a perguntar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {duvidas.map((duvida) => {
            const isDuvidaOwner = duvida.usuarioId === user?.id;
            const canDelete = isDuvidaOwner || comunidade.meuPapel === "ADMIN" || user?.role === "ADMIN";

            return (
              <div key={duvida.id} className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-8 h-8 border-2 border-white dark:border-[#111113] shrink-0">
                        <AvatarImage src={duvida.usuario.image_path ? getUploadUrl(`/uploads/${duvida.usuario.image_path}`) : ""} />
                        <AvatarFallback className="bg-emerald-500 text-white text-[9px] font-bold">
                          {duvida.usuario.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{duvida.titulo}</p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                          {duvida.usuario.nome} &middot; {formatMsgTime(duvida.created_at)}
                        </p>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => onRemoverDuvida(duvida.id)}
                        className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mt-3 leading-relaxed whitespace-pre-wrap">
                    {duvida.conteudo}
                  </p>
                </div>

                {/* Respostas */}
                {duvida.respostas.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-white/[0.06] divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {duvida.respostas.map((resposta) => {
                      const isRespostaOwner = resposta.usuarioId === user?.id;
                      const canDeleteResposta = isRespostaOwner || isDuvidaOwner || comunidade.meuPapel === "ADMIN" || user?.role === "ADMIN";

                      return (
                        <div key={resposta.id} className="px-4 py-3 ml-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="w-6 h-6 border border-white dark:border-[#111113] shrink-0">
                                <AvatarImage src={resposta.usuario.image_path ? getUploadUrl(`/uploads/${resposta.usuario.image_path}`) : ""} />
                                <AvatarFallback className="bg-gray-400 text-white text-[7px] font-bold">
                                  {resposta.usuario.nome.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                                {resposta.usuario.nome}
                              </span>
                              <span className="text-[9px] text-gray-400 dark:text-zinc-600">
                                {formatMsgTime(resposta.created_at)}
                              </span>
                            </div>
                            {canDeleteResposta && (
                              <button
                                onClick={() => onRemoverResposta(duvida.id, resposta.id)}
                                className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1 ml-8 leading-relaxed whitespace-pre-wrap">
                            {resposta.conteudo}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Responder */}
                {(user?.role === "ADMIN" || user?.role === "GESTOR") && (
                <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-3">
                  {respondendoDuvida === duvida.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={respostaConteudo}
                        onChange={(e) => onRespostaConteudoChange(e.target.value)}
                        placeholder="Escreva a sua resposta..."
                        className="rounded-xl text-sm resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => onEnviarResposta(duvida.id)}
                          disabled={!respostaConteudo.trim() || isSendingAnswer}
                          size="sm"
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold"
                        >
                          {isSendingAnswer ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Responder
                        </Button>
                        <Button
                          onClick={() => onResponderDuvida(duvida.id)}
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => onResponderDuvida(duvida.id)}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                    >
                      Responder
                    </button>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </ScrollArea>
  );
}
