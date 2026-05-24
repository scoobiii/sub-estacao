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
  guiStyle?: 'CLASSIC_SCADA' | 'HITACHI_ADMS';
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
  guiStyle = 'HITACHI_ADMS',
}: ControlPanelProps) {
  const isClassic = guiStyle === 'CLASSIC_SCADA';
  
  // Calculations for total generation vs load balance
  const activeSourcesPower = (telemetry.rectifierVoltageOut * telemetry.rectifierCurrentOut) / 1000 + telemetry.solarPowerKw;
  const activeLoadsPower = telemetry.dcLoad1PowerKw + telemetry.dcLoad2PowerKw;
  const powerBalance = activeSourcesPower - activeLoadsPower; // positive is excess, negative is battery makeup

  return (
    <div className={`transition-all h-full flex flex-col ${
      isClassic 
        ? 'bg-[#151924] border-2 border-t-[#3b4356] border-l-[#3b4356] border-b-[#0f1118] border-r-[#0f1118] p-4 shadow-inner' 
        : 'bg-[#0f0f0f] rounded-xl border border-[#262626] p-4'
    }`}>
      
      {/* Module Title */}
      <div className={`flex items-center justify-between border-b pb-3 mb-4 ${
        isClassic ? 'border-[#2d3448]' : 'border-[#262626]'
      }`}>
        <h3 className={`text-md font-semibold font-sans flex items-center gap-2 ${
          isClassic ? 'font-mono text-[#00ffcc] uppercase' : 'text-slate-300'
        }`}>
          <Sliders className="h-4.5 w-4.5 text-blue-400" />
          {isClassic ? 'AQUISIÇÃO E CONTROLE ANALÓGICO DOS CARREGADORES' : 'Painel de Controle e Estudos de Carga (Simulador CC/CA)'}
        </h3>
        <span className={`font-mono text-[9px] font-extrabold px-2 py-0.5 rounded uppercase border ${
          isClassic 
            ? 'bg-[#0d1017] text-[#ffcc00] border-[#3b4356]' 
            : 'bg-[#050505] text-slate-400 border border-[#262626]'
        }`}>
          {isClassic ? 'MODBUS EMULADO' : 'Simulador Ajustável'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow">
        
        {/* Left: Load & Generation Sliders */}
        <div className="space-y-4">
          <div className={`p-3 rounded-lg space-y-3.5 border ${
            isClassic 
              ? 'bg-[#090b11] border-[#292f40] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]' 
              : 'bg-[#050505] border-[#262626]/50'
          }`}>
            <span className={`text-[10.5px] font-mono font-extrabold uppercase tracking-wider block ${
              isClassic ? 'text-[#ffcc00]' : 'text-slate-500'
            }`}>
              {isClassic ? 'REOSTATOS DE CARGA CC' : 'Cargas Conectadas (Barramento 800V)'}
            </span>
            
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

          <div className={`p-3 rounded-lg space-y-3.5 border ${
            isClassic 
              ? 'bg-[#090b11] border-[#292f40] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]' 
              : 'bg-[#050505] border-[#262626]/50'
          }`}>
            <span className={`text-[10.5px] font-mono font-extrabold uppercase tracking-wider block ${
              isClassic ? 'text-[#ffcc00]' : 'text-slate-500'
            }`}>
              {isClassic ? 'CONTROLE COLETOR SOLAR FV' : 'Condições de Geração Renovável'}
            </span>
            
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
                <span>0 W/m² (Nublado)</span>
                <span>1000 W/m² (Sol Pleno)</span>
              </div>
            </div>

            {/* BESS Charging rate slider */}
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-xs">
                <span className="text-slate-300 font-mono">Alvo da Bateria (BESS):</span>
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
          <div className={`p-3.5 flex flex-col justify-between flex-grow border ${
            isClassic 
              ? 'bg-[#090b11] border-[#292f40] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]' 
              : 'bg-[#050505] border border-[#262626] rounded-lg'
          }`}>
            <div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 ${
                isClassic ? 'text-[#ffcc00]' : 'text-slate-500'
              }`}>
                <Sparkles className="h-3.5 w-3.5 text-blue-450" />
                {isClassic ? 'MONITOR DE POTÊNCIA BARRAMENTO CC COILS' : 'Estudo de Fluxo - Barramento CC'}
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
                  telemetry.bus800VdcVoltage < 100 ? 'bg-red-950/40 text-red-400 border border-red-500/30' :
                  activeFault !== 'Nenhum' ? 'bg-red-950/30 text-red-500 font-black' :
                  powerBalance >= 0 ? 'bg-emerald-950/20 text-emerald-400' : 'bg-amber-950/10 text-amber-500 border border-[#262626]'
                }`}>
                  {telemetry.bus800VdcVoltage < 100 ? 'COLAPSO CC' :
                   activeFault !== 'Nenhum' ? 'ANOMALIA REDE' :
                   powerBalance >= 0 ? 'AUTO SUSTENTÁVEL' : 'DÉFICE COMPENSADO'}
                </span>
              </div>

              {/* Graphical mini Bar balance */}
              <div className={`w-full h-3 overflow-hidden mt-3 relative border ${
                isClassic ? 'bg-[#151924] border-[#292f40] rounded-none' : 'bg-[#050505] border-[#262626]/40 rounded'
              }`}>
                <div 
                  className={`h-full absolute left-0 top-0 transition-all ${
                    powerBalance >= 0 ? 'bg-gradient-to-r from-blue-500 to-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, (activeSourcesPower / (activeLoadsPower || 1)) * 50))}%` }}
                />
              </div>
            </div>

            <div className={`border-t pt-2.5 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[10.5px] font-mono text-slate-400 ${
              isClassic ? 'border-[#3c4558]/50' : 'border-[#262626]'
            }`}>
              <span className={`font-semibold uppercase shrink-0 ${isClassic ? 'text-slate-300' : 'text-slate-500'}`}>Sincronismo Clock:</span>
              <div className={`flex gap-1 p-0.5 border ${
                isClassic ? 'bg-[#151924] border-[#313849] rounded-none' : 'bg-[#050505] border-[#262626] rounded'
              }`}>
                {(['PTP', 'IRIG-B', 'GPS', 'NTP'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onChangeTimeSyncMode(m)}
                    className={`px-1.5 py-0.5 text-[9px] rounded font-extrabold cursor-pointer transition-colors ${
                      timeSyncMode === m 
                        ? 'bg-[#292f40] text-blue-400 border border-[#4d566d]' 
                        : 'text-slate-500 hover:text-slate-350'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fault Simulation triggers panel */}
          <div className={`p-3 text-xs border ${
            isClassic 
              ? 'bg-[#090b11] border-[#292f40] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)] rounded' 
              : 'bg-[#050505] border border-[#262626] rounded-lg'
          }`}>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 ${
              isClassic ? 'text-[#ffcc00]' : 'text-slate-500'
            }`}>
              <ShieldAlert className="h-4 w-4 text-red-500" />
              {isClassic ? 'SIMULADOR DE CURTOS E FALHAS DE CAMPO' : 'Injeção Controlada de Falhas (Syllabus IEC 61850)'}
            </span>
            
            <div className="grid grid-cols-2 gap-2 mt-2.5 font-mono">
              {[
                { label: 'Sem Falhas', id: 'Nenhum', style: 'bg-emerald-950/10 text-emerald-400 border-emerald-950/20 hover:bg-emerald-950/20' },
                { label: 'Curto 138kV CA', id: 'Curto AC 138kV', style: 'bg-red-950/10 text-red-400 border-red-950/20 hover:bg-red-950/20' },
                { label: 'Curto 800V CC', id: 'Curto Barramento 800VDC', style: 'bg-red-950/10 text-red-400 border-red-950/20 hover:bg-red-950/20' },
                { label: 'Perda Perfeita Sync', id: 'Perda Sincronismo Temporal', style: 'bg-amber-950/10 text-amber-400 border-amber-950/20 hover:bg-amber-950/20' },
              ].map(f => {
                const isSelected = activeFault === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => onSelectFault(f.id)}
                    className={`py-1.5 px-2 font-extrabold text-[9.5px] cursor-pointer border text-center transition-all ${
                      isSelected 
                        ? isClassic
                          ? 'bg-blue-600 border-t-blue-400 border-l-blue-400 border-b-blue-900 border-r-blue-900 text-white font-black shadow-md'
                          : 'bg-[#262626] border-[#444444] text-white font-extrabold shadow-sm'
                        : isClassic
                          ? 'bg-[#151924] border-[#292f40] text-slate-400 hover:text-slate-200'
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
