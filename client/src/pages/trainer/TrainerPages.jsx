import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { EmptyState, Field, PageHeader, SectionCard, StatusBadge } from '../../components/ui/PageKit';
import { Icon } from '../../components/ui/icons';

const idOf = (item) => item?.id || item?._id;
const blankQuestion = () => ({
  intitule: '',
  type: 'choix_unique',
  optionsText: '',
  correctText: '',
  keywordsText: '',
  points: 1,
});

function questionsPayload(questions) {
  return questions.map((question) => ({
    intitule: question.intitule,
    type: question.type,
    options: question.optionsText?.split('\n').map((item) => item.trim()).filter(Boolean) || [],
    reponsesCorrectes: question.correctText?.split('\n').map((item) => item.trim()).filter(Boolean) || [],
    motsCles: question.keywordsText?.split(',').map((item) => item.trim()).filter(Boolean) || [],
    points: Number(question.points || 1),
  }));
}

function QuestionBuilder({ questions, onChange }) {
  function patch(index, changes) {
    onChange(questions.map((question, i) => (i === index ? { ...question, ...changes } : question)));
  }
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div key={index} className="rounded-2xl border border-filet bg-fond-doux/60 p-4">
          <div className="flex items-center justify-between"><strong className="text-sm">Question {index + 1}</strong><button type="button" className="text-xs font-bold text-orange" onClick={() => onChange(questions.filter((_, i) => i !== index))}>Supprimer</button></div>
          <input className="input mt-3" placeholder="Intitulé de la question" value={question.intitule} onChange={(event) => patch(index, { intitule: event.target.value })} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className="input" value={question.type} onChange={(event) => patch(index, { type: event.target.value })}>
              <option value="choix_unique">Choix unique</option><option value="choix_multiple">Choix multiples</option><option value="texte_libre">Réponse libre · mots-clés</option><option value="fichier">Pièce PDF / Word</option>
            </select>
            <input className="input" type="number" min=".5" step=".5" placeholder="Points" value={question.points} onChange={(event) => patch(index, { points: event.target.value })} />
          </div>
          {['choix_unique', 'choix_multiple'].includes(question.type) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <textarea className="input min-h-24" placeholder={'Options proposées\nUne option par ligne'} value={question.optionsText} onChange={(event) => patch(index, { optionsText: event.target.value })} />
              <textarea className="input min-h-24" placeholder={'Bonne(s) réponse(s)\nExactement comme dans les options'} value={question.correctText} onChange={(event) => patch(index, { correctText: event.target.value })} />
            </div>
          )}
          {question.type === 'texte_libre' && <input className="input mt-3" placeholder="Mots-clés attendus, séparés par des virgules" value={question.keywordsText} onChange={(event) => patch(index, { keywordsText: event.target.value })} />}
          {question.type === 'fichier' && <p className="mt-3 text-xs font-semibold text-gris">Cette réponse sera placée dans votre file de correction manuelle.</p>}
        </div>
      ))}
      <button type="button" className="btn-line btn-sm" onClick={() => onChange([...questions, blankQuestion()])}>+ Ajouter une question</button>
    </div>
  );
}

