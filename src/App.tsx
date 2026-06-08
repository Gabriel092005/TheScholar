import { RouterProvider } from 'react-router-dom'
import './global.css'
import { router } from './routes'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { ThemeProvider } from './components/theme/theme-provider'
import { CartProvider } from '@/contexts/cart-context'
import { api } from './lib/axios'
import { useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    if (Notification.permission === 'denied') return;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const { data } = await api.get('push/public_key');
      const convertedVapidKey = urlBase64ToUint8Array(data.publickey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    await api.post('/push/register', { subscription });
  } catch {
    // Usuário não autenticado ou push não suportado
  }
}

export function App() {
  useEffect(() => {
    registerPush();
  }, []);

  return (
    <HelmetProvider>
      <Helmet titleTemplate='%s | Afroscholars' />
      <Toaster richColors />
      <ThemeProvider storageKey="vite-ui-theme" defaultTheme="light">
        <CartProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </CartProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}
