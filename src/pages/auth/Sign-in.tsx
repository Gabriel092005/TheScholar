import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { signIn, requestMagicLink } from "@/api/auth";
import { toast } from "sonner";
import { env } from "@/env";

interface MyTokenPayload {
  role: "ADMIN" | "GESTOR" | "USUARIO";
  sub: string;
  exp: number;
}

const shakeVariants = {
  idle:  { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Field({
  label,
  icon: Icon,
  children,
  right,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
          {label}
        </Label>
        {right}
      </div>
      <div className="relative group">
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors"
        />
        {children}
      </div>
    </div>
  );
}

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shakeState, setShakeState] = useState<"idle" | "shake">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<MyTokenPayload>(token);
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (!isExpired) {
          if (decoded.role === "ADMIN") {
            navigate("/admin", { replace: true });
          } else if (decoded.role === "GESTOR") {
            navigate("/gestor/dashboard", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          Cookies.remove("token", { path: "/" });
        }
      } catch {
        Cookies.remove("token", { path: "/" });
      }
    }
  }, [navigate]);

  function triggerShake(message?: string) {
    setHasError(true);
    setShakeState("shake");
    if (message) toast.error(message);
    setTimeout(() => setShakeState("idle"), 600);
    setTimeout(() => setHasError(false), 2500);
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return toast.error("Insira o seu email");
    if (!isValidEmail(email)) return triggerShake("Insira um e-mail válido");
    setIsLoading(true);
    try {
      await requestMagicLink(email.trim().toLowerCase());
      setMagicLinkSent(true);
      toast.success("Link de acesso enviado! Verifique o seu email.");
    } catch {
      toast.error("Erro ao enviar link. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setHasError(false);

    if (!email || !isValidEmail(email)) return triggerShake("Insira um e-mail válido");
    if (!password) return triggerShake("Insira a sua senha");

    setIsLoading(true);

    try {
      const response = await signIn(email.trim().toLowerCase(), password);
      Cookies.set("token", response.token, { expires: 7, path: "/" });

      if (rememberEmail) {
        localStorage.setItem("rememberedEmail", email.trim().toLowerCase());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.success("Bem-vindo de volta!");

      if (response.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (response.user.role === "GESTOR") {
        navigate("/gestor/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      const isNetworkError = error?.code === "ERR_NETWORK" || error?.message?.includes("Network");

      if (isNetworkError) {
        toast.error("Servidor indisponível", {
          description: "Usando modo demonstração..."
        });
        const demoToken = "demo." + btoa(JSON.stringify({ role: "USUARIO", sub: email, exp: Math.floor(Date.now() / 1000) + 86400 }));
        Cookies.set("token", demoToken, { expires: 7, path: "/" });
        navigate("/");
      } else {
        const message = error?.response?.data?.message || "E-mail ou senha incorretos";
        triggerShake(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const inputBase = `pl-10 h-12 rounded-xl text-sm font-medium
    border transition-all duration-200 outline-none
    focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0`;

  const inputNormal = `bg-gray-50 border-gray-200 text-gray-900 placeholder:text-zinc-400
    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white`;

  const inputErr = `bg-red-50 border-red-300 text-gray-900 placeholder:text-red-300
    dark:bg-red-500/[0.08] dark:border-red-500/40 dark:text-white`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="space-y-1.5">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
          <LogIn size={16} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Acesse sua conta para continuar.
        </p>
      </div>

      {magicLinkSent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center justify-center gap-5 py-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40"
          >
            <Mail size={28} className="text-white" />
          </motion.div>

          {[1, 1.4].map((scale, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 rounded-full border border-emerald-400"
              animate={{ scale: [1, scale * 2], opacity: [0.4, 0] }}
              transition={{ duration: 0.9, delay: i * 0.2, repeat: Infinity }}
            />
          ))}

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verifique o seu email</h2>
            <p className="text-sm text-zinc-500">
              Enviámos um link de acesso para{" "}
              <strong className="text-gray-700 dark:text-zinc-300">{email}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setMagicLinkSent(false); setUseMagicLink(false); }}
            className="text-sm text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
          >
            Reenviar link
          </button>

          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="text-[11px] text-zinc-400 hover:text-emerald-600 transition-colors"
          >
            Voltar para o login
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={shakeVariants}
          animate={shakeState}
          className="space-y-6"
        >
          <AnimatePresence>
            {hasError && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2
                  bg-red-50 dark:bg-red-500/10
                  border border-red-200 dark:border-red-500/25
                  text-red-600 dark:text-red-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                  Verifique os dados e tente novamente.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={useMagicLink ? handleMagicLink : handleSignIn} className="space-y-4">
            <Field label="E-mail" icon={Mail}>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setHasError(false); }}
                placeholder="exemplo@email.com"
                disabled={isLoading}
                className={`${inputBase} ${hasError ? inputErr : inputNormal}`}
              />
            </Field>

            {!useMagicLink && (
              <Field
                label="Senha"
                icon={Lock}
                right={
                  <Link
                    to="/password-recover"
                    className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                  >
                    Esqueceu?
                  </Link>
                }
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setHasError(false); }}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`${inputBase} pr-10 ${hasError ? inputErr : inputNormal}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>
            )}

            {!useMagicLink && (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remember"
                  checked={rememberEmail}
                  onCheckedChange={(v) => setRememberEmail(v as boolean)}
                  className="border-zinc-300 dark:border-white/20
                    data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
                <label htmlFor="remember" className="text-[11px] text-zinc-500 cursor-pointer select-none">
                  Lembrar-me
                </label>
              </div>
            )}

            <div className="pt-1">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="relative w-full h-12 rounded-xl font-black text-sm tracking-wide
                  bg-emerald-500 hover:bg-emerald-400 text-white
                  disabled:opacity-60 disabled:cursor-not-allowed
                  shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
                  transition-all duration-200 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                  -translate-x-full hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      {useMagicLink ? "Enviar link de acesso" : "Entrar"}
                      <ArrowRight size={15} />
                    </>
                  )}
                </span>
              </motion.button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-background px-3 text-zinc-400 font-bold">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = `${env.VITE_API_URL}/auth/google`}
              className="w-full h-11 rounded-xl text-[11px] font-bold tracking-wide
                border border-zinc-200 dark:border-zinc-800
                text-zinc-700 dark:text-zinc-300
                hover:border-emerald-200 dark:hover:border-emerald-800
                hover:text-emerald-600 dark:hover:text-emerald-400
                transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
            <button
              type="button"
              onClick={() => { setUseMagicLink(!useMagicLink); setHasError(false); }}
              className="w-full h-11 rounded-xl text-[11px] font-bold tracking-wide
                border border-zinc-200 dark:border-zinc-800
                text-zinc-500 dark:text-zinc-400
                hover:border-emerald-200 dark:hover:border-emerald-800
                hover:text-emerald-600 dark:hover:text-emerald-400
                transition-all duration-200"
            >
              {useMagicLink
                ? "Entrar com palavra-passe"
                : "Enviar link mágico para o meu e-mail"
              }
            </button>
          </form>
        </motion.div>
      )}

      <p className="text-center text-[11px] text-zinc-500">
        Não possui conta?{" "}
        <Link
          to="/sign-up"
          className="text-emerald-600 hover:text-emerald-500 font-semibold transition-colors"
        >
          Criar conta
        </Link>
      </p>
    </motion.div>
  );
}
