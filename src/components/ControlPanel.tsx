import React from 'react';
import { Telemetry, SyncProtocol } from '../types';
import { ToggleLeft, ToggleRight, Sparkles, Sliders, Play, TrendingUp, TrendingDown, Minus, ShieldAlert } from 'lucide-react';

interface ControlPanelProps {
  telemetry: Telemetry;
  load1Param: number;         // kW
  onSetLoad1Param: (val: number) => void;
  load2Param: number;         // kW
  onSetLoad2Param: (val: number) => void;
  solarIrradianceParam: number; // W/m²
  onSetSolarIrradiance: (val: number) => void;
  bessTargetParam: number;    // kW (+ charges, - discharging)
  onSetBessTarget: (val: number) => void;
  
  activeFault: string;
  onSelectFault: (fault: string) => void;
  timeSyncMode: SyncProtocol;
  onChangeTimeSyncMode: (mode: SyncProtocol) => void;
}

export default function ControlPanel({
  telemetry,
  load1Param,
  onSetLoad1Param,
  load2Param,
  onSetLoad2Param,
  solarIrradianceParam,
  onSetSolarIrradiance,
  bessTargetParam,
  onSetBessTarget,
  
  activeFault,
  onSelectFault,
  timeSyncMode,
  onChangeTimeSyncMode,
}: ControlPanelProps) {
  
  // Calculations for total generation vs load balance
  const activeSourcesPower = (telemetry.rectifierVoltageOut * telemetry.rectifierCurrentOut) / 1000 + telemetry.solarPowerKw;
  const activeLoadsPower = telemetry.dcLoad1PowerKw + telemetry.dcLoad2PowerKw;
  const powerBalance = activeSourcesPower - activeLoadsPower; // positive is excess, negative is battery makeup

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#262626] p-4 h-full flex flex-col">
      
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-300 font-sans flex items-center gap-2">
          <Sliders className="h-4.5 w-4.5 text-blue-400" />
          Painel de Controle e Estudos de Carga (Simulador CC/CA)
        </h3>
        <span className="bg-[#050505] text-slate-400 border border-[#262626] font-mono text-[9px] font-semibold px-2 py-0.5 rounded uppercase">
          Simulador Ajustável
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow">
        
        {/* Left: Load & Generation Sliders */}
        <div className="space-y-4">
          <div className="bg-[#050505] border border-[#262626]/50 p-3 rounded-lg space-y-3.5">
            <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Cargas Conectadas (Barramento 800V)</span>
            
            {/* Load 1 */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-300">Carga Industrial 1:</span>
                <span className="text-amber-400 font-bold">{load1Param.toFixed(0)} kW</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1000"
                step="25"
                value={load1Param}
                onChange={(e) => onSetLoad1Param(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0 kW (Desligado)</span>
                <span>1000 kW (Plena Carga)</span>
              </div>
            </div>

            {/* Load 2 */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-300">Carga Inversora 2:</span>
                <span className="text-amber-400 font-bold">{load2Param.toFixed(0)} kW</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1000"
                step="25"
                value={load2Param}
                onChange={(e) => onSetLoad2Param(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0 kW</span>
                <span>1000 kW (Crítico)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#050505] border border-[#262626]/50 p-3 rounded-lg space-y-3.5">
            <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Condições de Geração Renovável</span>
            
            {/* Solar Irradiance */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-300">Irradiação Solar FV:</span>
                <span className="text-orange-400 font-bold">{solarIrradianceParam.toFixed(0)} W/m²</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1000"
                step="50"
                value={solarIrradianceParam}
                onChange={(e) => onSetSolarIrradiance(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0 W/m² (Nublado/Noite)</span>
                <span>1000 W/m² (Sol Pleno)</span>
              </div>
            </div>

            {/* BESS Charging rate slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-300">Alvo da Bateria (BESS):</span>
                <span className={`font-bold ${bessTargetParam < 0 ? 'text-amber-400' : bessTargetParam > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {bessTargetParam === 0 ? 'STANDBY' : bessTargetParam > 0 ? `CARGA (+${bessTargetParam} kW)` : `DESCARGA (${bessTargetParam} kW)`}
                </span>
              </div>
              <input 
                type="range"
                min="-600"
                max="600"
                step="25"
                value={bessTargetParam}
                onChange={(e) => onSetBessTarget(Number(e.target.value))}
                className="w-full h-1.5 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>Descarregar rápido (-600kW)</span>
                <span>Carregar rápido (+600kW)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Balance Assessment and Failure Injections */}
        <div className="flex flex-col gap-4">
          
          {/* Dynamic Balance Assessment */}
          <div className="bg-[#050505] border border-[#262626] rounded-lg p-3.5 flex flex-col justify-between flex-grow">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-450" />
                Estudo de Fluxo - Barramento CC
              </span>
              
              <div className="grid grid-cols-2 gap-y-1.5 mt-3 text-xs font-mono">
                <span className="text-slate-500">Total Geração (CA + FV):</span>
                <span className="text-right text-slate-200">{(activeSourcesPower).toFixed(1)} kW</span>

                <span className="text-slate-500">Total Consumo (Cargas):</span>
                <span className="text-right text-slate-200">{activeLoadsPower.toFixed(1)} kW</span>

                <span className="text-slate-500">Equilíbrio Ativo:</span>
                <span className={`text-right font-extrabold ${powerBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {powerBalance >= 0 ? `Excesso (+${powerBalance.toFixed(1)} kW)` : `Défice (${powerBalance.toFixed(1)} kW)`}
                </span>

                <span className="text-slate-500">Status Dinâmico:</span>
                <span className={`text-right font-extrabold text-[10.5px] p-0.5 rounded leading-normal truncate ${
                  telemetry.bus800VdcVoltage < 100 ? 'bg-red-950/40 text-red-400 border border-red-900/40' :
                  activeFault !== 'Nenhum' ? 'bg-red-950/30 text-red-400' :
                  powerBalance >= 0 ? 'bg-emerald-950/20 text-emerald-400' : 'bg-[#151515] text-amber-400 border border-[#262626]'
                }`}>
                  {telemetry.bus800VdcVoltage < 100 ? 'COLAPSO CC' :
                   activeFault !== 'Nenhum' ? 'ANOMALIA REDE' :
                   powerBalance >= 0 ? 'AUTO SUSTENTÁVEL' : 'DÉFICE COMPENSADO'}
                </span>
              </div>

              {/* Graphical mini Bar balance */}
              <div className="w-full bg-[#050505] border border-[#262626]/40 h-3 rounded overflow-hidden mt-3 relative">
                <div 
                  className={`h-full absolute left-0 top-0 transition-all ${
                    powerBalance >= 0 ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (activeSourcesPower / (activeLoadsPower || 1)) * 50))}%` }}
                />
              </div>
            </div>

            <div className="border-t border-[#262626] pt-2.5 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[10.5px] font-mono text-slate-400">
              <span className="font-semibold text-slate-500 uppercase shrink-0">Sincronismo Clock:</span>
              <div className="flex gap-1 bg-[#050505] p-0.5 rounded border border-[#262626]">
                {(['PTP', 'IRIG-B', 'GPS', 'NTP'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onChangeTimeSyncMode(m)}
                    className={`px-1.5 py-0.5 text-[9px] rounded font-extrabold cursor-pointer transition-colors ${
                      timeSyncMode === m 
                        ? 'bg-[#262626] text-blue-400 border border-[#444444]' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fault Simulation triggers panel */}
          <div className="bg-[#050505] border border-[#262626] rounded-lg p-3 text-xs">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              Injeção Controlada de Falhas (Syllabus IEC 61850)
            </span>
            
            <div className="grid grid-cols-2 gap-2 mt-2.5 font-mono">
              {[
                { label: 'Sem Falhas', id: 'Nenhum', style: 'bg-emerald-950/10 text-emerald-450 border-emerald-950/20 hover:bg-emerald-950/20' },
                { label: 'Curto 138kV CA', id: 'Curto AC 138kV', style: 'bg-red-950/10 text-red-400 border-red-950/20 hover:bg-red-950/20' },
                { label: 'Curto 800V CC', id: 'Curto Barramento 800VDC', style: 'bg-red-950/10 text-red-400 border-red-950/20 hover:bg-red-950/20' },
                { label: 'Perda Perfeita Sync', id: 'Perda Sincronismo Temporal', style: 'bg-amber-950/10 text-amber-400 border-amber-950/20 hover:bg-amber-950/20' },
              ].map(f => {
                const isSelected = activeFault === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectFault(f.id)}
                    className={`py-1.5 px-2 rounded font-extrabold text-[9.5px] cursor-pointer border text-center transition-all ${
                      isSelected 
                        ? 'bg-[#262626] border-[#444444] text-white font-extrabold shadow-sm' 
                        : f.style
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          
        </div>

      </div>

    </div>
  );
}
