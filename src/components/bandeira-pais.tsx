import { useState } from "react";
import { paises } from "@/data/paises";
import { cn } from "@/lib/utils";

/** Obtém o código do país (ex.: "ao") a partir do emoji da bandeira. */
function codigoDoPais(nome: string): string | null {
  const bandeira = paises.find((p) => p.nome === nome)?.bandeira;
  if (!bandeira) return null;
  const letras = [...bandeira].map((c) => String.fromCharCode((c.codePointAt(0) ?? 0) - 0x1f1e6 + 97));
  return letras.length === 2 ? letras.join("") : null;
}

/** Usa uma imagem porque o Windows mostra os emojis de bandeira como letras ("AO"). */
export function BandeiraPais({ pais, className }: { pais: string; className?: string }) {
  const [falhou, setFalhou] = useState(false);
  const codigo = codigoDoPais(pais);

  if (!codigo || falhou) return null;

  return (
    <img
      src={`https://flagcdn.com/w40/${codigo}.png`}
      srcSet={`https://flagcdn.com/w80/${codigo}.png 2x`}
      alt={`Bandeira: ${pais}`}
      title={pais}
      loading="lazy"
      onError={() => setFalhou(true)}
      className={cn("inline-block rounded-[3px] object-cover ring-1 ring-black/10", className)}
    />
  );
}
