import { z } from 'zod';

export const infoSchema = z.object({
  email: z.string().email('E-mail invalide'),
  password: z
    .string()
    .min(8, '8 caractères minimum')
    .regex(/[A-Z]/, 'Une majuscule requise')
    .regex(/[0-9]/, 'Un chiffre requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  nom: z.string().min(1, 'Nom requis'),
  telephone: z.string().min(8, 'Téléphone requis'),
  entreprise: z.string().optional(),
  ifu: z.string().optional(),
  rccm: z.string().optional(),
  departement: z.string().min(1, 'Département requis'),
  ville: z.string().min(1, 'Ville requise'),
  zonesIntervention: z.string().optional(),
  presentation: z.string().max(5000).optional(),
  metiers: z.array(z.string()).default([]),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
