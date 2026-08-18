import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GraduationCap, Loader2, Save, School, BookOpen, MapPin, Globe, Calendar, Award, Heart, Briefcase, Camera, Map, Cake, Phone, User, Flag, Building2, Target, GemIcon, GalleryThumbnailsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/api/useGetProfile";
import { perfilAcademicoApi } from "@/api/perfil-academico";
import { api, getUploadUrl } from "@/lib/axios";
import toast from "react-hot-toast";

function toArray(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === "string") return val.split(",").filter(Boolean);
  return [];
}

function calcularAfroScore(perfil: Record<string, any>) {
  let score = 0;
  const maxScore = 100;
  const pontosFortes: string[] = [];
  const pontosMelhorar: string[] = [];

  // ── Formação Académica (max 25) ──
  if (perfil.nivelEnsino) { score += 5; pontosFortes.push("Nível de ensino definido"); }
  else pontosMelhorar.push("Falta definir o nível de ensino");
  if (perfil.instituicao) { score += 5; pontosFortes.push("Instituição de ensino registada"); }
  else pontosMelhorar.push("Falta registar a instituição de ensino");
  if (perfil.curso) { score += 5; pontosFortes.push("Curso registado"); }
  else pontosMelhorar.push("Falta registar o curso");
  if (perfil.media) {
    const m = parseFloat(perfil.media.replace(",", "."));
    if (!isNaN(m)) {
      if (m >= 16) { score += 8; pontosFortes.push("Média excelente"); }
      else if (m >= 14) { score += 6; pontosFortes.push("Boa média"); }
      else if (m >= 10) { score += 4; pontosFortes.push("Média positiva"); }
      else { score += 1; pontosMelhorar.push("Média baixa"); }
    }
  } else pontosMelhorar.push("Falta registar a média");
  if (perfil.anoConclusao) { score += 2; }

  // ── Competências Linguísticas (max 20) ──
  if (perfil.idiomas) {
    const langs = perfil.idiomas.toLowerCase();
    score += 5;
    if (langs.includes("avançado") || langs.includes("avançado") || langs.includes("fluente") || langs.includes("nativo") || langs.includes("avancado")) {
      score += 3;
      pontosFortes.push("Nível avançado em língua estrangeira");
    }
  } else pontosMelhorar.push("Falta registar competências linguísticas");
  const certs = toArray(perfil.certificadosIdiomas);
  if (certs.length > 0) {
    score += Math.min(certs.length * 4, 12);
    pontosFortes.push(`${certs.length} certificado(s) de idioma`);
  } else pontosMelhorar.push("Falta certificado de idioma (TOEFL, IELTS, etc.)");

  // ── Experiência Profissional (max 15) ──
  const hasExp = perfil.experienciaProfissional || perfil.historicoProfissional;
  if (hasExp) { score += 5; pontosFortes.push("Experiência profissional registada"); }
  else pontosMelhorar.push("Falta experiência profissional");
  if (perfil.areaActuacao && perfil.cargoOcupado) { score += 5; pontosFortes.push("Área de actuação e cargo definidos"); }
  else pontosMelhorar.push("Falta definir área de actuação ou cargo");
  const ativs = toArray(perfil.atividadesExtracurriculares);
  if (ativs.length > 0) {
    score += Math.min(ativs.length * 2, 5);
    if (ativs.includes("VOLUNTARIADO")) pontosFortes.push("Experiência em voluntariado");
    if (ativs.includes("LIDERANCA_ESTUDANTIL")) pontosFortes.push("Experiência em liderança estudantil");
    if (ativs.includes("MONITORIA")) pontosFortes.push("Experiência em monitoria");
    if (ativs.includes("PESQUISA_CIENTIFICA")) pontosFortes.push("Experiência em pesquisa científica");
    if (ativs.includes("EMPREENDEDORISMO")) pontosFortes.push("Experiência em empreendedorismo");
    if (ativs.includes("PROJECTOS_SOCIAIS")) pontosFortes.push("Participação em projectos sociais");
  } else pontosMelhorar.push("Falta experiência extra-curricular (voluntariado, liderança, etc.)");

  // ── Produção Científica (max 15) ──
  const prods = toArray(perfil.producaoCientifica);
  if (prods.length > 0) {
    score += Math.min(prods.length * 3, 10);
    pontosFortes.push("Produção científica registada");
  } else pontosMelhorar.push("Falta produção científica (artigos, resumos, etc.)");
  if (perfil.descricaoProducao) { score += 5; }

  // ── Documentos (max 10) ──
  const docs = toArray(perfil.documentos);
  if (docs.length > 0) {
    score += Math.min(docs.length * 2, 10);
    if (docs.includes("PASSAPORTE")) pontosFortes.push("Passaporte disponível");
    if (docs.includes("CURRICULO")) pontosFortes.push("Currículo disponível");
    if (docs.includes("CARTA_MOTIVACAO")) pontosFortes.push("Carta de motivação disponível");
    if (docs.includes("CARTAS_RECOMENDACAO")) pontosFortes.push("Cartas de recomendação disponíveis");
  } else pontosMelhorar.push("Falta registar documentos (passaporte, currículo, etc.)");

  // ── Motivação e Objectivos (max 10) ──
  if (perfil.motivacoes) { score += 4; pontosFortes.push("Motivações registadas"); }
  else pontosMelhorar.push("Falta registar motivações");
  if (perfil.objetivosAcademicos) { score += 3; }
  else pontosMelhorar.push("Falta definir objectivos académicos");
  if (perfil.areaInteresse) { score += 3; }

  // ── Mobilidade (max 5) ──
  if (perfil.mudarPais === "SIM") { score += 3; pontosFortes.push("Disponibilidade para mudar de país"); }
  if (perfil.qualquerContinente === "SIM") { score += 2; }

  return { score: Math.min(score, maxScore), maxScore, pontosFortes, pontosMelhorar };
}

