import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ArrowLeft } from 'lucide-react';

const NewDevice = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state matching the screenshot fields and DB columns
    const [formData, setFormData] = useState({
        activation_code: '',
        name: '',
        terminal_type: 'Pos (Sadece sipariş alır - Yazıcı Pos Cihazı bağlantısı bulunmaz)',
        printer_service: 'Seçiniz',
        pos_service: 'Seçiniz',
        appearance_mode: 'Varsayılan',
        caller_id_mode: 'Aktif Değil',
        default_printer_id: 'Seçiniz',
        show_photos: false,
        ring_on_new_order: false,
        hide_soft_keyboard: false,
        receive_waiter_calls: false,
        ring_on_waiter_call: false
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
        if (!formData.name || !formData.activation_code) {
            alert('Lütfen Cihaz Adı ve Aktivasyon Kodu alanlarını doldurunuz.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('devices')
                .insert([{
                    business_id: user.business_id,
                    name: formData.name,
                    activation_code: formData.activation_code,
                    terminal_type: formData.terminal_type,
                    printer_service: formData.printer_service !== 'Seçiniz' ? formData.printer_service : null,
                    pos_service: formData.pos_service !== 'Seçiniz' ? formData.pos_service : null,
                    appearance_mode: formData.appearance_mode,
                    caller_id_mode: formData.caller_id_mode,
                    default_printer_id: formData.default_printer_id !== 'Seçiniz' ? formData.default_printer_id : null,
                    show_photos: formData.show_photos,
                    ring_on_new_order: formData.ring_on_new_order,
                    hide_soft_keyboard: formData.hide_soft_keyboard,
                    receive_waiter_calls: formData.receive_waiter_calls,
                    ring_on_waiter_call: formData.ring_on_waiter_call,
                    // Default values for other fields if needed
                    platform: 'Windows' // Defaulting as it's not in the form but in the list
                }]);

            if (error) throw error;
            navigate('/isletme/cihazlar');
        } catch (error) {
            console.error('Error creating device:', error);
            alert('Hata oluşturuldu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper for Select inputs
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

    // Helper for Toggle switches
    const ToggleSwitch = ({ label, checked, onChange }) => (
        <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`} />
            </button>
        </div>
    );

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Tanımlı Cihaz Ekle</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">

                {/* Activation Code */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aktivasyon Kodu</label>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Aktivasyon Kodu"
                        value={formData.activation_code}
                        onChange={e => setFormData({ ...formData, activation_code: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Lütfen cihaz ekranındaki aktivasyon kodunu yazınız</p>
                </div>

                {/* Device Name */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cihaz Adı</label>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Cihaz Adı"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Cihaza isim verin</p>
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
                    options={['Seçiniz', 'ANA TERMINAL', ...printers.map(p => p.name)]}
                />

                {/* POS Service */}
                <SelectInput
                    label="POS Servisi"
                    value={formData.pos_service}
                    onChange={val => setFormData({ ...formData, pos_service: val })}
                    options={['Seçiniz', 'ANA TERMINAL']}
                />

                {/* Appearance */}
                <SelectInput
                    label="Görünüm"
                    value={formData.appearance_mode}
                    onChange={val => setFormData({ ...formData, appearance_mode: val })}
                    options={['Varsayılan', 'Bilgisayar', 'Tablet', 'Telefon']}
                />

                {/* Caller ID */}
                <SelectInput
                    label="CallerID Ayarı"
                    value={formData.caller_id_mode}
                    onChange={val => setFormData({ ...formData, caller_id_mode: val })}
                    options={['Aktif Değil', 'Cidshow', 'GCallerID']}
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

                {/* Toggles */}
                <div className="mt-8 space-y-2">
                    <ToggleSwitch
                        label="Pos Ekranında Fotoğraf Göster"
                        checked={formData.show_photos}
                        onChange={val => setFormData({ ...formData, show_photos: val })}
                    />
                    <ToggleSwitch
                        label="Siparişlerde bu terminalde zil çal"
                        checked={formData.ring_on_new_order}
                        onChange={val => setFormData({ ...formData, ring_on_new_order: val })}
                    />
                    <ToggleSwitch
                        label="Yazılımsal Klavyeyi Gizle"
                        checked={formData.hide_soft_keyboard}
                        onChange={val => setFormData({ ...formData, hide_soft_keyboard: val })}
                    />
                    <ToggleSwitch
                        label="Garson Çağırma Bildirimi Alabilir"
                        checked={formData.receive_waiter_calls}
                        onChange={val => setFormData({ ...formData, receive_waiter_calls: val })}
                    />
                    <ToggleSwitch
                        label="Garson çağırmada zil çal"
                        checked={formData.ring_on_waiter_call}
                        onChange={val => setFormData({ ...formData, ring_on_waiter_call: val })}
                    />
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={() => navigate('/isletme/cihazlar')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Tanımlı Cihaz Ekle'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewDevice;
