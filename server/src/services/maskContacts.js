/**
 * Masque téléphones (+229…) et e-mails tant que les deux participants ne sont pas membres actifs.
 */
export function maskContacts(text, { bothActive } = {}) {
  if (bothActive || !text) return text;
  let out = String(text);
  out = out.replace(
    /(?:\+?229[\s.-]?)?(?:01|1)?[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}/g,
    '[téléphone masqué]'
  );
  out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[e-mail masqué]');
  return out;
}

export function bothParticipantsActifs(users) {
  return users?.length === 2 && users.every((u) => u?.statut === 'actif' && u?.role !== 'visiteur');
}
