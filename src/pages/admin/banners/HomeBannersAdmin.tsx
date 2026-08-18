import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trash2, Loader2, Image as ImageIcon, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { homeBannersApi } from "@/api/home-banners";
import { api, getUploadUrl } from "@/lib/axios";
import toast from "react-hot-toast";
import { useUser } from "@/api/useGetProfile";

export function HomeBannersAdmin() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);

  const { data: bannersData, isLoading } = useQuery({
    queryKey: ["home-banners"],
    queryFn: homeBannersApi.list,
  });
  const banners = bannersData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: homeBannersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-banners"] });
      toast.success("Banner removido");
    },
    onError: () => toast.error("Erro ao remover banner"),
  });

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post<{ url: string; path: string }>("/upload", formData);
        await homeBannersApi.create({ imageUrl: data.path, order: banners.length });
        queryClient.invalidateQueries({ queryKey: ["home-banners"] });
        toast.success("Banner adicionado!");
      } catch {
        toast.error("Erro no upload");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  function imageSrc(url: string) {
    if (url.startsWith("http")) return url;
    return getUploadUrl(`/uploads/${url}`);
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Banners da Página Inicial
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Gerir as imagens do slideshow da página inicial
            </p>
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="h-10 px-4 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Adicionar Banner
          </Button>
        </div>

        {banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Nenhum banner</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-xs">Adicione imagens para o slideshow da página inicial</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
              >
                <GripVertical size={18} className="text-gray-300 dark:text-zinc-600 shrink-0" />
                <div className="w-32 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] shrink-0 border border-gray-200 dark:border-white/[0.08]">
                  <img
                    src={imageSrc(banner.imageUrl)}
                    alt={`Banner ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Banner #{i + 1}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    {banner.imageUrl}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm("Tem a certeza que deseja remover este banner?")) {
                      deleteMutation.mutate(banner.id);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                  title="Remover"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default HomeBannersAdmin;
