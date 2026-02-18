import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Image as ImageIcon, Plus, X, Trash2 } from 'lucide-react';

const NewSliderImage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [files, setFiles] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [duration, setDuration] = useState(5);

    const fetchCurrentImages = async () => {
        try {
            setFetching(true);
            const { data, error } = await supabase
                .from('slider_images')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUploadedImages(data || []);
        } catch (error) {
            console.error('Error fetching current images:', error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (user) fetchCurrentImages();
    }, [user]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const removeQueuedFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (files.length === 0) {
            alert('Lütfen en az bir fotoğraf seçiniz.');
            return;
        }

        try {
            setLoading(true);

            for (const file of files) {
                // 1. Upload file to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.business_id}/${fileName}`;

                let { error: uploadError } = await supabase.storage
                    .from('sliders')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // 2. Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('sliders')
                    .getPublicUrl(filePath);

                // 3. Insert into database
                const { error: dbError } = await supabase
                    .from('slider_images')
                    .insert([{
                        business_id: user.business_id,
                        image_url: publicUrl,
                        duration: parseInt(duration)
                    }]);

                if (dbError) throw dbError;
            }

            setFiles([]); // Clear queue
            fetchCurrentImages(); // Refresh grid
            alert('Görseller başarıyla yüklendi.');
        } catch (error) {
            console.error('Error creating slider image:', error);
            alert('Hata oluşturuldu: ' + (error.message || 'Lütfen "sliders" storage bucket\'ın aktif olduğundan emin olun.'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('slider_images')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            fetchCurrentImages();
        } catch (error) {
            console.error('Error deleting slider image:', error);
            alert('Silme işlemi başarısız oldu.');
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="font-bold text-gray-900 text-lg">Yeni</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Arka Ekran Slider</span>
                    <span>•</span>
                    <span>Yeni</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 mb-8">Arka Ekran Slider Ekle</h1>

                {/* Photo Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fotoğrafları Seç (Toplu yükleme yapabilirsiniz)</label>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                            <Plus className="text-gray-400 group-hover:text-blue-500" size={32} />
                            <span className="text-xs text-gray-500 mt-2 font-medium">Fotoğraf Ekle</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />
                        </label>

                        {/* Queue list */}
                        {files.map((f, i) => (
                            <div key={i} className="relative w-32 h-32 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeQueuedFile(i)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <X size={14} />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1">
                                    <p className="text-[10px] text-white truncate">{f.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-6 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ekranda Kalma Süresi (Sn Olarak)</label>
                    <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-bold"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                    />
                </div>

                {/* Confirm Button */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={() => navigate('/isletme/ekran-slider')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Pano'ya Dön
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || files.length === 0}
                        className="px-8 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {loading ? 'Yükleniyor...' : 'Seçilenleri Yükle'}
                    </button>
                </div>

                {/* Grid of uploaded images */}
                <div className="mt-12">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <ImageIcon size={20} className="text-blue-500" />
                        Yayındaki Görseller
                    </h2>

                    {fetching ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="aspect-video bg-gray-100 animate-pulse rounded-xl"></div>
                            ))}
                        </div>
                    ) : uploadedImages.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <ImageIcon size={48} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">Henüz herhangi bir görsel yüklenmemiş.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {uploadedImages.map((img) => (
                                <div key={img.id} className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
                                    <img src={img.image_url} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                        <button
                                            onClick={() => handleDelete(img.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg"
                                            title="Sil"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-white/90 rounded-md text-[10px] font-bold text-gray-700 shadow-sm">
                                        {img.duration} Sn.
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default NewSliderImage;
