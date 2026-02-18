import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Calendar,
    DollarSign,
    Calculator,
    AlertCircle,
    Info,
    RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const NewCashClosure = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [openingBalance, setOpeningBalance] = useState(0);

    // Denominations
    const [counts, setCounts] = useState({
        n200: 0, n100: 0, n50: 0, n20: 0, n10: 0, n5: 0,
        n1: 0, n05: 0, n025: 0, n010: 0, n005: 0
    });

    const [ccEntered, setCcEntered] = useState(0);
    const [systemData, setSystemData] = useState({
        cash: 0,
        cc: 0
    });

    // Expenses
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({ amount: '', description: '' });

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

    const calculateCashEntered = () => {
        return denominations.reduce((sum, d) => sum + (counts[d.key] || 0) * d.value, 0);
    };

    const cashEntered = calculateCashEntered();
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netCash = cashEntered - totalExpenses;
    const totalEntered = cashEntered + ccEntered;
    const totalSystem = systemData.cash + systemData.cc;
    const difference = totalEntered - totalSystem;

    useEffect(() => {
        if (isEdit && user) {
            fetchClosure();
        } else if (user) {
            fetchSystemTotals();
        }
    }, [user, date]);

    const fetchClosure = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('cash_closures')
                .select('*, cash_closure_expenses(*)')
                .eq('id', id)
                .single();

            if (error) throw error;

            setDate(data.date);
            setOpeningBalance(data.opening_balance);
            setCounts({
                n200: data.n200, n100: data.n100, n50: data.n50, n20: data.n20,
                n10: data.n10, n5: data.n5, n1: data.n1, n05: data.n05,
                n025: data.n025, n010: data.n010, n005: data.n005
            });
            setCcEntered(data.cc_entered);
            setExpenses(data.cash_closure_expenses || []);
            // System data will be fetched via the other useEffect that depends on date
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSystemTotals = async () => {
        if (!user?.business_id) return;
        setFetchingData(true);
        try {
            // Fetch payments for the specific date
            const { data: payments, error: pError } = await supabase
                .from('payments')
                .select('amount, payment_method')
                .eq('business_id', user.business_id)
                .gte('created_at', `${date}T00:00:00Z`)
                .lte('created_at', `${date}T23:59:59Z`);

            if (pError) throw pError;

            const cash = payments.filter(p => p.payment_method === 'Nakit').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const cc = payments.filter(p => p.payment_method === 'Kredi Kartı').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

            setSystemData({ cash, cc });
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingData(false);
        }
    };

    const handleAddExpense = () => {
        if (!newExpense.amount || !newExpense.description) return;
        setExpenses([
            ...expenses,
            { ...newExpense, id: Date.now(), staff_id: user.id } // temp id
        ]);
        setNewExpense({ amount: '', description: '' });
    };

    const handleRemoveExpense = (index) => {
        setExpenses(expenses.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const closureData = {
                business_id: user.business_id,
                date,
                opening_balance: openingBalance,
                ...counts,
                cash_entered: cashEntered,
                cash_system: systemData.cash,
                cc_entered: ccEntered,
                cc_system: systemData.cc,
                total_expenses: totalExpenses,
                difference: difference,
                created_by: user.id
            };

            let closureId = id;

            if (isEdit) {
                const { error } = await supabase
                    .from('cash_closures')
                    .update(closureData)
                    .eq('id', id);
                if (error) throw error;

                // Sync expenses
                await supabase.from('cash_closure_expenses').delete().eq('cash_closure_id', id);
            } else {
                const { data, error } = await supabase
                    .from('cash_closures')
                    .insert(closureData)
                    .select()
                    .single();
                if (error) throw error;
                closureId = data.id;
            }

            // Insert expenses
            if (expenses.length > 0) {
                const expensesToInsert = expenses.map(e => ({
                    cash_closure_id: closureId,
                    amount: e.amount,
                    description: e.description,
                    staff_id: user.id
                }));
                const { error: eError } = await supabase.from('cash_closure_expenses').insert(expensesToInsert);
                if (eError) throw eError;
            }

            navigate('/isletme/kasa-kapanisi');
        } catch (err) {
            alert('Kaydetme hatası: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
    };

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
                            <h1 className="text-xl font-black text-gray-800 tracking-tight">
                                {isEdit ? 'Kasa Kapanışını Güncelle' : 'Yeni Kasa Kapanışı'}
                            </h1>
                            <p className="text-xs font-bold text-gray-400">Pano • Kasa Kapanışları • {isEdit ? 'Güncelle' : 'Yeni'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Denominations */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Calculator size={18} className="text-[#5D5FEF]" />
                                Banknot ve Bozuk Para
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-indigo-50/50 p-4 rounded-2xl mb-4 border border-indigo-100">
                                    <span className="text-xs font-black text-indigo-900 uppercase">Açılış Tutarı</span>
                                    <input
                                        type="number"
                                        className="w-24 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-right text-sm font-black outline-none"
                                        value={openingBalance}
                                        onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                                    />
                                </div>

                                {denominations.map(d => (
                                    <div key={d.key} className="flex items-center gap-4">
                                        <div className="w-20 text-xs font-black text-gray-400 text-left">{d.label}</div>
                                        <input
                                            type="number"
                                            placeholder="Adet"
                                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                            value={counts[d.key] === 0 ? '' : counts[d.key]}
                                            onChange={(e) => setCounts({ ...counts, [d.key]: parseInt(e.target.value) || 0 })}
                                        />
                                        <div className="w-24 text-right text-sm font-black text-gray-700">
                                            {formatCurrency((counts[d.key] || 0) * d.value)}
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-sm font-black text-gray-800 uppercase">GİRİLEN NAKİT</span>
                                    <span className="text-xl font-black text-[#5D5FEF]">{formatCurrency(cashEntered)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Comparison & Expenses */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <input
                                            type="date"
                                            className="text-lg font-black text-gray-800 outline-none bg-gray-50 px-4 py-2 rounded-xl border border-gray-100"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase">Sistem verileri otomatik çekilir</p>
                                    </div>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${difference === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Kasa Durumu: {difference === 0 ? 'EŞİT' : difference > 0 ? 'FAZLA' : 'EKSİK'}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Girilen Toplam</p>
                                    <p className="text-2xl font-black text-gray-800">{formatCurrency(totalEntered)}</p>
                                </div>
                                <div className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-2 relative">
                                    {fetchingData && <RefreshCw size={14} className="absolute right-4 top-4 animate-spin text-indigo-600" />}
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistem Toplamı</p>
                                    <p className="text-2xl font-black text-gray-800">{formatCurrency(totalSystem)}</p>
                                </div>
                                <div className={`p-6 rounded-3xl border space-y-2 ${difference < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${difference < 0 ? 'text-red-400' : 'text-green-400'}`}>Fark</p>
                                    <p className={`text-2xl font-black ${difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">TÜR</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">GİRİLEN</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">SİSTEMDE OLAN</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">FARK</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr>
                                            <td className="px-6 py-4 text-xs font-black text-gray-600 uppercase">Nakit</td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-800">{formatCurrency(cashEntered)}</td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-800">{formatCurrency(systemData.cash)}</td>
                                            <td className="px-6 py-4 text-sm font-black text-right">{formatCurrency(cashEntered - systemData.cash)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-xs font-black text-gray-600 uppercase">Kredi Kartı</td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    className="w-28 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-black outline-none focus:border-indigo-500"
                                                    value={ccEntered || ''}
                                                    onChange={(e) => setCcEntered(parseFloat(e.target.value) || 0)}
                                                    placeholder="Tutar girin"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-sm font-black text-gray-800">{formatCurrency(systemData.cc)}</td>
                                            <td className="px-6 py-4 text-sm font-black text-right">{formatCurrency(ccEntered - systemData.cc)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Expenses Card */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <DollarSign size={18} className="text-red-500" />
                                Giderler
                            </h3>

                            <div className="space-y-4">
                                {expenses.map((exp, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="w-24 text-sm font-black text-gray-800">{formatCurrency(exp.amount)}</div>
                                        <div className="flex-1 text-sm font-bold text-gray-500">{exp.description}</div>
                                        <button
                                            onClick={() => handleRemoveExpense(idx)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-indigo-50/30 p-4 rounded-2xl border border-dashed border-indigo-200">
                                    <div className="md:col-span-3">
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Tutar</label>
                                        <input
                                            type="number"
                                            placeholder="0,00"
                                            className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                            value={newExpense.amount}
                                            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-7">
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Açıklama</label>
                                        <input
                                            type="text"
                                            placeholder="Gider açıklaması..."
                                            className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <button
                                            onClick={handleAddExpense}
                                            className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <Plus size={16} />
                                            Ekle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="flex items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                            <button
                                onClick={() => navigate('/isletme/kasa-kapanisi')}
                                className="px-6 py-3 text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 bg-[#5D5FEF] hover:bg-[#4B4DDB] disabled:opacity-50 text-white px-10 py-4 rounded-[20px] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                                {isEdit ? 'Kasa Kapanışını Güncelle' : 'Kasa Kapanışını Kaydet'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewCashClosure;
