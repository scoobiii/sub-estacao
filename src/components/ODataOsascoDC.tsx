import React, { useState, useMemo } from 'react';
import { 
  Server, 
  Fan, 
  Cpu, 
  Zap, 
  Flame, 
  Activity, 
  Battery, 
  Settings, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  Layers,
  Thermometer,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

interface ODataOsascoDCProps {
  guiStyle: 'CLASSIC_SCADA' | 'HITACHI_ADMS';
  breakers: {
    cb_ac: string;
    cb_rect: string;
    cb_solar: string;
    cb_bess: string;
    cb_load1: string;
    cb_load2: string;
  };
  activeFault: string;
  
  // States connected with App.tsx
  odataGmgActive: boolean;
  onSetOdataGmgActive: (active: boolean) => void;
  odataServerStress: number; // 0 to 100
  onSetOdataServerStress: (stress: number) => void;
  odataHvacSetpoint: number; // 18 to 26
  onSetOdataHvacSetpoint: (setpoint: number) => void;
  
  // Real-time substation telemetry to interact with
  gridVoltage: number;
  busVoltage: number;
}

interface ServerCluster {
  id: string;
  name: string;
  room: string;
  size: number; // weight in treemap
  basePowerKw: number;
  cpuModel: string;
  clientType: 'Cloud Provider' | 'Fintech' | 'E-Commerce' | 'AI Training' | 'Enterprise';
  status: 'NORMAL' | 'BOOST' | 'IDLE';
}

export default function ODataOsascoDC({
  guiStyle,
  breakers,
  activeFault,
  odataGmgActive,
  onSetOdataGmgActive,
  odataServerStress,
  onSetOdataServerStress,
  odataHvacSetpoint,
  onSetOdataHvacSetpoint,
  gridVoltage,
  busVoltage
}: ODataOsascoDCProps) {
  const isClassic = guiStyle === 'CLASSIC_SCADA';

  // Server clusters state simulation
  const [clusters, setClusters] = useState<ServerCluster[]>([
    { id: 'c1', name: 'Hyperscale AI Node Alpha', room: 'Sala de TI 01', size: 30, basePowerKw: 150, cpuModel: 'NVIDIA H100 GPU Clusters', clientType: 'AI Training', status: 'NORMAL' },
    { id: 'c2', name: 'Fintech Core Ledger', room: 'Sala de TI 01', size: 20, basePowerKw: 90, cpuModel: 'Intel Xeon Platinum 64c', clientType: 'Fintech', status: 'NORMAL' },
    { id: 'c3', name: 'Região Cloud Latino-América', room: 'Sala de TI 02', size: 25, basePowerKw: 120, cpuModel: 'AMD EPYC Genoa 96-Core', clientType: 'Cloud Provider', status: 'NORMAL' },
    { id: 'c4', name: 'Plataforma Comércio Eletrônico', room: 'Sala de TI 02', size: 15, basePowerKw: 60, cpuModel: 'ARM Ampere Altra Max 128', clientType: 'E-Commerce', status: 'IDLE' },
    { id: 'c5', name: 'ERP Corporativo Seguro', room: 'Sala de TI 03', size: 10, basePowerKw: 40, cpuModel: 'Intel Xeon Scalable Gen4', clientType: 'Enterprise', status: 'NORMAL' },
  ]);

  const [selectedClusterId, setSelectedClusterId] = useState<string>('c1');

  // Interactive toggle to boost a single cluster in the treemap
  const handleToggleClusterBoost = (id: string) => {
    setClusters(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'BOOST' ? 'NORMAL' : 'BOOST';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // Stress sliders or buttons
  const handleSetAllStressLevel = (level: number) => {
    onSetOdataServerStress(level);
    // synchronize clusters status based on level
    setClusters(prev => prev.map(c => {
      if (level > 70) {
        return { ...c, status: 'BOOST' };
      } else if (level < 20) {
        return { ...c, status: 'IDLE' };
      } else {
        return { ...c, status: 'NORMAL' };
      }
    }));
  };

  // Computations based on server stress and setpoint
  const totalServerItPowerKw = useMemo(() => {
    return clusters.reduce((acc, c) => {
      let multiplier = 1.0;
      if (c.status === 'BOOST') multiplier = 2.4; 
      else if (c.status === 'IDLE') multiplier = 0.5;
      
      // Global stress slider scales everything slightly
      const globalScale = 0.5 + (odataServerStress / 100);
      return acc + (c.basePowerKw * multiplier * globalScale);
    }, 0);
  }, [clusters, odataServerStress]);

  // HVAC Power calculation - lower temperature setpoint and higher server thermal radiation results in more refrigeration electrical load
  const hvacThermalLoadW = totalServerItPowerKw * 0.85; // ~85% of IT power turns directly to structural thermal load
  const hvacPowerKw = useMemo(() => {
    // Thermal efficiency coefficient based on temperature target. 21°C is nominal.
    const tempDeltaFactor = Math.max(0.5, (30 - odataHvacSetpoint) / 8); 
    const chillerLoad = (hvacThermalLoadW / 3.4) * tempDeltaFactor; // COP of ~3.4
    const fanLoad = 35 + (odataServerStress * 0.65); // Air handlers speed power
    return Math.round(chillerLoad + fanLoad);
  }, [hvacThermalLoadW, odataHvacSetpoint, odataServerStress]);

  const totalOdataDcDrawKw = Math.round(totalServerItPowerKw + hvacPowerKw + 45); // +45kW other auxiliaries (UPS charging, utility, lights)

  // GMG Generators Standby sizing: 3 Diesel Engines of 1500kVA (1200kW active output each)
  // Total backup capacity: 3600 kW active.
  const gmgCapablePowerKw = 3600;
  const gmgLoadPercentage = odataGmgActive ? (totalOdataDcDrawKw / gmgCapablePowerKw) * 100 : 0;
  
  // Power source availability at DC:
  const isGridAvailable = breakers.cb_ac === 'CLOSED' && activeFault !== 'Curto AC 138kV';
  const hasPowerAtDc = isGridAvailable || odataGmgActive;

  // Selected cluster calculations
  const activeCluster = useMemo(() => {
    return clusters.find(c => c.id === selectedClusterId) || clusters[0];
  }, [clusters, selectedClusterId]);

  const activeClusterPowerKw = useMemo(() => {
    let multiplier = 1.0;
    if (activeCluster.status === 'BOOST') multiplier = 2.4;
    else if (activeCluster.status === 'IDLE') multiplier = 0.5;
    const globalScale = 0.5 + (odataServerStress / 100);
    return Math.round(activeCluster.basePowerKw * multiplier * globalScale);
  }, [activeCluster, odataServerStress]);

  return (
    <div id="odata-dc-wrapper" className={`grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 ${
      isClassic 
        ? 'bg-[#151924] border-2 border-t-[#3b4356] border-l-[#3b4356] border-[#0f1118] text-slate-350 font-mono' 
        : 'text-white'
    }`}>
      
      {/* LEFT AREA: Data Center Infrastructure Metrics & Direct Substation Connection (5 columns) */}
      <div id="odata-infra-col" className="lg:col-span-5 flex flex-col gap-4">
        
        {/* CABINE PRIMÁRIA & GRUPO GERADOR DIESEL (GMG) CARD */}
        <div id="odata-sub-card" className={`p-4 border ${
          isClassic 
            ? 'bg-[#090b11] border-[#292f40] shadow-inner' 
            : 'bg-[#0a0a0a] border border-[#262626] rounded-xl'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${hasPowerAtDc ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
              Cabine Primária SP-01 • ODATA Osasco
            </span>
            <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded border ${
              isGridAvailable 
                ? (isClassic ? 'bg-[#00331a] text-emerald-400 border-emerald-500/25' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                : (isClassic ? 'bg-[#330000] text-red-400 border-red-500/25' : 'bg-red-500/10 text-red-400 border-red-500/20')
            }`}>
              {isGridAvailable ? 'ALIMENTAÇÃO: ENEL GRID' : 'GRAVE: GRID APAGADO'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            A cabine primária conecta a subestação de entrada do ODATA Osasco. Em caso de instabilidade na rede elétrica externa (curto ou blackout), os disjuntores de transferência isolam a carga interna na barra rápida em menos de 8ms para evitar danos aos servidores.
          </p>

          {/* Electric Schematics */}
          <div className="p-3 bg-black/60 border border-[#262626] rounded-lg mb-4 space-y-2 text-[11px]">
            <div className="flex justify-between items-center text-slate-400">
              <span>Tensão Primária de Linha:</span>
              <span className="font-bold text-slate-200">{isGridAvailable ? `${(gridVoltage * 0.1).toFixed(1)} kV` : '0.0 kV'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Tensão Barramento Interno TI:</span>
              <span className="font-bold text-slate-200">{hasPowerAtDc ? `${(busVoltage * 1.0).toFixed(0)} Vcc` : '0 V (Colapso UPS)'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Consumo Elétrico Acumulado:</span>
              <span className="font-bold text-cyan-400">{hasPowerAtDc ? `${totalOdataDcDrawKw} kW` : '0 kW'}</span>
            </div>
          </div>

          {/* GRUPO MOTOR GERADOR (GMG) DISPATCH & MANIPULATION */}
          <div className="border-t border-[#262626]/80 pt-3.5 mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                <Zap className="h-4 w-4 text-amber-500" />
                Grupo Motor Gerador (GMG) Stand-by de Emergência
              </h4>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded ${
                odataGmgActive 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' 
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}>
                {odataGmgActive ? 'EM CARGA/SINCRONIZADO' : 'PRONTO (STANDBY)'}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Sistema redundante de 3 geradores diesel Caterpillar de 1200kW cada. Sincronismo automático QTA integrado para substituição física imediata da rede AC concessionária ou auxílio da bateria BESS em regime térmico severo.
            </p>

            {/* Generators telemetry stats when active */}
            {odataGmgActive && (
              <div className="grid grid-cols-3 gap-2 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-center font-mono text-[10.5px]">
                <div>
                  <div className="text-slate-500 text-[8px] uppercase font-bold">Gerado Total</div>
                  <div className="font-bold text-amber-500">{totalOdataDcDrawKw} kW</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[8px] uppercase font-bold">Fator Carga</div>
                  <div className="font-bold text-slate-200">{gmgLoadPercentage.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[8px] uppercase font-bold">Combustível</div>
                  <div className="font-semibold text-emerald-400">92.5%</div>
                </div>
              </div>
            )}

            {/* Maneuver trigger buttons! */}
            <div className="flex gap-2 pt-1">
              {!odataGmgActive ? (
                <button
                  id="btn-gmg-start"
                  onClick={() => onSetOdataGmgActive(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-sans font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Maneira Manual: Sincronizar e Assumir com GMG
                </button>
              ) : (
                <button
                  id="btn-gmg-stop"
                  onClick={() => onSetOdataGmgActive(false)}
                  className="w-full bg-slate-900 border border-[#444444] hover:bg-slate-800 hover:text-white text-slate-300 font-sans font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Desligar GMG & Restabelecer Transmissão Concessionária
                </button>
              )}
            </div>
            
            <div className="text-[9px] text-slate-500 flex items-center gap-1 leading-normal font-sans">
              <HelpCircle className="h-3 w-3 text-cyan-500 shrink-0" />
              <span>A manobra descarrega o consumo do barramento externo para o circuito interno diesel.</span>
            </div>
          </div>
        </div>

        {/* HVAC INDUSTRIAL THERMAL UTILITY CARD */}
        <div id="odata-hvac-card" className={`p-4 border ${
          isClassic 
            ? 'bg-[#090b11] border-[#292f40]' 
            : 'bg-[#0a0a0a] border border-[#262626] rounded-xl'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#22d3ee] flex items-center gap-2">
              <Fan className="h-4 w-4 text-cyan-400 animate-spin whitespace-nowrap" style={{ animationDuration: '4s' }} />
              Utilidades Centrais: Climatização HVAC
            </span>
            <div className="text-[9.5px] text-slate-400 font-mono">
              Temp. Ambiente Interna: <strong className="text-white">{(odataHvacSetpoint + (odataServerStress * 0.04)).toFixed(1)} °C</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
            Resfriamento por chillers redundantes de água gelada que alimentam as CRAHs (Centrales de Ar de Precisão). O setpoint menor e o maior stress forçam o sistema de climatização a consumir mais eletricidade.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#050505] border border-[#1e1e1e] p-2.5 rounded-lg text-center">
              <span className="text-slate-500 text-[8.5px] font-bold block uppercase">Potência Chillers + CRAH</span>
              <span className="text-sm font-extrabold text-[#22d3ee] font-mono">{hvacPowerKw} kW</span>
            </div>
            <div className="bg-[#050505] border border-[#1e1e1e] p-2.5 rounded-lg text-center">
              <span className="text-slate-500 text-[8.5px] font-bold block uppercase">Carga Térmica Dissipada</span>
              <span className="text-sm font-extrabold text-orange-400 font-mono">{Math.round(hvacThermalLoadW)} kWt</span>
            </div>
          </div>

          {/* HVAC Slider Setpoint adjustment */}
          <div className="space-y-2 bg-black/40 border border-[#262626]/60 p-3 rounded-lg">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1 font-sans">
                <Settings className="h-3.5 w-3.5 text-cyan-400" /> Setpoint de Climatização Corredor Frio:
              </span>
              <span className="text-cyan-400 font-bold font-mono">{odataHvacSetpoint} °C</span>
            </div>
            <input 
              type="range"
              min="18"
              max="26"
              step="1"
              value={odataHvacSetpoint}
              onChange={(e) => onSetOdataHvacSetpoint(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Frio Máximo (Consome Mais kW)</span>
              <span>Nominal (21°C)</span>
              <span>Econômico (26°C)</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT AREA: Interactive Server Treemap & Load Stress Management (7 columns) */}
      <div id="odata-servers-col" className="lg:col-span-7 flex flex-col gap-4">
        
        {/* INTERACTIVE SERVER TREEMAP CARD */}
        <div id="odata-treemap-card" className={`p-4 border flex flex-col justify-between flex-grow ${
          isClassic 
            ? 'bg-[#090b11] border-[#292f40] shadow-inner' 
            : 'bg-[#0a0a0a] border border-[#262626] rounded-xl'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#22d3ee] flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                Matriz de Servidores e Racks (Treemap de Carga Térmica/IT)
              </span>
              <span className="text-slate-500 font-mono text-[9.5px]">
                Consumo TI: <strong className="text-cyan-400">{Math.round(totalServerItPowerKw)} kW</strong>
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Cada retalho retangular representa um cluster de servidores nas salas físicas co-located de Osasco. O tamanho do bloco indica a densidade física do cluster, e a <span className="text-orange-400 font-bold">cor</span> representa a intensidade térmica decorrente da carga computacional ativa (clique no bloco para detalhar ou injetar stress manual).
            </p>

            {/* DYNAMIC TREEMAP CONTAINER COMPONENT */}
            <div id="servers-treemap-grid" className="grid grid-cols-12 gap-2 h-72 min-h-[280px]">
              {clusters.map((c) => {
                const isSelected = selectedClusterId === c.id;
                
                // Thermal Color mappings based on server status
                let colorClasses = '';
                if (c.status === 'BOOST') {
                  colorClasses = 'bg-gradient-to-br from-red-950/80 to-orange-950/80 border-orange-500 hover:opacity-100 shadow-lg shadow-orange-950/20';
                } else if (c.status === 'IDLE') {
                  colorClasses = 'bg-[#0d0d12]/90 border-[#1f1f2a] text-slate-500';
                } else {
                  colorClasses = 'bg-[#121216] border-[#292934] hover:bg-[#181820] text-slate-300';
                }

                // Grid sizing logic based on size attribute
                let colSpan = 'col-span-4';
                if (c.size >= 30) colSpan = 'col-span-7 row-span-2 md:col-span-6';
                else if (c.size >= 25) colSpan = 'col-span-5 row-span-2 md:col-span-6';
                else if (c.size >= 20) colSpan = 'col-span-4 row-span-1 md:col-span-4';
                else if (c.size >= 15) colSpan = 'col-span-4 row-span-1 md:col-span-4';
                else colSpan = 'col-span-3 row-span-1 md:col-span-4';

                const clusterPower = Math.round(c.basePowerKw * (c.status === 'BOOST' ? 2.4 : c.status === 'IDLE' ? 0.5 : 1.0) * (0.5 + (odataServerStress / 100)));

                return (
                  <button
                    key={c.id}
                    id={`cluster-tile-${c.id}`}
                    onClick={() => setSelectedClusterId(c.id)}
                    className={`relative p-3 border rounded-xl flex flex-col justify-between text-left transition-all overflow-hidden group cursor-pointer ${colorClasses} ${
                      isSelected ? 'ring-2 ring-cyan-400 border-transparent scale-99' : 'hover:scale-100'
                    } ${colSpan}`}
                  >
                    <div>
                      {/* Cluster Room Indicator & Heat icon */}
                      <div className="flex justify-between items-start">
                        <span className="text-[8.5px] uppercase font-mono tracking-wider text-slate-500">
                          {c.room}
                        </span>
                        {c.status === 'BOOST' && (
                          <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse shrink-0" />
                        )}
                        {isSelected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 absolute top-2 right-2 animate-ping" />
                        )}
                      </div>

                      <h5 className="text-[11px] md:text-xs font-bold font-sans mt-1.5 text-slate-100 truncate group-hover:text-cyan-300 leading-snug">
                        {c.name}
                      </h5>
                      <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {c.cpuModel}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <span className="text-[8px] text-slate-500 uppercase font-mono block">Consumo</span>
                        <span className={`text-[11.5px] font-mono font-bold ${c.status === 'BOOST' ? 'text-orange-400' : 'text-slate-200'}`}>
                          {clusterPower} kW
                        </span>
                      </div>
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        c.status === 'BOOST' 
                          ? 'bg-red-900/40 text-red-400' 
                          : c.status === 'IDLE' 
                            ? 'bg-slate-900 text-slate-400'
                            : 'bg-emerald-900/30 text-emerald-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DETAILED CLUSTER STATISTICS & LOCAL STRESS TOOL */}
          <div className="border-t border-[#262626] pt-4 mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Left part: cluster spec detailed */}
            <div className="md:col-span-7 space-y-2">
              <span className="bg-cyan-900/40 text-cyan-400 border border-cyan-800/10 text-[8.5px] font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                Cluster Selecionado: {activeCluster.id.toUpperCase()}
              </span>
              <h4 className="text-xs font-bold text-slate-100 font-sans mt-0.5">{activeCluster.name}</h4>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono text-slate-400">
                <span>Segmento Alocado:</span>
                <span className="text-right text-slate-200">{activeCluster.clientType}</span>

                <span>Hardware Equipamento:</span>
                <span className="text-right text-slate-200 truncate">{activeCluster.cpuModel}</span>

                <span>Consumo CPU Físico:</span>
                <span className="text-right font-bold text-cyan-400">{activeClusterPowerKw} kW</span>

                <span>Emissão Térmica:</span>
                <span className={`text-right font-bold ${activeCluster.status === 'BOOST' ? 'text-orange-400' : 'text-slate-200'}`}>
                  {Math.round(activeClusterPowerKw * 0.85)} kWt
                </span>
              </div>
            </div>

            {/* Right part: stress actions for cluster & globally */}
            <div className="md:col-span-5 flex flex-col justify-between border-l border-[#262626]/60 pl-4 space-y-3">
              <div>
                <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold tracking-wider mb-1.5">
                  Injetor de Carga (Stress Relé)
                </span>
                
                {/* Specific Cluster Toggle */}
                <button
                  id={`btn-boost-${activeCluster.id}`}
                  onClick={() => handleToggleClusterBoost(activeCluster.id)}
                  className={`w-full py-1.5 px-2 text-[10.5px] font-mono rounded-lg border font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                    activeCluster.status === 'BOOST'
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/15'
                      : 'bg-[#15151a] border-slate-700/50 hover:border-slate-600 text-slate-200'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 shrink-0" />
                  {activeCluster.status === 'BOOST' ? 'Normalizar Carga do Rack' : 'Injetar Stress de CPU (BOOST)'}
                </button>
              </div>

              {/* Global scale slider */}
              <div className="space-y-1 pt-1.5 border-t border-[#262626]/40">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Carga de Processamento Global:</span>
                  <span className="text-amber-400 font-bold">{odataServerStress}%</span>
                </div>
                <div className="flex gap-1">
                  <button
                    id="btn-stress-25"
                    onClick={() => handleSetAllStressLevel(25)}
                    className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer ${odataServerStress === 25 ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-extrabold' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >
                    25% Idle
                  </button>
                  <button
                    id="btn-stress-60"
                    onClick={() => handleSetAllStressLevel(60)}
                    className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer ${odataServerStress === 60 ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-extrabold' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >
                    60% Nom
                  </button>
                  <button
                    id="btn-stress-95"
                    onClick={() => handleSetAllStressLevel(95)}
                    className={`flex-1 py-1 text-[9px] font-mono font-bold rounded cursor-pointer ${odataServerStress === 95 ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold animate-pulse' : 'bg-slate-900 text-slate-400 hover:text-[#f87171]'}`}
                  >
                    95% Stress
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* INDUSTRIAL COMPLIANCE LOGS - SENAI PERSPECTIVE */}
        <div id="odata-compliance-logs" className="p-3 bg-slate-950/40 border border-[#262626]/60 rounded-xl leading-relaxed">
          <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-extrabold block mb-1">
            Requisitos de Automação & Comissionamento (SENAI-SP)
          </span>
          <div className="flex items-start gap-2 text-[10px] text-slate-400">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p>
                <strong>Coordenação de Proteção IED-ODATA:</strong> Racks sobrecarregados dissipam alta amperagem nos inversores de dupla conversão. Se os IEDs de proteção estiverem mal parametrizados (ex: Corrente Máxima ou ANSI 59DC ajustados muito perto da nominal), o trip se comportará como cascata e derrubará a redundância das salas de dados. O monitoramento do Treemap e das utilidades é fundamental para o comissionamento do HVAC em subestações de alta disponibilidade!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
