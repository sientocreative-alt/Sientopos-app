import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Trash2 } from 'lucide-react';

const EditPrinter = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: 'Yazıcı',
        printer_type: 'Termal Fiş Yazıcısı',
        line_width: '48',
        connection_type: 'Ethernet',
        connection_port: ''
    });

    useEffect(() => {
        const fetchPrinter = async () => {
            try {
                const { data, error } = await supabase
                    .from('printers')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        name: data.name,
                        type: data.type,
                        printer_type: data.printer_type,
                        line_width: data.line_width.toString(),
                        connection_type: data.connection_type,
                        connection_port: data.connection_port || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching printer:', error);
                alert('Yazıcı bilgileri alınamadı.');
                navigate('/isletme/yazicilar');
            } finally {
                setLoading(false);
            }
        };

        if (user && id) fetchPrinter();
    }, [user, id, navigate]);

    const handleSave = async () => {
        if (!formData.name) {
            alert('Lütfen Yazıcı Adı alanını doldurunuz.');
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase
                .from('printers')
                .update({
                    name: formData.name,
                    type: formData.type,
                    printer_type: formData.printer_type,
                    line_width: parseInt(formData.line_width),
                    connection_type: formData.connection_type,
                    connection_port: formData.connection_port
                })
                .eq('id', id);

            if (error) throw error;
            navigate('/isletme/yazicilar');
        } catch (error) {
            console.error('Error updating printer:', error);
            alert('Güncelleme hatası: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Bu yazıcıyı silmek istediğinize emin misiniz?')) return;

        try {
            setSaving(true);
            const { error } = await supabase
                .from('printers')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            navigate('/isletme/yazicilar');
        } catch (error) {
            console.error('Error deleting printer:', error);
            alert('Silme işlemi başarısız oldu.');
            setSaving(false);
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

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="font-bold text-gray-900 text-lg">Düzenle</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Yazıcılar</span>
                    <span>•</span>
                    <span>Düzenle</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <h1 className="text-xl font-bold text-gray-800">Yazıcı Düzenle</h1>
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-600 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={18} />
                        <span>Yazıcıyı Sil</span>
                    </button>
                </div>

                {/* Printer Name */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>Yazıcı Adı
                    </label>
                    <input
                        type="text"
                        className="w-full border border-blue-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="Yazıcı Adı"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Type */}
                <SelectInput
                    label="Tür"
                    value={formData.type}
                    onChange={val => setFormData({ ...formData, type: val })}
                    options={['Yazıcı']}
                />

                {/* Printer Type */}
                <SelectInput
                    label="Yazıcı Tipi"
                    value={formData.printer_type}
                    onChange={val => setFormData({ ...formData, printer_type: val })}
                    options={['Termal Fiş Yazıcısı', 'Etiket Yazıcısı']}
                />

                {/* Line Width */}
                <SelectInput
                    label="Satır Genişliği"
                    value={formData.line_width}
                    onChange={val => setFormData({ ...formData, line_width: val })}
                    options={['48', '58', '80']}
                />

                {/* Connection Type */}
                <SelectInput
                    label="Bağlantı Türü"
                    value={formData.connection_type}
                    onChange={val => setFormData({ ...formData, connection_type: val })}
                    options={['Ethernet', 'USB', 'Bluetooth']}
                />

                {/* Connection Port */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bağlantı Noktası</label>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder=""
                        value={formData.connection_port}
                        onChange={e => setFormData({ ...formData, connection_port: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Ethernet yazıcısı ise IP ve PORT, USB ise Yazıcı Adı girilmelidir</p>

                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6">
                    <button
                        onClick={() => navigate('/isletme/yazicilar')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditPrinter;
