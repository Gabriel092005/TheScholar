import { io, Socket } from "socket.io-client";
import type { CommunityMessage } from "@/api/comunidades";
import { env } from "@/env";
import Cookies from "js-cookie";

function getApiOrigin(): string {
  const apiUrl = env.VITE_API_URL;
  try {
    return new URL(apiUrl).origin;
  } catch {
    return apiUrl.replace(/\/api\/?$/, "");
  }
}

const SOCKET_URL = getApiOrigin();

export interface ServerToClientEvents {
  "nova_mensagem": (data: CommunityMessage) => void;
  "nova_notificacao": (data: { 
    id: string; 
    titulo: string; 
    conteudo: string; 
    tipo: string; 
    link?: string | null;
    visualizada: boolean;
    created_at: string;
  }) => void;
  "notification": (data: { message: string; type: "info" | "warning" | "error" }) => void;
  "new_message": (data: { senderId: string; content: string }) => void;
  "alguem_escrevendo": (data: { comunidadeId: string; usuarioId: string; nome: string }) => void;
}

export interface ClientToServerEvents {
  "join_room":         (userId: string) => void;
  "ping":              () => void;
  "entrar_comunidade": (comunidadeId: string) => void;
  "sair_comunidade":   (comunidadeId: string) => void;
  "typing":            (data: { comunidadeId: string; nome: string }) => void;
}

function parseJwt(token: string): { sub?: string; userId?: string } | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getUserIdFromCookie(): string {
  const token = getTokenFromCookie();
  if (!token) return "";
  const payload = parseJwt(token);
  return String(payload?.sub ?? payload?.userId ?? "");
}

function getTokenFromCookie(): string {
  return Cookies.get("token") ?? Cookies.get("refreshToken") ?? "";
}

// ── Instância do socket ───────────────────────────────────────────────────────

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  path: import.meta.env.PROD ? "/api/socket.io/" : "/socket.io/",
  transports: ["polling", "websocket"],
  withCredentials: true, // ✅ obrigatório para os cookies serem enviados

  reconnection:         true,
  reconnectionAttempts: 5,
  reconnectionDelay:    1000,
  reconnectionDelayMax: 10_000,
  randomizationFactor:  0.3,

  // JWT lido do cookie a cada (re)conexão
  auth: (cb) => {
    cb({ token: getTokenFromCookie() });
  },

  // userId extraído do payload do token
  query: () => ({
    userId: getUserIdFromCookie(),
  }),
});

// ── Helpers de ligação ────────────────────────────────────────────────────────

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.removeAllListeners();
  socket.disconnect();
}

export function reconnectSocket() {
  socket.disconnect();
  socket.connect();
}

// ── Debug ─────────────────────────────────────────────────────────────────────

if (import.meta.env.DEV) {
  socket.on("connect", () => {
    console.info("[socket] ✅ Conectado:", socket.id);
    console.info("[socket] 👤 UserId:", getUserIdFromCookie());
  });

  socket.on("disconnect", (reason) => {
    console.warn("[socket] ❌ Desconectado:", reason);
    if (reason === "io server disconnect") {
      console.warn("[socket] ⚠️ Servidor fechou a ligação — token expirado?");
    }
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] ⚠️ Erro:", err.message);
  });

  socket.io.on("reconnect_attempt", (n) =>
    console.info(`[socket] 🔄 Reconexão #${n}`)
  );
  socket.io.on("reconnect_failed", () =>
    console.error("[socket] 💀 Falhou todas as tentativas.")
  );
  socket.io.on("reconnect", (n) =>
    console.info(`[socket] ✅ Reconectado após ${n} tentativa(s)`)
  );
}