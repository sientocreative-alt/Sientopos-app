import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabase';

const EditCampaign = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        branch_name: 'Merkez',
        image_url: ''
    });

    useEffect(() => {
        if (user && id) {
            fetchCampaign();
        }
    }, [user, id]);

    const fetchCampaign = async () => {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title,
                    description: data.description || '',
                    start_date: data.start_date,
                    end_date: data.end_date,
                    branch_name: data.branch_name || 'Merkez',
                    image_url: data.image_url || ''
                });
            }
        } catch (error) {
            console.error("Error fetching campaign:", error);
            alert("Kampanya bilgileri yüklenemedi.");
            navigate('/isletme/kampanyalar');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `campaigns/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('details')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('details').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Görsel yüklenirken hata oluştu: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('campaigns')
                .update(formData)
                .eq('id', id);

            if (error) throw error;

            alert('Kampanya güncellendi!');
            navigate('/isletme/kampanyalar');
        } catch (error) {
            console.error('Error updating campaign:', error);
            alert('Güncelleme hatası: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kampanya Düzenle</h1>
                <div className="text-xs text-gray-400 mt-1">
                    Pano • Mobil Uygulama • Kampanyalar • Düzenle
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kampanya Başlığı</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kampanya Açıklaması</label>
                        <textarea
                            rows="4"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Başlangıç Tarihi</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bitiş Tarihi</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kampanya Görseli</label>
                        <div className="flex items-start gap-4">
                            <div
                                onClick={() => document.getElementById('imageInput').click()}
                                className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition bg-gray-50 relative overflow-hidden group"
                            >
                                {formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} alt="Kampanya" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                                            DEĞİŞTİR
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="text-gray-400 mb-2" size={24} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Görsel Seç</span>
                                    </>
                                )}
                            </div>
                            <input
                                id="imageInput"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                            {formData.image_url && (
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Görseli Kaldır"
                                >
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 lowercase italic">Önerilen boyut: 800x800px. Maksimum 2MB.</p>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/isletme/kampanyalar')}
                            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCampaign;
