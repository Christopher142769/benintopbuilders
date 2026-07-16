import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatFcfa } from '../../lib/constants';
import { Icon } from '../../components/ui/icons';
import { PageHeader, SectionCard, StatusBadge } from '../../components/ui/PageKit';

const number = new Intl.NumberFormat('fr-FR');

function Metric({ label, value, detail, icon, tone = 'blue' }) {
  const tones = {
    blue: 'from-bleu to-[#164e89]',
    orange: 'from-orange to-[#e96519]',
    ink: 'from-ink to-[#334155]',
    green: 'from-[#087f5b] to-[#10b981]',
  };
  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white p-5 shadow-[0_18px_50px_rgba(17,40,72,.08)] transition duration-300 hover:-translate-y-1">
      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${tones[tone]} opacity-[.08] transition group-hover:scale-125`} />
      <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white shadow-lg`}>
        {icon}
      </div>
      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.16em] text-gris">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-gris">{detail}</p>
    </article>
  );
}

function TrafficChart({ points = [] }) {
  const max = Math.max(...points.map((point) => point.visiteursUniques), 1);
  const total = points.reduce((sum, point) => sum + point.visiteursUniques, 0);
  return (
    <SectionCard
      eyebrow="Affluence mesurée"
      title="Membres actifs sur 30 jours"
      action={<span className="chip">{number.format(total)} visites/jours cumulées</span>}
    >
      <div className="mt-2 flex h-56 items-end gap-1.5 rounded-3xl bg-gradient-to-b from-bleu-soft/60 to-transparent px-4 pb-4 pt-8">
        {points.map((point, index) => (
          <div key={point._id} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-bleu to-[#50a6db] opacity-80 transition hover:opacity-100"
              style={{ height: `${Math.max(3, (point.visiteursUniques / max) * 100)}%` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl group-hover:block">
              {new Date(point._id).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {point.visiteursUniques} membre(s)
            </div>
            {(index === 0 || index === points.length - 1 || index === 14) && (
              <span className="absolute top-full mt-2 text-[9px] font-bold text-gris">
                {new Date(point._id).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/stats')).data.data,
    refetchInterval: 60_000,
  });
  const learning = Object.fromEntries((data?.apprentissage || []).map((item) => [item._id, item.count]));
  const activity = data?.activite || {};
  const health = data?.sante || {};
  const maxPalier = Math.max(...(data?.repartitionPaliers || []).map((item) => item.count), 1);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader
        eyebrow="Centre de pilotage · données actualisées"
        title="La plateforme, en un seul regard."
        description="Suivez l’acquisition, l’activité commerciale, les parcours de labellisation et la santé opérationnelle de Bénin Top Builders."
        stats={[
          { label: 'Santé globale', value: isLoading ? '…' : `${health.score || 0}/100` },
          { label: 'Nouveaux · 30 j', value: data?.nouveaux30j ?? '—' },
          { label: 'Actifs · 7 j', value: data?.actifs7j ?? '—' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Communauté" value={number.format(data?.membresTotal || 0)} detail={`${data?.membresActifs || 0} comptes actifs`} icon={Icon.users({})} />
        <Metric label="Offres générées" value={number.format(activity.offres || 0)} detail={`${activity.reponses || 0} réponses déposées`} icon={Icon.doc({})} tone="orange" />
        <Metric label="Demandes marketplace" value={number.format(activity.demandesMarketplace || 0)} detail="Mises en relation hors plateforme" icon={Icon.store({})} tone="ink" />
        <Metric label="Revenus · 30 jours" value={formatFcfa(data?.volumeFcfa30j || 0)} detail="Paiements confirmés uniquement" icon={Icon.chart({})} tone="green" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_.85fr]">
        <TrafficChart points={data?.affluence30j || []} />
        <section className="relative overflow-hidden rounded-[30px] bg-ink p-6 text-white shadow-[0_24px_70px_rgba(8,29,51,.22)]">
          <div className="ambient-orb absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange/25 blur-3xl" />
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-orange-light">État de santé</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-extrabold">{health.score || 0}<span className="text-xl text-white/40">/100</span></p>
              <p className="mt-2 font-bold text-white/70">{health.statut || 'Calcul en cours'}</p>
            </div>
            <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              {Icon.shield({ className: 'h-7 w-7' })}
            </div>
          </div>
          <div className="mt-7 space-y-3 text-sm">
            <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/55">Base de données</span><strong className="text-emerald-300">{health.database || '—'}</strong></div>
            <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/55">API</span><strong className="text-emerald-300">{health.api || '—'}</strong></div>
            <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-white/55">Éléments en attente</span><strong>{health.backlog || 0}</strong></div>
            <div className="flex justify-between"><span className="text-white/55">Disponibilité continue</span><strong>{Math.floor((health.uptimeSecondes || 0) / 3600)} h</strong></div>
          </div>
          <p className="mt-5 text-[10px] leading-4 text-white/35">
            L’affluence est calculée à partir des activités authentifiées{health.mesureDepuis ? ` depuis le ${new Date(health.mesureDepuis).toLocaleDateString('fr-FR')}` : ''}.
          </p>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard eyebrow="Acquisition" title="Répartition des formules">
          <div className="space-y-4">
            {(data?.repartitionPaliers || []).map((item) => (
              <div key={item._id}>
                <div className="mb-1.5 flex justify-between text-xs font-extrabold capitalize"><span>{item._id}</span><span>{item.count}</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-fond-doux"><div className="h-full rounded-full bg-gradient-to-r from-bleu to-orange" style={{ width: `${(item.count / maxPalier) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard eyebrow="Académie BTB" title="Progression des apprenants">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-bleu-soft p-4"><strong className="text-2xl text-bleu">{learning.en_cours || 0}</strong><p className="mt-1 text-xs font-bold text-gris">En cours</p></div>
            <div className="rounded-2xl bg-orange-soft p-4"><strong className="text-2xl text-orange-dark">{learning.a_corriger || 0}</strong><p className="mt-1 text-xs font-bold text-gris">À corriger</p></div>
            <div className="rounded-2xl bg-emerald-50 p-4"><strong className="text-2xl text-emerald-700">{learning.terminee || 0}</strong><p className="mt-1 text-xs font-bold text-gris">Certifiés</p></div>
            <div className="rounded-2xl bg-fond-doux p-4"><strong className="text-2xl">{activity.formationsPubliees || 0}</strong><p className="mt-1 text-xs font-bold text-gris">Formations</p></div>
          </div>
        </SectionCard>
        <SectionCard eyebrow="File opérationnelle" title="Actions à traiter">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-filet p-4"><div><p className="font-bold">Dossiers labels</p><p className="text-xs text-gris">Contrôles et visites</p></div><StatusBadge value={data?.moderation?.dossiersAttente ? 'en_attente' : 'à jour'} /></div>
            <div className="flex items-center justify-between rounded-2xl border border-filet p-4"><div><p className="font-bold">Avis signalés</p><p className="text-xs text-gris">Modération qualité</p></div><strong className="text-orange">{data?.moderation?.avisAttente || 0}</strong></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
