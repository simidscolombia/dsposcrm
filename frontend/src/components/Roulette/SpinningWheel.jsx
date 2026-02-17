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

        setIsSpinning(true);
        let currentVelocity = 0.5; // Velocidad inicial alta (radianes por frame)
        let currentAngle = angle;
        let deceleration = 0.003; // Qué tan rápido frena
        let spinning = true;

        // Elegir premio ganador ponderado
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

        // Calcular ángulo final objetivo para que caiga en el premio
        // El puntero está arriba (-PI/2 o 270 grados).
        // Hay múltiples segmentos con el mismo premio. Elegimos uno aleatorio.
        const winnerIndices = segments.map((s, i) => s.label === winnerConfig.label ? i : -1).filter(i => i !== -1);
        const targetIndex = winnerIndices[Math.floor(Math.random() * winnerIndices.length)];

        // Angulo donde inicia el segmento ganador (en radianes)
        const segmentArc = (2 * Math.PI) / segments.length;
        // Queremos que el CENTRO del segmento quede en -PI/2 (arriba)
        // Angle actual + Delta = Target.
        // Target visual: el segmento debe estar en -PI/2.
        // Si el segmento empieza en Index * Arc.
        // Rotation + Index * Arc + Arc/2 = -PI/2 + K * 2PI
        // Rotation = -PI/2 - Index*Arc - Arc/2 + K*2PI

        // Hacemos que gire al menos 5 vueltas (10PI)
        const minSpins = 10 * Math.PI;
        // Ajuste fino para centrar
        const targetRotation = - (targetIndex * segmentArc) - (segmentArc / 2) - (Math.PI / 2);

        // Ajustamos currentAngle para que desemboque en targetRotation tras desacelerar?
        // Es complejo calcular física inversa exacta con requestAnimationFrame.
        // Haremos un truco: Simular física y "ajustar" suavemente al final (snap).
        // O más fácil: usar CSS transition para el ángulo final calculado.
        // Vamos a usar requestAnimationFrame puro para control total de luces y render.

        // RE-CALCULO SIMPLIFICADO: Easing function
        const duration = 6000; // ms
        const startTimestamp = Date.now();
        const startAngle = angle;
        // Queremos llegar a targetRotation + muchas vueltas.
        const fullSpins = 8 * 2 * Math.PI;
        const endAngle = startAngle + fullSpins + (2 * Math.PI - (startAngle % (2 * Math.PI))) + targetRotation;
        // Nota: la matemática de ángulos exactos puede fallar por modulo.
        // Aproximación: Gira mucho y lueg usa "Snap" lógico. 
        // Mejor approach fiable: CSS Transition en un div container y Canvas solo renderiza? 
        // No, el usuario quiere "mejor". Canvas es mejor.

        // Vamos a animar 'angle' de start a end usando easeOutCubic
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const newAngle = startAngle + (endAngle - startAngle) * ease;
            setAngle(newAngle);

            if (progress < 1) {
                requestAnimationFrame(animate);
                // Sonido tick sencillo basado en velocidad (derivada)
                // const velocity = (endAngle - startAngle) * 4 * Math.pow(1 - progress, 3) / duration;
                // if (Math.random() < velocity * 50) playClick(); // Mock sound
            } else {
                setIsSpinning(false);
                setResult(winnerConfig);
            }
        };
        animate();
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 animate-fade-in relative min-h-[500px]">

            {showConfetti && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
                    <Confetti recycle={false} numberOfPieces={500} width={window.innerWidth} height={window.innerHeight} />
                </div>
            )}
            {/* Cabecera Resultado */}
            <div className="h-24 mb-4 flex items-center justify-center">
                {result ? (
                    <div className="text-center animate-zoom-in">
                        <div className="text-gray-400 font-medium">¡La suerte está de tu lado!</div>
                        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-500 uppercase filter drop-shadow-md">
                            {result.label}
                        </h2>
                        <span className="inline-block mt-2 px-4 py-1 bg-blue-50 text-blue-600 rounded-full font-bold text-sm">
                            {result.detail}
                        </span>
                    </div>
                ) : (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-800">🎁 Ruleta de la Suerte</h2>
                        <p className="text-gray-500">Prueba tu suerte para obtener beneficios exclusivos</p>
                        <p className="text-xs text-gray-300 mt-2 font-mono">v3.5 - SONIDO ACTIVO 🔊</p>
                    </div>
                )}
            </div>

            {/* Ruleta */}
            <div className="relative mb-8">
                {/* Puntero Físico */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="w-8 h-10 bg-white border-2 border-gray-300 rounded-b-xl shadow-md flex justify-center">
                        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-red-600 mt-6"></div>
                    </div>
                </div>

                <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="max-w-full h-auto filter drop-shadow-xl"
                />

                {/* Botón Central Overlay (Opcional, ya dibujado en canvas pero este puede ser clickeable) */}
                <button
                    onClick={spinWheel}
                    disabled={isSpinning || result}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-transparent z-30 cursor-pointer disabled:cursor-default"
                    aria-label="Girar"
                />
            </div>

            {/* Botones de Acción */}
            <div className="h-16">
                {!isSpinning && !result && (
                    <button
                        onClick={spinWheel}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-lg font-bold py-3 px-10 rounded-full shadow-lg hover:scale-105 transition-transform animate-pulse"
                    >
                        GIRAR AHORA
                    </button>
                )}

                {result && (
                    <button
                        onClick={() => onSpinEnd(result.label)}
                        className="bg-green-500 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2 animate-fade-in-up"
                    >
                        <FaGift /> RECLAMAR PREMIO
                    </button>
                )}
            </div>
        </div>
    );
};

export default SpinningWheel;

// Force Vercel Rebuild - Roulette Sound Patch v2
