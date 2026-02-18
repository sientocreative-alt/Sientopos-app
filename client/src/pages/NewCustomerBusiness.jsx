import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const NewCustomerBusiness = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    // Turkish cities list
    const cities = [
        'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
        'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
        'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
        'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
        'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
        'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
        'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
        'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce'
    ];

    const [formData, setFormData] = useState({
        name: '',
        authorized_person: '',
        email: '',
        phone: '',
        address: '',
        fax: '',
        tax_number: '',
        city: '',
        tax_office: ''
    });

    useEffect(() => {
        if (id) {
            fetchBusiness();
        }
    }, [id]);

    const fetchBusiness = async () => {
        try {
            setInitialLoading(true);
            const { data, error } = await supabase
                .from('customer_businesses')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    authorized_person: data.authorized_person || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    fax: data.fax || '',
                    tax_number: data.tax_number || '',
                    city: data.city || '',
                    tax_office: data.tax_office || ''
                });
            }
        } catch (error) {
            console.error('Error fetching business:', error);
            toast.error('İşletme bilgileri yüklenirken hata oluştu');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                business_id: user.business_id,
                updated_at: new Date().toISOString()
            };

            let error;

            if (id) {
                const { error: updateError } = await supabase
                    .from('customer_businesses')
                    .update(payload)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('customer_businesses')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(id ? 'Müşteri işletme güncellendi' : 'Müşteri işletme başarıyla eklendi');
            navigate('/isletme/musteri-isletmeler');
        } catch (error) {
            console.error('Error saving business:', error);
            toast.error('Kaydetme işlemi sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/isletme/musteri-isletmeler')}
                        className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                            {id ? 'Müşteri İşletme Düzenle' : 'Müşteri İşletme Ekle'}
                        </h1>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <span>Müşteri İşletmeler</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-blue-600 font-medium">{id ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                        <h2 className="text-lg font-bold text-gray-900">Müşteri İşletme Ekle</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        * Müşteri Adı
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-700 shadow-sm"
                                        placeholder="İşletme Adı Giriniz"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        E Mail
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Adres
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Şehir
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Şehir Seçiniz</option>
                                            {cities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Yetkili Ad Soyad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.authorized_person}
                                        onChange={(e) => setFormData({ ...formData, authorized_person: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Telefon Numarası
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Faks Numarası
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fax}
                                        onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Vergi No
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tax_number}
                                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                        Vergi Dairesi
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tax_office}
                                        onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700 shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => navigate('/isletme/musteri-isletmeler')}
                                className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-10 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <Save size={20} />
                                )}
                                {id ? 'Değişiklikleri Kaydet' : 'Müşteri İşletme Ekle'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewCustomerBusiness;
