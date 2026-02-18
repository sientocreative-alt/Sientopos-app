import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Archive, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const RearScreenSlider = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('slider_images')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (error) {
            console.error('Error fetching slider images:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchImages();
    }, [user]);

    const handleDelete = async (id) => {
        if (!window.confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('slider_images')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchImages();
        } catch (error) {
            console.error('Error deleting slider image:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900 text-lg">MenuBoard</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>MenuBoard</span>
                </div>
                <div className="flex gap-3">
                    <button
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                        onClick={() => navigate('/isletme/menuboard/yeni')}
                    >
                        Yeni MenuBoard Ekle
                    </button>
                    <button className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors">
                        Arşiv
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white border-b border-gray-50 text-gray-600 text-sm">
                            <th className="py-4 px-6 font-medium border-r border-gray-50 w-32"></th>
                            <th className="py-4 px-6 font-medium border-r border-gray-50">Fotoğraf</th>
                            <th className="py-4 px-6 font-medium text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan="3" className="py-8 text-center text-gray-500">Yükleniyor...</td>
                            </tr>
                        ) : images.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="py-8 text-center text-gray-400">
                                    Tabloda herhangi bir veri mevcut değil
                                </td>
                            </tr>
                        ) : (
                            images.map((img) => (
                                <tr key={img.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-4 px-6 border-r border-gray-50 w-32">
                                        {/* Placeholder for order or static icon */}
                                    </td>
                                    <td className="py-4 px-6 border-r border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                {img.image_url ? (
                                                    <img src={img.image_url} alt="Slider" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-gray-300" size={24} />
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500">{img.duration} Sn.</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleDelete(img.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>
    );
};

export default RearScreenSlider;
