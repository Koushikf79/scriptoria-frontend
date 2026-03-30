import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, historyApi } from '@/lib/api-client';
import { HistoryDetail, HistoryItem } from '@/lib/types';
import { useAuth } from '@/store/authStore';
import HistoryDetailModal from '@/components/HistoryDetailModal';
import { Film, Trash2 } from 'lucide-react';

const MOOD_BADGE_COLORS: Record<string, string> = {
  TENSION: '#ff4444',
  JOY: '#44ff88',
  GRIEF: '#4488ff',
  FEAR: '#aa44ff',
  ANGER: '#ff6600',
  HOPE: '#ffdd44',
  LOVE: '#ff44aa',
  NEUTRAL: '#888888',
};

function formatBudgetRange(item: HistoryItem): string {
  return `${item.currency}${Math.round(item.totalBudgetLow).toLocaleString()} - ${item.currency}${Math.round(item.totalBudgetHigh).toLocaleString()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<HistoryDetail | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await authApi.getProfile();
        setUser((profile as any).data ?? profile);
      } catch {
        logout();
        navigate('/login', { replace: true });
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await historyApi.getHistory(currentPage, 10);
        const payload = (response as any).data ?? response;
        setHistory(payload.items ?? []);
        setTotalPages(Math.max(payload.totalPages ?? 1, 1));
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [currentPage]);

  const stats = useMemo(() => {
    const totalAnalyses = user?.totalAnalyses ?? history.length;
    const avgScenes = history.length
      ? Math.round(history.reduce((sum, item) => sum + item.totalScenes, 0) / history.length)
      : 0;

    const marketFrequency = history.reduce<Record<string, number>>((acc, item) => {
      acc[item.market] = (acc[item.market] || 0) + 1;
      return acc;
    }, {});
    const mostUsedMarket = Object.entries(marketFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalAnalyses,
      avgScenes,
      mostUsedMarket,
    };
  }, [history, user]);

  const handleView = async (id: string) => {
    setDetailLoadingId(id);
    try {
      const response = await historyApi.getDetail(id);
      setSelectedDetail((response as any).data ?? response);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm('Delete this analysis history entry?');
    if (!shouldDelete) return;

    await historyApi.deleteHistory(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-[#D4AF37]/20 bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-[#D4AF37]">SCRIPTORIA</h1>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#D4AF37] text-[#0a0a0f] grid place-items-center font-semibold">
              {user?.fullName?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="ml-2 rounded-lg border border-[#D4AF37]/30 px-3 py-1.5 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold">Welcome back, {user?.fullName || 'Creator'}</h2>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#D4AF37]/20 bg-white/[0.03] backdrop-blur-md p-5">
            <p className="text-sm text-slate-400">Total Analyses</p>
            <p className="text-3xl mt-2 font-bold text-[#D4AF37]">{stats.totalAnalyses}</p>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/20 bg-white/[0.03] backdrop-blur-md p-5">
            <p className="text-sm text-slate-400">Avg Scenes</p>
            <p className="text-3xl mt-2 font-bold text-[#D4AF37]">{stats.avgScenes}</p>
          </div>
          <div className="rounded-xl border border-[#D4AF37]/20 bg-white/[0.03] backdrop-blur-md p-5">
            <p className="text-sm text-slate-400">Most Used Mkt</p>
            <p className="text-3xl mt-2 font-bold text-[#D4AF37] uppercase">{stats.mostUsedMarket}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#D4AF37]/20 bg-white/[0.03] backdrop-blur-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Analysis History</h3>
            <button
              onClick={() => navigate('/analysis')}
              className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-[#0a0a0f] hover:brightness-90 transition-all"
            >
              New Analysis
            </button>
          </div>

          {loading && <p className="text-slate-400 text-sm">Loading history...</p>}
          {!loading && history.length === 0 && <p className="text-slate-400 text-sm">No saved analysis history yet.</p>}

          <div className="space-y-3">
            {history.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#D4AF37]/20 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-[#D4AF37]" />
                      <h4 className="text-lg font-semibold">{item.screenplayTitle}</h4>
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-semibold"
                        style={{
                          backgroundColor: MOOD_BADGE_COLORS[item.dominantEmotion] || '#888888',
                          color: '#111',
                        }}
                      >
                        {item.genre}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">
                      {item.totalScenes} scenes • {item.market} • {formatBudgetRange(item)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {item.dominantTone} • {item.emotionalJourney}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(item.id)}
                      disabled={detailLoadingId === item.id}
                      className="rounded-md border border-[#D4AF37]/30 px-3 py-1.5 text-sm text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all disabled:opacity-60"
                    >
                      {detailLoadingId === item.id ? 'Loading...' : 'View'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-md border border-red-400/30 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 transition-all"
                    >
                      <span className="inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
              disabled={currentPage === 0}
              className="rounded-md border border-[#D4AF37]/30 px-3 py-1.5 text-sm text-[#D4AF37] disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-300">Page {currentPage + 1} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages - 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md border border-[#D4AF37]/30 px-3 py-1.5 text-sm text-[#D4AF37] disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </section>
      </main>

      {selectedDetail && (
        <HistoryDetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
      )}
    </div>
  );
}
