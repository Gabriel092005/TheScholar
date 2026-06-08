import { useState, useEffect } from "react";
import { Quote, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { depoimentosApi, type Depoimento } from "@/api/depoimentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

function Stars({ count, interactive, onChange }: { count: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {interactive ? (
        <select
          value={count}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className="text-sm border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      ) : (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{count}/5</span>
      )}
    </div>
  );
}

export function DepoimentosPage() {
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState("");
  const [curso, setCurso] = useState("");
  const [texto, setTexto] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchDepoimentos = async () => {
    try {
      setLoading(true);
      const data = await depoimentosApi.list();
      setDepoimentos(data);
    } catch {
      toast.error("Erro ao carregar depoimentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepoimentos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !curso.trim() || !texto.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      setSubmitting(true);
      await depoimentosApi.create({ nome, curso, texto, rating });
      toast.success("Depoimento enviado para aprovação!");
      setNome("");
      setCurso("");
      setTexto("");
      setRating(5);
      setShowForm(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Erro ao enviar depoimento";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
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
            Depoimentos
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto mb-8">
            Veja o que os nossos alunos dizem sobre as suas experiências de aprendizagem.
          </p>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Send className="h-4 w-4" />
            {showForm ? "Cancelar" : "Deixar depoimento"}
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
              Partilhe a sua experiência
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Nome *</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Curso *</Label>
                <Input
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Nome do curso que realizou"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Avaliação</Label>
                <Stars count={rating} interactive onChange={setRating} />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Depoimento *</Label>
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Conte-nos sobre a sua experiência..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "A enviar..." : "Enviar depoimento"}
              </Button>
            </div>
          </motion.form>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : depoimentos.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-zinc-500 py-20">
            Nenhum depoimento disponível. Seja o primeiro a partilhar a sua experiência!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {depoimentos.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-emerald-200 dark:text-emerald-800/40" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    {d.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{d.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">{d.curso}</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed mb-4 italic">
                  &ldquo;{d.texto}&rdquo;
                </p>
                <Stars count={d.rating} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
