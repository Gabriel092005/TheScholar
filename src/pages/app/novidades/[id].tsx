import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, FileText, Download, Loader2, User,
  CheckCircle2, Send, AlertTriangle, CreditCard, Upload, X, Plus, ImageOff, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { novidadesApi } from "@/api/novidades";
import { api } from "@/lib/axios";
import { ExpressIcon, MulticaixaIcon, PayPalIcon } from "@/components/payment-icons";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function NovidadeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inscricaoNome, setInscricaoNome] = useState("");
  const [inscricaoEmail, setInscricaoEmail] = useState("");
  const [inscricaoTelefone, setInscricaoTelefone] = useState("");
  const [inscricaoObs, setInscricaoObs] = useState("");
  const [inscricaoSucesso, setInscricaoSucesso] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState("EXPRESS");
  const [referenciaPagamento, setReferenciaPagamento] = useState("");
  const [comprovativo, setComprovativo] = useState<File | null>(null);
  const [documentos, setDocumentos] = useState<{ nome: string; file: File | null }[]>([]);

  const isDemoToken = Cookies.get("token")?.startsWith("demo.");

  const { data: apiNovidade } = useQuery({
    queryKey: ["novidade", id],
    queryFn: () => novidadesApi.get(id!),
    enabled: !!id,
    retry: false,
  });

  const inscricaoMutation = useMutation({
    mutationFn: () => {
      const payload = new FormData();
      payload.append("nome", inscricaoNome);
      payload.append("email", inscricaoEmail);
      if (inscricaoTelefone) payload.append("telefone", inscricaoTelefone);
      if (inscricaoObs) payload.append("observacao", inscricaoObs);
      payload.append("metodoPagamento", metodoPagamento);
      if (referenciaPagamento) payload.append("referenciaPagamento", referenciaPagamento);
      if (comprovativo) payload.append("comprovativo", comprovativo);
      documentos.forEach((doc) => {
        if (doc.file) {
          payload.append("docNome", doc.nome);
          payload.append("docFile", doc.file);
        }
      });
      return novidadesApi.inscrever(id!, payload);
    },
    onSuccess: () => {
      setInscricaoSucesso(true);
      toast.success("Inscrição realizada com sucesso!");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err.message || "Erro ao inscrever-se";
      toast.error(message);
    },
  });

  const novidade = apiNovidade || null;

  if (!novidade) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111113] flex items-center justify-center">
        <div className="text-center">

          <h2 className="text-xl font-medium text-gray-900 dark:text-white">Novidade não encontrada</h2>
          <Button onClick={() => navigate("/novidades")} className="mt-4 dark:text-white">
            Voltar às Novidades
          </Button>
        </div>
      </div>
    );
  }

  const gradientFrom = novidade.destaque ? "from-amber-100" : "from-emerald-100";
  const gradientTo = novidade.destaque ? "to-amber-50" : "to-teal-50";
  const gradientDarkFrom = novidade.destaque ? "dark:from-amber-950/30" : "dark:from-emerald-950/30";
  const gradientDarkTo = novidade.destaque ? "dark:to-amber-950/20" : "dark:to-teal-950/20";
  const coverUrl = novidade.image_url
    ? novidade.image_url
    : novidade.image_path
    ? `${api.defaults.baseURL}/uploads/${novidade.image_path}`
    : null;

  const galleryMedia = (novidade.anexos || []).filter(
    (a) => a.file !== novidade.image_path && (a.type === "image" || a.type === "video")
  );

  return (
    <div className="bg-white dark:bg-[#111113]">
      {/* Cover image (only images, never video) */}
      {coverUrl ? (
        <div className="h-48 sm:h-64 overflow-hidden">
          <img
            src={coverUrl}
            alt={novidade.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.className =
                `h-48 sm:h-64 bg-gradient-to-br ${gradientFrom} ${gradientTo} ${gradientDarkFrom} ${gradientDarkTo} flex items-center justify-center`;
            }}
          />
        </div>
      ) : (
        <div className={`h-48 sm:h-64 bg-gradient-to-br ${gradientFrom} ${gradientTo} ${gradientDarkFrom} ${gradientDarkTo} flex items-center justify-center`}>
          <ImageOff size={40} className="text-gray-400 dark:text-zinc-600" />
        </div>
      )}

      {/* Media gallery (images + videos excluding cover) */}
      {galleryMedia.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryMedia.map((media) => {
              const mediaUrl = `${api.defaults.baseURL}/uploads/${media.file}`;
              return (
                <div
                  key={media.id}
                  className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 dark:bg-white/[0.04] group"
                >
                  {media.type === "video" ? (
                    <video
                      src={mediaUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    >
                      Seu navegador não suporta vídeo.
                    </video>
                  ) : (
                    <img
                      src={mediaUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate("/novidades")}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Todas as Novidades
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3 mb-4">
            {novidade.destaque && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20">
                Destaque
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1.5">
              <Calendar size={12} />
              {formatDate(novidade.created_at)}
            </span>
            {novidade.usuario && (
              <span className="text-xs text-gray-400 dark:text-zinc-600 flex items-center gap-1.5">
                <User size={12} />
                {novidade.usuario.nome}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            {novidade.title}
          </h1>

          {novidade.introduction && (
            <p className="text-lg text-gray-500 dark:text-zinc-400 mt-3 leading-relaxed font-light">
              {novidade.introduction}
            </p>
          )}

          <div className="mt-8 border-t border-gray-100 dark:border-white/[0.06] pt-8">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {novidade.description.split("\n").map((paragraph, i) => (
                <p key={i} className="text-gray-700 dark:text-zinc-300 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {novidade.temInscricao && (
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Send size={14} className="text-emerald-500" />
                Inscreva-se
              </h2>

              {inscricaoSucesso ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-6 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    Inscrição realizada com sucesso!
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    Entraremos em contacto consigo em breve.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-5 border border-gray-100 dark:border-white/[0.06]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-zinc-400">Nome Completo *</Label>
                      <Input
                        value={inscricaoNome}
                        onChange={(e) => setInscricaoNome(e.target.value)}
                        placeholder="Seu nome"
                        className="h-10 rounded-xl bg-white dark:bg-transparent text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-zinc-400">E-mail *</Label>
                      <Input
                        type="email"
                        value={inscricaoEmail}
                        onChange={(e) => setInscricaoEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="h-10 rounded-xl bg-white dark:bg-transparent text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-zinc-400">Telefone</Label>
                      <Input
                        value={inscricaoTelefone}
                        onChange={(e) => setInscricaoTelefone(e.target.value)}
                        placeholder="+244 999 999 999"
                        className="h-10 rounded-xl bg-white dark:bg-transparent text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-600 dark:text-zinc-400">Observação</Label>
                      <Textarea
                        value={inscricaoObs}
                        onChange={(e) => setInscricaoObs(e.target.value)}
                        placeholder="Alguma dúvida ou informação adicional..."
                        className="min-h-[80px] rounded-xl bg-white dark:bg-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="mb-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                      <FileText size={12} />
                      Documentos
                    </h3>
                    <div className="space-y-2">
                      {documentos.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={doc.nome}
                            onChange={(e) => {
                              const updated = [...documentos];
                              updated[i] = { ...updated[i], nome: e.target.value };
                              setDocumentos(updated);
                            }}
                            placeholder="Ex: BI, Passaporte, Currículo..."
                            className="h-10 rounded-xl bg-white dark:bg-transparent text-sm flex-1"
                          />
                          <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-white dark:bg-transparent border border-dashed border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-emerald-400 transition-colors shrink-0">
                            <Upload size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-400 truncate max-w-[80px]">
                              {doc.file ? doc.file.name : "Ficheiro"}
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => {
                                const updated = [...documentos];
                                updated[i] = { ...updated[i], file: e.target.files?.[0] || null };
                                setDocumentos(updated);
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setDocumentos(documentos.filter((_, j) => j !== i))}
                            className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDocumentos([...documentos, { nome: "", file: null }])}
                        className="flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] text-xs text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors w-full"
                      >
                        <Plus size={14} />
                        Adicionar documento
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
                      <CreditCard size={12} />
                      Pagamento
                    </h3>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { value: "EXPRESS", label: "Express", icon: ExpressIcon },
                        { value: "TRANSFERENCIA", label: "Transferência", icon: () => <CreditCard className="w-[34px] h-[34px] text-gray-600 dark:text-zinc-400" /> },
                        { value: "MULTICAIXA", label: "Multicaixa", icon: MulticaixaIcon },
                        { value: "PAYPAL", label: "PayPal", icon: PayPalIcon },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setMetodoPagamento(method.value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            metodoPagamento === method.value
                              ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm"
                              : "border-gray-200 dark:border-white/[0.08] hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
                          }`}
                        >
                          <method.icon className={`w-[34px] h-[34px] shrink-0 ${metodoPagamento === method.value ? "scale-105" : "opacity-80"}`} />
                          <span className={`text-[9px] font-bold text-center leading-tight ${
                            metodoPagamento === method.value
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-zinc-400"
                          }`}>
                            {method.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3 mb-3">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-1">
                        Pagamento via {metodoPagamento === "EXPRESS" ? "Express" : metodoPagamento === "TRANSFERENCIA" ? "Transferência Bancária" : metodoPagamento === "MULTICAIXA" ? "Multicaixa" : "PayPal"}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                        {metodoPagamento === "EXPRESS"
                          ? "Faça o pagamento para o número 923 456 789 (Express). Insira a referência após o pagamento."
                          : metodoPagamento === "TRANSFERENCIA"
                          ? "IBAN: AO06 0040 0000 1234 5678 9012 3. Envie o comprovativo após a transferência."
                          : metodoPagamento === "MULTICAIXA"
                          ? "Pague no Multicaixa com o código 12345. Insira a referência após o pagamento."
                          : "Será redirecionado para o PayPal para concluir o pagamento."}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">Referência</Label>
                        <Input
                          value={referenciaPagamento}
                          onChange={(e) => setReferenciaPagamento(e.target.value)}
                          placeholder="Código da transação"
                          className="h-10 rounded-xl bg-white dark:bg-transparent text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">Comprovativo</Label>
                        <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-white dark:bg-transparent border border-dashed border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-emerald-400 transition-colors">
                          <Upload size={14} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-400 truncate">
                            {comprovativo ? comprovativo.name : "Upload"}
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setComprovativo(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {isDemoToken && (
                    <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl px-4 py-3 mb-4">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        Modo demonstração ativo. Faça login para se inscrever.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      if (isDemoToken) {
                        toast.error("Faça login com uma conta real para se inscrever");
                        return;
                      }
                      if (!inscricaoNome.trim() || !inscricaoEmail.trim()) {
                        toast.error("Preencha nome e e-mail");
                        return;
                      }
                      inscricaoMutation.mutate();
                    }}
                    disabled={inscricaoMutation.isPending}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-6 shadow-lg shadow-emerald-600/25"
                  >
                    {inscricaoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {metodoPagamento === "PAYPAL" ? "Pagar com PayPal" : "Pagar e Inscrever-se"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {novidade.anexos && novidade.anexos.length > 0 && (
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={14} className="text-emerald-500" />
                Ficheiros ({novidade.anexos.length})
              </h2>
              <div className="space-y-2">
                {novidade.anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors group cursor-default"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                      {anexo.type === "video" ? (
                        <Video size={15} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <FileText size={15} className="text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-zinc-300 flex-1 truncate font-medium">
                      {anexo.file}
                    </span>
                    <Download size={14} className="text-gray-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/[0.06]">
            <Button
              variant="outline"
              onClick={() => navigate("/novidades")}
              className="rounded-xl h-11 px-6 dark:text-white dark:border-white/20"
            >
              <ArrowLeft size={14} className="mr-2" />
              Voltar às Novidades
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default NovidadeDetailPage;