import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/** Libellés → routes app (le HTML source n'est pas modifié). */
const ROUTE_BY_LABEL = [
  { match: /^connexion$/i, to: '/connexion' },
  { match: /^adhérer$/i, to: '/inscription' },
  { match: /^créer mon profil/i, to: '/inscription' },
  { match: /^devenir membre$/i, to: '/inscription' },
  { match: /^commencer$/i, to: '/inscription' },
  { match: /^passer premium$/i, to: '/inscription' },
  { match: /^ouvrir ma vitrine$/i, to: '/inscription' },
  { match: /^rejoindre maintenant/i, to: '/inscription' },
  { match: /^nous rejoindre/i, to: '/inscription' },
];

function resolveAppRoute(anchor) {
  const label = (anchor.textContent || '').replace(/\s+/g, ' ').trim().replace(/→/g, '').trim();
  for (const rule of ROUTE_BY_LABEL) {
    if (rule.match.test(label)) return rule.to;
  }
  return null;
}

export default function LandingPage() {
  const hostRef = useRef(null);
  const styleRef = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const cleanups = [];

    async function mount() {
      try {
        const res = await fetch('/benin-top-builders-landing-v2.html', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Landing introuvable');
        const raw = await res.text();
        if (cancelled) return;

        const doc = new DOMParser().parseFromString(raw, 'text/html');
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-btb-landing', '1');
        styleEl.textContent = Array.from(doc.querySelectorAll('style'))
          .map((s) => s.textContent)
          .join('\n');
        document.head.appendChild(styleEl);
        styleRef.current = styleEl;

        // Montserrat si le fichier le demande
        if (!document.getElementById('btb-landing-font')) {
          const pre1 = document.createElement('link');
          pre1.rel = 'preconnect';
          pre1.href = 'https://fonts.googleapis.com';
          const pre2 = document.createElement('link');
          pre2.rel = 'preconnect';
          pre2.href = 'https://fonts.gstatic.com';
          pre2.crossOrigin = 'anonymous';
          const font = document.createElement('link');
          font.id = 'btb-landing-font';
          font.rel = 'stylesheet';
          font.href =
            'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap';
          document.head.append(pre1, pre2, font);
        }

        const host = hostRef.current;
        if (!host) return;
        host.innerHTML = doc.body.innerHTML;

        // Scripts inline du fichier (nav mobile + reveal)
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
              }
            });
          },
          { threshold: 0.1 }
        );
        host.querySelectorAll('.reveal').forEach((el) => io.observe(el));
        cleanups.push(() => io.disconnect());

        const toggle = host.querySelector('.nav-toggle');
        const menu = host.querySelector('#nav-menu');
        const backdrop = host.querySelector('#nav-backdrop');
        const setOpen = (open) => {
          if (!toggle || !menu || !backdrop) return;
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
          menu.classList.toggle('open', open);
          backdrop.classList.toggle('show', open);
          backdrop.hidden = !open;
          document.body.classList.toggle('nav-open', open);
        };
        const onToggle = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
        const onBackdrop = () => setOpen(false);
        const onKey = (e) => {
          if (e.key === 'Escape') setOpen(false);
        };
        const onResize = () => {
          if (window.innerWidth > 960) setOpen(false);
        };
        toggle?.addEventListener('click', onToggle);
        backdrop?.addEventListener('click', onBackdrop);
        menu?.querySelectorAll('a').forEach((a) =>
          a.addEventListener('click', () => setOpen(false))
        );
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        cleanups.push(() => {
          toggle?.removeEventListener('click', onToggle);
          backdrop?.removeEventListener('click', onBackdrop);
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('resize', onResize);
          setOpen(false);
          document.body.classList.remove('nav-open');
        });

        // Uniquement : brancher inscription / adhésion / connexion
        const onClick = (e) => {
          const a = e.target.closest('a');
          if (!a || !host.contains(a)) return;
          const route = resolveAppRoute(a);
          if (!route) return;
          e.preventDefault();
          setOpen(false);
          navigate(route);
        };
        host.addEventListener('click', onClick);
        cleanups.push(() => host.removeEventListener('click', onClick));
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erreur de chargement');
      }
    }

    mount();
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      styleRef.current?.remove();
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: 40, fontFamily: 'system-ui' }}>
        Impossible de charger la landing : {error}
      </div>
    );
  }

  return <div ref={hostRef} id="btb-exact-landing" />;
}
