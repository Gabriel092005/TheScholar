import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, Search, BookOpenText, Target,
  ChevronDown, Users, Award,
  Heart, HelpCircle, UserCheck, Zap,
  TrendingUp, Filter, Quote, Image as ImageIcon, Pencil, BookHeart, Globe,
  GraduationCap, FileText, Plane, Landmark, Briefcase, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { bolsasApi } from "@/api/bolsas";
import { useUser } from "@/api/useGetProfile";
import { depoimentosApi, type Depoimento } from "@/api/depoimentos";
import { mapaGlobalApi, type MapaGlobalItem } from "@/api/mapa-global";
import { MapaGlobal } from "@/components/mapa-global/MapaGlobal";
import { novidadesApi } from "@/api/novidades";
import { api, getUploadUrl } from "@/lib/axios";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

import img1 from "@/assets/WhatsApp Image 2026-04-06 512.26.31.jpeg";
import img2 from "@/assets/CORRECTA.jpeg";
import img3 from "@/assets/WhatsApp Image 2026-04-06 at 12.26.32.jpeg";
import { homeBannersApi } from "@/api/home-banners";

function formataData(data?: string): string {
  if (!data) return "";
  try {
    return format(parseISO(data), "dd 'de' MMM 'de' yyyy", { locale: pt });
  } catch {
    return data;
  }
}

function getNivelLabel(nivel?: string): string {
  if (!nivel) return "Graduação";
  const map: Record<string, string> = {
    GRADUACAO: "Graduação",
    MESTRADO: "Mestrado",
    DOUTORAMENTO: "Doutoramento",
    POSDOC: "Pós-Doutorado",
    MBA: "MBA",
  };
  return map[nivel] || nivel;
}

const fallbackImages = [img1, img2, img3];

const stats = [
  { icon: Users,        label: "Utilizadores Ativos",  value: 12500, suffix: "+" },
  { icon: Award,        label: "Bolsas Conquistadas",  value: 380,   suffix: ""  },
  { icon: BookOpenText, label: "Preparação Pessoal", value: 45,    suffix: ""  },
  { icon: Target,       label: "Taxa de Sucesso",      value: 92,    suffix: "%" },
];

const footerLinks = [
  { title: "Plataforma", links: ["Bolsas", "Mentorias", "Preparação Pessoal", "Preços"]          },
  { title: "Empresa",    links: ["Sobre Nós", "Carreiras", "Parceiros", "Blog"]       },
  { title: "Suporte",    links: ["FAQ", "Contacto", "Privacidade", "Termos"]          },
  { title: "Siga-nos",   links: ["Instagram", "LinkedIn", "Facebook", "YouTube"]      },
];

/* ─── Animation variants ────────────────────────────────── */

const fade = (delay = 0) => ({
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay } },
});

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ─── DynamicCounter ────────────────────────────────────── */

