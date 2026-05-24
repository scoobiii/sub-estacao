import { Activity, Clock, ShieldAlert, Wifi } from 'lucide-react';
import { SyncProtocol } from '../types';

interface HeaderProps {
  appName: string;
  timeSyncMode: SyncProtocol;
  timeSyncAccuracy: string;
  isSyncLost: boolean;
  systemTime: string;
}

export default function Header({
  appName,
  timeSyncMode,
  timeSyncAccuracy,
  isSyncLost,
  systemTime,
}: HeaderProps) {
  return (
    <header className="bg-[#0f0f0f] border-b border-[#262626] text-white py-4 px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="bg-amber-500 text-slate-950 p-2.5 rounded-lg flex items-center justify-center font-bold relative">
          <Activity className="h-5 w-5" />
          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 font-sans">{appName}</h1>
            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-amber-500/20">
              800 VDC Bus
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Capacitação SENAI Pirituba • Automação de Subestações Digitais (IEC 61850)
          </p>
        </div>
      </div>

      {/* Sync & Tech Status Block */}
      <div className="flex flex-wrap items-center gap-3 md:gap-5">
        {/* Sync Status */}
        <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all ${
          isSyncLost 
            ? 'bg-[#0e0202] border-red-900/50 text-red-400' 
            : 'bg-[#020d09] border-emerald-900/50 text-emerald-400'
        }`}>
          <Clock className={`h-4.5 w-4.5 ${!isSyncLost && 'animate-spin-[duration:10s]'}`} />
          <div className="text-left">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Sincronismo de Tempo</div>
            <div className="text-xs font-bold font-mono">
              {timeSyncMode} ({timeSyncAccuracy})
              {isSyncLost && <span className="text-[9px] text-red-500 ml-1">(ALERTA: Perda)</span>}
            </div>
          </div>
        </div>

        {/* Network Hub Indicator */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border bg-[#050505] border-[#262626]">
          <Wifi className="h-4.5 w-4.5 text-cyan-400" />
          <div className="text-left font-mono">
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Barramento de Processo</div>
            <div className="text-xs font-bold text-cyan-400 font-sans">IEC 61850 (SV/GOOSE)</div>
          </div>
        </div>

        {/* User context */}
        <div className="text-right hidden xl:block">
          <div className="text-[10px] text-slate-400 font-medium">Aluno Conectado</div>
          <div className="text-xs font-bold text-slate-300 font-mono">José Soares Sobrinho (Zeh)</div>
        </div>
      </div>
    </header>
  );
}
