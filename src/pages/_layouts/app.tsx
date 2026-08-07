import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Outlet, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/sideBarLink";
import { useUser } from "@/api/useGetProfile";
import { ScholarshipAIChat } from "@/pages/app/scholarShip/ScholarshipAIChat";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

export function AppLayoutAdmin() {
  const { user, isLoading } = useUser();
  const navigate = useNavigate();
  const hasToken = !!Cookies.get("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user && !hasToken) {
      navigate("/welcome", { replace: true });
    } else if (!user && !isLoading) {
      navigate("/welcome", { replace: true });
    }
  }, [user, hasToken, isLoading, navigate]);

  if (!user && (!hasToken || !isLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col antialiased bg-background overflow-hidden">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
        <ScrollArea className="flex-1">
          <Outlet />
        </ScrollArea>
      </div>

      <ScholarshipAIChat global />
    </div>
  );
}

export default AppLayoutAdmin;
