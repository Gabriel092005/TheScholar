import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Smartphone, ArrowLeft, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

type RecoveryStep = 'IDENTIFY' | 'VERIFY' | 'RESET' | 'SUCCESS';

export function ForgotPassword() {
  const [step, setStep] = useState<RecoveryStep>('IDENTIFY');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 dígitos

  const nextStep = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (step === 'IDENTIFY') setStep('VERIFY');
      else if (step === 'VERIFY') setStep('RESET');
      else if (step === 'RESET') setStep('SUCCESS');
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[500px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        
        {/* PASSO 1: IDENTIFICAÇÃO */}
        {step === 'IDENTIFY' && (
          <motion.div key="id" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black uppercase italic text-slate-900 dark:text-white">Recuperação</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Escolha como deseja receber seu código de segurança.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMethod('email')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'email' ? 'border-[#6366F1] bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <Mail className={method === 'email' ? 'text-[#6366F1]' : 'text-slate-400 dark:text-zinc-500'} />
                <span className="text-[10px] font-black uppercase tracking-widest">E-mail</span>
              </button>
              <button 
                onClick={() => setMethod('sms')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'sms' ? 'border-[#6366F1] bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <Smartphone className={method === 'sms' ? 'text-[#6366F1]' : 'text-slate-400 dark:text-zinc-500'} />
                <span className="text-[10px] font-black uppercase tracking-widest">SMS</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 ml-1">
                  {method === 'email' ? 'Seu E-mail' : 'Seu Telefone'}
                </Label>
                <Input 
                  placeholder={method === 'email' ? "exemplo@email.com" : "+244  999-999-999"}
                  className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/20"
                />
              </div>
              <Button onClick={nextStep} disabled={isLoading} className="w-full h-14 rounded-2xl bg-[#6366F1] font-black uppercase tracking-widest">
                {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Código"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* PASSO 2: CÓDIGO OTP */}
        {step === 'VERIFY' && (
          <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-[#6366F1] w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Verifique seu {method}</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Digitamos o código de 6 dígitos enviado para você.</p>
            </div>

            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-[#6366F1] rounded-xl outline-none transition-all"
                  value={digit}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[index] = e.target.value;
                    setOtp(newOtp);
                    if (e.target.nextSibling && e.target.value) (e.target.nextSibling as HTMLInputElement).focus();
                  }}
                />
              ))}
            </div>

            <Button onClick={nextStep} className="w-full h-14 rounded-2xl bg-[#6366F1] font-black uppercase tracking-widest">
              Validar Código
            </Button>
            
            <p className="text-center text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500">
              Não recebeu? <button className="text-[#6366F1]">Reenviar em 30s</button>
            </p>
          </motion.div>
        )}

        {/* PASSO 3: REDEFINIÇÃO */}
        {step === 'RESET' && (
          <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Nova Senha</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Crie uma senha forte que você não use em outros sites.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">Nova Senha</Label>
                <Input type="password" placeholder="••••••••" className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest">Confirmar Senha</Label>
                <Input type="password" placeholder="••••••••" className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none" />
              </div>
              <Button onClick={nextStep} className="w-full h-14 rounded-2xl bg-[#6366F1] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30">
                Redefinir Senha
              </Button>
            </div>
          </motion.div>
        )}

        {/* PASSO 4: SUCESSO */}
        {step === 'SUCCESS' && (
          <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-green-500 w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-slate-900 dark:text-white">Pronto!</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">Sua senha foi alterada com sucesso. Agora você já pode acessar o sistema.</p>
            </div>
            <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 font-black uppercase tracking-widest transition-transform active:scale-95">
              <a href="/sign-in">Voltar para o Login</a>
            </Button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Botão de Voltar (Sempre visível exceto no sucesso) */}
      {step !== 'SUCCESS' && (
        <button 
          onClick={() => step === 'VERIFY' ? setStep('IDENTIFY') : window.history.back()}
          className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
      )}
    </div>
  );
}