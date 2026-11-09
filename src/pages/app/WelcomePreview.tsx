import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig, useInView, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Award, GraduationCap, ArrowRight,
  Users,
  UserCheck, Video, FileText,
  Quote, MapPin, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { bolsasApi } from "@/api/bolsas";
import { depoimentosApi, type Depoimento } from "@/api/depoimentos";
import { homeBannersApi } from "@/api/home-banners";
import { mentoresApi, urlDaImagemDoMentor, type Mentor } from "@/api/mentores";
import { getUploadUrl } from "@/lib/axios";
import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { BandeiraPais } from "@/components/bandeira-pais";
import { CardAccent, Reveal, cardTitle, iconTile, userCard } from "@/components/user-ui";
import { cn } from "@/lib/utils";

import img1 from "@/assets/WhatsApp Image 2026-04-06 512.26.31.jpeg";
import img2 from "@/assets/CORRECTA.jpeg";
import img3 from "@/assets/WhatsApp Image 2026-04-06 at 12.26.32.jpeg";

const fallbackImages = [img1, img2, img3];
const AVATARES_NO_TOPO = 7;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Os cards da área do utilizador, com sombra em repouso para parecerem suspensos sobre a página. */
const cardFlutuante = cn(
  userCard,
  "shadow-[0_14px_34px_-20px_rgba(16,24,40,0.28)] dark:shadow-[0_14px_34px_-20px_rgba(0,0,0,0.8)]"
);

function DynamicCounter({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduzir = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduzir) {
      setCount(to);
      return;
    }
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
  }, [inView, to, duration, reduzir]);

  return <span ref={ref}>{count.toLocaleString("pt-PT")}</span>;
}

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE, delay } },
});

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const universities = [
  "Harvard", "Oxford", "MIT", "Cambridge", "Stanford", "ETH Zürich",
  "Imperial College", "Toronto", "Columbia", "UCL", "Berkeley", "Sorbonne",
];

const features = [
  {
    icon: Award,
    title: "Bolsas de Estudo",
    desc: "Centenas de oportunidades em universidades de referência, filtradas para o seu perfil.",
  },
  {
    icon: UserCheck,
    title: "Entrevista com IA",
    desc: "Treine com simulações inteligentes de entrevistas reais de universidades.",
  },
  {
    icon: GraduationCap,
    title: "Preparação Pessoal",
    desc: "Cursos e mentorias para fortalecer a sua candidatura e melhorar as suas hipóteses.",
  },
  {
    icon: Video,
    title: "Aulas ao Vivo",
    desc: "Aulas ao vivo com quem já viveu o processo de candidatura do início ao fim.",
  },
  {
    icon: FileText,
    title: "Análise de Documentos",
    desc: "Revisão atenta dos seus documentos, com sugestões práticas de melhoria.",
  },
  {
    icon: Users,
    title: "Comunidades",
    desc: "Converse com estudantes angolanos que partilham os mesmos objectivos.",
  },
];

const stats = [
  { label: "Utilizadores", value: 12500, suffix: "+" },
  { label: "Bolsas conquistadas", value: 380, suffix: "" },
  { label: "Preparações", value: 45, suffix: "+" },
  { label: "Taxa de sucesso", value: 92, suffix: "%" },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return `${primeira}${ultima}`.toUpperCase();
}

function MentorAvatar({ mentor, className }: { mentor: Mentor; className: string }) {
  const [falhou, setFalhou] = useState(false);
  const src = urlDaImagemDoMentor(mentor.imagem);

  if (!src || falhou) {
    return (
      <span
        role="img"
        aria-label={mentor.nome}
        className={`flex items-center justify-center rounded-full bg-emerald-700 font-semibold text-white ${className}`}
      >
        {iniciais(mentor.nome)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={mentor.nome}
      loading="lazy"
      onError={() => setFalhou(true)}
      className={`rounded-full bg-gray-800 object-cover ${className}`}
    />
  );
}

function MentoresEmSequencia({ mentores }: { mentores: Mentor[] }) {
  const visiveis = mentores.slice(0, AVATARES_NO_TOPO);
  const restantes = mentores.length - visiveis.length;

  return (
    <a
      href="#mentores"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("mentores")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="group inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
    >
      <span className="flex -space-x-3">
        {visiveis.map((mentor, i) => (
          <motion.span
            key={mentor.id}
            title={mentor.nome}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07, duration: 0.45, ease: EASE }}
            className="relative block rounded-full ring-2 ring-gray-950 transition-transform duration-200 hover:z-10 hover:-translate-y-1"
          >
            <MentorAvatar mentor={mentor} className="h-11 w-11 text-xs" />
          </motion.span>
        ))}
        {restantes > 0 && (
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900 ring-2 ring-gray-950">
            +{restantes}
          </span>
        )}
      </span>
      <span className="text-sm text-white/80 group-hover:text-white transition-colors">
        {mentores.length === 1 ? (
          <>Conheça a nossa <strong className="font-semibold text-white">mentoria</strong></>
        ) : (
          <>Aprenda com <strong className="font-semibold text-white">{mentores.length} mentores</strong></>
        )}
      </span>
    </a>
  );
}

