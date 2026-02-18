import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    Lock,
    FileText,
    CreditCard,
    Save,
    Plus,
    Trash2,
    Building2,
    Mail,
    Phone,
    MapPin,
    Globe,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronRight,
    Briefcase,
    ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ResellerProfile = () => {
    const { user, fetchProfileAndSetUser } = useAuth();
    const { tab } = useParams();
    const navigate = useNavigate();
    const activeTab = tab || 'hesap-bilgileri';

    const tabs = [
        { id: 'hesap-bilgileri', label: 'Hesap Bilgileri', icon: User },
        { id: 'sifre-degistir', label: 'Şifre Değiştir', icon: Lock },
        { id: 'sozlesme', label: 'Sözleşme', icon: FileText },
        { id: 'banka-bilgileri', label: 'Banka Bilgileri', icon: CreditCard }
    ];

    // --- Sub-components ---

    const AccountInfo = () => {
        const [submitting, setSubmitting] = useState(false);
        const [formData, setFormData] = useState({
            company_name: user?.company_name || '',
            main_contact_name: user?.main_contact_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            tax_office: user?.tax_office || '',
            tax_number: user?.tax_number || '',
            city: user?.city || '',
            district: user?.district || '',
            address: user?.address || '',
            website: user?.website || ''
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
                const { error } = await supabase
                    .from('resellers')
                    .update({
                        company_name: formData.company_name,
                        main_contact_name: formData.main_contact_name,
                        phone: formData.phone,
                        tax_office: formData.tax_office,
                        tax_number: formData.tax_number,
                        city: formData.city,
                        district: formData.district,
                        address: formData.address,
                        website: formData.website
                    })
                    .eq('id', user.id);

                if (error) throw error;
                toast.success('Hesap bilgileri güncellendi');
                if (fetchProfileAndSetUser) await fetchProfileAndSetUser(supabase.auth.getSession());
            } catch (error) {
                toast.error('Giriş hatası: ' + error.message);
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kurumsal Bilgiler */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 size={16} className="text-indigo-600" />
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Kurumsal Bilgiler</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma Adı</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                value={formData.company_name}
                                onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vergi Dairesi</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.tax_office}
                                    onChange={e => setFormData({ ...formData, tax_office: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vergi Numarası</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.tax_number}
                                    onChange={e => setFormData({ ...formData, tax_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Web Sitesi</label>
                            <div className="relative">
                                <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.website}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="www.example.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* İletişim Bilgileri */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase size={16} className="text-indigo-600" />
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">İletişim Bilgileri</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Yetkili Ad Soyad</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                value={formData.main_contact_name}
                                onChange={e => setFormData({ ...formData, main_contact_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-Posta</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    disabled
                                    type="email"
                                    className="w-full bg-slate-100 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-slate-400 font-bold text-xs cursor-not-allowed"
                                    value={formData.email}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Adres Bilgileri */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-indigo-600" />
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Adres Bilgileri</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Şehir</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">İlçe</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                value={formData.district}
                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tam Adres</label>
                        <textarea
                            rows="3"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all resize-none"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Değişiklikleri Kaydet
                    </button>
                </div>
            </form>
        );
    };

    const ChangePassword = () => {
        const [submitting, setSubmitting] = useState(false);
        const [formData, setFormData] = useState({
            password: '',
            confirmPassword: ''
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (formData.password !== formData.confirmPassword) {
                toast.error('Şifreler eşleşmiyor');
                return;
            }
            if (formData.password.length < 6) {
                toast.error('Şifre en az 6 karakter olmalıdır');
                return;
            }

            setSubmitting(true);
            try {
                const { error } = await supabase.auth.updateUser({
                    password: formData.password
                });
                if (error) throw error;
                toast.success('Şifreniz başarıyla güncellendi');
                setFormData({ password: '', confirmPassword: '' });
            } catch (error) {
                toast.error('Hata: ' + error.message);
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-md mx-auto space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Şifre Değiştir</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70 italic">Hesap güvenliğinizi korumak için periyodik olarak şifrenizi değiştirin</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Yeni Şifre</label>
                        <input
                            required
                            type="password"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Şifre Tekrar</label>
                        <input
                            required
                            type="password"
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                            value={formData.confirmPassword}
                            onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-rose-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-4"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                        Şifreyi Güncelle
                    </button>
                </form>
            </div>
        );
    };

    const Contract = () => {
        const [contractContent, setContractContent] = useState('');
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            fetchContract();
        }, []);

        const fetchContract = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('platform_settings')
                    .select('value')
                    .eq('key', 'reseller_contract')
                    .single();

                if (error) throw error;
                if (data?.value?.content) {
                    setContractContent(data.value.content);
                }
            } catch (err) {
                console.error('Error fetching contract:', err);
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">İş Ortaklığı Sözleşmesi</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-70">Siento POS Bayi ve Çözüm Ortağı Sözleşmesi</p>
                        </div>
                    </div>
                    <button className="px-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                        PDF İndir
                    </button>
                </div>

                {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600" size={24} />
                    </div>
                ) : (
                    <div className="prose prose-slate max-w-none text-slate-600 text-[11px] font-bold leading-relaxed uppercase tracking-tight opacity-80 h-[500px] overflow-y-auto no-scrollbar pr-4 italic whitespace-pre-wrap">
                        {contractContent || 'Sözleşme yüklenemedi.'}
                    </div>
                )}
            </div>
        );
    };

    const BankAccounts = () => {
        const [accounts, setAccounts] = useState([]);
        const [loading, setLoading] = useState(true);
        const [showAdd, setShowAdd] = useState(false);
        const [newAccount, setNewAccount] = useState({
            bank_name: '',
            account_holder: '',
            iban: ''
        });

        useEffect(() => {
            fetchAccounts();
        }, []);

        const fetchAccounts = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('reseller_bank_accounts')
                    .select('*')
                    .eq('reseller_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setAccounts(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const handleAdd = async (e) => {
            e.preventDefault();
            try {
                const { error } = await supabase
                    .from('reseller_bank_accounts')
                    .insert([{
                        reseller_id: user.id,
                        ...newAccount,
                        is_primary: accounts.length === 0
                    }]);
                if (error) throw error;
                toast.success('Banka hesabı eklendi');
                setShowAdd(false);
                setNewAccount({ bank_name: '', account_holder: '', iban: '' });
                fetchAccounts();
            } catch (error) {
                toast.error(error.message);
            }
        };

        const handleDelete = async (id) => {
            if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
            try {
                const { error } = await supabase
                    .from('reseller_bank_accounts')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                toast.success('Hesap silindi');
                fetchAccounts();
            } catch (error) {
                toast.error(error.message);
            }
        };

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Kayıtlı Banka Hesaplarınız</h3>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-indigo-200"
                    >
                        {showAdd ? <ChevronRight size={14} className="rotate-90" /> : <Plus size={14} />}
                        Yeni Hesap Ekle
                    </button>
                </div>

                {showAdd && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Banka Adı</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={newAccount.bank_name}
                                    onChange={e => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                                    placeholder="Örn: Garanti BBVA"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hesap Sahibi</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={newAccount.account_holder}
                                    onChange={e => setNewAccount({ ...newAccount, account_holder: e.target.value })}
                                    placeholder="Ad Soyad"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">IBAN</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-xs focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
                                    value={newAccount.iban}
                                    onChange={e => setNewAccount({ ...newAccount, iban: e.target.value })}
                                    placeholder="TR00..."
                                />
                            </div>
                            <div className="md:col-span-3">
                                <button type="submit" className="w-full bg-slate-900 text-white rounded-xl py-3 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all">
                                    Hesabı Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-2 py-20 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                            <Loader2 className="animate-spin text-indigo-600" />
                        </div>
                    ) : accounts.length > 0 ? (
                        accounts.map(acc => (
                            <div key={acc.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-50">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{acc.bank_name}</h4>
                                            {acc.is_primary && (
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-50 rounded-lg border border-emerald-100 ml-0.5">Birincil Hesap</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.account_holder}</div>
                                        <div className="text-[11px] font-black text-slate-900 font-mono tracking-tighter">{acc.iban}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(acc.id)}
                                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 py-20 bg-white border border-slate-200 rounded-2xl text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto border border-slate-100 shadow-inner">
                                <CreditCard size={32} />
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Henüz bir banka hesabı eklemediniz</div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <User size={20} className="text-indigo-600" />
                        PROFİL AYARLARI
                    </h1>
                    <p className="text-slate-400 font-bold mt-0.5 uppercase text-[9px] tracking-widest opacity-70 italic">
                        Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => navigate(`/profil/${t.id}`)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="mt-8">
                {activeTab === 'hesap-bilgileri' && <AccountInfo />}
                {activeTab === 'sifre-degistir' && <ChangePassword />}
                {activeTab === 'sozlesme' && <Contract />}
                {activeTab === 'banka-bilgileri' && <BankAccounts />}
            </div>
        </div>
    );
};

export default ResellerProfile;
