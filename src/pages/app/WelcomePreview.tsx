import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Award, GraduationCap, ArrowRight,
  Users, BookOpenText, Target,
  UserCheck, Video, FileText,
  Sparkles, Quote, Play, Star, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { bolsasApi } from "@/api/bolsas";
import { depoimentosApi, type Depoimento } from "@/api/depoimentos";
import { homeBannersApi } from "@/api/home-banners";
import { api } from "@/lib/axios";
import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { AnimatedLetters } from "@/components/AnimatedLetters";

import img1 from "@/assets/WhatsApp Image 2026-04-06 512.26.31.jpeg";
import img2 from "@/assets/CORRECTA.jpeg";
import img3 from "@/assets/WhatsApp Image 2026-04-06 at 12.26.32.jpeg";

const fallbackImages = [img1, img2, img3];

function DynamicCounter({ to, duration = 2 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
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

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay } },
});

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const universities = [
  "Harvard", "Oxford", "MIT", "Cambridge", "Stanford", "ETH Zürich",
  "Imperial College", "Toronto", "Columbia", "UCL", "Berkeley", "Sorbonne",
];

const features = [
  {
    icon: Award,
    title: "Bolsas de Estudo",
    desc: "Centenas de oportunidades em universidades de referência, filtradas para o teu perfil.",
  },
  {
    icon: UserCheck,
    title: "Entrevista com IA",
    desc: "Treina com simulações inteligentes de entrevistas reais de universidades.",
  },
  {
    icon: GraduationCap,
    title: "Preparação Pessoal",
    desc: "Cursos e mentorias para fortalecer a tua candidatura e melhorar as tuas hipóteses.",
  },
  {
    icon: Video,
    title: "Aulas ao Vivo",
    desc: "Aulas ao vivo com quem já viveu o processo de candidatura do início ao fim.",
  },
  {
    icon: FileText,
    title: "Análise de Documentos",
    desc: "Revisão atenta dos teus documentos, com sugestões práticas de melhoria.",
  },
  {
    icon: Users,
    title: "Comunidades",
    desc: "Conversa com estudantes angolanos que partilham os mesmos objectivos.",
  },
];

const stats = [
  { icon: Users, label: "Utilizadores", value: 12500, suffix: "+" },
  { icon: Award, label: "Bolsas conquistadas", value: 380, suffix: "" },
  { icon: BookOpenText, label: "Preparações", value: 45, suffix: "+" },
  { icon: Target, label: "Taxa de sucesso", value: 92, suffix: "%" },
];

