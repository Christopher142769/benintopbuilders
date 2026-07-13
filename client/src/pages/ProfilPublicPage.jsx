import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

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
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="card h-40 animate-pulse bg-fond-doux" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">Fiche introuvable</h1>
        <Link to="/annuaire" className="btn-orange mt-6 inline-flex">
          Retour annuaire
        </Link>
      </div>
    );
  }

  const titre = data.entreprise || `${data.prenom || ''} ${data.nom || ''}`.trim();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <div className="card overflow-hidden">
        <div className="border-b border-filet bg-fond-doux px-6 py-8 md:px-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Fiche professionnelle</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">{titre}</h1>
              <p className="mt-2 text-black/60">
                {data.ville}
                {data.departement ? ` · ${data.departement}` : ''}
                {data.disponible ? ' · Disponible' : ' · Indisponible'}
              </p>
            </div>
            {data.label?.niveau && (
              <span className="rounded-pill bg-ink px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
                Label {data.label.niveau}
              </span>
            )}
          </div>
          {user ? (
            <Link
              to={`/dashboard?msg=new&slug=${data.slug}`}
              className="btn-orange mt-6 inline-flex"
            >
              Contacter
            </Link>
          ) : (
            <Link to="/connexion" className="btn-orange mt-6 inline-flex">
              Se connecter pour contacter
            </Link>
          )}
        </div>

        <div className="space-y-8 px-6 py-8 md:px-10">
          <section>
            <h2 className="font-display text-xl font-extrabold">Présentation</h2>
            <p className="mt-2 whitespace-pre-wrap text-black/70">
              {data.presentation || 'Aucune présentation renseignée.'}
            </p>
          </section>

          {data.metiers?.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-extrabold">Métiers</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.metiers.map((m) => (
                  <span key={m} className="rounded-pill bg-bleu-soft px-3 py-1 text-xs font-extrabold text-bleu">
                    {m}
                  </span>
                ))}
              </div>
            </section>
          )}

          {data.references?.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-extrabold">Références chantiers</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {data.references.map((r) => (
                  <div key={r._id || r.titre} className="rounded-[22px] border-[1.5px] border-black/10 p-4">
                    <div className="font-bold">{r.titre}</div>
                    <p className="mt-1 text-sm text-black/60">{r.description}</p>
                    {r.photos?.[0] && (
                      <img
                        src={r.photos[0]}
                        alt={r.titre}
                        className="mt-3 h-36 w-full rounded-media object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.certifications?.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-extrabold">Certifications</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {data.certifications.map((c) => (
                  <li key={c._id || c.titre} className="font-bold">
                    {c.titre}
                    {c.organisme ? ` — ${c.organisme}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl font-extrabold">
              Avis ({data.nbAvis || 0}) · {data.noteMoyenne?.toFixed?.(1) || data.noteMoyenne || '—'} / 5
            </h2>
            <div className="mt-4 space-y-3">
              {(data.avis || []).length === 0 && (
                <p className="text-sm text-black/55">Pas encore d&apos;avis publiés.</p>
              )}
              {(data.avis || []).map((a) => (
                <div key={a._id} className="rounded-2xl bg-fond-doux p-4 text-sm">
                  <div className="font-extrabold text-orange">{'★'.repeat(a.note)}</div>
                  <p className="mt-1 text-black/70">{a.commentaire}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
