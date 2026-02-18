import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Edit3,
    Trash2,
    Calendar,
    DollarSign,
    Plus,
    RefreshCw,
    User,
    Info,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const CashClosureDetail = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [closure, setClosure] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({ amount: '', description: '' });

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cash_closures')
                .select(`
                    *,
                    profiles:created_by (full_name),
                    cash_closure_expenses (
                        *,
                        staff:staff_id (full_name)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setClosure(data);
            setExpenses(data.cash_closure_expenses || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && user) fetchDetail();
    }, [id, user]);

    const handleConfirm = async () => {
        if (!window.confirm('Bu kasa kapanışını onaylamak istediğinize emin misiniz? Onaylandıktan sonra düzenleme yapılamaz.')) return;
        try {
            const { error } = await supabase
                .from('cash_closures')
                .update({ is_confirmed: true })
                .eq('id', id);
            if (error) throw error;
            fetchDetail();
        } catch (err) {
            alert('Onaylama hatası');
        }
    };

    const handleAddExpense = async () => {
        if (!newExpense.amount || !newExpense.description) return;
        try {
            const { error } = await supabase
                .from('cash_closure_expenses')
                .insert({
                    cash_closure_id: id,
                    amount: parseFloat(newExpense.amount),
                    description: newExpense.description,
                    staff_id: user.id
                });
            if (error) throw error;

            // Re-calculate total expenses in main table
            const newTotal = expenses.reduce((s, e) => s + parseFloat(e.amount), 0) + parseFloat(newExpense.amount);
            const newDiff = (closure.cash_entered + closure.cc_entered) - (closure.cash_system + closure.cc_system);

            await supabase
                .from('cash_closures')
                .update({
                    total_expenses: newTotal,
                    difference: newDiff
                })
                .eq('id', id);

            setNewExpense({ amount: '', description: '' });
            fetchDetail();
        } catch (err) {
            alert('Gider ekleme hatası');
        }
    };

    const handleRemoveExpense = async (expId) => {
        if (closure.is_confirmed) return;
        try {
            const { error } = await supabase
                .from('cash_closure_expenses')
                .delete()
                .eq('id', expId);
            if (error) throw error;
            fetchDetail();
        } catch (err) {
            alert('Gider silme hatası');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
    };

    if (loading) {
        return (
            <div className="p-12 text-center">
                <RefreshCw className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
                <span className="text-sm font-bold text-gray-400">Veriler Yükleniyor...</span>
            </div>
        );
    }

    if (!closure) return <div>Kayıt bulunamadı.</div>;

    const denominations = [
        { key: 'n200', label: '200,00 ₺', value: 200 },
        { key: 'n100', label: '100,00 ₺', value: 100 },
        { key: 'n50', label: '50,00 ₺', value: 50 },
        { key: 'n20', label: '20,00 ₺', value: 20 },
        { key: 'n10', label: '10,00 ₺', value: 10 },
        { key: 'n5', label: '5,00 ₺', value: 5 },
        { key: 'n1', label: '1,00 ₺', value: 1 },
        { key: 'n05', label: '0,50 ₺', value: 0.5 },
        { key: 'n025', label: '0,25 ₺', value: 0.25 },
        { key: 'n010', label: '0,10 ₺', value: 0.1 },
        { key: 'n005', label: '0,05 ₺', value: 0.05 },
    ];

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-left">
                        <button
                            onClick={() => navigate('/isletme/kasa-kapanisi')}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-800 tracking-tight">Kasa Kapanış Detayı</h1>
                            <p className="text-xs font-bold text-gray-400">Pano • Kasa Kapanışları • {format(new Date(closure.date), 'dd MMMM yyyy', { locale: tr })}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!closure.is_confirmed && (
                            <>
                                <button
                                    onClick={() => navigate(`/isletme/kasa-kapanisi/duzenle/${closure.id}`)}
                                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                                >
                                    <Edit3 size={16} />
                                    Düzenle
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex items-center gap-2 bg-[#14B8A6] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0D9488] transition-all"
                                >
                                    <CheckCircle2 size={16} />
                                    Onayla
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => { if (window.confirm('Silmek istediğinize emin misiniz?')) navigate('/isletme/kasa-kapanisi'); }}
                            className="flex items-center gap-2 bg-red-50 text-red-500 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
                        >
                            <Trash2 size={16} />
                            Sil
                        </button>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[20px] shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-gray-800">Tarih: {format(new Date(closure.date), 'dd MMMM yyyy', { locale: tr })}</p>
                            <p className="text-sm font-bold text-gray-800">Oluşturma Zamanı: {format(new Date(closure.created_at), 'dd MMMM yyyy - HH:mm', { locale: tr })}</p>
                            <p className="text-sm font-black text-gray-800 mt-4 mb-2">Tutarlar:</p>
                        </div>
                        <p className="text-sm font-bold text-gray-800">Kasayı Kapatan: {closure.profiles?.full_name}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Denominations Table */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <span className="text-sm font-black text-gray-800">Açılış Tutarı</span>
                                <span className="text-sm font-bold text-gray-700">{formatCurrency(closure.opening_balance)}</span>
                            </div>
                            {denominations.map(d => (
                                <div key={d.key} className="flex justify-between items-center py-2 border-b border-gray-50">
                                    <span className="text-sm font-black text-gray-800 w-16">{d.label.replace(',00 ₺', ' ₺')}</span>
                                    <span className="text-sm font-bold text-gray-500">{closure[d.key] || 0} Adet</span>
                                    <span className="text-sm font-bold text-gray-700">{formatCurrency((closure[d.key] || 0) * d.value)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Summary Table */}
                        <div className="space-y-6">
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full text-center border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 border-b border-r border-gray-200"></th>
                                            <th className="px-4 py-3 border-b border-r border-gray-200 text-xs font-black text-gray-700 uppercase">Girilen</th>
                                            <th className="px-4 py-3 border-b border-r border-gray-200 text-xs font-black text-gray-700 uppercase">Sistemde Olan</th>
                                            <th className="px-4 py-3 border-b text-xs font-black text-gray-700 uppercase">Fark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="px-4 py-4 border-b border-r border-gray-200 bg-gray-50 text-xs font-black text-gray-700">Nakit</td>
                                            <td className="px-4 py-4 border-b border-r border-gray-200 text-sm font-bold text-gray-600">{formatCurrency(closure.cash_entered)}</td>
                                            <td className="px-4 py-4 border-b border-r border-gray-200 text-sm font-bold text-gray-600">{formatCurrency(closure.cash_system)}</td>
                                            <td className="px-4 py-4 border-b text-sm font-bold text-gray-600">{formatCurrency(closure.cash_entered - closure.cash_system)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-4 border-b border-r border-gray-200 bg-gray-50 text-xs font-black text-gray-700">Kredi Kartı</td>
                                            <td className="px-4 py-4 border-b border-r border-gray-200 text-sm font-bold text-gray-600">{formatCurrency(closure.cc_entered)}</td>
                                            <td className="px-4 py-4 border-b border-r border-gray-200 text-sm font-bold text-gray-600">{formatCurrency(closure.cc_system)}</td>
                                            <td className="px-4 py-4 border-b text-sm font-bold text-gray-600">{formatCurrency(closure.cc_entered - closure.cc_system)}</td>
                                        </tr>
                                        <tr className="bg-white">
                                            <td className="px-4 py-4 border-r border-gray-200 bg-white text-xs font-black text-gray-700 uppercase">TOPLAM</td>
                                            <td className="px-4 py-4 border-r border-gray-200"></td>
                                            <td className="px-4 py-4 border-r border-gray-200 text-sm font-black text-gray-800">{formatCurrency(closure.cash_system + closure.cc_system)}</td>
                                            <td className={`px-4 py-4 text-sm font-black ${closure.difference < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(closure.difference)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="mt-16">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-16">
                                <span className="text-sm font-black text-gray-800 uppercase">Gider</span>
                                <span className="text-sm font-black text-gray-800 uppercase">Tutar</span>
                                <span className="text-sm font-black text-gray-800 uppercase">Açıklama</span>
                                <span className="text-sm font-black text-gray-800 uppercase">Tarih</span>
                                <span className="text-sm font-black text-gray-800 uppercase pl-8">Ekleyen</span>
                            </div>
                            <button className="p-2 bg-gray-100 text-gray-400 rounded-lg">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="divide-y divide-gray-100 border-t border-gray-100">
                            {expenses.map((e, idx) => (
                                <div key={e.id} className="grid grid-cols-6 py-4 items-center group">
                                    <span className="text-sm font-bold text-gray-500">Gider {idx + 1}</span>
                                    <span className="text-sm font-bold text-gray-800">{formatCurrency(e.amount)}</span>
                                    <span className="text-sm font-bold text-gray-500">{e.description}</span>
                                    <span className="text-sm font-bold text-gray-500">{format(new Date(e.created_at), 'dd.MM.yyyy HH:mm')}</span>
                                    <span className="text-sm font-bold text-gray-500 col-span-2 text-center">{e.staff?.full_name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashClosureDetail;
