/* Jeu d'icônes ligne (stroke = currentColor) — 24x24 */
const S = ({ children, className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

export const Icon = {
  grid: (p) => <S {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></S>,
  user: (p) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></S>,
  card: (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 10h18" /></S>,
  badge: (p) => <S {...p}><path d="M12 2l2.5 2 3.5-.5.5 3.5 2 2.5-2 2.5.5 3.5-3.5-.5L12 22l-2.5-2-3.5.5-.5-3.5L3.5 15l2-2.5-.5-3.5 3.5.5L12 2Z" /><path d="M9 12l2 2 4-4" /></S>,
  book: (p) => <S {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19h15" /></S>,
  doc: (p) => <S {...p}><path d="M6 3h8l4 4v14H6V3Z" /><path d="M14 3v4h4" /><path d="M9 13h6M9 17h6" /></S>,
  send: (p) => <S {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></S>,
  chat: (p) => <S {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z" /></S>,
  store: (p) => <S {...p}><path d="M4 9 5.5 4h13L20 9" /><path d="M4 9v11h16V9" /><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /></S>,
  cart: (p) => <S {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.5 13h10l2-8H6" /></S>,
  bag: (p) => <S {...p}><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></S>,
  chart: (p) => <S {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></S>,
  users: (p) => <S {...p}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c0-3.3 2.9-5 6.5-5s6.5 1.7 6.5 5" /><path d="M17 5.2A3 3 0 0 1 17 11M21.5 20c0-2.6-1.6-4.2-4-4.8" /></S>,
  folder: (p) => <S {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /></S>,
  shield: (p) => <S {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="M9 12l2 2 4-4" /></S>,
  list: (p) => <S {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></S>,
  bell: (p) => <S {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></S>,
  logout: (p) => <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></S>,
  arrowRight: (p) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>,
  home: (p) => <S {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></S>,
  external: (p) => <S {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></S>,
};
