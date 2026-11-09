import { useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';

const CHAVE_CONVITE = 'push-convite-em';
const INTERVALO_CONVITE_MS = 7 * 24 * 60 * 60 * 1000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function guardarSubscricao() {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const { data } = await api.get('push/public_key');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publickey),
    });
  }

  await api.post('/push/register', { subscription });
}

async function ativar() {
  try {
    if ((await Notification.requestPermission()) !== 'granted') return;
    await guardarSubscricao();
    toast.success('Alertas de bolsas ativados');
  } catch {
    toast.error('Não foi possível ativar os alertas neste aparelho.');
  }
}

function conviteRecente() {
  try {
    return Date.now() - Number(localStorage.getItem(CHAVE_CONVITE) ?? 0) < INTERVALO_CONVITE_MS;
  } catch {
    return false;
  }
}

function marcarConvite() {
  try {
    localStorage.setItem(CHAVE_CONVITE, String(Date.now()));
  } catch {
    // Sem armazenamento, o convite volta a aparecer na próxima visita.
  }
}

/** Liga este aparelho à conta; o pedido de permissão parte de um toque, como o iOS exige. */
export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    if (Notification.permission === 'granted') {
      guardarSubscricao().catch(() => {});
    } else if (Notification.permission === 'default' && !conviteRecente()) {
      marcarConvite();
      toast('Receba alertas de novas bolsas', {
        description: 'Avisamos de imediato quando o seu perfil cumprir os requisitos.',
        duration: 20_000,
        action: { label: 'Ativar', onClick: () => void ativar() },
      });
    }
  }, [userId]);
}
