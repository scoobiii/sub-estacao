import React from 'react';
import { SwitchState, Telemetry } from '../types';
import { Play, Pause, AlertTriangle, Battery, Sun, Zap, HelpCircle } from 'lucide-react';

interface SingleLineDiagramProps {
  telemetry: Telemetry;
  breakers: {
    cb_ac: SwitchState;
    cb_rect: SwitchState;
    cb_solar: SwitchState;
    cb_bess: SwitchState;
    cb_load1: SwitchState;
    cb_load2: SwitchState;
  };
  onToggleBreaker: (id: string) => void;
  activeFault: string;
  guiStyle?: 'CLASSIC_SCADA' | 'HITACHI_ADMS';
}

export default function SingleLineDiagram({
  telemetry,
  breakers,
  onToggleBreaker,
  activeFault,
  guiStyle = 'HITACHI_ADMS',
}: SingleLineDiagramProps) {
  const isClassic = guiStyle === 'CLASSIC_SCADA';

  // Helper to check flow status
  const isAcFlowing = breakers.cb_ac === 'CLOSED' && activeFault !== 'Curto AC 138kV';
  const isRectifierActive = isAcFlowing && breakers.cb_rect === 'CLOSED' && activeFault !== 'Curto Barramento 800VDC';
  const isSolarFlowing = breakers.cb_solar === 'CLOSED' && telemetry.solarPowerKw > 0;
  
  // Is the 800V DC bus actually energized?
  const isBusEnergized = telemetry.bus800VdcVoltage > 50;

  // Render a Switch (with open/closed animation)
  const renderSwitchButton = (
    id: string,
    state: SwitchState,
    x: number,
    y: number,
    label: string,
    sublabel?: string
  ) => {
    const isClosed = state === 'CLOSED';
    
    return (
      <div 
        className={`absolute p-2 flex flex-col items-center z-10 transition-all ${
          isClassic 
            ? 'bg-[#1b202c] border-2 border-[#3c4558] rounded' 
            : 'bg-[#0f0f0f] border border-[#262626] rounded-lg shadow-lg group hover:border-[#444444]'
        }`}
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <span className={`text-[10px] font-mono font-semibold mb-1 select-none ${
          isClassic ? 'text-[#00ffcc]' : 'text-slate-500'
        }`}>
          {label}
        </span>

        {isClassic ? (
          // Retro chunky square mechanical button with outset bevel style
          <button
            onClick={() => onToggleBreaker(id)}
            className={`px-3 py-1 font-mono text-[10.5px] font-extrabold tracking-wide uppercase cursor-pointer border-2 transition-all active:translate-y-[1px] active:shadow-none shadow-[2px_2px_4px_rgba(0,0,0,0.4)] ${
              isClosed
                ? 'bg-[#ef4444] text-white border-t-[#fca5a5] border-l-[#fca5a5] border-b-[#7f1d1d] border-r-[#7f1d1d]'
                : 'bg-[#22c55e] text-white border-t-[#86efac] border-l-[#86efac] border-b-[#14532d] border-r-[#14532d]'
            }`}
          >
            {isClosed ? '⚡ CHEIO' : '⚪ SECCIONADO'}
          </button>
        ) : (
          // Modern sleek button (Hitachi ADMS style)
          <button
            onClick={() => onToggleBreaker(id)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isClosed
                ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-red-500/10 text-red-450 border border-red-500/20 hover:bg-red-500/20'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isClosed ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            {isClosed ? 'FECHADO' : 'ABERTO'}
          </button>
        )}

        {sublabel && (
          <span className="text-[9px] font-mono text-slate-500 mt-1 select-none">{sublabel}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`rounded-xl transition-all h-full ${
      isClassic 
        ? 'bg-[#151924] border-2 border-t-[#3b4356] border-l-[#3b4356] border-b-[#0f1118] border-r-[#0f1118] p-4 relative overflow-hidden flex flex-col shadow-inner' 
        : 'bg-[#0f0f0f] border border-[#262626] p-4 relative overflow-hidden flex flex-col'
    }`}>
      <div className={`flex items-center justify-between mb-4 pb-3 border-b ${
        isClassic ? 'border-[#2d3448]' : 'border-[#262626]'
      }`}>
        <h3 className={`text-md font-semibold font-sans flex items-center gap-2 ${
          isClassic ? 'font-mono uppercase text-[#00ffcc]' : 'text-slate-300'
        }`}>
          <Zap className={`h-4 w-4 ${isClassic ? 'text-[#00ffcc]' : 'text-amber-500'}`} />
          {isClassic ? 'MIMICO SINÓPTICO DOS DISJUNTORES (SLD)' : 'Diagrama Unifilar Interativo (SLD)'}
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> {isClassic ? 'AC REDE 138KV' : 'AC Grid (13.8kV / 138kV)'}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-slate-400">
            <span className="h-2 w-2 rounded-full bg-orange-400" /> {isClassic ? 'BARRAMENTO CC COILS (800V)' : 'Barramento DC (800V)'}
          </span>
        </div>
      </div>

      {/* Main Interactive Map Area */}
      <div className={`relative flex-grow min-h-[460px] rounded-lg p-2 flex items-center justify-center border transition-all ${
        isClassic 
          ? 'bg-[#090b11] border-[#292f40] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]' 
          : 'bg-[#050505]/70 border border-[#262626]/60'
      }`}>
        
        {/* Decorative Grid Gridline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* SVG SLD Topology Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-85" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Pulsing glow filters */}
            <filter id="glow-ac" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-dc" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="dc-dash" width="40" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="10" x2="20" y2="10" stroke="#fbbf24" strokeWidth="4" strokeDasharray="5,5" />
            </pattern>
          </defs>

          {/* BACKGROUND static lines (gray or neon depending on power state) */}
          
          {/* Main Grid Line (Vertical from top to center-left rectifier) */}
          {/* Node: 138kV Grid -> T1 Transformer */}
          <line 
            x1="20%" y1="10%" x2="20%" y2="28%" 
            stroke={isAcFlowing ? '#22d3ee' : '#334155'} 
            strokeWidth="3.5" 
            filter={isAcFlowing ? 'url(#glow-ac)' : ''}
            className="transition-colors duration-500"
          />

          {/* Transformer Symbol (Two intersecting circles) */}
          <circle cx="20%" cy="28%" r="14" stroke={isAcFlowing ? '#22d3ee' : '#475569'} strokeWidth="3" fill="none" />
          <circle cx="20%" cy="34%" r="14" stroke={isAcFlowing ? '#22d3ee' : '#475569'} strokeWidth="3" fill="none" />
          
          {/* T1 Output -> AC circuit breaker */}
          <line 
            x1="20%" y1="38%" x2="20%" y2="52%" 
            stroke={isAcFlowing ? '#22d3ee' : '#334155'} 
            strokeWidth="3"
            filter={isAcFlowing ? 'url(#glow-ac)' : ''}
          />
          
          {/* AC circuit breaker output -> Rectifier input */}
          <line 
            x1="20%" y1="52%" x2="20%" y2="70%" 
            stroke={breakers.cb_ac === 'CLOSED' && isAcFlowing ? '#22d3ee' : '#334155'} 
            strokeWidth="3"
            filter={breakers.cb_ac === 'CLOSED' && isAcFlowing ? 'url(#glow-ac)' : ''}
          />

          {/* Rectifier block outlet (Horizontal to DC bus) */}
          <path 
            d="M 20% 74% L 20% 86% L 50% 86%" 
            stroke={isRectifierActive ? '#f59e0b' : '#334155'} 
            strokeWidth="3.5" 
            fill="none"
            filter={isRectifierActive ? 'url(#glow-dc)' : ''}
          />

          {/* CORE 800VDC BUS BAR (Heavy horizontal orange line at 86%) */}
          <line 
            x1="8%" y1="86%" x2="92%" y2="86%" 
            stroke={isBusEnergized ? '#ea580c' : '#1e293b'} 
            strokeWidth="7" 
            strokeLinecap="round"
            filter={isBusEnergized ? 'url(#glow-dc)' : ''}
            className="transition-colors duration-500"
          />

          {/* SOLAR FEEDER (Top right to DC Bus) */}
          <path 
            d="M 50% 18% L 50% 41%" 
            stroke={isSolarFlowing ? '#fbbf24' : '#334155'} 
            strokeWidth="3" 
            fill="none"
            filter={isSolarFlowing ? 'url(#glow-dc)' : ''}
          />
          <line 
            x1="50%" y1="41%" x2="50%" y2="86%" 
            stroke={breakers.cb_solar === 'CLOSED' && isSolarFlowing && isBusEnergized ? '#fbbf24' : '#334155'} 
            strokeWidth="3" 
            filter={breakers.cb_solar === 'CLOSED' && isSolarFlowing && isBusEnergized ? 'url(#glow-dc)' : ''}
          />

          {/* BESS FEEDER (Top right-ish to DC Bus) */}
          <path 
            d="M 80% 18% L 80% 41%" 
            stroke={breakers.cb_bess === 'CLOSED' ? '#e2e8f0' : '#334155'} 
            strokeWidth="3" 
            fill="none"
          />
          <line 
            x1="80%" y1="41%" x2="80%" y2="86%" 
            stroke={breakers.cb_bess === 'CLOSED' && isBusEnergized ? '#f59e0b' : '#334155'} 
            strokeWidth="3" 
            filter={breakers.cb_bess === 'CLOSED' && isBusEnergized ? 'url(#glow-dc)' : ''}
          />

          {/* LOAD 1 FEEDER (Down from 86% to 92%) */}
          <line 
            x1="35%" y1="86%" x2="35%" y2="92%" 
            stroke={breakers.cb_load1 === 'CLOSED' && isBusEnergized ? '#ea580c' : '#334155'} 
            strokeWidth="3"
            filter={breakers.cb_load1 === 'CLOSED' && isBusEnergized ? 'url(#glow-dc)' : ''}
          />

          {/* LOAD 2 FEEDER (Down from 86% to 92%) */}
          <line 
            x1="65%" y1="86%" x2="65%" y2="92%" 
            stroke={breakers.cb_load2 === 'CLOSED' && isBusEnergized ? '#ea580c' : '#334155'} 
            strokeWidth="3"
            filter={breakers.cb_load2 === 'CLOSED' && isBusEnergized ? 'url(#glow-dc)' : ''}
          />

          {/* Animated Electron Flows (Dashes crawling along the lines) */}
          {isAcFlowing && (
            <line 
              x1="20%" y1="10%" x2="20%" y2="52%" 
              stroke="#e0f7fa" strokeWidth="2" strokeDasharray="8 12" 
              strokeDashoffset="10" className="animate-[dash_1s_linear_infinite]"
            />
          )}
          {isRectifierActive && (
            <path 
              d="M 20% 74% L 20% 86% L 50% 86%" 
              stroke="#fef3c7" strokeWidth="2" strokeDasharray="8 12" 
              fill="none" className="animate-[dash_1.5s_linear_infinite]"
            />
          )}
          {isSolarFlowing && (
            <path 
              d="M 50% 18% L 50% 86%" 
              stroke="#fef3c7" strokeWidth="2" strokeDasharray="8 12" 
              fill="none" className="animate-[dash_2s_linear_infinite]"
            />
          )}
          {breakers.cb_bess === 'CLOSED' && isBusEnergized && telemetry.bessCurrent !== 0 && (
            <path 
              d={telemetry.bessCurrent < 0 ? "M 80% 86% L 80% 18%" : "M 80% 18% L 80% 86%"} 
              stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 12" 
              fill="none" className="animate-[dash_2s_linear_infinite]"
            />
          )}
          {breakers.cb_load1 === 'CLOSED' && isBusEnergized && (
            <line 
              x1="35%" y1="86%" x2="35%" y2="92%" 
              stroke="#ffedd5" strokeWidth="2" strokeDasharray="8 8" 
              className="animate-[dash_2.5s_linear_infinite]"
            />
          )}
          {breakers.cb_load2 === 'CLOSED' && isBusEnergized && (
            <line 
              x1="65%" y1="86%" x2="65%" y2="92%" 
              stroke="#ffedd5" strokeWidth="2" strokeDasharray="8 8" 
              className="animate-[dash_2.5s_linear_infinite]"
            />
          )}
        </svg>

        {/* --- NODE BLOCKS OVERLAYED --- */}

        {/* 1. AC GRID NODE (138kV) */}
        <div 
          className={`absolute p-2.5 rounded-lg border text-white font-mono text-xs z-10 text-center ${
            activeFault === 'Curto AC 138kV'
              ? 'bg-[#0e0202] border-red-900 text-red-350 animate-pulse'
              : 'bg-[#0f0f0f] border-[#262626]'
          }`}
          style={{ left: '20%', top: '10%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-[9px] text-blue-400 font-bold">Rede Conexão</div>
          <div className="font-bold">Grid AC 138 kV</div>
          <div className="text-[10px] text-slate-300">
            {activeFault === 'Curto AC 138kV' ? 'FALHA CURTO' : `${telemetry.gridVoltage.toFixed(1)} kV | ${telemetry.gridFreq.toFixed(2)} Hz`}
          </div>
        </div>

        {/* 2. TRANSFORMER T1 VIEW */}
        <div 
          className="absolute font-mono text-[9px] text-slate-400 z-10 text-left bg-[#050505]/80 p-1.5 rounded border border-[#262626]/35"
          style={{ left: '31%', top: '31%', transform: 'translate(-50%, -50%)' }}
        >
          <p className="font-bold text-slate-300">Transformador T1</p>
          <p>Potência: 2.0 MVA</p>
          <p>Rel: 138 / 13.8 kV</p>
        </div>

        {/* 3. SWITCH AC GRID BREED */}
        {renderSwitchButton('cb_ac', breakers.cb_ac, 20, 41, 'DISJUNTOR AC 52-1', 'IEC 61850 MU-1')}

        {/* 4. RECTIFIER CONVERTER BLOCK */}
        <div 
          className={`absolute p-3 rounded-lg border text-white font-mono text-xs text-center w-32 ${
            isRectifierActive 
              ? 'bg-[#0f0f0f] border-orange-500/40' 
              : 'bg-[#0f0f0f] border-[#262626] text-slate-450'
          }`}
          style={{ left: '20%', top: '70%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-[9px] text-amber-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${isRectifierActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-650'}`} />
            Retificador AC/DC
          </div>
          <div className="font-bold text-[11px] my-1 text-slate-300 font-sans">2.0 MW Tiristores</div>
          <div className="text-[10px]">
            {isRectifierActive ? (
              <>
                <div className="text-amber-455 font-bold">{(telemetry.rectifierVoltageOut).toFixed(0)} Vcc</div>
                <div className="text-slate-400">{(telemetry.rectifierCurrentOut).toFixed(0)} Acc</div>
              </>
            ) : (
              <span className="text-red-550 font-semibold text-[9px]">CORTE / INATIVO</span>
            )}
          </div>
          <div className={`text-[9px] mt-1 p-0.5 rounded border ${telemetry.rectifierTempCelsius > 75 ? 'bg-red-500/10 text-red-300 border-red-500/20' : 'bg-[#050505] border-[#262626]/40 text-slate-500'}`}>
            T: {telemetry.rectifierTempCelsius.toFixed(1)} °C
          </div>
        </div>

        {/* 5. SOLAR SOURCE */}
        <div 
          className="absolute bg-[#0f0f0f] border border-[#262626] p-3 rounded-lg flex flex-col items-center text-center w-36"
          style={{ left: '50%', top: '18%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-orange-400 flex items-center gap-1.5 text-xs font-bold mb-1 font-sans">
            <Sun className="h-4 w-4 text-orange-400" />
            Fonte Solar FV
          </div>
          <div className="font-mono text-[10px] text-slate-300">
            <div>Irrad: <span className="text-slate-100 font-semibold">{telemetry.solarIrradiance.toFixed(0)} W/m²</span></div>
            <div>Geração: <span className="text-orange-420 font-bold">{telemetry.solarPowerKw.toFixed(1)} kW</span></div>
            <div className="text-slate-500 text-[9px] mt-0.5">{telemetry.solarVoltage.toFixed(0)}V | {telemetry.solarCurrent.toFixed(1)}A</div>
          </div>
        </div>

        {/* 5b. SOLAR BREAKER */}
        {renderSwitchButton('cb_solar', breakers.cb_solar, 50, 41, 'DISJUNTOR SOL-48', 'DC protection')}

        {/* 6. BATTERY SYSTEM (BESS) */}
        <div 
          className="absolute bg-[#0f0f0f] border border-[#262626] p-3 rounded-lg flex flex-col items-center text-center w-38"
          style={{ left: '80%', top: '18%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-indigo-400 flex items-center gap-1.5 text-xs font-bold mb-1 font-sans">
            <Battery className="h-4 w-4 text-emerald-400" />
            BESS (Baterias)
          </div>
          
          {/* SoC Battery Visual */}
          <div className="w-full bg-[#050505] rounded h-3.5 relative overflow-hidden mb-1.5 border border-[#262626]">
            <div 
              className={`h-full absolute left-0 top-0 transition-all duration-500 ${
                telemetry.bessSoc > 25 ? 'bg-emerald-600/80' : 'bg-red-650'
              }`}
              style={{ width: `${telemetry.bessSoc}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white font-bold">
              {telemetry.bessSoc.toFixed(1)}%
            </span>
          </div>

          <div className="font-mono text-[10px] text-slate-355">
            <div className="flex justify-between gap-1">
              <span>Status:</span>
              <span className={`font-semibold ${
                telemetry.bessStatus === 'CHARGING' ? 'text-emerald-400' :
                telemetry.bessStatus === 'DISCHARGING' ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {telemetry.bessStatus === 'CHARGING' ? 'RECARGA' :
                 telemetry.bessStatus === 'DISCHARGING' ? 'DESCARGA' : 'STANDBY'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Potência:</span>
              <span className="font-bold text-slate-200">
                {(Math.abs(telemetry.bessVoltage * telemetry.bessCurrent) / 1000).toFixed(1)} kW
              </span>
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              {telemetry.bessVoltage.toFixed(0)}V | {telemetry.bessCurrent.toFixed(1)}A
            </div>
          </div>
        </div>

        {/* 6b. BESS INVERTER BREAKER */}
        {renderSwitchButton('cb_bess', breakers.cb_bess, 80, 41, 'DISJUNTOR BES-99', 'DC coupling')}

        {/* 7. CORE 800V DC BUS DISPLAY LABEL */}
        <div 
          className="absolute bg-[#0f0f0f] border-2 border-orange-500/80 py-1.5 px-3 rounded-lg shadow-xl text-center z-20 font-mono w-44"
          style={{ left: '50%', top: '86%', transform: 'translate(-50%, -50%)' }}
        >
          <div className="text-[9px] text-orange-400 font-bold uppercase tracking-widest">Barramento Principal</div>
          <div className="text-md font-extrabold text-orange-500">800 VDC Nominal</div>
          <div className="flex justify-between text-xs text-white border-t border-[#262626] mt-1 pt-0.5">
            <span className="font-semibold text-orange-400">{telemetry.bus800VdcVoltage.toFixed(1)} Vcc</span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold">{telemetry.bus800VdcPowerKw.toFixed(1)} kW</span>
          </div>
        </div>

        {/* 8. LOAD 1 */}
        <div 
          className="absolute bg-[#0f0f0f] border border-[#262626] p-2.5 rounded-lg flex flex-col items-center text-center max-w-[140px]"
          style={{ left: '35%', top: '92%', transform: 'translate(-50%, 0%)' }}
        >
          <div className="text-xs font-bold text-slate-350 font-sans">Carga Industrial 1</div>
          <div className="font-mono text-[10px] text-slate-500 mt-1">
            <div className="text-orange-410 font-bold">{telemetry.dcLoad1PowerKw.toFixed(1)} kW</div>
            <div>{telemetry.dcLoad1Current.toFixed(1)} A @ {telemetry.dcLoad1Voltage.toFixed(0)}V</div>
          </div>
        </div>

        {/* 9. LOAD 2 */}
        <div 
          className="absolute bg-[#0f0f0f] border border-[#262626] p-2.5 rounded-lg flex flex-col items-center text-center max-w-[140px]"
          style={{ left: '65%', top: '92%', transform: 'translate(-50%, 0%)' }}
        >
          <div className="text-xs font-bold text-slate-350 font-sans">Carga Inversora 2</div>
          <div className="font-mono text-[10px] text-slate-400 mt-1">
            <div className="text-orange-410 font-bold">{telemetry.dcLoad2PowerKw.toFixed(1)} kW</div>
            <div className="text-slate-550">{telemetry.dcLoad2Current.toFixed(1)} A @ {telemetry.dcLoad2Voltage.toFixed(0)}V</div>
          </div>
        </div>

        {/* Fault Warnings Overlay */}
        {activeFault !== 'Nenhum' && (
          <div className="absolute top-4 left-4 bg-[#0e0202]/95 border border-red-900 text-red-200 py-2 px-3.5 rounded-lg shadow-2xl flex items-center gap-2.5 z-30 animate-bounce">
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">ANOMALIA DETECTADA</div>
              <div className="text-xs font-bold font-mono">{activeFault}</div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend / Note */}
      <div className="bg-[#050505]/40 border border-[#262626]/50 mt-3 p-2.5 rounded-lg text-xs leading-relaxed text-slate-400 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
        <p>
          <strong>Dica Operacional:</strong> Clique diretamente nos botões{' '}
          <strong className="text-slate-300">ABERTO/FECHADO</strong> acima para chavear os disjuntores da subestação e observar as dinâmicas físicas de potência no barramento CC.
        </p>
      </div>
    </div>
  );
}
