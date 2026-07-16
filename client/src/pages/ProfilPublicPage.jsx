import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

const LABEL_STYLE = {
  or: 'bg-amber-100 text-amber-800',
  argent: 'bg-slate-200 text-slate-700',
  bronze: 'bg-orange-100 text-orange-800',
};

function Section({ title, children }) {
  return (
    <section className="card p-6 md:p-7">
      <h2 className="text-lg font-extrabold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProfilPublicPage() {
  const { slug } = useParams();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, error } = useQuery({
    queryKey: ['pro', slug],
    queryFn: async () => {
      const res = await api.get(`/membres/${slug}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-8">
        <div className="card h-52 animate-pulse bg-fond-doux" />
        <div className="mt-6 grid gap-6">
          <div className="card h-32 animate-pulse bg-fond-doux" />
          <div className="card h-32 animate-pulse bg-fond-doux" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-soft text-orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">Fiche introuvable</h1>
        <p className="mt-2 text-sm text-gris">Cette fiche n&apos;existe pas ou n&apos;est plus publiée.</p>
        <Link to="/annuaire" className="btn-orange mt-6 inline-flex">Retour à l&apos;annuaire</Link>
      </div>
    );
  }

  const titre = data.entreprise || `${data.prenom || ''} ${data.nom || ''}`.trim();
  const note = data.noteMoyenne?.toFixed?.(1) || data.noteMoyenne || '—';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <Link to="/annuaire" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-bleu hover:underline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
        Annuaire
      </Link>

      {/* En-tête */}
      <div className="card overflow-hidden">
        <div className="relative border-b border-filet bg-gradient-to-br from-bleu-soft to-white px-6 py-8 md:px-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink text-2xl font-extrabold text-white shadow-soft">
                {(titre[0] || 'B').toUpperCase()}
              </span>
              <div>
                <p className="eyebrow">Fiche professionnelle</p>
                <h1 className="mt-1.5 text-3xl font-extrabold md:text-4xl">{titre}</h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gris">
                  <span className="inline-flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    {data.ville}{data.departement ? ` · ${data.departement}` : ''}
                  </span>
                  <span className={data.disponible ? 'chip-green' : 'chip'}>
                    {data.disponible ? 'Disponible' : 'Indisponible'}
                  </span>
                </p>
              </div>
            </div>
            {data.label?.niveau && (
              <span className={`inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-extrabold uppercase ${LABEL_STYLE[data.label.niveau] || 'bg-ink text-white'}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><circle cx="12" cy="9" r="6" /><path d="M9 14l-2 7 5-3 5 3-2-7" /></svg>
                Label {data.label.niveau}
              </span>
            )}
          </div>
          {user ? (
            <Link to={`/dashboard?msg=new&slug=${data.slug}`} className="btn-orange mt-6 inline-flex">Contacter</Link>
          ) : (
            <Link to="/connexion" className="btn-orange mt-6 inline-flex">Se connecter pour contacter</Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <Section title="Présentation">
          <p className="whitespace-pre-wrap text-ink/75">{data.presentation || 'Aucune présentation renseignée.'}</p>
        </Section>

        {data.metiers?.length > 0 && (
          <Section title="Métiers">
            <div className="flex flex-wrap gap-2">
              {data.metiers.map((m) => <span key={m} className="chip">{m}</span>)}
            </div>
          </Section>
        )}

        {data.references?.length > 0 && (
          <Section title="Références chantiers">
            <div className="grid gap-4 sm:grid-cols-2">
              {data.references.map((r) => (
                <div key={r._id || r.titre} className="rounded-2xl border border-filet p-4">
                  <div className="font-bold">{r.titre}</div>
                  <p className="mt-1 text-sm text-gris">{r.description}</p>
                  {r.photos?.[0] && <img src={r.photos[0]} alt={r.titre} className="mt-3 h-36 w-full rounded-media object-cover" />}
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.certifications?.length > 0 && (
          <Section title="Certifications">
            <ul className="space-y-2 text-sm">
              {data.certifications.map((c) => (
                <li key={c._id || c.titre} className="flex items-center gap-2 font-bold">
                  <span className="text-bleu">✔</span>{c.titre}{c.organisme ? ` — ${c.organisme}` : ''}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={`Avis (${data.nbAvis || 0}) · ${note} / 5`}>
          <div className="space-y-3">
            {(data.avis || []).length === 0 && <p className="text-sm text-gris">Pas encore d&apos;avis publiés.</p>}
            {(data.avis || []).map((a) => (
              <div key={a._id} className="rounded-2xl border border-filet bg-fond-doux p-4 text-sm">
                <div className="font-extrabold text-orange">{'★'.repeat(a.note)}<span className="text-black/15">{'★'.repeat(5 - a.note)}</span></div>
                <p className="mt-1 text-ink/70">{a.commentaire}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
