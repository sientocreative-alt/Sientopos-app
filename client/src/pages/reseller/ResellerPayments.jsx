import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    CreditCard,
    Plus,
    History,
    PiggyBank,
    Building2,
    Calendar,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Clock,
    Wallet,
    Trash2,
    Search,
    Landmark
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const ResellerPayments = () => {
    const [activeTab, setActiveTab] = useState('request'); // request, history, bank
    const [bankAccounts, setBankAccounts] = useState([]);
    const [payoutRequests, setPayoutRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableBalance, setAvailableBalance] = useState(0);
    const { user } = useAuth();

    // Form states
    const [payoutAmount, setPayoutAmount] = useState('');
    const [selectedBankId, setSelectedBankId] = useState('');
    const [showBankForm, setShowBankForm] = useState(false);
    const [bankForm, setBankForm] = useState({ bank_name: '', account_holder: '', iban: '' });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [banksRes, requestsRes, balanceRes] = await Promise.all([
                supabase.from('reseller_bank_accounts').select('*').eq('reseller_id', user.id).order('created_at', { ascending: false }),
                supabase.from('reseller_payout_requests').select('*, reseller_bank_accounts(bank_name, iban)').eq('reseller_id', user.id).order('created_at', { ascending: false }),
                supabase.from('reseller_commissions').select('commission_amount, status').eq('reseller_id', user.id)
            ]);

            if (banksRes.error) throw banksRes.error;
            if (requestsRes.error) throw requestsRes.error;
            if (balanceRes.error) throw balanceRes.error;

            setBankAccounts(banksRes.data || []);
            setPayoutRequests(requestsRes.data || []);

            // Ledger Logic: Available = Total Earnings - Total Requests (Pending+Approved+Completed)
            const totalEarnings = balanceRes.data
                .filter(c => c.status !== 'cancelled')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

            const totalWithdrawals = requestsRes.data
                .filter(r => ['pending', 'approved', 'completed'].includes(r.status))
                .reduce((sum, r) => sum + parseFloat(r.amount), 0);

            setAvailableBalance(totalEarnings - totalWithdrawals);

            if (banksRes.data?.[0] && !selectedBankId) {
                const primary = banksRes.data.find(b => b.is_primary) || banksRes.data[0];
                setSelectedBankId(primary.id);
            }
        } catch (error) {
            console.error('Error fetching payments data:', error);
            toast.error('Veriler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBank = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('reseller_bank_accounts').insert({
                reseller_id: user.id,
                ...bankForm,
                is_primary: bankAccounts.length === 0
            });
            if (error) throw error;
            toast.success('Banka hesabı eklendi');
            setBankForm({ bank_name: '', account_holder: '', iban: '' });
            setShowBankForm(false);
            fetchData();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        }
    };

    const handleDeleteBank = async (id) => {
        if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('reseller_bank_accounts').delete().eq('id', id);
            if (error) throw error;
            toast.success('Banka hesabı silindi');
            fetchData();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        }
    };

    const handlePayoutRequest = async (e) => {
        e.preventDefault();
        const amount = parseFloat(payoutAmount);
        if (isNaN(amount) || amount <= 0) return toast.error('Geçerli bir tutar girin');
        if (amount > availableBalance) return toast.error('Yetersiz bakiye');
        if (!selectedBankId) return toast.error('Lütfen bir banka hesabı seçin');

        try {
            const { error } = await supabase.from('reseller_payout_requests').insert({
                reseller_id: user.id,
                amount,
                bank_account_id: selectedBankId,
                status: 'pending'
            });
            if (error) throw error;
            toast.success('Ödeme talebi oluşturuldu');
            setPayoutAmount('');
            fetchData();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        }
    };

    const tabs = [
        { id: 'request', label: 'Ödeme Talebi', icon: Wallet },
        { id: 'history', label: 'Ödeme Geçmişi', icon: History },
        { id: 'bank', label: 'Banka Bilgileri', icon: Landmark }
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <CreditCard size={20} className="text-indigo-600" />
                        ÖDEME YÖNETİMİ
                    </h1>
                    <p className="text-slate-400 font-bold mt-0.5 uppercase text-[9px] tracking-widest opacity-70 italic">
                        Hak edişlerinizin transferi ve hesap yönetimi
                    </p>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Tab Content */}
                    {activeTab === 'request' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Balance Card */}
                            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Kullanılabilir Bakiye</div>
                                    <div className="text-4xl font-black">{availableBalance.toLocaleString('tr-TR')} ₺</div>
                                    <p className="text-[10px] mt-4 font-bold opacity-70 italic">
                                        * Onaylanmış ancak henüz transfer edilmemiş hak edişleriniz
                                    </p>
                                </div>
                                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                                    <PiggyBank size={140} />
                                </div>
                            </div>

                            {/* Payout Form */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Yeni Talep Oluştur</h3>
                                {bankAccounts.length === 0 ? (
                                    <div className="text-center py-4">
                                        <AlertCircle className="mx-auto text-amber-500 mb-2" size={24} />
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Önce banka hesabı eklemelisiniz</p>
                                        <button
                                            onClick={() => setActiveTab('bank')}
                                            className="mt-3 text-[10px] font-black text-indigo-600 uppercase border-b border-indigo-600 leading-none"
                                        >
                                            Hesap Ekle
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handlePayoutRequest} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tutar (₺)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:ring-4 focus:ring-indigo-600/5 focus:outline-none transition-all placeholder:opacity-30"
                                                placeholder="0.00"
                                                value={payoutAmount}
                                                onChange={(e) => setPayoutAmount(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Transfer Edilecek Hesap</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:ring-4 focus:ring-indigo-600/5 focus:outline-none transition-all appearance-none"
                                                value={selectedBankId}
                                                onChange={(e) => setSelectedBankId(e.target.value)}
                                            >
                                                {bankAccounts.map(bank => (
                                                    <option key={bank.id} value={bank.id}>
                                                        {bank.bank_name} - {bank.account_holder}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.98] mt-2"
                                        >
                                            Ödeme Talebi Gönder
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full text-left text-[10px]">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100/50 font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-5 py-4 opacity-70">Tarih</th>
                                        <th className="px-5 py-4 opacity-70">İşlem ID</th>
                                        <th className="px-5 py-4 opacity-70">Banka</th>
                                        <th className="px-5 py-4 opacity-70">Tutar</th>
                                        <th className="px-5 py-4 opacity-70">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payoutRequests.length > 0 ? (
                                        payoutRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-all">
                                                <td className="px-5 py-4 font-bold text-slate-500 whitespace-nowrap">
                                                    {format(new Date(req.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                                                </td>
                                                <td className="px-5 py-4 font-mono font-bold text-slate-400 truncate max-w-[100px]">
                                                    {req.id.split('-')[0].toUpperCase()}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-black text-slate-700 uppercase tracking-tight">
                                                        {req.reseller_bank_accounts?.bank_name || 'Bilinmiyor'}
                                                    </div>
                                                    <div className="text-[8px] text-slate-400 font-mono tracking-tighter italic">
                                                        {req.reseller_bank_accounts?.iban || '****'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 font-black text-slate-900 whitespace-nowrap uppercase">
                                                    {req.amount.toLocaleString('tr-TR')} ₺
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-widest ${(req.status === 'completed' || req.status === 'approved') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                                                            req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                                                                'bg-rose-50 text-rose-700 border border-rose-100/50'
                                                        }`}>
                                                        {req.status === 'completed' ? 'TAMAMLANDI' :
                                                            req.status === 'pending' ? 'BEKLEMEDE' :
                                                                req.status === 'approved' ? 'ONAYLANDI' : 'RETTEDİLDİ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-12 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-50">
                                                Henüz bir ödeme işlemi bulunmuyor
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'bank' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.1em]">Kayıtlı Banka Hesapları</h3>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">Komisyon ödemeleriniz için güvenilir hesaplar</p>
                                </div>
                                <button
                                    onClick={() => setShowBankForm(!showBankForm)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${showBankForm ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        }`}
                                >
                                    {showBankForm ? 'Kapat' : 'Hesap Ekle'}
                                    {!showBankForm && <Plus size={14} />}
                                </button>
                            </div>

                            {showBankForm && (
                                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-6">
                                    <form onSubmit={handleAddBank} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Banka Adı</label>
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5"
                                                placeholder="Örn: Garanti BBVA"
                                                value={bankForm.bank_name}
                                                onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Hesap Sahibi</label>
                                            <input
                                                required
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5"
                                                placeholder="Ad Soyad"
                                                value={bankForm.account_holder}
                                                onChange={e => setBankForm({ ...bankForm, account_holder: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">IBAN</label>
                                            <div className="flex gap-2">
                                                <input
                                                    required
                                                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-4 focus:ring-indigo-600/5"
                                                    placeholder="TR00..."
                                                    value={bankForm.iban}
                                                    onChange={e => setBankForm({ ...bankForm, iban: e.target.value.toUpperCase() })}
                                                />
                                                <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-md shadow-indigo-600/20">Kaydet</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bankAccounts.map(bank => (
                                    <div key={bank.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm group hover:border-indigo-200 transition-all relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                <Building2 size={20} />
                                            </div>
                                            <button
                                                onClick={() => handleDeleteBank(bank.id)}
                                                className="p-2 text-slate-300 hover:text-rose-600 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="font-black text-slate-900 uppercase tracking-tight text-xs">{bank.account_holder}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{bank.bank_name}</div>
                                            <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-[10px] font-black text-indigo-600 tracking-tighter">
                                                {bank.iban}
                                            </div>
                                        </div>
                                        {bank.is_primary && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">
                                                <CheckCircle2 size={8} /> Ana Hesap
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {bankAccounts.length === 0 && !showBankForm && (
                                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                        <PiggyBank className="mx-auto text-slate-200 mb-3" size={40} />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Henüz banka hesabı eklenmedi</h4>
                                        <button
                                            onClick={() => setShowBankForm(true)}
                                            className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            Hemen Ekle
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResellerPayments;