function calcularCompletudePerfil(perfil: Record<string, any>): number {
  const fields: { key: string; type: "string" | "array" }[] = [
    // Pessoais
    { key: "dataNascimento", type: "string" },
    { key: "genero", type: "string" },
    { key: "nacionalidade", type: "string" },
    { key: "pais", type: "string" },
    { key: "provincia", type: "string" },
    { key: "municipio", type: "string" },
    { key: "whatsapp", type: "string" },
    // Formação
    { key: "nivelEnsino", type: "string" },
    { key: "instituicao", type: "string" },
    { key: "curso", type: "string" },
    { key: "nivel", type: "string" },
    { key: "anoConclusao", type: "string" },
    { key: "media", type: "string" },
    // Interesses
    { key: "areaInteresse", type: "array" },
    { key: "cursoDesejado", type: "string" },
    { key: "quandoPretendeIniciar", type: "string" },
    { key: "objetivosAcademicos", type: "string" },
    // Idiomas
    { key: "idiomas", type: "string" },
    { key: "certificadosIdiomas", type: "array" },
    // Profissional
    { key: "areaActuacao", type: "string" },
    { key: "cargoOcupado", type: "string" },
    { key: "historicoProfissional", type: "string" },
    { key: "experienciaProfissional", type: "string" },
    // Extracurriculares
    { key: "atividadesExtracurriculares", type: "array" },
    { key: "descricaoAtividades", type: "string" },
    // Produção Científica
    { key: "producaoCientifica", type: "array" },
    { key: "descricaoProducao", type: "string" },
    // Financeiro
    { key: "bolsaIntegral", type: "string" },
    { key: "bolsaParcial", type: "string" },
    { key: "custeiaPassagem", type: "string" },
    // Destino/Mobilidade
    { key: "preferenciaDestino", type: "string" },
    { key: "mudarPais", type: "string" },
    { key: "qualquerContinente", type: "string" },
    // Documentos
    { key: "documentos", type: "array" },
    // Motivação
    { key: "motivacoes", type: "string" },
  ];
  const filled = fields.filter((f) => {
    const val = perfil[f.key];
    if (f.type === "array") return Array.isArray(val) && val.length > 0;
    return typeof val === "string" && val.trim() !== "";
  }).length;
  return Math.round((filled / fields.length) * 100);
}

function calcularFaixaEtaria(dataNascimento: string): string | null {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento);
  if (isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;

  if (idade < 13) return "Criança";
  if (idade < 18) return "Adolescente";
  if (idade < 26) return "Jovem Adulto";
  if (idade < 36) return "Adulto";
  if (idade < 50) return "Adulto Experiente";
  return "Sénior";
}

