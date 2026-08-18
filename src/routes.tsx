import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout }      from './pages/_layouts/auth';
import { RootGate }        from './pages/app/RootGate';
import { SignIn }          from './pages/auth/Sign-in';
import { SignUp }          from './pages/auth/sign-up';
import { ForgotPassword }  from './pages/auth/ForgotPassword';
import { ResetPassword }   from './pages/auth/ResetPassword';
import { VerifyMagicLink } from './pages/auth/verify-magic-link';
import { GoogleCallback } from './pages/auth/google-callback';
import { HomePage } from './pages/app/home';
import { SettingsPage } from './pages/app/settings';
import { ComunidadesPage } from './pages/app/comunidades/index';
import { ComunidadeChatPage } from './pages/app/comunidades/[id]';
import { DepoimentosPage } from './pages/app/depoimentos';
import { HistoriasPage } from './pages/app/historias';
import { MinhasAtividadesPage } from './pages/app/minhas-atividades';
import { CalendarioConsultorias } from './pages/app/consultorias/CalendarioConsultorias';
import { CalendarioPublico } from './pages/public/CalendarioPublico';

import { ScholarshipApp } from './pages/app/scholarShip/ScholarshipApp';
import { ScholarshipDetailPage } from './pages/app/scholarShip/scholarShipDetailsPage';
import { CursosApp } from './pages/app/courses/CursosApp';
import { CursoDetail } from './pages/app/courses/CursoDetail';
import { PlayerAulas } from './pages/app/courses/PlayerAulas';
import { NovidadesPage } from './pages/app/novidades/index';
import { NovidadeDetailPage } from './pages/app/novidades/[id]';
import { AnaliseDocumentoPage } from './pages/app/analise-documento/AnaliseDocumento';
import { PerfilAcademicoPage } from './pages/app/perfil-academico/PerfilAcademico';
import { EntrevistaPage } from './pages/app/entrevista/EntrevistaPage';
import { ProficienciaPage } from './pages/app/proficiencia/ProficienciaPage';
import { AulasOnlinePage } from './pages/app/aulas/index';
import { AulaOnlineRoomPage } from './pages/app/aulas/[id]';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BolsasAdmin } from './pages/admin/bolsas/BolsasAdmin';
import { InscricoesAdmin } from './pages/admin/bolsas/InscricoesAdmin';
import { ConsultoriaAdmin } from './pages/admin/bolsas/ConsultoriaAdmin';
import { MentoriaAdmin } from './pages/admin/bolsas/MentoriaAdmin';
import { CursosAdmin } from './pages/admin/cursos/CursosAdmin';
import { CourseDetailAdmin } from './pages/admin/cursos/CourseDetailAdmin';
import { PagamentosAdmin } from './pages/admin/cursos/PagamentosAdmin';
import { EstatisticasAdmin } from './pages/admin/estatisticas/EstatisticasAdmin';
import { NovidadesAdmin } from './pages/admin/novidades/NovidadesAdmin';
import { ComunidadesAdmin } from './pages/admin/comunidades/ComunidadesAdmin';
import { UsuariosAdmin } from './pages/admin/usuarios/UsuariosAdmin';
import { DepoimentosAdmin } from './pages/admin/depoimentos/DepoimentosAdmin';
import { AnaliseDocumentoAdmin } from './pages/admin/analise-documento/AnaliseDocumentoAdmin';
import { AulasOnlineAdmin } from './pages/admin/aulas-online/AulasOnlineAdmin';
import { HomeBannersAdmin } from './pages/admin/banners/HomeBannersAdmin';
import { MapaGlobalAdmin } from './pages/admin/mapa-global/MapaGlobalAdmin';
import { AtividadesAdmin } from './pages/admin/atividades/AtividadesAdmin';


