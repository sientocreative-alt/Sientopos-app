import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    X,
    Calculator,
    Save,
    Plus,
    Trash2,
    DollarSign,
    Calendar,
    RefreshCw,
    Delete
} from 'lucide-react';

const CashClosureModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
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
        if (isOpen && user) {
            fetchSystemTotals();
        }
    }, [isOpen, user, date]);

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

            onSuccess?.();
            onClose();
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-[#f8fafc] w-full max-w-5xl h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-[#5D5FEF] shadow-sm">
                            <Calculator size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Kasa Kapanışı</h2>
                            <p className="text-gray-400 font-bold text-xs">Günlük hesap özeti ve para sayımı</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 gap-2">
                            <Calendar size={18} className="text-[#5D5FEF]" />
                            <input
                                type="date"
                                className="bg-transparent border-none outline-none font-black text-gray-700 text-base"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="w-11 h-11 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex gap-0">
                    {/* Left: Denominations Section */}
                    <div className="w-1/3 overflow-y-auto p-8 border-r border-gray-100 bg-white/50 custom-scrollbar">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            BANKNOT & BOZUK PARA
                        </h3>

                        <div className="space-y-3">
                            {/* Opening Balance Field */}
                            <div
                                onClick={() => setActiveField({ type: 'opening' })}
                                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between ${activeField.type === 'opening' ? 'border-[#5D5FEF] bg-indigo-50' : 'border-gray-50 bg-white'}`}
                            >
                                <span className="text-xs font-black text-gray-800 uppercase">Açılış Tutarı</span>
                                <span className="text-xl font-black text-gray-900">₺{openingBalance}</span>
                            </div>

                            {denominations.map(d => (
                                <div
                                    key={d.key}
                                    onClick={() => setActiveField({ type: 'count', key: d.key })}
                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${activeField.type === 'count' && activeField.key === d.key ? 'border-[#5D5FEF] bg-indigo-50' : 'border-gray-50 bg-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 border border-gray-100">Ad</div>
                                        <span className="text-sm font-black text-gray-500">{d.label}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-lg font-black text-gray-800">{counts[d.key]}</span>
                                        <div className="w-[1px] h-6 bg-gray-100"></div>
                                        <span className="text-sm font-black text-[#54B435]">₺{(parseFloat(counts[d.key]) || 0) * d.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Keypad & CC Section */}
                    <div className="w-1/3 p-6 flex flex-col bg-white border-r border-gray-100">
                        {/* CC Input */}
                        <div
                            onClick={() => setActiveField({ type: 'cc' })}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer mb-6 flex flex-col gap-1 ${activeField.type === 'cc' ? 'border-[#5D5FEF] bg-indigo-50' : 'border-gray-50 bg-[#F8FAFC]'}`}
                        >
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">KREDİ KARTI TOPLAMI</span>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-gray-800">₺{ccEntered}</span>
                                <DollarSign className="text-indigo-200" size={24} />
                            </div>
                        </div>

                        {/* Numeric Keypad */}
                        <div className="flex-1 grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'backspace'].map(btn => (
                                <button
                                    key={btn}
                                    onClick={() => handleKeypadPress(btn === 'backspace' ? 'backspace' : btn.toString())}
                                    className={`h-full rounded-2xl text-xl font-black transition-all flex items-center justify-center shadow-sm active:scale-95 ${btn === 'backspace' ? 'bg-red-50 text-red-500 border-2 border-red-100' : 'bg-white border-2 border-gray-50 text-gray-700 hover:border-indigo-100 hover:text-indigo-600'}`}
                                >
                                    {btn === 'backspace' ? <Delete size={24} /> : btn}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => handleKeypadPress('clear')}
                            className="mt-3 w-full py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-100 transition-all"
                        >
                            Temizle
                        </button>
                    </div>

                    {/* Right: Summary & Expenses Section */}
                    <div className="w-1/3 flex flex-col bg-[#f8fafc]">
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {/* Visual Comparison */}
                            <div className="space-y-4 mb-6">
                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-6 -mt-6"></div>
                                    <div className="relative">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Hesaplanan (Nakit + KK)</p>
                                        <h4 className="text-2xl font-black text-gray-800">₺{totalEntered.toFixed(2)}</h4>
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-full -mr-6 -mt-6"></div>
                                    <div className="relative">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Sistem Toplamı</p>
                                        <h4 className="text-2xl font-black text-gray-800">₺{totalSystem.toFixed(2)}</h4>
                                        {fetchingData && <RefreshCw className="animate-spin text-indigo-400 mt-2" size={14} />}
                                    </div>
                                </div>

                                <div className={`p-6 rounded-2xl border-2 shadow-sm relative overflow-hidden group ${difference >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${difference >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Kasa Farkı</p>
                                    <h4 className={`text-3xl font-black ${difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {difference > 0 ? '+' : ''}{difference.toFixed(2)} ₺
                                    </h4>
                                    <div className="mt-3 inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white shadow-sm border border-current opacity-70">
                                        {difference === 0 ? 'KASA EŞİT' : difference > 0 ? 'KASA FAZLASI' : 'KASA EKSİĞİ'}
                                    </div>
                                </div>
                            </div>

                            {/* Expenses Section */}
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
                                <h3 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <DollarSign className="text-red-500" size={16} />
                                    Giderler
                                </h3>

                                <div className="space-y-2 mb-4">
                                    {expenses.map((exp, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 group">
                                            <div>
                                                <div className="text-xs font-black text-gray-800">{exp.description}</div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase">₺{exp.amount}</div>
                                            </div>
                                            <button
                                                onClick={() => setExpenses(expenses.filter((_, i) => i !== idx))}
                                                className="w-8 h-8 rounded-lg bg-white text-gray-400 hover:text-red-500 hover:shadow-md transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div
                                            onClick={() => setActiveField({ type: 'expense' })}
                                            className={`w-1/3 p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col ${activeField.type === 'expense' ? 'border-[#5D5FEF] bg-indigo-50' : 'border-gray-50 bg-gray-50/50'}`}
                                        >
                                            <span className="text-[8px] font-black text-gray-400 uppercase">Tutar</span>
                                            <span className="text-base font-black text-gray-800">₺{expenseAmount}</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Açıklama..."
                                            className="flex-1 pt-4 pb-4 px-3 rounded-xl bg-gray-50 border-2 border-gray-50 outline-none focus:border-indigo-100 text-[13px] font-black text-gray-700"
                                            value={expenseDescription}
                                            onChange={(e) => setExpenseDescription(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddExpense}
                                        className="w-full py-3 rounded-xl bg-[#14B8A6] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-teal-100 hover:bg-[#0D9488] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Gider Ekle
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-[#5D5FEF] text-white font-black text-base uppercase tracking-[0.1em] shadow-xl shadow-indigo-100 hover:bg-[#4B4DDF] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                Kasa Kapanışını Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles for Scrollbar */}
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

export default CashClosureModal;
