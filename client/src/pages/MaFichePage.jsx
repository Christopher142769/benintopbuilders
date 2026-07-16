import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { DEPARTEMENTS, METIERS } from '../lib/constants';
import { Field, PageHeader, SectionCard } from '../components/ui/PageKit';

export default function MaFichePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [logoPreview, setLogoPreview] = useState(user?.logoUrl || '');
  const [locating, setLocating] = useState(false);

  const form = useForm({
    defaultValues: {
      entreprise: user?.entreprise || '',
      presentation: user?.presentation || '',
      ville: user?.ville || '',
      departement: user?.departement || 'Littoral',
      disponible: user?.disponible ?? true,
      fichePubliee: user?.fichePubliee ?? false,
      metiers: user?.metiers || [],
      lat: '',
      lng: '',
    },
  });

  async function onSubmit(values) {
    try {
      const payload = {
        ...values,
        lat: values.lat ? Number(values.lat) : undefined,
        lng: values.lng ? Number(values.lng) : undefined,
      };
      const { data } = await api.patch('/me/profil', payload);
      setSession(data.data.user, accessToken);
      toast.success('Fiche mise à jour');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Erreur');
    }
  }

  async function onLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const { data } = await api.post('/me/logo', fd);
      setSession(data.data.user, accessToken);
      toast.success('Logo mis à jour');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Upload échoué');
    }
  }

  async function onRefPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('titre', 'Chantier récent');
    try {
      const { data } = await api.post('/me/references', fd);
      setSession(data.data.user, accessToken);
      toast.success('Référence ajoutée');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Upload échoué');
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non disponible');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        form.setValue('lat', coords.latitude.toFixed(6));
        form.setValue('lng', coords.longitude.toFixed(6));
        setLocating(false);
        toast.success('Position détectée');
      },
      () => {
        setLocating(false);
        toast.error('Impossible de récupérer votre position');
      }
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Identité professionnelle"
        title="Une fiche qui inspire confiance."
        description="Soignez votre identité, votre zone d’intervention et vos réalisations. Les informations publiées alimentent directement l’annuaire."
        stats={[
          { label: 'Visibilité', value: user?.fichePubliee ? 'Publiée' : 'Brouillon' },
          { label: 'Disponibilité', value: user?.disponible ? 'Disponible' : 'Indisponible' },
          { label: 'Références', value: user?.references?.length || 0 },
          { label: 'Label', value: user?.label?.niveau || 'Aucun' },
        ]}
      />

      <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <SectionCard title="Présentation" description="Votre identité visible par les clients et partenaires.">
            <div className="grid gap-5 md:grid-cols-[150px_1fr]">
              <div>
                <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[28px] border border-dashed border-bleu/30 bg-bleu-soft">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-center text-xs font-bold text-bleu">Votre<br />logo</span>
                  )}
                </div>
                <label className="btn-line btn-sm mt-3 cursor-pointer">
                  Changer
                  <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
                </label>
              </div>
              <div className="space-y-4">
                <Field label="Entreprise / nom commercial">
                  <input className="input" {...form.register('entreprise')} />
                </Field>
                <Field label="Présentation" hint="Expliquez votre expertise, vos méthodes et ce qui vous différencie.">
                  <textarea rows={5} className="input resize-y" {...form.register('presentation')} />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Métiers & expertise" description="Sélectionnez les activités sur lesquelles vous souhaitez être trouvé.">
            <div className="flex flex-wrap gap-2">
              {METIERS.map((m) => {
                const selected = form.watch('metiers')?.includes(m.value);
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      const cur = form.getValues('metiers') || [];
                      form.setValue('metiers', selected ? cur.filter((x) => x !== m.value) : [...cur, m.value]);
                    }}
                    className={`rounded-pill border px-4 py-2 text-xs font-extrabold transition ${
                      selected ? 'border-bleu bg-bleu text-white' : 'border-filet bg-white text-ink hover:border-bleu'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}{m.label}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Géolocalisation" description="Positionnez précisément votre activité pour apparaître dans les recherches de proximité.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ville">
                <input className="input" {...form.register('ville')} />
              </Field>
              <Field label="Département">
                <select className="input" {...form.register('departement')}>
              {DEPARTEMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
                </select>
              </Field>
              <Field label="Latitude">
                <input className="input" inputMode="decimal" {...form.register('lat')} />
              </Field>
              <Field label="Longitude">
                <input className="input" inputMode="decimal" {...form.register('lng')} />
              </Field>
            </div>
            <button type="button" className="btn-line btn-sm mt-4" onClick={useCurrentLocation} disabled={locating}>
              {locating ? 'Localisation…' : '⌖ Utiliser ma position actuelle'}
            </button>
          </SectionCard>

          <SectionCard title="Références" description="Ajoutez des preuves visuelles de vos réalisations.">
            {user?.references?.length > 0 && (
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {user.references.map((reference) => (
                  <article key={reference._id} className="rounded-2xl bg-fond-doux p-4">
                    <p className="font-bold">{reference.titre}</p>
                    <p className="mt-1 text-xs text-gris">{reference.lieu || 'Lieu non précisé'} · {reference.annee || '—'}</p>
                  </article>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer flex-col items-center rounded-[24px] border border-dashed border-bleu/30 bg-bleu-soft/40 px-5 py-8 text-center">
              <span className="text-2xl text-bleu">＋</span>
              <span className="mt-2 text-sm font-extrabold">Ajouter une photo de chantier</span>
              <span className="mt-1 text-xs text-gris">JPG, PNG ou WebP</span>
              <input type="file" accept="image/*" className="hidden" onChange={onRefPhoto} />
            </label>
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <SectionCard title="Publication">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-fond-doux p-4 text-sm font-bold">
                Disponible
                <input type="checkbox" className="h-5 w-5 accent-orange" {...form.register('disponible')} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-fond-doux p-4 text-sm font-bold">
                Publier dans l’annuaire
                <input type="checkbox" className="h-5 w-5 accent-orange" {...form.register('fichePubliee')} />
              </label>
            </div>
            <button type="submit" className="btn-orange mt-5 w-full">Enregistrer la fiche</button>
          </SectionCard>
          <div className="rounded-[24px] bg-ink p-5 text-white shadow-soft">
            <p className="text-xs font-extrabold uppercase tracking-wide text-orange">Conseil</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Une présentation claire, une position précise et trois références augmentent fortement la confiance.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
