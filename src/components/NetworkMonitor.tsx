import React, { useState, useEffect, useRef } from 'react';
import { NetworkPacket, SyncProtocol } from '../types';
import { Circle, Terminal, Wifi, Database, Filter, Layers, Clock } from 'lucide-react';

interface NetworkMonitorProps {
  packets: NetworkPacket[];
  timeSyncMode: SyncProtocol;
  timeSyncAccuracy: string;
  isSyncLost: boolean;
  activeFault: string;
  gridFreq: number;
}

export default function NetworkMonitor({
  packets,
  timeSyncMode,
  timeSyncAccuracy,
  isSyncLost,
  activeFault,
  gridFreq,
}: NetworkMonitorProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'GOOSE' | 'SV' | 'MMS' | 'PTP'>('ALL');
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  
  // Waveform oscilloscope animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseOffsetRef = useRef<number>(0);

  // Filter packets
  const filteredPackets = packets.filter(p => {
    if (activeTab === 'ALL') return true;
    return p.protocol === activeTab;
  });

  // Select the latest packet if none is selected
  useEffect(() => {
    if (packets.length > 0 && !selectedPacket) {
      setSelectedPacket(packets[0]);
    }
  }, [packets, selectedPacket]);

  // Draw Sampled Values (SV) Waveforms on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const draw = () => {
      if (!canvas || !ctx || !isRunning) return;

      // Solid dark background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 0.5;
      
      // Horizontal centers
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Horizontal auxiliary divs
      for (let i = 1; i < 4; i++) {
        const y = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Vertical divisions
      for (let i = 1; i <= 8; i++) {
        const x = (canvas.width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Physics variables for wave plotting
      const ampAC = canvas.height * 0.18; // AC 3-phase amplitude
      const ampDC = canvas.height * 0.12; // DC ripple amplitude
      const centerY_AC = canvas.height * 0.35; // Top half for AC MU waves
      const centerY_DC = canvas.height * 0.75; // Bottom half for 800V DC bus representation

      // Sync Phase Jitter multiplier based on synchronization mode
      // PTP: perfect, NTP: introduces noise/jitter
      let jitter = 0;
      if (isSyncLost) {
        jitter = Math.random() * 4.0;
      } else if (timeSyncMode === 'NTP') {
        jitter = Math.sin(phaseOffsetRef.current * 5) * 1.5;
      } else if (timeSyncMode === 'IRIG-B') {
        jitter = Math.sin(phaseOffsetRef.current * 10) * 0.3;
      }

      // Draw Phase A (Cyan)
      ctx.beginPath();
      ctx.strokeStyle = activeFault === 'Curto AC 138kV' ? '#ef4444' : '#22d3ee';
      ctx.lineWidth = 1.8;
      for (let x = 0; x < canvas.width; x++) {
        // Calculate phase
        const phase = (x / canvas.width) * Math.PI * 4 * (gridFreq / 60) + phaseOffsetRef.current;
        const faultFactor = activeFault === 'Curto AC 138kV' ? (0.05 + Math.random() * 0.08) : 1.0;
        const y = centerY_AC + Math.sin(phase) * ampAC * faultFactor + (Math.random() * jitter * 0.8);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Phase B (Magenta/Yellow depending on visual standard) - Yellow
      ctx.beginPath();
      ctx.strokeStyle = activeFault === 'Curto AC 138kV' ? '#ef4444' : '#eab308';
      ctx.lineWidth = 1.8;
      for (let x = 0; x < canvas.width; x++) {
        const phase = (x / canvas.width) * Math.PI * 4 * (gridFreq / 60) + phaseOffsetRef.current + (2 * Math.PI) / 3;
        const faultFactor = activeFault === 'Curto AC 138kV' ? (0.05 + Math.random() * 0.05) : 1.0;
        const y = centerY_AC + Math.sin(phase) * ampAC * faultFactor + (Math.random() * jitter * 0.8);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Phase C (White/Blue) - Bright Blue
      ctx.beginPath();
      ctx.strokeStyle = activeFault === 'Curto AC 138kV' ? '#ef4444' : '#ec4899';
      ctx.lineWidth = 1.8;
      for (let x = 0; x < canvas.width; x++) {
        const phase = (x / canvas.width) * Math.PI * 4 * (gridFreq / 60) + phaseOffsetRef.current + (4 * Math.PI) / 3;
        const faultFactor = activeFault === 'Curto AC 138kV' ? (0.05 + Math.random() * 0.05) : 1.0;
        const y = centerY_AC + Math.sin(phase) * ampAC * faultFactor + (Math.random() * jitter * 0.8);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Label AC Merging Unit Waveform
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`9-2 LE (SV) 3-Phase AC Merging Unit [80 amostras/ciclo] ${activeFault === 'Curto AC 138kV' ? 'FALHA DE SURTO' : ''}`, 10, 18);

      // Draw 800V DC Bus waveform (with rectifying switching ripples)
      ctx.beginPath();
      ctx.strokeStyle = activeFault === 'Curto Barramento 800VDC' ? '#f87171' : '#f97316';
      ctx.lineWidth = 2.0;

      for (let x = 0; x < canvas.width; x++) {
        const theta = (x / canvas.width) * Math.PI * 24 + phaseOffsetRef.current * 3;
        // Ripple on DC is standard 3-phase rectified pulse (6 ripples per AC cycle)
        const acPhase = (x / canvas.width) * Math.PI * 4 + phaseOffsetRef.current;
        const sixPulseRipple = Math.abs(Math.sin(acPhase * 3)) * 4;
        
        let faultDCfactor = 1.0;
        if (activeFault === 'Curto Barramento 800VDC') {
          faultDCfactor = 0.03 + (Math.random() * 0.05); // Collapsed
        }
        
        // Add harmonic noise based on sync mode
        const syncNoiseVal = (timeSyncMode === 'NTP' || isSyncLost) ? (Math.sin(theta * 0.5) * 3) : 0;
        
        const y = centerY_DC - (24 * faultDCfactor) + sixPulseRipple * faultDCfactor + syncNoiseVal + (Math.random() * jitter * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Label DC Waveform
      ctx.fillStyle = '#fb923c';
      ctx.fillText(`Mapeamento SV 800Vcc Estabilidade do Barramento: ${activeFault === 'Curto Barramento 800VDC' ? 'Surtado a Terra' : 'Estável'}`, 10, canvas.height - 18);

      // Increment phase offset
      phaseOffsetRef.current -= 0.08;
      
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeFault, gridFreq, timeSyncMode, isSyncLost]);
  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#262626] p-4 h-full flex flex-col">
      
      {/* Scope Details Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-300 font-sans flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          Osciloscópio Digital & Protocolos (IEC 61850)
        </h3>
        
        <div className="flex items-center gap-2 bg-[#050505] border border-[#262626] p-1 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 px-2 font-semibold">T-SYNC:</span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            isSyncLost 
              ? 'bg-[#0e0202] text-red-400 border border-red-950/20' 
              : 'bg-[#020d09] text-emerald-450 border border-emerald-950/20'
          }`}>
            {timeSyncMode} ({timeSyncAccuracy})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-grow">
        
        {/* Real-time Oscilloscope Waves (Left 7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="relative border border-[#262626]/80 rounded-lg overflow-hidden bg-[#050505] flex-grow min-h-[220px]">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full block" 
              width={540} 
              height={260} 
            />
            {isSyncLost && (
              <div className="absolute top-2 right-2 bg-red-950/90 border border-red-900/60 text-red-200 text-[10px] font-mono font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1">
                <Clock className="h-3 w-3 animate-spin text-red-550" /> ALINHAMENTO FALSEADO (SYNC ERRO)
              </div>
            )}
            
            {/* Visual labels overlay */}
            <div className="absolute right-3 bottom-12 text-[10px] font-mono text-slate-500 text-right">
              <div>PTP Target: Sub-μs</div>
              <div>Ripples CC: 360Hz</div>
            </div>
          </div>

          <div className="bg-[#050505]/50 border border-[#262626] p-2.5 rounded-lg text-xs text-slate-400 leading-relaxed font-sans">
            <span className="text-amber-400 font-semibold font-mono">Process Bus Analisador:</span> O osciloscópio renderiza o tráfego continuo de <strong>Sampled Values (SV - IEC 61850-9-2LE)</strong>. IEDs processam em tempo real estas senoides digitais para disparar teleproteções <strong>GOOSE</strong>. O protocolo <strong>PTP (IEEE 1588)</strong> garante que os amostradores publiquem alinhados no mesmo instante absoluto.
          </div>
        </div>

        {/* Real-time IEC 61850 Packet Stream (Right 5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-3 min-h-[300px]">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-1 bg-[#050505] p-1.5 rounded-lg border border-[#262626]">
            <span className="text-[10px] font-mono text-slate-500 px-1 font-semibold flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filtro:
            </span>
            {(['ALL', 'GOOSE', 'SV', 'MMS', 'PTP'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer transition-colors ${
                  activeTab === tab
                    ? 'bg-[#262626] border border-[#3f3f3f] text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a1a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Packet scrolling terminal list */}
          <div className="border border-[#262626]/80 bg-[#050505] rounded-lg flex-grow overflow-y-auto max-h-[160px] font-mono text-[10px] space-y-1 p-2 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredPackets.map(p => {
              const protocolColors: Record<string, string> = {
                GOGOOSE: 'text-rose-400 bg-rose-950/20 border-rose-900/40',
                GOOSE: 'text-rose-455 bg-rose-950/10 border-rose-950/20',
                SV: 'text-cyan-455 bg-cyan-950/10 border-cyan-950/20',
                MMS: 'text-emerald-455 bg-emerald-950/10 border-emerald-950/20',
                PTP: 'text-violet-455 bg-violet-950/10 border-violet-950/20',
              };

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPacket(p)}
                  className={`p-1.5 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                    selectedPacket?.id === p.id 
                      ? 'border-[#444444] bg-[#1a1a1a] text-slate-100' 
                      : 'border-transparent hover:bg-[#151515] text-slate-350'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`px-1.5 py-0.5 rounded-[3px] font-extrabold text-[8px] border ${protocolColors[p.protocol] || 'text-slate-400'}`}>
                      {p.protocol}
                    </span>
                    <span className="text-slate-500 text-[8px] flex-shrink-0">{p.timestamp}</span>
                    <span className="truncate">{p.description}</span>
                  </div>
                  {p.isAlert && <Circle className="h-2 w-2 rounded-full fill-red-500 text-red-500 animate-ping flex-shrink-0" />}
                </div>
              );
            })}
            
            {filteredPackets.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">Sem pacotes salvos nesta categoria</div>
            )}
          </div>

          {/* Detailed decoded Packet Payload Inspector */}
          {selectedPacket && (
            <div className="bg-[#050505] border border-[#262626] rounded-lg p-2.5 flex-grow-0 min-h-[140px] flex flex-col justify-between font-mono">
              <div>
                <div className="flex justify-between items-center text-[9px] text-slate-550 border-b border-[#262626]/50 pb-1 mb-1.5">
                  <span className="flex items-center gap-1 text-slate-300 font-bold uppercase tracking-wider">
                    <Terminal className="h-3.5 w-3.5 text-orange-400" /> Detalhes do Pacote {selectedPacket.protocol}
                  </span>
                  <span>ID: {selectedPacket.id}</span>
                </div>
                
                <div className="text-[10px] space-y-1 text-slate-350">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Origem:</span>
                    <span className="text-slate-200">{selectedPacket.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destino:</span>
                    <span className="text-slate-200">{selectedPacket.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Timestamp:</span>
                    <span className="text-cyan-400 font-bold">{selectedPacket.timestamp}</span>
                  </div>

                  {/* Decoded structured Payload block */}
                  <div className="mt-2 bg-[#000000] p-1.5 rounded border border-[#262626]/60 text-slate-400 text-[9px]">
                    <span className="text-slate-500 font-bold">Payload Decoded:</span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1">
                      {Object.entries(selectedPacket.payload).map(([k, v]) => (
                        <React.Fragment key={k}>
                          <span className="text-slate-500 truncate">{k}:</span>
                          <span className={`truncate text-right ${typeof v === 'boolean' && v ? 'text-rose-400 font-bold' : 'text-slate-200'}`}>
                            {v.toString()}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
