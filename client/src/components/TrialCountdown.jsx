import { useState, useEffect } from 'react';

const TrialCountdown = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(endDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    return (
        <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 rounded-xl px-6 py-4 shadow-sm mb-8">
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-orange-600 leading-none">{timeLeft.days}</span>
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter">GÜN</span>
                </div>
                <div className="w-px h-6 bg-orange-200" />
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-orange-600 leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter">SAAT</span>
                </div>
                <div className="w-px h-6 bg-orange-200" />
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-orange-600 leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter">DAKİKA</span>
                </div>
                <div className="w-px h-6 bg-orange-200" />
                <div className="flex flex-col items-center">
                    <span className="text-xl font-bold text-orange-600 leading-none text-orange-500">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tighter">SANİYE</span>
                </div>
            </div>

            <div className="ml-2 mr-4">
                <p className="text-[13px] font-bold text-orange-800">Deneme süreniz doluyor!</p>
                <p className="text-[11px] font-medium text-orange-600/80">Kısıtlanmamak için aboneliğinizi başlatın.</p>
            </div>

            <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg shadow-green-200 active:scale-95 ml-auto">
                Aboneliği Başlat
            </button>
        </div>
    );
};

export default TrialCountdown;
