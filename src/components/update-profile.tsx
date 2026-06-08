import { useRef, useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Loader2, Camera, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateProfile, updateProfilePhoto } from "@/api/get-profile";
import { api } from "@/lib/axios";

const profileSchema = z.object({
  nome: z.string().min(3, "Nome muito curto (mínimo 3 caracteres)"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(9, "Contacto inválido (mínimo 9 dígitos)"),
});

type ProfileSchema = z.infer<typeof profileSchema>;

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

interface EditProfileDialogProps {
  user: {
    nome: string;
    email: string;
    phone?: string;
    image_path?: string | null;
  };
  onSuccess?: () => void;
}

export function EditProfileDialog({ user, onSuccess }: EditProfileDialogProps) {
  const queryClient = useQueryClient();
  const nomeInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const userColor = COLORS[user.nome?.length % COLORS.length] || "bg-emerald-500";
  const avatarSrc = preview || (user.image_path ? `${api.defaults.baseURL}/uploads/${user.image_path}` : "");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      nome: user.nome || "",
      email: user.email || "",
      phone: user.phone || "",
    },
  });

  const { mutateAsync: save, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["profile"], (old: any) => ({
        ...old,
        nome: updatedUser.nome,
        email: updatedUser.email,
        phone: updatedUser.phone,
      }));
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Perfil atualizado!");
      onSuccess?.();
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      toast.error(
        status === 409 ? "E-mail já em uso" : "Erro ao atualizar perfil",
        { description: message || "Verifique os dados e tente novamente." }
      );
    },
  });

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Seleccione um ficheiro de imagem válido.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 10MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploadingPhoto(true);

    try {
      const result = await updateProfilePhoto(file);
      queryClient.setQueryData(["profile"], (old: any) => ({
        ...old,
        image_path: result.image_path,
      }));
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Foto de perfil actualizada!");
    } catch {
      setPreview(null);
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  async function onSubmit(data: ProfileSchema) {
    try {
      await save(data);
    } catch {
      // handled by onError
    }
  }

  return (
    <DialogContent
      className={cn(
        "max-w-sm w-full rounded-3xl p-0 overflow-hidden",
        "bg-white dark:bg-[#111113]",
        "border border-gray-100 dark:border-white/[0.06]",
        "shadow-2xl shadow-black/10 dark:shadow-black/50"
      )}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        setTimeout(() => nomeInputRef.current?.focus(), 50);
      }}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }}
    >
      <div className="h-1 w-full bg-emerald-500" />

      <div className="px-6 pt-5 pb-6 space-y-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Editar Perfil
          </DialogTitle>
          <DialogDescription className="text-[13px] text-gray-400 dark:text-zinc-500">
            Actualize a sua foto, nome, e-mail ou telefone.
          </DialogDescription>
        </DialogHeader>

        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative group outline-none"
          >
            <Avatar className="w-24 h-24 border-4 border-gray-100 dark:border-white/[0.08]">
              <AvatarImage src={avatarSrc} className="object-cover" />
              <AvatarFallback className={`${userColor} text-white text-2xl font-bold`}>
                {user.nome?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingPhoto ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            Clique na foto para alterar
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500 ml-0.5">
              Nome completo
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none">
                <User size={15} />
              </span>
              <Input
                {...register("nome")}
                ref={(e) => { register("nome").ref(e); nomeInputRef.current = e; }}
                placeholder="Seu nome completo"
                disabled={isPending}
                className={cn(
                  "pl-10 h-11 rounded-xl w-full text-sm",
                  "bg-gray-50 dark:bg-white/[0.04]",
                  "border text-gray-900 dark:text-white",
                  "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  errors.nome && "border-red-400 dark:border-red-500/50"
                )}
              />
            </div>
            {errors.nome && (
              <p className="ml-0.5 text-[11px] font-medium text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500 ml-0.5">
              E-mail
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none">
                <Mail size={15} />
              </span>
              <Input
                {...register("email")}
                type="email"
                placeholder="seu@email.com"
                disabled={isPending}
                className={cn(
                  "pl-10 h-11 rounded-xl w-full text-sm",
                  "bg-gray-50 dark:bg-white/[0.04]",
                  "border text-gray-900 dark:text-white",
                  "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  errors.email && "border-red-400 dark:border-red-500/50"
                )}
              />
            </div>
            {errors.email && (
              <p className="ml-0.5 text-[11px] font-medium text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500 ml-0.5">
              Telefone
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none">
                <Phone size={15} />
              </span>
              <Input
                {...register("phone")}
                type="tel"
                placeholder="(+244) XXX XXX XXX"
                disabled={isPending}
                className={cn(
                  "pl-10 h-11 rounded-xl w-full text-sm",
                  "bg-gray-50 dark:bg-white/[0.04]",
                  "border text-gray-900 dark:text-white",
                  "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                  errors.phone && "border-red-400 dark:border-red-500/50"
                )}
              />
            </div>
            {errors.phone && (
              <p className="ml-0.5 text-[11px] font-medium text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              disabled={isPending || !isDirty}
              className={cn(
                "w-full h-11 rounded-xl font-bold text-[13px] tracking-wide",
                "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]",
                "text-white shadow-md shadow-emerald-500/20",
                "transition-all duration-200",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Guardar alterações</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DialogContent>
  );
}