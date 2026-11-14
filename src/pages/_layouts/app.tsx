import { useEffect } from "react";
import { Headset, LayoutDashboard, Shield } from "lucide-react";
import { BarraInferior } from "@/components/barra-inferior";
import { Header, navItems } from "@/components/header";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/sideBarLink";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { useUser } from "@/api/useGetProfile";
import { ScholarshipAIChat } from "@/pages/app/scholarShip/ScholarshipAIChat";
import { SplashLogo } from "@/components/splash-logo";
import { MotionConfig } from "framer-motion";
import Cookies from "js-cookie";
import { consumirDestino } from "@/lib/afiliado-ref";

const ROTULOS_DA_BARRA: Record<string, string> = {
  "/": "Início",
  "/bolsas": "Bolsas",
  "/cursos": "Cursos",
  "/aulas": "Aulas",
};

// Sala ao vivo, conversa e player ocupam o ecrã inteiro, como num app.
const ROTAS_IMERSIVAS = [/^\/aulas\/[^/]+$/, /^\/comunidades\/[^/]+$/, /^\/cursos\/[^/]+\/aulas$/];

export function AppLayoutAdmin() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hasToken = !!Cookies.get("token");

  useEffect(() => {
    if (!user && !hasToken) {
      navigate("/", { replace: true });
    } else if (!user && !isLoading) {
      navigate("/", { replace: true });
    }
  }, [user, hasToken, isLoading, navigate]);

  // Quem abriu um link de afiliado sem sessão volta ao produto depois de entrar.
  useEffect(() => {
    if (!user) return;
    const destino = consumirDestino();
    if (destino) navigate(destino, { replace: true });
  }, [user, navigate]);

  if (!user && (!hasToken || !isLoading)) {
    return <SplashLogo />;
  }

  const imersiva = ROTAS_IMERSIVAS.some((rota) => rota.test(pathname));

  return (
    <div className="flex h-dvh w-full flex-col antialiased bg-background overflow-hidden">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <ScrollArea className="flex-1">
          <MotionConfig reducedMotion="user">
            <VoltarAoTopo />
            <Outlet />
          </MotionConfig>
        </ScrollArea>
      </div>

      {!imersiva && (
        <BarraInferior
          ariaLabel="Navegação principal"
          itens={navItems
            .filter((item) => ROTULOS_DA_BARRA[item.href])
            .map((item) => ({ ...item, labelCurta: ROTULOS_DA_BARRA[item.href] }))}
          mais={[
            ...navItems.filter((item) => !ROTULOS_DA_BARRA[item.href]),
            ...(user?.role === "ATENDIMENTO" || user?.role === "ADMIN" ? [{ label: "CRM", href: user?.role === "ADMIN" ? "/admin/crm" : "/atendimento", icon: Headset }] : []),
            ...(user?.role === "ADMIN" ? [{ label: "Painel Admin", href: "/admin", icon: Shield }] : []),
            ...(user?.role === "ADMIN" || user?.role === "GESTOR"
              ? [{ label: "Painel do Gestor", href: "/gestor/estatisticas", icon: LayoutDashboard }]
              : []),
          ]}
        />
      )}

      <ScholarshipAIChat global />
    </div>
  );
}

export default AppLayoutAdmin;
