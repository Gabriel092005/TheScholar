import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * O conteúdo rola dentro de uma ScrollArea, que continua montada ao mudar de rota. Sem isto,
 * a página nova abre com o scroll da anterior e o título fica escondido atrás do header.
 * Colocar dentro da ScrollArea, antes do <Outlet />.
 */
export function VoltarAoTopo() {
  const { pathname } = useLocation();
  const marca = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const painel = marca.current?.closest("[data-radix-scroll-area-viewport]");
    if (painel) painel.scrollTop = 0;
  }, [pathname]);

  return <span ref={marca} hidden />;
}
