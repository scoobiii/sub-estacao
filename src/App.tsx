import { useState, useEffect, useRef } from 'react';
import { 
  Telemetry, 
  NetworkPacket, 
  IEDConfig, 
  ThermogramHotspot, 
  SwitchState, 
  SyncProtocol,
  Substation
} from './types';
import Header from './components/Header';
import SingleLineDiagram from './components/SingleLineDiagram';
import NetworkMonitor from './components/NetworkMonitor';
import ThermalView from './components/ThermalView';
import ControlPanel from './components/ControlPanel';
import IEDSettings from './components/IEDSettings';
import HelpManual from './components/HelpManual';
import SubstationConfig from './components/SubstationConfig';
import { Shield, Zap, Layers, Eye, BookOpen, AlertCircle, RefreshCw, HelpCircle, Globe } from 'lucide-react';

export default function App() {
  const [activeSegment, setActiveSegment] = useState<'OPERACAO' | 'REDES' | 'TERMOGRAFIA' | 'MANUAL' | 'SUBESTACOES'>('OPERACAO');

  // 1. Core States for Substation breakers and switches
  const [breakers, setBreakers] = useState({
    cb_ac: 'CLOSED' as SwitchState,
    cb_rect: 'CLOSED' as SwitchState,
    cb_solar: 'CLOSED' as SwitchState,
    cb_bess: 'CLOSED' as SwitchState,
    cb_load1: 'CLOSED' as SwitchState,
    cb_load2: 'CLOSED' as SwitchState,
  });

  // 2. Control Parameter States
  const [load1Param, setLoad1Param] = useState<number>(450); // kW
  const [load2Param, setLoad2Param] = useState<number>(300); // kW
  const [solarIrradianceParam, setSolarIrradianceParam] = useState<number>(750); // W/m²
  const [bessTargetParam, setBessTargetParam] = useState<number>(-125); // kW (- is discharging, + charging)
  
  const [activeFault, setActiveFault] = useState<string>('Nenhum');
  const [timeSyncMode, setTimeSyncMode] = useState<SyncProtocol>('PTP');
  
  // 3. Contact resistance fault injections (for thermography)
  const [simulatedFaultHotspots, setSimulatedFaultHotspots] = useState<Record<string, boolean>>({
    rect_joint: false,
    bus_coupling: false,
    bess_coupler: false,
    solar_combiner: false,
  });

  // 4. Time Synchronism details
  const getSyncAccuracy = (mode: SyncProtocol) => {
    switch (mode) {
      case 'PTP': return '±35 ns (Excelente)';
      case 'GPS': return '±15 ns (Mestre)';
      case 'IRIG-B': return '±2.4 μs (Industrial)';
      case 'NTP': return '±18.5 ms (Incertidão Alta)';
    }
  };

  // 5. IED protective parameters database
  const [ieds, setIeds] = useState<IEDConfig[]>([
    {
      id: 'MU_BAY1',
      name: 'Merging Unit MU-BAY1',
      description: 'Conversão A/D de TCs/TPs em Sampled Values da subestação',
      role: 'MU',
      ipAddress: '192.168.10.11',
      ansi59Limit: 145,
      ansi27DCLimitLow: 720,
      ansi59DCLimitHigh: 880,
      gooseAppId: '0x4001',
      gooseVlan: 10,
      ptpDomain: 0,
      timeSyncMode: 'PTP',
    },
    {
      id: 'PROT_FEEDER',
      name: 'IED Proteção AC RET-511',
      description: 'Relé de Sobrecorrente (50/51) e Sobretensão (59) AC da Linha 138kV',
      role: 'PUB_SUB_PROT',
      ipAddress: '192.168.10.12',
      ansi59Limit: 145,
      ansi27DCLimitLow: 720,
      ansi59DCLimitHigh: 880,
      gooseAppId: '0x3011',
      gooseVlan: 10,
      ptpDomain: 0,
      timeSyncMode: 'PTP',
    },
    {
      id: 'BCU_DC_800V',
      name: 'IED Controle CC BCU-CC80',
      description: 'Relé de Controle e Proteção do Barramento 800Vcc (ANSI 27DC/59DC)',
      role: 'BCU',
      ipAddress: '192.168.10.13',
      ansi59Limit: 145,
      ansi27DCLimitLow: 720,
      ansi59DCLimitHigh: 880,
      gooseAppId: '0x2022',
      gooseVlan: 10,
      ptpDomain: 0,
      timeSyncMode: 'PTP',
    }
  ]);

  // 5.1. Registered regional substations list
  const [substations, setSubstations] = useState<Substation[]>([
    {
      id: 'sub_pirituba',
      name: 'ET Pirituba - Enel SP',
      lat: -23.5049,
      lon: -46.7214,
      voltage: '138 kV / 13.8 kV',
      operator: 'Enel São Paulo',
      type: 'Distribuição',
      city: 'São Paulo (Pirituba)',
      source: 'MANUAL'
    },
    {
      id: 'sub_anhanguera',
      name: 'SE Anhanguera - CTEEP',
      lat: -23.4912,
      lon: -46.7485,
      voltage: '230 kV / 138 kV',
      operator: 'ISA CTEEP',
      type: 'Transmissão',
      city: 'São Paulo (Anhanguera)',
      source: 'MANUAL'
    },
    {
      id: 'sub_lapa',
      name: 'ET Lapa - Enel SP',
      lat: -23.5221,
      lon: -46.7015,
      voltage: '138 kV',
      operator: 'Enel São Paulo',
      type: 'Distribuição',
      city: 'São Paulo (Lapa)',
      source: 'MANUAL'
    }
  ]);

  const [selectedSubstationId, setSelectedSubstationId] = useState<string>('sub_pirituba');
  const activeSubstation = substations.find(s => s.id === selectedSubstationId) || substations[0];

  // Telemetry real-time values
  const [telemetry, setTelemetry] = useState<Telemetry>({
    gridVoltage: 138.2,
    gridFreq: 60.01,
    gridActivePower: 0.65,
    gridReactivePower: 0.12,
    
    rectifierVoltageOut: 799.4,
    rectifierCurrentOut: 450,
    rectifierTempCelsius: 48.5,
    rectifierEfficiency: 95.8,
    
    bus800VdcVoltage: 798.2,
    bus800VdcCurrent: 712.5,
    bus800VdcPowerKw: 570.0,
    
    bessVoltage: 798.5,
    bessCurrent: -156.2,
    bessSoc: 82.4,
    bessTemp: 31.2,
    bessStatus: 'DISCHARGING',
    
    solarVoltage: 801.4,
    solarCurrent: 212.5,
    solarPowerKw: 170.0,
    solarIrradiance: 750,
    
    dcLoad1Voltage: 798.2,
    dcLoad1Current: 437.5,
    dcLoad1PowerKw: 350.0,
    
    dcLoad2Voltage: 798.2,
    dcLoad2Current: 275.0,
    dcLoad2PowerKw: 220.0,
  });

  // Packet monitoring queue state
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const packetIdCounterRef = useRef<number>(1001);

  // Generate mock time string for log
  const getCurrentFormattedTime = () => {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    
    if (timeSyncMode === 'PTP' && activeFault !== 'Perda Sincronismo Temporal') {
      const ns = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${h}:${m}:${s}.${ms}.${ns}`;
    }
    return `${h}:${m}:${s}.${ms}`;
  };

  // Function to create a standard packet into our live stream queue
  const injectPacket = (
    protocol: 'GOOSE' | 'SV' | 'MMS' | 'PTP',
    source: string,
    destination: string,
    description: string,
    payload: Record<string, string | number | boolean>,
    isAlert = false
  ) => {
    const newPacket: NetworkPacket = {
      id: `PKT-${packetIdCounterRef.current++}`,
      timestamp: getCurrentFormattedTime(),
      protocol,
      source,
      destination,
      description,
      payload,
      isAlert,
    };

    setPackets(prev => {
      // Keep up to 50 packets in memory
      const list = [newPacket, ...prev];
      if (list.length > 50) return list.slice(0, 50);
      return list;
    });
  };

  // Populate first bunch of packets on mount
  useEffect(() => {
    // Generate initial packets
    const firstPackets: NetworkPacket[] = [
      {
        id: 'PKT-995',
        timestamp: '10:41:02.124.015',
        protocol: 'MMS',
        source: 'IED.BCU_DC_800V',
        destination: '192.168.10.100 (SCADA)',
        description: 'SCADA Telemetria Periódica do Barramento CC',
        payload: { BusV: 798.2, TotalPowerKw: 570.0, Load1Kw: 350.0 }
      },
      {
        id: 'PKT-996',
        timestamp: '10:41:02.120.000',
        protocol: 'PTP',
        source: 'CLOCK.GPS_MASTER',
        destination: 'Multicast PTPv2',
        description: 'PTP Sync Frame - GPS Master Clock',
        payload: { sequence: 1422, accuracy: 'ns', epoch: 0 }
      },
      {
        id: 'PKT-997',
        timestamp: '10:41:02.118.423',
        protocol: 'SV',
        source: 'IED.MU_BAY1',
        destination: 'Multicast SV (01-0C-CD-04-00-01)',
        description: 'Sampled Values 80 amostras/ciclo (Corrente/Tensão)',
        payload: { svID: 'MU_BAY1', phA: 138.2, phB: 138.1, phC: 138.3 }
      },
      {
        id: 'PKT-998',
        timestamp: '10:41:02.115.000',
        protocol: 'GOOSE',
        source: 'IED.PROT_FEEDER',
        destination: 'Multicast GOOSE (01-0C-CD-01-00-01)',
        description: 'Status Heartbeat da Proteção de Linha AC',
        payload: { CB_AC_State: 'CLOSED', CB_AC_Trip: false, seqNum: 512, stNum: 14 }
      }
    ];
    setPackets(firstPackets);
  }, []);

  // Update IED configurations from Settings panel
  const handleUpdateIedConfig = (id: string, updated: Partial<IEDConfig>) => {
    setIeds(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
    
    // Inject packet noting the config adjustment changed via MMS / SCADA
    const affected = ieds.find(i => i.id === id);
    if (affected) {
      injectPacket(
        'MMS',
        '192.168.10.100 (SCADA)',
        affected.ipAddress,
        `Parametrização do Relé alterada: ${Object.keys(updated).join(', ')}`,
        { ied: affected.name, ...updated }
      );
    }
  };

  // Toggling contact resistance
  const handleToggleContactResistance = (id: string) => {
    setSimulatedFaultHotspots(prev => {
      const active = !prev[id];
      const nameMap: Record<string, string> = {
        rect_joint: 'Junta de Clivagem do Retificador C1',
        bus_coupling: 'Barramento Central CC - Junção Principal',
        bess_coupler: 'Acoplador BESS CC de Alta Corrente',
        solar_combiner: 'Painel Combinador Solar FV',
      };

      injectPacket(
        'MMS',
        'IED.BCU_DC_800V',
        '192.168.10.100 (SCADA)',
        `Alerta de Resistência Térmica: ${nameMap[id]} ${active ? 'AUMENTADA' : 'INICIALIZADA'}`,
        { sensorID: id, resistanceDelta: active ? '700%' : '0%' },
        active
      );

      return { ...prev, [id]: active };
    });
  };

  const handleResetIeds = () => {
    setIeds([
      {
        id: 'MU_BAY1',
        name: 'Merging Unit MU-BAY1',
        description: 'Conversão A/D de TCs/TPs em Sampled Values da subestação',
        role: 'MU',
        ipAddress: '192.168.10.11',
        ansi59Limit: 145,
        ansi27DCLimitLow: 720,
        ansi59DCLimitHigh: 880,
        gooseAppId: '0x4001',
        gooseVlan: 10,
        ptpDomain: 0,
        timeSyncMode: 'PTP',
      },
      {
        id: 'PROT_FEEDER',
        name: 'IED Proteção AC RET-511',
        description: 'Relé de Sobrecorrente (50/51) e Sobretensão (59) AC da Linha 138kV',
        role: 'PUB_SUB_PROT',
        ipAddress: '192.168.10.12',
        ansi59Limit: 145,
        ansi27DCLimitLow: 720,
        ansi59DCLimitHigh: 880,
        gooseAppId: '0x3011',
        gooseVlan: 10,
        ptpDomain: 0,
        timeSyncMode: 'PTP',
      },
      {
        id: 'BCU_DC_800V',
        name: 'IED Controle CC BCU-CC80',
        description: 'Relé de Controle e Proteção do Barramento 800Vcc (ANSI 27DC/59DC)',
        role: 'BCU',
        ipAddress: '192.168.10.13',
        ansi59Limit: 145,
        ansi27DCLimitLow: 720,
        ansi59DCLimitHigh: 880,
        gooseAppId: '0x2022',
        gooseVlan: 10,
        ptpDomain: 0,
        timeSyncMode: 'PTP',
      }
    ]);

    injectPacket(
      'MMS',
      '192.168.10.100 (SCADA)',
      '192.168.10.255 (Broadcast)',
      'Comando global: Relés redefinidos para os limites de fábrica',
      { status: 'Default Applied' }
    );
  };

  // Handle Breaker Clicks
  const handleToggleBreaker = (id: string) => {
    setBreakers(prev => {
      const nextState = prev[id as keyof typeof prev] === 'CLOSED' ? 'OPEN' : 'CLOSED';
      const mapNames: Record<string, string> = {
        cb_ac: 'Disjuntor Linha 138kV AC (52-1)',
        cb_rect: 'Disjuntor de Carga do Retificador AC/DC',
        cb_solar: 'Chave de Manobra do Distribuidor PV Solar',
        cb_bess: 'Disjuntor Acoplamento do BESS CC',
        cb_load1: 'Alimentador Industrial CC Carga 1',
        cb_load2: 'Inversor CC/AC Geral Carga 2',
      };

      // Emit high-speed GOOSE packet to process bus
      injectPacket(
        'GOOSE',
        'IED.BCU_DC_800V',
        'Multicast GOOSE (01-0C-CD-01-00-02)',
        `Mudança de Estado: ${mapNames[id]} -> ${nextState}`,
        { breakerId: id, lastState: prev[id as keyof typeof prev], currentState: nextState, tripTriggered: false }
      );

      return {
        ...prev,
        [id]: nextState,
      };
    });
  };

  // Change Synchronism Protocol via header click or button click
  const handleChangeTimeSyncMode = (mode: SyncProtocol) => {
    setTimeSyncMode(mode);
    setIeds(prev => prev.map(i => ({ ...i, timeSyncMode: mode })));
    injectPacket(
      'PTP',
      'CLOCK.CENTRAL_MASTER',
      'Multicast CLOCKS',
      `Fronteira Temporal atualizada para protocolo: ${mode}`,
      { epoch: 10, accuracy: getSyncAccuracy(mode), status: 'CLOCK_RESET' }
    );
  };

  // Simulated live physics engine loop (Ticks every 600ms for high realism)
  useEffect(() => {
    const bcuIed = ieds.find(i => i.role === 'BCU') || ieds[2];
    const protIed = ieds.find(i => i.role === 'PUB_SUB_PROT') || ieds[1];

    const interval = setInterval(() => {
      // 1. Check if an active fault overrides normal status
      const isAcFaultActive = activeFault === 'Curto AC 138kV';
      const isDcShortActive = activeFault === 'Curto Barramento 800VDC';
      const isSyncLost = activeFault === 'Perda Sincronismo Temporal';

      // 2. Automated Protection Interlock via GOOSE (IEC 61850 logic simulation)
      if (isAcFaultActive) {
        // If AC is healthy and short occurs, overcurrent triggers!
        if (breakers.cb_ac === 'CLOSED') {
          // Relé PROT_FEEDER senses immense overcurrent (Trip command via GOOSE)
          injectPacket(
            'GOOSE',
            'IED.PROT_FEEDER',
            'Multicast GOOSE (01-0C-CD-01-00-01)',
            'TRIP DA PROTEÇÃO (ANSI 50/51) - Excesso de Corrente na Entrada 138kV CA',
            { overcurrentTrip: true, measuredI_Amps: 12450, tripBreaker: 'cb_ac', delay_ms: 1.83 },
            true
          );
          
          // SCADA logs it
          injectPacket(
            'MMS',
            '192.168.10.100 (SCADA)',
            'IED.PROT_FEEDER',
            'SCADA Event LOG: Disjuntor 52-1 aberto sob curto AC',
            { breaker: 'cb_ac', alarmState: 'ACTIVATED' },
            true
          );

          // Force breaker open
          setBreakers(prev => ({ ...prev, cb_ac: 'OPEN' }));
        }
      }

      if (isDcShortActive) {
        // DC bus short circuit! Collapses voltage and triggers instant shutdown of rectifiers and batteries
        if (breakers.cb_rect === 'CLOSED' || breakers.cb_bess === 'CLOSED' || breakers.cb_solar === 'CLOSED') {
          injectPacket(
            'GOOSE',
            'IED.BCU_DC_800V',
            'Multicast GOOSE (01-0C-CD-01-00-02)',
            'TRIP DE SUBTENSÃO HISTÉRICA (ANSI 27DC) - Curto de Baixa Resistência Vcc < 50V',
            { undervoltageTrip: true, measuredV: 15.2, tripAllBreakers: true, gooseLatency_ms: 1.25 },
            true
          );

          injectPacket(
            'MMS',
            '192.168.10.100 (SCADA)',
            'IED.BCU_DC_800V',
            'SCADA Alarm: Falha Crítica com Trip Geral de Barramento CC',
            { status: 'BUS_TRIPPED', voltageV: 14.8 },
            true
          );

          // Open all breakers mapping connected inputs to block thermal fire cascade
          setBreakers({
            cb_ac: 'OPEN',
            cb_rect: 'OPEN',
            cb_solar: 'OPEN',
            cb_bess: 'OPEN',
            cb_load1: 'OPEN',
            cb_load2: 'OPEN',
          });
        }
      }

      // 3. Electrical Physics Mathematical Calculations
      // AC GRID
      let gridVolts = 138.0;
      let gridF = 60.00;
      let gridActP = 0.0;
      let gridReactP = 0.0;

      if (!isAcFaultActive && breakers.cb_ac === 'CLOSED') {
        gridVolts = 138.0 + (Math.random() - 0.5) * 0.3;
        gridF = 60.00 + (Math.random() - 0.5) * 0.02;
      } else if (isAcFaultActive) {
        gridVolts = 8.5 + Math.random() * 5.0; // Collapsed
        gridF = 58.2 + Math.random() * 0.8;
      }

      // Solar generation physics
      let solarPower = 0.0;
      let solarVolts = 812.0; // Open circuit voltage
      let solarCurrent = 0.0;
      
      if (breakers.cb_solar === 'CLOSED' && !isDcShortActive) {
        solarPower = (solarIrradianceParam / 1000) * 600; // PV Peak 600 kW capacity
        solarVolts = 794.5 + (Math.random() - 0.5) * 2.0;
        solarCurrent = (solarPower * 1000) / (solarVolts || 1);
      } else if (isDcShortActive && breakers.cb_solar === 'CLOSED') {
        solarVolts = 14.2;
        solarCurrent = 412.0; // high PV short circuit saturation current
        solarPower = (solarVolts * solarCurrent) / 1000;
      }

      // Loads demand calculations
      let load1Power = 0.0;
      let load1Current = 0.0;
      let load2Power = 0.0;
      let load2Current = 0.0;

      let estimatedBusVolts = 0.0;
      
      // Determine what powers the 800VDC Bus:
      // Sources: Rectifier (if AC ok and cb_rect closed) + Solar (if cb_solar closed) + Battery (if cb_bess closed)
      const hasAcFeed = !isAcFaultActive && breakers.cb_ac === 'CLOSED' && breakers.cb_rect === 'CLOSED';
      const hasSolarFeed = breakers.cb_solar === 'CLOSED';
      const hasBessFeed = breakers.cb_bess === 'CLOSED';

      if (isDcShortActive) {
        estimatedBusVolts = 14.5 + (Math.random() - 0.5) * 1.5;
      } else if (hasAcFeed) {
        // Rectifier is a strong voltage source stabilizing bus to ~800 VDC
        estimatedBusVolts = 798.5 + (Math.random() - 0.5) * 2.5;
      } else if (hasBessFeed) {
        // Battery governs voltage source at slightly lower level
        estimatedBusVolts = 790.2 + (bessTargetParam * -0.015) + (Math.random() - 0.5)*1.8;
      } else if (hasSolarFeed && solarIrradianceParam > 100) {
        // Solar only: voltage is floating and highly unstable depending on load!
        const totalLoadsMax = (breakers.cb_load1 === 'CLOSED' ? load1Param : 0) + (breakers.cb_load2 === 'CLOSED' ? load2Param : 0);
        const solarAvailable = (solarIrradianceParam / 1000) * 600;
        if (totalLoadsMax === 0) {
          estimatedBusVolts = 835.2; // floats higher
        } else {
          // Droop depending on load vs power
          const ratios = solarAvailable / (totalLoadsMax || 1);
          estimatedBusVolts = Math.max(120, Math.min(840, 800 * ratios));
        }
      } else {
        estimatedBusVolts = 0.0; // Dead cold bar
      }

      // AC Protection limit warnings (ANSI 59 AC Overvoltage)
      if (gridVolts > protIed.ansi59Limit && breakers.cb_ac === 'CLOSED') {
        injectPacket(
          'GOOSE',
          'IED.PROT_FEEDER',
          'Multicast GOOSE (01-0C-CD-01-00-01)',
          `ALERTA ANSI 59 - SOBRETENSÃO CA DETECTADA EM ${gridVolts.toFixed(1)} kV`,
          { v_measured: gridVolts, limit: protIed.ansi59Limit },
          true
        );
      }

      // DC protection ANSI 27DC Undervoltage alerts mapping
      if (estimatedBusVolts > 50 && estimatedBusVolts < bcuIed.ansi27DCLimitLow) {
        injectPacket(
          'GOOSE',
          'IED.BCU_DC_800V',
          'Multicast GOOSE (01-0C-CD-01-00-02)',
          `ALERTA ANSI 27DC - INSTABILIDADE SUBTENSÃO CC BARRAMENTO: ${estimatedBusVolts.toFixed(1)} Vcc < ${bcuIed.ansi27DCLimitLow}V`,
          { v_measured: estimatedBusVolts, limit: bcuIed.ansi27DCLimitLow },
          true
        );

        // Inside the simulation, if the voltage drops below ANSI 27DC (e.g. 720V) and batteries are open,
        // our Relé BCU will automatically trip the load disjuntores to protect from complete discharge!
        if (!hasBessFeed && !hasAcFeed && hasSolarFeed) {
          injectPacket(
            'GOOSE',
            'IED.BCU_DC_800V',
            'Multicast GOOSE (01-0C-CD-01-00-02)',
            `INTERTRAVAMENTO AUTOMÁTICO (ANSI 27DC) - Isolação de cargas para resguardar isolação do barramento`,
            { load1_tripped: true, load2_tripped: true },
            true
          );
          setBreakers(prev => ({ ...prev, cb_load1: 'OPEN', cb_load2: 'OPEN' }));
        }
      }

      // Calculate Load consumptions
      if (breakers.cb_load1 === 'CLOSED' && estimatedBusVolts > 100) {
        // quadratic dependancy V²
        load1Power = load1Param * Math.pow(estimatedBusVolts / 800, 2);
        load1Current = (load1Power * 1000) / estimatedBusVolts;
      }
      if (breakers.cb_load2 === 'CLOSED' && estimatedBusVolts > 100) {
        load2Power = load2Param * (estimatedBusVolts / 800);
        load2Current = (load2Power * 1000) / estimatedBusVolts;
      }

      const totalLoadsKw = load1Power + load2Power;

      // Battery Storage (BESS) calculation
      let bessVolts = estimatedBusVolts;
      let bessPowerOut = 0.0;
      let bessCurrent = 0.0;
      let bessStatus: Telemetry['bessStatus'] = 'STANDBY';

      if (breakers.cb_bess === 'CLOSED' && estimatedBusVolts > 50) {
        bessVolts = estimatedBusVolts;
        if (hasAcFeed) {
          // We have grid, battery charges/discharges according to the set TARGET slider
          bessPowerOut = bessTargetParam; // + values charges energy, - values drains
        } else {
          // No grid! BESS behaves as grid forming source, supplying the exact deficit
          bessPowerOut = -(totalLoadsKw - solarPower);
        }

        bessCurrent = (bessPowerOut * 1000) / bessVolts;
        bessStatus = bessPowerOut > 20 ? 'CHARGING' : bessPowerOut < -20 ? 'DISCHARGING' : 'STANDBY';
      } else if (breakers.cb_bess === 'CLOSED') {
        bessVolts = 780.4; // open terminal
        bessStatus = 'STANDBY';
      }

      // Rectifier outputs
      let rectVolts = estimatedBusVolts;
      let rectCurrent = 0.0;
      let rectPower = 0.0;

      if (hasAcFeed && !isDcShortActive) {
        // Supply total delta Power
        // rectPower = Loads + Battery charge - Solar
        rectPower = totalLoadsKw + (bessStatus === 'CHARGING' ? Math.abs(bessPowerOut) : bessStatus === 'DISCHARGING' ? -Math.abs(bessPowerOut) : 0) - solarPower;
        rectPower = Math.max(0, rectPower); // rectifier cannot absorb power back to utility in this setup
        rectVolts = estimatedBusVolts;
        rectCurrent = (rectPower * 1000) / rectVolts;
      }

      // Compute total AC Active / Reactive Power on 138kV side
      if (breakers.cb_ac === 'CLOSED' && !isAcFaultActive) {
        // rectified Power + transformer losses (approx 3%)
        gridActP = (rectPower / 1000) * 1.03; 
        gridReactP = gridActP * 0.18 + 0.02; // inducting factors
      } else if (isAcFaultActive) {
        gridActP = 0.0;
        gridReactP = 2.45; // pure reactive short circuit factor
      }

      // Set Telemetries
      const updatedTelemetry: Telemetry = {
        gridVoltage: gridVolts,
        gridFreq: gridF,
        gridActivePower: gridActP,
        gridReactivePower: gridReactP,
        
        rectifierVoltageOut: rectVolts,
        rectifierCurrentOut: rectCurrent,
        rectifierTempCelsius: Math.max(25.4, 25.4 + (rectCurrent / 400) * 8.5 + (simulatedFaultHotspots.rect_joint ? (rectCurrent / 100) * 14.5 : 0)),
        rectifierEfficiency: rectPower > 0 ? 95.8 - (rectCurrent / 2000) * 1.5 : 100.0,
        
        bus800VdcVoltage: estimatedBusVolts,
        bus800VdcCurrent: rectCurrent + solarCurrent + (bessCurrent < 0 ? Math.abs(bessCurrent) : 0),
        bus800VdcPowerKw: (estimatedBusVolts * (rectCurrent + solarCurrent + (bessCurrent < 0 ? Math.abs(bessCurrent) : 0))) / 1000,
        
        bessVoltage: bessVolts,
        bessCurrent: bessCurrent,
        bessSoc: Math.max(10, Math.min(100, telemetry.bessSoc + (bessCurrent * 0.00015))), // slowly update charge
        bessTemp: Math.max(25.4, 25.4 + (Math.abs(bessCurrent) / 150) * 4.5 + (simulatedFaultHotspots.bess_coupler ? (Math.abs(bessCurrent) / 80) * 12.0 : 0)),
        bessStatus: isDcShortActive ? 'FAULT' : bessStatus,
        
        solarVoltage: solarVolts,
        solarCurrent: solarCurrent,
        solarPowerKw: solarPower,
        solarIrradiance: solarIrradianceParam,
        
        dcLoad1Voltage: breakers.cb_load1 === 'CLOSED' ? estimatedBusVolts : 0,
        dcLoad1Current: load1Current,
        dcLoad1PowerKw: load1Power,
        
        dcLoad2Voltage: breakers.cb_load2 === 'CLOSED' ? estimatedBusVolts : 0,
        dcLoad2Current: load2Current,
        dcLoad2PowerKw: load2Power,
      };

      setTelemetry(updatedTelemetry);

      // Periodically feed periodic MMS telemetry packets (1 in 4 ticks)
      if (Math.random() > 0.7) {
        injectPacket(
          'MMS',
          'IED.BCU_DC_800V',
          '192.168.10.100 (SCADA)',
          `SCADA Telemetria: V_cc: ${estimatedBusVolts.toFixed(0)}V | Consumo Ativo: ${totalLoadsKw.toFixed(1)} kW`,
          { v_bus: estimatedBusVolts, loadTotalKw: totalLoadsKw, solarGenerationKw: solarPower }
        );
      }

    }, 600);

    return () => clearInterval(interval);
  }, [
    breakers, load1Param, load2Param, solarIrradianceParam, bessTargetParam, activeFault, ieds, simulatedFaultHotspots
  ]);

  // Construct our hotspots array dynamically referencing live currents
  const hotspotsData: ThermogramHotspot[] = [
    {
      id: 'rect_joint',
      componentName: 'A: Juntas de Clivagem do Retificador C1',
      baseTemp: 25.4,
      currentTemp: telemetry.rectifierTempCelsius,
      criticalTemp: 75.0,
      x: 104,
      y: 110,
      failureMode: 'Aumento de resistência de contato nos tiristores de conversão CA-CC',
      status: telemetry.rectifierTempCelsius > 70 ? 'CRITICAL' : telemetry.rectifierTempCelsius > 48 ? 'WARM' : 'NORMAL'
    },
    {
      id: 'bus_coupling',
      componentName: 'B: Barramento Principal 800Vcc - Junção Central',
      baseTemp: 25.4,
      currentTemp: Math.max(25.4, 25.4 + (telemetry.bus800VdcCurrent / 450) * 4.8 + (simulatedFaultHotspots.bus_coupling ? (telemetry.bus800VdcCurrent / 120) * 9.5 : 0)),
      criticalTemp: 85.0,
      x: 140,
      y: 154,
      failureMode: 'Ponto quente por acoplamento frouxo do barramento de cobre',
      status: Math.max(25.4, 25.4 + (telemetry.bus800VdcCurrent / 450) * 4.8 + (simulatedFaultHotspots.bus_coupling ? (telemetry.bus800VdcCurrent / 120) * 9.5 : 0)) > 80 ? 'CRITICAL' : 'NORMAL'
    },
    {
      id: 'bess_coupler',
      componentName: 'C: Acoplador BESS (Baterias) CC',
      baseTemp: 25.4,
      currentTemp: telemetry.bessTemp,
      criticalTemp: 75.0,
      x: 198,
      y: 105,
      failureMode: 'Oxidação da sapata de engate do rack de baterias de Lítio',
      status: telemetry.bessTemp > 70 ? 'CRITICAL' : telemetry.bessTemp > 42 ? 'WARM' : 'NORMAL'
    },
    {
      id: 'solar_combiner',
      componentName: 'D: Painel Conexão Fusíveis Solar',
      baseTemp: 25.4,
      currentTemp: Math.max(25.4, 25.4 + (telemetry.solarCurrent / 140) * 3.5 + (simulatedFaultHotspots.solar_combiner ? (telemetry.solarCurrent / 50) * 11.5 : 0)),
      criticalTemp: 70.0,
      x: 140,
      y: 55,
      failureMode: 'Microarco elétrico por fusível solar mal alocado',
      status: Math.max(25.4, 25.4 + (telemetry.solarCurrent / 140) * 3.5 + (simulatedFaultHotspots.solar_combiner ? (telemetry.solarCurrent / 50) * 11.5 : 0)) > 65 ? 'CRITICAL' : 'NORMAL'
    }
  ];

  const handleSelectSubstation = (id: string) => {
    setSelectedSubstationId(id);
    const targetSub = substations.find(s => s.id === id);
    if (targetSub) {
      injectPacket(
        'MMS',
        '192.168.10.100 (SCADA)',
        '192.168.10.255 (Broadcast)',
        `Conexão ativa com subestação comercial: ${targetSub.name}`,
        { 
          substationId: targetSub.id, 
          name: targetSub.name, 
          latitude: targetSub.lat, 
          longitude: targetSub.lon, 
          voltage: targetSub.voltage || '138 kV',
          source: targetSub.source
        }
      );
    }
  };

  const handleAddSubstation = (newSub: Substation) => {
    setSubstations(prev => [...prev, newSub]);
    injectPacket(
      'MMS',
      '192.168.10.100 (SCADA)',
      '192.168.10.255 (Broadcast)',
      `Nova subestação na malha operacional: ${newSub.name}`,
      { 
        substationId: newSub.id, 
        name: newSub.name, 
        latitude: newSub.lat, 
        longitude: newSub.lon, 
        voltage: newSub.voltage || '138 kV',
        source: newSub.source
      }
    );
  };

  const handleDeleteSubstation = (id: string) => {
    setSubstations(prev => prev.filter(s => s.id !== id));
    if (selectedSubstationId === id) {
      setSelectedSubstationId('sub_pirituba');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans select-none antialiased">
      
      {/* 1. Header component, including standard sync values */}
      <Header 
        appName={`Central de Automação: ${activeSubstation?.name || 'Subestação Digital'}`}
        timeSyncMode={timeSyncMode}
        timeSyncAccuracy={getSyncAccuracy(timeSyncMode)}
        isSyncLost={activeFault === 'Perda Sincronismo Temporal'}
        systemTime={getCurrentFormattedTime()}
      />

      {/* 2. Responsive Multi-Segment Navigation Tab Selector */}
      <nav className="bg-[#0f0f0f]/90 border-b border-[#262626]/80 px-6 py-2 flex overflow-x-auto gap-2 text-xs scrollbar-none shrink-0 sticky top-0 z-40">
        <button
          onClick={() => setActiveSegment('OPERACAO')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
            activeSegment === 'OPERACAO'
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold shadow-sm shadow-amber-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151515] border-transparent'
          }`}
        >
          <Zap className="h-4 w-4 text-amber-500" /> Operação CC/CA & SLD
        </button>
        <button
          onClick={() => setActiveSegment('REDES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
            activeSegment === 'REDES'
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold shadow-sm shadow-cyan-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151515] border-transparent'
          }`}
        >
          <Layers className="h-4 w-4 text-cyan-400" /> Barramento de Processo (IEC 61850)
        </button>
        <button
          onClick={() => setActiveSegment('TERMOGRAFIA')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
            activeSegment === 'TERMOGRAFIA'
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-bold shadow-sm shadow-orange-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151515] border-transparent'
          }`}
        >
          <Eye className="h-4 w-4 text-orange-400" /> Termografia & Relés IED
        </button>
        <button
          onClick={() => setActiveSegment('MANUAL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
            activeSegment === 'MANUAL'
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold shadow-sm shadow-purple-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151515] border-transparent'
          }`}
        >
          <BookOpen className="h-4 w-4 text-purple-400" /> Guia Didático SENAI-SP
        </button>
        <button
          onClick={() => setActiveSegment('SUBESTACOES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium cursor-pointer transition-all ${
            activeSegment === 'SUBESTACOES'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold shadow-sm shadow-indigo-500/5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#151515] border-transparent'
          }`}
        >
          <Globe className="h-4 w-4 text-indigo-400" /> Gestão de Subestações (OpenInfra API)
        </button>
      </nav>

      {/* 3. Main Screen Workspace */}
      <main className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
        
        {/* VIEW SEGMENT A: Operations Single Line Diagram & Load Control */}
        {activeSegment === 'OPERACAO' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            <div className="xl:col-span-7 h-full">
              <SingleLineDiagram 
                telemetry={telemetry}
                breakers={breakers}
                onToggleBreaker={handleToggleBreaker}
                activeFault={activeFault}
              />
            </div>
            <div className="xl:col-span-5 h-full">
              <ControlPanel 
                telemetry={telemetry}
                load1Param={load1Param}
                onSetLoad1Param={setLoad1Param}
                load2Param={load2Param}
                onSetLoad2Param={setLoad2Param}
                solarIrradianceParam={solarIrradianceParam}
                onSetSolarIrradiance={setSolarIrradianceParam}
                bessTargetParam={bessTargetParam}
                onSetBessTarget={setBessTargetParam}
                activeFault={activeFault}
                onSelectFault={(f) => {
                  setActiveFault(f);
                  // Trigger log entry in SCADA
                  injectPacket(
                    'MMS',
                    'SCADA.OPERATOR_TERM',
                    '192.168.10.255',
                    `Injeção manual de perturbação: ${f}`,
                    { faultSelected: f, user: 'MEX-ZehSobrinho' },
                    f !== 'Nenhum'
                  );
                }}
                timeSyncMode={timeSyncMode}
                onChangeTimeSyncMode={handleChangeTimeSyncMode}
              />
            </div>
          </div>
        )}

        {/* VIEW SEGMENT B: Protocol Monitor Stream & Waves Oscilloscope */}
        {activeSegment === 'REDES' && (
          <div className="w-full h-full">
            <NetworkMonitor 
              packets={packets}
              timeSyncMode={timeSyncMode}
              timeSyncAccuracy={getSyncAccuracy(timeSyncMode)}
              isSyncLost={activeFault === 'Perda Sincronismo Temporal'}
              activeFault={activeFault}
              gridFreq={telemetry.gridFreq}
            />
          </div>
        )}

        {/* VIEW SEGMENT C: Connection Heat-Map Camera & IED Protections Settings */}
        {activeSegment === 'TERMOGRAFIA' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            <div className="xl:col-span-6 h-full">
              <ThermalView 
                hotspots={hotspotsData}
                onToggleContactResistance={handleToggleContactResistance}
                simulatedFaultHotspots={simulatedFaultHotspots}
              />
            </div>
            <div className="xl:col-span-6 h-full">
              <IEDSettings 
                ieds={ieds}
                onUpdateIedConfig={handleUpdateIedConfig}
                onResetIeds={handleResetIeds}
              />
            </div>
          </div>
        )}

        {/* VIEW SEGMENT D: SENAI-SP Student Technical Help Syllabus Handbook */}
        {activeSegment === 'MANUAL' && (
          <div className="w-full">
            <HelpManual />
          </div>
        )}

        {/* VIEW SEGMENT E: Regional Substations Configuration & OpenInfra Maps API */}
        {activeSegment === 'SUBESTACOES' && (
          <div className="w-full">
            <SubstationConfig
              substations={substations}
              selectedSubstationId={selectedSubstationId}
              onSelectSubstation={handleSelectSubstation}
              onAddSubstation={handleAddSubstation}
              onDeleteSubstation={handleDeleteSubstation}
            />
          </div>
        )}

      </main>

      {/* 4. Substation System Footer Bar */}
      <footer className="bg-[#0f0f0f] border-t border-[#262626] text-[11px] font-mono text-slate-500 py-3.5 px-6 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-center md:text-left">
        <div>
          <span>MEX Energia & Sustentabilidade © 2026 • </span>
          <span className="text-slate-400">Desenvolvido para Estudos de Caso de José Soares Sobrinho</span>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-2 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FIRMWARE MODEL v4.8 • ESTADO: ONLINE</span>
        </div>
      </footer>

    </div>
  );
}
