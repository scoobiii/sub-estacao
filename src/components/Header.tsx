import { Activity, Clock, ShieldAlert, Wifi, LayoutGrid, MonitorDot } from 'lucide-react';
import { SyncProtocol } from '../types';

interface HeaderProps {
  appName: string;
  timeSyncMode: SyncProtocol;
  timeSyncAccuracy: string;
  isSyncLost: boolean;
  systemTime: string;
  guiStyle: 'CLASSIC_SCADA' | 'HITACHI_ADMS';
  onChangeGuiStyle: (style: 'CLASSIC_SCADA' | 'HITACHI_ADMS') => void;
  simulationMode?: 'REALITY' | 'STUDY';
  onChangeSimulationMode?: (mode: 'REALITY' | 'STUDY') => void;
}

export default function Header({
  appName,
  timeSyncMode,
  timeSyncAccuracy,
  isSyncLost,
  systemTime,
  guiStyle,
  onChangeGuiStyle,
  simulationMode = 'REALITY',
  onChangeSimulationMode = () => {},
}: HeaderProps) {
  const isClassic = guiStyle === 'CLASSIC_SCADA';

  return (
    <header className={`transition-colors duration-300 ${isClassic ? 'bg-[#1e222b] border-b-[3px] border-[#3a3f4d] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] text-[#e8ebf0]' : 'bg-[#0f0f0f] border-b border-[#262626] text-white'} py-4 px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 font-sans`}>
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg flex items-center justify-center font-bold relative transition-all ${
          isClassic 
            ? 'bg-[#3b82f6] text-[#ffffff] border-2 border-t-[#60a5fa] border-l-[#60a5fa] border-b-[#1d4ed8] border-r-[#1d4ed8]' 
            : 'bg-amber-500 text-slate-950'
        }`}>
          <Activity className="h-5 w-5" />
          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={`text-xl font-bold tracking-tight transition-all uppercase ${isClassic ? 'font-mono text-[#00ffcc] tracking-wide' : 'text-slate-100'}`}>{appName}</h1>
            <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border transition-all ${
              isClassic 
                ? 'bg-blue-500/20 text-[#3b82f6] border-blue-500/40 font-bold' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {isClassic ? 'CLASSIC SCADA MODBUS' : 'HITACHI ADMS ACTIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {isClassic 
              ? 'Módulo de Telemetria SCADA • Protocolos Legados e Emulação Registros de Memória Coils'
              : 'Gestão Inteligente Avançada Hitachi Energy Network Manager • Distribuição Digitalizada'
            }
          </p>
        </div>
      </div>

      {/* Selector and Tech Status Area */}
      <div className="flex flex-wrap items-center gap-3 lg:gap-5">
        
        {/* THE SYSTEM SECTOR SELECTOR MENU - SCADA VS. HITACHI ADMS */}
        <div className={`p-1.5 rounded-lg flex items-center gap-2 ${
          isClassic 
            ? 'bg-[#151921] border-2 border-[#12151b] shadow-inner text-slate-300' 
            : 'bg-[#121212] border border-[#262626] text-white'
        }`}>
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold pl-1.5 flex items-center gap-1">
            <MonitorDot className={`h-3 w-3 ${isClassic ? 'text-blue-400' : 'text-cyan-400 animate-pulse'}`} /> GUI UX
          </span>
          <div className="flex gap-1">
            <button
              id="select-vintage-scada"
              onClick={() => onChangeGuiStyle('CLASSIC_SCADA')}
              className={`px-2.5 py-1 text-[10px] uppercase font-mono transition-all font-bold cursor-pointer rounded ${
                isClassic 
                  ? 'bg-blue-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] border-t border-t-blue-400 border-b-2 border-b-blue-800' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Muda para interface SCADA analógica/clássica de campo"
            >
              SCADA Clássico
            </button>
            <button
              id="select-hitachi-adms"
              onClick={() => onChangeGuiStyle('HITACHI_ADMS')}
              className={`px-2.5 py-1 text-[10px] uppercase font-mono transition-all font-bold cursor-pointer rounded ${
                !isClassic 
                  ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f2430]'
              }`}
              title="Muda para interface moderna comercial Hitachi ADMS Network Manager"
            >
              Hitachi ADMS
            </button>
          </div>
        </div>

        {/* STUDY VS. REALITY SIMULATION TOGGLE */}
        <div className={`p-1.5 rounded-lg flex items-center gap-2 ${
          isClassic 
            ? 'bg-[#151921] border-2 border-[#12151b] text-slate-350' 
            : 'bg-[#121212] border border-[#262626] text-white'
        }`}>
          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 font-bold pl-1.5">
            Modo Operação
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onChangeSimulationMode('REALITY')}
              className={`px-2 py-0.5 text-[9.5px] uppercase font-mono font-bold cursor-pointer rounded transition-all ${
                simulationMode === 'REALITY'
                  ? (isClassic ? 'bg-[#22c55e] text-white' : 'bg-emerald-500 text-slate-950 font-extrabold')
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Opera o barramento com dados em tempo real da rede física"
            >
              Realidade
            </button>
            <button
              onClick={() => onChangeSimulationMode('STUDY')}
              className={`px-2 py-0.5 text-[9.5px] uppercase font-mono font-bold cursor-pointer rounded transition-all ${
                simulationMode === 'STUDY'
                  ? (isClassic ? 'bg-purple-700 text-white animate-pulse' : 'bg-purple-600 text-white font-extrabold')
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Muda o HMI e os IEDs para ambiente de estudo de carga ou contingência offline"
            >
              Estudo
            </button>
          </div>
        </div>

        {/* Sync Status */}
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all ${
          isClassic 
            ? 'bg-[#151921] border-[#2f3542] text-slate-300' 
            : isSyncLost 
              ? 'bg-[#0e0202] border-red-900/50 text-red-400' 
              : 'bg-[#020d09] border-emerald-900/50 text-emerald-400'
        }`}>
          <Clock className={`h-4.5 w-4.5 ${!isSyncLost && 'animate-spin-[duration:12s]'} ${isClassic ? 'text-[#ffcc00]' : 'text-emerald-450'}`} />
          <div className="text-left font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Relógio Operacional</div>
            <div className={`text-xs font-bold ${isClassic ? 'text-[#ffcc00]' : ''}`}>
              {timeSyncMode}
              {isSyncLost && <span className="text-[9px] text-red-500 ml-1">(! ERR)</span>}
            </div>
          </div>
        </div>

        {/* Network Hub Indicator */}
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all ${
          isClassic 
            ? 'bg-[#151921] border-[#2f3542] text-slate-350' 
            : 'bg-[#050505] border-[#262626]'
        }`}>
          <Wifi className={`h-4.5 w-4.5 ${isClassic ? 'text-[#00ffcc]' : 'text-cyan-400'}`} />
          <div className="text-left font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Barramento</div>
            <div className={`text-xs font-bold ${isClassic ? 'text-[#00ffcc]' : 'text-cyan-400 font-sans'}`}>IEC 61850</div>
          </div>
        </div>

        {/* User context */}
        <div className="text-right hidden xl:block font-mono">
          <div className="text-[10px] text-slate-450 font-bold uppercase">OP. SCADA ID</div>
          <div className={`text-xs font-bold ${isClassic ? 'text-blue-400' : 'text-slate-300 font-sans'}`}>Zeh Sobrinho SENAI</div>
        </div>
      </div>
    </header>
  );
}
