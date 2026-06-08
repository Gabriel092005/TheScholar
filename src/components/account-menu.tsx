import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { History, LogOut, User } from "lucide-react";
import { getProfile } from "@/api/get-profile";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { EditProfileDialog } from "./update-profile";
import { api } from "@/lib/axios";

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

export function AccountMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const { data: profile } = useQuery({ 
    queryKey: ["profile"], 
    queryFn: getProfile,
    enabled: !!Cookies.get("token")
  });

  const logout = useMutation({
    mutationFn: async () => {
      Cookies.remove("token", { path: "/" });
    },
    onSuccess: () => {
      queryClient.clear();
      navigate("/sign-in");
    }
  });

  const { initials, color, src } = profile ? {
    initials: profile.nome?.substring(0, 2).toUpperCase() || "U",
    color: COLORS[profile.nome?.length % COLORS.length] || "bg-emerald-500",
    src: profile.image_path ? `${api.defaults.baseURL}/uploads/${profile.image_path}` : ""
  } : { initials: "U", color: "bg-emerald-500", src: "" };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 pl-2 cursor-pointer group outline-none border-none bg-transparent">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                {profile?.nome || "Usuário"}
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                @{profile?.role || "usuario"}
              </span>
            </div>
            <Avatar className="w-10 h-10 border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-500 transition-all">
              <AvatarImage src={src} className="object-cover" />
              <AvatarFallback className={`${color} text-white text-[10px] font-bold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 mt-2 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
          <DropdownMenuLabel className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-700">
                <AvatarImage src={src} className="object-cover" />
                <AvatarFallback className={`${color} text-white text-xs font-bold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-medium dark:text-white truncate">{profile?.nome}</p>
                <p className="text-[11px] text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>

          <div className="space-y-0.5">
            <DropdownMenuItem
              onClick={() => setProfileDialogOpen(true)}
              className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <User size={16} />
              Editar Perfil
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <a
                href="/minhas-atividades"
                className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <History size={16} />
                Minhas Atividades
              </a>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem 
            onClick={() => logout.mutate()}
            className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        {profile && (
          <EditProfileDialog
            user={profile}
            onSuccess={() => setProfileDialogOpen(false)}
          />
        )}
      </Dialog>
    </>
  );
}