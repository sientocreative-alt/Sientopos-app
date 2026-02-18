import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Search,
    Send,
    Image as ImageIcon,
    Users,
    User,
    Clock,
    X,
    ChevronDown,
    MoreHorizontal,
    Trash2,
    Eye
} from 'lucide-react';

const StaffNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // general, personal, shift
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        target_staff_id: '',
        image_url: ''
    });

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchStaff();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('staff_notifications')
                .select(`
                    *,
                    target_staff:staff(first_name, last_name)
                `)
                .eq('business_id', user.business_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('staff')
                .select('id, first_name, last_name')
                .eq('business_id', user.business_id)
                .eq('is_archived', false);

            if (error) throw error;
            setStaff(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.business_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('notifications')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('notifications')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const handleSendNotification = async (saveOnly = false) => {
        try {
            if (!formData.title || !formData.content) {
                alert('Başlık ve içerik alanları zorunludur.');
                return;
            }

            let imageUrl = formData.image_url;
            if (imageFile) {
                imageUrl = await handleFileUpload(imageFile);
            }

            const payload = {
                business_id: user.business_id,
                title: formData.title,
                content: formData.content,
                target_type: activeTab,
                target_staff_id: activeTab === 'personal' ? formData.target_staff_id : null,
                image_url: imageUrl,
                status: saveOnly ? 'draft' : 'sent',
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('staff_notifications')
                .insert([payload]);

            if (error) throw error;

            setShowModal(false);
            setFormData({ title: '', content: '', target_staff_id: '', image_url: '' });
            setImageFile(null);
            fetchNotifications();
            alert(saveOnly ? 'Bildirim taslak olarak kaydedildi.' : 'Bildirim başarıyla gönderildi.');
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('İşlem sırasında bir hata oluştu.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu bildirimi silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('staff_notifications')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div className="p-8 bg-[#F8F9FC] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-gray-800 tracking-tight">Personel Bildirimleri</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span>Pano</span>
                        <span>•</span>
                        <span>Personel Yönetimi</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">Personel Bildirimleri</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Yeni Mobil Bildirim
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50 uppercase text-[11px] font-bold text-gray-400 tracking-widest">
                            <th className="px-8 py-6">Bildirim Başlığı</th>
                            <th className="px-8 py-6">Bildirim İçeriği</th>
                            <th className="px-8 py-6">Bildirim Hedef Kitlesi</th>
                            <th className="px-8 py-6">Bildirim Görseli</th>
                            <th className="px-8 py-6 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-12 text-center text-gray-400">Yükleniyor...</td>
                            </tr>
                        ) : notifications.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-300">
                                        <Send size={48} className="mb-4 opacity-20" />
                                        <p>Henüz gönderilmiş bildirim bulunamadı.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            notifications.map(notif => (
                                <tr key={notif.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-gray-800">{notif.title}</div>
                                        <div className="text-[11px] text-gray-400 mt-0.5">{new Date(notif.created_at).toLocaleString('tr-TR')}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="max-w-xs truncate text-gray-500">{notif.content}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            {notif.target_type === 'general' && (
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                                                    <Users size={12} /> Tüm Personel
                                                </span>
                                            )}
                                            {notif.target_type === 'personal' && (
                                                <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                                                    <User size={12} /> {notif.target_staff ? `${notif.target_staff.first_name} ${notif.target_staff.last_name}` : 'Bilinmeyen'}
                                                </span>
                                            )}
                                            {notif.target_type === 'shift' && (
                                                <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                                                    <Clock size={12} /> Shifti Olanlar
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        {notif.image_url ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100">
                                                <img src={notif.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100">
                                                <ImageIcon size={16} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(notif.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-[800px] shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Mobil Bildirim Ekle</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            {[
                                { id: 'general', label: 'Genel Personel Bildirimi' },
                                { id: 'personal', label: 'Kişisel Personel Bildirimi' },
                                { id: 'shift', label: 'Shifti Olan Personel Bildirimi' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-4 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-[#1976D2]' : 'text-gray-400'
                                        }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1976D2]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">* Mobil Bildirim Başlığı</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Bildirim başlığını giriniz"
                                />
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">* Mobil Bildirim İçeriği</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    rows={4}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                    placeholder="Bildirim içeriğini giriniz"
                                />
                            </div>

                            {/* Personal Target Selection */}
                            {activeTab === 'personal' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                    <label className="text-sm font-bold text-gray-700">Bildirimin Gönderileceği Personel</label>
                                    <div className="relative">
                                        <select
                                            value={formData.target_staff_id}
                                            onChange={e => setFormData({ ...formData, target_staff_id: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Personel Seçiniz</option>
                                            {staff.map(s => (
                                                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            )}

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files[0])}
                                />
                                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-1 px-4 h-[52px]">
                                    <span className="text-gray-500 text-sm truncate max-w-[400px]">
                                        {imageFile ? imageFile.name : 'Mobil Bildirim Görseli'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm font-bold transition-all border-l border-gray-200 h-full"
                                    >
                                        Browse
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-8 py-3 bg-[#E0E0E0] text-[#757575] rounded-xl font-bold text-sm hover:bg-gray-300 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleSendNotification(true)}
                                className="px-8 py-3 bg-[#2196F3] text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
                            >
                                Mobil Bildirim Ekle
                            </button>
                            <button
                                onClick={() => handleSendNotification(false)}
                                className="px-8 py-3 bg-[#7C4DFF] text-white rounded-xl font-bold text-sm hover:bg-purple-600 transition-all shadow-md shadow-purple-500/20"
                            >
                                Kaydet & Gönder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffNotifications;
