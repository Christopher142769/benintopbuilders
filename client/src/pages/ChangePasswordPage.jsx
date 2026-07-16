import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Field, PageHeader, SectionCard } from '../components/ui/PageKit';

function PasswordInput({ value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className="input pr-20"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-pill px-2 py-1 text-xs font-extrabold text-bleu hover:bg-bleu-soft"
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? 'Masquer' : 'Afficher'}
      </button>
    </div>
  );
}

export default function ChangePasswordPage() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const checks = useMemo(
    () => [
      { label: '8 caractères minimum', valid: newPassword.length >= 8 },
      { label: 'Une lettre majuscule', valid: /[A-Z]/.test(newPassword) },
      { label: 'Un chiffre', valid: /[0-9]/.test(newPassword) },
      {
        label: 'Confirmation identique',
        valid: Boolean(confirmPassword) && newPassword === confirmPassword,
      },
    ],
    [confirmPassword, newPassword]
  );
  const valid = currentPassword && checks.every((check) => check.valid);

  async function submit(event) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      clearSession();
      toast.success(data.message || 'Mot de passe modifié');
      navigate('/connexion', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Modification impossible');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Sécurité du compte"
        title="Gardez le contrôle de votre accès."
        description="Modifiez votre mot de passe régulièrement. Toutes les sessions seront fermées après la modification."
        stats={[
          { label: 'Compte', value: user?.email || '—' },
          { label: 'Profil', value: user?.role || '—' },
          { label: 'Protection', value: 'Chiffrement renforcé' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SectionCard title="Modifier mon mot de passe" description="Saisissez votre mot de passe actuel pour confirmer votre identité.">
          <form className="space-y-5" onSubmit={submit}>
            <Field label="Mot de passe actuel">
              <PasswordInput
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Votre mot de passe actuel"
              />
            </Field>
            <Field label="Nouveau mot de passe">
              <PasswordInput
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Minimum 8 caractères"
              />
            </Field>
            <Field label="Confirmer le nouveau mot de passe">
              <PasswordInput
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Répétez le nouveau mot de passe"
              />
            </Field>
            <button type="submit" className="btn-orange" disabled={!valid || saving}>
              {saving ? 'Sécurisation…' : 'Modifier le mot de passe'}
            </button>
          </form>
        </SectionCard>

        <aside className="rounded-[28px] bg-ink p-6 text-white shadow-lift">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-orange">Niveau de sécurité</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange to-emerald-400 transition-all duration-500"
              style={{ width: `${(checks.filter((check) => check.valid).length / checks.length) * 100}%` }}
            />
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            {checks.map((check) => (
              <li key={check.label} className={`flex items-center gap-3 transition ${check.valid ? 'text-white' : 'text-white/45'}`}>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${check.valid ? 'bg-emerald-500' : 'bg-white/10'}`}>
                  {check.valid ? '✓' : '·'}
                </span>
                {check.label}
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-white/55">
            Après validation, vous serez déconnecté afin de protéger toutes les sessions ouvertes.
          </p>
        </aside>
      </div>
    </div>
  );
}
