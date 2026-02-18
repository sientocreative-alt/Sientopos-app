import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as QRCode from 'qrcode.react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StaffQR = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [timeLeft, setTimeLeft] = useState(7000); // 7 seconds in ms
    const [qrValue, setQrValue] = useState('');
    const [mode, setMode] = useState('ATTENDANCE'); // ATTENDANCE or BREAK
    const REFRESH_INTERVAL = 7000;
    const STEP = 100;

    // Use QRCodeSVG if available, fallback to nothing if error
    const QRCodeComponent = QRCode.QRCodeSVG || QRCode.default || 'div';

    const generateNewQR = () => {
        if (!user?.business_id) return;
        const timestamp = Date.now();
        const newValue = `STAFF_ATTENDANCE|${user.business_id}|${timestamp}|${mode}`;
        setQrValue(newValue);
        setTimeLeft(REFRESH_INTERVAL);
    };

    useEffect(() => {
        if (!loading && user?.business_id) {
            generateNewQR();
        }
    }, [user, mode, loading]);

    useEffect(() => {
        if (loading) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    generateNewQR();
                    return REFRESH_INTERVAL;
                }
                return prev - STEP;
            });
        }, STEP);

        return () => clearInterval(timer);
    }, [mode, user, loading]);

    if (loading) {
        return <div className="p-12 text-center text-gray-500">Yükleniyor...</div>;
    }

    const progress = (timeLeft / REFRESH_INTERVAL) * 100;

    return (
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center relative">
            {/* Back Button */}
            <button
                onClick={() => navigate('/isletme')}
                className="absolute top-6 left-6 p-3 bg-white rounded-2xl shadow-lg text-gray-400 hover:text-gray-600 transition-all z-40 active:scale-95 group"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            {/* Countdown Progress Bar */}
            <div className="w-full h-2 bg-gray-200 sticky top-0 z-30">
                <div
                    className="h-full bg-[#2DD4BF] transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl">
                {/* Debug identifier */}
                <span className="sr-only">StaffQR Component Mounted</span>
                {/* Business Name */}
                <h1 className="text-2xl font-bold text-gray-700 mb-8 tracking-tight">
                    {user?.businesses?.name || 'SientoPOS'}
                </h1>

                {/* QR Container */}
                <div className="bg-white p-8 rounded-[32px] shadow-2xl mb-8 border border-white">
                    <div className="bg-white p-4">
                        {qrValue ? (
                            <QRCodeComponent
                                value={qrValue}
                                size={256}
                                level="H"
                            />
                        ) : (
                            <div className="w-[256px] h-[256px] flex items-center justify-center text-gray-400">
                                QR Oluşturuluyor...
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Label */}
                <div className="text-center mb-10">
                    <p className="text-xl font-bold text-gray-700">
                        Gösterilen Kod: {mode === 'ATTENDANCE' ? 'Mesai Giriş Çıkış' : 'Mola Başlat / Bitir'}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={generateNewQR}
                        className="flex items-center gap-2 bg-[#3B82F6] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                    >
                        <RefreshCw size={18} className={timeLeft < 500 ? 'animate-spin' : ''} />
                        Yenile
                    </button>

                    <button
                        onClick={() => setMode('ATTENDANCE')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${mode === 'ATTENDANCE'
                            ? 'bg-[#3B82F6] text-white shadow-blue-200'
                            : 'bg-white text-[#3B82F6] hover:bg-gray-50'
                            }`}
                    >
                        Mesai Giriş / Çıkış
                    </button>

                    <button
                        onClick={() => setMode('BREAK')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 ${mode === 'BREAK'
                            ? 'bg-[#3B82F6] text-white shadow-blue-200'
                            : 'bg-white text-[#3B82F6] hover:bg-gray-50'
                            }`}
                    >
                        Mola Başlat / Bitir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffQR;