export const router = createBrowserRouter([

  {
    path: '/',
    element: <RootGate />,
    children: [
      { index: true,                             element: <HomePage/> },
      { path: 'settings',                        element: <SettingsPage /> },
      { path: 'bolsas',                        element: <ScholarshipApp/> },
      { path: "bolsas/:id",                     element: <ScholarshipDetailPage></ScholarshipDetailPage>},
      { path: 'entrevista',                    element: <EntrevistaPage /> },
      { path: 'entrevista/:bolsaId',           element: <EntrevistaPage /> },
      { path: 'proficiencia',                  element: <ProficienciaPage /> },
      { path: 'cursos',                         element: <CursosApp /> },
      { path: 'cursos/:id',                    element: <CursoDetail /> },
      { path: 'cursos/:id/aulas',              element: <PlayerAulas /> },
      { path: 'comunidades',                   element: <ComunidadesPage /> },
      { path: 'comunidades/:id',               element: <ComunidadeChatPage /> },
      { path: 'minhas-atividades',             element: <MinhasAtividadesPage /> },
      { path: 'minhas-consultorias',           element: <CalendarioConsultorias /> },
      { path: 'depoimentos',                   element: <DepoimentosPage /> },
      { path: 'historias',                     element: <HistoriasPage /> },
      { path: 'novidades',                     element: <NovidadesPage /> },
      { path: 'novidades/:id',                 element: <NovidadeDetailPage /> },
      { path: 'analise-documento',             element: <AnaliseDocumentoPage /> },
      { path: 'perfil-academico',              element: <PerfilAcademicoPage /> },
      { path: 'aulas',                         element: <AulasOnlinePage /> },
      { path: 'aulas/:id',                     element: <AulaOnlineRoomPage /> },

    ],
  },

  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: 'sign-in',          element: <SignIn /> },
      { path: 'sign-up',          element: <SignUp /> },
      { path: 'password-recover', element: <ForgotPassword /> },
      { path: 'reset-password',   element: <ResetPassword /> },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────
  {
    path: '/admin',
    element: <AdminDashboard />,
    children: [
      { index: true, element: <Navigate to="/admin/estatisticas" replace /> },
      { path: 'bolsas', element: <BolsasAdmin /> },
      { path: 'inscricoes', element: <InscricoesAdmin /> },
      { path: 'consultoria', element: <ConsultoriaAdmin /> },
      { path: 'mentoria', element: <MentoriaAdmin /> },
      { path: 'cursos', element: <CursosAdmin /> },
      { path: 'cursos/:id', element: <CourseDetailAdmin /> },
      { path: 'cursos/pagamentos', element: <PagamentosAdmin /> },
      { path: 'estatisticas', element: <EstatisticasAdmin /> },
      { path: 'novidades', element: <NovidadesAdmin /> },
      { path: 'comunidades', element: <ComunidadesAdmin /> },
      { path: 'usuarios', element: <UsuariosAdmin /> },
      { path: 'depoimentos', element: <DepoimentosAdmin /> },
      { path: 'analise-documento', element: <AnaliseDocumentoAdmin /> },
      { path: 'aulas-online', element: <AulasOnlineAdmin /> },
      { path: 'banners', element: <HomeBannersAdmin /> },
      { path: 'atividades', element: <AtividadesAdmin /> },
      { path: 'mapa-global', element: <MapaGlobalAdmin /> },
    ],
  },

  // ── Calendário Público ──────────────────────────────
  {
    path: '/calendario',
    element: <CalendarioPublico />,
  },

  // ── Magic Link Verify ────────────────────────────────────
  {
    path: '/auth/verify-magic-link',
    element: <VerifyMagicLink />,
  },

  // ── Google OAuth Callback ────────────────────────────────
  {
    path: '/auth/google-callback',
    element: <GoogleCallback />,
  },

  // ── Welcome Preview ─────────────────────────────────────
  // Legado: aponta para a raiz, onde o RootGate decide a tela
  {
    path: '/welcome',
    element: <Navigate to="/" replace />,
  },

  // ── Fallback ──────────────────────────────────────────────
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
