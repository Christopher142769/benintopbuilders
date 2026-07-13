import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import PlaceholderPage from './pages/PlaceholderPage';
import InscriptionPage from './pages/InscriptionPage';
import ConnexionPage from './pages/ConnexionPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PaiementRetourPage from './pages/PaiementRetourPage';
import AnnuairePage from './pages/AnnuairePage';
import ProfilPublicPage from './pages/ProfilPublicPage';
import MaFichePage from './pages/MaFichePage';
import AppelsOffresPage from './pages/AppelsOffresPage';
import MesAOPage from './pages/MesAOPage';
import MesReponsesPage from './pages/MesReponsesPage';
import LabellisationPage from './pages/LabellisationPage';
import MateriauxPage from './pages/MateriauxPage';
import BoutiquePage from './pages/BoutiquePage';
import MesCommandesPage from './pages/MesCommandesPage';
import FormationsPage from './pages/FormationsPage';
import MessageriePage from './pages/MessageriePage';
import AdhesionPage from './pages/AdhesionPage';
import AdminLayout from './pages/admin/AdminLayout';
import {
  AdminStatsPage,
  AdminDossiersPage,
  AdminMembresPage,
  AdminModerationPage,
  AdminAuditPage,
} from './pages/admin/AdminPages';
import { PrivateRoute, GuestRoute, AdminRoute } from './components/auth/RouteGuards';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route index element={<LandingPage />} />

          <Route element={<MainLayout />}>
            <Route path="annuaire" element={<AnnuairePage />} />
            <Route path="pro/:slug" element={<ProfilPublicPage />} />
            <Route path="appels-offres" element={<AppelsOffresPage />} />
            <Route path="materiaux" element={<MateriauxPage />} />
            <Route path="formations" element={<FormationsPage />} />
            <Route
              path="connexion"
              element={
                <GuestRoute>
                  <ConnexionPage />
                </GuestRoute>
              }
            />
            <Route path="inscription" element={<InscriptionPage />} />
            <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
            <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />
            <Route path="paiement/retour" element={<PaiementRetourPage />} />
            <Route
              path="dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/ma-fiche"
              element={
                <PrivateRoute>
                  <MaFichePage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/labellisation"
              element={
                <PrivateRoute allowPending={false}>
                  <LabellisationPage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/mes-ao"
              element={
                <PrivateRoute allowPending={false}>
                  <MesAOPage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/mes-reponses"
              element={
                <PrivateRoute allowPending={false}>
                  <MesReponsesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/boutique"
              element={
                <PrivateRoute allowPending={false}>
                  <BoutiquePage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/commandes"
              element={
                <PrivateRoute allowPending={false}>
                  <MesCommandesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/messagerie"
              element={
                <PrivateRoute>
                  <MessageriePage />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard/adhesion"
              element={
                <PrivateRoute>
                  <AdhesionPage />
                </PrivateRoute>
              }
            />
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminStatsPage />} />
              <Route path="dossiers" element={<AdminDossiersPage />} />
              <Route path="membres" element={<AdminMembresPage />} />
              <Route path="moderation" element={<AdminModerationPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
            </Route>
            <Route
              path="*"
              element={
                <PlaceholderPage
                  title="Page introuvable"
                  description="Cette route n'existe pas. Retournez à l'accueil ou au tableau de bord."
                />
              }
            />
          </Route>
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
