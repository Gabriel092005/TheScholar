import { useState } from "react";
import { Header } from "@/components/header";
import { Navigate, Outlet } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar } from "@/components/sideBarLink";
import { useUser } from "@/api/useGetProfile";
import { ScholarshipAIChat } from "@/pages/app/scholarShip/ScholarshipAIChat";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

export function AppLayoutAdmin() {
  const { user, isLoading } = useUser();
  const hasToken = !!Cookies.get("token");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user && !hasToken) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!user && !isLoading) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="flex h-screen w-full flex-col antialiased bg-white dark:bg-[#111113] overflow-hidden">
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
