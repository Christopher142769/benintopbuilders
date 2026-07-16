import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

/* ---------- Icônes ---------- */
const LogoMark = () => (
  <img className="btb-logo-image" src="/logo.png" alt="Bénin Top Builders" />
);

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" />
    <path d="M7 12.5l3.2 3.2L17 9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONS = {
  seed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V8" /><path d="M12 8c0-3 2-5 5-5 0 3-2 5-5 5Z" /><path d="M12 12c0-3-2-5-5-5 0 3 2 5 5 5Z" /></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.5 5.5L20 9.3l-4 4 1 5.7L12 16l-5 3 1-5.7-4-4 5.5-.8L12 3Z" /></svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l4 4 5-6 5 6 4-4v10H3V7Z" /><path d="M3 20h18" /></svg>
  ),
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M3 9h18a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" /></svg>
  ),
  brief: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>
  ),
};

const PLANS = [
  {
    value: 'decouverte', name: 'Découverte', icon: ICONS.seed,
    for: 'PME informelles · primo-inscrits · pros BTP · particuliers',
    price: '0 FCFA', note: 'par an',
    features: ['Profil de base', "Consultation de l'annuaire", 'Candidatures limitées aux opportunités', 'Passerelle vers Standard'],
    cta: 'Commencer', variant: 'line', tone: 'light',
  },
  {
    value: 'standard', name: 'Standard', icon: ICONS.star, star: true,
    for: "PME structurées · cabinets d'études · prescripteurs",
    price: '200.000', note: 'FCFA / an',
    features: ['Profil complet', 'Appels d’offres & réponses illimitées', 'Messagerie professionnelle', 'Marketplace sans commission'],
    cta: 'Devenir membre', variant: 'orange', tone: 'blue',
  },
  {
    value: 'premium', name: 'Premium', icon: ICONS.crown,
    for: 'Entreprises établies · fournisseurs actifs',
    price: '500.000', note: 'FCFA / an',
    features: ['Badge vérifié & mise en avant', 'Accès anticipé aux opportunités', 'Marketplace sans commission', 'Statistiques & multi-utilisateurs'],
    cta: 'Passer Premium', variant: 'white', tone: 'dark',
  },
  {
    value: 'access', name: 'Access', icon: ICONS.store,
    for: 'Vendeurs de matériaux · négociants',
    price: '1.000.000', note: 'FCFA / an',
    features: ['Vitrine Marketplace', 'Demandes et contacts directs', '0 % de commission BTB', 'Options de visibilité'],
    cta: 'Ouvrir Access', variant: 'ink', tone: 'warm',
  },
  {
    value: 'business', name: 'Business', icon: ICONS.brief,
    for: 'Offreurs BTP · promoteurs · besoins complexes',
    price: 'Sur devis', note: 'à la carte',
    features: ['Spots & promotions spéciales', 'Besoins spécifiques sur mesure', 'Accompagnement commercial', 'Droits négociés'],
    cta: 'Demander Business', variant: 'ink', tone: 'pale',
  },
];

