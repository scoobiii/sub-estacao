import React, { useState } from 'react';
import { IEDConfig } from '../types';
import { Shield, Settings, Server, Info, RefreshCw } from 'lucide-react';

interface IEDSettingsProps {
  ieds: IEDConfig[];
  onUpdateIedConfig: (id: string, updated: Partial<IEDConfig>) => void;
  onResetIeds: () => void;
}

export default function IEDSettings({
  ieds,
  onUpdateIedConfig,
  onResetIeds,
}: IEDSettingsProps) {
  const [selectedIedId, setSelectedIedId] = useState<string>(ieds[1]?.id || ieds[0]?.id || '');
  const activeIed = ieds.find(i => i.id === selectedIedId) || ieds[0];

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#262626] p-4 h-full flex flex-col">
      
      {/* Visual Title */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-300 font-sans flex items-center gap-2">
          <Shield className="h-4.5 w-4.5 text-cyan-400" />
          Ajustes de Proteção IP/ANSI de IEDs (IEC 61850)
        </h3>
        <button
          onClick={onResetIeds}
          className="text-slate-400 hover:text-cyan-400 text-xs font-mono flex items-center gap-1 bg-[#050505] border border-[#262626] px-2 py-1 rounded cursor-pointer transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Padronizar Relés
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-grow">
        
        {/* Left column: List of IED devices (4 Columns) */}
        <div className="md:col-span-4 flex flex-col gap-2">
          <span className="text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Lista de Relés (IEDs)</span>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[190px]">
            {ieds.map(i => {
              const isSelected = selectedIedId === i.id;
              return (
                <button
                  key={i.id}
                  onClick={() => setSelectedIedId(i.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1a1a1a] border-[#444444] text-cyan-400 font-semibold'
                      : 'bg-[#050505]/40 border-[#262626]/60 text-slate-400 hover:text-slate-200 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Server className={`h-4 w-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <div className="text-[11px] font-semibold font-sans truncate leading-tight">{i.name}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{i.ipAddress}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Config Details for the Selected IED (8 Columns) */}
        <div className="md:col-span-8 bg-[#050505] border border-[#262626] rounded-xl p-4 flex flex-col justify-between font-mono text-slate-350">
          
          <div className="space-y-4">
            {/* Header: Name and IP address */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#262626]/60 pb-2.5">
              <div>
                <span className="bg-cyan-900/40 text-cyan-400 border border-cyan-800/20 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                  Logical Device (LD)
                </span>
                <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-800/20 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ml-1.5">
                  LD_{activeIed.role}
                </span>
                <h4 className="text-sm font-bold text-slate-200 mt-1 font-sans">{activeIed.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{activeIed.description}</p>
              </div>
              <div className="text-right text-[10px] sm:text-xs">
                <span className="text-slate-500">IP:</span> <span className="text-slate-300 font-bold">{activeIed.ipAddress}</span>
              </div>
            </div>

            {/* Slider Config Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* GOOSE settings */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                  <Settings className="h-3.5 w-3.5 text-orange-400" /> Telecomunicações (IEC)
                </span>
                
                <div className="space-y-2 text-[10px] bg-[#0f0f0f]/50 p-3 rounded-lg border border-[#262626]/40">
                  <div className="flex justify-between">
                    <span className="text-slate-500">GOOSE AppID:</span>
                    <span className="text-slate-200 text-right">{activeIed.gooseAppId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">VLAN ID Tagging:</span>
                    <span className="text-emerald-400 text-right">{activeIed.gooseVlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sincronismo Tempo:</span>
                    <span className="text-cyan-400 text-right">{activeIed.timeSyncMode}</span>
                  </div>
                </div>
              </div>

              {/* Adjustable protection curves */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-rose-500" /> Limites Operacionais ANSI
                </span>

                {/* Overvoltage ANSI 59 */}
                {activeIed.role === 'PUB_SUB_PROT' && (
                  <div className="space-y-1.5 bg-[#0f0f0f]/50 p-2.5 rounded-lg border border-[#262626]/40">
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-slate-400">ANSI 59 (Overvolt AC):</span>
                      <span className="text-cyan-400 font-bold">{activeIed.ansi59Limit} kV</span>
                    </div>
                    <input 
                      type="range"
                      min="140"
                      max="160"
                      step="1"
                      value={activeIed.ansi59Limit}
                      onChange={(e) => onUpdateIedConfig(activeIed.id, { ansi59Limit: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                )}

                {/* Undervoltage ANSI 27DC */}
                {activeIed.role === 'BCU' && (
                  <div className="space-y-2 bg-[#0f0f0f]/50 p-2.5 rounded-lg border border-[#262626]/40">
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-slate-400">ANSI 27DC (Subvolt CC):</span>
                      <span className="text-yellow-400 font-bold">{activeIed.ansi27DCLimitLow} Vcc</span>
                    </div>
                    <input 
                      type="range"
                      min="640"
                      max="760"
                      step="5"
                      value={activeIed.ansi27DCLimitLow}
                      onChange={(e) => onUpdateIedConfig(activeIed.id, { ansi27DCLimitLow: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="text-[8px] text-slate-500 leading-normal">
                      Rebalanceia se a tensão do barramento e BESS cair abaixo deste patamar.
                    </div>
                  </div>
                )}

                {/* Overvoltage ANSI 59DC */}
                {activeIed.role === 'BCU' && (
                  <div className="space-y-2 bg-[#0f0f0f]/50 p-2.5 rounded-lg border border-[#262626]/40">
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-slate-400">ANSI 59DC (Overvolt CC):</span>
                      <span className="text-red-400 font-bold">{activeIed.ansi59DCLimitHigh} Vcc</span>
                    </div>
                    <input 
                      type="range"
                      min="820"
                      max="940"
                      step="5"
                      value={activeIed.ansi59DCLimitHigh}
                      onChange={(e) => onUpdateIedConfig(activeIed.id, { ansi59DCLimitHigh: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                    <div className="text-[8px] text-slate-500 leading-normal">
                      Isola solar FV se a geração exceder absorção das baterias acima disto.
                    </div>
                  </div>
                )}

                {activeIed.role !== 'PUB_SUB_PROT' && activeIed.role !== 'BCU' && (
                  <div className="text-slate-500 text-[10px] p-4 text-center border border-dashed border-[#262626] rounded-lg bg-[#0f0f0f]/20">
                    Não existem relés de limiares analógicos reconfiguráveis neste dispositivo de apoio.
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="mt-4 border-t border-slate-800 pt-3 flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed font-sans">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>Mapeamento GOOSE:</strong> Quando um limiar ANSI é violado, o relé correspondente monta um frame multicast e o despacha na VLAN {activeIed.gooseVlan}. Outros IEDs da subestação que assinam este cabeçalho reagem instantaneamente e isolam os circuitos afetados.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
