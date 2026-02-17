import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaGift, FaStar } from 'react-icons/fa';
import Confetti from 'react-confetti';

const SpinningWheel = ({ onSpinEnd }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);

    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const lastTickRef = useRef(0);

    // Inicializar Audio Context
    useEffect(() => {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        return () => {
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, []);

    // Función para sonido "Tick" (Click de ruleta)
    const playTick = () => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;

        // Oscilador para sonido de "golpe" seco
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Frecuencia que baja rápido (efecto 'tud')
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

        // Volumen corto
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    };

    // Configuración de Premios
    const prizesConfig = [
        { label: '5% OFF', color: '#E74C3C', text: '#FFFFFF', weight: 40, detail: 'Descuento Licencia' },
        { label: 'KIT INICIO', color: '#34495E', text: '#FFFFFF', weight: 20, detail: 'Rollos + Cables' },
        { label: '10% OFF', color: '#F1C40F', text: '#2C3E50', weight: 15, detail: 'Descuento Combo' },
        { label: 'SETUP FREE', color: '#2ECC71', text: '#FFFFFF', weight: 10, detail: 'Instalación Gratis' },
        { label: 'MES GRATIS', color: '#9B59B6', text: '#FFFFFF', weight: 5, detail: 'Soporte Premium' },
        { label: 'CAPACITA', color: '#E67E22', text: '#FFFFFF', weight: 10, detail: 'Sesión Extra' }
    ];

    const segments = [];
    const repeatCount = 4;
    for (let i = 0; i < repeatCount; i++) {
        prizesConfig.forEach(p => segments.push(p));
    }

    // Estado de animación
    const [angle, setAngle] = useState(0);

    // Dibujar la ruleta en Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 20; // Margen para luces
        const segmentAngle = (2 * Math.PI) / segments.length;

        // Limpiar
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar borde externo (Carcasa)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 15, 0, 2 * Math.PI);
        ctx.fillStyle = '#2C3E50'; // Gris oscuuro
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#F1C40F'; // Borde dorado
        ctx.stroke();

        // Dibujar luces (puntos alrededor)
        const totalLights = 24;
        for (let i = 0; i < totalLights; i++) {
            const lightAngle = (i / totalLights) * 2 * Math.PI;
            const lx = centerX + (radius + 8) * Math.cos(lightAngle);
            const ly = centerY + (radius + 8) * Math.sin(lightAngle);
            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
            // Luces parpadeantes si gira
            ctx.fillStyle = isSpinning && i % 2 === Math.floor(Date.now() / 100) % 2 ? '#FFF' : '#F1C40F';
            ctx.fill();
        }

        // Rotar el contexto para girar la rueda
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);

        // Dibujar segmentos
        segments.forEach((seg, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.fillStyle = seg.color;
            ctx.fill();
            ctx.stroke();

            // Texto del segmento
            ctx.save();
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = seg.text;
            ctx.font = 'bold 14px Arial';
            ctx.fillText(seg.label, radius - 10, 5);
            ctx.restore();
        });

        // Centro Blanco
        ctx.restore(); // Restaurar rotación para dibujar centro estático (opcional, o rotar centro también)

        // Dibujamos el centro encima de todo
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        ctx.fillStyle = '#2C3E50';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', centerX, centerY);

    }, [angle, isSpinning, segments]);


    // Lógica de Giro
    const spinWheel = () => {
        if (isSpinning || result) return;

        // Resume Audio Context
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        setIsSpinning(true);
        setResult(null);

        // Lógica de Ganador
        const totalWeight = prizesConfig.reduce((acc, p) => acc + p.weight, 0);
        let random = Math.random() * totalWeight;
        let winnerConfig = prizesConfig[0];
        for (const prize of prizesConfig) {
            if (random < prize.weight) {
                winnerConfig = prize;
                break;
            }
            random -= prize.weight;
        }

        const winnerIndices = segments.map((s, i) => s.label === winnerConfig.label ? i : -1).filter(i => i !== -1);
        const targetIndex = winnerIndices[Math.floor(Math.random() * winnerIndices.length)];
        const segmentArc = (2 * Math.PI) / segments.length;

        const minSpins = 10 * 2 * Math.PI; // 10 vueltas
        const targetRotation = minSpins - (targetIndex * segmentArc) - (segmentArc / 2) - (Math.PI / 2);

        const startAngle = angle % (2 * Math.PI);
        const finalAngle = startAngle + targetRotation + (2 * Math.PI * 2);

        const duration = 8500; // 8.5 Segundos (Suspenso total)
        const startTimestamp = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Quint (Muy lento al final)
            const ease = 1 - Math.pow(1 - progress, 5);

            const currentAngle = startAngle + (finalAngle - startAngle) * ease;
            setAngle(currentAngle);

            const currentTick = Math.floor(currentAngle / segmentArc);
            if (currentTick > lastTickRef.current) {
                playTick();
                lastTickRef.current = currentTick;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setIsSpinning(false);
                // Pequeña pausa dramática antes del POP
                setTimeout(() => {
                    setResult(winnerConfig);
                    setShowConfetti(true);
                    setShowGiftModal(true);
                }, 800);
            }
        };

        animate();
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 animate-fade-in relative min-h-[500px]">
            {/* Confeti Global - Fixed */}
            {showConfetti && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000, pointerEvents: 'none' }}>
                    <Confetti recycle={false} numberOfPieces={500} width={window.innerWidth} height={window.innerHeight} />
                </div>
            )}

            {/* Cabecera Inicial (Oculta si hay modal) */}
            {!result && !isSpinning && !showGiftModal && (
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">🎁 Ruleta de la Suerte</h2>
                    <p className="text-gray-500">Prueba tu suerte y gana beneficios</p>
                    <p className="text-xs text-green-500 mt-2 font-mono font-bold">SUSPENSO EDITION v4.1 🐢</p>
                </div>
            )}

            {/* Mensaje de Ánimo */}
            {isSpinning && (
                <div className="text-center mb-6 animate-pulse">
                    <h2 className="text-3xl font-bold text-blue-600">¡Girando...! 🤞</h2>
                </div>
            )}

            {/* Ruleta */}
            <div className={`relative mb-8 transition-all duration-1000 ${showGiftModal ? 'scale-90 blur-sm opacity-50' : 'scale-100'}`}>
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-600"></div>
                </div>
                <canvas ref={canvasRef} width={400} height={400} className="max-w-full h-auto filter drop-shadow-2xl" />
                <button
                    onClick={spinWheel} disabled={isSpinning || result}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-transparent z-30 cursor-pointer"
                    aria-label="Girar"
                />
            </div>

            {/* Botón Girar Inicial */}
            {!isSpinning && !result && !showGiftModal && (
                <button
                    onClick={spinWheel}
                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xl font-bold py-4 px-12 rounded-full shadow-xl hover:scale-105 transition-transform"
                >
                    GIRAR AHORA
                </button>
            )}

            {/* MODAL DE REGALO (Fixed Overlay) */}
            {showGiftModal && result && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }} className="animate-fade-in">

                    <div className="bg-white/95 backdrop-blur-md p-10 rounded-3xl shadow-2xl text-center border-4 border-yellow-400 max-w-sm mx-4 relative animate-pop-in">

                        <div className="text-8xl mb-6 animate-bounce text-yellow-500 mx-auto drop-shadow-md">
                            🎁
                        </div>

                        <h2 className="text-5xl font-black text-gray-800 mb-2 tracking-tight">
                            ¡GANASTE!
                        </h2>

                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-4xl font-black py-4 px-6 rounded-2xl shadow-inner mb-6 transform -rotate-2 mt-4 inline-block border-2 border-white/50">
                            {result.label}
                        </div>

                        <p className="text-gray-600 text-lg mb-8 font-medium">
                            {result.detail}
                        </p>

                        <button
                            onClick={() => onSpinEnd(result.label)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-5 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            RECLAMAR PREMIO <FaGift />
                        </button>
                    </div>
                </div>
            )}

            {/* Estilos CSS */}
            <style>{`
                @keyframes pop-in {
                    0% { transform: scale(0.5); opacity: 0; }
                    60% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-pop-in {
                    animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default SpinningWheel;