const CATS = [
  { img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop', alt: 'Ouvriers sur une structure métallique', title: 'Gros œuvre & maçonnerie', sub: 'Fondations, élévations, béton armé' },
  { img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&auto=format&fit=crop', alt: 'Électricien au travail', title: 'Second œuvre & finitions', sub: 'Électricité, plomberie, carrelage, peinture' },
  { img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&auto=format&fit=crop', alt: 'Plans et casque de chantier', title: 'Études & ingénierie', sub: 'Architectes, bureaux d\'études, topographes' },
  { img: 'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=800', alt: 'Béton, fer à béton et agrégats', title: 'Fournisseurs de matériaux', sub: 'Ciment, fer, agrégats, quincaillerie' },
];

const PROOFS = [
  { img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop', alt: "Portrait d'un entrepreneur", name: 'Entrepreneurs du BTP', role: 'Visibilité stratégique & opportunités', quote: 'Votre profil certifié figure en bonne place dans les recherches géolocalisées. Les marchés se présentent à vous ; ne courez plus après les contrats.' },
  { img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop', alt: "Portrait d'une fournisseuse", name: 'Fournisseurs de matériaux', role: 'Vitrine commerciale sans rétrocession', quote: "Votre espace commercial numérique au forfait annuel : matériaux de construction, quincaillerie, équipements. L'intégralité de vos revenus demeure acquise à votre entreprise." },
  { img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80&auto=format&fit=crop', alt: "Portrait d'un maître d'ouvrage", name: "Clients & maîtres d'ouvrage", role: 'Confiance institutionnalisée', quote: 'Publiez votre cahier des charges, comparez les profils labellisés, consultez les évaluations et désignez le prestataire à la hauteur de vos exigences.' },
];

const SERVICES = [
  { img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80&auto=format&fit=crop', alt: "Documents d'appels d'offres", tag: "Appels d'offres", title: "Un flux constant d'opportunités", text: "Consultez les marchés ouverts et les demandes de devis, recevez des alertes ciblées selon vos corps de métier et votre zone d'intervention, répondez sans limitation et suivez l'ensemble de vos candidatures depuis un tableau de bord unique.", cta: 'Voir les offres' },
  { img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=900&q=80&auto=format&fit=crop', alt: 'Poignée de main entre professionnels', tag: 'Label qualité', title: 'La certification qui légitime votre excellence', text: "Décerné à l'issue d'un audit rigoureux — existence légale, références chantiers, charte qualité — et renouvelé annuellement. Badge certifié, mise en avant dans le répertoire et confiance renforcée auprès des donneurs d'ordre.", cta: 'Obtenir le label' },
  { img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&q=80&auto=format&fit=crop', alt: 'Session de formation professionnelle', tag: 'Formations & financement', title: 'Renforcez vos compétences, structurez votre financement', text: 'Parcours certifiants en gestion de chantier, élaboration de devis et transformation numérique, ainsi que la mise en relation avec nos établissements bancaires, microfinances et assureurs partenaires.', cta: 'En savoir plus' },
];

const METIERS_TICKER = ['Maçonnerie', 'Électricité', 'Plomberie', 'Menuiserie', 'Carrelage', 'Peinture', 'Charpente', "Bureaux d'études", 'Topographie', 'Fournisseurs'];

export default function LandingPage() {
  const rootRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  /* Police Montserrat (chargée une fois) */
  useEffect(() => {
    if (document.getElementById('btb-montserrat')) return;
    const l = document.createElement('link');
    l.id = 'btb-montserrat';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(l);
  }, []);

  /* Verrou de scroll quand le menu mobile est ouvert */
  useEffect(() => {
    const root = rootRef.current;
    if (root) root.classList.toggle('nav-open', menuOpen);
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* Reveal au scroll */
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('.btb-reveal') || [];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goAnchor = (id) => (e) => {
    e?.preventDefault();
    setMenuOpen(false);
    const el = rootRef.current?.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const goRoute = (to) => (e) => {
    e?.preventDefault();
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <div className="btb" ref={rootRef}>
      {/* ---------------- Header ---------------- */}
      <header className="btb-header">
        <nav className="btb-nav" aria-label="Navigation principale">
          <a className="btb-logo" href="#top" onClick={goAnchor('#top')} aria-label="Bénin Top Builders — accueil">
            <LogoMark />
          </a>

          <div className="btb-links">
            <a href="#metiers" onClick={goAnchor('#metiers')}>Métiers</a>
            <a href="#services" onClick={goAnchor('#services')}>Services</a>
            <a href="#tarifs" onClick={goAnchor('#tarifs')}>Adhésion</a>
            <a href="#contact" onClick={goAnchor('#contact')}>Contact</a>
          </div>

          <div className="btb-nav-cta">
            <a className="btb-btn btb-btn--line btb-btn--sm" href="/connexion" onClick={goRoute('/connexion')}>Connexion</a>
            <a className="btb-btn btb-btn--ink btb-btn--sm" href="#tarifs" onClick={goAnchor('#tarifs')}>Adhérer</a>
          </div>

          <button
            className="btb-toggle"
            type="button"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span aria-hidden="true"><i></i><i></i><i></i></span>
          </button>
        </nav>
      </header>

      {/* Drawer mobile */}
      <div className={`btb-backdrop${menuOpen ? ' show' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`btb-drawer${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <div className="btb-drawer-top">
          <span className="btb-logo"><LogoMark /></span>
          <button className="btb-drawer-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <nav className="btb-drawer-links" aria-label="Menu mobile">
          <a href="#metiers" onClick={goAnchor('#metiers')}>Métiers</a>
          <a href="#services" onClick={goAnchor('#services')}>Services</a>
          <a href="#tarifs" onClick={goAnchor('#tarifs')}>Adhésion</a>
          <a href="#contact" onClick={goAnchor('#contact')}>Contact</a>
        </nav>
        <div className="btb-drawer-cta">
          <a className="btb-btn btb-btn--line" href="/connexion" onClick={goRoute('/connexion')}>Connexion</a>
          <a className="btb-btn btb-btn--ink" href="#tarifs" onClick={goAnchor('#tarifs')}>Adhérer</a>
        </div>
      </aside>

      {/* ---------------- Hero ---------------- */}
      <section className="btb-hero" id="top">
        <video className="btb-hero-video" autoPlay muted loop playsInline poster="/neo-brutalism-inspired-building.jpg">
          <source src="/hero-btp.mp4" type="video/mp4" />
        </video>
        <div className="btb-hero-overlay" aria-hidden="true" />
        <div className="btb-wrap">
          <div className="btb-hero-inner">
            <h1>
              Accédez aux meilleurs talents.<br />
              Saisissez les{' '}
              <em>
                opportunités
                <svg className="btb-scribble" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 10 Q 100 2 197 9" fill="none" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </em>.
            </h1>
            <p className="btb-hero-sub">
              Annuaire géolocalisé, appels d'offres qualifiés et label d'excellence — la plateforme de référence du BTP béninois.
            </p>
            <div className="btb-hero-ctas">
              <a className="btb-btn btb-btn--orange" href="#tarifs" onClick={goAnchor('#tarifs')}>Créer mon profil <span className="btb-fl">→</span></a>
              <a className="btb-btn btb-btn--glass" href="#services" onClick={goAnchor('#services')}>Découvrir</a>
            </div>
            <div className="btb-hero-stats" aria-label="Chiffres clés">
              <div><b>0<i>%</i></b><span>Rétrocession</span></div>
              <div><b>12</b><span>Départements couverts</span></div>
              <div><b>1</b><span>Label d'excellence</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="btb-ticker" aria-hidden="true">
        <div className="btb-ticker-track">
          {[...METIERS_TICKER, ...METIERS_TICKER].map((m, i) => <span key={i}>{m}</span>)}
        </div>
      </div>

      {/* ---------------- Mission ---------------- */}
      <section className="btb-banner">
        <div className="btb-wrap">
          <div className="btb-banner-card btb-reveal">
            <div className="btb-banner-inner">
              <span className="btb-eyebrow btb-eyebrow--light">Notre mission</span>
              <h2>Édifions conjointement votre ascension.</h2>
              <p>Chaque semaine, particuliers, promoteurs et maîtres d'ouvrage confient leurs projets à la plateforme. Développez votre visibilité, répondez aux sollicitations, concrétisez vos ambitions.</p>
              <a className="btb-btn btb-btn--white" href="#tarifs" onClick={goAnchor('#tarifs')}>Nous rejoindre <span className="btb-fl">→</span></a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Preuves ---------------- */}
      <section className="btb-proofs">
        <div className="btb-wrap">
          <div className="btb-proofs-grid btb-reveal">
            {PROOFS.map((p) => (
              <div className="btb-proof" key={p.name}>
                <div className="btb-proof-head">
                  <img src={p.img} alt={p.alt} loading="lazy" />
                  <div><b>{p.name}</b><span>{p.role}</span></div>
                </div>
                <p>«&nbsp;{p.quote}&nbsp;»</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Métiers ---------------- */}
      <section className="btb-cats" id="metiers">
        <div className="btb-wrap">
          <div className="btb-section-head btb-reveal">
            <div>
              <span className="btb-eyebrow">Répertoire géolocalisé</span>
              <h2>L'ensemble des corps de métier du bâtiment, à proximité immédiate.</h2>
            </div>
            <a className="btb-btn btb-btn--line" href="#tarifs" onClick={goAnchor('#tarifs')}>Voir l'annuaire <span className="btb-fl">→</span></a>
          </div>
          <div className="btb-cats-grid btb-reveal">
            {CATS.map((c) => (
              <a className="btb-cat" href="#tarifs" onClick={goAnchor('#tarifs')} key={c.title}>
                <div className="btb-cat-img"><img src={c.img} alt={c.alt} loading="lazy" /></div>
                <b>{c.title}</b>
                <span>{c.sub}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="btb-rows" id="services">
        <div className="btb-wrap">
          <div className="btb-section-head btb-section-head--center btb-reveal">
            <span className="btb-eyebrow btb-eyebrow--center">Nos prestations</span>
            <h2>Une infrastructure digitale intégrale au service de votre développement.</h2>
          </div>
          {SERVICES.map((s, i) => (
            <div className={`btb-row btb-reveal${i % 2 === 1 ? ' btb-row--rev' : ''}`} key={s.tag}>
              <div className="btb-row-img"><img src={s.img} alt={s.alt} loading="lazy" /></div>
              <div className="btb-row-body">
                <span className="btb-tag">{s.tag}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <a className="btb-btn btb-btn--ink" href="#tarifs" onClick={goAnchor('#tarifs')}>{s.cta}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Formules ---------------- */}
      <section className="btb-pricing" id="tarifs">
        <div className="btb-wrap">
          <div className="btb-section-head btb-section-head--center btb-reveal">
            <span className="btb-eyebrow btb-eyebrow--center">Adhésion annuelle — 0&nbsp;% de rétrocession</span>
            <h2>Sélectionnez la formule adaptée à votre trajectoire.</h2>
          </div>
          <div className="btb-plans btb-reveal">
            {PLANS.map((p) => (
              <article className={`btb-plan btb-plan--${p.tone}${p.star ? ' btb-plan--star' : ''}`} key={p.value}>
                {p.star && <span className="btb-plan-tag">Privilégiée</span>}
                <span className="btb-plan-ico">{p.icon}</span>
                <h3>{p.name}</h3>
                <div className="btb-plan-for">{p.for}</div>
                <div className="btb-plan-price"><b>{p.price}</b><small>{p.note}</small></div>
                <ul>
                  {p.features.map((f) => <li key={f}><Check />{f}</li>)}
                </ul>
                <a className={`btb-btn btb-btn--${p.variant}`} href="/inscription" onClick={goRoute(`/inscription?palier=${p.value}`)}>{p.cta}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA finale ---------------- */}
      <section className="btb-final">
        <div className="btb-wrap">
          <div className="btb-final-card btb-reveal">
            <div className="btb-final-inner">
              <span className="btb-eyebrow btb-eyebrow--light btb-eyebrow--center">Journées des opportunités du BTP</span>
              <h2>Construisons ensemble le Bénin de demain.</h2>
              <p>Rejoignez les professionnels, fournisseurs et donneurs d'ordre déjà engagés au sein de la première communauté digitale de référence du BTP béninois.</p>
              <a className="btb-btn btb-btn--orange" href="#tarifs" onClick={goAnchor('#tarifs')}>Rejoindre maintenant <span className="btb-fl">→</span></a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="btb-footer" id="contact">
        <div className="btb-wrap">
          <div className="btb-foot-grid">
            <div>
              <span className="btb-foot-logo"><LogoMark /></span>
              <p>L'infrastructure qui met en relation les professionnels du BTP béninois avec les opportunités, les clients et les partenaires — dans un cadre de confiance, sans rétrocession.</p>
            </div>
            <div>
              <h4>Plateforme</h4>
              <ul>
                <li><a href="#metiers" onClick={goAnchor('#metiers')}>Répertoire des professionnels</a></li>
                <li><a href="#services" onClick={goAnchor('#services')}>Appels d'offres</a></li>
                <li><a href="#services" onClick={goAnchor('#services')}>Label qualité</a></li>
                <li><a href="#tarifs" onClick={goAnchor('#tarifs')}>Adhésion</a></li>
              </ul>
            </div>
            <div>
              <h4>Ressources</h4>
              <ul>
                <li><a href="#tarifs" onClick={goAnchor('#tarifs')}>Charte qualité</a></li>
                <li><a href="#services" onClick={goAnchor('#services')}>Formations</a></li>
                <li><a href="#top" onClick={goAnchor('#top')}>Journées du BTP</a></li>
                <li><a href="#contact" onClick={goAnchor('#contact')}>Prendre contact</a></li>
              </ul>
            </div>
            <div>
              <h4>Restez informé</h4>
              <p>Recevez chaque semaine la synthèse des nouveaux marchés et appels d'offres publiés sur la plateforme.</p>
              <div className="btb-news">
                <input type="email" placeholder="Votre e-mail" aria-label="Adresse e-mail" />
                <button className="btb-btn btb-btn--orange" type="button">S'abonner</button>
              </div>
            </div>
          </div>
          <div className="btb-foot-bottom">
            <span>© 2026 Bénin Top Builders — AT-Conseil Label Bénin. Tous droits réservés.</span>
            <div className="btb-socials" aria-label="Réseaux sociaux">
              <a href="#contact" onClick={goAnchor('#contact')} aria-label="Facebook">f</a>
              <a href="#contact" onClick={goAnchor('#contact')} aria-label="WhatsApp">W</a>
              <a href="#contact" onClick={goAnchor('#contact')} aria-label="LinkedIn">in</a>
              <a href="#contact" onClick={goAnchor('#contact')} aria-label="Instagram">Ig</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
