import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import { afiliadosApi } from "@/api/afiliados";
import { guardarDestino, guardarRef } from "@/lib/afiliado-ref";

/** Abre um link de afiliado: guarda o código e leva ao produto. */
export function AfiliadoRedirect() {
  const { codigo } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!codigo) return;
    let ativo = true;
    afiliadosApi
      .abrirLink(codigo)
      .then((link) => {
        if (!ativo) return;
        guardarRef(link.tipo, link.itemId, link.codigo);
        if (Cookies.get("token")) {
          navigate(link.destino, { replace: true });
        } else {
          guardarDestino(link.destino);
          navigate("/sign-up", { replace: true });
        }
      })
      .catch(() => ativo && navigate("/", { replace: true }));
    return () => {
      ativo = false;
    };
  }, [codigo, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" aria-label="A abrir o link" />
    </div>
  );
}
