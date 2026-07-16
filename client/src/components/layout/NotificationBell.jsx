import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function NotificationBell() {
  const token = useAuthStore((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ['notif-count'],
    enabled: !!token,
    queryFn: async () => (await api.get('/notifications/unread-count')).data.data,
    refetchInterval: 30000,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['notifs'],
    enabled: !!token && open,
    queryFn: async () => (await api.get('/notifications')).data.data,
  });

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!token) return null;
  const total = countData?.total || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border-[1.5px] border-black/10 bg-fond-doux"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden className="font-extrabold text-ink">N</span>
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-extrabold text-white">
            {total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-[22px] border-[1.5px] border-card bg-white p-3 shadow-lift">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-extrabold">Notifications</span>
            <button
              type="button"
              className="text-xs font-bold text-bleu"
              onClick={async () => {
                await api.post('/notifications/lire-toutes');
                qc.invalidateQueries({ queryKey: ['notif-count'] });
                qc.invalidateQueries({ queryKey: ['notifs'] });
              }}
            >
              Tout lire
            </button>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {items.length === 0 && <p className="p-3 text-xs text-black/50">Aucune notification</p>}
            {items.map((n) => (
              <Link
                key={n.id || n._id}
                to={n.lien || '/dashboard'}
                onClick={async () => {
                  await api.post(`/notifications/${n.id || n._id}/lu`);
                  setOpen(false);
                  qc.invalidateQueries({ queryKey: ['notif-count'] });
                }}
                className={`block rounded-2xl px-3 py-2 text-xs ${n.lu ? 'opacity-60' : 'bg-bleu-soft'}`}
              >
                <div className="font-extrabold">{n.titre}</div>
                <div className="text-black/60">{n.corps}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
