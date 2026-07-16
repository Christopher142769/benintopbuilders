import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { EmptyState, PageHeader, StatusBadge } from '../components/ui/PageKit';
import { Icon } from '../components/ui/icons';

function youtubeEmbed(url) {
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v') || parsed.pathname.split('/').pop();
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

function EvaluationForm({ evaluation, formationId, chapterId, type, onDone }) {
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const [sending, setSending] = useState(false);

  function update(id, value) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    try {
      const form = new FormData();
      form.append('type', type);
      if (chapterId) form.append('chapterId', chapterId);
      form.append(
        'answers',
        JSON.stringify(
          evaluation.questions.map((question) => ({
            questionId: String(question._id),
            valeur: answers[String(question._id)],
          }))
        )
      );
      Object.entries(files).forEach(([id, file]) => form.append(`question_${id}`, file));
      const { data } = await api.post(`/formations/${formationId}/evaluations`, form);
      const result = data.data;
      if (result.correctionManuelle) {
        toast.success('Réponses envoyées au formateur pour correction');
      } else if (result.reussi) {
        toast.success(`Évaluation réussie · ${result.score}%`);
      } else {
        toast.error(`Score ${result.score}% · minimum attendu ${evaluation.notePassage}%`);
      }
      onDone();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Envoi impossible');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-[26px] border border-orange/20 bg-orange-soft/50 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange">Évaluation obligatoire</p><h3 className="mt-1 font-display text-xl font-extrabold">{evaluation.titre}</h3><p className="mt-1 text-xs text-gris">{evaluation.instructions}</p></div>
        <span className="chip-orange">Minimum {evaluation.notePassage}%</span>
      </div>
      <div className="mt-6 space-y-5">
        {evaluation.questions.map((question, index) => {
          const id = String(question._id);
          return (
            <div key={id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4"><p className="font-bold leading-6"><span className="mr-2 text-orange">{index + 1}.</span>{question.intitule}</p><span className="shrink-0 text-[10px] font-extrabold text-gris">{question.points} pt</span></div>
              {question.type === 'choix_unique' && <div className="mt-4 space-y-2">{question.options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-filet p-3 text-sm font-semibold"><input type="radio" name={id} required value={option} onChange={() => update(id, option)} />{option}</label>)}</div>}
              {question.type === 'choix_multiple' && <div className="mt-4 space-y-2">{question.options.map((option) => <label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-filet p-3 text-sm font-semibold"><input type="checkbox" value={option} onChange={(event) => { const current = answers[id] || []; update(id, event.target.checked ? [...current, option] : current.filter((item) => item !== option)); }} />{option}</label>)}</div>}
              {question.type === 'texte_libre' && <textarea required className="input mt-4 min-h-28" placeholder="Rédigez votre réponse…" value={answers[id] || ''} onChange={(event) => update(id, event.target.value)} />}
              {question.type === 'fichier' && <input required className="input mt-4" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setFiles((current) => ({ ...current, [id]: event.target.files[0] }))} />}
            </div>
          );
        })}
      </div>
      <button disabled={sending} className="btn-orange mt-6" type="submit">{sending ? 'Correction en cours…' : 'Soumettre mes réponses'}</button>
    </form>
  );
}

export default function FormationLearningPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['learning-path', id],
    queryFn: async () => (await api.get(`/formations/${id}/parcours`)).data.data,
  });
  const chapters = useMemo(() => (data?.formation?.modules || []).flatMap((module) => module.chapitres.map((chapter) => ({ ...chapter, moduleTitle: module.titre }))), [data]);

  useEffect(() => {
    if (!selectedId && chapters.length) {
      setSelectedId(String((chapters.find((chapter) => !chapter.verrouille && !chapter.termine) || chapters[0])._id));
    }
  }, [chapters, selectedId]);

  const selected = chapters.find((chapter) => String(chapter._id) === selectedId);
  const progress = data?.progression;

  async function complete() {
    try {
      await api.post(`/formations/${id}/chapitres/${selected._id}/terminer`);
      toast.success('Chapitre terminé · le suivant est maintenant disponible');
      await qc.invalidateQueries({ queryKey: ['learning-path', id] });
      setSelectedId(null);
    } catch (err) { toast.error(err.response?.data?.error?.message || 'Action impossible'); }
  }

  if (isLoading) return <div className="card mx-auto max-w-6xl p-8 text-center font-bold">Chargement du parcours…</div>;
  if (error) return <EmptyState title="Parcours indisponible" description={error.response?.data?.error?.message || 'Vous devez être inscrit à cette formation.'} action={<Link className="btn-orange" to="/dashboard/formations">Retour aux formations</Link>} />;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <PageHeader
        eyebrow={`Parcours ${data.formation.niveauxLabels?.join(' · ')}`}
        title={data.formation.titre}
        description={data.formation.description}
        stats={[
          { label: 'Progression', value: `${progress?.pourcentage || 0}%` },
          { label: 'Chapitres', value: `${progress?.chapitresTermines?.length || 0}/${chapters.length}` },
          { label: 'Statut', value: progress?.statut || 'en cours' },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="self-start overflow-hidden rounded-[28px] border border-filet bg-white xl:sticky xl:top-24">
          <div className="bg-ink p-5 text-white"><p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-light">Votre progression</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-orange transition-all" style={{ width: `${progress?.pourcentage || 0}%` }} /></div></div>
          {(data.formation.modules || []).map((module, moduleIndex) => <div key={module._id} className="border-b border-filet last:border-0"><div className="bg-fond-doux px-5 py-3 text-xs font-extrabold"><span className="mr-2 text-orange">0{moduleIndex + 1}</span>{module.titre}</div>{module.chapitres.map((chapter, index) => <button key={chapter._id} type="button" disabled={chapter.verrouille} onClick={() => setSelectedId(String(chapter._id))} className={`flex w-full items-center gap-3 px-5 py-4 text-left transition ${String(chapter._id) === selectedId ? 'bg-bleu-soft text-bleu' : chapter.verrouille ? 'cursor-not-allowed bg-black/[.025] text-gris/45' : 'hover:bg-fond-doux'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold ${chapter.termine ? 'bg-emerald-100 text-emerald-700' : chapter.verrouille ? 'bg-black/5' : 'bg-white ring-1 ring-filet'}`}>{chapter.termine ? '✓' : chapter.verrouille ? '⌑' : index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{chapter.titre}</strong><small className="text-[10px]">{chapter.dureeMinutes || 0} min</small></span></button>)}</div>)}
          {data.formation.examenFinal && <button type="button" onClick={() => setSelectedId('final')} className={`flex w-full items-center gap-3 bg-orange-soft p-5 text-left text-orange-dark ${selectedId === 'final' ? 'ring-2 ring-inset ring-orange' : ''}`}><span className="grid h-9 w-9 place-items-center rounded-full bg-orange text-white">{Icon.badge({ className: 'h-4 w-4' })}</span><strong className="text-sm">Examen de certification</strong></button>}
        </aside>

        <main className="min-w-0">
          {selectedId === 'final' && data.formation.examenFinal ? (
            <section className="card p-6 md:p-8"><p className="eyebrow">Dernière étape</p><h2 className="font-display text-3xl font-extrabold">Examen de certification</h2><p className="mt-2 text-sm text-gris">Une réussite valide automatiquement votre formation et l’ajoute à votre dossier de labellisation.</p><EvaluationForm evaluation={data.formation.examenFinal} formationId={id} type="final" onDone={() => qc.invalidateQueries({ queryKey: ['learning-path', id] })} /></section>
          ) : selected ? (
            <section className="card overflow-hidden">
              <div className="border-b border-filet bg-gradient-to-r from-bleu-soft to-white p-6 md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-wider text-bleu">{selected.moduleTitle}</p><h2 className="mt-2 font-display text-3xl font-extrabold">{selected.titre}</h2></div><StatusBadge value={selected.termine ? 'termine' : 'en_cours'} /></div><p className="mt-3 text-sm leading-6 text-gris">{selected.description}</p></div>
              <div className="p-6 md:p-8">
                {selected.contenuType === 'texte' && <div className="whitespace-pre-wrap text-[15px] leading-8 text-ink/80">{selected.contenu}</div>}
                {selected.contenuType === 'document' && <a href={selected.ressourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-[24px] border border-bleu/20 bg-bleu-soft p-5 text-bleu transition hover:-translate-y-0.5"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-bleu text-white">{Icon.doc({})}</span><div><strong className="block">{selected.nomFichier || 'Support de cours'}</strong><span className="text-xs">Ouvrir ou télécharger le document ↗</span></div></a>}
                {selected.contenuType === 'youtube' && youtubeEmbed(selected.ressourceUrl) && <div className="aspect-video overflow-hidden rounded-[24px] bg-ink"><iframe className="h-full w-full" src={youtubeEmbed(selected.ressourceUrl)} title={selected.titre} allowFullScreen /></div>}
                {selected.contenuType === 'zoom' && <div className="rounded-[24px] bg-gradient-to-br from-bleu to-ink p-7 text-white"><p className="text-xs font-extrabold uppercase tracking-wider text-orange-light">Session synchrone</p><h3 className="mt-2 font-display text-2xl font-extrabold">Rejoindre la session Zoom</h3><p className="mt-2 text-sm text-white/60">Ce lien est accessible car vous avez validé tous les prérequis précédents.</p><a href={selected.ressourceUrl} target="_blank" rel="noreferrer" className="btn-orange mt-5">Ouvrir Zoom ↗</a></div>}
                {!selected.evaluation && !selected.termine && <button type="button" className="btn-orange mt-7" onClick={complete}>Marquer ce chapitre comme terminé</button>}
                {selected.evaluation && !selected.termine && <EvaluationForm evaluation={selected.evaluation} formationId={id} chapterId={String(selected._id)} type="chapitre" onDone={async () => { await qc.invalidateQueries({ queryKey: ['learning-path', id] }); setSelectedId(null); }} />}
                {selected.termine && <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">✓ Chapitre validé. Vous pouvez poursuivre le parcours.</div>}
              </div>
            </section>
          ) : <EmptyState title="Sélectionnez un chapitre" description="Les chapitres se déverrouillent progressivement." />}
        </main>
      </div>
    </div>
  );
}