function Particles({ count = 14 }: { count?: number }) {
  const dots = Array.from({ length: count }).map((_, i) => ({
    left: `${(i * 137.5) % 100}%`,
    top: `${(i * 61.8) % 100}%`,
    size: 3 + (i % 3) * 2,
    delay: (i % 7) * 0.6,
    duration: 4 + (i % 5),
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-emerald-300/60 dark:bg-emerald-400/50"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size }}
          animate={{ y: [0, -26, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-emerald-500/25 blur-[110px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-teal-400/20 blur-[110px]"
        animate={{ x: [0, -36, 0], y: [0, -24, 0], scale: [1.1, 1, 1.1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-400/15 blur-[110px]"
        animate={{ x: [0, 26, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function UniversityMarquee() {
  const items = [...universities, ...universities];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] bg-black/25 backdrop-blur-sm py-5">
      <motion.div
        className="flex w-max items-center gap-10"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {items.map((u, i) => (
          <div key={i} className="flex items-center gap-3 whitespace-nowrap">
            <GraduationCap className="h-4 w-4 text-emerald-400/70" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">{u}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function WelcomePreview() {
  const navigate = useNavigate();
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: bannersData } = useQuery({
    queryKey: ["home-banners-welcome"],
    queryFn: homeBannersApi.list,
    staleTime: 1000 * 60 * 5,
  });

  const bannersList = bannersData?.data || [];
  const momentsImages = bannersList.length > 0
    ? bannersList.map((b) =>
        b.imageUrl.startsWith("http")
          ? b.imageUrl
          : `${api.defaults.baseURL}${b.imageUrl.startsWith("/") ? "" : "/uploads/"}${b.imageUrl}`
      )
    : fallbackImages;

  const { data: destaques, isLoading: destaquesLoading } = useQuery({
    queryKey: ["bolsas-destaques-preview"],
    queryFn: bolsasApi.destaques,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    depoimentosApi.list().then(setDepoimentos).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % momentsImages.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [momentsImages.length]);

  useEffect(() => {
    if (depoimentos.length === 0) return;
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % depoimentos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [depoimentos.length]);

  const currentTestimonial = depoimentos[testimonialIndex];

  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ═══════════════════════════════════════════════
          HERO — impacto visual máximo
      ═══════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] sm:min-h-[95vh] max-h-[1100px] flex items-center overflow-hidden">
        {momentsImages.map((src, i) => (
          <motion.div
            key={i}
            className={`absolute inset-0 bg-cover bg-center ${i === slideIndex ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${src})` }}
            initial={false}
            animate={{
              opacity: i === slideIndex ? 1 : 0,
              scale: i === slideIndex ? 1 : 1.08,
            }}
            transition={{ opacity: { duration: 1.5, ease: "easeInOut" }, scale: { duration: 6.5, ease: "easeOut" } }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-slate-900/75 to-gray-950/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

        <FloatingOrbs />
        <Particles />

        <div className="relative z-10 container mx-auto px-5 sm:px-8 md:px-16 lg:px-24 pt-28 pb-24">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            <motion.div variants={fade(0)} className="flex items-center gap-3 mb-6">
              <span className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-[11px] font-bold tracking-widest uppercase text-emerald-300 backdrop-blur-md overflow-hidden">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-300/25 to-transparent animate-pulse" />
                <Sparkles className="h-3.5 w-3.5" />
                Feito para estudantes angolanos
              </span>
            </motion.div>

            <motion.h1
              variants={fade(0.05)}
              className="text-[2rem] leading-[1.05] sm:text-[2.8rem] md:text-[3.6rem] lg:text-[4.6rem] font-black tracking-tight text-white max-w-5xl"
            >
              <AnimatedLetters text="O futuro que tu mereces" className="inline-block" delay={0.1} />{" "}
              <AnimatedLetters text="começa com a" className="inline-block" delay={0.1} />{" "}
              <span className="relative inline-block whitespace-nowrap">
                <motion.span
                  className="inline-block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent bg-[length:200%_auto]"
                  animate={{ backgroundPosition: ["0% center", "200% center"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  <AnimatedLetters
                    text="bolsa certa."
                    className="inline-block"
                    delay={0.1}
                    loop
                    waveAmplitude={4}
                    waveDuration={4}
                  />
                </motion.span>
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute left-0 -bottom-[0.14em] h-[0.05em] w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300/0 shadow-[0_0_24px_4px_rgba(52,211,153,0.4)]"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ scaleX: { delay: 1.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }, opacity: { delay: 1.2, duration: 0.3 } }}
                  style={{ originX: 0 }}
                />
              </span>
            </motion.h1>

            <motion.div variants={fade(0.1)} className="w-16 h-[3px] my-6 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300" />

            <motion.p
              variants={fade(0.12)}
              className="text-sm sm:text-base lg:text-lg font-light leading-relaxed max-w-xl text-white/70"
            >
              Ajudamos-te, passo a passo, a encontrar e conquistar a
              bolsa que pode mudar a tua vida — com mentoria de quem já fez esse caminho.
            </motion.p>

            <motion.div
              variants={fade(0.18)}
              className="flex flex-col sm:flex-row flex-wrap gap-3 mt-10"
            >
              <Button
                size="lg"
                onClick={() => navigate("/sign-up")}
                className="group h-13 sm:h-14 px-8 sm:px-10 text-base font-bold bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl shadow-[0_8px_32px_rgba(52,211,153,0.35)] hover:shadow-[0_14px_44px_rgba(52,211,153,0.5)] active:scale-[0.97] transition-all duration-200"
              >
                Começa agora — é grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                className="h-13 sm:h-14 px-8 sm:px-10 text-base font-semibold border-2 border-white/25 text-white bg-white/5 hover:bg-white/15 hover:border-white/40 backdrop-blur-sm rounded-2xl active:scale-[0.97] transition-all duration-200"
              >
                <Play className="mr-2 h-4 w-4" />
                Ver como funciona
              </Button>
            </motion.div>

            <motion.div
              variants={fade(0.22)}
              className="mt-10 sm:mt-12 pt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10"
            >
              {[
                { value: "12.500+", label: "Utilizadores activos" },
                { value: "380", label: "Bolsas conquistadas" },
                { value: "92%", label: "Taxa de aprovação" },
              ].map((s) => (
                <div key={s.label} className="group">
                  <p className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {s.value}
                  </p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1 group-hover:text-emerald-300 transition-colors">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {momentsImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === slideIndex ? "w-8 bg-emerald-400" : "w-2.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          MARQUEE DE UNIVERSIDADES
      ═══════════════════════════════════════════════ */}
      <UniversityMarquee />

      {/* ═══════════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113]">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.55 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group flex items-center gap-3 sm:gap-4 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:border-emerald-200 dark:hover:border-emerald-500/25 hover:shadow-lg hover:shadow-emerald-50 dark:hover:shadow-none transition-all duration-300"
              >
                <motion.div
                  className="rounded-xl p-2.5 shrink-0 bg-emerald-50 dark:bg-emerald-500/10 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/15 transition-colors"
                  animate={{ rotate: [0, -6, 6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                >
                  <stat.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
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

      {/* ═══════════════════════════════════════════════
          FEATURES — por que a Afroscholars
      ═══════════════════════════════════════════════ */}
      <section id="features" className="bg-white dark:bg-[#111113] py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/5 dark:bg-emerald-500/[0.03] rounded-full blur-3xl" />
        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <Target className="h-3.5 w-3.5" />
              Tudo num só lugar
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-4">
              <AnimatedLetters text="Cada etapa da tua jornada" className="inline-block" />{" "}
              <AnimatedLetters text="num só lugar" className="inline-block text-emerald-600 dark:text-emerald-400" />
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
              Do primeiro passo até à conquista da tua vaga — tudo o que precisas, reunido num só lugar.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] hover:border-emerald-200 dark:hover:border-emerald-500/25 hover:shadow-xl hover:shadow-emerald-100/60 dark:hover:shadow-none transition-all duration-300 overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/0 group-hover:bg-emerald-400/10 blur-2xl transition-all duration-500" />
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/20 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/15 transition-colors"
                  whileHover={{ rotate: -8, scale: 1.08 }}
                  transition={{ duration: 0.3 }}
                >
                  <f.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          OPORTUNIDADES EM DESTAQUE
      ═══════════════════════════════════════════════ */}
      <section className="bg-gray-50 dark:bg-[#0e0e10] py-20 sm:py-28 border-y border-gray-100 dark:border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">
                Seleção do mês
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                Oportunidades em Destaque
              </h2>
              <p className="text-gray-400 dark:text-zinc-500 mt-2 text-sm">
                As bolsas mais relevantes, seleccionadas para o teu perfil.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
            >
              <Button
                variant="outline"
                onClick={() => navigate("/sign-in")}
                className="h-10 px-6 text-sm rounded-xl border-gray-200 dark:border-white/[0.1] hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 transition-all"
              >
                Ver todas
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </motion.div>
          </div>

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
                  onClick={() => navigate("/sign-in")}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.09, duration: 0.55 }}
                  whileHover={{ y: -5, transition: { duration: 0.22 } }}
                  className="group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 cursor-pointer border border-gray-100 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50 dark:bg-white/[0.02] dark:border-white/[0.06] dark:hover:border-emerald-500/30 dark:hover:shadow-none transition-all duration-300"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        {bolsa.nivel || "Graduação"}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-600">
                        {bolsa.pais}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug mb-2">
                      {bolsa.titulo}
                    </h3>
                    {bolsa.instituicao && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {bolsa.instituicao}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-600 uppercase tracking-wider">
                      Ver detalhes
                    </span>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/[0.06] group-hover:bg-emerald-500 transition-all duration-200">
                      <ArrowRight className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="col-span-full text-center text-sm text-gray-400 dark:text-zinc-600 py-12">
                Nenhuma oportunidade disponível no momento.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          DEPOIMENTOS — carrossel animado
      ═══════════════════════════════════════════════ */}
      {depoimentos.length > 0 && (
        <section className="bg-white dark:bg-[#111113] py-20 sm:py-28 overflow-hidden relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-emerald-400/5 dark:bg-emerald-500/[0.04] rounded-full blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-[11px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                Depoimentos
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                <AnimatedLetters text="O que dizem os nossos alunos" className="inline-block" />
              </h2>
              <p className="text-gray-400 dark:text-zinc-500 mt-3 text-sm max-w-xl mx-auto">
                Histórias reais de quem já está a transformar a vida através da educação.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto relative min-h-[240px] sm:min-h-[220px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial.id}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="relative p-8 sm:p-10 rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] shadow-xl shadow-gray-100/60 dark:shadow-none"
                >
                  <Quote className="absolute top-5 right-6 h-10 w-10 text-emerald-200 dark:text-emerald-800/30" />
                  <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-zinc-200 text-base sm:text-lg leading-relaxed italic">
                    &ldquo;{currentTestimonial.texto}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-sm">
                      {currentTestimonial.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{currentTestimonial.nome}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {currentTestimonial.curso}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center items-center gap-2 mt-6">
                {depoimentos.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setTestimonialIndex(i)}
                    aria-label={`Depoimento ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i === testimonialIndex ? "w-8 bg-emerald-500" : "w-2.5 bg-gray-300 dark:bg-zinc-700 hover:bg-emerald-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_50%)]" />
        <motion.div
          className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 24, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl"
          animate={{ x: [0, -28, 0], y: [0, -20, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <Particles count={10} />
        <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md mb-8"
            >
              <GraduationCap className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-5">
              <AnimatedLetters text="Começa hoje a tua jornada" className="inline-block" />
            </h2>
            <p className="text-emerald-100/75 text-sm sm:text-base max-w-lg mx-auto mb-10 leading-relaxed">
              Entra para o grupo de estudantes angolanos que já conquistaram
              uma vaga no estrangeiro. Criar conta é grátis e leva menos de dois minutos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/sign-up")}
                className="h-14 px-10 sm:px-12 text-base font-bold bg-white text-emerald-700 hover:bg-emerald-50 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_44px_rgba(0,0,0,0.3)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                Criar a minha conta
                <ArrowRight className="ml-2.5 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/sign-in")}
                className="h-14 px-10 sm:px-12 text-base font-semibold border-2 border-white/30 text-white bg-white/5 hover:bg-white/15 hover:border-white/50 rounded-2xl active:scale-[0.97] transition-all duration-200"
              >
                Entrar na minha conta
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════ */}
      <footer className="bg-gray-950 dark:bg-black pt-14 pb-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <GraduationCap size={16} className="text-white" />
                </div>
                <span className="font-bold text-white text-sm">Afroscholars</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                A ajudar estudantes angolanos a chegar às melhores universidades do mundo desde 2024.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Plataforma</h4>
              <ul className="space-y-2">
                {["Bolsas de Estudo", "Preparação Pessoal", "Aulas ao Vivo", "Comunidades"].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Empresa</h4>
              <ul className="space-y-2">
                {["Sobre Nós", "Blog", "Parceiros", "Contacto"].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Suporte</h4>
              <ul className="space-y-2">
                {["FAQ", "Privacidade", "Termos de Uso", "Ajuda"].map((item) => (
                  <li key={item}>
                    <span className="text-xs text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} Afroscholars. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              {["Instagram", "LinkedIn", "YouTube"].map((social) => (
                <span key={social} className="text-[10px] text-gray-600 hover:text-emerald-400 transition-colors cursor-pointer uppercase tracking-wider">
                  {social}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
