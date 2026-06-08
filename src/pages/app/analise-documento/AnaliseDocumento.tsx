import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Upload, Loader2, Clock, CheckCircle, XCircle, AlertCircle, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/api/useGetProfile";
import { analiseDocumentoApi } from "@/api/analise-documento";
import toast from "react-hot-toast";

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  PENDENTE: { label: "Pendente", class: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: <Clock size={14} /> },
  EM_ANALISE: { label: "Em Análise", class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: <AlertCircle size={14} /> },
  CONCLUIDO: { label: "Concluído", class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <CheckCircle size={14} /> },
  REJEITADO: { label: "Rejeitado", class: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400", icon: <XCircle size={14} /> },
};

export function AnaliseDocumentoPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [areaPretendida, setAreaPretendida] = useState("");
  const [observacao, setObservacao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const { data: analises = [], isLoading } = useQuery({
    queryKey: ["minhas-analises"],
    queryFn: analiseDocumentoApi.listarMinhas,
  });

  const criarMutation = useMutation({
    mutationFn: analiseDocumentoApi.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minhas-analises"] });
      toast.success("Pedido de análise enviado com sucesso!");
      setShowForm(false);
      setNome(user?.nome || "");
      setEmail(user?.email || "");
      setTelefone("");
      setTipoDocumento("");
      setAreaPretendida("");
      setObservacao("");
      setArquivo(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao enviar pedido");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !tipoDocumento || !areaPretendida.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!arquivo) {
      toast.error("Selecione um documento para enviar");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("email", email);
    formData.append("tipoDocumento", tipoDocumento);
    formData.append("areaPretendida", areaPretendida);
    if (telefone) formData.append("telefone", telefone);
    if (observacao) formData.append("observacao", observacao);
    formData.append("arquivo", arquivo);

    criarMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white mb-4">
            Análise de Documentos
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
            Submeta o seu documento para correção e análise pela nossa equipa.
          </p>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Upload className="h-4 w-4" />
            {showForm ? "Cancelar" : "Submeter Documento"}
          </Button>
        </motion.div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto mb-12 p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Novo Pedido de Análise
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Email *</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu email" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Seu telefone" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Tipo de Documento *</Label>
                <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CV">Currículo (CV)</SelectItem>
                    <SelectItem value="CARTA_MOTIVACAO">Carta de Motivação</SelectItem>
                    <SelectItem value="CERTIFICADO">Certificado</SelectItem>
                    <SelectItem value="OUTRO">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Área Pretendida *</Label>
                <Input
                  value={areaPretendida}
                  onChange={(e) => setAreaPretendida(e.target.value)}
                  placeholder="Ex: Medicina, Engenharia Informática, Bolsa Erasmus..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Documento *</Label>
                <div className="mt-1">
                  <Label
                    htmlFor="arquivo-upload"
                    className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                  >
                    <FileUp size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-zinc-400">
                      {arquivo ? arquivo.name : "Clique para selecionar o documento"}
                    </span>
                  </Label>
                  <input
                    id="arquivo-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Observação</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <Button type="submit" disabled={criarMutation.isPending} className="w-full gap-2">
                {criarMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {criarMutation.isPending ? "A enviar..." : "Enviar para Análise"}
              </Button>
            </div>
          </motion.form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : analises.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
            <p className="text-gray-500 dark:text-zinc-500">Nenhum pedido de análise encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analises.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {a.tipoDocumento === "CV" ? "Currículo (CV)" :
                         a.tipoDocumento === "CARTA_MOTIVACAO" ? "Carta de Motivação" :
                         a.tipoDocumento === "CERTIFICADO" ? "Certificado" : a.tipoDocumento}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[a.status]?.class}`}>
                        {statusConfig[a.status]?.icon}
                        {statusConfig[a.status]?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">
                      <span className="font-medium text-gray-700 dark:text-zinc-300">Área:</span> {a.areaPretendida}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {new Date(a.created_at).toLocaleDateString("pt-PT")}
                    </p>
                    {a.feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Feedback:</p>
                        <p className="text-sm text-gray-700 dark:text-zinc-300">{a.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnaliseDocumentoPage;
