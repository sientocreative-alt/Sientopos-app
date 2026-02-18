import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, FileText, Archive, X, Trash2, RotateCcw, CheckCircle } from 'lucide-react';

const Tasks = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [taskTypeFilter, setTaskTypeFilter] = useState('');
    const [recurrenceFilter, setRecurrenceFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');

    // Modal states
    const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
    const [quickTaskTitle, setQuickTaskTitle] = useState('');
    const [quickTaskDescription, setQuickTaskDescription] = useState('');
    const [descriptionRequired, setDescriptionRequired] = useState(false);
    const [imageRequired, setImageRequired] = useState(false);

    useEffect(() => {
        if (user) {
            fetchTasks();
        }
    }, [user, statusFilter]);

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('business_id', user.business_id)
            .eq('status', statusFilter)
            .order('created_at', { ascending: false });

        if (data) setTasks(data);
        setLoading(false);
    };

    const handleQuickTaskSubmit = async () => {
        if (!quickTaskTitle.trim()) {
            alert('Lütfen başlık girin');
            return;
        }

        try {
            const { error } = await supabase
                .from('tasks')
                .insert([{
                    business_id: user.business_id,
                    task_title: quickTaskTitle,
                    task_description: quickTaskDescription,
                    priority: 'Acil',
                    task_type: 'Bireysel',
                    recurrence_type: 'Tek Seferlik',
                    status: 'active'
                }]);

            if (error) throw error;

            // Reset form and close modal
            setQuickTaskTitle('');
            setQuickTaskDescription('');
            setDescriptionRequired(false);
            setImageRequired(false);
            setShowQuickTaskModal(false);

            // Refresh tasks
            fetchTasks();
        } catch (error) {
            console.error('Error creating quick task:', error);
            alert('Görev oluşturulurken hata oluştu');
        }
    };

    const handleCompleteTask = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('İşlem sırasında bir hata oluştu');
        }
    };

    const handleArchiveTask = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'archived' : 'active';
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error('Error archiving task:', error);
            alert('İşlem sırasında bir hata oluştu');
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Görev silinirken bir hata oluştu');
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.task_title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !taskTypeFilter || task.task_type === taskTypeFilter;
        const matchesRecurrence = !recurrenceFilter || task.recurrence_type === recurrenceFilter;
        return matchesSearch && matchesType && matchesRecurrence;
    });

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Görevler</h1>
                        <nav className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                            <span>•</span>
                            <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                            <span>•</span>
                            <span className="text-gray-600 font-medium">Görevler</span>
                        </nav>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowQuickTaskModal(true)}
                            className="bg-pink-200 text-pink-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-pink-300 transition-all shadow-sm"
                        >
                            Yeni Acil Görev
                        </button>
                        <button
                            onClick={() => navigate('/isletme/gorevler/raporlar')}
                            className="bg-purple-200 text-purple-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-300 transition-all shadow-sm"
                        >
                            Genel Görev Raporu
                        </button>
                        <button
                            onClick={() => navigate('/isletme/gorevler/yeni')}
                            className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-md"
                        >
                            Yeni Görev
                        </button>
                        <button
                            onClick={() => setStatusFilter(statusFilter === 'active' ? 'archived' : 'active')}
                            className={`${statusFilter === 'archived' ? 'bg-yellow-500 text-white' : 'bg-yellow-200 text-yellow-800'} px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-80 transition-all shadow-sm`}
                        >
                            {statusFilter === 'archived' ? 'Aktif Görevler' : 'Arşiv'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search Bar - Separate Section */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Ara"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    <button className="bg-gray-100 text-gray-600 p-2.5 rounded-lg hover:bg-gray-200 transition-all">
                        <Search size={18} />
                    </button>
                </div>
            </div>

            {/* Task List Section */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                {/* Header with Filters */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Görev Listesi</h2>
                        <span className="bg-[#9C27B0] text-white text-xs font-bold px-3 py-1 rounded-full">
                            {filteredTasks.length}
                        </span>
                    </div>

                    {/* Filters Row */}
                    <div className="flex gap-3 items-center">
                        {/* Ürün Adı Input */}
                        <input
                            type="text"
                            placeholder="Ürün Adı"
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                        />

                        {/* Task Type Filter */}
                        <select
                            value={taskTypeFilter}
                            onChange={(e) => setTaskTypeFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white flex-1 text-gray-800"
                        >
                            <option value="" disabled selected hidden>Seçiniz</option>
                            <option value="Ekip Görevi" className="text-gray-800">Ekip Görevi</option>
                            <option value="Bireysel" className="text-gray-800">Bireysel</option>
                            <option value="Rol tabanlı" className="text-gray-800">Rol tabanlı</option>
                        </select>

                        {/* Recurrence Filter */}
                        <select
                            value={recurrenceFilter}
                            onChange={(e) => setRecurrenceFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white flex-1 text-gray-800"
                        >
                            <option value="" disabled selected hidden>Seçiniz</option>
                            <option value="Tek Seferlik" className="text-gray-800">Tek Seferlik</option>
                            <option value="Her Gün" className="text-gray-800">Her Gün</option>
                            <option value="Haftanın Belirli Günleri" className="text-gray-800">Haftanın Belirli Günleri</option>
                            <option value="Ayın Belirli Günleri" className="text-gray-800">Ayın Belirli Günleri</option>
                            <option value="Günlük Çoklu Görevler" className="text-gray-800">Günlük Çoklu Görevler</option>
                        </select>

                        {/* Search Button */}
                        <button className="bg-gray-100 text-gray-600 p-2.5 rounded-lg hover:bg-gray-200 transition-all">
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                {/* Task List Content */}
                {loading ? (
                    <div className="p-10 text-center text-gray-400 italic">
                        Yükleniyor...
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 italic">
                        Henüz görev tanımlanmamış.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">BAŞLIK</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">TÜR</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">TEKRAR</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ÖNCELİK</th>
                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">İŞLEMLER</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task) => (
                                <tr key={task.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all">
                                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{task.task_title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{task.task_type}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{task.recurrence_type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${task.priority === 'Acil'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 text-gray-800">
                                            <button
                                                onClick={() => handleCompleteTask(task.id, task.status)}
                                                className={`p-1.5 rounded-lg transition-all ${task.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                                title={task.status === 'completed' ? 'Tamamlandı olarak işaretlendi' : 'Tamamla'}
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/isletme/gorevler/duzenle/${task.id}`)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Düzenle"
                                            >
                                                <Plus size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleArchiveTask(task.id, task.status)}
                                                className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                                                title={task.status === 'active' ? 'Arşivle' : 'Geri Yükle'}
                                            >
                                                {task.status === 'active' ? <Archive size={18} /> : <RotateCcw size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Sil"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Quick Task Modal */}
            {showQuickTaskModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[24px] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Görev Ekle</h2>
                            <button
                                onClick={() => setShowQuickTaskModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Başlık */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    * Başlık
                                </label>
                                <input
                                    type="text"
                                    value={quickTaskTitle}
                                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800"
                                    placeholder="Görev başlığı girin"
                                />
                            </div>

                            {/* Açıklama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Açıklama
                                </label>
                                <textarea
                                    value={quickTaskDescription}
                                    onChange={(e) => setQuickTaskDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none text-gray-800"
                                    placeholder="Görev açıklaması girin"
                                />
                            </div>

                            {/* Toggle Switches */}
                            <div className="space-y-4">
                                {/* Açıklama eklenmesi zorunlu */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Açıklama eklenmesi zorunlu</span>
                                    <button
                                        onClick={() => setDescriptionRequired(!descriptionRequired)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${descriptionRequired ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${descriptionRequired ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Resim eklenmesi zorunlu */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Resim eklenmesi zorunlu</span>
                                    <button
                                        onClick={() => setImageRequired(!imageRequired)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${imageRequired ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${imageRequired ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowQuickTaskModal(false)}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleQuickTaskSubmit}
                                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-all"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