function UniversityMarquee() {
  const items = [...universities, ...universities];
  return (
    <section aria-label="Universidades de referência" className="bg-gray-950 border-t border-white/10 py-7">
      <p className="mb-5 text-center text-xs font-medium text-white/60 px-4">
        Prepare a sua candidatura para universidades como
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <motion.div
          className="flex w-max items-center gap-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {items.map((u, i) => (
            <span
              key={i}
              aria-hidden={i >= universities.length}
              className="whitespace-nowrap text-sm sm:text-base font-semibold tracking-wide text-white/70"
            >
              {u}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CabecalhoDeSecao({
  etiqueta,
  titulo,
  texto,
  escuro = false,
}: {
  etiqueta: string;
  titulo: string;
  texto: string;
  escuro?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="mx-auto mb-12 sm:mb-16 max-w-2xl text-center"
    >
      <p className={`mb-3 text-sm font-semibold ${escuro ? "text-emerald-400" : "text-emerald-700 dark:text-emerald-400"}`}>
        {etiqueta}
      </p>
      <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-balance ${escuro ? "text-white" : "text-gray-900 dark:text-white"}`}>
        {titulo}
      </h2>
      <p className={`mt-4 text-base leading-relaxed ${escuro ? "text-white/70" : "text-gray-600 dark:text-zinc-400"}`}>
        {texto}
      </p>
    </motion.div>
  );
}

export function WelcomePreview() {
  const navigate = useNavigate();
  const reduzirMovimento = useReducedMotion();
  const [depoimentos, setDepoimentos] = useState<Depoimento[]>([]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

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
          : getUploadUrl(`/uploads/${b.imageUrl}`)
      )
    : fallbackImages;

  const { data: destaques, isLoading: destaquesLoading } = useQuery({
    queryKey: ["bolsas-destaques-preview"],
    queryFn: bolsasApi.destaques,
    staleTime: 1000 * 60 * 5,
  });

  const { data: mentores = [] } = useQuery({
    queryKey: ["mentores-welcome"],
    queryFn: mentoresApi.list,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    depoimentosApi.list().then(setDepoimentos).catch(() => {});
  }, []);

  useEffect(() => {
    if (reduzirMovimento) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % momentsImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [momentsImages.length, reduzirMovimento]);

  useEffect(() => {
    if (depoimentos.length === 0 || reduzirMovimento) return;
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % depoimentos.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [depoimentos.length, reduzirMovimento]);

  const slideAtual = slideIndex % momentsImages.length;
  const currentTestimonial = depoimentos[testimonialIndex];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-gray-900 dark:text-white">
        <Header semMenu />

        {/* Topo */}
        <section className="relative isolate overflow-hidden bg-gray-950">
          {momentsImages.map((src, i) => (
            <motion.div
              key={src}
              aria-hidden
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{ backgroundImage: `url("${src}")` }}
              initial={false}
              animate={{ opacity: i === slideAtual ? 1 : 0, scale: i === slideAtual ? 1 : 1.05 }}
              transition={{ opacity: { duration: 1.2, ease: "easeInOut" }, scale: { duration: 7, ease: "easeOut" } }}
            />
          ))}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-gray-950/95 via-gray-950/80 to-gray-950/40" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />

          <div className="container mx-auto flex min-h-[calc(100svh-4rem)] lg:min-h-[720px] lg:max-h-[860px] items-center px-5 sm:px-8 py-16 sm:py-20">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-3xl">
              <motion.h1
                variants={fade()}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white text-balance"
              >
                Conquiste a <span className="text-emerald-400">bolsa certa</span> para estudar no exterior
              </motion.h1>

              <motion.p
                variants={fade()}
                className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/85"
              >
                Bolsas de estudo, intercâmbios e estágios, com preparação passo a passo
                e mentoria de quem já fez esse caminho.
              </motion.p>

              <motion.div variants={fade()} className="mt-9 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/sign-up")}
                  className="group h-12 px-7 text-sm font-semibold bg-emerald-500 text-gray-950 hover:bg-emerald-400 rounded-lg transition-colors"
                >
                  Comece agora — é grátis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="h-12 px-7 text-sm font-semibold border-white/30 text-white bg-white/5 hover:bg-white/15 hover:text-white rounded-lg transition-colors"
                >
                  Ver como funciona
                </Button>
              </motion.div>

              {mentores.length > 0 && (
                <motion.div variants={fade()} className="mt-10">
                  <MentoresEmSequencia mentores={mentores} />
                </motion.div>
              )}

              <motion.div variants={fade()} className="mt-7">
                <Link
                  to="/calendario"
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/75 hover:text-emerald-300 transition-colors"
                >
                  <CalendarDays className="h-4 w-4" />
                  Ver calendário de atividades
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {momentsImages.length > 1 && (
            <div className="absolute bottom-3 right-3 sm:right-6 flex items-center">
              {momentsImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Imagem ${i + 1}`}
                  aria-current={i === slideAtual}
                  className="group p-2"
                >
                  <span
                    className={`block h-1 rounded-full transition-all duration-500 ${
                      i === slideAtual ? "w-7 bg-emerald-400" : "w-4 bg-white/40 group-hover:bg-white/70"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <UniversityMarquee />

        {/* Números */}
        <section className="bg-white dark:bg-[#111113]">
          <dl className="container mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 px-5 sm:px-8 pt-12 sm:pt-14">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(cardFlutuante, "px-3 py-6 sm:px-6 sm:py-8 text-center")}
              >
                <CardAccent />
                <dd className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white tabular-nums">
                  <DynamicCounter to={stat.value} />
                  {stat.suffix}
                </dd>
                <dt className="mt-2 text-sm text-gray-600 dark:text-zinc-400">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Funcionalidades */}
        <section id="features" className="scroll-mt-16 bg-white dark:bg-[#111113] py-20 sm:py-28">
          <div className="container mx-auto px-5 sm:px-8">
            <CabecalhoDeSecao
              etiqueta="Tudo num só lugar"
              titulo="Cada etapa da sua jornada, do primeiro passo à vaga"
              texto="Tudo o que precisa para encontrar a oportunidade certa e apresentar uma candidatura forte."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <Reveal key={f.title} index={i % 3}>
                  <div className={cn(cardFlutuante, "flex h-full gap-4 p-6")}>
                    <CardAccent />
                    <div className={iconTile}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={cn(cardTitle, "text-base")}>{f.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{f.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Mentores */}
        {mentores.length > 0 && (
          <section id="mentores" className="scroll-mt-16 bg-gray-950 py-20 sm:py-28">
            <div className="container mx-auto px-5 sm:px-8">
              <CabecalhoDeSecao
                escuro
                etiqueta="Os nossos mentores"
                titulo="Aprenda com quem já percorreu este caminho"
                texto="Conte com orientação próxima em cada fase da sua candidatura."
              />

              <ul className="flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-10">
                {mentores.map((mentor, i) => (
                  <motion.li
                    key={mentor.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: Math.min(i, 12) * 0.05, duration: 0.45, ease: EASE }}
                    className="w-full max-w-[280px] sm:w-60 text-center"
                  >
                    <div className="relative mx-auto w-fit">
                      <MentorAvatar
                        mentor={mentor}
                        className="mx-auto h-20 w-20 sm:h-28 sm:w-28 text-xl sm:text-2xl ring-2 ring-white/15"
                      />
                      {mentor.pais && (
                        <BandeiraPais
                          pais={mentor.pais}
                          className="absolute bottom-0 right-0 h-5 w-7 sm:h-6 sm:w-9 ring-2 ring-gray-950"
                        />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-medium leading-snug text-white break-words">
                      {mentor.nome}
                    </p>
                    {mentor.pais && (
                      <p className="mt-0.5 text-xs text-white/60">{mentor.pais}</p>
                    )}
                    {mentor.bio && (
                      <p className="mt-2 line-clamp-6 text-xs leading-relaxed text-white/75 break-words">{mentor.bio}</p>
                    )}
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Oportunidades em destaque */}
        <section className="bg-gray-50 dark:bg-[#0e0e10] py-20 sm:py-28 border-b border-gray-200 dark:border-white/[0.08]">
          <div className="container mx-auto px-5 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
              <div className="max-w-2xl">
                <p className="mb-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Seleção do mês</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Oportunidades em destaque
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/sign-in")}
                className="h-11 self-start md:self-auto px-5 text-sm font-semibold rounded-lg dark:text-white"
              >
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {destaquesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-6 border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] animate-pulse">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-white/[0.08] rounded mb-4" />
                    <div className="h-5 w-full bg-gray-200 dark:bg-white/[0.08] rounded mb-2" />
                    <div className="h-4 w-32 bg-gray-200 dark:bg-white/[0.08] rounded" />
                  </div>
                ))
              ) : destaques && destaques.length > 0 ? (
                destaques.slice(0, 4).map((bolsa, i) => (
                  <Reveal key={bolsa.id} index={i}>
                    <button
                      type="button"
                      onClick={() => navigate("/sign-in")}
                      className={cn(cardFlutuante, "flex h-full w-full flex-col justify-between p-6")}
                    >
                      <CardAccent />
                      <div>
                        <p className="mb-3 text-xs font-medium text-gray-600 dark:text-zinc-400">
                          {[bolsa.nivel || "Graduação", bolsa.pais].filter(Boolean).join(" · ")}
                        </p>
                        <h3 className={cn(cardTitle, "text-base")}>{bolsa.titulo}</h3>
                        {bolsa.instituicao && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">{bolsa.instituicao}</p>
                        )}
                      </div>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        Ver detalhes
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  </Reveal>
                ))
              ) : (
                <p className="col-span-full text-center text-sm text-gray-600 dark:text-zinc-400 py-12">
                  Nenhuma oportunidade disponível no momento.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Depoimentos */}
        {currentTestimonial && (
          <section className="bg-white dark:bg-[#111113] py-20 sm:py-28">
            <div className="container mx-auto px-5 sm:px-8">
              <CabecalhoDeSecao
                etiqueta="Depoimentos"
                titulo="O que dizem os nossos alunos"
                texto="Histórias de quem está a transformar a vida através da educação."
              />

              <div className="mx-auto max-w-3xl">
                <div className={cn(cardFlutuante, "min-h-[280px] p-6 sm:p-10")}>
                  <CardAccent />
                  <AnimatePresence mode="wait">
                    <motion.figure
                      key={currentTestimonial.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="text-center"
                    >
                      <Quote aria-hidden className="mx-auto mb-5 h-8 w-8 text-emerald-600 dark:text-emerald-500" />
                      <blockquote className="text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-zinc-200">
                        {currentTestimonial.texto}
                      </blockquote>
                      <figcaption className="mt-6">
                        <p className="font-semibold text-gray-900 dark:text-white">{currentTestimonial.nome}</p>
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-600 dark:text-zinc-400">
                          <MapPin className="h-3.5 w-3.5" />
                          {currentTestimonial.curso}
                        </p>
                      </figcaption>
                    </motion.figure>
                  </AnimatePresence>
                </div>

                {depoimentos.length > 1 && (
                  <div className="flex justify-center items-center mt-4">
                    {depoimentos.map((d, i) => (
                      <button
                        key={d.id}
                        onClick={() => setTestimonialIndex(i)}
                        aria-label={`Depoimento ${i + 1}`}
                        aria-current={i === testimonialIndex}
                        className="group p-2"
                      >
                        <span
                          className={`block h-1 rounded-full transition-all duration-500 ${
                            i === testimonialIndex
                              ? "w-7 bg-emerald-600"
                              : "w-4 bg-gray-300 dark:bg-zinc-700 group-hover:bg-emerald-400"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Chamada final */}
        <section className="bg-emerald-800 py-20 sm:py-24">
          <div className="container mx-auto px-5 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white text-balance">
              Comece hoje a sua jornada
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-emerald-50">
              Criar conta é grátis e leva menos de dois minutos.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/sign-up")}
                className="h-12 w-full sm:w-auto px-7 text-sm font-semibold bg-white text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Criar a minha conta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/sign-in")}
                className="h-12 w-full sm:w-auto px-7 text-sm font-semibold border-white/40 text-white bg-transparent hover:bg-white/10 hover:text-white rounded-lg transition-colors"
              >
                Entrar na minha conta
              </Button>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="bg-gray-950 dark:bg-black pt-14 pb-8">
          <div className="container mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <GraduationCap size={16} className="text-white" />
                  </div>
                  <span className="font-semibold text-white text-sm">Afroscholars</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                  A ajudar estudantes angolanos a chegar às melhores universidades do mundo desde 2024.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Plataforma</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {["Bolsas de Estudo", "Preparação Pessoal", "Aulas ao Vivo", "Comunidades"].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  <li>
                    <Link to="/calendario" className="hover:text-emerald-400 transition-colors">
                      Agendamentos
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Empresa</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {["Sobre Nós", "Blog", "Parceiros", "Contacto"].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Suporte</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {["FAQ", "Privacidade", "Termos de Uso", "Ajuda"].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Afroscholars. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {["Instagram", "LinkedIn", "YouTube"].map((social) => (
                  <span key={social}>{social}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
