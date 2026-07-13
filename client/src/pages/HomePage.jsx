import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function HomePage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data?.data))
      .catch(() => setHealth({ status: 'offline' }));
  }, []);

  return (
    <div>
      <section className="border-b border-filet bg-gradient-to-b from-bleu-soft/60 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-8 md:py-24">
          <div>
            <span className="eyebrow">Écosystème du BTP au Bénin</span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-5xl lg:text-6xl">
              Accédez aux meilleurs talents.
              <br />
              Saisissez les <span className="text-orange">opportunités</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium text-gris md:text-lg">
              Annuaire géolocalisé, appels d&apos;offres, label Bronze / Argent / Or et vitrines
              fournisseurs — sans commission sur vos mises en relation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/inscription" className="btn-orange">
                Créer mon profil →
              </Link>
              <Link to="/annuaire" className="btn-line">
                Explorer l&apos;annuaire
              </Link>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-filet pt-6">
              {[
                { v: '0%', l: 'Commission' },
                { v: '12', l: 'Départements' },
                { v: '3', l: 'Niveaux de label' },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-2xl font-extrabold tracking-tight">{s.v}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-gris">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-section border-[1.5px] border-card bg-ink shadow-lift">
            <div className="aspect-[4/4.2] bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1100&q=80&auto=format&fit=crop')] bg-cover bg-center opacity-90" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-6 text-white">
              <p className="font-display text-lg font-bold">Confiance labellisée</p>
              <p className="mt-1 text-sm text-white/75">Bronze · Argent · Or — audit vérifié</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <span className="eyebrow">Plateforme</span>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          Une infrastructure complète pour professionnaliser votre activité.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              t: 'Annuaire géolocalisé',
              d: 'Trouvez des entreprises et artisans par métier, département et label.',
              to: '/annuaire',
            },
            {
              t: 'Appels d\'offres',
              d: 'Publiez un besoin ou répondez aux chantiers ouverts près de chez vous.',
              to: '/appels-offres',
            },
            {
              t: 'Matériaux & formations',
              d: 'Catalogue fournisseurs au forfait et parcours certifiants pour vos équipes.',
              to: '/materiaux',
            },
          ].map((c) => (
            <Link key={c.t} to={c.to} className="card p-6 transition hover:-translate-y-1 hover:shadow-lift">
              <h3 className="font-display text-lg font-extrabold">{c.t}</h3>
              <p className="mt-2 text-sm text-gris">{c.d}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-card border border-filet bg-bleu-soft px-5 py-4 text-sm">
          <span className="font-bold text-bleu">API :</span>{' '}
          {health?.status === 'ok' ? (
            <span className="text-ink">
              opérationnelle ({health.database || 'db n/a'}) · {new Date(health.timestamp).toLocaleTimeString('fr-FR')}
            </span>
          ) : health?.status === 'offline' ? (
            <span className="text-orange-dark">hors ligne — démarrez le serveur</span>
          ) : (
            <span className="text-gris">vérification…</span>
          )}
        </div>
      </section>
    </div>
  );
}
