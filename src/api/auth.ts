import { api } from "@/lib/axios";
import Cookies from "js-cookie";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "GESTOR" | "USUARIO";
  image_path: string | null;
  estado_conta: "ACTIVA" | "INACTIVA" | string;
  created_at: string;
  last_active_at: string;
  pushSubscription?: any;
  phone?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function signIn(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/sessions", { email, password });
  return data;
}

export async function signUp(data: {
  nome: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: File; // Adicionei caso você queira enviar a imagem
}): Promise<LoginResponse> {

  // 1. Em vez de enviar um objeto simples, usamos FormData
  const formData = new FormData();

  formData.append("nome", data.nome);
  formData.append("email", data.email);
  formData.append("password", data.password);

  // Garante que o phone seja enviado, mesmo que vazio, para satisfazer o Zod
  formData.append("phone", data.phone || "");

  // Se houver um arquivo de imagem selecionado
  if (data.avatar) {
    formData.append("image", data.avatar);
  }

  // 2. O Axios entende que é um FormData e configura o Content-Type automaticamente
  const response = await api.post<LoginResponse>("/users", formData);

  return response.data;
}
export async function getProfile(): Promise<User> {
  // Ajustado: Se o seu log mostrou { user: { ... } }, precisamos acessar .user
  const { data } = await api.get<{ user: User }>("/profile");
  return data.user;
}

export async function requestMagicLink(email: string): Promise<void> {
  await api.post("/magic-link/request", { email });
}

export async function verifyMagicLink(token: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/magic-link/verify", { token });
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/password/forgot", { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post("/password/reset", { token, password });
}

export async function getProfileDemo(): Promise<User> {
  const token = Cookies.get("token");

  if (!token) throw new Error("No token");
  if (!token.startsWith("demo.")) throw new Error("Invalid token format for demo");

  try {
    const base64Payload = token.replace("demo.", "");

    const decodedPayload = decodeURIComponent(
      window.atob(base64Payload)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(decodedPayload);

    // RETORNO OBRIGATÓRIO: Preenchendo os campos da interface User
    return {
      id: "demo-id",
      nome: payload.nome || payload.sub?.split("@")[0] || "Usuário Demo",
      email: payload.sub || "usuario@demo.com",
      role: (payload.role as "ADMIN" | "GESTOR" | "USUARIO") || "USUARIO",
      image_path: null,
      estado_conta: "ACTIVA",
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Erro ao decodificar token demo:", error);
    }
    throw new Error("Invalid token");
  }
}
