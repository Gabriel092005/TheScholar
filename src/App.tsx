import { RouterProvider } from 'react-router-dom'
import './global.css'
import { router } from './routes'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { Toaster as ToasterHot } from 'react-hot-toast'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import { ThemeProvider } from './components/theme/theme-provider'
import { CartProvider } from '@/contexts/cart-context'
import { PwaStatus } from './components/pwa-status'

export function App() {
  return (
    <HelmetProvider>
      <Helmet titleTemplate='%s | Afroscholars' />
      <Toaster richColors />
      {/* Muitos ecrãs ainda avisam por react-hot-toast: sem isto, as mensagens não aparecem. */}
      <ToasterHot position="top-center" />
      <ThemeProvider storageKey="vite-ui-theme" defaultTheme="light">
        <PwaStatus />
        <CartProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </CartProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}
