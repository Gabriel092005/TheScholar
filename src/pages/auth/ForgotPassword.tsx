import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/api/auth";
import { toast } from "sonner";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch {
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center px-6 py-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verifique o seu email
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm leading-relaxed">
          Enviámos um link de recuperação para <strong className="text-gray-900 dark:text-white">{email}</strong>.
          Se não encontrar, verifique a pasta de spam.
        </p>
        <Link
          to="/sign-in"
          className="mt-8 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 py-10"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
          <Mail className="h-7 w-7 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Esqueceu a palavra-passe?
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs">
          Digite o seu email e enviaremos um link para redefinir a sua palavra-passe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500 mb-1.5 block">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/sign-in"
          className="text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>
      </div>
    </motion.div>
  );
}
