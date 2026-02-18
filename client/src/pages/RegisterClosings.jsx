import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    X,
    Calculator,
    Save,
    Plus,
    Trash2,
    DollarSign,
    Calendar,
    RefreshCw,
    Delete,
    ArrowLeft
} from 'lucide-react';

const RegisterClosings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [openingBalance, setOpeningBalance] = useState('0');

    // Active field for keypad
    // Format: { type: 'opening' | 'count' | 'cc' | 'expense', key?: string }
    const [activeField, setActiveField] = useState({ type: 'opening' });

    // Denominations
    const [counts, setCounts] = useState({
        n200: '0', n100: '0', n50: '0', n20: '0', n10: '0', n5: '0',
        n1: '0', n05: '0', n025: '0', n010: '0', n005: '0'
    });

    const [ccEntered, setCcEntered] = useState('0');
    const [systemData, setSystemData] = useState({
        cash: 0,
        cc: 0
    });

    // Expenses
    const [expenses, setExpenses] = useState([]);
    const [expenseAmount, setExpenseAmount] = useState('0');
    const [expenseDescription, setExpenseDescription] = useState('');

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
        return denominations.reduce((sum, d) => sum + (parseFloat(counts[d.key]) || 0) * d.value, 0);
    };

    const cashEntered = calculateCashEntered();
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalEntered = cashEntered + (parseFloat(ccEntered) || 0);
    const totalSystem = systemData.cash + systemData.cc;
    const difference = totalEntered - totalSystem;

    useEffect(() => {
        if (user) {
            fetchSystemTotals();
        }
    }, [user, date]);

    const fetchSystemTotals = async () => {
        if (!user?.business_id) return;
        setFetchingData(true);
        try {
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

    const handleKeypadPress = (val) => {
        let currentVal = '';
        let setter = null;

        if (activeField.type === 'opening') {
            currentVal = openingBalance;
            setter = setOpeningBalance;
        } else if (activeField.type === 'count') {
            currentVal = counts[activeField.key];
            setter = (v) => setCounts({ ...counts, [activeField.key]: v });
        } else if (activeField.type === 'cc') {
            currentVal = ccEntered;
            setter = setCcEntered;
        } else if (activeField.type === 'expense') {
            currentVal = expenseAmount;
            setter = setExpenseAmount;
        }

        if (!setter) return;

        if (val === 'backspace') {
            const newVal = currentVal.slice(0, -1) || '0';
            setter(newVal);
        } else if (val === 'clear') {
            setter('0');
        } else {
            const newVal = currentVal === '0' ? val : currentVal + val;
            setter(newVal);
        }
    };

    const handleAddExpense = () => {
        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount <= 0 || !expenseDescription) return;

        setExpenses([
            ...expenses,
            { amount, description: expenseDescription, staff_id: user.id }
        ]);
        setExpenseAmount('0');
        setExpenseDescription('');
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const closureData = {
                business_id: user.business_id,
                date,
                opening_balance: parseFloat(openingBalance),
                n200: parseInt(counts.n200) || 0,
                n100: parseInt(counts.n100) || 0,
                n50: parseInt(counts.n50) || 0,
                n20: parseInt(counts.n20) || 0,
                n10: parseInt(counts.n10) || 0,
                n5: parseInt(counts.n5) || 0,
                n1: parseInt(counts.n1) || 0,
                n05: parseFloat(counts.n05) || 0,
                n025: parseFloat(counts.n025) || 0,
                n010: parseFloat(counts.n010) || 0,
                n005: parseFloat(counts.n005) || 0,
                cash_entered: cashEntered,
                cash_system: systemData.cash,
                cc_entered: parseFloat(ccEntered),
                cc_system: systemData.cc,
                total_expenses: totalExpenses,
                difference: difference,
                created_by: user.id
            };

            const { data, error } = await supabase
                .from('cash_closures')
                .insert(closureData)
                .select()
                .single();

            if (error) throw error;

            if (expenses.length > 0) {
                const expensesToInsert = expenses.map(e => ({
                    cash_closure_id: data.id,
                    amount: e.amount,
                    description: e.description,
                    staff_id: user.id
                }));
                await supabase.from('cash_closure_expenses').insert(expensesToInsert);
            }

            alert('Kasa kapanışı başarıyla kaydedildi.');
            navigate('/pos');
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-[#f8fafc] font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 z-20 shadow-sm shrink-0">
                <div className="max-w-[1600px] mx-auto p-2 sm:p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => navigate('/pos')}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#5D5FEF] hover:bg-indigo-50 transition-all font-black shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-[#5D5FEF] border border-indigo-100 shadow-sm">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-tight leading-none">Kasa Kapanışı</h1>
                            <p className="text-gray-400 font-bold text-[10px] sm:text-xs mt-0.5">Günlük hesap özeti ve nakit sayımı</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 gap-2">
                            <Calendar size={16} className="text-[#5D5FEF]" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none font-black text-gray-700 text-xs sm:text-sm cursor-pointer"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => navigate('/pos')}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 hover:bg-red-50 transition-all"
                        >
                            <X size={16} />
                            İptal
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full p-2 sm:p-4 overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-3 h-full">

                    {/* Left: Denominations Section */}
                    <div className="w-full lg:w-[28%] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                        <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
                            BANKNOT & BOZUK PARA
                        </h3>

                        <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {/* Opening Balance Field */}
                            <div
                                onClick={() => setActiveField({ type: 'opening' })}
                                className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${activeField.type === 'opening' ? 'border-[#5D5FEF] bg-indigo-50/50' : 'border-gray-50 bg-white hover:border-indigo-100'}`}
                            >
                                <span className="text-[9px] font-black text-gray-800 uppercase group-hover:text-[#5D5FEF] transition-colors">Açılış Tutarı</span>
                                <span className="text-base font-black text-gray-900">₺{openingBalance}</span>
                            </div>

                            <div className="h-[1px] bg-gray-50 my-1"></div>

                            {denominations.map(d => (
                                <div
                                    key={d.key}
                                    onClick={() => setActiveField({ type: 'count', key: d.key })}
                                    className={`p-1.5 px-2 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between group ${activeField.type === 'count' && activeField.key === d.key ? 'border-[#5D5FEF] bg-indigo-50/50' : 'border-gray-50 bg-white hover:border-indigo-100'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-400 border border-gray-100 group-hover:bg-white transition-colors">Ad</div>
                                        <span className="text-[10px] font-black text-gray-500 group-hover:text-gray-700 transition-colors">{d.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-gray-800">{counts[d.key]}</span>
                                        <div className="w-[1px] h-3 bg-gray-100 group-hover:bg-indigo-100 transition-colors"></div>
                                        <span className="text-[10px] font-black text-[#54B435] w-14 text-right">₺{((parseFloat(counts[d.key]) || 0) * d.value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between px-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">NAKİT TOPLAMI</span>
                            <span className="text-lg font-black text-[#54B435]">₺{cashEntered.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Middle: Keypad & CC Section */}
                    <div className="w-full lg:w-[32%] flex flex-col gap-3 h-full overflow-hidden">
                        {/* CC Input */}
                        <div
                            onClick={() => setActiveField({ type: 'cc' })}
                            className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-0.5 justify-center shadow-sm shrink-0 ${activeField.type === 'cc' ? 'border-[#5D5FEF] bg-indigo-50/50' : 'border-gray-50 bg-white hover:border-indigo-100'}`}
                        >
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">KREDİ KARTI TOPLAMI</span>
                            <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-gray-800">₺{ccEntered}</span>
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5D5FEF] flex items-center justify-center">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Numeric Keypad */}
                        <div className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                            <div className="grid grid-cols-3 gap-2 flex-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'backspace'].map(btn => (
                                    <button
                                        key={btn}
                                        onClick={() => handleKeypadPress(btn === 'backspace' ? 'backspace' : btn.toString())}
                                        className={`rounded-lg text-lg font-black transition-all flex items-center justify-center shadow-sm active:scale-95 border border-b-2 ${btn === 'backspace' ? 'bg-red-50 text-red-500 border-red-100 border-b-red-200' : 'bg-white border-gray-50 border-b-gray-100 text-gray-700 hover:border-indigo-100 hover:text-indigo-600 hover:border-b-indigo-200'}`}
                                    >
                                        {btn === 'backspace' ? <Delete size={20} /> : btn}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => handleKeypadPress('clear')}
                                className="mt-2 w-full py-2 rounded-xl bg-gray-50 border border-b-2 border-gray-100 border-b-gray-200 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-100 hover:border-gray-200 hover:text-gray-600 transition-all active:translate-y-0.5 active:border-b-0"
                            >
                                Temizle
                            </button>
                        </div>
                    </div>

                    {/* Right: Summary & Expenses Section */}
                    <div className="w-full lg:w-[40%] flex flex-col gap-3 h-full overflow-hidden">
                        {/* Status Cards */}
                        <div className="grid grid-cols-2 gap-2 shrink-0">
                            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-10 h-10 bg-emerald-50 rounded-bl-full -mr-2 -mt-2 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="relative">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">GİRİLEN TOPLAM</p>
                                    <h4 className="text-sm font-black text-gray-800">₺{totalEntered.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h4>
                                </div>
                            </div>
                            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-50 rounded-bl-full -mr-2 -mt-2 group-hover:scale-150 transition-transform duration-700"></div>
                                <div className="relative">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">SİSTEM TOPLAMI</p>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-sm font-black text-gray-800">₺{totalSystem.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h4>
                                        {fetchingData && <RefreshCw className="animate-spin text-indigo-400" size={12} />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Difference Alert */}
                        <div className={`p-3 rounded-2xl border-2 shadow-sm relative overflow-hidden group transition-all duration-500 shrink-0 ${difference >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${difference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>KASA FARKI</p>
                                    <h4 className={`text-xl font-black ${difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {difference > 0 ? '+' : ''}{difference.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </h4>
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${difference >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {difference >= 0 ? <RefreshCw size={20} /> : <X size={20} />}
                                </div>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border shadow-sm ${difference === 0 ? 'bg-emerald-600 text-white' : difference > 0 ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-white border-red-200 text-red-600'}`}>
                                    {difference === 0 ? 'KASA EŞİT' : difference > 0 ? 'KASA FAZLASI' : 'KASA EKSİĞİ'}
                                </span>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div className="flex-1 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                            <h3 className="text-[9px] font-black text-gray-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <DollarSign className="text-red-500" size={14} />
                                Giderler
                            </h3>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-2 space-y-1.5">
                                {expenses.map((exp, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group hover:border-red-100 transition-all">
                                        <div>
                                            <div className="text-[10px] font-black text-gray-800">{exp.description}</div>
                                            <div className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">₺{exp.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                        <button
                                            onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))}
                                            className="w-7 h-7 rounded-md bg-white text-gray-400 hover:text-red-500 hover:shadow-md transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 border border-gray-50"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2 mt-auto pt-2 border-t border-gray-50">
                                <div className="flex gap-2">
                                    <div
                                        onClick={() => setActiveField({ type: 'expense' })}
                                        className={`w-[80px] p-2 rounded-lg border-2 transition-all cursor-pointer flex flex-col group ${activeField.type === 'expense' ? 'border-[#5D5FEF] bg-indigo-50/50' : 'border-gray-50 bg-gray-50 hover:border-indigo-100'}`}
                                    >
                                        <span className="text-[7px] font-black text-gray-400 uppercase group-hover:text-indigo-400 transition-colors">Tutar</span>
                                        <span className="text-sm font-black text-gray-800">₺{expenseAmount}</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Açıklama..."
                                        className="flex-1 p-2 rounded-lg bg-gray-50 border border-gray-100 outline-none focus:border-indigo-200 text-[10px] font-black text-gray-700 placeholder:text-gray-300 shadow-inner"
                                        value={expenseDescription}
                                        onChange={(e) => setExpenseDescription(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleAddExpense}
                                    className="w-full py-2.5 rounded-lg bg-[#14B8A6] text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-teal-50 hover:bg-[#0D9488] transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Plus size={14} />
                                    Gider Ekle
                                </button>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-[#5D5FEF] text-white font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-indigo-100 hover:bg-[#4B4DDF] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 border-b-2 border-[#4B4DDF] shrink-0"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                            Kaydet ve Kapat
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default RegisterClosings;
