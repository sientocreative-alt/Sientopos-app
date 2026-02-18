import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown } from 'lucide-react';

const NewTerminal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        terminal_type: 'Pos (Sadece sipariş alır - Yazıcı Pos Cihazı bağlantısı bulunmaz)',
        printer_service: 'Seçiniz',
        pos_service: 'Seçiniz',
        default_printer_id: 'Seçiniz'
    });

    const [printers, setPrinters] = useState([]);

    useEffect(() => {
        const fetchPrinters = async () => {
            try {
                const { data, error } = await supabase
                    .from('printers')
                    .select('id, name')
                    .eq('business_id', user.business_id)
                    .eq('is_deleted', false);

                if (error) throw error;
                setPrinters(data || []);
            } catch (error) {
                console.error('Error fetching printers:', error);
            }
        };

        if (user) fetchPrinters();
    }, [user]);

    const handleSave = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            alert('Lütfen zorunlu alanları (* Personnel Adı, * E-Posta, Parola) doldurunuz.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('terminals')
                .insert([{
                    business_id: user.business_id,
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    terminal_type: formData.terminal_type,
                    printer_service: formData.printer_service !== 'Seçiniz' ? formData.printer_service : null,
                    pos_service: formData.pos_service !== 'Seçiniz' ? formData.pos_service : null,
                    default_printer_id: formData.default_printer_id !== 'Seçiniz' ? formData.default_printer_id : null
                }]);

            if (error) throw error;
            navigate('/isletme/terminaller');
        } catch (error) {
            console.error('Error creating terminal:', error);
            alert('Hata oluşturuldu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const SelectInput = ({ label, value, onChange, options = [] }) => (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="relative">
                <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                >
                    {options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
            </div>
        </div>
    );

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800">Terminal Ekle</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">

                {/* Personnel Name */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>Personel Adı
                    </label>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Terminal Adı"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Email */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>E-Posta
                    </label>
                    <input
                        type="email"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="E-Posta"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                {/* Password */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Parola</label>
                    <input
                        type="password"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Parola"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                {/* Terminal Type */}
                <SelectInput
                    label="Terminal Türü"
                    value={formData.terminal_type}
                    onChange={val => setFormData({ ...formData, terminal_type: val })}
                    options={[
                        'Pos (Sadece sipariş alır - Yazıcı Pos Cihazı bağlantısı bulunmaz)',
                        'Servis (Sipariş alır - Yazıcı ve Pos cihazına çıktı iletebilir)',
                        'Müşteri Ekranı',
                        'Mutfak Ekranı',
                        'Kiosk'
                    ]}
                />

                {/* Printer Service */}
                <SelectInput
                    label="Yazıcı Servisi"
                    value={formData.printer_service}
                    onChange={val => setFormData({ ...formData, printer_service: val })}
                    options={['Seçiniz', 'ANA TERMINAL']}
                />

                {/* POS Service */}
                <SelectInput
                    label="POS Servisi"
                    value={formData.pos_service}
                    onChange={val => setFormData({ ...formData, pos_service: val })}
                    options={['Seçiniz', 'ANA TERMINAL']}
                />

                {/* Default Printer */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan Yazıcı</label>
                    <div className="relative">
                        <select
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                            value={formData.default_printer_id}
                            onChange={e => setFormData({ ...formData, default_printer_id: e.target.value })}
                        >
                            <option value="Seçiniz">Seçiniz</option>
                            {printers.map(printer => (
                                <option key={printer.id} value={printer.id}>{printer.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={() => navigate('/isletme/terminaller')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Yükleniyor...' : 'Terminal Ekle'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewTerminal;
