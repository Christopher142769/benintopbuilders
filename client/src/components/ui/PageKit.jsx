export function PageHeader({ eyebrow, title, description, actions, stats = [] }) {
  const statsColumns =
    stats.length === 2
      ? 'lg:grid-cols-2'
      : stats.length === 3
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-4';

  return (
    <header className="relative overflow-hidden rounded-[30px] border border-filet bg-white px-6 py-7 shadow-soft md:px-8 md:py-9">
      <div className="brand-float absolute -right-12 -top-16 h-44 w-44 rounded-full bg-orange-soft blur-sm" />
      <div className="brand-float absolute right-24 top-5 h-24 w-24 rounded-full bg-bleu-soft/80 [animation-delay:-2s]" />
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            {title}
          </h1>
          {description && <p className="mt-3 max-w-xl text-sm leading-6 text-gris">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {stats.length > 0 && (
        <div className={`relative mt-7 grid gap-x-6 gap-y-4 border-t border-filet pt-5 sm:grid-cols-2 ${statsColumns}`}>
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`min-w-0 ${index > 0 ? 'lg:border-l lg:border-filet lg:pl-6' : ''}`}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-gris">
                {stat.label}
              </p>
              <p className="mt-1 max-w-full font-display text-base font-extrabold leading-snug text-ink [overflow-wrap:anywhere] sm:text-lg xl:text-xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

export function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex flex-col justify-between gap-3 border-b border-filet px-5 py-5 sm:flex-row sm:items-center md:px-6">
          <div>
            {title && <h2 className="font-display text-xl font-extrabold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-gris">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

export function EmptyState({ title, description, action, icon = '＋' }) {
  return (
    <div className="rounded-[24px] border border-dashed border-bleu/30 bg-bleu-soft/40 px-6 py-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl font-extrabold text-bleu shadow-soft">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-extrabold">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gris">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatusBadge({ value }) {
  const positive = ['actif', 'valide', 'payee', 'livree', 'presente', 'confirmee', 'reussi'];
  const warning = ['soumis', 'en_examen', 'en_attente_paiement', 'en_preparation'];
  const style = positive.includes(value)
    ? 'bg-emerald-50 text-emerald-700'
    : warning.includes(value)
      ? 'bg-orange-soft text-orange-dark'
      : 'bg-fond-doux text-gris';
  return (
    <span className={`inline-flex rounded-pill px-3 py-1 text-[11px] font-extrabold capitalize ${style}`}>
      {String(value || '—').replace(/_/g, ' ')}
    </span>
  );
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
