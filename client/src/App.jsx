import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import PlaceholderPage from './pages/PlaceholderPage';
import InscriptionPage from './pages/InscriptionPage';
import ConnexionPage from './pages/ConnexionPage';
import DashboardLayout from './pages/DashboardLayout';
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
import FormationLearningPage from './pages/FormationLearningPage';
import MessageriePage from './pages/MessageriePage';
import AdhesionPage from './pages/AdhesionPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminConnexionPage from './pages/admin/AdminConnexionPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminFormateursPage from './pages/admin/AdminFormateursPage';
import TrainerConnexionPage from './pages/trainer/TrainerConnexionPage';
import TrainerLayout from './pages/trainer/TrainerLayout';
import {
  TrainerDashboardPage,
  TrainerFormationsPage,
  TrainerCorrectionsPage,
} from './pages/trainer/TrainerPages';
import {
  AdminDossiersPage,
  AdminLabelFormsPage,
  AdminMembresPage,
  AdminModerationPage,
  AdminAuditPage,
} from './pages/admin/AdminPages';
import { PrivateRoute, GuestRoute, AdminRoute, TrainerRoute } from './components/auth/RouteGuards';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if ([400, 401, 403, 404].includes(status)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route index element={<LandingPage />} />

          {/* ---------- Authentification (plein écran) ---------- */}
          <Route path="connexion" element={<GuestRoute><ConnexionPage /></GuestRoute>} />
          <Route path="inscription" element={<InscriptionPage />} />
          <Route path="mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />

          {/* ---------- Espace membre ---------- */}
          <Route path="dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="ma-fiche" element={<MaFichePage />} />
            <Route path="adhesion" element={<AdhesionPage />} />
            <Route path="messagerie" element={<MessageriePage />} />
            <Route path="labellisation" element={<PrivateRoute allowPending={false}><LabellisationPage /></PrivateRoute>} />
            <Route path="mes-ao" element={<PrivateRoute allowPending={false}><MesAOPage /></PrivateRoute>} />
            <Route path="mes-reponses" element={<PrivateRoute allowPending={false}><MesReponsesPage /></PrivateRoute>} />
            <Route path="boutique" element={<PrivateRoute allowPending={false}><BoutiquePage /></PrivateRoute>} />
            <Route path="commandes" element={<PrivateRoute allowPending={false}><MesCommandesPage /></PrivateRoute>} />
            <Route path="appels-offres" element={<PrivateRoute allowPending={false}><AppelsOffresPage /></PrivateRoute>} />
            <Route path="materiaux" element={<PrivateRoute allowPending={false}><MateriauxPage /></PrivateRoute>} />
            <Route path="formations" element={<PrivateRoute allowPending={false}><FormationsPage /></PrivateRoute>} />
            <Route path="formations/:id" element={<PrivateRoute allowPending={false}><FormationLearningPage /></PrivateRoute>} />
            <Route path="securite" element={<ChangePasswordPage />} />
          </Route>

          {/* ---------- Académie — espace formateur ---------- */}
          <Route path="formateur/connexion" element={<GuestRoute><TrainerConnexionPage /></GuestRoute>} />
          <Route path="formateur" element={<TrainerRoute><TrainerLayout /></TrainerRoute>}>
            <Route index element={<TrainerDashboardPage />} />
            <Route path="formations" element={<TrainerFormationsPage />} />
            <Route path="corrections" element={<TrainerCorrectionsPage />} />
            <Route path="securite" element={<ChangePasswordPage />} />
          </Route>

          {/* ---------- Back-office ---------- */}
          <Route
            path="admin/connexion"
            element={<GuestRoute><AdminConnexionPage /></GuestRoute>}
          />
          <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="formations" element={<AdminFormateursPage />} />
            <Route path="formateurs" element={<AdminFormateursPage />} />
            <Route path="dossiers" element={<AdminDossiersPage />} />
            <Route path="formulaires-label" element={<AdminLabelFormsPage />} />
            <Route path="membres" element={<AdminMembresPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="securite" element={<ChangePasswordPage />} />
          </Route>

          {/* ---------- Pages publiques (marketing) ---------- */}
          <Route element={<MainLayout />}>
            <Route path="annuaire" element={<AnnuairePage />} />
            <Route path="pro/:slug" element={<ProfilPublicPage />} />
            <Route path="appels-offres" element={<AppelsOffresPage />} />
            <Route path="materiaux" element={<MateriauxPage />} />
            <Route path="formations" element={<FormationsPage />} />
            <Route path="paiement/retour" element={<PaiementRetourPage />} />
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
