import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabaseAdmin } from '../lib/supabaseClient';

interface UserRecord {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

const AdminPage: React.FC = () => {
  const { user, signOut } = useAuth();

  // Users list
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Create user form
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Active tab
  const [tab, setTab] = useState<'users' | 'create'>('users');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setListError(null);
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      const mapped: UserRecord[] = data.users.map(u => ({
        id: u.id,
        email: u.email ?? '—',
        role: u.app_metadata?.role ?? u.user_metadata?.role ?? 'user',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
      }));
      setUsers(mapped);
    } catch (e: unknown) {
      setListError((e as Error).message ?? 'Erro ao buscar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email: newEmail,
        password: newPassword,
        email_confirm: true,
        app_metadata: { role: newRole },
        user_metadata: { role: newRole },
      });
      if (error) throw error;
      setCreateMsg({ type: 'ok', text: `Usuário ${newEmail} criado com sucesso!` });
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      await fetchUsers();
    } catch (e: unknown) {
      setCreateMsg({ type: 'err', text: (e as Error).message ?? 'Erro ao criar usuário.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;
      setPendingDelete(null);
      await fetchUsers();
    } catch (e: unknown) {
      alert('Erro ao excluir: ' + (e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-yellow-500/20 px-6 py-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f97316 100%)' }}>
            RC
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              RC-BioScan <span className="text-amber-500">IA PRO</span>
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-blue-400 font-semibold">Painel Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-400">{user?.email}</span>
          </div>
          <button
            id="admin-signout-btn"
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-red-500/40 hover:text-red-400 text-slate-400 text-sm font-medium transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #fde047 0%, #eab308 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            Gerenciamento de Usuários
          </h2>
          <p className="text-slate-500 text-sm mt-1">Cadastre, visualize e remova usuários do sistema.</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total de usuários', value: users.length, icon: '👥', color: 'text-blue-400' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: '🛡️', color: 'text-amber-400' },
            { label: 'Confirmados', value: users.filter(u => u.email_confirmed_at).length, icon: '✅', color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 mb-6 w-fit">
          {([
            { id: 'users', label: 'Usuários Cadastrados' },
            { id: 'create', label: 'Novo Usuário' },
          ] as const).map(t => (
            <button
              key={t.id}
              id={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id
                ? 'text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'}`}
              style={tab === t.id ? { background: 'linear-gradient(135deg, #d4af37 0%, #f97316 100%)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* --- TAB: USERS LIST --- */}
        {tab === 'users' && (
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-bold text-lg">Usuários do Sistema</h3>
              <button
                id="admin-refresh-btn"
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition-all disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
            </div>

            {listError && (
              <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {listError}
              </div>
            )}

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                <svg className="w-8 h-8 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-600">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-left">
                      {['E-mail', 'Função', 'Criado em', 'Último acesso', 'Status', 'Ações'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr
                        key={u.id}
                        className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                      >
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0 uppercase">
                              {u.email[0]}
                            </div>
                            <span className="text-slate-200 truncate max-w-[180px]">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            {u.role === 'admin' ? '🛡️ Admin' : '👤 Usuário'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{formatDate(u.last_sign_in_at)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${u.email_confirmed_at
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.email_confirmed_at ? 'bg-green-400' : 'bg-yellow-500'}`} />
                            {u.email_confirmed_at ? 'Confirmado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {pendingDelete === u.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-400">Confirmar?</span>
                              <button
                                id={`admin-confirm-delete-${u.id}`}
                                onClick={() => handleDelete(u.id)}
                                disabled={deleting}
                                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                {deleting ? '...' : 'Sim'}
                              </button>
                              <button
                                onClick={() => setPendingDelete(null)}
                                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`admin-delete-user-${u.id}`}
                              onClick={() => setPendingDelete(u.id)}
                              disabled={u.id === user?.id}
                              title={u.id === user?.id ? 'Não é possível excluir o próprio usuário' : 'Excluir usuário'}
                              className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: CREATE USER --- */}
        {tab === 'create' && (
          <div className="glass rounded-3xl p-8 border border-white/5 max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f97316 100%)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Cadastrar Novo Usuário</h3>
                <p className="text-slate-500 text-xs mt-0.5">O usuário poderá acessar o sistema imediatamente.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="new-email" className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                  E-mail
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  required
                  placeholder="usuario@email.com"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="new-password" className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                  Senha inicial
                </label>
                <input
                  id="new-password"
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/30 transition-all placeholder:text-slate-600"
                />
                <p className="text-[11px] text-slate-600">A senha pode ser alterada pelo usuário após o primeiro acesso.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                  Função / Nível de acesso
                </label>
                <div className="flex gap-3">
                  {([
                    { val: 'user', label: '👤 Usuário', desc: 'Acesso padrão' },
                    { val: 'admin', label: '🛡️ Admin', desc: 'Acesso total' },
                  ] as const).map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setNewRole(r.val)}
                      className={`flex-1 p-4 rounded-xl border text-left transition-all ${newRole === r.val
                        ? 'border-amber-500/60 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'}`}
                    >
                      <p className={`text-sm font-bold ${newRole === r.val ? 'text-amber-400' : 'text-slate-300'}`}>
                        {r.label}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback message */}
              {createMsg && (
                <div className={`flex items-start gap-3 p-4 rounded-xl text-sm border ${createMsg.type === 'ok'
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <span className="text-base">{createMsg.type === 'ok' ? '✅' : '⚠️'}</span>
                  <span>{createMsg.text}</span>
                </div>
              )}

              <button
                id="admin-create-user-btn"
                type="submit"
                disabled={creating || !newEmail || !newPassword}
                className="w-full py-4 rounded-2xl font-bold text-white text-sm shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f97316 100%)' }}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Criando...
                  </span>
                ) : 'Criar Usuário'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-xs border-t border-slate-800/50 no-print">
        RC-BioScan IA PRO • Painel Administrativo • Acesso Restrito
      </footer>
    </div>
  );
};

export default AdminPage;
