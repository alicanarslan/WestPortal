import * as React from "react";
import { Users, Loader2 } from "lucide-react";

interface UserAccountsTableProps {
  users: any[];
  usersLoading: boolean;
  confirmDeleteUid: string | null;
  setConfirmDeleteUid: (uid: string | null) => void;
  onDeleteUser: (uid: string) => Promise<void> | void;
}

export default function UserAccountsTable({
  users,
  usersLoading,
  confirmDeleteUid,
  setConfirmDeleteUid,
  onDeleteUser
}: UserAccountsTableProps) {
  return (
    <div className="lg:col-span-12 border-t border-slate-800/60 pt-6">
      <div className="bg-[#090e18]/80 rounded-2xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Sistemdeki Oyuncu / Gamers Hesapları ({users.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            // Pasif veya gereksiz hesapları temizleyin
          </span>
        </div>

        {usersLoading ? (
          <div className="text-center py-6">
            <Loader2 className="w-6 h-6 text-pink-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">Hesap havuzu okunuyor...</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-slate-505 italic py-3 font-sans">Kayıtlı hiçbir kullanıcı hesabı bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-505 text-[10px] uppercase">
                  <th className="py-2.5 px-2">Karakter</th>
                  <th className="py-2.5 px-2">Durum</th>
                  <th className="py-2.5 px-2">Gamer Nick / Adı</th>
                  <th className="py-2.5 px-2">UID Anahtarı</th>
                  <th className="py-2.5 px-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {users.map((u) => {
                  const isConfirming = confirmDeleteUid === u.uid;
                  return (
                    <tr key={u.uid} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${u.avatarBg || "from-slate-700 to-slate-900"} text-white font-bold flex items-center justify-center text-[10px] border border-white/10 shrink-0`}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          u.isOnline 
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" 
                            : "bg-slate-900 text-slate-500 border border-slate-800/60"
                        }`}>
                          {u.isOnline ? "AKTİF" : "DEAKTİF / PASİF"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-slate-200">
                        {u.name}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 text-[10px] font-mono select-all">
                        {u.uid}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {isConfirming ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-rose-400 font-bold font-sans animate-pulse">SİLİNSİN Mİ?</span>
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u.uid)}
                              className="p-1 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] uppercase cursor-pointer transition-colors"
                            >
                              Evet, SİL
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUid(null)}
                              className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[9px] uppercase cursor-pointer"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUid(u.uid)}
                            className="p-1 px-2 rounded bg-rose-950/20 hover:bg-rose-950/50 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all font-bold text-[9px] uppercase cursor-pointer"
                            title="Gamer hesabını sistemden sil"
                          >
                            Hesabı Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
