import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, ArrowLeft, ArrowRight, Clock, Users, BookOpen,
  CheckCircle2, Lock, ChevronDown, ChevronUp, Award, Globe,
  FileText, Download, PlayCircle, BarChart2,
  Zap, Target, MessageCircle,
  Layers, ChevronRight, X, CreditCard,
} from "lucide-react";

// --- Tipagens ---
interface Lesson {
  id: number;
  title: string;
  duration: string;
  type: "video" | "quiz" | "pdf";
  free: boolean;
  youtubeUrl?: string;
  videoId?: string;
}
interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}
interface Mentor {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  students: number;
  courses: number;
  rating: number;
}
interface Course {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
  level: "Iniciante" | "Intermédio" | "Avançado";
  duration: string;
  lessons: number;
  students: number;
  rating: number;
  reviews: number;
  price: string;
  originalPrice: string;
  language: string;
  tags: string[];
  description: string;
  whatYouLearn: string[];
  mentor: Mentor;
  modules: Module[];
}

// --- Dados ---
const courses: Course[] = [
  {
    id: 1,
    title: "Finanças Pessoais & Investimento",
    subtitle: "Da poupança inteligente ao primeiro investimento no mercado angolano",
    category: "Finanças",
    accent: "#10b981",
    gradientFrom: "#064e3b",
    gradientTo: "#065f46",
    level: "Iniciante",
    duration: "12h 20min",
    lessons: 48,
    students: 5810,
    rating: 4.8,
    reviews: 734,
    price: "12.000 Kz",
    originalPrice: "24.000 Kz",
    language: "Português",
    tags: ["Poupança", "BODIVA", "Kwanza"],
    description: "O único curso focado na realidade económica de Angola.",
    whatYouLearn: [
      "Investir em Títulos do Tesouro",
      "Entender e combater a Inflação",
      "BODIVA para iniciantes",
      "Gestão eficiente do Kwanza",
      "Construir uma reserva de emergência",
      "Planear a reforma com segurança",
    ],
    mentor: {
      name: "Ana Luísa Ferreira",
      role: "Economista & Analista Financeira",
      avatar: "AL",
      bio: "Ex-analista do BNA com 10 anos de experiência em gestão de património.",
      students: 18000,
      courses: 4,
      rating: 4.8,
    },
    modules: [
      {
        id: 1,
        title: "Mentalidade Financeira & Inflação",
        lessons: [
          { id: 1, title: "O impacto do câmbio no seu bolso", duration: "15:00", type: "video", free: true, youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", videoId: "dQw4w9WgXcQ" },
          { id: 2, title: "Como a inflação corrói as suas poupanças", duration: "12:00", type: "video", free: true, youtubeUrl: "https://www.youtube.com/watch?v=JSotclL8e5A", videoId: "JSotclL8e5A" },
          { id: 3, title: "Quiz: Perfil de Risco", duration: "10 min", type: "quiz", free: false },
        ],
      },
      {
        id: 2,
        title: "Títulos do Tesouro Nacional",
        lessons: [
          { id: 4, title: "O que são e como aderir", duration: "18:00", type: "video", free: false, youtubeUrl: "https://www.youtube.com/watch?v=K4TOrB7atI0", videoId: "K4TOrB7atI0" },
          { id: 5, title: "Guia PDF: Passo a passo de compra", duration: "PDF", type: "pdf", free: false },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Inglês para Bolsas Internacionais",
    subtitle: "IELTS, TOEFL e redação de candidaturas para universidades do mundo",
    category: "Idiomas",
    accent: "#6366f1",
    gradientFrom: "#1e1b4b",
    gradientTo: "#312e81",
    level: "Intermédio",
    duration: "18h 45min",
    lessons: 72,
    students: 9340,
    rating: 4.9,
    reviews: 1120,
    price: "15.000 Kz",
    originalPrice: "30.000 Kz",
    language: "Português / Inglês",
    tags: ["IELTS", "TOEFL", "Escrita Académica"],
    description: "Domine o inglês acadêmico e conquiste a pontuação necessária para as melhores universidades.",
    whatYouLearn: [
      "Estratégias para o exame IELTS",
      "Preparação completa para o TOEFL",
      "Escrita de personal statements",
      "Vocabulário académico avançado",
      "Speaking e Listening intensivos",
      "Revisão de candidaturas reais",
    ],
    mentor: {
      name: "Carlos Mbemba",
      role: "Linguista & Coach de Bolsas",
      avatar: "CM",
      bio: "Mestre em Linguística pela Universidade de Lisboa. Ajudou +200 alunos angolanos a conquistar bolsas.",
      students: 25000,
      courses: 6,
      rating: 4.9,
    },
    modules: [
      {
        id: 1,
        title: "Fundamentos do Inglês Académico",
        lessons: [
          { id: 1, title: "Introdução ao módulo", duration: "08:00", type: "video", free: true, youtubeUrl: "https://www.youtube.com/watch?v=5fWwV2F6K3w", videoId: "5fWwV2F6K3w" },
          { id: 2, title: "Os 4 pilares do IELTS", duration: "22:00", type: "video", free: false, youtubeUrl: "https://www.youtube.com/watch?v=Y8fF6G7K9s", videoId: "Y8fF6G7K9s" },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Empreendedorismo Digital em Angola",
    subtitle: "Construa um negócio online lucrativo com foco no mercado local",
    category: "Negócios",
    accent: "#f59e0b",
    gradientFrom: "#451a03",
    gradientTo: "#78350f",
    level: "Avançado",
    duration: "22h 10min",
    lessons: 90,
    students: 4120,
    rating: 4.7,
    reviews: 563,
    price: "18.000 Kz",
    originalPrice: "36.000 Kz",
    language: "Português",
    tags: ["E-commerce", "Marketing Digital", "Redes Sociais"],
    description: "Do zero ao primeiro cliente. Aprenda a montar e escalar um negócio digital pensado para Angola.",
    whatYouLearn: [
      "Criar uma loja online angolana",
      "Marketing digital com baixo orçamento",
      "Gestão de redes sociais eficaz",
      "Pagamentos e logística em Angola",
      "Escalar o negócio com dados",
      "Parcerias e networking local",
    ],
    mentor: {
      name: "Pedro Lussaty",
      role: "Empreendedor & Fundador de Startup",
      avatar: "PL",
      bio: "Fundou 3 startups em Angola. Investidor e mentor de ecossistemas de inovação africanos.",
      students: 12000,
      courses: 3,
      rating: 4.7,
    },
    modules: [
      {
        id: 1,
        title: "Validação de Mercado Angolano",
        lessons: [
          { id: 1, title: "Entender o consumidor angolano", duration: "20:00", type: "video", free: true, youtubeUrl: "https://www.youtube.com/watch?v=Q9P2K3mN4Xs", videoId: "Q9P2K3mN4Xs" },
          { id: 2, title: "Quiz: Ideia de Negócio", duration: "15 min", type: "quiz", free: false },
        ],
      },
    ],
  },
];

const levelConfig = {
  Iniciante:  { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-400/10", dot: "bg-emerald-500 dark:bg-emerald-400" },
  Intermédio: { color: "text-indigo-600 dark:text-indigo-400",   bg: "bg-indigo-50 dark:bg-indigo-400/10",   dot: "bg-indigo-500 dark:bg-indigo-400"   },
  Avançado:   { color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-400/10",     dot: "bg-amber-500 dark:bg-amber-400"     },
};

// ─── COURSE CARD ────────────────────────────────────────────────────────────
const CourseCard = ({
  course,
  onSelect,
  index,
}: {
  course: Course;
  onSelect: (c: Course) => void;
  index: number;
}) => {
  const lvl = levelConfig[course.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onSelect(course)}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col h-full rounded-3xl overflow-hidden cursor-pointer
        border border-gray-100 bg-white shadow-sm
        hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50
        dark:border-zinc-800 dark:bg-zinc-900
        dark:hover:border-zinc-700
        transition-all duration-300"
    >
      {/* Thumbnail */}
      <div
        className="relative h-48 overflow-hidden flex items-end p-5"
        style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
      >
        {/* Noise */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Glow */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[50px] opacity-25"
          style={{ background: course.accent }}
        />
        {/* Play button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{
              background: `${course.accent}25`,
              border: `1px solid ${course.accent}50`,
              backdropFilter: "blur(8px)",
            }}
          >
            <Play size={18} fill={course.accent} color={course.accent} className="ml-0.5" />
          </div>
        </div>
        {/* Category */}
        <span
          className="relative z-10 text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl"
          style={{
            background: `${course.accent}25`,
            color: course.accent,
            border: `1px solid ${course.accent}40`,
          }}
        >
          {course.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3.5">
        {/* Level + Rating */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg ${lvl.bg} ${lvl.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot}`} />
            {course.level}
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-amber-500 dark:text-amber-400">
            {course.rating}
            <span className="text-gray-400 dark:text-zinc-600 font-normal text-xs">({course.reviews})</span>
          </div>
        </div>

        {/* Title + Subtitle */}
        <div>
          <h3 className="font-bold text-[16px] leading-snug mb-1
            text-gray-900 dark:text-white
            group-hover:text-emerald-600 dark:group-hover:text-emerald-400
            transition-colors">
            {course.title}
          </h3>
          <p className="text-gray-500 dark:text-zinc-500 text-[13px] leading-relaxed line-clamp-2">
            {course.subtitle}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-gray-400 dark:text-zinc-600 text-xs">
          <span className="flex items-center gap-1"><Clock size={11} /> {course.duration}</span>
          <span className="flex items-center gap-1"><Layers size={11} /> {course.lessons} aulas</span>
          <span className="flex items-center gap-1"><Users size={11} /> {course.students.toLocaleString("pt-PT")}</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-zinc-800" />

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-lg tracking-tight text-gray-900 dark:text-white">
              {course.price}
            </span>
            <span className="text-gray-400 dark:text-zinc-700 text-xs line-through">
              {course.originalPrice}
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 text-[11px] font-bold py-2 px-3 rounded-xl transition-all duration-200"
            style={{
              background: `${course.accent}15`,
              color: course.accent,
              border: `1px solid ${course.accent}30`,
            }}
          >
            Ver curso <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MODULE ACCORDION ───────────────────────────────────────────────────────
const ModuleAccordion = ({
  mod,
  idx,
  accent,
  onLessonClick,
}: {
  mod: Module;
  idx: number;
  accent: string;
  onLessonClick: (lesson: Lesson) => void;
}) => {
  const [open, setOpen] = useState(idx === 0);

  const typeIcon = (type: Lesson["type"]) => {
    if (type === "video") return <PlayCircle size={14} style={{ color: accent }} />;
    if (type === "quiz")  return <BarChart2  size={14} className="text-violet-500 dark:text-violet-400" />;
    return                       <FileText   size={14} className="text-sky-500 dark:text-sky-400" />;
  };

  return (
    <div className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4
          hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0"
            style={{ background: `${accent}15`, color: accent }}
          >
            {idx + 1}
          </span>
          <span className="text-gray-900 dark:text-zinc-200 font-semibold text-sm">{mod.title}</span>
          <span className="text-gray-400 dark:text-zinc-600 text-xs">{mod.lessons.length} aulas</span>
        </div>
        {open
          ? <ChevronUp   size={15} className="text-gray-400 dark:text-zinc-600 shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 dark:text-zinc-600 shrink-0" />
        }
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-3 space-y-0.5 border-t border-gray-100 dark:border-zinc-800/60">
              {mod.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => onLessonClick(lesson)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl
                    hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    {typeIcon(lesson.type)}
                    <span className={`text-[13px] ${
                      lesson.free
                        ? "text-gray-800 dark:text-zinc-200"
                        : "text-gray-400 dark:text-zinc-500"
                    }`}>
                      {lesson.title}
                    </span>
                    {lesson.free && (
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md"
                        style={{ background: `${accent}15`, color: accent }}
                      >
                        Grátis
                      </span>
                    )}
                    {!lesson.free && (
                      <Lock size={10} className="text-gray-300 dark:text-zinc-700" />
                    )}
                  </div>
                  <span className="text-gray-400 dark:text-zinc-700 text-xs font-mono shrink-0">
                    {lesson.duration}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function MentoriasHub() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [filter, setFilter] = useState("Todos");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPaid, setIsPaid] = useState<Record<number, boolean>>({});

  const categories = ["Todos", ...Array.from(new Set(courses.map((c) => c.category)))];
  const filtered = filter === "Todos" ? courses : courses.filter((c) => c.category === filter);

  const handleStartCourse = (course: Course) => {
    if (isPaid[course.id] || course.price === "Grátis") {
      const firstLesson = course.modules[0]?.lessons.find(l => l.type === "video");
      if (firstLesson) setActiveLesson(firstLesson);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePlayLesson = (lesson: Lesson, course: Course) => {
    if (lesson.free || isPaid[course.id] || course.price === "Grátis") {
      setActiveLesson(lesson);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = (courseId: number) => {
    setIsPaid(prev => ({ ...prev, [courseId]: true }));
    setShowPaymentModal(false);
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const firstLesson = course.modules[0]?.lessons.find(l => l.type === "video");
      if (firstLesson) setActiveLesson(firstLesson);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 transition-colors duration-300">
      <AnimatePresence mode="wait">

        {/* ═══════════════════ LISTA ═══════════════════ */}
        {!selectedCourse ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header */}
            <div className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60">
              <div className="max-w-7xl mx-auto px-6 py-14">



                {/* Title row + Stats */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                  <div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-3
                      text-gray-900 dark:text-white">
                      Aprenda com os<br />
                      <span className="text-gray-400 dark:text-zinc-500">melhores de Angola.</span>
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-500 text-base max-w-lg leading-relaxed">
                      Cursos 100% práticos, criados por especialistas angolanos para o mercado angolano.
                    </p>
                  </div>

                  <div className="flex gap-8 shrink-0">
                    {[
                      { value: `${courses.length}+`, label: "Cursos"    },
                      { value: "19K+",               label: "Alunos"    },
                      { value: "4.8★",               label: "Avaliação" },
                    ].map((s) => (
                      <div key={s.label} className="text-right">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-gray-400 dark:text-zinc-600 text-xs uppercase tracking-wider mt-0.5">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-2 mt-8 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        filter === cat
                          ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                          : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filtered.map((course, i) => (
                  <CourseCard key={course.id} course={course} onSelect={setSelectedCourse} index={i} />
                ))}
              </div>
            </div>
          </motion.div>

        ) : (

        /* ═══════════════════ DETALHE ════════════════════ */
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12"
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-10 text-gray-400 dark:text-zinc-600">
              <button
                onClick={() => setSelectedCourse(null)}
                className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1.5 font-medium"
              >
                <ArrowLeft size={14} /> Mentorias
              </button>
              <ChevronRight size={13} />
              <span className="text-gray-500 dark:text-zinc-500">{selectedCourse.category}</span>
              <ChevronRight size={13} />
              <span className="text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">
                {selectedCourse.title}
              </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">

              {/* Conteúdo principal */}
              <div className="lg:col-span-2 space-y-10">

                {/* Cabeçalho do curso */}
                <section>
                  <span
                    className="inline-flex text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest mb-4"
                    style={{
                      background: `${selectedCourse.accent}12`,
                      color: selectedCourse.accent,
                      border: `1px solid ${selectedCourse.accent}25`,
                    }}
                  >
                    {selectedCourse.category}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-3
                    text-gray-900 dark:text-white">
                    {selectedCourse.title}
                  </h1>
                  <p className="text-gray-500 dark:text-zinc-400 text-lg leading-relaxed">
                    {selectedCourse.subtitle}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-gray-500 dark:text-zinc-500">
                    <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-bold">
                      {selectedCourse.rating} ({selectedCourse.reviews} avaliações)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={13} /> {selectedCourse.students.toLocaleString("pt-PT")} alunos
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe size={13} /> {selectedCourse.language}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} /> {selectedCourse.duration}
                    </span>
                  </div>
                </section>

                {/* Mentor */}
                <div className="flex items-center gap-4 p-5 rounded-2xl
                  bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                    style={{ background: `${selectedCourse.accent}20`, color: selectedCourse.accent }}
                  >
                    {selectedCourse.mentor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-bold text-sm">
                      {selectedCourse.mentor.name}
                    </p>
                    <p className="text-gray-500 dark:text-zinc-500 text-xs mt-0.5">
                      {selectedCourse.mentor.role}
                    </p>
                    <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1.5 leading-relaxed">
                      {selectedCourse.mentor.bio}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-900 dark:text-white font-black text-lg">
                      {selectedCourse.mentor.students.toLocaleString("pt-PT")}
                    </p>
                    <p className="text-gray-400 dark:text-zinc-600 text-[10px] uppercase tracking-wider">
                      alunos
                    </p>
                  </div>
                </div>

                {/* O que vais dominar */}
                <section>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2.5">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${selectedCourse.accent}18` }}
                    >
                      <Target size={14} style={{ color: selectedCourse.accent }} />
                    </span>
                    O que vais dominar
                  </h2>
                  <div className="grid md:grid-cols-2 gap-2.5">
                    {selectedCourse.whatYouLearn.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3.5 rounded-xl text-sm leading-relaxed
                          bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800
                          text-gray-600 dark:text-zinc-400"
                      >
                        <CheckCircle2 size={15} style={{ color: selectedCourse.accent }} className="shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedCourse.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 rounded-lg
                        text-gray-500 dark:text-zinc-500
                        bg-gray-100 dark:bg-zinc-800
                        border border-gray-200 dark:border-zinc-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Módulos */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${selectedCourse.accent}18` }}
                      >
                        <BookOpen size={14} style={{ color: selectedCourse.accent }} />
                      </span>
                      Conteúdo do Curso
                    </h2>
                    <span className="text-gray-400 dark:text-zinc-600 text-xs">
                      {selectedCourse.lessons} aulas · {selectedCourse.duration}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {selectedCourse.modules.map((mod, i) => (
                      <ModuleAccordion 
                        key={mod.id} 
                        mod={mod} 
                        idx={i} 
                        accent={selectedCourse.accent}
                        onLessonClick={(lesson) => handlePlayLesson(lesson, selectedCourse)}
                      />
                    ))}
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <aside className="lg:sticky lg:top-8 h-fit space-y-3">
                <div className="rounded-3xl overflow-hidden
                  border border-gray-100 dark:border-zinc-800
                  bg-white dark:bg-zinc-900 shadow-sm">

                  {/* Thumbnail */}
                  <div
                    className="h-32 relative flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${selectedCourse.gradientFrom}, ${selectedCourse.gradientTo})` }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.15]"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
                      }}
                    />
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `${selectedCourse.accent}25`,
                        border: `1px solid ${selectedCourse.accent}40`,
                      }}
                    >
                      <Play size={20} fill={selectedCourse.accent} color={selectedCourse.accent} className="ml-0.5" />
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Preço */}
                    <div>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-3xl font-black text-gray-900 dark:text-white">
                          {selectedCourse.price}
                        </span>
                        <span className="text-gray-400 dark:text-zinc-600 line-through text-sm">
                          {selectedCourse.originalPrice}
                        </span>
                      </div>
                      <p
                        className="text-[11px] font-bold mt-1.5 flex items-center gap-1.5"
                        style={{ color: selectedCourse.accent }}
                      >
                        <Zap size={11} fill="currentColor" /> 50% desconto por tempo limitado
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleStartCourse(selectedCourse)}
                        className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                        style={{ background: selectedCourse.accent, color: "#000" }}
                      >
                        <Play size={15} fill="currentColor" /> Começar Agora
                      </button>
                      <button className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors
                        bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700
                        text-gray-700 dark:text-zinc-300
                        hover:bg-gray-200 dark:hover:bg-zinc-700">
                        <MessageCircle size={15} /> Falar com Suporte
                      </button>
                    </div>

                    {/* Inclui */}
                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2.5">
                      <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-widest">
                        Inclui:
                      </p>
                      {[
                        { icon: Clock,    text: `${selectedCourse.duration} de conteúdo` },
                        { icon: Globe,    text: "Acesso vitalício"                       },
                        { icon: Award,    text: "Certificado Profissional"               },
                        { icon: Download, text: "Materiais para download"                },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-500">
                          <Icon size={13} style={{ color: selectedCourse.accent }} />
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Garantia */}
                <div className="rounded-2xl p-4 text-center
                  bg-gray-50 dark:bg-zinc-900
                  border border-gray-100 dark:border-zinc-800">
                  <Award size={22} className="mx-auto mb-2 text-gray-300 dark:text-zinc-700" />
                  <p className="text-gray-700 dark:text-zinc-400 text-xs font-bold">Garantia de 7 dias</p>
                  <p className="text-gray-400 dark:text-zinc-600 text-xs mt-1 leading-relaxed">
                    Não ficou satisfeito? Devolvemos o seu dinheiro.
                  </p>
                </div>
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setActiveLesson(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl bg-zinc-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h3 className="text-white font-semibold">{activeLesson.title}</h3>
                <button
                  onClick={() => setActiveLesson(null)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
              <div className="aspect-video">
                {activeLesson.videoId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${activeLesson.videoId}?autoplay=1`}
                    title={activeLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <p>Vídeo não disponível</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Pagamento</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    <X size={20} className="text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Curso</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedCourse.title}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Valor</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedCourse.price}</p>
                    {selectedCourse.originalPrice !== selectedCourse.price && (
                      <p className="text-sm text-zinc-400 line-through">{selectedCourse.originalPrice}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handlePaymentSuccess(selectedCourse.id)}
                    className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2
                      bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                  >
                    <CreditCard size={18} /> Pagar Agora (Demo)
                  </button>
                  <p className="text-xs text-center text-zinc-400">
                    Pagamento seguro. Receberá o acesso instantaneamente.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
