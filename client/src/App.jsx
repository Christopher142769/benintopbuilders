import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
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
import LabellisationPage from './pages/LabellisationPage';
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
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="annuaire" element={<AnnuairePage />} />
            <Route path="pro/:slug" element={<ProfilPublicPage />} />
            <Route
              path="appels-offres"
              element={
                <PlaceholderPage
                  title="Appels d'offres"
                  description="Publiez un besoin ou répondez aux chantiers ouverts."
                />
              }
            />
            <Route
              path="materiaux"
              element={
                <PlaceholderPage
                  title="Matériaux"
                  description="Catalogue des fournisseurs labellisés — ciment, fer, carrelage et plus."
                />
              }
            />
            <Route
              path="formations"
              element={
                <PlaceholderPage
                  title="Formations"
                  description="Sessions présentes et en ligne pour monter en compétences."
                />
              }
            />
            <Route
              path="connexion"
              element={
                <GuestRoute>
                  <ConnexionPage />
                </GuestRoute>
              }
            />
            <Route
              path="inscription"
              element={<InscriptionPage />}
            />
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
              path="admin"
              element={
                <AdminRoute>
                  <PlaceholderPage title="Back-office" description="Espace administrateur — étape 12." />
                </AdminRoute>
              }
            />
            <Route
              path="*"
              element={<PlaceholderPage title="Page introuvable" description="Cette route n'existe pas encore." />}
            />
          </Route>
        </Routes>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
