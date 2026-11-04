import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mail, Save, UserRound } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@/api/useGetProfile";
import { updateProfile, updateProfilePhoto } from "@/api/get-profile";
import { getUploadUrl } from "@/lib/axios";
import { paises } from "@/data/paises";
import { BandeiraPais } from "@/components/bandeira-pais";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, faintText, inputClass, primaryButton, selectClass, softText, surface } from "./ui";

const BIO_MAX = 2000;

export function GestorPerfil() {
  const { user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState("");
  const [pais, setPais] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setBio(user?.bio ?? "");
  }, [user?.bio]);

  useEffect(() => {
    setPais(user?.paisMentoria ?? "");
  }, [user?.paisMentoria]);

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ bio: bio.trim() || null, paisMentoria: pais || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Perfil do mentor atualizado");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Erro ao guardar o perfil"),
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

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      await updateProfilePhoto(file);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Fotografia do mentor atualizada");
    } catch {
      setPreview(null);
      toast.error("Erro ao enviar a fotografia. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.nome?.substring(0, 2).toUpperCase() || "ME";
  const avatarSrc = preview || (user.image_path ? getUploadUrl(`/uploads/${user.image_path}`) : "");
  const changed = bio.trim() !== (user.bio ?? "").trim() || pais !== (user.paisMentoria ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil do mentor"
        description="Configure a sua fotografia e a descrição que será apresentada aos alunos."
      />

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className={`${surface} flex flex-col items-center p-6 text-center`}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative rounded-full outline-none"
          >
            <div className="grid size-32 place-items-center overflow-hidden rounded-full bg-emerald-100 ring-4 ring-emerald-500/10 dark:bg-emerald-500/10">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.nome} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {initials}
                </span>
              )}
            </div>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-white" />
              ) : (
                <Camera className="h-7 w-7 text-white" />
              )}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handlePhotoSelect}
          />

          <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{user.nome}</p>
          <p className={`mt-0.5 text-xs ${faintText}`}>{user.role === "ADMIN" ? "Administrador" : "Mentor"}</p>
          <p className={`mt-3 text-[11px] ${faintText}`}>Clique na fotografia para alterar</p>
        </div>

        <div className={`${surface} overflow-hidden`}>
          <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
            <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Informação do perfil
            </h3>
            <p className={`mt-0.5 text-xs ${faintText}`}>
              Estes dados identificam-no perante os alunos da plataforma.
            </p>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                  Nome
                </label>
                <div className={`mt-1.5 flex items-center gap-2 ${inputClass} border px-3 text-zinc-500 dark:text-zinc-400`}>
                  <UserRound size={15} />
                  <span className="truncate text-sm">{user.nome}</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                  E-mail
                </label>
                <div className={`mt-1.5 flex items-center gap-2 ${inputClass} border px-3 text-zinc-500 dark:text-zinc-400`}>
                  <Mail size={15} />
                  <span className="truncate text-sm">{user.email}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                País em que é mentor
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <Select value={pais} onValueChange={setPais}>
                  <SelectTrigger className={`${selectClass} sm:max-w-xs`} aria-label="País em que é mentor">
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    {paises.map((p) => (
                      <SelectItem key={p.nome} value={p.nome}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {pais && <BandeiraPais pais={pais} className="h-6 w-9 shrink-0" />}
              </div>
              <p className={`mt-1.5 text-[11px] ${softText}`}>
                A bandeira aparece junto ao seu nome na lista de mentores.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                  Descrição sobre o mentor
                </label>
                <span className={`text-[10px] ${faintText}`}>
                  {bio.length}/{BIO_MAX}
                </span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                rows={6}
                placeholder="Escreva uma breve descrição sobre a sua experiência, formação e áreas de especialidade..."
                className="mt-1.5 resize-none rounded-xl border-zinc-200/80 bg-white text-sm dark:border-white/[0.08] dark:bg-white/[0.03]"
              />
              <p className={`mt-1.5 text-[11px] ${softText}`}>
                Esta descrição ajuda os alunos a conhecer melhor o seu percurso.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !changed}
              className={`${primaryButton} h-10 px-5 text-[13px]`}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save size={15} />
                  Guardar alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestorPerfil;
