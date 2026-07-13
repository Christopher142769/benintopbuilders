import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function MessageriePage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState(params.get('msg') || null);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);

  const { data: convs = [] } = useQuery({
    queryKey: ['convs'],
    queryFn: async () => (await api.get('/messagerie')).data.data,
    refetchInterval: 20000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', activeId],
    enabled: !!activeId,
    queryFn: async () => (await api.get(`/messagerie/${activeId}/messages`)).data.data,
    refetchInterval: activeId ? 20000 : false,
  });

  useEffect(() => {
    if (!token) return undefined;
    const socket = io('/', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    if (activeId) {
      socket.emit('conv:join', activeId);
      socket.on('message:new', () => qc.invalidateQueries({ queryKey: ['messages', activeId] }));
      socket.on('user:typing', () => {
        setTyping(true);
        setTimeout(() => setTyping(false), 1500);
      });
    }
    return () => socket.disconnect();
  }, [token, activeId, qc]);

  async function send(e) {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const corps = draft;
    setDraft('');
    try {
      await api.post(`/messagerie/${activeId}/messages`, { corps });
      qc.invalidateQueries({ queryKey: ['messages', activeId] });
      qc.invalidateQueries({ queryKey: ['convs'] });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Envoi impossible');
      setDraft(corps);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10 md:grid-cols-[280px_1fr] md:px-8">
      <aside className="card max-h-[70vh] overflow-y-auto p-3">
        <h1 className="px-2 font-display text-xl font-extrabold">Messagerie</h1>
        <ul className="mt-3 space-y-1">
          {convs.map((c) => {
            const other = c.participants?.find((p) => p._id !== user?._id);
            const unread = c.nonLus?.[user?._id] || 0;
            return (
              <li key={c._id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(c._id);
                    api.post(`/messagerie/${c._id}/read`).catch(() => {});
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-bold ${
                    activeId === c._id ? 'bg-bleu-soft text-bleu' : 'hover:bg-fond-doux'
                  }`}
                >
                  <span>{other?.entreprise || other?.prenom || 'Conversation'}</span>
                  {unread > 0 && (
                    <span className="rounded-full bg-orange px-2 py-0.5 text-[10px] text-white">{unread}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="card flex max-h-[70vh] flex-col p-4">
        {!activeId && <p className="m-auto text-sm text-black/55">Sélectionnez une conversation</p>}
        {activeId && (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m._id}
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.auteurId === user?._id || m.auteurId?._id === user?._id
                      ? 'ml-auto bg-orange text-white'
                      : 'bg-fond-doux'
                  }`}
                >
                  {m.corps}
                </div>
              ))}
              {typing && <p className="text-xs text-black/45">En train d&apos;écrire…</p>}
            </div>
            <form onSubmit={send} className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-2xl border px-4 py-3 text-sm"
                placeholder="Votre message…"
              />
              <button type="submit" className="btn-orange !px-4">
                Envoyer
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
