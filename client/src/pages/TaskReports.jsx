import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const TaskReports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState('');
    const [showFilters, setShowFilters] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchReportData();
        }
    }, [user]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            // Calculate date for 28 days ago
            const twentyEightDaysAgo = new Date();
            twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('business_id', user.business_id)
                .gte('created_at', twentyEightDaysAgo.toISOString());

            if (error) throw error;

            // Process data for 4 weeks
            const weeks = [
                { name: 'Hafta 1', start: 28, end: 22, value: 0 },
                { name: 'Hafta 2', start: 21, end: 15, value: 0 },
                { name: 'Hafta 3', start: 14, end: 8, value: 0 },
                { name: 'Hafta 4', start: 7, end: 0, value: 0 }
            ];

            const now = new Date();
            const processedData = weeks.map(week => {
                const startDate = new Date(now);
                startDate.setDate(now.getDate() - week.start);
                startDate.setHours(0, 0, 0, 0);

                const endDate = new Date(now);
                endDate.setDate(now.getDate() - week.end);
                endDate.setHours(23, 59, 59, 999);

                const weekTasks = tasks.filter(task => {
                    const taskDate = new Date(task.created_at);
                    return taskDate >= startDate && taskDate <= endDate;
                });

                if (weekTasks.length === 0) return { name: week.name, value: 0 };

                const completedTasks = weekTasks.filter(t => t.status === 'completed').length;
                const successRate = Math.round((completedTasks / weekTasks.length) * 100);

                return { name: week.name, value: successRate };
            });

            setChartData(processedData);

            // Set initial date range text
            const startStr = twentyEightDaysAgo.toLocaleDateString('tr-TR');
            const endStr = now.toLocaleDateString('tr-TR');
            setDateRange(`${startStr} - ${endStr}`);

        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Görev Raporları</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Görevler</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Görev Raporları</span>
                        </nav>
                    </div>
                    <button
                        onClick={() => navigate('/isletme/gorevler')}
                        className="bg-purple-200 text-purple-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-300 transition-all shadow-sm"
                    >
                        Görevler Sayfasına Dön
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 mb-6">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Filtreler</h2>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="text-gray-400 hover:text-gray-600 transition-all"
                        >
                            <ChevronUp
                                size={20}
                                className={`transform transition-transform ${showFilters ? '' : 'rotate-180'}`}
                            />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tarih Aralığı
                                </label>
                                <input
                                    type="text"
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                                    placeholder="21/11/2024 - 05/02/2026"
                                />
                            </div>
                            <button className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-600 transition-all flex items-center gap-2">
                                <Search size={18} />
                                Filtrele
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800 text-center w-full">Görev Başarı Oranı (%)</h2>
                    <button
                        onClick={() => fetchReportData()}
                        className="text-gray-400 hover:text-gray-600 p-2"
                        disabled={loading}
                    >
                        <svg className={`${loading ? 'animate-spin' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="h-[400px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                                domain={[0, 100]}
                                ticks={[0, 20, 40, 60, 80, 100]}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                                formatter={(value) => [`%${value}`, 'Başarı Oranı']}
                            />
                            <Bar
                                dataKey="value"
                                fill="#3B82F6"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={100}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 gap-3 border-2 border-dashed border-gray-100 rounded-xl">
                        <FileText size={48} />
                        <p>Bu tarih aralığında veri bulunamadı veya henüz görev tamamlanmadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskReports;
