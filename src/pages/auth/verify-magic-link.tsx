import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyMagicLink } from "@/api/auth";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Cookies from "js-cookie";
import { useQueryClient } from "@tanstack/react-query";

export function VerifyMagicLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Link inválido.");
      return;
    }

    verifyMagicLink(token)
      .then(async (res) => {
        Cookies.set("token", res.token, { expires: 7, path: "/" });
        await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        setStatus("success");
        setMessage("Login efetuado com sucesso!");
        setTimeout(() => {
          if (res.user.role === "ADMIN") navigate("/admin", { replace: true });
          else if (res.user.role === "GESTOR") navigate("/gestor/dashboard", { replace: true });
          else navigate("/", { replace: true });
        }, 1500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Link inválido ou expirado.");
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto" />
            <p className="text-zinc-500">A verificar o seu link...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto" />
            <p className="text-green-600 font-semibold">{message}</p>
            <p className="text-sm text-zinc-500">A redirecionar...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto" />
            <p className="text-red-600 font-semibold">{message}</p>
            <Link to="/sign-in" className="text-emerald-600 hover:text-emerald-500 font-semibold text-sm">
              Voltar ao login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
