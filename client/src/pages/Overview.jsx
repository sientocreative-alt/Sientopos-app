import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import TrialCountdown from '../components/TrialCountdown';
import {
    LayoutGrid,
    Clock,
    ArrowUpRight,
    Users,
    ChevronDown,
    FileText,
    ArrowDownLeft,
    ArrowUpRight as ArrowUpRightIcon,
    Wallet
} from 'lucide-react';
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const Overview = () => {
    const { user } = useAuth();
    const [statsData, setStatsData] = useState({
        dailyTotal: 0,
        weeklyTotal: 0,
        monthlyTotal: 0,
        chartData: []
    });
    const [selectedFilter, setSelectedFilter] = useState('Günlük'); // 'Günlük', 'Haftalık', 'Aylık'
    const [todaysShifts, setTodaysShifts] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [invoiceFilter, setInvoiceFilter] = useState('Tüm Faturalar');
    const [isInvoiceMenuOpen, setIsInvoiceMenuOpen] = useState(false);
    const [invoicesLoading, setInvoicesLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            fetchStatistics(selectedFilter);
            fetchTodaysShifts();
            fetchTasks();
            fetchRecentInvoices();
        }
    }, [user, selectedFilter, invoiceFilter]);

    const fetchRecentInvoices = async () => {
        try {
            setInvoicesLoading(true);
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            const bId = profile?.business_id || user?.business_id;
            if (!bId) return;

            let query = supabase
                .from('invoices')
                .select(`
                    id, 
                    invoice_no, 
                    invoice_type, 
                    total_amount, 
                    issue_date,
                    customer_businesses(name),
                    suppliers(company_name)
                `)
                .eq('business_id', bId)
                .is('is_deleted', false)
                .order('issue_date', { ascending: false })
                .limit(5);

            if (invoiceFilter === 'Ödemeler') {
                query = query.eq('invoice_type', 'Ödeme');
            } else if (invoiceFilter === 'Alış Faturaları') {
                query = query.eq('invoice_type', 'Gider Faturası');
            } else if (invoiceFilter === 'Satış Faturaları') {
                query = query.eq('invoice_type', 'Gelir Faturası');
            }

            const { data, error } = await query;
            if (error) throw error;
            setRecentInvoices(data || []);
        } catch (error) {
            console.error('Error fetching recent invoices:', error);
        } finally {
            setInvoicesLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            if (!user?.id) return;

            // Get business_id from profiles explicitly
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            const bId = profile?.business_id || user?.business_id;
            if (!bId) return;

            const { data, error } = await supabase
                .from('tasks')
                .select('id, task_title, priority, status')
                .eq('business_id', bId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setTasks(data || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const fetchTodaysShifts = async () => {
        try {
            if (!user?.id) return;

            // Get business_id from profiles explicitly to ensure we have the right one
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            const bId = profile?.business_id || user?.business_id;
            if (!bId) {
                console.error("Overview: No business_id found");
                return;
            }

            const now = new Date();
            const shiftedNow = new Date(now.getTime() - (1 * 60 * 60 * 1000));
            const todayStr = shiftedNow.toLocaleDateString('en-CA'); // YYYY-MM-DD local (Day flips at 01:00 AM)

            // 1. Fetch Staff (Direct and simple)
            const { data: staffData, error: stErr } = await supabase
                .from('staff')
                .select('*')
                .eq('business_id', bId);

            if (stErr) throw stErr;

            // 2. Fetch Shifts for Today ONLY
            const { data: shiftsData, error: shErr } = await supabase
                .from('staff_shifts')
                .select('*')
                .eq('business_id', bId)
                .eq('date', todayStr);

            if (shErr) throw shErr;

            if (staffData && shiftsData) {
                const formatted = shiftsData.map(s => {
                    const member = staffData.find(m => String(m.id) === String(s.staff_id));
                    return {
                        ...member,
                        shift: s
                    };
                }).filter(item => item.id); // Only keep staff we found

                // Sort by start time
                formatted.sort((a, b) => (a.shift?.start_time || '').localeCompare(b.shift?.start_time || ''));

                setTodaysShifts(formatted);
            }
        } catch (error) {
            console.error('Overview error fetching shifts:', error);
        }
    };

    const fetchStatistics = async (filterType) => {
        try {
            if (!user?.id) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            const bId = profile?.business_id || user?.business_id;
            if (!bId) return;

            const now = new Date();
            const startOfSixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            const startDateStr = startOfSixMonthsAgo.toISOString();

            // SOURCE OF TRUTH: FETCH FROM PAYMENTS INSTEAD OF ORDER_ITEMS
            const { data: paymentsData, error } = await supabase
                .from('payments')
                .select('amount, payment_method, created_at')
                .eq('business_id', bId)
                .gte('created_at', startDateStr)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (!paymentsData) return;

            let daily = 0;
            let weekly = 0;
            let monthly = 0;

            const shiftedNow = new Date(now.getTime() - (1 * 60 * 60 * 1000));
            const todayStr = shiftedNow.toLocaleDateString('en-CA');
            const currentMonthStr = `${shiftedNow.getFullYear()}-${String(shiftedNow.getMonth() + 1).padStart(2, '0')}`;

            const startOfWeek = new Date(shiftedNow);
            const dayOfWeek = startOfWeek.getDay() || 7;
            startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek - 1));
            startOfWeek.setHours(0, 0, 0, 0);

            let chartMap = {};
            let chartLabels = [];

            if (filterType === 'Günlük') {
                for (let i = 0; i < 24; i++) chartMap[i] = 0;
                chartLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            } else if (filterType === 'Haftalık') {
                const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                days.forEach(d => chartMap[d] = 0);
                chartLabels = days;
            } else {
                const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const mName = monthNames[d.getMonth()];
                    chartMap[mName] = 0;
                    chartLabels.push(mName);
                }
                chartLabels = [...new Set(chartLabels)];
            }

            paymentsData.forEach(p => {
                const pDate = new Date(p.created_at);
                const shiftedPDate = new Date(pDate.getTime() - (1 * 60 * 60 * 1000));
                const pDateStr = shiftedPDate.toLocaleDateString('en-CA');
                const pMonthStr = `${shiftedPDate.getFullYear()}-${String(shiftedPDate.getMonth() + 1).padStart(2, '0')}`;
                const pTotal = parseFloat(p.amount || 0);

                if (pDateStr === todayStr) daily += pTotal;
                if (shiftedPDate >= startOfWeek) weekly += pTotal;
                if (pMonthStr === currentMonthStr) monthly += pTotal;

                if (filterType === 'Günlük' && pDateStr === todayStr) {
                    const h = pDate.getHours();
                    if (chartMap[h] !== undefined) chartMap[h] += pTotal;
                } else if (filterType === 'Haftalık' && shiftedPDate >= startOfWeek) {
                    const daysArr = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
                    let dIndex = shiftedPDate.getDay() - 1;
                    if (dIndex === -1) dIndex = 6;
                    const dName = daysArr[dIndex];
                    if (chartMap[dName] !== undefined) chartMap[dName] += pTotal;
                } else if (filterType === 'Aylık' && shiftedPDate >= startOfSixMonthsAgo) {
                    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
                    const mName = monthNames[shiftedPDate.getMonth()];
                    if (chartMap[mName] !== undefined) chartMap[mName] += pTotal;
                }
            });

            const finalChartData = chartLabels.map((label, idx) => ({
                name: label,
                ciro: filterType === 'Günlük' ? chartMap[idx] : chartMap[label]
            }));

            setStatsData({
                dailyTotal: daily,
                weeklyTotal: weekly,
                monthlyTotal: monthly,
                chartData: finalChartData
            });
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Pano</h1>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 mt-1">
                            <span>Pano</span>
                            <span>•</span>
                            <span className="text-gray-300">Genel Bakış</span>
                        </div>
                    </div>
                </div>

                {/* Trial Countdown Section */}
                {(user?.subscription_plan === 'trial' || user?.subscription_plan === 'deneme') && user?.trial_end_date && (
                    <TrialCountdown endDate={user.trial_end_date} />
                )}

                {/* Summary Cards - Ciro (Turnover) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-1">Günlük Ciro</p>
                            <h3 className="text-2xl font-black text-gray-800">
                                ₺{statsData.dailyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <div className="mt-3 flex items-center text-emerald-500 font-bold text-xs bg-emerald-50 w-fit px-2.5 py-1 rounded-full">
                                <ArrowUpRight size={14} className="mr-1" />
                                <span>Bugün</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-1">Haftalık Ciro</p>
                            <h3 className="text-2xl font-black text-gray-800">
                                ₺{statsData.weeklyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <div className="mt-3 flex items-center text-orange-500 font-bold text-xs bg-orange-50 w-fit px-2.5 py-1 rounded-full">
                                <Clock size={14} className="mr-1" />
                                <span>Bu Hafta</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[80px] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <p className="text-gray-400 font-bold text-[11px] uppercase tracking-wider mb-1">Aylık Ciro</p>
                            <h3 className="text-2xl font-black text-gray-800">
                                ₺{statsData.monthlyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <div className="mt-3 flex items-center text-blue-500 font-bold text-xs bg-blue-50 w-fit px-2.5 py-1 rounded-full">
                                <LayoutGrid size={14} className="mr-1" />
                                <span>Bu Ay</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Middle Section: Chart & Todos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Charts & Graphs */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Ciro Analizi</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {['Günlük', 'Haftalık', 'Aylık'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setSelectedFilter(f)}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${selectedFilter === f
                                            ? 'bg-white text-[#5D5FEF] shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[390px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsBarChart data={statsData.chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                        dy={10}
                                        interval={0}
                                        hide={selectedFilter === 'Günlük'}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                                        itemStyle={{ color: '#5D5FEF', fontWeight: 'bold', fontSize: '12px' }}
                                        formatter={(value) => [`₺${value.toLocaleString('tr-TR')}`, 'Ciro']}
                                        labelStyle={{ fontWeight: 'bold', color: '#1a1a1a', marginBottom: '4px', fontSize: '12px' }}
                                    />
                                    <Bar
                                        dataKey="ciro"
                                        fill="#5D5FEF"
                                        radius={[4, 4, 4, 4]}
                                        barSize={selectedFilter === 'Günlük' ? 12 : 24}
                                        activeBar={{ fill: '#4B4DDF' }}
                                    />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Tasks / Todos */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800">Günlük Yapılacaklar</h2>
                            <span className="text-gray-400 text-sm flex items-center gap-1"><Clock size={14} /> Bugün ▼</span>
                        </div>

                        {tasks.length > 0 ? (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                {tasks.map((task) => (
                                    <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start justify-between group hover:bg-white hover:shadow-sm transition-all">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <div className={`w-2 h-2 rounded-full ${task.priority === 'Acil' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 line-clamp-1">{task.task_title}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center flex-1 text-gray-300 font-medium h-40">
                                Yapılacak görev yok
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Shifts & Invoices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Günlük Mesailer */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px]">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800">Günlük Mesailer</h2>
                        <span className="text-gray-400 text-[13px] font-bold flex items-center gap-1 uppercase tracking-wider"><Clock size={14} className="text-gray-400" /> Bugün ▼</span>
                    </div>

                    {todaysShifts.length > 0 ? (
                        <div className="space-y-3">
                            {todaysShifts.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold italic">
                                            {item.first_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">
                                                {item.first_name} {item.last_name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">{item.role || 'Staff'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded border border-gray-200 shadow-sm">
                                            {item.shift?.start_time?.substring(0, 5)} - {item.shift?.end_time?.substring(0, 5)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-300 italic">
                            Mesai kaydı bulunamadı
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center mb-6 relative">
                        <h2 className="text-lg font-bold text-gray-800">Son Faturalar</h2>
                        <button
                            onClick={() => setIsInvoiceMenuOpen(!isInvoiceMenuOpen)}
                            className="text-gray-400 text-[13px] font-bold flex items-center gap-1 uppercase tracking-wider hover:text-gray-600 transition-colors"
                        >
                            {invoiceFilter} <ChevronDown size={14} className={`transition-transform duration-200 ${isInvoiceMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isInvoiceMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                {['Tüm Faturalar', 'Ödemeler', 'Alış Faturaları', 'Satış Faturaları'].map((label) => (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setInvoiceFilter(label);
                                            setIsInvoiceMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition-colors ${invoiceFilter === label ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {invoicesLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Yükleniyor</span>
                        </div>
                    ) : recentInvoices.length > 0 ? (
                        <div className="flex-1 space-y-3">
                            {recentInvoices.map((inv) => (
                                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${inv.invoice_type === 'Ödeme' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                                            inv.invoice_type === 'Gider Faturası' ? 'bg-rose-50 text-rose-600 group-hover:bg-rose-100' :
                                                'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                                            }`}>
                                            {inv.invoice_type === 'Ödeme' ? <Wallet size={18} /> :
                                                inv.invoice_type === 'Gider Faturası' ? <ArrowDownLeft size={18} /> :
                                                    <ArrowUpRightIcon size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-800 tracking-tight">
                                                {inv.customer_businesses?.name || inv.suppliers?.company_name || inv.invoice_no || 'Fatura'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                {format(new Date(inv.issue_date), 'dd/MM/yyyy')} • {inv.invoice_type}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${inv.invoice_type === 'Gider Faturası' || inv.invoice_type === 'Ödeme' ? 'text-rose-600' : 'text-emerald-600'
                                            }`}>
                                            {inv.invoice_type === 'Gider Faturası' || inv.invoice_type === 'Ödeme' ? '-' : '+'}
                                            ₺{parseFloat(inv.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">
                                            Tamamlandı
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 italic py-10">
                            <FileText size={40} className="opacity-20 mb-2" />
                            <p className="font-bold uppercase tracking-widest text-[11px]">Henüz fatura bulunmuyor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Overview;
