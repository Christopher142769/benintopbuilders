import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import PlaceholderPage from './pages/PlaceholderPage';

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
            <Route
              path="annuaire"
              element={
                <PlaceholderPage
                  title="Annuaire géolocalisé"
                  description="Recherchez les professionnels du BTP par métier, département et label."
                />
              }
            />
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
                <PlaceholderPage title="Connexion" description="L'espace membre sera disponible à l'étape d'authentification." />
              }
            />
            <Route
              path="inscription"
              element={
                <PlaceholderPage
                  title="Inscription"
                  description="Le wizard d'adhésion en 5 étapes arrive à l'étape 3."
                />
              }
            />
            <Route
              path="dashboard"
              element={
                <PlaceholderPage title="Tableau de bord" description="Espace membre — bientôt disponible." />
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
