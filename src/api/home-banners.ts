import { api } from "@/lib/axios";

export interface HomeBanner {
  id: string;
  imageUrl: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const homeBannersApi = {
  list: async () => {
    const { data } = await api.get<{ data: HomeBanner[] }>("/home-banners");
    return data;
  },

  create: async (payload: { imageUrl: string; order?: number }) => {
    const { data } = await api.post<{ data: HomeBanner }>("/home-banners", payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/home-banners/${id}`);
    return data;
  },
};
