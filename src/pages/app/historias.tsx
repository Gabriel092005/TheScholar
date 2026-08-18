import { useState, useEffect } from "react";
import { Quote, Loader2, Send, BookHeart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { depoimentosApi, type Depoimento } from "@/api/depoimentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api, getUploadUrl } from "@/lib/axios";
import { useUser } from "@/api/useGetProfile";
import { useNavigate } from "react-router-dom";
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

export function HistoriasPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [stories, setStories] = useState<Depoimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [curso, setCurso] = useState("");
  const [texto, setTexto] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const data = await depoimentosApi.list();
      setStories(data);
    } catch {
      toast.error("Erro ao carregar histórias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curso.trim() || !texto.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      setSubmitting(true);
      await depoimentosApi.create({ nome: user?.nome || "Anónimo", curso, texto, rating });
      toast.success("História enviada para aprovação!");
      setCurso("");
      setTexto("");
      setRating(5);
      setShowForm(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Erro ao enviar história";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const userAvatarSrc = user?.image_path ? getUploadUrl(`/uploads/${user.image_path}`) : "";
  const userInitials = user?.nome?.substring(0, 2).toUpperCase() || "U";

  const featured = stories[0];
  const remaining = stories.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 dark:from-[#0a1a14] dark:via-[#0d1f18] dark:to-[#0a1512]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-300 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium mb-6">
              Histórias de Alunos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-4">
              Histórias que{" "}
              <span className="text-emerald-300">inspiram</span>
            </h1>
            <p className="text-emerald-100/80 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
              Conheça as trajetórias de estudantes angolanos que transformaram os seus sonhos em realidade.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                size="lg"
                onClick={() => setShowForm(!showForm)}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-semibold gap-2 rounded-xl"
              >
                <Send className="h-4 w-4" />
                {showForm ? "Cancelar" : "Compartilhar a minha história"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  const el = document.getElementById("historias-lista");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="border-white/20 text-white hover:bg-white/10 gap-2 rounded-xl"
              >
                Ver histórias
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Submit form */}
      {showForm && (
        <section className="border-b border-gray-100 dark:border-white/[0.06]">
          <div className="max-w-xl mx-auto px-4 py-12">
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BookHeart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Partilhe a sua história
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    A sua história pode inspirar outros estudantes
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400">A contar como</Label>
                  <div className="mt-1 flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700">
                    <Avatar className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700">
                      <AvatarImage src={userAvatarSrc} className="object-cover" />
                      <AvatarFallback className="bg-emerald-500 text-white text-xs font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.nome || "Anónimo"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                  </div>
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
                  <Label className="text-sm text-gray-600 dark:text-zinc-400">A sua história *</Label>
                  <Textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Conte-nos como foi a sua jornada, os desafios que enfrentou e como conseguiu alcançar os seus objetivos..."
                    className="mt-1 min-h-[140px]"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "A enviar..." : "Enviar história"}
                </Button>
              </div>
            </motion.form>
          </div>
        </section>
      )}

      {/* Stories list */}
      <section id="historias-lista" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <BookHeart className="h-12 w-12 mx-auto text-gray-300 dark:text-zinc-600 mb-4" />
            <p className="text-gray-400 dark:text-zinc-500 text-lg">
              Nenhuma história disponível. Seja o primeiro a compartilhar a sua jornada!
            </p>
          </div>
        ) : (
          <>
            {/* Featured story */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-12 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/30 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/20 dark:bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-4">
                    História em destaque
                  </div>
                  <div className="flex items-start gap-5 flex-col sm:flex-row">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl shrink-0">
                      {featured.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {featured.nome}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-zinc-400">
                          — {featured.curso}
                        </span>
                      </div>
                      <div className="mt-1 mb-3">
                        <Stars count={featured.rating} />
                      </div>
                      <p className="text-gray-700 dark:text-zinc-300 text-base leading-relaxed italic">
                        &ldquo;{featured.texto}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Remaining stories */}
            {remaining.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {remaining.map((story, i) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="group relative p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] hover:border-emerald-200 dark:hover:border-emerald-800/30 hover:shadow-lg dark:hover:shadow-emerald-900/5 transition-all duration-300"
                  >
                    <Quote className="absolute top-4 right-4 h-6 w-6 text-emerald-200 dark:text-emerald-800/30 group-hover:text-emerald-300 dark:group-hover:text-emerald-700/50 transition-colors" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                        {story.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {story.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                          {story.curso}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed mb-3 italic line-clamp-4">
                      &ldquo;{story.texto}&rdquo;
                    </p>
                    <Stars count={story.rating} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <BookHeart className="h-10 w-10 mx-auto text-emerald-500 mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            A sua história pode inspirar alguém
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-6 max-w-lg mx-auto">
            Milhares de estudantes angolanos estão à procura de referências. Partilhe a sua jornada e motive outros a seguir o mesmo caminho.
          </p>
          <Button
            size="lg"
            onClick={() => setShowForm(true)}
            className="gap-2 rounded-xl"
          >
            <Send className="h-4 w-4" />
            Compartilhar história
          </Button>
        </div>
      </section>
    </div>
  );
}
