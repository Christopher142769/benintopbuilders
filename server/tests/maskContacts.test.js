import { maskContacts } from '../src/services/maskContacts.js';

describe('maskContacts', () => {
  it('masque téléphones +229 et e-mails si non actifs', () => {
    const raw = 'Appelez le +229 97 00 00 01 ou écrivez a@b.bj';
    const masked = maskContacts(raw, { bothActive: false });
    expect(masked).toContain('[téléphone masqué]');
    expect(masked).toContain('[e-mail masqué]');
    expect(masked).not.toContain('97 00 00 01');
    expect(masked).not.toContain('a@b.bj');
  });

  it('laisse passer si bothActive', () => {
    const raw = 'Contact +22997000001 mail@test.bj';
    expect(maskContacts(raw, { bothActive: true })).toBe(raw);
  });
});
