
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPlay, FaGift, FaStar } from 'react-icons/fa';
import Confetti from 'react-confetti';

const SpinningWheel = ({ onSpinEnd, cartCategories = [] }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);

    // Configuración Dinámica de Premios
    const [prizesConfig, setPrizesConfig] = useState([]);
    const [loadingPrizes, setLoadingPrizes] = useState(true);

    const canvasRef = useRef(null);
    const audioCtxRef = useRef(null);
    const lastTickRef = useRef(0);

    const COLORS = ['#E74C3C', '#2ECC71', '#F1C40F', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C', '#34495E'];

    // Cargar Premios desde API
    useEffect(() => {
        const fetchPrizes = async () => {
            // Fallback default
            const defaultPrizes = [
                { label: '5% OFF', color: '#E74C3C', text: '#FFFFFF', weight: 40, detail: 'Descuento Licencia' },
                { label: 'KIT INICIO', color: '#34495E', text: '#FFFFFF', weight: 20, detail: 'Rollos + Cables' },
                { label: '10% OFF', color: '#F1C40F', text: '#2C3E50', weight: 15, detail: 'Descuento Combo' },
                { label: 'SETUP FREE', color: '#2ECC71', text: '#FFFFFF', weight: 10, detail: 'Instalación Gratis' },
                { label: 'MES GRATIS', color: '#9B59B6', text: '#FFFFFF', weight: 5, detail: 'Soporte Premium' },
                { label: 'CAPACITA', color: '#E67E22', text: '#FFFFFF', weight: 10, detail: 'Sesión Extra' }
            ];

            try {
                const API_URL = '';
                // If cartCategories provided, fetch filtered prizes
                const url = cartCategories.length > 0
                    ? `${API_URL}/prizes/by-categories?categories=${cartCategories.join(',')}`
                    : `${API_URL}/prizes`;
                const res = await axios.get(url);
                console.log('Roulette Prizes Response:', res.data); // Debug

                if (res.data.success && res.data.prizes && res.data.prizes.length > 0) {
                    const activePrizes = res.data.prizes.filter(p => p.is_active);

                    if (activePrizes.length > 0) {
                        const mappedPrizes = activePrizes.map((p, index) => ({
                            label: p.name,
                            color: COLORS[index % COLORS.length], // Ciclar colores
                            text: (index % COLORS.length === 2) ? '#2C3E50' : '#FFFFFF', // Amarillo con texto oscuro
                            weight: p.probability,
                            detail: p.description || p.value,     // Descripción o Valor
                            icon: p.icon || '🎁'
                        }));
                        setPrizesConfig(mappedPrizes);
                    } else {
                        setPrizesConfig(defaultPrizes);
                    }
                } else {
                    setPrizesConfig(defaultPrizes);
                }
            } catch (error) {
                console.error('Error fetching roulette prizes:', error);
                setPrizesConfig(defaultPrizes);
            } finally {
                setLoadingPrizes(false);
            }
        };
        fetchPrizes();
    }, []);

    // Inicializar Audio Context
    useEffect(() => {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        return () => {
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                // audioCtxRef.current.close().catch(e => console.log(e)); 
                // Avoid cleanup error if context is pending
            }
        };
    }, []);

    // Función para sonido "Tick" (Click de ruleta)
    const playTick = () => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

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
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    };

    // Construir Segmentos Dinámicos
    const segments = [];
    if (prizesConfig.length > 0) {
        // Asegurar que haya suficientes segmentos visuales (min 6-8)
        let repeatCount = 1;
        if (prizesConfig.length <= 2) repeatCount = 4;
        else if (prizesConfig.length <= 4) repeatCount = 2;

        for (let i = 0; i < repeatCount; i++) {
            prizesConfig.forEach(p => segments.push(p));
        }
    }

    // Estado de animación
    const [angle, setAngle] = useState(0);

    // Dibujar la ruleta en Canvas
    useEffect(() => {
        if (loadingPrizes || prizesConfig.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 20; // Margen para luces

        // Si no hay segmentos, no dibujar nada o dibujar error
        if (segments.length === 0) return;

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
            ctx.font = 'bold 13px Arial'; // Reduce font slightly for longer names

            // Truncate text if too long
            let label = seg.label;
            if (label.length > 15) label = label.substring(0, 12) + '...';

            ctx.fillText(label, radius - 10, 5);
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

    }, [angle, isSpinning, segments, loadingPrizes, prizesConfig]);


    // Lógica de Giro
    const spinWheel = () => {
        if (isSpinning || result || loadingPrizes) return;

        // Resume Audio Context
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }

        setIsSpinning(true);
        setResult(null);

        // Lógica de Ganador (Usando pesos reales de la API)
        // Para asegurar que coincida con DB, recalcular pesos.
        // OJO: segments puede tener duplicados. Debemos elegir un segmento ganador.

        // 1. Elegir PREMIO ganador basado en pesos únicos (prizesConfig)
        const totalWeight = prizesConfig.reduce((acc, p) => acc + (p.weight || 0), 0);
        let random = Math.random() * totalWeight;
        let winnerPrize = prizesConfig[0];

        for (const prize of prizesConfig) {
            if (random < prize.weight) {
                winnerPrize = prize;
                break;
            }
            random -= prize.weight;
        }

        // 2. Encontrar todos los índices en los SEGMENTOS que corresponden a ese premio ganador
        const winnerIndices = segments.map((s, i) => s.label === winnerPrize.label ? i : -1).filter(i => i !== -1);

        // 3. Elegir uno de esos segmentos al azar
        const targetIndex = winnerIndices[Math.floor(Math.random() * winnerIndices.length)];

        const segmentArc = (2 * Math.PI) / segments.length;

        const minSpins = 5 * 2 * Math.PI; // 5 vueltas mínimo (más rápido)
        // Calcular rotación objetivo para que la aguja (arriba - PI/2) caiga en el centro del segmento
        const targetRotation = minSpins - (targetIndex * segmentArc) - (segmentArc / 2) - (Math.PI / 2);

        // Ajustar desde el ángulo actual para que sea suave
        // IMPORTANTE: angle crece negativamente o positivamente?
        // Queremos girar horario (positivo?).
        // Si angle es 0, targetRotation será negativo (anti-horario??).
        // Vamos a sumar 2PI varias veces.

        const startAngle = angle % (2 * Math.PI);
        const finalAngle = startAngle + (10 * 2 * Math.PI) + (2 * Math.PI - (targetIndex * segmentArc) - (segmentArc / 2) - (Math.PI / 2));
        // Simplificado: Gira mucho (10 vueltas) + offset

        const duration = 6000; // 6 Segundos
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
                    setResult(winnerPrize); // Guardar el objeto premio completo
                    setShowConfetti(true);
                    setShowGiftModal(true);
                }, 500);
            }
        };

        animate();
    };

    if (loadingPrizes) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-gray-500 font-medium">Cargando premios...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-4 md:p-6 animate-fade-in relative min-h-[500px] w-full">
            {/* Confeti Global - Fixed */}
            {showConfetti && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000, pointerEvents: 'none' }}>
                    <Confetti recycle={false} numberOfPieces={500} width={window.innerWidth} height={window.innerHeight} />
                </div>
            )}

            {/* Cabecera Inicial (Oculta si hay modal) */}
            {!result && !isSpinning && !showGiftModal && (
                <div className="text-center mb-6 px-4">
                    <h2 className="text-xl md:text-3xl font-bold text-gray-800">🎁 Ruleta de la Suerte</h2>
                    <p className="text-xs md:text-base text-gray-500 mt-1">Prueba tu suerte y gana beneficios</p>
                </div>
            )}

            {/* Mensaje de Ánimo */}
            {isSpinning && (
                <div className="text-center mb-6 animate-pulse">
                    <h2 className="text-xl md:text-3xl font-bold text-blue-600">¡Girando...! 🤞</h2>
                </div>
            )}

            {/* Ruleta Responsive */}
            <div className={`relative mb-8 transition-all duration-1000 w-full flex justify-center ${showGiftModal ? 'scale-90 blur-sm opacity-50' : 'scale-100'}`}>
                <div className="relative w-full max-w-[320px] md:max-w-[400px] aspect-square">
                    {/* Puntero Físico */}
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-20">
                        <div className="w-0 h-0 border-l-[12px] md:border-l-[15px] border-l-transparent border-r-[12px] md:border-r-[15px] border-r-transparent border-t-[20px] md:border-t-[25px] border-t-red-600"></div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain filter drop-shadow-xl md:drop-shadow-2xl"
                    />

                    <button
                        onClick={spinWheel} disabled={isSpinning || result}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-20 md:h-20 rounded-full bg-transparent z-30 cursor-pointer"
                        aria-label="Girar"
                    />
                </div>
            </div>

            {/* Botón Girar Inicial */}
            {!isSpinning && !result && !showGiftModal && (
                <button
                    onClick={spinWheel}
                    className="w-[90%] md:w-auto bg-gradient-to-r from-red-500 to-pink-600 text-white text-base md:text-xl font-bold py-4 px-8 md:px-12 rounded-full shadow-xl hover:scale-105 transition-transform active:scale-95"
                >
                    GIRAR AHORA
                </button>
            )}

            {/* MODAL DE REGALO (Fixed Overlay - Mobile Optimized) */}
            {showGiftModal && result && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }} className="animate-fade-in p-4">

                    <div className="bg-white/95 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-2xl text-center border-4 border-yellow-400 w-full max-w-sm relative animate-pop-in mx-auto">

                        <div className="text-5xl md:text-8xl mb-4 md:mb-6 animate-bounce text-yellow-500 mx-auto drop-shadow-md">
                            {result.icon || '🎁'}
                        </div>

                        <h2 className="text-2xl md:text-5xl font-black text-gray-800 mb-2 tracking-tight">
                            ¡GANASTE!
                        </h2>

                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl md:text-4xl font-black py-2 px-4 md:py-4 md:px-6 rounded-2xl shadow-inner mb-4 md:mb-6 transform -rotate-2 mt-2 md:mt-4 inline-block border-2 border-white/50 break-words max-w-full">
                            {result.label}
                        </div>

                        <p className="text-gray-600 text-sm md:text-lg mb-6 md:mb-8 font-medium px-2">
                            {result.detail}
                        </p>

                        <button
                            onClick={() => onSpinEnd(result)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white text-base md:text-xl font-bold py-4 md:py-5 px-6 rounded-xl shadow-xl hover:shadow-2xl active:translate-y-1 transition-all flex items-center justify-center gap-2 md:gap-3"
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
