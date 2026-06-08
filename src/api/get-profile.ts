import { api } from "@/lib/axios";
import { User } from "./auth";

export async function getProfile(): Promise<User> {
  const { data } = await api.get<{ user: User }>("/profile");
  return data.user;
}

export async function updateProfile(data: { nome?: string; email?: string; phone?: string }): Promise<User> {
  const response = await api.put<{ user: User }>("/update", data);
  return response.data.user;
}

export async function updateProfilePhoto(image: File): Promise<{ message: string; image_path: string }> {
  const formData = new FormData();
  formData.append("image", image);
  const response = await api.put<{ message: string; image_path: string }>("/update/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}