export function TrainerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data = {} } = useQuery({
    queryKey: ['trainer-stats'],
    queryFn: async () => (await api.get('/formateur/stats')).data.data,
  });
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        eyebrow="Studio pédagogique"
        title={`Bonjour ${user?.prenom || 'Formateur'}, transmettons l’excellence.`}
        description="Pilotez vos formations, suivez les apprenants et assurez la qualité des certifications qui vous sont confiées."
        stats={[
          { label: 'Parcours publiés', value: data.publiees ?? '—' },
          { label: 'Apprenants', value: data.apprenants ?? '—' },
          { label: 'Réussite', value: `${data.tauxReussite || 0}%` },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Formations conçues', data.formations, Icon.book({}), 'bg-bleu-soft text-bleu'],
          ['Apprenants inscrits', data.apprenants, Icon.users({}), 'bg-orange-soft text-orange-dark'],
          ['Parcours terminés', data.terminees, Icon.badge({}), 'bg-emerald-50 text-emerald-700'],
          ['Copies à corriger', data.corrections, Icon.doc({}), 'bg-ink text-white'],
        ].map(([label, value, icon, style]) => <div key={label} className="card p-5"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${style}`}>{icon}</span><p className="mt-5 font-display text-3xl font-extrabold">{value || 0}</p><p className="mt-1 text-xs font-bold text-gris">{label}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <SectionCard eyebrow="Méthode BTB" title="Un parcours progressif et vérifiable">
          <div className="grid gap-3 sm:grid-cols-3">
            {['Structurez les modules et ressources', 'Validez chaque chapitre par un test', 'Certifiez avec un examen final'].map((text, index) => <div key={text} className="rounded-2xl bg-fond-doux p-4"><span className="text-xs font-extrabold text-orange">0{index + 1}</span><p className="mt-2 text-sm font-bold leading-5">{text}</p></div>)}
          </div>
        </SectionCard>
        <section className="rounded-[28px] bg-gradient-to-br from-bleu to-ink p-6 text-white">
          <p className="text-xs font-extrabold uppercase tracking-wider text-orange-light">Vos habilitations</p>
          <div className="mt-5 flex flex-wrap gap-2">{(user?.formateur?.niveauxLabels || []).map((level) => <span key={level} className="rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold capitalize ring-1 ring-white/20">{level}</span>)}</div>
          <p className="mt-5 text-sm leading-6 text-white/60">{user?.formateur?.specialite}</p>
        </section>
      </div>
    </div>
  );
}

export function TrainerFormationsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = useState(null);
  const [newTraining, setNewTraining] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [chapter, setChapter] = useState(null);
  const [exam, setExam] = useState(null);
  const { data: formations = [] } = useQuery({
    queryKey: ['trainer-formations'],
    queryFn: async () => (await api.get('/formateur/formations')).data.data,
  });
  const selected = formations.find((formation) => idOf(formation) === selectedId);

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ['trainer-formations'] });
    qc.invalidateQueries({ queryKey: ['trainer-stats'] });
  }

  async function createFormation(event) {
    event.preventDefault();
    try {
      await api.post('/formateur/formations', newTraining);
      toast.success('Formation créée en brouillon');
      setNewTraining(null);
      refresh();
    } catch (error) { toast.error(error.response?.data?.error?.message || 'Création impossible'); }
  }

  async function setPublication(formation, statutPublication) {
    await api.patch(`/formateur/formations/${idOf(formation)}`, { statutPublication });
    toast.success(statutPublication === 'publie' ? 'Formation publiée' : 'Formation remise en brouillon');
    refresh();
  }

  async function addModule(event) {
    event.preventDefault();
    await api.post(`/formateur/formations/${selectedId}/modules`, { titre: moduleTitle, description: '' });
    setModuleTitle('');
    toast.success('Module ajouté');
    refresh();
  }

  async function saveChapter(event) {
    event.preventDefault();
    const payload = {
      titre: chapter.titre,
      description: chapter.description,
      contenuType: chapter.contenuType,
      contenu: chapter.contenu,
      ressourceUrl: chapter.ressourceUrl,
      dureeMinutes: Number(chapter.dureeMinutes || 0),
      evaluation: chapter.hasQuiz && chapter.questions.length ? {
        titre: chapter.quizTitle || 'Test de fin de chapitre',
        instructions: chapter.quizInstructions,
        notePassage: Number(chapter.notePassage || 70),
        tentativesMax: Number(chapter.tentativesMax || 3),
        questions: questionsPayload(chapter.questions),
      } : null,
    };
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (chapter.file) formData.append('fichier', chapter.file);
    try {
      await api.post(`/formateur/formations/${selectedId}/modules/${chapter.moduleId}/chapitres`, formData);
      toast.success('Chapitre et verrou pédagogique enregistrés');
      setChapter(null);
      refresh();
    } catch (error) { toast.error(error.response?.data?.error?.message || 'Chapitre invalide'); }
  }

  async function saveExam(event) {
    event.preventDefault();
    try {
      await api.put(`/formateur/formations/${selectedId}/examen`, {
        titre: exam.titre,
        instructions: exam.instructions,
        notePassage: Number(exam.notePassage),
        tentativesMax: Number(exam.tentativesMax),
        questions: questionsPayload(exam.questions),
      });
      toast.success('Examen de certification enregistré');
      setExam(null);
      refresh();
    } catch (error) { toast.error(error.response?.data?.error?.message || 'Examen invalide'); }
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader eyebrow="Conception pédagogique" title="Mes formations" description="Créez des modules, ordonnez les chapitres et ajoutez des évaluations obligatoires. Les apprenants avancent strictement dans l’ordre défini." actions={<button type="button" className="btn-orange" onClick={() => setNewTraining({ titre: '', description: '', modalite: 'en_ligne', dureeHeures: 1, niveauxLabels: [user?.formateur?.niveauxLabels?.[0] || 'bronze'], statutPublication: 'brouillon' })}>Nouvelle formation</button>} stats={[{ label: 'Formations', value: formations.length }, { label: 'Publiées', value: formations.filter((item) => item.statutPublication === 'publie').length }, { label: 'Chapitres', value: formations.reduce((sum, item) => sum + (item.modules || []).reduce((count, module) => count + module.chapitres.length, 0), 0) }]} />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          {formations.map((formation) => <button key={idOf(formation)} type="button" onClick={() => setSelectedId(idOf(formation))} className={`w-full rounded-[24px] border p-5 text-left transition ${selectedId === idOf(formation) ? 'border-bleu bg-bleu text-white shadow-xl' : 'border-filet bg-white hover:-translate-y-0.5 hover:border-bleu/30'}`}><div className="flex items-center justify-between gap-3"><span className={`text-[10px] font-extrabold uppercase tracking-wider ${selectedId === idOf(formation) ? 'text-orange-light' : 'text-orange'}`}>{formation.niveauxLabels?.join(' · ')}</span><StatusBadge value={formation.statutPublication} /></div><h2 className="mt-3 font-display text-lg font-extrabold">{formation.titre}</h2><p className={`mt-2 text-xs ${selectedId === idOf(formation) ? 'text-white/60' : 'text-gris'}`}>{formation.modules?.length || 0} module(s) · {formation.dureeHeures} h</p></button>)}
          {!formations.length && <EmptyState title="Aucune formation" description="Créez un premier parcours pédagogique." />}
        </aside>
        {!selected ? <section className="grid min-h-[420px] place-items-center rounded-[30px] border-2 border-dashed border-filet bg-white/60 p-8 text-center"><div>{Icon.book({ className: 'mx-auto h-10 w-10 text-bleu' })}<h2 className="mt-4 font-display text-2xl font-extrabold">Votre studio de conception</h2><p className="mt-2 max-w-md text-sm text-gris">Sélectionnez une formation ou créez-en une pour organiser ses modules, chapitres et examens.</p></div></section> : (
          <div className="space-y-5">
            <section className="overflow-hidden rounded-[30px] bg-ink p-6 text-white md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-extrabold uppercase tracking-wider text-orange-light">{selected.niveauxLabels?.join(' · ')}</p><h2 className="mt-2 font-display text-3xl font-extrabold">{selected.titre}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{selected.description}</p></div><button type="button" className={selected.statutPublication === 'publie' ? 'btn-line !border-white/20 !text-white' : 'btn-orange'} onClick={() => setPublication(selected, selected.statutPublication === 'publie' ? 'brouillon' : 'publie')}>{selected.statutPublication === 'publie' ? 'Repasser en brouillon' : 'Publier le parcours'}</button></div>
            </section>
            {(selected.modules || []).sort((a, b) => a.ordre - b.ordre).map((module, moduleIndex) => (
              <section key={module._id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-filet bg-fond-doux/60 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-bleu font-extrabold text-white">{moduleIndex + 1}</span><div><p className="text-[10px] font-extrabold uppercase text-gris">Module</p><h3 className="font-display text-lg font-extrabold">{module.titre}</h3></div></div><button type="button" className="btn-line btn-sm" onClick={() => setChapter({ moduleId: module._id, titre: '', description: '', contenuType: 'texte', contenu: '', ressourceUrl: '', dureeMinutes: 15, hasQuiz: false, questions: [blankQuestion()], notePassage: 70, tentativesMax: 3 })}>+ Chapitre</button></div>
                <div className="divide-y divide-filet">
                  {(module.chapitres || []).sort((a, b) => a.ordre - b.ordre).map((item, index) => <div key={item._id} className="flex items-center gap-4 p-5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fond-doux text-xs font-extrabold">{index + 1}</span><div className="min-w-0 flex-1"><p className="font-bold">{item.titre}</p><p className="mt-1 text-xs capitalize text-gris">{item.contenuType} · {item.dureeMinutes || 0} min {item.evaluation?.questions?.length ? `· Test ${item.evaluation.notePassage}%` : ''}</p></div><span className="text-gris">{Icon.shield({ className: 'h-4 w-4' })}</span></div>)}
                  {!module.chapitres?.length && <p className="p-5 text-sm text-gris">Ajoutez le premier chapitre. Il sera automatiquement déverrouillé en premier.</p>}
                </div>
              </section>
            ))}
            <form onSubmit={addModule} className="flex gap-3 rounded-[24px] border-2 border-dashed border-filet bg-white p-4"><input className="input flex-1" required placeholder="Titre du nouveau module" value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} /><button className="btn-line" type="submit">Ajouter le module</button></form>
            <button type="button" className="w-full rounded-[26px] bg-gradient-to-r from-orange to-[#e4621b] p-5 text-left text-white shadow-lg transition hover:-translate-y-0.5" onClick={() => setExam({ titre: selected.examenFinal?.titre || 'Examen de certification', instructions: selected.examenFinal?.instructions || '', notePassage: selected.examenFinal?.notePassage || 70, tentativesMax: selected.examenFinal?.tentativesMax || 3, questions: [blankQuestion()] })}><p className="text-xs font-extrabold uppercase tracking-wider text-white/60">Étape finale</p><div className="mt-1 flex items-center justify-between"><strong className="font-display text-xl">Configurer l’examen de certification</strong>{Icon.arrowRight({})}</div></button>
          </div>
        )}
      </div>

      {newTraining && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm"><form onSubmit={createFormation} className="mx-auto my-8 max-w-2xl rounded-[30px] bg-white p-7"><div className="flex justify-between"><h2 className="font-display text-2xl font-extrabold">Nouvelle formation</h2><button type="button" onClick={() => setNewTraining(null)}>×</button></div><div className="mt-6 space-y-4"><Field label="Titre"><input className="input" required value={newTraining.titre} onChange={(e) => setNewTraining({ ...newTraining, titre: e.target.value })} /></Field><Field label="Objectifs et description"><textarea className="input min-h-28" required value={newTraining.description} onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Modalité"><select className="input" value={newTraining.modalite} onChange={(e) => setNewTraining({ ...newTraining, modalite: e.target.value })}><option value="en_ligne">En ligne</option><option value="presentiel">Présentiel</option><option value="hybride">Hybride</option></select></Field><Field label="Durée estimée (heures)"><input className="input" type="number" min=".5" step=".5" value={newTraining.dureeHeures} onChange={(e) => setNewTraining({ ...newTraining, dureeHeures: e.target.value })} /></Field></div><div><p className="label">Labels concernés</p><div className="flex gap-2">{(user?.formateur?.niveauxLabels || []).map((level) => <button type="button" key={level} className={newTraining.niveauxLabels.includes(level) ? 'chip-orange' : 'chip'} onClick={() => setNewTraining({ ...newTraining, niveauxLabels: newTraining.niveauxLabels.includes(level) ? newTraining.niveauxLabels.filter((item) => item !== level) : [...newTraining.niveauxLabels, level] })}>{level}</button>)}</div></div></div><div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-line" onClick={() => setNewTraining(null)}>Annuler</button><button className="btn-orange">Créer le brouillon</button></div></form></div>}

      {chapter && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm"><form onSubmit={saveChapter} className="mx-auto my-5 max-w-3xl rounded-[30px] bg-white p-6 md:p-8"><div className="flex justify-between"><div><p className="eyebrow">Nouveau contenu</p><h2 className="font-display text-2xl font-extrabold">Créer un chapitre</h2></div><button type="button" onClick={() => setChapter(null)}>×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Titre"><input className="input" required value={chapter.titre} onChange={(e) => setChapter({ ...chapter, titre: e.target.value })} /></Field><Field label="Durée estimée (minutes)"><input className="input" type="number" value={chapter.dureeMinutes} onChange={(e) => setChapter({ ...chapter, dureeMinutes: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Résumé"><textarea className="input" value={chapter.description} onChange={(e) => setChapter({ ...chapter, description: e.target.value })} /></Field></div><Field label="Type de contenu"><select className="input" value={chapter.contenuType} onChange={(e) => setChapter({ ...chapter, contenuType: e.target.value })}><option value="texte">Cours texte</option><option value="document">Document PDF / Word</option><option value="youtube">Vidéo YouTube</option><option value="zoom">Session Zoom</option></select></Field>{chapter.contenuType === 'document' ? <Field label="Fichier"><input className="input" type="file" accept=".pdf,.doc,.docx" required onChange={(e) => setChapter({ ...chapter, file: e.target.files[0] })} /></Field> : ['youtube', 'zoom'].includes(chapter.contenuType) ? <Field label={chapter.contenuType === 'zoom' ? 'Lien de réunion Zoom' : 'Lien YouTube'}><input className="input" type="url" required value={chapter.ressourceUrl} onChange={(e) => setChapter({ ...chapter, ressourceUrl: e.target.value })} /></Field> : <div className="sm:col-span-2"><Field label="Contenu du cours"><textarea className="input min-h-40" required value={chapter.contenu} onChange={(e) => setChapter({ ...chapter, contenu: e.target.value })} /></Field></div>}</div><label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border border-filet p-4"><input type="checkbox" checked={chapter.hasQuiz} onChange={(e) => setChapter({ ...chapter, hasQuiz: e.target.checked })} /><div><strong className="text-sm">Test obligatoire en fin de chapitre</strong><p className="text-xs text-gris">Le chapitre suivant restera verrouillé jusqu’à la réussite.</p></div></label>{chapter.hasQuiz && <div className="mt-5 rounded-[24px] bg-fond-doux p-5"><div className="mb-4 grid gap-3 sm:grid-cols-2"><input className="input" type="number" min="0" max="100" value={chapter.notePassage} onChange={(e) => setChapter({ ...chapter, notePassage: e.target.value })} placeholder="Note de passage %" /><input className="input" type="number" min="1" value={chapter.tentativesMax} onChange={(e) => setChapter({ ...chapter, tentativesMax: e.target.value })} placeholder="Tentatives" /></div><QuestionBuilder questions={chapter.questions} onChange={(questions) => setChapter({ ...chapter, questions })} /></div>}<div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-line" onClick={() => setChapter(null)}>Annuler</button><button className="btn-orange">Enregistrer le chapitre</button></div></form></div>}

      {exam && <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm"><form onSubmit={saveExam} className="mx-auto my-5 max-w-3xl rounded-[30px] bg-white p-6 md:p-8"><div className="flex justify-between"><div><p className="eyebrow">Certification</p><h2 className="font-display text-2xl font-extrabold">Examen final</h2></div><button type="button" onClick={() => setExam(null)}>×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Titre"><input className="input" required value={exam.titre} onChange={(e) => setExam({ ...exam, titre: e.target.value })} /></Field><Field label="Note minimale (%)"><input className="input" type="number" min="0" max="100" value={exam.notePassage} onChange={(e) => setExam({ ...exam, notePassage: e.target.value })} /></Field><div className="sm:col-span-2"><Field label="Consignes"><textarea className="input" value={exam.instructions} onChange={(e) => setExam({ ...exam, instructions: e.target.value })} /></Field></div></div><div className="mt-5"><QuestionBuilder questions={exam.questions} onChange={(questions) => setExam({ ...exam, questions })} /></div><div className="mt-7 flex justify-end gap-3"><button type="button" className="btn-line" onClick={() => setExam(null)}>Annuler</button><button className="btn-orange">Enregistrer l’examen</button></div></form></div>}
    </div>
  );
}

export function TrainerCorrectionsPage() {
  const qc = useQueryClient();
  const [scores, setScores] = useState({});
  const { data: progressions = [] } = useQuery({
    queryKey: ['trainer-corrections'],
    queryFn: async () => (await api.get('/formateur/corrections')).data.data,
  });
  const copies = useMemo(() => progressions.flatMap((progression) => (progression.tentatives || []).filter((attempt) => attempt.statut === 'a_corriger').map((attempt) => ({ progression, attempt }))), [progressions]);
  async function correct(progression, attempt) {
    try {
      await api.patch(`/formateur/corrections/${idOf(progression)}/${attempt._id}`, { points: scores[attempt._id] || {} });
      toast.success('Copie corrigée');
      qc.invalidateQueries({ queryKey: ['trainer-corrections'] });
      qc.invalidateQueries({ queryKey: ['trainer-stats'] });
    } catch (error) { toast.error(error.response?.data?.error?.message || 'Correction impossible'); }
  }
  return <div className="mx-auto max-w-6xl space-y-6"><PageHeader eyebrow="Évaluation humaine" title="Copies à corriger" description="Les QCM et réponses à mots-clés sont notés automatiquement. Seules les pièces jointes nécessitant votre expertise apparaissent ici." stats={[{ label: 'Copies', value: copies.length }, { label: 'Correction automatique', value: 'Active' }, { label: 'Traçabilité', value: 'Complète' }]} />{copies.map(({ progression, attempt }) => <SectionCard key={attempt._id} eyebrow={attempt.type === 'final' ? 'Examen final' : 'Test de chapitre'} title={`${progression.userId?.prenom || ''} ${progression.userId?.nom || progression.userId?.entreprise || ''}`} action={<span className="chip">{progression.formationId?.titre}</span>}><div className="space-y-3">{attempt.reponses.map((response, index) => <div key={String(response.questionId)} className="rounded-2xl border border-filet p-4"><p className="text-xs font-extrabold text-gris">Question {index + 1}</p>{response.fichierUrl ? <a className="mt-2 inline-flex font-bold text-bleu" href={response.fichierUrl} target="_blank" rel="noreferrer">Ouvrir la pièce jointe ↗</a> : <p className="mt-2 text-sm">{Array.isArray(response.valeur) ? response.valeur.join(', ') : response.valeur || '—'}</p>}<div className="mt-3 flex items-center gap-2"><input className="input !w-28" type="number" min="0" max={response.pointsMax} step=".5" disabled={!response.correctionManuelle} value={scores[attempt._id]?.[String(response.questionId)] ?? response.pointsObtenus} onChange={(e) => setScores((current) => ({ ...current, [attempt._id]: { ...(current[attempt._id] || {}), [String(response.questionId)]: e.target.value } }))} /><span className="text-xs font-bold text-gris">/ {response.pointsMax} points</span></div></div>)}</div><button type="button" className="btn-orange mt-5" onClick={() => correct(progression, attempt)}>Valider la correction</button></SectionCard>)}{!copies.length && <EmptyState title="Aucune copie en attente" description="Toutes les évaluations nécessitant une correction manuelle ont été traitées." icon="✓" />}</div>;
}
