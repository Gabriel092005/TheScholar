import { useState } from "react";
import { Link, useNavigate, useRevalidator } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { signUp } from "@/api/auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import Cookies from "js-cookie";

// ── Shake ────────────────────────────────────────────────
const shakeVariants = {
  idle:  { x: 0 },
  shake: {
    x: [0, -10, 10, -8, 8, -5, 5, -2, 2, 0],
    transition: { duration: 0.55, ease: "easeInOut" },
  },
};

// ── Força da senha ───────────────────────────────────────
function getPasswordStrength(pwd: string): { label: string; color: string; width: string; segments: number } {
  if (pwd.length === 0) return { label: "",        color: "bg-zinc-200 dark:bg-zinc-800", width: "0%",   segments: 0 };
  if (pwd.length < 6)   return { label: "Fraca",   color: "bg-red-500",                  width: "25%",  segments: 1 };
  if (pwd.length < 8)   return { label: "Razoável",color: "bg-amber-500",                width: "50%",  segments: 2 };
  if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd))
                        return { label: "Boa",      color: "bg-blue-500",                 width: "75%",  segments: 3 };
  return                       { label: "Forte",   color: "bg-emerald-500",              width: "100%", segments: 4 };
}

// ── Field ────────────────────────────────────────────────
function Field({
  label,
  icon: Icon,
  children,
  hasError,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </Label>
      <div className="relative group">
        <Icon
          size={15}
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200
            ${hasError
              ? "text-red-400"
              : "text-zinc-400 group-focus-within:text-emerald-500"
            }`}
        />
        {children}
      </div>
    </div>
  );
}

export function SignUp() {
  const [showPassword,   setShowPassword]   = useState(false);
  const [acceptedTerms,  setAcceptedTerms]  = useState(false);
  const [isSuccess,      setIsSuccess]      = useState(false);
  const [shakeState,     setShakeState]     = useState<"idle" | "shake">("idle");
  const [hasError,       setHasError]       = useState(false);
  const [nome,           setNome]           = useState("");
  const [email,          setEmail]          = useState("");
  const [phone,          setPhone]          = useState("");
  const [password,       setPassword]       = useState("");

  const navigate    = useNavigate();
  const revalidator = useRevalidator();
  const strength    = getPasswordStrength(password);

  // ── Shake helper ─────────────────────────────────────
  function triggerShake(message?: string) {
    setHasError(true);
    setShakeState("shake");
    if (message) toast.error(message);
    setTimeout(() => setShakeState("idle"), 600);
    setTimeout(() => setHasError(false), 2500);
  }

  // ── useMutation ──────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: () => signUp({ nome, email, phone, password }),

    onSuccess: async (response) => {
      Cookies.set("token", response.token, { expires: 7, path: "/" });
      revalidator.revalidate();

      setIsSuccess(true);
      toast.success("Conta criada com sucesso!", {
        description: `Bem-vindo, ${nome.split(" ")[0]}!`,
      });

      await new Promise((r) => setTimeout(r, 900));
      navigate("/", { replace: true });
    },

    onError: (error: any) => {
      const isNetworkError =
        error?.code === "ERR_NETWORK" || error?.message?.includes("Network");

      if (isNetworkError) {
        // Modo demo
        const demoToken =
          "demo." +
          btoa(JSON.stringify({
            role: "USUARIO",
            sub: email,
            exp: Math.floor(Date.now() / 1000) + 86400,
          }));
        Cookies.set("token", demoToken, { expires: 7, path: "/" });
        revalidator.revalidate();
        toast.success("Conta criada (modo demonstração)!", {
          description: `Bem-vindo, ${nome.split(" ")[0]}!`,
        });
        navigate("/", { replace: true });
      } else {
        const message = error?.response?.data?.message || "Erro ao criar conta";
        triggerShake(message);
      }
    },
  });

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!acceptedTerms) {
      triggerShake("Aceite os Termos de Uso para continuar.");
      return;
    }
    if (password.length < 8) {
      triggerShake("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    mutate();
  }

  // ── Estilos de input ──────────────────────────────────
  const inputBase = `pl-10 h-12 rounded-xl text-sm font-medium
    border transition-all duration-200 outline-none
    focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0`;

  const inputNormal = `bg-gray-50 border-gray-200 text-gray-900 placeholder:text-zinc-400
    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white`;

  const inputErr = `bg-red-50 border-red-300 text-gray-900 placeholder:text-red-300
    dark:bg-red-500/[0.08] dark:border-red-500/40 dark:text-white`;

  return (
    <AnimatePresence mode="wait">

      {/* ── SUCESSO ── */}
      {isSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative flex flex-col items-center justify-center gap-5 py-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40"
          >
            <CheckCircle2 size={30} className="text-white" strokeWidth={2.5} />
          </motion.div>

          {/* Pulse rings */}
          {[1, 1.4].map((scale, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 rounded-full border border-emerald-400"
              animate={{ scale: [1, scale * 2], opacity: [0.4, 0] }}
              transition={{ duration: 0.9, delay: i * 0.2, repeat: Infinity }}
            />
          ))}

          <div className="space-y-1">
            <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Conta criada!
            </p>
            <p className="text-sm text-zinc-500">A redirecionar...</p>
          </div>
        </motion.div>

      ) : (

      /* ── FORMULÁRIO ── */
      <motion.div
        key="form"
        variants={shakeVariants}
        animate={shakeState}
        className="space-y-6"
      >
        {/* Cabeçalho */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <div className="relative w-fit">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-950 animate-pulse" />
          </div>

          <div>
            <h1 className="text-[1.7rem] font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Criar conta
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Preencha os seus dados para começar.
            </p>
          </div>
        </motion.div>

        {/* Banner de erro */}
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
                text-red-600 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                Verifique os dados e tente novamente.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Campos */}
        <motion.form
          onSubmit={handleRegister}
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Field label="Nome Completo" icon={User} hasError={hasError}>
            <Input
              required
              value={nome}
              onChange={(e) => { setNome(e.target.value); setHasError(false); }}
              placeholder="Seu nome completo"
              className={`${inputBase} ${hasError ? inputErr : inputNormal}`}
            />
          </Field>

          <Field label="E-mail" icon={Mail} hasError={hasError}>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setHasError(false); }}
              placeholder="nome@email.com"
              className={`${inputBase} ${hasError ? inputErr : inputNormal}`}
            />
          </Field>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
              Telefone
            </Label>
            <PhoneInput
              value={phone}
              onChange={(v) => { setPhone(v); setHasError(false); }}
              hasError={hasError}
              disabled={isPending}
            />
          </div>

          {/* Senha + força */}
          <div className="space-y-2">
            <Field label="Senha" icon={Lock} hasError={hasError}>
              <Input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setHasError(false); }}
                placeholder="Mínimo 8 caracteres"
                className={`${inputBase} pr-10 ${hasError ? inputErr : inputNormal}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </Field>

            {/* Barra de força */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((seg) => (
                    <div key={seg} className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${seg <= strength.segments ? strength.color : ""}`}
                        initial={{ width: 0 }}
                        animate={{ width: seg <= strength.segments ? "100%" : "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  ))}
                </div>
                <p className={`text-[10px] font-bold ${
                  strength.segments <= 1 ? "text-red-500" :
                  strength.segments === 2 ? "text-amber-500" :
                  strength.segments === 3 ? "text-blue-500" : "text-emerald-500"
                }`}>
                  Senha {strength.label}
                </p>
              </motion.div>
            )}
          </div>

          {/* Termos */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors
            ${hasError && !acceptedTerms
              ? "bg-red-50 dark:bg-red-500/[0.06] border-red-200 dark:border-red-500/30"
              : "bg-gray-50 dark:bg-white/[0.03] border-gray-100 dark:border-white/[0.06]"
            }`}
          >
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => { setAcceptedTerms(v as boolean); setHasError(false); }}
              className="mt-0.5 border-zinc-300 dark:border-white/20
                data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
            />
            <label htmlFor="terms" className="text-[11px] text-zinc-500 leading-relaxed cursor-pointer">
              Aceito os{" "}
              <span className="text-emerald-600 font-bold">Termos de Uso</span>
              {" "}e a{" "}
              <span className="text-emerald-600 font-bold">Política de Privacidade</span>.
            </label>
          </div>

          {/* Botão */}
          <div className="pt-1">
            <motion.button
              type="submit"
              disabled={isPending}
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
                {isPending
                  ? <Loader2 size={16} className="animate-spin" />
                  : <><span>Criar minha conta</span><ArrowRight size={15} /></>
                }
              </span>
            </motion.button>
          </div>
        </motion.form>

        {/* Rodapé */}
        <p className="text-center text-[11px] text-zinc-500">
          Já possui uma conta?{" "}
          <Link to="/sign-in" className="text-emerald-600 hover:text-emerald-500 font-bold transition-colors">
            Fazer login
          </Link>
        </p>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
