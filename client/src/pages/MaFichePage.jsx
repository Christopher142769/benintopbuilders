import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { DEPARTEMENTS, METIERS } from '../lib/constants';

export default function MaFichePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [logoPreview, setLogoPreview] = useState(user?.logoUrl || '');

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold">Ma fiche</h1>

      <form className="card mt-8 space-y-4 p-6" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="block text-sm font-bold">
          Logo
          <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={onLogo} />
          {logoPreview && (
            <img src={logoPreview} alt="Logo" className="mt-3 h-24 w-24 rounded-2xl object-cover" />
          )}
        </label>
        <label className="block text-sm font-bold">
          Entreprise
          <input className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...form.register('entreprise')} />
        </label>
        <label className="block text-sm font-bold">
          Présentation
          <textarea rows={4} className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...form.register('presentation')} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold">
            Ville
            <input className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...form.register('ville')} />
          </label>
          <label className="block text-sm font-bold">
            Département
            <select className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...form.register('departement')}>
              {DEPARTEMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold">
            Latitude
            <input className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...form.register('lat')} />
          </label>
          <label className="block text-sm font-bold">
            Longitude
            <input className="mt-1.5 w-full rounded-2xl border-[1.5px] border-black/10 bg-fond-doux px-4 py-3" {...form.register('lng')} />
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-bold">Métiers</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {METIERS.map((m) => {
              const selected = form.watch('metiers')?.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => {
                    const cur = form.getValues('metiers') || [];
                    form.setValue(
                      'metiers',
                      selected ? cur.filter((x) => x !== m.value) : [...cur, m.value]
                    );
                  }}
                  className={`rounded-pill px-3 py-1.5 text-xs font-extrabold ${selected ? 'bg-bleu text-white' : 'bg-fond-doux'}`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" {...form.register('disponible')} /> Disponible
        </label>
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" {...form.register('fichePubliee')} /> Publier dans l&apos;annuaire
        </label>
        <button type="submit" className="btn-orange">Enregistrer</button>
      </form>

      <div className="card mt-6 p-6">
        <h2 className="font-display text-xl font-extrabold">Ajouter une référence (photo)</h2>
        <input type="file" accept="image/*" className="mt-3" onChange={onRefPhoto} />
      </div>
    </div>
  );
}
