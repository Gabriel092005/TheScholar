import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

interface MyTokenPayload {
  role: "ADMIN" | "GESTOR" | "USUARIO";
  sub: string;
  exp: number;
}

export function GoogleCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/sign-in?error=google_auth_failed");
      return;
    }

    try {
      const decoded = jwtDecode<MyTokenPayload>(token);
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        navigate("/sign-in?error=token_expired");
        return;
      }

      Cookies.set("token", token, { expires: 7, path: "/" });

      // Pré-carrega o perfil do utilizador para evitar ecrã de loading
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });

      if (decoded.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (decoded.role === "GESTOR") {
        navigate("/gestor/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch {
      navigate("/sign-in?error=invalid_token");
    }
  }, [searchParams, navigate, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-500">Autenticando com Google...</p>
      </div>
    </div>
  );
}
