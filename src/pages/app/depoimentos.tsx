import { useState, useEffect } from "react";
import { Quote, Loader2, MessageCircle, Send } from "lucide-react";
import { CardAccent, RatingStars, Reveal, UserPageHeader, iconTile, userCard } from "@/components/user-ui";
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
        <RatingStars count={count} />
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <UserPageHeader
          icon={MessageCircle}
          title="Depoimentos"
          description="Veja o que os nossos alunos dizem sobre as suas experiências de aprendizagem."
          action={
            <Button onClick={() => setShowForm(!showForm)} className="gap-2 rounded-xl">
              <Send className="h-4 w-4" />
              {showForm ? "Cancelar" : "Deixar depoimento"}
            </Button>
          }
        />

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
              <Reveal key={d.id} index={i}>
                <div className={`${userCard} flex h-full flex-col p-6`}>
                  <CardAccent />
                  <Quote className="absolute top-4 right-4 h-7 w-7 text-emerald-200 dark:text-emerald-800/40 transition-all duration-300 group-hover:scale-110 group-hover:text-emerald-300" />
                  <div className="flex items-center gap-3 mb-4 pr-8">
                    <div className={`${iconTile} text-sm font-bold`}>
                      {d.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 dark:text-white">{d.nome}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{d.curso}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed mb-4">
                    &ldquo;{d.texto}&rdquo;
                  </p>
                  <div className="mt-auto">
                    <Stars count={d.rating} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
