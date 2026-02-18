import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
    CreditCard,
    Clock,
    CheckCircle2,
    XCircle,
    User,
    Landmark,
    Filter,
    Search,
    Loader2,
    ChevronRight,
    AlertCircle,
    Check,
    Wallet,
    FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const AdminResellerPayouts = () => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('reseller_payout_requests')
                .select(`
                    *,
                    resellers (name, email, phone),
                    reseller_bank_accounts (bank_name, account_holder, iban)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayouts(data || []);
        } catch (err) {
            console.error('Error fetching payouts:', err);
            toast.error('Ödeme talepleri yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleCompletePayout = async (id) => {
        // Create a hidden file input to trigger upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm(`Talebi ödenmiş olarak işaretleyip dekontu yüklemek istiyor musunuz?`)) return;

            setUploading(true);
            const toastId = toast.loading('Dekont yükleniyor ve işlem tamamlanıyor...');

            try {
                // 1. Upload file to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `receipt_${id}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('payout_receipts')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // 2. Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('payout_receipts')
                    .getPublicUrl(fileName);

                // 3. Update payout status and receipt_url
                const { error: updateError } = await supabase
                    .from('reseller_payout_requests')
                    .update({
                        status: 'completed',
                        processed_at: new Date().toISOString(),
                        receipt_url: publicUrl
                    })
                    .eq('id', id);

                if (updateError) throw updateError;

                toast.success('Ödeme tamamlandı ve dekont yüklendi', { id: toastId });
                fetchPayouts();

            } catch (err) {
                console.error('Error completing payout:', err);
                toast.error('Hata: ' + err.message, { id: toastId });
            } finally {
                setUploading(false);
            }
        };

        input.click();
    };

    const updateStatus = async (id, status) => {
        if (status === 'completed') {
            // Use special handler for completion to include file upload
            handleCompletePayout(id);
            return;
        }

        if (!confirm(`Talebi ${status} olarak işaretlemek istediğinize emin misiniz?`)) return;

        try {
            const { error } = await supabase
                .from('reseller_payout_requests')
                .update({
                    status,
                    processed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            toast.success('Talep güncellendi');
            fetchPayouts();
        } catch (err) {
            toast.error('Hata: ' + err.message);
        }
    };

    const filteredPayouts = payouts.filter(p => {
        const matchesSearch =
            p.resellers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.reseller_bank_accounts?.iban?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'approved': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Beklemede';
            case 'approved': return 'Onaylandı';
            case 'completed': return 'Tamamlandı';
            case 'rejected': return 'Reddedildi';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            {uploading && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                        <p className="font-bold text-gray-700">İşleniyor...</p>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <CreditCard className="text-blue-600" size={28} />
                        Bayi Ödeme Talepleri
                    </h1>
                    <p className="text-gray-500 font-medium font-sans">Bayilerin komisyon hak edişlerini yönetin.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Arayın..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64 text-sm font-medium"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 cursor-pointer text-sm"
                    >
                        <option value="All">Tüm Durumlar</option>
                        <option value="pending">Beklemede</option>
                        <option value="approved">Onaylandı</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="rejected">Reddedildi</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-gray-100">
                    <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40} />
                    <p className="text-gray-900 font-bold uppercase tracking-widest text-xs opacity-50">Talepler yükleniyor...</p>
                </div>
            ) : filteredPayouts.length > 0 ? (
                <div className="grid gap-4">
                    {filteredPayouts.map((p) => (
                        <div
                            key={p.id}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                        >
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
                                {/* Payout Info */}
                                <div className="flex-1 p-6 lg:p-8 flex gap-6 items-start">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${getStatusStyle(p.status)} shadow-sm`}>
                                        <Wallet size={28} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-bold text-gray-900 truncate">
                                                {p.amount.toLocaleString('tr-TR')} ₺
                                            </h3>
                                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border shadow-sm ${getStatusStyle(p.status)} uppercase tracking-widest`}>
                                                {getStatusText(p.status)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-gray-400">
                                            <div className="flex items-center gap-1.5 underline decoration-gray-200 underline-offset-4">
                                                <User size={14} />
                                                {p.resellers?.name}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                {format(new Date(p.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Landmark size={14} />
                                                {p.reseller_bank_accounts?.bank_name}
                                            </div>
                                        </div>
                                        {/* Receipt Link if exists */}
                                        {p.receipt_url && (
                                            <div className="mt-3">
                                                <a
                                                    href={p.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                                                >
                                                    <FileText size={14} />
                                                    Dekontu Görüntüle
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bank Info */}
                                <div className="p-6 lg:p-8 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-100 flex-1 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Hesap Sahibi</div>
                                        <div className="text-xs font-bold text-gray-700 truncate">{p.reseller_bank_accounts?.account_holder}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">IBAN</div>
                                        <div className="text-xs font-black text-gray-900 font-mono tracking-tighter truncate">{p.reseller_bank_accounts?.iban}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-6 lg:p-8 flex items-center justify-end gap-3 border-t lg:border-t-0 border-gray-100">
                                    {p.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(p.id, 'rejected')}
                                                className="w-10 h-10 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                                                title="Reddet"
                                            >
                                                <XCircle size={20} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(p.id, 'approved')}
                                                className="w-12 h-10 bg-blue-600 text-white hover:bg-blue-700 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-200 active:scale-95 font-bold text-xs"
                                                title="Onayla"
                                            >
                                                ONAYLA
                                            </button>
                                        </>
                                    )}
                                    {p.status === 'approved' && (
                                        <button
                                            onClick={() => updateStatus(p.id, 'completed')}
                                            className="w-full lg:w-48 h-10 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95 font-bold text-xs"
                                        >
                                            <Check size={16} /> ÖDENDİ & DEKONT
                                        </button>
                                    )}
                                    {p.status === 'completed' && (
                                        <div className="text-emerald-500 flex items-center gap-1.5 font-bold text-xs mr-4">
                                            <CheckCircle2 size={16} /> ÖDEME YAPILDI
                                        </div>
                                    )}
                                    {p.status === 'rejected' && (
                                        <div className="text-red-400 flex items-center gap-1.5 font-bold text-xs mr-4">
                                            <XCircle size={16} /> İPTAL EDİLDİ
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl p-20 text-center shadow-sm border-2 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CreditCard className="text-gray-200" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Talep Bulunmuyor</h2>
                    <p className="text-gray-500 mt-2 font-medium">Şu an ödeme bekleyen herhangi bir bayi talebi yok.</p>
                </div>
            )}
        </div>
    );
};

export default AdminResellerPayouts;
