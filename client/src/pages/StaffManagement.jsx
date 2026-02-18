import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit2, Archive, Phone, X, ChevronDown, Check, UserPlus, Pencil, XCircle, Eye, EyeOff } from 'lucide-react';

const StaffToggle = ({ active, onClick }) => (
    <div
        onClick={onClick}
        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 relative ${active ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 transform ${active ? 'translate-x-6' : 'translate-x-0'}`}>
            {active && <Check size={10} className="text-blue-500 font-bold" />}
        </div>
    </div>
);

const StaffManagement = () => {
    const { user } = useAuth();
    const { id: profileId } = useParams();
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        restaurant_role: 'Personel',
        staff_role: '',
        hire_date: new Date().toISOString().split('T')[0],
        total_break_time: 0,
        pin_code: '',
        web_password: '',
        daily_free_drink_limit: 0,
        shift_active: true
    });

    useEffect(() => {
        if (user) fetchStaff();
    }, [user, viewMode]);

    useEffect(() => {
        if (profileId && staffList.length > 0) {
            const staffToEdit = staffList.find(s => s.auth_user_id === profileId || s.id === profileId);
            if (staffToEdit) {
                openModal(staffToEdit);
            }
        }
    }, [profileId, staffList]);

    const fetchStaff = async () => {
        try {
            setLoading(true);

            // Get business_id from profiles first to be safe
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Profil bulunamadı');

            const { data, error } = await supabase
                .from('staff')
                .select('*')
                .eq('business_id', profile.business_id)
                .eq('is_archived', viewMode === 'archived')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaffList(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('business_id')
                .eq('id', user.id)
                .single();

            if (!profile) throw new Error('Profil bulunamadı');

            const payload = {
                ...formData,
                business_id: profile.business_id,
                updated_at: new Date().toISOString()
            };

            if (editingStaff) {
                const { error } = await supabase
                    .from('staff')
                    .update(payload)
                    .eq('id', editingStaff.id);
                if (error) throw error;
            } else {
                // 1. Önce bu email ile kayıtlı personel var mı kontrol et (Arşivdekiler dahil)
                const { data: existingStaff, error: checkError } = await supabase
                    .from('staff')
                    .select('id, is_archived')
                    .eq('email', formData.email)
                    .maybeSingle();

                if (checkError) throw checkError;

                if (existingStaff) {
                    if (existingStaff.is_archived) {
                        alert('Bu e-posta adresi ile zaten bir personel kaydı (arşivde) mevcut. Lütfen arşive giderek personeli geri yükleyin veya farklı bir e-posta kullanın.');
                    } else {
                        alert('Bu e-posta adresi ile aktif bir personel zaten mevcut.');
                    }
                    return;
                }

                // 2. Auth sistemine kaydet (SERVER-SIDE)
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/create-staff`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: Math.random().toString(36).slice(-10),
                        firstName: formData.first_name,
                        lastName: formData.last_name,
                        role: formData.staff_role,
                        businessId: profile.business_id
                    })
                });

                const authData = await response.json();

                if (!response.ok) {
                    // Daha detaylı hata mesajı göster
                    const errorMsg = authData.error || authData.message || 'Personel oluşturulamadı';
                    if (errorMsg.includes('already been registered')) {
                        throw new Error('Bu e-posta adresi sistemde zaten kayıtlı (başka bir işletmede olabilir). Lütfen farklı bir e-posta deneyin.');
                    }
                    throw new Error(errorMsg);
                }

                // 3. Auth user id'yi payload'a ekle ve staff tablosuna kaydet
                const { error: dbError } = await supabase
                    .from('staff')
                    .insert([{
                        ...payload,
                        auth_user_id: authData.user.id
                    }]);

                if (dbError) throw dbError;
            }

            closeModal();
            fetchStaff();
            alert('Personel başarıyla eklendi. E-posta adresine doğrulama bildirimi gönderildi.');
        } catch (error) {
            console.error('Submit Error:', error);
            if (error.code === '23505') {
                alert('Hata: Bu e-posta adresi veri tabanında zaten kullanımda.');
            } else {
                alert('Bilgi: ' + error.message);
            }
        }
    };

    const handleSoftDelete = async (id) => {
        if (!window.confirm('Bu personeli pasifleştirmek (arşive taşımak) istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('staff')
                .update({
                    is_archived: true,
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            await fetchStaff();
        } catch (error) {
            console.error('Error archiving staff:', error);
            alert('Pasifleştirme sırasında bir hata oluştu: ' + error.message);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!window.confirm('DİKKAT: Bu personel kaydını SİSTEMDEN TAMAMEN SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
        try {
            const { error } = await supabase
                .from('staff')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchStaff();
        } catch (error) {
            console.error('Error permanently deleting staff:', error);
            alert('Silme işlemi sırasında bir hata oluştu: ' + error.message);
        }
    };

    const handleRestore = async (id) => {
        try {
            const { error } = await supabase
                .from('staff')
                .update({
                    is_archived: false,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            await fetchStaff();
        } catch (error) {
            console.error('Error restoring staff:', error);
            alert('Geri yükleme sırasında bir hata oluştu: ' + error.message);
        }
    };



    const openModal = (staff = null) => {
        if (staff) {
            setEditingStaff(staff);
            setFormData({
                first_name: staff.first_name,
                last_name: staff.last_name,
                email: staff.email || '',
                phone: staff.phone || '',
                restaurant_role: staff.restaurant_role || 'Personel',
                staff_role: staff.staff_role || '',
                hire_date: staff.hire_date || new Date().toISOString().split('T')[0],
                total_break_time: staff.total_break_time || 0,
                pin_code: staff.pin_code || '',
                web_password: staff.web_password || '',
                daily_free_drink_limit: staff.daily_free_drink_limit || 0,
                shift_active: staff.shift_active ?? true
            });
        } else {
            setEditingStaff(null);
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                restaurant_role: 'Personel',
                staff_role: '',
                hire_date: new Date().toISOString().split('T')[0],
                total_break_time: 0,
                pin_code: '',
                web_password: '',
                daily_free_drink_limit: 0,
                shift_active: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStaff(null);
        if (profileId) {
            navigate('/isletme/personeller');
        }
    };

    const filteredStaff = staffList.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.includes(searchTerm))
    );

    return (
        <div className="p-4 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[98%] mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                            Yönetici & Personel {viewMode === 'archived' && '(Arşiv)'}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 mt-1">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Personel Yönetimi</span>
                            <span>•</span>
                            <span className="text-gray-300">Yönetici & Personel</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {viewMode === 'archived' ? (
                            <button
                                onClick={() => setViewMode('active')}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-[13px] transition-all"
                            >
                                Aktif Personeller
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => openModal()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#E0F2FE] hover:bg-blue-100 text-[#0284C7] rounded-lg font-bold text-[13px] transition-all"
                                >
                                    Personel Ekle
                                </button>
                                <button
                                    onClick={() => setViewMode('archived')}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[#FFF4E5] hover:bg-orange-100 text-[#D97706] rounded-lg font-bold text-[13px] transition-all"
                                >
                                    Arşiv
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div
                        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    >
                        <span className="text-sm font-bold text-gray-700">Filtreler</span>
                        <ChevronDown className={`text-gray-400 transition-transform ${isFiltersOpen ? '' : '-rotate-90'}`} size={18} />
                    </div>
                    {isFiltersOpen && (
                        <div className="px-6 pb-6 pt-2">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Personel ara..."
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all text-sm font-medium text-gray-700"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Staff List Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#F8FAFC] text-[#3B82F6] text-[11px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">Personel Adı</th>
                                    <th className="px-8 py-4">Email</th>
                                    <th className="px-8 py-4">Telefon</th>
                                    <th className="px-8 py-4">Rol</th>
                                    <th className="px-8 py-4 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-12 text-center text-gray-400 text-sm">Yükleniyor...</td>
                                    </tr>
                                ) : filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <UserPlus className="text-gray-200" size={32} />
                                                </div>
                                                <span className="text-gray-400 text-sm font-medium">Herhangi bir personel bulunamadı</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-4">
                                                <span className="font-bold text-gray-700 text-[13px]">{staff.first_name} {staff.last_name}</span>
                                            </td>
                                            <td className="px-8 py-4 text-[#3B82F6] font-bold text-[13px]">
                                                {staff.email || '-'}
                                            </td>
                                            <td className="px-8 py-4 text-[#3B82F6] font-bold text-[13px]">
                                                {staff.phone || '-'}
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="inline-flex px-3 py-1 bg-blue-50 text-[#3B82F6] text-[11px] font-bold rounded-lg border border-blue-100 uppercase tracking-tight">
                                                    {staff.staff_role || 'Belirtilmedi'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {viewMode === 'archived' ? (
                                                        <button
                                                            onClick={() => handleRestore(staff.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-bold text-[11px] transition-all border border-green-100"
                                                        >
                                                            <Check size={14} />
                                                            Arşivden Çıkar
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {/* 1. Düzenle */}
                                                            <button
                                                                onClick={() => openModal(staff)}
                                                                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-[#3B82F6] rounded-xl transition-all shadow-sm"
                                                                title="Düzenle"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>

                                                            {/* 2. Pasifleştir (Arşive Taşı) */}
                                                            <button
                                                                onClick={() => handleSoftDelete(staff.id)}
                                                                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-orange-500 rounded-xl transition-all shadow-sm"
                                                                title="Pasifleştir (Arşive Taşı)"
                                                            >
                                                                <EyeOff size={20} />
                                                            </button>

                                                            {/* 3. Sil (Sistemden Tamamen Sil) */}
                                                            <button
                                                                onClick={() => handlePermanentDelete(staff.id)}
                                                                className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"
                                                                title="Sistemden Tamamen Sil"
                                                            >
                                                                <XCircle size={20} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal - Personel Ekle / Düzenle */}
                {showModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 text-left overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden relative animate-in fade-in zoom-in duration-200">
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">
                                        {editingStaff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                        <span>Yönetici & Personel</span>
                                        <span>•</span>
                                        <span>Yeni</span>
                                    </div>
                                </div>
                                <button onClick={closeModal} className="text-gray-300 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-50">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8">
                                <h4 className="text-[15px] font-bold text-gray-800 mb-8 px-2">Hesap Ayarları</h4>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8 px-2">

                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">.* Personel Adı</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300"
                                                    value={formData.first_name}
                                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">Personel Soyadı</label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300"
                                                    value={formData.last_name}
                                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">.* E-Posta</label>
                                                <input
                                                    required
                                                    type="email"
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                />
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Personelin Kardo sistemine kendi hesabıyla giriş yapmak için kullanacağı e-posta.</p>
                                            </div>
                                        </div>

                                        {/* Middle Column */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">..* Restoran Rolü</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full appearance-none border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all"
                                                        value={formData.restaurant_role}
                                                        onChange={e => setFormData({ ...formData, restaurant_role: e.target.value })}
                                                    >
                                                        <option value="Personel">Personel</option>
                                                        <option value="Kurye">Kurye</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">Personel Rolü</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full appearance-none border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all"
                                                        value={formData.staff_role}
                                                        onChange={e => setFormData({ ...formData, staff_role: e.target.value })}
                                                    >
                                                        <option value="">Seçiniz...</option>
                                                        <option value="Yönetici">Yönetici</option>
                                                        <option value="Barista">Barista</option>
                                                        <option value="Garson">Garson</option>
                                                        <option value="Muhasebe Denetçisi">Muhasebe Denetçisi</option>
                                                        <option value="Stok Denetçisi">Stok Denetçisi</option>
                                                        <option value="Kasiyer">Kasiyer</option>
                                                        <option value="Mesai">Mesai</option>
                                                        <option value="Şef">Şef</option>
                                                        <option value="Nargileci">Nargileci</option>
                                                        <option value="Müdür">Müdür</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Personelin SientoPOS sistemindeki yetkilerini ve sınırlarını belirleyen, hesap yöneticileri tarafından tanımlanmış olan Personel Rolü.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">İşe Giriş Tarihi</label>
                                                <input
                                                    type="date"
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all"
                                                    value={formData.hire_date}
                                                    onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">Toplam Mola Süresi (Dk.)</label>
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300"
                                                    value={formData.total_break_time}
                                                    onChange={e => setFormData({ ...formData, total_break_time: parseInt(e.target.value) || 0 })}
                                                />
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Personelin mola sürelerinin çalışma saatlerine göre hesaplanmasını istiyorsanız, bu alanı boş bırakın. Aksi halde personel kaç saat çalışırsa çalışsın, buraya girilen değer kadar mola hakkına sahip olur.</p>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">Satış Ekranı PIN Kodu</label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-bold text-gray-700 tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300"
                                                    value={formData.pin_code}
                                                    onChange={e => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '') })}
                                                />
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Personelin POS ekranına kendi hesabıyla giriş yapmak için kullanacağı şifre.</p>
                                            </div>

                                            {editingStaff && (
                                                <div className="space-y-2">
                                                    <label className="text-[13px] font-bold text-gray-700 block">Parola</label>
                                                    <input
                                                        type="text"
                                                        className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all placeholder:text-gray-300"
                                                        value={formData.web_password}
                                                        onChange={e => setFormData({ ...formData, web_password: e.target.value })}
                                                    />
                                                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Personelin SientoPOS sistemine kendi hesabıyla giriş yapmak için kullanacağı şifre.</p>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-[13px] font-bold text-gray-700 block">Günlük Ücretsiz İçecek</label>
                                                <input
                                                    type="number"
                                                    className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-[#F8FAFC] text-[13px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-51 focus:border-blue-200 transition-all"
                                                    value={formData.daily_free_drink_limit}
                                                    onChange={e => setFormData({ ...formData, daily_free_drink_limit: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-[13px] font-bold text-gray-700">Mesai Aktif</label>
                                                    <StaffToggle
                                                        active={formData.shift_active}
                                                        onClick={() => setFormData({ ...formData, shift_active: !formData.shift_active })}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Personele mesai tanımlanabilmesi için, Mesai Aktif butonunun seçili olması gerekmektedir.</p>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Footer Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-8 px-2">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-8 py-3 bg-[#E5E7EB] hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-[13px] transition-all"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-10 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl text-[13px] shadow-lg shadow-blue-100 transition-all active:scale-95"
                                        >
                                            {editingStaff ? 'Personeli Güncelle' : 'Personel Ekle'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default StaffManagement;
