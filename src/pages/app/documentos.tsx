import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, FolderOpen, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { CardAccent, Reveal, UserPageHeader, cardTitle, iconTile, userCard } from "@/components/user-ui";
import { gestorApi, type DocumentoPublico } from "@/api/gestor";
import { ComprarDocumentoDialog } from "./ComprarDocumentoDialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState, SearchInput, faintText, selectClass, softText, surface } from "@/pages/gestor/ui";

const botao =
  "flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700 transition-colors duration-300 hover:bg-emerald-100 group-hover:bg-emerald-500 group-hover:text-white disabled:opacity-60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-white";

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DocumentosPage() {
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [aComprar, setAComprar] = useState<DocumentoPublico | null>(null);
  const [aAbrir, setAAbrir] = useState<string | null>(null);

  const abrir = async (documento: DocumentoPublico) => {
    if (documento.linkExterno) {
      window.open(documento.linkExterno, "_blank", "noopener,noreferrer");
      return;
    }
    setAAbrir(documento.id);
    try {
      await gestorApi.abrirDocumento(documento);
    } catch {
      toast.error("Não foi possível abrir o documento");
    } finally {
      setAAbrir(null);
    }
  };

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ["documentos-publicos", search, categoria],
    queryFn: () =>
      gestorApi.listDocumentosPublicos({
        search: search || undefined,
        categoria: categoria === "TODAS" ? undefined : categoria,
      }),
  });

  const categorias = useMemo(
    () => Array.from(new Set(documentos.map((d) => d.categoria).filter(Boolean))) as string[],
    [documentos]
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 md:px-6">
      <UserPageHeader
        icon={FolderOpen}
        title="Documentos"
        description="Guias, editais e materiais úteis para a sua candidatura."
      />

      <div className={`${surface} mb-6 flex flex-col gap-3 p-3 sm:flex-row sm:items-center`}>
        <SearchInput className="flex-1" value={search} onChange={setSearch} placeholder="Pesquisar documentos" />
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className={`${selectClass} w-full sm:w-52`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas as categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : documentos.length === 0 ? (
        <div className={surface}>
          <EmptyState
            icon={FileText}
            title="Nenhum documento publicado"
            description="Novos materiais aparecerão aqui em breve."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documentos.map((documento, i) => (
            <Reveal key={documento.id} index={i}>
              <div className={`${userCard} flex h-full flex-col p-5`}>
                <CardAccent />
                <div className="flex items-start gap-3">
                  <div className={iconTile}>
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <h2 className={`${cardTitle} line-clamp-2 text-sm`}>
                      {documento.titulo}
                    </h2>
                    <p className={`mt-0.5 text-xs ${softText}`}>
                      {documento.bolsa?.titulo || documento.categoria || "Geral"}
                      {documento.fileSize ? ` · ${formatSize(documento.fileSize)}` : ""}
                    </p>
                  </div>
                </div>

                {documento.descricao && (
                  <p className={`mt-3 line-clamp-3 text-xs leading-relaxed ${softText}`}>{documento.descricao}</p>
                )}

                <div className="mt-auto pt-4">
                  {documento.preco > 0 && (
                    <p className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                      {documento.temAcesso ? (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Comprado</span>
                      ) : (
                        `${documento.preco.toLocaleString("pt-PT")} Kz`
                      )}
                    </p>
                  )}
                  {documento.temAcesso ? (
                    <button
                      type="button"
                      onClick={() => abrir(documento)}
                      disabled={aAbrir === documento.id}
                      className={`w-full ${botao}`}
                    >
                      {aAbrir === documento.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      Abrir documento
                    </button>
                  ) : (
                    <button type="button" onClick={() => setAComprar(documento)} className={`w-full ${botao}`}>
                      <ShoppingCart size={14} />
                      {documento.pagamentoPendente ? "Concluir pagamento" : "Comprar documento"}
                    </button>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <ComprarDocumentoDialog documento={aComprar} onClose={() => setAComprar(null)} />

      <p className={`mt-10 text-center text-[11px] ${faintText}`}>
        É gestor?{" "}
        <Link to="/gestor/documentos" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          Publique documentos no painel do gestor
        </Link>
      </p>
    </div>
  );
}

export default DocumentosPage;
