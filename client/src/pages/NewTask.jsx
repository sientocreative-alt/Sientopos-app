import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const NewTask = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEdit = !!id;
    const priorityParam = searchParams.get('priority');

    const [formData, setFormData] = useState({
        task_title: '',
        task_description: '',
        task_type: 'Tek Seferlik',
        atama_tipi: 'Ekip Görevi',
        due_date: '',
        priority: priorityParam || 'Normal',
        desc_mandatory: false,
        img_mandatory: false,
        urgent_notify: false
    });

    useEffect(() => {
        if (isEdit && user) {
            fetchTask();
        }
    }, [isEdit, id, user]);

    const fetchTask = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setFormData({
                task_title: data.task_title || '',
                task_description: data.task_description || '',
                task_type: data.recurrence_type || 'Tek Seferlik',
                atama_tipi: data.task_type || 'Ekip Görevi',
                due_date: data.due_date ? data.due_date.split('T')[0] : '',
                priority: data.priority || 'Normal',
                desc_mandatory: data.desc_mandatory || false,
                img_mandatory: data.img_mandatory || false,
                urgent_notify: data.urgent_notify || false
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const taskData = {
            task_title: formData.task_title,
            task_description: formData.task_description,
            task_type: formData.atama_tipi,
            recurrence_type: formData.task_type,
            priority: formData.urgent_notify ? 'Acil' : formData.priority,
            business_id: user.business_id,
            due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
            desc_mandatory: formData.desc_mandatory,
            img_mandatory: formData.img_mandatory,
            urgent_notify: formData.urgent_notify
        };

        if (isEdit) {
            const { error } = await supabase
                .from('tasks')
                .update(taskData)
                .eq('id', id);

            if (!error) {
                navigate('/isletme/gorevler');
            }
        } else {
            const { error } = await supabase
                .from('tasks')
                .insert([taskData]);

            if (!error) {
                navigate('/isletme/gorevler');
            }
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-800">Yeni</h1>
                    <nav className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Pano</span>
                        <span>•</span>
                        <span className="hover:text-gray-600 transition-all cursor-pointer">Personel Yönetimi</span>
                        <span>•</span>
                        <span className="hover:text-gray-600 transition-all cursor-pointer" onClick={() => navigate('/isletme/gorevler')}>Görevler</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">Yeni</span>
                    </nav>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-10">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">Görev Ekle</h2>
                <hr className="mb-10 text-gray-100" />

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Left Column */}
                        <div className="space-y-8">
                            {/* Başlık */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    .* Başlık
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.task_title}
                                    onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-800"
                                />
                            </div>

                            {/* Açıklama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Açıklama
                                </label>
                                <textarea
                                    value={formData.task_description}
                                    onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm resize-none text-gray-800"
                                    rows="4"
                                />
                            </div>

                            {/* Toggles */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 font-medium">Açıklama eklenmesi zorunlu</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, desc_mandatory: !formData.desc_mandatory })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.desc_mandatory ? 'bg-[#2196F3]' : 'bg-[#E0E0E0]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.desc_mandatory ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 font-medium">Resim eklenmesi zorunlu</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, img_mandatory: !formData.img_mandatory })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.img_mandatory ? 'bg-[#2196F3]' : 'bg-[#E0E0E0]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.img_mandatory ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 font-medium">Acil bildirim</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, urgent_notify: !formData.urgent_notify })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.urgent_notify ? 'bg-[#2196F3]' : 'bg-[#E0E0E0]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.urgent_notify ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Görev Tipi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    .* Görev Tipi
                                </label>
                                <select
                                    required
                                    value={formData.task_type}
                                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none text-gray-800"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                                >
                                    <option value="Tek Seferlik">Tek Seferlik</option>
                                    <option value="Her Gün">Her Gün</option>
                                    <option value="Haftanın Belirli Günleri">Haftanın Belirli Günleri</option>
                                    <option value="Ayın Belirli Günleri">Ayın Belirli Günleri</option>
                                    <option value="Günlük Çoklu Görevler">Günlük Çoklu Görevler</option>
                                </select>
                            </div>

                            {/* Tarih / Saat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Tarih / Saat
                                </label>
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-800"
                                />
                            </div>

                            {/* Atama Tipi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    .* Atama Tipi
                                </label>
                                <select
                                    required
                                    value={formData.atama_tipi}
                                    onChange={(e) => setFormData({ ...formData, atama_tipi: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm appearance-none text-gray-800"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.25rem' }}
                                >
                                    <option value="Ekip Görevi">Ekip Görevi</option>
                                    <option value="Bireysel">Bireysel</option>
                                    <option value="Rol tabanlı">Rol tabanlı</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end mt-12 pt-8 border-t border-gray-50">
                        <button
                            type="button"
                            onClick={() => navigate('/isletme/gorevler')}
                            className="px-10 py-3 bg-[#E0E4EC] text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-all"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className="px-10 py-3 bg-[#2196F3] text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95"
                        >
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewTask;