function DynamicCounter({ to, duration = 2.2 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const steps = 60;
    const increment = to / steps;
    const interval = (duration * 1000) / steps;
    const timer = setInterval(() => {
      start = Math.min(start + increment, to);
      setCount(Math.round(start));
      if (start >= to) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [inView, to, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-PT")}</span>;
}

/* ─── HomePage ──────────────────────────────────────────── */

function NovidadesHomeSection() {
  const navigate = useNavigate();

  const { data: apiNovidades = [] } = useQuery({
    queryKey: ["novidades-home"],
    queryFn: () => novidadesApi.list({ status: "PUBLICADO" }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const novidades = apiNovidades;
  const destaques = novidades.filter((n) => n.destaque).slice(0, 3);
  const recentes = novidades.slice(0, 3);

  return (
    <section className="bg-gray-50 dark:bg-[#111113] border-y border-gray-100 dark:border-white/[0.05] py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
              Novidades & Destaques
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Últimas <span className="text-emerald-600 dark:text-emerald-400">Novidades</span>
            </h2>
            <p className="text-gray-400 dark:text-zinc-500 mt-2 text-sm">
              Fique por dentro de tudo o que acontece na Afroscholars.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              variant="outline"
              onClick={() => navigate("/novidades")}
              className="h-10 px-6 text-sm rounded-xl border-gray-200 dark:border-white/[0.1] hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 transition-all duration-200"
            >
              Ver todas
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </motion.div>

        {destaques.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {destaques.map((novidade, i) => {
              const gradients = [
                "from-amber-500 to-orange-500",
                "from-emerald-500 to-teal-500",
                "from-violet-500 to-purple-500",
              ];
              const g = gradients[i % gradients.length];
              return (
                <motion.div
                  key={novidade.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => navigate(`/novidades/${novidade.id}`)}
                  className="group relative flex flex-col rounded-2xl cursor-pointer border border-amber-200/50 dark:border-amber-500/20 bg-white dark:bg-[#111113] hover:shadow-lg hover:shadow-amber-200/30 dark:hover:shadow-amber-950/30 transition-all duration-300 overflow-hidden"
                >
                  {(() => {
                      const imgUrl = novidade.image_url || (novidade.image_path ? getUploadUrl(`/uploads/${novidade.image_path}`) : null);
                      return imgUrl ? (
                        <div className="h-36 overflow-hidden">
                          <img src={imgUrl} alt={novidade.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      ) : (
                        <div className={`h-24 bg-gradient-to-br ${g} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/10" />
                        </div>
                      );
                    })()}
                  <div className="p-5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3">
                      Em Destaque
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {novidade.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {novidade.introduction}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {recentes.map((novidade, i) => {
            const gradients = [
              "from-emerald-500 to-teal-500",
              "from-sky-500 to-indigo-500",
              "from-amber-500 to-orange-500",
              "from-rose-500 to-pink-500",
              "from-violet-500 to-purple-500",
              "from-cyan-500 to-blue-500",
            ];
            const g = gradients[i % gradients.length];
            return (
              <motion.div
                key={novidade.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -5, transition: { duration: 0.22, ease: "easeOut" } }}
                onClick={() => navigate(`/novidades/${novidade.id}`)}
                className="group relative flex flex-col rounded-2xl cursor-pointer border border-gray-100 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50 dark:bg-white/[0.02] dark:border-white/[0.06] dark:hover:border-emerald-500/30 dark:hover:shadow-none transition-all duration-300 overflow-hidden"
              >
                {(() => {
                      const imgUrl = novidade.image_url || (novidade.image_path ? getUploadUrl(`/uploads/${novidade.image_path}`) : null);
                      return imgUrl ? (
                        <div className="h-36 overflow-hidden">
                          <img src={imgUrl} alt={novidade.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        </div>
                      ) : (
                        <div className={`h-32 bg-gradient-to-br ${g} relative overflow-hidden`}>
                          <div className="absolute inset-0 bg-black/10" />
                        </div>
                      );
                    })()}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-sm sm:text-base font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                    {novidade.title}
                  </h3>
                  <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1.5 line-clamp-2 leading-relaxed flex-1">
                    {novidade.introduction}
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-zinc-600">
                      {new Date(novidade.created_at).toLocaleDateString("pt-PT")}
                    </span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/[0.06] group-hover:bg-emerald-500 transition-all duration-200">
                      <ArrowRight className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DepoimentosHome() {
  const navigate = useNavigate();
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);

  useEffect(() => {
    depoimentosApi.list().then(setDepoimentos).catch(() => {});
  }, []);

  if (depoimentos.length === 0) return null;

  return (
    <section className="bg-white dark:bg-[#111113] py-20 sm:py-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full
              border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10
              text-[11px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
              Depoimentos
            </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
            O que dizem os nossos alunos
          </h2>
          <p className="text-gray-400 dark:text-zinc-500 mt-3 text-sm max-w-xl mx-auto">
            Histórias reais de angolanos que transformaram as suas vidas através da educação.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {depoimentos.slice(0, 6).map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
            >
              <Quote className="absolute top-3 right-3 h-6 w-6 text-emerald-200 dark:text-emerald-800/40" />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {d.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{d.nome}</p>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500">{d.curso}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed italic line-clamp-3">
                &ldquo;{d.texto}&rdquo;
              </p>
              <div className="mt-3">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{d.rating}/5</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate("/historias")}
              className="rounded-full text-sm gap-2"
            >
              <BookHeart className="h-4 w-4" />
              Histórias de Alunos
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/depoimentos")}
              className="rounded-full text-sm"
            >
              Ver todos os depoimentos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MapaGlobalSection() {
  const { data: items = [] } = useQuery({
    queryKey: ["mapa-global"],
    queryFn: mapaGlobalApi.list,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <MapaGlobal items={items} />
    </div>
  );
}

const futuroEtapas = [
  { icon: GraduationCap, label: "Estudante", desc: "Crie o seu perfil e descubra oportunidades" },
  { icon: FileText, label: "Candidatura", desc: "Candidate-se às melhores bolsas de estudo" },
  { icon: Plane, label: "Viagem", desc: "Prepare a sua ida para o destino escolhido" },
  { icon: Landmark, label: "Universidade", desc: "Estude numa instituição de renome" },
  { icon: Briefcase, label: "Carreira", desc: "Construa um futuro profissional brilhante" },
];

function SeuFuturoSection() {
  return (
    <section className="bg-gray-50 dark:bg-[#111113] py-20 sm:py-28 overflow-x-hidden border-y border-gray-100 dark:border-white/[0.06]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <Target className="h-3.5 w-3.5" />
            O Seu Futuro
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-4">
            O seu caminho começa aqui
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Da descoberta à realização — acompanhe cada etapa da sua jornada académica internacional.
          </p>
        </motion.div>

        <div className="relative">
          {/* Desktop connecting line through step badges */}
          <div className="hidden md:block absolute top-[84px] left-[10%] right-[10%] h-0.5 bg-emerald-300 dark:bg-emerald-700 z-0" />

          <div className="flex flex-col md:grid md:grid-cols-5 gap-5 md:gap-0">
            {futuroEtapas.map((etapa, i) => (
              <motion.div
                key={etapa.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex md:flex-col items-center md:text-center gap-4 md:gap-0"
              >
                <div className="relative flex-shrink-0 md:mb-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shadow-sm border border-emerald-200 dark:border-emerald-800/20">
                    <etapa.icon className="h-6 w-6 md:h-7 md:w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="hidden md:flex absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-500 text-white text-[11px] font-bold items-center justify-center shadow-md z-10 ring-[3px] ring-white dark:ring-[#111113]">
                    {i + 1}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg">
                    {etapa.label}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400 mt-0.5 md:mt-1 leading-relaxed">
                    {etapa.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const heroRef = useRef(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const { data: bannersData } = useQuery({
    queryKey: ["home-banners"],
    queryFn: homeBannersApi.list,
    staleTime: 1000 * 60 * 5,
  });
  const bannersList = bannersData?.data || [];
  const momentsImages = bannersList.length > 0
    ? bannersList.map((b) =>
        b.imageUrl.startsWith("http")
          ? b.imageUrl
          : getUploadUrl(b.imageUrl)
      )
    : fallbackImages;

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % momentsImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [momentsImages.length]);

  const { data: destaques, isLoading: destaquesLoading } = useQuery({
    queryKey: ["bolsas-destaques"],
    queryFn: bolsasApi.destaques,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="bg-background text-gray-900 dark:text-white">

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className={`relative w-full lg:pr-[10px] ${
          user ? "min-h-[50vh] sm:min-h-[70vh] lg:min-h-[90vh] lg:max-h-[900px]" : "min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] max-h-[900px]"
        }`}
      >
        {/* Background slideshow (decorative, no focus) */}
        {momentsImages.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-y-0 left-0 right-0 lg:right-[10px] bg-cover bg-center transition-opacity duration-1000 ${
              i === slideIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${src})` }}
            aria-hidden="true"
          />
        ))}
        <div className="absolute inset-y-0 left-0 right-0 lg:right-[10px] bg-gradient-to-br from-emerald-900/80 via-slate-900/70 to-gray-900/80" />
        <div className={`absolute inset-y-0 left-0 right-0 lg:right-[10px] ${
          user
            ? "bg-gradient-to-r from-white/30 to-transparent dark:from-black/30 dark:to-transparent"
            : "bg-gradient-to-r from-black/30 to-transparent"
        }`} />

        {/* Edit banners button (admin only) */}
        {user?.role === "ADMIN" && (
          <button
            onClick={() => navigate("/admin/banners")}
            className="absolute top-20 right-4 lg:right-[26px] z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-xs font-medium transition-all"
            title="Editar imagens de capa"
          >
            <Pencil size={14} />
            Editar Capa
          </button>
        )}

        {/* Content */}
      <motion.div
  className="
    relative z-10 flex flex-col justify-end min-h-full w-full
    pt-16 sm:pt-24
    pb-8 sm:pb-14 md:pb-20
    px-5 sm:px-8 md:px-16 lg:px-24
    max-w-7xl mx-auto
  "
>
  <motion.div variants={stagger} initial="hidden" animate="visible">

    {/* Badge */}
    <motion.span
      variants={fade(0)}
      className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full
        border border-emerald-500/30 bg-emerald-500/10
        text-[11px] font-semibold tracking-widest uppercase text-emerald-400"
    >
      {user ? `Bem-vindo de volta, ${user.nome.split(" ")[0]}!` : "Afroscholars"}
    </motion.span>

    {/* Heading — fonte reduzida para caber em telas pequenas */}
    <motion.h1
      variants={fade(0.05)}
      className="
        text-[1.5rem] leading-[1.1]
        sm:text-[2rem]
        md:text-[2.5rem]
        lg:text-[3.2rem]
        xl:text-[4rem]
        font-black tracking-tight max-w-5xl text-white
      "
    >
      {user ? (
        <span className="text-white">
          Continue{" "}
          <span className="text-white/60">explorando</span>{" "}
          o futuro que{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              você merece.
            </span>
            <motion.span
              aria-hidden
              className="
                pointer-events-none
                absolute left-0 -bottom-[0.12em]
                h-[0.045em] w-full rounded-full
                bg-gradient-to-r from-emerald-400/90 via-teal-300/60 to-transparent
                shadow-[0_0_18px_2px_rgba(52,211,153,0.35)]
              "
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                scaleX:  { delay: 1.1, duration: 1.0, ease: [0.16, 1, 0.3, 1] },
                opacity: { delay: 1.1, duration: 0.3 },
              }}
              style={{ originX: 0 }}
            />
          </span>
        </span>
      ) : (
        <>
          Sua carreira{" "}
          <span className="text-white/40">global</span>{" "}
          começa com a{" "}
          <span className="relative inline-block whitespace-nowrap">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              bolsa certa.
            </span>
            <motion.span
              aria-hidden
              className="
                pointer-events-none
                absolute left-0 -bottom-[0.12em]
                h-[0.045em] w-full rounded-full
                bg-gradient-to-r from-emerald-400/90 via-teal-300/60 to-transparent
                shadow-[0_0_18px_2px_rgba(52,211,153,0.35)]
              "
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                scaleX:  { delay: 1.1, duration: 1.0, ease: [0.16, 1, 0.3, 1] },
                opacity: { delay: 1.1, duration: 0.3 },
              }}
              style={{ originX: 0 }}
            />
          </span>
        </>
      )}
    </motion.h1>

    {/* Divider — margem menor para economizar espaço vertical */}
    <motion.div variants={fade(0.1)} className="w-10 h-px my-4 sm:my-5 bg-white/20" />

    {/* Subtitle + CTAs */}
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-8">
      <motion.p
        variants={fade(0.12)}
        className={`text-sm sm:text-base font-light leading-relaxed max-w-md text-white/70`}
      >
        {user
          ? "Continue explorando todas as oportunidades. Novas bolsas de estudos,estágios, intercâmbio , preparação pessoal para bolsas de estudo."
          : "Unimos tecnologia de ponta e mentoria especializada para conectar talentos angolanos às melhores oportunidades acadêmicas do mundo."}
      </motion.p>

      <motion.div
        variants={fade(0.15)}
        className="flex flex-col xs:flex-row flex-wrap gap-3 shrink-0"
      >
        <Button
          size="lg"
          onClick={() => {
            document.getElementById("oportunidades-destaque")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="h-11 sm:h-12 px-6 sm:px-8 text-sm font-bold group
            bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95
            rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200"
        >
          {user ? "Ver Oportunidades" : "Explorar Oportunidades"}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            if (user) {
              navigate("/mentorias");
            } else {
              navigate("/sign-in");
            }
          }}
          className="h-11 sm:h-12 px-6 sm:px-8 text-sm font-bold
            border-white/30 text-white bg-transparent hover:bg-white/15 active:scale-95
            backdrop-blur-sm rounded-xl transition-all duration-200"
        >
          {user ? "Ver Mentorias" : "Agendar Mentoria Grátis"}
        </Button>
      </motion.div>
    </div>

    {/* Stats strip */}
    <motion.div
      variants={fade(0.2)}
      className="mt-6 sm:mt-8 pt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10"
    >
      {[
        { value: "12.500+", label: "Utilizadores"        },
        { value: "380",     label: "Bolsas conquistadas" },
        { value: "92%",     label: "Taxa de sucesso"     },
      ].map((s) => (
        <div key={s.label}>
          <p className="text-base sm:text-lg font-black tracking-tight text-white">{s.value}</p>
          <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{s.label}</p>
        </div>
      ))}
    </motion.div>
  </motion.div>
</motion.div>
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-gray-600">Scroll</span>
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
           2. SEU FUTURO
      ══════════════════════════════════════════ */}
      <SeuFuturoSection />

      {/* ══════════════════════════════════════════
           3. MAPA GLOBAL
      ══════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#111113] py-20 sm:py-28 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Globe className="h-3.5 w-3.5" />
              Mapa Global
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-4">
              Alunos espalhados pelo mundo
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto">
              Conheça onde estão os nossos alunos aprovados e inspire-se com as suas trajetórias.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <MapaGlobalSection />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           4. STATS (animated counters)
      ══════════════════════════════════════════ */}
      <section className="border-y border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113]">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4
                  rounded-2xl p-4 sm:p-5
                  border border-gray-100 dark:border-white/[0.06]
                  bg-gray-50 dark:bg-white/[0.02]
                  hover:border-emerald-200 dark:hover:border-emerald-500/25
                  transition-colors duration-300"
              >
                <div className="rounded-xl p-2.5 shrink-0
                  bg-emerald-50 dark:bg-emerald-500/10
                  group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/15
                  transition-colors duration-300">
                  <stat.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                    <DynamicCounter to={stat.value} />
                    {stat.suffix}
                  </p>
                  <p className="text-[10px] sm:text-xs mt-1 uppercase tracking-wider text-gray-400 dark:text-zinc-600">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           5. OPORTUNIDADES
      ══════════════════════════════════════════ */}
      <section id="oportunidades-destaque" className="bg-white dark:bg-[#111113] py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                Seleção do mês
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Oportunidades em Destaque
              </h2>
              <p className="text-gray-400 dark:text-zinc-500 mt-2 text-sm">
                As bolsas mais relevantes, selecionadas para o seu perfil.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full md:max-w-xs"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <Input
                placeholder="Pesquisar país ou universidade..."
                className="pl-9 h-10 text-sm
                  bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400
                  dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-600
                  focus-visible:ring-emerald-500/40 rounded-xl transition-colors"
              />
            </motion.div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {destaquesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] animate-pulse">
                  <div className="flex justify-between items-center mb-4">
                    <div className="h-5 w-20 bg-gray-200 dark:bg-white/[0.08] rounded-lg" />
                    <div className="h-4 w-16 bg-gray-200 dark:bg-white/[0.08] rounded" />
                  </div>
                  <div className="h-5 w-full bg-gray-200 dark:bg-white/[0.08] rounded mb-2" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-white/[0.08] rounded mb-6" />
                  <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-white/[0.08] rounded" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-white/[0.08] rounded-xl" />
                  </div>
                </div>
              ))
            ) : destaques && destaques.length > 0 ? (
              destaques.slice(0, 4).map((bolsa, i) => (
                <motion.div
                  key={bolsa.id}
                  onClick={() => navigate(`/bolsas/${bolsa.id}`)}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -5, transition: { duration: 0.22, ease: "easeOut" } }}
                  className="group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 cursor-pointer
                    border border-gray-100 bg-white shadow-sm
                    hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50
                    dark:bg-white/[0.02] dark:border-white/[0.06]
                    dark:hover:border-emerald-500/30 dark:hover:shadow-none
                    transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0
                    group-hover:from-emerald-500/[0.03] group-hover:to-emerald-500/0
                    transition-all duration-500 rounded-2xl" />

                  <div className="relative">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg
                        bg-emerald-50 text-emerald-700
                        dark:bg-emerald-500/10 dark:text-emerald-400">
                        {getNivelLabel(bolsa.nivel)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-zinc-600">
                        Prazo: {formataData(bolsa.prazo)}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-semibold leading-snug
                      text-gray-900 dark:text-white
                      group-hover:text-emerald-600 dark:group-hover:text-emerald-400
                      transition-colors duration-200">
                      {bolsa.titulo}
                    </h3>
                    <p className="text-gray-400 dark:text-zinc-600 text-sm mt-1">{bolsa.pais || bolsa.instituicao}</p>
                  </div>

                  <div className="relative mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.06]
                    flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Ver Detalhes
                    </span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center
                      bg-gray-100 dark:bg-white/[0.06]
                      group-hover:bg-emerald-500 transition-all duration-200">
                      <ArrowRight className="h-3.5 w-3.5
                        text-gray-500 dark:text-zinc-400
                        group-hover:text-white group-hover:translate-x-0.5
                        transition-all duration-200" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-400 dark:text-zinc-500 text-sm py-10">
                Nenhuma bolsa em destaque no momento.
              </p>
            )}
          </div>

          {/* View all */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 text-center"
          >
            <Button
              variant="outline"
              onClick={() => navigate("/bolsas")}
              className="h-10 px-6 text-sm rounded-xl
                border-gray-200 dark:border-white/[0.1]
                hover:border-emerald-400 hover:text-emerald-600
                dark:hover:border-emerald-500/50 dark:hover:text-emerald-400
                transition-all duration-200"
            >
              Ver todas as bolsas
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           6. NOVIDADES & DESTAQUES
      ══════════════════════════════════════════ */}
      <NovidadesHomeSection />

      {/* ══════════════════════════════════════════
           7. MOMENTOS MARCANTES
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 dark:bg-[#111113]
        border-y border-gray-100 dark:border-white/[0.05] py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
                Histórias reais
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight
                text-gray-900 dark:text-white">
                Nossa história é feita de{" "}
                <span className="text-emerald-600 dark:text-emerald-400">conquistas</span> reais.
              </h2>
              <p className="text-gray-500 dark:text-zinc-400 mt-5 text-base sm:text-lg font-light leading-relaxed">
                De Luanda para o mundo. Cada imagem representa um ciclo de esforço,
                preparação e a alegria imensurável de um aluno angolano conquistando
                seu espaço nas universidades mais prestigiadas do globo.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[
                    "https://randomuser.me/api/portraits/men/32.jpg",
                    "https://randomuser.me/api/portraits/women/44.jpg",
                    "https://randomuser.me/api/portraits/men/75.jpg",
                  ].map((src, i) => (
                    <motion.img
                      key={i}
                      src={src}
                      alt=""
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                      className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-white dark:border-[#0d0d0d] object-cover"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400 dark:text-zinc-500 leading-snug">
                  Junte-se a centenas de alunos<br />aprovados no mundo todo.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="mt-8"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/historias")}
                  className="h-11 px-6 text-sm font-bold rounded-xl
                    bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95
                    shadow-md shadow-emerald-500/20 transition-all duration-200"
                >
                  Ver mais histórias
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Carousel side */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Decorative blur blob */}
              <div className="absolute -inset-4 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-3xl blur-2xl -z-10" />

              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {momentsImages.map((src, i) => (
                    <CarouselItem key={i}>
                      <div className="p-1">
                        <AspectRatio
                          ratio={16 / 10}
                          className="overflow-hidden rounded-2xl
                            border border-gray-200/70 dark:border-white/[0.06]
                            shadow-xl shadow-gray-200/60 dark:shadow-none"
                        >
                          <motion.img
                            src={src}
                            alt={`Momento marcante ${i + 1}`}
                            className="h-full w-full object-cover"
                            whileHover={{ scale: 1.04 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </AspectRatio>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-3
                  bg-white/90 dark:bg-black/60 backdrop-blur-sm
                  border-gray-200 dark:border-white/10
                  text-gray-700 dark:text-white
                  hover:bg-white dark:hover:bg-black/80 transition-all" />
                <CarouselNext className="right-3
                  bg-white/90 dark:bg-black/60 backdrop-blur-sm
                  border-gray-200 dark:border-white/10
                  text-gray-700 dark:text-white
                  hover:bg-white dark:hover:bg-black/80 transition-all" />
              </Carousel>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           8. OPORTUNIDADES PERSONALIZADAS
      ══════════════════════════════════════════ */}
      <section className="bg-white dark:bg-[#111113] py-20 sm:py-28 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/5 dark:bg-emerald-500/[0.03] rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/5 dark:bg-teal-500/[0.03] rounded-full blur-3xl -z-10" />

        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full
              border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10
              text-[11px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
              <Heart className="w-3.5 h-3.5" />
              Para Si
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Oportunidades feitas à sua medida
            </h2>
            <p className="text-gray-400 dark:text-zinc-500 mt-3 text-sm max-w-lg mx-auto">
              Descubra bolsas de estudo que combinam com a sua história e os seus sonhos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: UserCheck, title: "Perfil Completo", desc: "Crie o seu perfil académico e receba sugestões que se encaixam na sua formação e objectivos." },
              { icon: Zap, title: "Recomendações", desc: "Receba sugestões pensadas para si, com base no seu currículo e nas suas preferências." },
              { icon: TrendingUp, title: "Acompanhamento", desc: "Veja o seu progresso e descubra dicas para fortalecer a sua candidatura." },
              { icon: Filter, title: "Filtros Simples", desc: "Encontre oportunidades por país, universidade, nível académico e área de estudo." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.22, ease: "easeOut" } }}
                className="group relative rounded-2xl p-6 text-center
                  border border-gray-100 dark:border-white/[0.06]
                  bg-gray-50 dark:bg-white/[0.02]
                  hover:border-emerald-200 dark:hover:border-emerald-500/25
                  hover:shadow-md hover:shadow-emerald-50 dark:hover:shadow-none
                  transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                  bg-emerald-100 dark:bg-emerald-500/15
                  text-emerald-600 dark:text-emerald-400
                  group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/25
                  transition-colors duration-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           9. CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="bg-emerald-500 dark:bg-emerald-500/90 py-14 sm:py-20 overflow-hidden relative">
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl" />

        <div className="relative container mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-black leading-tight max-w-2xl mx-auto">
              {user ? "Continue a construir o seu futuro" : "Pronto para dar o próximo passo na sua carreira?"}
            </h2>
            <p className="mt-4 text-black/70 text-sm sm:text-base max-w-lg mx-auto font-light">
              {user
                ? "Explore novas bolsas, mentorias e cursos preparados para si."
                : "Crie a sua conta gratuitamente e descubra oportunidades feitas para o seu perfil."}
            </p>
            <div className="mt-8 flex flex-col xs:flex-row justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/bolsas")}
                className="h-12 px-8 text-sm font-bold rounded-xl
                  bg-black text-white hover:bg-black/80 active:scale-95
                  transition-all duration-200 shadow-lg"
              >
                {user ? "Explorar Bolsas" : "Começar Gratuitamente"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/mentorias")}
                className="h-12 px-8 text-sm font-bold rounded-xl
                  border-black/20 bg-transparent text-black
                  hover:bg-black/10 active:scale-95 transition-all duration-200"
              >
                {user ? "Agendar Mentoria" : "Falar com especialista"}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           10. DEPOIMENTOS (HOME)
      ══════════════════════════════════════════ */}
      <DepoimentosHome />

      {/* ══════════════════════════════════════════
           11. FAQ
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 dark:bg-[#111113] border-y border-gray-100 dark:border-white/[0.05] py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full
              border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10
              text-[11px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
              <HelpCircle className="w-3.5 h-3.5" />
              Ajuda
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-400 dark:text-zinc-500 mt-3 text-sm">
              Tire as suas dúvidas sobre a plataforma e o processo de candidatura.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          >
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Como funciona o processo de candidatura?", a: "Após criar a sua conta grátis, navegue pelas bolsas disponíveis e clique em \"Candidatar-se\". Preencha o formulário com os seus dados pessoais e faça upload dos documentos solicitados. A nossa equipa analisará a sua candidatura e dará feedback dentro do prazo indicado." },
                { q: "Quais documentos são necessários para me candidatar?", a: "Geralmente são necessários: BI/Passaporte, Certificado de Habilitações, Histórico Escolar, Curriculum Vitae e Carta de Motivação. Os documentos específicos variam conforme a bolsa — consulte os requisitos na página de cada oportunidade." },
                { q: "A plataforma é gratuita?", a: "Sim! Criar conta e navegar pelas oportunidades é totalmente gratuito. Oferecemos também mentorias e cursos preparatórios com custos acessíveis para maximizar as suas chances de aprovação." },
                { q: "Como sei se sou elegível para uma bolsa?", a: "Cada bolsa tem critérios específicos de elegibilidade (nível académico, área, país, etc.). Preencha o seu perfil académico e veja quais oportunidades se encaixam melhor consigo." },
                { q: "Quanto tempo leva o processo de candidatura?", a: "O preenchimento do formulário leva cerca de 15-20 minutos. A análise da sua candidatura pode levar de 2 a 4 semanas, dependendo da bolsa e da universidade de destino." },
                { q: "Como funciona a mentoria?", a: "As mentorias são sessões personalizadas com especialistas que já conquistaram bolsas de estudo. Eles ajudam na preparação de documentos, simulam entrevistas e orientam sobre a melhor estratégia de candidatura." },
                { q: "Posso candidatar-me a várias bolsas ao mesmo tempo?", a: "Sim! Pode candidatar-se a quantas bolsas desejar. Recomendamos que diversifique as suas candidaturas para aumentar as chances de sucesso." },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}
                  className="border-gray-100 dark:border-white/[0.06]">
                  <AccordionTrigger className="text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:no-underline py-4 px-5 rounded-xl hover:bg-white dark:hover:bg-white/[0.02] transition-all duration-200 [&[data-state=open]]:text-emerald-600 dark:[&[data-state=open]]:text-emerald-400">
                    <span className="text-left">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-500 dark:text-zinc-400 px-5 pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           12. FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-white dark:bg-[#111113]
        border-t border-gray-100 dark:border-white/[0.06]
        text-gray-400 dark:text-zinc-500">
        <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-16
          grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Afro<span className="text-emerald-500">Schoolar</span>
            </span>
            <p className="mt-3 text-sm font-light leading-relaxed max-w-[180px]">
              Transformando o potencial angolano em sucesso global.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h5 className="font-semibold text-gray-900 dark:text-white mb-4 text-xs tracking-widest uppercase">
                {section.title}
              </h5>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-gray-100 dark:bg-white/[0.05]" />

        <div className="container mx-auto px-4 sm:px-6 py-5
          flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} Afroscholars — Todos os direitos reservados.</p>
          <p className="text-gray-400 dark:text-zinc-600">Feito com ♥ em Luanda, Angola</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
