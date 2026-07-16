import { Router } from 'express';
import * as ctrl from '../controllers/marketplace.controller.js';
import { authenticate, requireStatut } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';

const router = Router();

router.get('/produits', ctrl.catalogue);
router.get('/boutique', authenticate, ctrl.mesProduits);
router.post('/boutique', authenticate, requireStatut('actif'), uploadImage.single('photo'), ctrl.createProduit);
router.patch('/boutique/:id', authenticate, requireStatut('actif'), uploadImage.single('photo'), ctrl.updateProduit);
router.delete('/boutique/:id', authenticate, requireStatut('actif'), ctrl.deleteProduit);

router.post('/commandes', authenticate, requireStatut('actif'), ctrl.createCommande);
router.get('/commandes', authenticate, ctrl.mesCommandes);
router.get('/ventes', authenticate, ctrl.mesVentes);
router.patch('/commandes/:id/statut', authenticate, ctrl.setStatut);

export default router;