export function PerfilAcademicoPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [nivelEnsino, setNivelEnsino] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [curso, setCurso] = useState("");
  const [nivel, setNivel] = useState("");
  const [anoConclusao, setAnoConclusao] = useState("");
  const [media, setMedia] = useState("");
  const [pais, setPais] = useState("");
  const [genero, setGenero] = useState("");
  const [nacionalidade, setNacionalidade] = useState("");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [areaInteresse, setAreaInteresse] = useState<string[]>([]);
  const [cursoDesejado, setCursoDesejado] = useState("");
  const [objetivosAcademicos, setObjetivosAcademicos] = useState("");
  const [quandoPretendeIniciar, setQuandoPretendeIniciar] = useState("");
  const [idiomas, setIdiomas] = useState("");
  const [certificadosIdiomas, setCertificadosIdiomas] = useState<string[]>([]);
  const [dataNascimento, setDataNascimento] = useState("");
  const [motivacoes, setMotivacoes] = useState("");
  const [experienciaProfissional, setExperienciaProfissional] = useState("");
  const [areaActuacao, setAreaActuacao] = useState("");
  const [cargoOcupado, setCargoOcupado] = useState("");
  const [historicoProfissional, setHistoricoProfissional] = useState("");
  const [atividadesExtracurriculares, setAtividadesExtracurriculares] = useState<string[]>([]);
  const [descricaoAtividades, setDescricaoAtividades] = useState("");
  const [producaoCientifica, setProducaoCientifica] = useState<string[]>([]);
  const [descricaoProducao, setDescricaoProducao] = useState("");
  const [bolsaIntegral, setBolsaIntegral] = useState("");
  const [bolsaParcial, setBolsaParcial] = useState("");
  const [custeiaPassagem, setCusteiaPassagem] = useState("");
  const [preferenciaDestino, setPreferenciaDestino] = useState("");
  const [mudarPais, setMudarPais] = useState("");
  const [qualquerContinente, setQualquerContinente] = useState("");
  const [documentos, setDocumentos] = useState<string[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["perfil-academico"],
    queryFn: perfilAcademicoApi.obter,
  });

  const perfil = apiData?.perfil;
  const afroScoreData = apiData?.afroScore;
  const completudeData = apiData?.completude;

  useEffect(() => {
    if (perfil) {
      setNivelEnsino(perfil.nivelEnsino || "");
      setInstituicao(perfil.instituicao || "");
      setCurso(perfil.curso || "");
      setNivel(perfil.nivel || "");
      setAnoConclusao(perfil.anoConclusao || "");
      setMedia(perfil.media || "");
      setPais(perfil.pais || "");
      setGenero(perfil.genero || "");
      setNacionalidade(perfil.nacionalidade || "");
      setCidade(perfil.cidade || "");
      setWhatsapp(perfil.whatsapp || "");
      setProvincia(perfil.provincia || "");
      setMunicipio(perfil.municipio || "");
      setIdiomas(perfil.idiomas || "");
      setCertificadosIdiomas(perfil.certificadosIdiomas ? perfil.certificadosIdiomas.split(",") : []);
      setDataNascimento(perfil.dataNascimento || "");
      setAreaInteresse(perfil.areaInteresse ? perfil.areaInteresse.split(",") : []);
      setCursoDesejado(perfil.cursoDesejado || "");
      setObjetivosAcademicos(perfil.objetivosAcademicos || "");
      setQuandoPretendeIniciar(perfil.quandoPretendeIniciar || "");
      setMotivacoes(perfil.motivacoes || "");
      setExperienciaProfissional(perfil.experienciaProfissional || "");
      setAreaActuacao(perfil.areaActuacao || "");
      setCargoOcupado(perfil.cargoOcupado || "");
      setHistoricoProfissional(perfil.historicoProfissional || "");
      setAtividadesExtracurriculares(perfil.atividadesExtracurriculares ? perfil.atividadesExtracurriculares.split(",") : []);
      setDescricaoAtividades(perfil.descricaoAtividades || "");
      setProducaoCientifica(perfil.producaoCientifica ? perfil.producaoCientifica.split(",") : []);
      setDescricaoProducao(perfil.descricaoProducao || "");
      setBolsaIntegral(perfil.bolsaIntegral || "");
      setBolsaParcial(perfil.bolsaParcial || "");
      setCusteiaPassagem(perfil.custeiaPassagem || "");
      setPreferenciaDestino(perfil.preferenciaDestino || "");
      setMudarPais(perfil.mudarPais || "");
      setQualquerContinente(perfil.qualquerContinente || "");
      setDocumentos(perfil.documentos ? perfil.documentos.split(",") : []);
      if (perfil.fotoUrl) {
        setFotoPreview(getUploadUrl(`/uploads/${perfil.fotoUrl}`));
      }
    }
  }, [perfil]);

  const faixaEtaria = useMemo(() => calcularFaixaEtaria(dataNascimento), [dataNascimento]);

  const salvarMutation = useMutation({
    mutationFn: perfilAcademicoApi.salvar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfil-academico"] });
      toast.success("Perfil académico salvo com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao salvar perfil");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nivelEnsino) {
      toast.error("Selecione o nível de ensino");
      return;
    }

    const formData = new FormData();
    formData.append("nivelEnsino", nivelEnsino);
    if (instituicao) formData.append("instituicao", instituicao);
    if (curso) formData.append("curso", curso);
    if (nivel) formData.append("nivel", nivel);
    if (anoConclusao) formData.append("anoConclusao", anoConclusao);
    if (media) formData.append("media", media);
    if (pais) formData.append("pais", pais);
    if (genero) formData.append("genero", genero);
    if (nacionalidade) formData.append("nacionalidade", nacionalidade);
    if (cidade) formData.append("cidade", cidade);
    if (whatsapp) formData.append("whatsapp", whatsapp);
    if (provincia) formData.append("provincia", provincia);
    if (municipio) formData.append("municipio", municipio);
    if (idiomas) formData.append("idiomas", idiomas);
    if (dataNascimento) formData.append("dataNascimento", dataNascimento);
    if (areaInteresse.length > 0) formData.append("areaInteresse", areaInteresse.join(","));
    if (cursoDesejado) formData.append("cursoDesejado", cursoDesejado);
    if (objetivosAcademicos) formData.append("objetivosAcademicos", objetivosAcademicos);
    if (quandoPretendeIniciar) formData.append("quandoPretendeIniciar", quandoPretendeIniciar);
    if (certificadosIdiomas.length > 0) formData.append("certificadosIdiomas", certificadosIdiomas.join(","));
    if (motivacoes) formData.append("motivacoes", motivacoes);
    if (experienciaProfissional) formData.append("experienciaProfissional", experienciaProfissional);
    if (areaActuacao) formData.append("areaActuacao", areaActuacao);
    if (cargoOcupado) formData.append("cargoOcupado", cargoOcupado);
    if (historicoProfissional) formData.append("historicoProfissional", historicoProfissional);
    if (atividadesExtracurriculares.length > 0) formData.append("atividadesExtracurriculares", atividadesExtracurriculares.join(","));
    if (descricaoAtividades) formData.append("descricaoAtividades", descricaoAtividades);
    if (producaoCientifica.length > 0) formData.append("producaoCientifica", producaoCientifica.join(","));
    if (descricaoProducao) formData.append("descricaoProducao", descricaoProducao);
    if (bolsaIntegral) formData.append("bolsaIntegral", bolsaIntegral);
    if (bolsaParcial) formData.append("bolsaParcial", bolsaParcial);
    if (custeiaPassagem) formData.append("custeiaPassagem", custeiaPassagem);
    if (preferenciaDestino) formData.append("preferenciaDestino", preferenciaDestino);
    if (mudarPais) formData.append("mudarPais", mudarPais);
    if (qualquerContinente) formData.append("qualquerContinente", qualquerContinente);
    if (documentos.length > 0) formData.append("documentos", documentos.join(","));
    if (fotoFile) formData.append("foto", fotoFile);

    salvarMutation.mutate(formData);
  };

  const faixaEtariaColors: Record<string, string> = {
    "Criança": "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
    "Adolescente": "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    "Jovem Adulto": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    "Adulto": "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    "Adulto Experiente": "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
    "Sénior": "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">
            Perfil Académico
          </h1>
          <p className="text-gray-500 dark:text-zinc-400">
            Preencha o seu perfil académico para facilitar as suas candidaturas.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6 p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
          >
            {/* ═══════ PERFIL COMPLETUDE + AFROSCORE ═══════ */}
            {(() => {
              const currentData = {
                nivelEnsino, instituicao, curso, nivel, anoConclusao, media,
                pais, genero, nacionalidade, provincia, municipio, whatsapp, dataNascimento,
                areaInteresse, cursoDesejado, quandoPretendeIniciar, objetivosAcademicos,
                idiomas, certificadosIdiomas,
                experienciaProfissional, historicoProfissional, areaActuacao, cargoOcupado,
                atividadesExtracurriculares, descricaoAtividades,
                producaoCientifica, descricaoProducao,
                bolsaIntegral, bolsaParcial, custeiaPassagem,
                preferenciaDestino, mudarPais, qualquerContinente,
                documentos,
                motivacoes,
              };
              const completude = completudeData ?? calcularCompletudePerfil(currentData);
              const result = afroScoreData ?? calcularAfroScore(currentData);
              const { score, maxScore, pontosFortes, pontosMelhorar } = result;
              const pct = Math.round((score / maxScore) * 100);
              const color = pct >= 70 ? "text-emerald-500" : pct >= 40 ? "text-amber-500" : "text-red-500";
              const barColor = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";
              const compColor = completude >= 70 ? "text-emerald-500" : completude >= 40 ? "text-amber-500" : "text-red-500";
              const compBarColor = completude >= 70 ? "bg-emerald-500" : completude >= 40 ? "bg-amber-500" : "bg-red-500";
              return (
                <div className="space-y-3">
                  {/* Completeness */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-zinc-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GalleryThumbnailsIcon size={18} className="text-blue-500" />
                        Perfil
                      </h3>
                      <span className={`text-2xl font-extrabold ${compColor}`}>{completude}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-white/[0.08] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${compBarColor}`} style={{ width: `${completude}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
                      {completude < 50
                        ? "Preencha mais campos para fortalecer o teu perfil"
                        : completude < 70
                          ? "Continua a preencher o teu perfil para melhores oportunidades"
                          : "Perfil bem preenchido! Completude excelente."}
                    </p>
                  </div>
                  {/* AfroScore */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.06] border border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Award size={18} className="text-emerald-500" />
                        AfroScore — Competitividade
                      </h3>
                      <span className={`text-2xl font-extrabold ${color}`}>{score}/{maxScore}</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 dark:bg-white/[0.08] rounded-full mb-4 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {pontosFortes.length > 0 && (
                        <div>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">✅ Pontos Fortes</p>
                          <ul className="space-y-1">
                            {pontosFortes.map((p, i) => <li key={i} className="text-gray-600 dark:text-zinc-400">• {p}</li>)}
                          </ul>
                        </div>
                      )}
                      {pontosMelhorar.length > 0 && (
                        <div>
                          <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1.5">⚠️ Pontos a Melhorar</p>
                          <ul className="space-y-1">
                            {pontosMelhorar.map((p, i) => <li key={i} className="text-gray-600 dark:text-zinc-400">• {p}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Foto */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-white/[0.06] border-2 border-emerald-200 dark:border-emerald-800">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera size={28} />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="foto-upload"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center cursor-pointer hover:bg-emerald-400 transition-colors shadow-lg"
                >
                  <Camera size={14} />
                </label>
                <input id="foto-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setFotoFile(file); setFotoPreview(URL.createObjectURL(file)); }
                }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.nome}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Adicione uma foto de perfil</p>
                {faixaEtaria && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 mt-2 text-xs font-medium rounded-full ${faixaEtariaColors[faixaEtaria] || ""}`}>
                    {faixaEtaria}
                  </span>
                )}
              </div>
            </div>

            {/* ═══════ INFORMAÇÕES PESSOAIS ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={16} className="text-emerald-500" />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Cake size={14} /> Data de Nascimento
                  </Label>
                  <Input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className="mt-1" />
                  {faixaEtaria && (
                    <p className="text-xs text-gray-400 mt-1">Faixa etária: <span className="font-medium text-gray-600 dark:text-zinc-300">{faixaEtaria}</span></p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <GalleryThumbnailsIcon size={14} /> Género (opcional)
                  </Label>
                  <Select value={genero} onValueChange={setGenero}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASCULINO">Masculino</SelectItem>
                      <SelectItem value="FEMININO">Feminino</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                      <SelectItem value="PREFIRO_NAO_DIZER">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Flag size={14} /> Nacionalidade
                  </Label>
                  <Input value={nacionalidade} onChange={(e) => setNacionalidade(e.target.value)} placeholder="Ex: Angolana" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <MapPin size={14} /> País de Origem
                  </Label>
                  <Input value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Ex: Angola" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Map size={14} /> Província
                  </Label>
                  <Input value={provincia} onChange={(e) => setProvincia(e.target.value)} placeholder="Ex: Luanda, Benguela..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Building2 size={14} /> Cidade / Município
                  </Label>
                  <Input value={cidade || municipio} onChange={(e) => { setCidade(e.target.value); setMunicipio(e.target.value); }} placeholder="Ex: Talatona, Kilamba..." className="mt-1" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ CONTACTOS ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone size={16} className="text-emerald-500" />
                Contactos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe size={14} /> Email
                  </Label>
                  <Input value={user?.email || ""} disabled className="mt-1 text-gray-500 dark:text-zinc-400" />
                  <p className="text-[10px] text-gray-400 mt-1">O email da sua conta</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Phone size={14} /> WhatsApp / Telemóvel
                  </Label>
                  <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: +244 900 000 000" className="mt-1" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ FORMAÇÃO ACADÉMICA ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald-500" />
                Formação Académica
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <GraduationCap size={14} /> Nível de Ensino *
                  </Label>
                  <Select value={nivelEnsino} onValueChange={setNivelEnsino}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENSINO_MEDIO">Ensino Médio</SelectItem>
                      <SelectItem value="GRADUACAO">Graduação</SelectItem>
                      <SelectItem value="MESTRADO">Mestrado</SelectItem>
                      <SelectItem value="DOUTORAMENTO">Doutoramento</SelectItem>
                      <SelectItem value="POS_DOUTORADO">Pós-Doutorado</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <School size={14} /> Instituição
                  </Label>
                  <Input value={instituicao} onChange={(e) => setInstituicao(e.target.value)} placeholder="Nome da instituição" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <BookOpen size={14} /> Curso
                  </Label>
                  <Input value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Nome do curso" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Award size={14} /> Nível / Ano
                  </Label>
                  <Select value={nivel} onValueChange={setNivel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1_ANO">1º Ano</SelectItem>
                      <SelectItem value="2_ANO">2º Ano</SelectItem>
                      <SelectItem value="3_ANO">3º Ano</SelectItem>
                      <SelectItem value="4_ANO">4º Ano</SelectItem>
                      <SelectItem value="5_ANO">5º Ano</SelectItem>
                      <SelectItem value="6_ANO">6º Ano</SelectItem>
                      <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar size={14} /> Ano de Conclusão
                  </Label>
                  <Input value={anoConclusao} onChange={(e) => setAnoConclusao(e.target.value)} placeholder="Ex: 2026" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Award size={14} /> Média / Classificação
                  </Label>
                  <Input value={media} onChange={(e) => setMedia(e.target.value)} placeholder="Ex: 14 valores" className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe size={14} /> Idiomas
                  </Label>
                  <Input value={idiomas} onChange={(e) => setIdiomas(e.target.value)} placeholder="Ex: Português (nativo), Inglês (avançado)" className="mt-1" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ ÁREAS DE INTERESSE ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                Áreas de Interesse
              </h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">Selecione as áreas do seu interesse (pode escolher várias)</p>
              <div className="flex flex-wrap gap-2">
                {["SAUDE", "ENGENHARIA", "ARTES", "EDUCACAO", "AGRICULTURA", "TECNOLOGIA", "DIREITO", "NEGOCIOS"].map((area) => {
                  const labels: Record<string, string> = {
                    SAUDE: "Saúde",
                    ENGENHARIA: "Engenharia",
                    ARTES: "Artes",
                    EDUCACAO: "Educação",
                    AGRICULTURA: "Agricultura",
                    TECNOLOGIA: "Tecnologia",
                    DIREITO: "Direito",
                    NEGOCIOS: "Negócios",
                  };
                  const selected = areaInteresse.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setAreaInteresse((prev) =>
                          prev.includes(area)
                            ? prev.filter((a) => a !== area)
                            : [...prev, area]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        selected
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                      }`}
                    >
                      {labels[area]}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <BookOpen size={14} /> Curso Desejado
                  </Label>
                  <Input value={cursoDesejado} onChange={(e) => setCursoDesejado(e.target.value)} placeholder="Ex: Medicina, Engenharia Informática, Direito..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Calendar size={14} /> Quando Pretende Iniciar
                  </Label>
                  <Select value={quandoPretendeIniciar} onValueChange={setQuandoPretendeIniciar}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMEDIATAMENTE">Imediatamente</SelectItem>
                      <SelectItem value="PROXIMO_SEMESTRE">Próximo Semestre</SelectItem>
                      <SelectItem value="PROXIMO_ANO">Próximo Ano</SelectItem>
                      <SelectItem value="EM_2_ANOS">Em 2 Anos</SelectItem>
                      <SelectItem value="INDEFINIDO">Ainda Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ OBJECTIVOS ACADÉMICOS ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target size={16} className="text-emerald-500" />
                Objectivos Académicos
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Heart size={14} /> Descreva os seus objectivos académicos
                  </Label>
                  <Textarea value={objetivosAcademicos} onChange={(e) => setObjetivosAcademicos(e.target.value)} placeholder="Ex: Concluir a graduação, realizar um intercâmbio, ingressar no mestrado..." className="mt-1 min-h-[100px]" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ COMPETÊNCIAS LINGUÍSTICAS ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe size={16} className="text-emerald-500" />
                Competências Linguísticas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe size={14} /> Línguas e Nível
                  </Label>
                  <Textarea value={idiomas} onChange={(e) => setIdiomas(e.target.value)} placeholder="Ex: Português (Nativo), Inglês (Avançado), Francês (Intermediário), Espanhol (Básico)..." className="mt-1 min-h-[80px]" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Award size={14} /> Certificações
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "TOEFL", label: "TOEFL" },
                      { value: "IELTS", label: "IELTS" },
                      { value: "DUOLINGO", label: "Duolingo English Test" },
                      { value: "DELF", label: "DELF" },
                      { value: "TESTDAF", label: "TestDaF" },
                    ].map((cert) => {
                      const selected = certificadosIdiomas.includes(cert.value);
                      return (
                        <button
                          key={cert.value}
                          type="button"
                          onClick={() => {
                            setCertificadosIdiomas((prev) =>
                              selected ? prev.filter((c) => c !== cert.value) : [...prev, cert.value]
                            );
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            selected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                          }`}
                        >
                          {cert.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ EXPERIÊNCIA PROFISSIONAL ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-500" />
                Experiência Profissional
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Briefcase size={14} /> Área de Actuação
                  </Label>
                  <Input value={areaActuacao} onChange={(e) => setAreaActuacao(e.target.value)} placeholder="Ex: Saúde, Educação, Tecnologia..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <User size={14} /> Cargo Ocupado
                  </Label>
                  <Input value={cargoOcupado} onChange={(e) => setCargoOcupado(e.target.value)} placeholder="Ex: Professor, Enfermeiro, Programador..." className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Briefcase size={14} /> Histórico Profissional
                  </Label>
                  <Textarea value={historicoProfissional} onChange={(e) => setHistoricoProfissional(e.target.value)} placeholder="Descreva o seu percurso profissional, empresas onde trabalhou, funções desempenhadas..." className="mt-1 min-h-[100px]" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Heart size={14} /> Outras Experiências
                  </Label>
                  <Textarea value={experienciaProfissional} onChange={(e) => setExperienciaProfissional(e.target.value)} placeholder="Estágios, voluntariado, projetos relevantes..." className="mt-1 min-h-[80px]" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ ACTIVIDADES EXTRA-CURRICULARES ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                Actividades Extra-Curriculares
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Award size={14} /> Selecione as actividades em que participou
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "VOLUNTARIADO", label: "Voluntariado" },
                      { value: "PESQUISA_CIENTIFICA", label: "Pesquisa Científica" },
                      { value: "MONITORIA", label: "Monitoria" },
                      { value: "LIDERANCA_ESTUDANTIL", label: "Liderança Estudantil" },
                      { value: "PROJECTOS_SOCIAIS", label: "Projectos Sociais" },
                      { value: "EMPREENDEDORISMO", label: "Empreendedorismo" },
                      { value: "PUBLICACOES_CIENTIFICAS", label: "Publicações Científicas" },
                    ].map((ativ) => {
                      const selected = atividadesExtracurriculares.includes(ativ.value);
                      return (
                        <button
                          key={ativ.value}
                          type="button"
                          onClick={() => {
                            setAtividadesExtracurriculares((prev) =>
                              selected ? prev.filter((a) => a !== ativ.value) : [...prev, ativ.value]
                            );
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            selected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                          }`}
                        >
                          {ativ.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Award size={14} /> Descreva a sua participação
                  </Label>
                  <Textarea value={descricaoAtividades} onChange={(e) => setDescricaoAtividades(e.target.value)} placeholder="Descreva resumidamente a sua participação em cada actividade seleccionada..." className="mt-1 min-h-[100px]" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ PRODUÇÃO CIENTÍFICA ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <School size={16} className="text-emerald-500" />
                Produção Científica
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <School size={14} /> Tipos de Produção
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "ARTIGOS_PUBLICADOS", label: "Artigos Publicados" },
                      { value: "RESUMOS", label: "Resumos" },
                      { value: "CAPITULOS_LIVROS", label: "Capítulos de Livros" },
                      { value: "LIVROS", label: "Livros" },
                      { value: "TRABALHOS_CONGRESSOS", label: "Trabalhos em Congressos" },
                    ].map((prod) => {
                      const selected = producaoCientifica.includes(prod.value);
                      return (
                        <button
                          key={prod.value}
                          type="button"
                          onClick={() => {
                            setProducaoCientifica((prev) =>
                              selected ? prev.filter((p) => p !== prod.value) : [...prev, prod.value]
                            );
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            selected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                              : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                          }`}
                        >
                          {prod.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <School size={14} /> Descreva as suas publicações
                  </Label>
                  <Textarea value={descricaoProducao} onChange={(e) => setDescricaoProducao(e.target.value)} placeholder="Descreva os seus trabalhos, títulos, revistas, conferências onde foram apresentados..." className="mt-1 min-h-[100px]" />
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ SITUAÇÃO FINANCEIRA ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                Situação Financeira e Preferências
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Award size={14} /> Necessita de Bolsa Integral?
                  </Label>
                  <div className="flex gap-2">
                    {["SIM", "NAO"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBolsaIntegral(opt)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          bolsaIntegral === opt
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                        }`}
                      >
                        {opt === "SIM" ? "Sim" : "Não"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Award size={14} /> Aceita Bolsa Parcial?
                  </Label>
                  <div className="flex gap-2">
                    {["SIM", "NAO"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBolsaParcial(opt)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          bolsaParcial === opt
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                        }`}
                      >
                        {opt === "SIM" ? "Sim" : "Não"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Award size={14} /> Possui Condições para Custear Passagem?
                  </Label>
                  <div className="flex gap-2">
                    {["SIM", "NAO"].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCusteiaPassagem(opt)}
                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          custeiaPassagem === opt
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                        }`}
                      >
                        {opt === "SIM" ? "Sim" : "Não"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe size={14} /> Preferência de Destino (País)
                  </Label>
                  <Input value={preferenciaDestino} onChange={(e) => setPreferenciaDestino(e.target.value)} placeholder="Ex: Portugal, Brasil, EUA, Reino Unido..." className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                    <Globe size={14} /> Mobilidade
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2">Está disposto a mudar de país?</p>
                      <div className="flex gap-2">
                        {["SIM", "NAO"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setMudarPais(opt)}
                            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all border ${
                              mudarPais === opt
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                            }`}
                          >
                            {opt === "SIM" ? "Sim" : "Não"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2">Está disposto a mudar para qualquer continente?</p>
                      <div className="flex gap-2">
                        {["SIM", "NAO"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setQualquerContinente(opt)}
                            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all border ${
                              qualquerContinente === opt
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                            }`}
                          >
                            {opt === "SIM" ? "Sim" : "Não"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ DOCUMENTOS ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                Documentos que Possui
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "PASSAPORTE", label: "Passaporte" },
                  { value: "HISTORICO_ESCOLAR", label: "Histórico Escolar" },
                  { value: "DIPLOMA", label: "Diploma" },
                  { value: "CERTIFICADOS_IDIOMAS", label: "Certificados de Idiomas" },
                  { value: "CURRICULO", label: "Currículo" },
                  { value: "CARTA_MOTIVACAO", label: "Carta de Motivação" },
                  { value: "CARTAS_RECOMENDACAO", label: "Cartas de Recomendação" },
                ].map((doc) => {
                  const selected = documentos.includes(doc.value);
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => {
                        setDocumentos((prev) =>
                          selected ? prev.filter((d) => d !== doc.value) : [...prev, doc.value]
                        );
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        selected
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700"
                      }`}
                    >
                      {doc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-white/[0.08]" />

            {/* ═══════ MOTIVAÇÕES ═══════ */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Heart size={16} className="text-emerald-500" />
                Motivações
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <Heart size={14} /> Conte-nos sobre as suas motivações
                  </Label>
                  <Textarea value={motivacoes} onChange={(e) => setMotivacoes(e.target.value)} placeholder="Conte-nos sobre as suas motivações, objetivos e sonhos..." className="mt-1 min-h-[100px]" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
              <Button type="submit" disabled={salvarMutation.isPending} className="gap-2">
                {salvarMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save size={16} />
                {salvarMutation.isPending ? "A salvar..." : "Salvar Perfil Académico"}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}

export default PerfilAcademicoPage;
