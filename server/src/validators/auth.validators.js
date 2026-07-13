import { z } from 'zod';
import { PROFIL_TYPES, PALIERS, DEPARTEMENTS, METIERS } from '../config/constants.js';

export const registerSchema = z.object({
  profilType: z.enum(PROFIL_TYPES),
  email: z.string().email('E-mail invalide').transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Mot de passe : 8 caractères minimum')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
  prenom: z.string().min(1).max(80).trim(),
  nom: z.string().min(1).max(80).trim(),
  telephone: z.string().min(8).max(20).trim(),
  entreprise: z.string().min(1).max(160).trim().optional(),
  ifu: z.string().max(40).trim().optional(),
  // Le numéro texte est optionnel ; le fichier RCCM est géré à part (multer)
  rccm: z.string().max(40).trim().optional(),
  rccmDocumentUrl: z.string().optional(),
  rccmDocumentNom: z.string().optional(),
  departement: z.enum(DEPARTEMENTS),
  ville: z.string().min(1).max(100).trim(),
  zonesIntervention: z.array(z.string().trim()).max(20).default([]),
  presentation: z.string().max(5000).optional(),
  metiers: z.array(z.enum(METIERS)).max(10).default([]),
});

export const otpVerifySchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  code: z.string().regex(/^\d{6}$/, 'Code OTP à 6 chiffres'),
});

export const otpResendSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
});

export const loginSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1),
});

export const palierSchema = z.object({
  palier: z.enum(PALIERS),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
});
