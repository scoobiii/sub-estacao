import React, { useState, useEffect, useRef } from 'react';
import { ThermogramHotspot } from '../types';
import { ShieldCheck, Flame, Cpu, Eye, AlertTriangle } from 'lucide-react';

interface ThermalViewProps {
  hotspots: ThermogramHotspot[];
  onToggleContactResistance: (id: string) => void;
  simulatedFaultHotspots: Record<string, boolean>; // componentId: isActive
}

export default function ThermalView({
  hotspots,
  onToggleContactResistance,
  simulatedFaultHotspots,
}: ThermalViewProps) {
  const [selectedHopspotId, setSelectedHotspotId] = useState<string>('rect_joint');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedHotspot = hotspots.find(h => h.id === selectedHopspotId) || hotspots[0];

  // Draw simulated thermal graphic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Solid thermal-palette background
    // Cold areas are dark blue/violet
    ctx.fillStyle = '#0f0c24'; // Cold ambient deep violet
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render beautiful organic gradients representing thermal heat from surrounding machinery
    // Draw some cold background shapes (deep blue)
    ctx.fillStyle = '#1e1452';
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.4, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.7, 70, 0, Math.PI * 2);
    ctx.fill();

    // Render drawing of the physical metal busbars in deep magenta to orange
    // Drawing representing busbar shapes
    ctx.fillStyle = '#41106e'; // Warm metal backdrop
    ctx.fillRect(40, canvas.height / 2 - 15, canvas.width - 80, 24);

    // Draw the main rectifier or coupler box
    ctx.fillStyle = '#2f115a';
    ctx.fillRect(canvas.width / 2 - 50, canvas.height / 2 - 60, 100, 120);

    // Draw high temperature gradient on current selected hotspot position
    const radius = selectedHotspot.status === 'CRITICAL' ? 85 : selectedHotspot.status === 'WARM' ? 55 : 30;
    const brightness = selectedHotspot.status === 'CRITICAL' ? 1.0 : selectedHotspot.status === 'WARM' ? 0.7 : 0.45;

    // Create a radial heat gradient
    const grad = ctx.createRadialGradient(
      selectedHotspot.x, 
      selectedHotspot.y, 
      2, 
      selectedHotspot.x, 
      selectedHotspot.y, 
      radius
    );
    
    // Core white-hot
    grad.addColorStop(0.0, '#ffffff');
    // Intense bright yellow
    grad.addColorStop(0.15, '#fbbf24');
    // Glowing red-orange
    grad.addColorStop(0.4, '#f97316');
    // Vivid magenta
    grad.addColorStop(0.65, '#d946ef');
    // Warm violet fading to dark ambient
    grad.addColorStop(0.85, '#4c1d95');
    grad.addColorStop(1.0, '#0f0c24');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(selectedHotspot.x, selectedHotspot.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw thermal crosshair target target on joint
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    
    // Target Reticle
    ctx.beginPath();
    ctx.arc(selectedHotspot.x, selectedHotspot.y, 8, 0, Math.PI * 2);
    ctx.moveTo(selectedHotspot.x - 16, selectedHotspot.y);
    ctx.lineTo(selectedHotspot.x + 16, selectedHotspot.y);
    ctx.moveTo(selectedHotspot.x, selectedHotspot.y - 16);
    ctx.lineTo(selectedHotspot.x, selectedHotspot.y + 16);
    ctx.stroke();

    // Overlay temperature label near crosshair
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    const tempText = `${selectedHotspot.currentTemp.toFixed(1)}°C`;
    ctx.strokeText(tempText, selectedHotspot.x + 14, selectedHotspot.y - 10);
    ctx.fillText(tempText, selectedHotspot.x + 14, selectedHotspot.y - 10);

    // Draw color reference scale at far right
    const scaleHeight = canvas.height - 40;
    const gradientScale = ctx.createLinearGradient(canvas.width - 25, 20, canvas.width - 25, scaleHeight + 20);
    gradientScale.addColorStop(0.0, '#ffffff');  // Brightest (Hot)
    gradientScale.addColorStop(0.2, '#fbbf24');  // Yellow
    gradientScale.addColorStop(0.4, '#f97316');  // Orange
    gradientScale.addColorStop(0.6, '#ec4899');  // Pink/Magenta
    gradientScale.addColorStop(0.8, '#4c1d95');  // Violet
    gradientScale.addColorStop(1.0, '#0f0c24');  // Dark (Cold)

    ctx.fillStyle = gradientScale;
    ctx.fillRect(canvas.width - 30, 20, 12, scaleHeight);

    // Scale labels
    ctx.font = '8px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('110°C', canvas.width - 45, 25);
    ctx.fillText('20°C', canvas.width - 40, scaleHeight + 22);

  }, [selectedHotspot]);

  // NETA & NFPA delta temperature severity classification standard
  const getDeltaClassification = (delta: number) => {
    if (delta <= 10) return { label: 'Normal (Baixo Risco)', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (delta <= 20) return { label: 'Atenção (Sobrecarga Baixa)', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (delta <= 40) return { label: 'Severo (Alta Resistência)', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
    return { label: 'Crítico (Risco Iminente de Arco/Fogo)', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
  };

  const deltaTemp = selectedHotspot.currentTemp - selectedHotspot.baseTemp;
  const classification = getDeltaClassification(deltaTemp);
  const isResistanceFaultActive = simulatedFaultHotspots[selectedHotspot.id] || false;

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#262626] p-4 h-full flex flex-col">
      
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-300 font-sans flex items-center gap-2">
          <Eye className="h-4.5 w-4.5 text-orange-450" />
          Análise Termográfica Online (Conexões CC/CA)
        </h3>
        <span className="text-[10px] font-mono text-slate-500 font-medium">
          Padronização Delta-T NETA CTS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-grow">
        
        {/* Hotspots Sidebar Selector (4 Columns) */}
        <div className="md:col-span-4 flex flex-col gap-2.5">
          <span className="text-[10.5px] font-mono font-bold text-slate-550 uppercase tracking-wider block">Conexões Sob Monitoração</span>
          
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {hotspots.map(spot => {
              const activeStatusColors = {
                NORMAL: 'bg-emerald-500 text-emerald-950',
                WARM: 'bg-amber-500 text-amber-950',
                CRITICAL: 'bg-red-500 text-red-950 animate-pulse',
              };

              return (
                <button
                  key={spot.id}
                  onClick={() => setSelectedHotspotId(spot.id)}
                  className={`w-full text-left p-2 rounded-lg border transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                    selectedHopspotId === spot.id
                      ? 'bg-[#1a1a1a] border-[#444444] text-slate-100 font-bold'
                      : 'bg-[#050505]/40 border-[#262626]/60 text-slate-400 hover:text-slate-200 hover:bg-[#151515]'
                  }`}
                >
                  <div className="truncate text-left">
                    <div className="text-[11px] font-semibold truncate leading-tight">{spot.componentName}</div>
                    <div className="text-[10px] font-mono font-medium text-slate-500 mt-0.5">{spot.currentTemp.toFixed(1)} °C</div>
                  </div>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-[4px] leading-3 shrink-0 ${activeStatusColors[spot.status] || 'bg-slate-650'}`}>
                    {spot.status}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Localized contact resistance fault injector */}
          <div className="bg-[#050505] border border-[#262626] p-3 rounded-lg mt-1 font-mono">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5 font-sans">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" /> Ajuste de Parâmetro
            </div>
            <p className="text-[10px] text-slate-500 leading-normal mt-1.5 mb-2 font-sans">
              Contatos soltos acumulam micro-oxidação e aumentam a resistência elétrica local, culminando em focos de calor excessivo se submetidos à alta corrente (I²R). Tente simular abaixo:
            </p>
            
            <button
              onClick={() => onToggleContactResistance(selectedHotspot.id)}
              className={`w-full py-1.5 px-3 rounded text-[10.5px] font-bold cursor-pointer border flex items-center justify-center gap-2 transition-all ${
                isResistanceFaultActive
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
              }`}
            >
              {isResistanceFaultActive ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                  Zerar Altura de Resistência
                </>
              ) : (
                <>
                  <Flame className="h-3.5 w-3.5" />
                  Injetar Oxidação de Contato
                </>
              )}
            </button>
          </div>
        </div>

        {/* Thermograph Screen Display & Telemetry Data (8 Columns) */}
        <div className="md:col-span-8 flex flex-col gap-3">
          
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 flex-grow">
            
            {/* The Thermal Render Canvas (3 Columns) */}
            <div className="sm:col-span-3 border border-[#262626] rounded-xl overflow-hidden relative flex bg-[#050505] flex-grow min-h-[170px]">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full block" 
                width={280} 
                height={210} 
              />
              <span className="absolute bottom-1.5 left-2 bg-[#050505]/90 text-[8px] font-mono text-slate-500 border border-[#262626] px-1.5 py-0.5 rounded uppercase tracking-wider">
                IR Cam: TermoMEX CC V4
              </span>
            </div>

            {/* In-depth Thermal Math Telemetry Readings (2 Columns) */}
            <div className="sm:col-span-2 bg-[#050505] border border-[#262626] rounded-xl p-3 flex flex-col justify-between font-mono text-slate-350">
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Ponto Sob Inspeção</div>
                  <div className="text-[11px] font-bold text-slate-300 mt-0.5 truncate">{selectedHotspot.componentName}</div>
                </div>

                <div className="grid grid-cols-2 gap-y-1.5 border-t border-[#262626] pt-2 text-[10px]">
                  <span className="text-slate-550">Temp. Medida:</span>
                  <span className="text-right text-slate-200 font-bold">{selectedHotspot.currentTemp.toFixed(1)} °C</span>

                  <span className="text-slate-550">Temp. Ref:</span>
                  <span className="text-right text-slate-500">{selectedHotspot.baseTemp.toFixed(1)} °C</span>

                  <span className="text-slate-550">Gradiente (ΔT):</span>
                  <span className={`text-right font-extrabold ${deltaTemp > 30 ? 'text-red-400 animate-pulse' : deltaTemp > 10 ? 'text-amber-400' : 'text-emerald-450'}`}>
                    +{deltaTemp.toFixed(1)} °C
                  </span>

                  <span className="text-slate-555">Limite Crítico:</span>
                  <span className="text-right text-red-500">{selectedHotspot.criticalTemp.toFixed(1)} °C</span>
                </div>
              </div>

              {/* Status diagnosis block */}
              <div className="mt-3.5 border-t border-[#262626] pt-2.5">
                <div className="text-[8.5px] uppercase text-slate-500 font-extrabold tracking-wider">Avaliação Técnica NETA</div>
                <div className={`mt-1 py-1 px-2.5 rounded text-[10px] font-bold border ${classification.bg}`}>
                  {classification.label}
                </div>
                {isResistanceFaultActive && (
                  <p className="text-[9px] text-red-400/85 mt-2.5 font-sans leading-tight">
                    * Alerta: Altíssima resistência de contato simulada. Disbura calor por efeito Joule (P = {selectedHotspot.id === 'rect_joint' ? 'I² * Rct' : 'I² * R_coupler'}). Pode causar colapso do isolamento!
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
