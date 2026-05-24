import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Globe, 
  Eye, 
  MapPin, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Cpu, 
  Server, 
  Zap, 
  Compass, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  CheckCircle,
  HelpCircle,
  Play,
  User,
  Activity,
  Wrench,
  Sliders,
  GitBranch,
  ShieldAlert,
  AlertCircle,
  Flame
} from 'lucide-react';
import { Substation, ThermogramHotspot, Operator, Telemetry } from '../types';

interface TwinAndMap3DProps {
  guiStyle: 'CLASSIC_SCADA' | 'HITACHI_ADMS';
  substations: Substation[];
  selectedSubstationId: string;
  onSelectSubstation: (id: string) => void;
  hotspots: ThermogramHotspot[];
  simulatedFaultHotspots: Record<string, boolean>;
  onToggleContactResistance: (id: string) => void;
  currentUser: Operator | null;
  activeOperators: Operator[];
  telemetry: Telemetry;
  odataGmgActive: boolean;
  computedOdataLoadKw: number;
  simulationMode: 'REALITY' | 'STUDY' | 'MAINTENANCE';
  onChangeSimulationMode: (mode: 'REALITY' | 'STUDY' | 'MAINTENANCE') => void;
}

// Pre-defined continent point outlines for drawing a high-fidelity glowing cyber globe on Canvas
// Let's model critical outline arrays mapped into spherical coordinates [Lat, Lon]
const CONTINENTS_DATA: [number, number][][] = [
  // South America
  [
    [-12, -70], [-5, -60], [-10, -45], [-20, -40], [-35, -50], [-55, -68], [-40, -73], [-25, -70], [-15, -75], [-5, -80], [8, -75], [5, -60], [-12, -70]
  ],
  // North America
  [
    [10, -80], [20, -100], [15, -105], [25, -115], [35, -120], [45, -125], [60, -140], [70, -160], [72, -120], [60, -80], [50, -60], [45, -65], [30, -80], [25, -78], [18, -95], [10, -80]
  ],
  // Africa
  [
    [32, 10], [30, 32], [15, 40], [12, 45], [2, 40], [-15, 38], [-34, 18], [-20, 12], [5, 10], [-5, -10], [8, -14], [15, -16], [22, -15], [32, 10]
  ],
  // Europe & Asia
  [
    [35, -10], [50, -10], [60, 10], [70, 20], [72, 60], [70, 100], [70, 140], [60, 170], [40, 140], [35, 120], [22, 115], [15, 110], [10, 108], [15, 96], [25, 80], [12, 75], [23, 70], [15, 55], [12, 45], [25, 35], [30, 34], [40, 26], [45, 15], [35, -10]
  ],
  // Australia
  [
    [-22, 113], [-11, 136], [-15, 145], [-37, 150], [-35, 115], [-22, 113]
  ]
];

export default function TwinAndMap3D({
  guiStyle,
  substations,
  selectedSubstationId,
  onSelectSubstation,
  hotspots,
  simulatedFaultHotspots,
  onToggleContactResistance,
  currentUser,
  activeOperators,
  telemetry,
  odataGmgActive,
  computedOdataLoadKw,
  simulationMode,
  onChangeSimulationMode
}: TwinAndMap3DProps) {
  const isClassic = guiStyle === 'CLASSIC_SCADA';

  // State: Viewing mode for 3D system (GIS Globe Map vs 3D Component Thermography)
  const [twinViewMode, setTwinViewMode] = useState<'GLOBE' | 'THERMAL3D'>('GLOBE');

  // Canvas refs
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const thermalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Globe interactivity states
  const [globeAngleX, setGlobeAngleX] = useState(-0.4); // X rotation (tilt)
  const [globeAngleY, setGlobeAngleY] = useState(1.1); // Y rotation (spin)
  const [globeSpinning, setGlobeSpinning] = useState(true);
  const [hoveredSubId, setHoveredSubId] = useState<string | null>(null);
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // 3D Thermal dynamic rotation states
  const [thermalAngleX, setThermalAngleX] = useState(0.5);
  const [thermalAngleY, setThermalAngleY] = useState(0.6);
  const [selectedComponent3D, setSelectedComponent3D] = useState<'TRANSFORMER' | 'RECTIFIER_UNIT' | 'RACK_BESS'>('TRANSFORMER');

  // Sophia Agent state
  const [agentTalking, setAgentTalking] = useState(false);
  const [agentSpeechText, setAgentSpeechText] = useState('Olá! Eu sou a Sophia, Assistente Virtual de Escala e Cibersegurança da Central. Clique em qualquer tópico operacional abaixo para que eu explique detalhadamente o funcionamento dos ativos, responsabilidades, redes IEC 61850 ou perfis de operadores do sistema.');
  const [agentEmotionalPulse, setAgentEmotionalPulse] = useState<'CALM' | 'TALKING' | 'ALERT' | 'CONFIRM'>('CALM');
  const [speechAudioEnabled, setSpeechAudioEnabled] = useState(false);
  const [typewriterIndex, setTypewriterIndex] = useState(0);

  // --- NEW STATES FOR INTEGRATED OPERATIONAL MODES (Reality, Study, Maintenance) ---
  const [selectedRealityLevel, setSelectedRealityLevel] = useState<'RUA' | 'BAIRRO' | 'MUNICIPIO' | 'ESTADO' | 'PAIS'>('BAIRRO');
  
  // Study states
  const [studyRegionalBlackout, setStudyRegionalBlackout] = useState(false);
  const [studyNationalBlackout, setStudyNationalBlackout] = useState(false);
  const [studyN1Redundancy, setStudyN1Redundancy] = useState(true);

  // Expanded Study Lab States
  const [loadScaleFactor, setLoadScaleFactor] = useState<number>(1.0); // 0.2x to 2.5x neighborhood load multiplier
  const [tempAlarmThreshold, setTempAlarmThreshold] = useState<number>(65.0); // °C limit
  const [maneuverBypassLatency, setManeuverBypassLatency] = useState<number>(8); // ms redundant switchover
  const [activeAnomalySimulation, setActiveAnomalySimulation] = useState<'NONE' | 'OVERLOAD' | 'SYNC_LOSS' | 'CT_SATURATION'>('NONE');

  // Maintenance states
  const [maintTransformer, setMaintTransformer] = useState<'ACTIVE' | 'MAINTENANCE' | 'EXPANSION'>('ACTIVE');
  const [maintRectifier, setMaintRectifier] = useState<'ACTIVE' | 'MAINTENANCE' | 'EXPANSION'>('ACTIVE');
  const [maintBess, setMaintBess] = useState<'ACTIVE' | 'MAINTENANCE' | 'EXPANSION'>('ACTIVE');
  const [maintSolar, setMaintSolar] = useState<'ACTIVE' | 'MAINTENANCE' | 'EXPANSION'>('ACTIVE');

  // Expanded Maintenance Replacement/Swap States
  const [maintSwaps, setMaintSwaps] = useState({
    oilReplaced: false,
    filterReplaced: false,
    sensorsReplaced: false,
    fuseReplaced: false
  });

  // Expanded Maintenance Calibration Parameters
  const [maintFanThreshold, setMaintFanThreshold] = useState<number>(45.0); // °C cooling trigger
  const [maintNitrogenPressure, setMaintNitrogenPressure] = useState<number>(15.0); // psi
  const [maintShuntResist, setMaintShuntResist] = useState<number>(0.15); // Ohm

  // Expanded Maintenance Field Test States
  const [activeMaintTest, setActiveMaintTest] = useState<'NONE' | 'MEGGER' | 'SECONDARY_INJECTION'>('NONE');
  const [meggerResult, setMeggerResult] = useState<{ status: string; valueMOhms: number; label: string } | null>(null);
  const [secInjectionStatus, setSecInjectionStatus] = useState<string | null>(null);

  // Custom configuration parameters
  const [customFreqLimit, setCustomFreqLimit] = useState<number>(60.5); // Hz limit
  const [customVoltLimit, setCustomVoltLimit] = useState<number>(142); // kV limit
  const [paramSuccessMsg, setParamSuccessMsg] = useState<string | null>(null);

  // Speak helper for Sophia custom prompts
  const speakSophiaCustom = (text: string, emotion: 'CALM' | 'TALKING' | 'ALERT' | 'CONFIRM') => {
    setAgentSpeechText(text);
    setAgentEmotionalPulse(emotion);
    setAgentTalking(true);

    if (speechAudioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.startsWith('PT'));
      if (ptVoice) utterance.voice = ptVoice;
      utterance.rate = 1.15;
      utterance.onend = () => {
        setAgentTalking(false);
        setAgentEmotionalPulse('CALM');
      };
      utterance.onerror = () => {
        setAgentTalking(false);
        setAgentEmotionalPulse('CALM');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setAgentTalking(false);
        setAgentEmotionalPulse('CALM');
      }, Math.max(1500, text.length * 35));
    }
  };

  // Sophia mouth animation interval
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0);

  // Custom text segments explaining various engineering domains in Brazilian Portuguese
  const SOPHIA_TOPICS = {
    INTRO: {
      title: "Visão Geral do Projeto Smart Grid",
      emotion: "TALKING" as const,
      text: "Este projeto simula uma subestação de automação de energia digital sob normas IEC 61850. O objetivo principal é demonstrar a sinergia entre geração renovável fotovoltaica, armazenamento por baterias (BESS) de 125 kW, e cargas industriais críticas, como a climatização da sala de servidores da ODATA Osasco SP-01, monitorando contatos térmicos por Efeito Joule e tráfego de pacotes MMS e GOOSE de alta velocidade."
    },
    COMPONENTS: {
      title: "Responsabilidade de Componentes Isolados e Integrados",
      emotion: "TALKING" as const,
      text: "Em modo isolado (Grid-Off), as cargas críticas de TI do Data Center ODATA são mantidas pelo Grupo Gerador Diesel de Emergência e descarregamento rápido do BESS CC. Já sob o modo conectado (Grid-On), operamos de forma integrada ao Sincronismo Temporal PTP de alta sensibilidade, convertendo 138kV CA para 800Vcc no retificador principal, cuja junta de clivagem acumula estresse térmico em correntes elevadas."
    },
    THERMOGRAPHY: {
      title: "Termografia 3D e Resistência de Contato",
      emotion: "TALKING" as const,
      text: "Nossos termogramas indicam resistência elétrica localizada por óxido-de-gás e parafusos frouxos. Sob efeito Joule, o dissipador de tiristores do retificador C1 ou os engates do BESS elevam a temperatura em rampa quadrática de corrente. Na nossa aba de Termografia 3D, você pode navegar na reconstrução tridimensional do transformador trifásico e verificar os hotspots críticos que demandam manutenção imediata."
    },
    OPERATORS: {
      title: "Operadores e Controle de Direitos ADM",
      emotion: "TALKING" as const,
      text: "O sistema opera com regras estritas de cibersegurança cibernética. Um operador de classe MONITORAMENTO (como Patrícia Lima) pode observar osciloscópios e mapas, porém comandos de alteração de setpoints HVAC, abertura de disjuntores ou desligamento de geradores exigem privilégios de nível ADMINISTRADOR (ADM). Cadastre um operador ou mude de perfil clicando no terminal de acesso!"
    },
    ODATA_CHILLER: {
      title: "Análise Térmica ODATA Osasco",
      emotion: "ALERT" as const,
      text: "O Data Center ODATA consome expressiva corrente quando em stress computacional máximo. Isto força o sistema de refrigeração e Chillers a operar em potência de topo para manter o setpoint estável (tipicamente 21°C). Se a rede Enel falhar, os geradores diesel GMG entram automaticamente via relé de intertravamento lógico para blindar a infraestrutura de TI."
    }
  };

  const explainTopic = (topicKey: keyof typeof SOPHIA_TOPICS) => {
    const selected = SOPHIA_TOPICS[topicKey];
    setAgentSpeechText(selected.text);
    setAgentEmotionalPulse(selected.emotion);
    setAgentTalking(true);

    // If text-to-speech option is checked, perform speech
    if (speechAudioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop old speech
      const utterance = new SpeechSynthesisUtterance(selected.text);
      utterance.lang = 'pt-BR';
      
      // Look for a nice portuguese female voice if available
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.startsWith('PT'));
      if (ptVoice) utterance.voice = ptVoice;
      
      utterance.rate = 1.1; // spoken nicely
      utterance.onend = () => {
        setAgentTalking(false);
        setAgentEmotionalPulse('CALM');
      };
      utterance.onerror = () => {
        setAgentTalking(false);
        setAgentEmotionalPulse('CALM');
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Simulate speaking timeout
      setTimeout(() => {
        setAgentTalking(false);
        setAgentEmotionalPulse('CALM');
      }, selected.text.length * 35);
    }
  };

  // Synchronize mouth animation when talking
  useEffect(() => {
    if (!agentTalking) {
      setMouthOpenAmount(0);
      return;
    }

    const interval = setInterval(() => {
      setMouthOpenAmount(Math.random() * 12 + 2);
    }, 120);

    return () => clearInterval(interval);
  }, [agentTalking]);

  // Handle globe spin rotation animation
  useEffect(() => {
    if (!globeSpinning || isDragging.current || twinViewMode !== 'GLOBE') return;

    const interval = setInterval(() => {
      setGlobeAngleY(prev => (prev + 0.0035));
    }, 16);

    return () => clearInterval(interval);
  }, [globeSpinning, twinViewMode]);

  // Render 3D Earth Globe and Pinned Substations
  useEffect(() => {
    if (twinViewMode !== 'GLOBE') return;
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Dark high-tech sci-fi grid backdrop
    ctx.strokeStyle = isClassic ? '#1b2336' : '#141416';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 30) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // Coordinates variables
    const radX = globeAngleX;
    const radY = globeAngleY;

    // Quick projection helper for mapping 3D space of the sphere to 2D
    const projectSpherical = (latDeg: number, lonDeg: number) => {
      // Convert degrees to radians
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180;

      // Unrotated spherical coordinates on sphere surface
      const xSphere = radius * Math.cos(lat) * Math.sin(lon);
      const ySphere = radius * Math.sin(lat);
      const zSphere = radius * Math.cos(lat) * Math.cos(lon);

      // Rotate Y-axis (Spin)
      const x1 = xSphere * Math.cos(radY) + zSphere * Math.sin(radY);
      const z1 = -xSphere * Math.sin(radY) + zSphere * Math.cos(radY);

      // Rotate X-axis (Tilt)
      const y2 = ySphere * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = ySphere * Math.sin(radX) + z1 * Math.cos(radX);

      // Perspective scale factor
      const dist = radius * 2.5;
      const scale = dist / (dist + z2);

      return {
        x: centerX + x1 * scale,
        y: centerY - y2 * scale,
        visible: z2 > -radius * 0.15, // Visible if facing the camera
        depth: z2
      };
    };

    // Draw Globe atmospheric glow
    const shadowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius + 15);
    shadowGrad.addColorStop(0.0, 'transparent');
    shadowGrad.addColorStop(0.3, isClassic ? 'rgba(0, 255, 204, 0.03)' : 'rgba(56, 189, 248, 0.04)');
    shadowGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
    shadowGrad.addColorStop(1.0, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
    ctx.fill();

    // Draw primary solid sphere backing
    ctx.fillStyle = isClassic ? '#05070a' : '#010102';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Globe boundary circle (outer ring)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Globe grid lines (Parallels and Meridians)
    ctx.strokeStyle = isClassic ? '#0284c7' : '#1e293b';
    ctx.lineWidth = 0.5;

    // Latitudes (every 30 degrees)
    for (let rLat = -60; rLat <= 60; rLat += 30) {
      ctx.beginPath();
      let first = true;
      for (let rLon = -180; rLon <= 180; rLon += 10) {
        const proj = projectSpherical(rLat, rLon);
        if (proj.visible) {
          if (first) {
            ctx.moveTo(proj.x, proj.y);
            first = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Longitudes (every 30 degrees)
    for (let rLon = -180; rLon < 180; rLon += 30) {
      ctx.beginPath();
      let first = true;
      for (let rLat = -85; rLat <= 85; rLat += 5) {
        const proj = projectSpherical(rLat, rLon);
        if (proj.visible) {
          if (first) {
            ctx.moveTo(proj.x, proj.y);
            first = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // Draw Wireframe Continents Outlines on the Earth core sphere
    ctx.strokeStyle = isClassic ? 'rgba(0, 255, 204, 0.35)' : 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 0.8;
    CONTINENTS_DATA.forEach(poly => {
      ctx.beginPath();
      let first = true;
      poly.forEach(([lat, lon]) => {
        const proj = projectSpherical(lat, lon);
        if (proj.visible) {
          if (first) {
            ctx.moveTo(proj.x, proj.y);
            first = false;
          } else {
            ctx.lineTo(proj.x, proj.y);
          }
        } else {
          first = true;
        }
      });
      ctx.stroke();
    });

    // PINS PLOTTING - Plot active regional substation GIS pins in real time!
    let foundHoveredId: string | null = null;

    substations.forEach(sub => {
      // Map coordinate translation to the spherical coordinate math
      // Sao Paulo coordinates correspond around Lat: sub.lat, Lon: sub.lon
      // Standard geographic offset mapping so SP appears nicely focused
      // Let's amplify the rotation around Brazil coordinates to center on screen
      const scaleOffsetLat = (sub.lat - (-23.5)) * 42 - 23.5;
      const scaleOffsetLon = (sub.lon - (-46.7)) * 42 - 46.7;

      const proj = projectSpherical(scaleOffsetLat, scaleOffsetLon);

      if (proj.visible) {
        const isSelected = sub.id === selectedSubstationId;
        const color = isSelected ? '#eab308' : '#06b6d4'; // Yellow active, cyan standby
        
        // Draw pinpoint glowing circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, isSelected ? 6.5 : 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Pin outer light aura
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, isSelected ? 12 : 8, 0, Math.PI * 2);
        ctx.stroke();

        if (isSelected) {
          // Dynamic energy surge rings radiating outwards
          const beamPulse = (Date.now() % 1000) / 1000;
          ctx.strokeStyle = `rgba(234, 179, 8, ${1 - beamPulse})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 8 + beamPulse * 20, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Label above the pinpoint projection
        ctx.font = isSelected ? 'bold 10px sans-serif' : '8.5px monospace';
        ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
        ctx.strokeStyle = '#05070a';
        ctx.lineWidth = 2.5;
        const labelText = sub.name.split(' - ')[0];
        ctx.strokeText(labelText, proj.x + 10, proj.y - 4);
        ctx.fillText(labelText, proj.x + 10, proj.y - 4);

        // Substation operational telemetry brief label
        if (isSelected) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#cbd5e1';
          const detailsText = `${sub.voltage} • ${sub.type}`;
          ctx.strokeText(detailsText, proj.x + 10, proj.y + 6);
          ctx.fillText(detailsText, proj.x + 10, proj.y + 6);
        }

        // Simple mouse hover coordinates check
        const mx = prevMousePos.current.x;
        const my = prevMousePos.current.y;
        const dx = mx - proj.x;
        const dy = my - proj.y;
        if (Math.sqrt(dx*dx + dy*dy) < 18) {
          foundHoveredId = sub.id;
        }
      }
    });

    // Update hovered ID state
    if (foundHoveredId !== hoveredSubId) {
      setHoveredSubId(foundHoveredId);
    }

  }, [twinViewMode, globeAngleX, globeAngleY, substations, selectedSubstationId, isClassic]);

  // Handle Drag on 3D Globe to tilt it
  const handleGlobeMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    prevMousePos.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const handleGlobeMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    prevMousePos.current = { x, y };

    if (!isDragging.current) return;

    const dx = x - prevMousePos.current.x;
    const dy = y - prevMousePos.current.y;

    setGlobeAngleY(prev => prev + dx * 0.007);
    setGlobeAngleX(prev => Math.max(-1.4, Math.min(1.4, prev + dy * 0.007)));
  };

  const handleGlobeMouseUp = () => {
    isDragging.current = false;
  };

  const handleGlobeClick = () => {
    if (hoveredSubId) {
      onSelectSubstation(hoveredSubId);
      // Sophia comments on connection
      const matched = substations.find(s => s.id === hoveredSubId);
      if (matched) {
        setAgentSpeechText(`Conectei o HMI à subestação ${matched.name}. Localizada sob as coordenadas GPS ${matched.lat.toFixed(4)}°, ${matched.lon.toFixed(4)}°, esta estação opera em regime de ${matched.type} sob tensão de ${matched.voltage}.`);
        setAgentEmotionalPulse('CONFIRM');
      }
    }
  };

  // Render Real-time Interactive 3D Thermography mesh model!
  useEffect(() => {
    if (twinViewMode !== 'THERMAL3D') return;
    const canvas = thermalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Render cyber background blueprint lines
    ctx.strokeStyle = isClassic ? '#10302b' : '#0c1214';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 25) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 25) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // Mathematical definition of 3D vertices/nodes of a transformer block or industrial cooling components
    // Coordinates [X, Y, Z]
    const baseBlockVertices: {x: number; y: number; z: number; temp: number}[] = [
      // Transformer Core Block
      { x: -50, y: -40, z: -30, temp: 42 }, // 0
      { x: 50, y: -40, z: -30, temp: 45 },  // 1
      { x: 50, y: 40, z: -30, temp: 50 },   // 2
      { x: -50, y: 40, z: -30, temp: 41 },  // 3
      { x: -50, y: -40, z: 30, temp: 47 },  // 4
      { x: 50, y: -40, z: 30, temp: 55 },   // 5
      { x: 50, y: 40, z: 30, temp: 72 },    // 6 (Hotspot spot is near vertex 6 & 7)
      { x: -50, y: 40, z: 30, temp: 68 },   // 7

      // High voltage isolators/bushings pins on top
      { x: -30, y: -75, z: 0, temp: 95 },   // 8 (Bushing A)
      { x: 0, y: -75, z: 0, temp: 35 },     // 9 (Bushing B)
      { x: 30, y: -75, z: 0, temp: 37 },    // 10 (Bushing C)
      
      // Radiator cooling grid fins on the side
      { x: 75, y: -10, z: -20, temp: 31 },  // 11
      { x: 75, y: -10, z: 20, temp: 32 },   // 12
      { x: 75, y: 30, z: 20, temp: 28 },    // 13
      { x: 75, y: 30, z: -20, temp: 27 },   // 14
    ];

    // Align hotspot live temperatures from state dynamically into components
    // "rect_joint" corresponds to tiristors rectifiers (8 Bushing), etc.
    const liveRectTemp = hotspots.find(h => h.id === 'rect_joint')?.currentTemp || 45;
    const liveBessTemp = hotspots.find(h => h.id === 'bess_coupler')?.currentTemp || 38;
    const liveSubTemp = Math.max(30, telemetry.rectifierVoltageOut / 16);

    // Apply real time telemetry into vertex heat values
    baseBlockVertices[8].temp = liveRectTemp; // Bushing A mimics our rect joint hotspot
    baseBlockVertices[6].temp = liveBessTemp + 20; // vertex 6 mimics coupling heat
    baseBlockVertices[5].temp = liveSubTemp;

    // Define lines connection faces
    const linesIndices = [
      [0, 1], [1, 2], [2, 3], [3, 0], // back face
      [4, 5], [5, 6], [6, 7], [7, 4], // front face
      [0, 4], [1, 5], [2, 6], [3, 7], // join sides
      // Bushings connection to tops
      [0, 8], [4, 8], [1, 9], [5, 9], [1, 10], [5, 10],
      // Radiator fins to frame
      [1, 11], [5, 12], [2, 14], [6, 13],
      [11, 12], [12, 13], [13, 14], [14, 11]
    ];

    // Rotate matrix
    const rotX = thermalAngleX;
    const rotY = thermalAngleY;

    // Projection calculation
    const projected = baseBlockVertices.map(v => {
      // 3D rotations
      // Y-axis rotation
      const x1 = v.x * Math.cos(rotY) + v.z * Math.sin(rotY);
      const z1 = -v.x * Math.sin(rotY) + v.z * Math.cos(rotY);

      // X-axis rotation
      const y2 = v.y * Math.cos(rotX) - z1 * Math.sin(rotX);
      const z2 = v.y * Math.sin(rotX) + z1 * Math.cos(rotX);

      // 2D projection
      const dist = 300;
      const scale = dist / (dist + z2);
      
      return {
        x: cx + x1 * scale * 1.5,
        y: cy + y2 * scale * 1.5,
        temp: v.temp,
        z: z2
      };
    });

    // Helper map thermal gradient color based on temperature scale [20°C - 100°C]
    const getThermalColor = (temp: number) => {
      const minVal = 24;
      const maxVal = 85;
      const ratio = Math.max(0, Math.min(1, (temp - minVal) / (maxVal - minVal)));
      
      // Color interpolation: Deep Violet (#1e1b4b) -> Magenta (#b91c1c) -> Yellow (#fbbf24) -> White (#ffffff)
      if (ratio < 0.25) {
        // Linear interpolate Violet to Blueish-Magenta
        const factor = ratio / 0.25;
        const r = Math.round(15 + factor * 70);
        const g = Math.round(12 + factor * 10);
        const b = Math.round(100 + factor * 40);
        return `rgb(${r},${g},${b})`;
      } else if (ratio < 0.6) {
        // Interpolate Magenta to Vivid Red-orange
        const factor = (ratio - 0.25) / 0.35;
        const r = Math.round(85 + factor * 150);
        const g = Math.round(22 + factor * 70);
        const b = Math.round(140 - factor * 80);
        return `rgb(${r},${g},${b})`;
      } else {
        // Interpolate Orange to White-hot yellow
        const factor = (ratio - 0.6) / 0.4;
        const r = Math.round(235 + factor * 20);
        const g = Math.round(92 + factor * 150);
        const b = Math.round(60 + factor * 195);
        return `rgb(${r},${g},${b})`;
      }
    };

    // Draw the 3D polygon wireframe bounding lines with thermal gradients
    linesIndices.forEach(([p1Idx, p2Idx]) => {
      const p1 = projected[p1Idx];
      const p2 = projected[p2Idx];

      const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      grad.addColorStop(0, getThermalColor(p1.temp));
      grad.addColorStop(1, getThermalColor(p2.temp));

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw glowing thermal nodes/vertices
    projected.forEach((p, idx) => {
      const size = p.temp > 65 ? 7.5 : 4.5;
      ctx.fillStyle = getThermalColor(p.temp);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Node ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size + 2, 0, Math.PI * 2);
      ctx.stroke();

      // Display real temperature values near hottest points
      if (p.temp > 50) {
        ctx.font = 'bold 8.5px monospace';
        ctx.fillStyle = '#ffffff';
        const labelText = `${p.temp.toFixed(1)}°C`;
        ctx.fillText(labelText, p.x + 8, p.y - 4);
      }
    });

    // Draw active diagnostic text directly onto 3D view
    ctx.font = '9px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Modelo 3D Finito: Banco Transformador T1/T4', 15, 25);
    ctx.fillText(`Rot-X: ${thermalAngleX.toFixed(2)} rad  Rot-Y: ${thermalAngleY.toFixed(2)} rad`, 15, 38);

  }, [twinViewMode, thermalAngleX, thermalAngleY, hotspots, telemetry, isClassic]);

  // Handle minor interactive rotations
  useEffect(() => {
    if (twinViewMode !== 'THERMAL3D') return;
    const interval = setInterval(() => {
      setThermalAngleY(prev => prev + 0.005);
    }, 20);
    return () => clearInterval(interval);
  }, [twinViewMode]);

  return (
    <div className={`transition-all border-b-2 ${
      isClassic 
        ? 'bg-[#151924] border-b-blue-600 font-mono text-slate-300' 
        : 'bg-[#0a0a0c] border-[#222] text-slate-100 rounded-3xl'
    } p-5 flex flex-col gap-6`}>
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#222] pb-4">
        <div>
          <h2 className="text-sm font-extrabold flex items-center gap-2 text-slate-100 font-sans tracking-tight">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            Sistemas 3D Integrados, Termografia Online & Agente HMI
          </h2>
          <p className="text-[11px] text-slate-450 mt-0.5">
            Interaja com o Gêmeo Digital da subestação e o Globo 3D do GIS, assistido pela consultoria inteligente da Sophia.
          </p>
        </div>

        {/* View Switch bar */}
        <div className="flex items-center gap-2 bg-[#121215] border border-[#222] p-1 rounded-xl">
          <button
            id="view-globe-3d"
            onClick={() => setTwinViewMode('GLOBE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              twinViewMode === 'GLOBE'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c1c20] border border-transparent'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            1. Globo GIS 3D
          </button>
          
          <button
            id="view-thermal-3d"
            onClick={() => setTwinViewMode('THERMAL3D')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              twinViewMode === 'THERMAL3D'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c1c20] border border-transparent'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            2. Termografia 3D
          </button>
        </div>
      </div>

      {/* Primary Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Interactive 3D Canvas Box (7 columns) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          
          {twinViewMode === 'GLOBE' ? (
            /* GLOBE VIEW CONTAINER */
            <div className="bg-[#050505] border border-[#262626] rounded-2xl p-4 flex flex-col gap-3 relative flex-grow min-h-[440px] justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                    Rede Georreferenciada GIS OpenInfraMap
                  </span>
                  
                  <div className="flex items-center gap-2 text-[10px] bg-[#111] px-2.5 py-1 rounded border border-[#222] font-mono">
                    <span className="text-slate-500">Giro Automático:</span>
                    <button 
                      onClick={() => setGlobeSpinning(!globeSpinning)}
                      className="text-cyan-400 hover:underline font-bold"
                    >
                      {globeSpinning ? 'Pausar' : 'Girar'}
                    </button>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-450 mt-1 lines-clamp-2 leading-relaxed">
                  Arraste o globo com o cursor para rotacionar. Pressione em qualquer pino luminoso (Amarelo ou Azul) para focar as telas SCADA e sincronizar os relés daquela estação regional.
                </p>
              </div>

              {/* Canvas viewport centered */}
              <div className="flex justify-center items-center h-[300px] my-1 relative cursor-grab active:cursor-grabbing">
                <canvas
                  id="canvas-globe-3d"
                  ref={globeCanvasRef}
                  width={340}
                  height={300}
                  onMouseDown={handleGlobeMouseDown}
                  onMouseMove={handleGlobeMouseMove}
                  onMouseUp={handleGlobeMouseUp}
                  onMouseLeave={handleGlobeMouseUp}
                  onClick={handleGlobeClick}
                  className="rounded-xl border border-transparent"
                />

                {/* Info Overlay Box */}
                <div className="absolute top-2 left-2 bg-black/80 border border-[#222] p-2 rounded-xl pointer-events-none text-left font-mono">
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase">Ativo em Foco SCADA</span>
                  <div className="text-[11px] font-bold text-slate-200 mt-0.5 truncate max-w-[155px]">
                    {substations.find(s => s.id === selectedSubstationId)?.name || 'Nenhuma Estação'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    Lat: {substations.find(s => s.id === selectedSubstationId)?.lat.toFixed(5)}°
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Lon: {substations.find(s => s.id === selectedSubstationId)?.lon.toFixed(5)}°
                  </div>
                </div>

                {/* Substation Hover popover */}
                {hoveredSubId && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-cyan-950/90 border border-cyan-500 p-2.5 rounded-xl pointer-events-none max-w-[210px] text-left animate-fade-in shadow-2xl">
                    <h5 className="text-[10.5px] font-bold text-white leading-tight">
                      {substations.find(s => s.id === hoveredSubId)?.name}
                    </h5>
                    <p className="text-[9px] text-cyan-300 mt-1">
                      Concessionária: {substations.find(s => s.id === hoveredSubId)?.operator}
                    </p>
                    <span className="text-[8.5px] font-bold font-mono text-amber-400 block mt-1.5 uppercase">
                      ⚠️ Clique para Sincronizar
                    </span>
                  </div>
                )}
              </div>

              {/* Stations Grid overview menu directly embedded */}
              <div className="border-t border-[#1e1e24] pt-3 text-left">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase block mb-1.5">Conexões Físicas Ativas</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {substations.map(s => {
                    const isSelected = s.id === selectedSubstationId;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          onSelectSubstation(s.id);
                          // Animate angles towards Brazil coords
                          setGlobeAngleX(-0.4);
                          setGlobeAngleY(1.1);
                        }}
                        className={`p-2 border rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                            : 'bg-[#111113] border-[#222] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold truncate">{s.name.split(' - ')[0]}</div>
                        <div className="text-[8px] font-mono text-slate-500 mt-0.5 truncate">{s.voltage}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* THERMOGRAPHY 3D VIEW CONTAINER */
            <div className="bg-[#050505] border border-[#262626] rounded-2xl p-4 flex flex-col gap-3 relative flex-grow min-h-[440px] justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-purple-400" />
                    Termograma 3D Finito de Tempo Real
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-[10px] bg-[#111] px-2 py-0.5 rounded border border-[#222]">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[9px] text-slate-400 uppercase font-bold">FEA Mesh Live</span>
                  </div>
                </div>
                <p className="text-[10.5px] text-slate-450 mt-1 lines-clamp-2 leading-relaxed">
                  Interpolação de nós térmicos do enrolamento primário do Transformador e Buchas de Alta Isolação. Mova o controle para orbitar o componente.
                </p>
              </div>

              {/* Rendering canvas view */}
              <div className="flex justify-center items-center h-[260px] my-1 relative">
                <canvas
                  id="canvas-thermal-3d"
                  ref={thermalCanvasRef}
                  width={340}
                  height={250}
                  className="rounded-xl border border-transparent"
                />

                {/* Rotation controls overlay */}
                <div className="absolute right-2 bottom-2 bg-black/60 p-2 rounded-xl border border-[#222] flex flex-col gap-2 font-mono text-[9px] min-w-[130px] text-left">
                  <span className="text-slate-500 uppercase font-extrabold text-[8px]">Ajustes de Câmera 3D</span>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Inclinação X:</span>
                      <span className="text-purple-400 font-bold">{thermalAngleX.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="-1.5" 
                      max="1.5" 
                      step="0.1" 
                      value={thermalAngleX} 
                      onChange={(e) => setThermalAngleX(parseFloat(e.target.value))} 
                      className="w-full accent-purple-500 h-1 bg-slate-900"
                    />
                  </div>

                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Giro Orbit Y:</span>
                      <span className="text-purple-400 font-bold">{thermalAngleY.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="6.28" 
                      step="0.1" 
                      value={thermalAngleY} 
                      onChange={(e) => setThermalAngleY(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-slate-900" 
                    />
                  </div>
                </div>

                {/* Color Legend Palette on Left Side */}
                <div className="absolute left-2 bottom-2 bg-black/60 p-2 rounded-xl border border-[#222] font-mono text-[8px] flex flex-col items-center gap-1.5">
                  <span className="text-slate-400 text-[7px] font-bold uppercase">Calor Scalar</span>
                  <div className="w-2.5 h-20 bg-gradient-to-t from-indigo-900 via-pink-600 via-amber-500 to-white rounded" />
                  <div className="flex justify-between w-full font-mono text-[7px] text-slate-500">
                    <span>95°C</span>
                    <span>25°C</span>
                  </div>
                </div>
              </div>

              {/* Component selection switches */}
              <div className="border-t border-[#1e1e24] pt-3 text-left">
                <span className="text-[9px] text-slate-500 font-extrabold uppercase block mb-1.5">Seletor de Componentes Sob Termografia 3D</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TRANSFORMER', label: 'Transformador T1', desc: 'Enrolamento & Buchas' },
                    { id: 'RECTIFIER_UNIT', label: 'Retificador Filtro C1', desc: 'Pontes Retificadoras AC/DC' },
                    { id: 'RACK_BESS', label: 'Racks de Bateria CC', desc: 'Conectores Células de Lítio' }
                  ].map(c => {
                    const isSel = selectedComponent3D === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedComponent3D(c.id as any)}
                        className={`p-2 border rounded-xl text-left transition-all cursor-pointer ${
                          isSel
                            ? 'bg-purple-500/15 border-purple-500/40 text-white'
                            : 'bg-[#111113] border-[#222] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold truncate">{c.label}</div>
                        <div className="text-[8px] font-mono text-slate-500 mt-0.5 truncate">{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Humanized Agent Sophia Panel (5 columns) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          
          {/* Card container: Sophia Artificial Assistant */}
          <div className="bg-[#050505] border border-[#262626] rounded-2xl p-4 flex flex-col gap-4 text-left justify-between min-h-[440px]">
            
            {/* Header / Avatar block */}
            <div className="flex items-center gap-3 border-b border-[#222] pb-3 shrink-0">
              
              {/* VIRTUAL AGENT FACE AVATAR WITH DYNAMIC SVG/CSS EXPRESSIONS */}
              <div className="relative shrink-0">
                
                {/* Outer concentric pulsing target circle */}
                <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-r ${
                  agentEmotionalPulse === 'ALERT' 
                    ? 'from-red-500/20 to-orange-500/20 animate-ping' 
                    : agentTalking 
                      ? 'from-purple-500/20 to-cyan-500/20 animate-pulse' 
                      : 'from-cyan-500/10 to-blue-500/10'
                }`} />

                {/* Animated vector face */}
                <svg className="h-16 w-16 rounded-full bg-[#111115] border border-cyan-500/40 shadow-inner block relative z-10" viewBox="0 0 100 100">
                  {/* Cyber grid details inside face */}
                  <line x1="15" y1="50" x2="85" y2="50" stroke="#00ffcc" strokeOpacity="0.08" strokeWidth="1" />
                  <line x1="50" y1="15" x2="50" y2="85" stroke="#00ffcc" strokeOpacity="0.08" strokeWidth="1" />
                  
                  {/* Glowing humanized holographic face shape outline */}
                  <ellipse cx="50" cy="50" rx="30" ry="34" fill="none" stroke={agentEmotionalPulse === 'ALERT' ? '#ef4444' : '#06b6d4'} strokeWidth="1.5" strokeOpacity="0.7" />
                  
                  {/* Glowing forehead microchip */}
                  <rect x="47" y="24" width="6" height="6" fill="#00ffcc" opacity="0.6" rx="1" />
                  <line x1="50" y1="30" x2="50" y2="35" stroke="#00ffcc" strokeWidth="1" opacity="0.5" />

                  {/* Cheeks blush layout */}
                  <ellipse cx="32" cy="56" rx="4" ry="2.5" fill="#f472b6" opacity="0.3" />
                  <ellipse cx="68" cy="56" rx="4" ry="2.5" fill="#f472b6" opacity="0.3" />

                  {/* EYES - Blinking automatically */}
                  {/* Left Eye */}
                  <g transform="translate(36, 45)">
                    {agentTalking ? (
                      <ellipse cx="0" cy="0" rx="4" ry="4" fill="#22d3ee" className="animate-pulse" />
                    ) : (
                      <ellipse cx="0" cy="0" rx="4" ry="2.5" fill="#38bdf8" />
                    )}
                    <circle cx="0.5" cy="-0.5" r="1" fill="#ffffff" />
                  </g>

                  {/* Right Eye */}
                  <g transform="translate(64, 45)">
                    {agentTalking ? (
                      <ellipse cx="0" cy="0" rx="4" ry="4" fill="#22d3ee" className="animate-pulse" />
                    ) : (
                      <ellipse cx="0" cy="0" rx="4" ry="2.5" fill="#38bdf8" />
                    )}
                    <circle cx="-0.5" cy="-0.5" r="1" fill="#ffffff" />
                  </g>

                  {/* Digital Eyebrows */}
                  <path d={agentEmotionalPulse === 'ALERT' ? 'M28,38 L38,41' : 'M28,39 C31,37 35,37 38,39'} stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                  <path d={agentEmotionalPulse === 'ALERT' ? 'M72,38 L62,41' : 'M72,39 C69,37 65,37 62,39'} stroke="#38bdf8" strokeWidth="1.5" fill="none" />

                  {/* MOUTH - Synchronized SVG path talking waves */}
                  <path 
                    d={`M 38 64 Q 50 ${64 + mouthOpenAmount} 62 64`} 
                    fill="none" 
                    stroke={agentEmotionalPulse === 'ALERT' ? '#ef4444' : '#22d3ee'} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                  />

                  {/* Listening/Status cyber ring */}
                  <circle cx="50" cy="50" r="46" fill="none" stroke={agentTalking ? '#a855f7' : '#222'} strokeWidth="1" strokeDasharray="5, 3" />
                </svg>

                {/* Speech status label */}
                <span className={`absolute -bottom-1 left-1.5 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider text-white ${
                  agentEmotionalPulse === 'ALERT' 
                    ? 'bg-red-600' 
                    : agentTalking 
                      ? 'bg-purple-600' 
                      : 'bg-emerald-600'
                }`}>
                  {agentEmotionalPulse === 'ALERT' ? 'ALERTA' : agentTalking ? 'FALANDO' : 'ESTÁVEL'}
                </span>
              </div>

              {/* Identity & Speech State descriptor */}
              <div>
                <h4 className="text-sm font-bold text-white font-sans flex items-center gap-1">
                  Sophia - HMI Agent
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Sua Assistente Virtual • SENAI-SP Osasco SP-01
                </p>

                {/* SpeechSynthesis Audio Enablement Checkbox */}
                <div className="flex items-center gap-2 mt-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg select-none">
                  <span className="text-[8.5px] text-slate-400 uppercase font-mono">Ler em voz alta:</span>
                  <button
                    onClick={() => {
                      setSpeechAudioEnabled(!speechAudioEnabled);
                      if (!speechAudioEnabled && 'speechSynthesis' in window) {
                        try {
                          const utterance = new SpeechSynthesisUtterance("Voz ativa habilitada.");
                          utterance.lang = 'pt-BR';
                          window.speechSynthesis.speak(utterance);
                        } catch (e) {}
                      }
                    }}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      speechAudioEnabled 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-slate-950 text-slate-500'
                    }`}
                    title={speechAudioEnabled ? "Áudio Falado Ativado" : "Ativar Sintetizador de Voz"}
                  >
                    {speechAudioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </button>
                  <span className="text-[8px] font-mono text-slate-500">PT-BR</span>
                </div>
              </div>

            </div>

            {/* Bubble talk block displays what Sophia is explaining (100% humanized and rich) */}
            <div className="bg-[#0b0c10] border border-[#222] p-3 rounded-2xl flex-grow flex flex-col justify-between max-h-[175px] overflow-y-auto">
              <div className="text-xs text-slate-300 leading-relaxed text-left relative">
                {/* Decorative bubble quote tip */}
                <div className="absolute -top-6 left-3 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[#222]" />
                
                <p className="italic font-sans">
                  "{agentSpeechText}"
                </p>
              </div>

              <div className="flex justify-between items-center text-[8.5px] font-mono border-t border-[#1a1a20] pt-2 mt-2 font-bold select-none shrink-0">
                <span className="text-slate-500">REDE: INTEGRADA (IEC 61850)</span>
                <span className="text-purple-400">EMPATIA INTELECTUAL: 100%</span>
              </div>
            </div>

            {/* Educational Interactive Option Menu */}
            <div className="space-y-2 shrink-0">
              <span className="text-[9.5px] text-slate-500 font-extrabold uppercase block text-left mb-1 font-mono">
                Selecione as Explicações Consultivas da Sophia:
              </span>

              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { key: 'INTRO', title: '1. O que é este Terminal SCADA?' },
                  { key: 'COMPONENTS', title: '2. Responsabilidade Isolada vs Integrada' },
                  { key: 'THERMOGRAPHY', title: '3. Por que Termografia 3D?' },
                  { key: 'OPERATORS', title: '4. Qual o Papel dos Operadores no SCADA?' },
                  { key: 'ODATA_CHILLER', title: '5. Data Center ODATA Osasco SP-01' }
                ].map(op => {
                  return (
                    <button
                      key={op.key}
                      onClick={() => explainTopic(op.key as any)}
                      className="w-full text-left py-2 px-3 border border-[#222] hover:border-purple-500/35 bg-[#121215]/85 hover:bg-[#1a1c24] rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <span className="group-hover:text-purple-400 font-sans">{op.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-purple-400 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* --- BRAND NEW INTEGRATED OPERATIONAL MODES PANEL (REALITY / STUDY / MAINTENANCE) --- */}
      <div className="mt-6 bg-[#0a0a0c] border border-[#222] rounded-2xl p-5 text-left font-sans">
        
        {/* Panel Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c1c20] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                simulationMode === 'REALITY' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : simulationMode === 'STUDY'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                MODO ATIVO: {simulationMode === 'REALITY' ? 'REALIDADE' : simulationMode === 'STUDY' ? 'ESTUDO' : 'MANUTENÇÃO'}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
                {simulationMode === 'REALITY' && <Globe className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />}
                {simulationMode === 'STUDY' && <Sliders className="h-4.5 w-4.5 text-purple-500" />}
                {simulationMode === 'MAINTENANCE' && <Wrench className="h-4.5 w-4.5 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />}
                Painel Integrado de Operação Geral do Sistema
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              {simulationMode === 'REALITY' && 'Monitoramento geográfico de carga e demanda em tempo real por níveis de abrangência e balanço de oferta local vs nacional.'}
              {simulationMode === 'STUDY' && 'Laboratório inteligente para estudos de estresse elétrico, colapso de barramento (apagões) e redundância de proteção N+1.'}
              {simulationMode === 'MAINTENANCE' && 'Painel de comissionamento de equipamentos parados, ampliação de capacidade térmica de barramentos e integração de ativos.'}
            </p>
          </div>

          {/* Quick toggle mode indicators inside panel */}
          <div className="flex items-center gap-1.5 bg-[#121215] p-1 rounded-lg border border-[#222]">
            {(['REALITY', 'STUDY', 'MAINTENANCE'] as const).map(m => {
              const isSel = simulationMode === m;
              return (
                <button
                  key={m}
                  onClick={() => {
                    onChangeSimulationMode(m);
                    if (m === 'REALITY') {
                      speakSophiaCustom("Interface georreferenciada atualizada para o Modo Realidade. Exibindo balanço instantâneo entre a Demanda Consumida e a Oferta sincronizada nacional.", "TALKING");
                    } else if (m === 'STUDY') {
                      speakSophiaCustom("Iniciando ambiente integrado de estudo de contingência. Escolha um cenário para simular perturbações lógicas da rede ou avaliar a comutação rápida de redundância.", "ALERT");
                    } else {
                      speakSophiaCustom("Modo de Manutenção e Ampliação ativado. Agora você pode simular equipamentos parados para comissionamento, testar ampliações de potência ou reajustar setpoints operacionais dos IEDs.", "CONFIRM");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    isSel
                      ? m === 'REALITY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : m === 'STUDY'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {m === 'REALITY' ? 'Realidade' : m === 'STUDY' ? 'Estudos' : 'Manutenção'}
                </button>
              );
            })}
          </div>
        </div>

        {/* --- 1. MODO REALIDADE DISPLAY --- */}
        {simulationMode === 'REALITY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* Hierarchy Drill-Down (7 Columns) */}
            <div className="lg:col-span-7 bg-[#111115] border border-[#222] rounded-xl p-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-3 shrink-0">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  Divisão de Demanda Elétrica Georreferenciada (Escala de Carga)
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase font-extrabold">Active GIS API</span>
              </div>
              
              {/* Drill-Down hierarchy pills */}
              <div className="grid grid-cols-5 gap-1 mb-4">
                {(['RUA', 'BAIRRO', 'MUNICIPIO', 'ESTADO', 'PAIS'] as const).map(lvl => {
                  const isSel = selectedRealityLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => {
                        setSelectedRealityLevel(lvl);
                        if (lvl === 'RUA') speakSophiaCustom("Exibindo cargas no nível de rua. No entorno da subestação, monitoramos os ramais de baixa tensão residenciais e cabos alimentadores secundários.", "TALKING");
                        if (lvl === 'BAIRRO') speakSophiaCustom("Escala de Bairro selecionada. Isto agrega a demanda dos transformadores da Lapa, Anhanguera e Pirituba, totalizando 1920 conexões ativas.", "TALKING");
                        if (lvl === 'MUNICIPIO') speakSophiaCustom("Escala Municipal de São Paulo e Osasco. No município de Osasco, a demanda de grandes consumidores como indústrias e o Data Center ODATA somam parcelas elevadas.", "TALKING");
                        if (lvl === 'ESTADO') speakSophiaCustom("Agregação em nível estadual para o Estado de São Paulo. A demanda instantânea paulista chega a mais de 14 gigawatts de pico.", "TALKING");
                        if (lvl === 'PAIS') speakSophiaCustom("Visão macro do Sistema Interligado Nacional (S.I.N.). Monitorando a oferta das usinas hidroelétricas federais e geradores eólicos regionais.", "TALKING");
                      }}
                      className={`py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer uppercase ${
                        isSel
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35'
                          : 'bg-black/40 text-slate-500 border-transparent hover:text-slate-300 hover:bg-black/60'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic list rendering */}
              <div className="space-y-3 font-mono">
                {selectedRealityLevel === 'RUA' && (
                  <>
                    {[
                      { name: "Rua Afonso Sardinha, Lapa", loadValue: 18, capValue: 60, users: 12 },
                      { name: "Rua Fortunata, Pirituba", loadValue: 34, capValue: 60, users: 24 },
                      { name: "Av. Raimundo Pereira de Magalhães", loadValue: 125, capValue: 200, users: 78 },
                      { name: "Rua do Resgate II, Anhanguera", loadValue: 8, capValue: 40, users: 4 }
                    ].map((item, id) => (
                      <div key={id} className="bg-black/30 border border-[#222]/50 p-2.5 rounded-lg flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-sans">
                          <span className="text-slate-200 font-bold">{item.name}</span>
                          <span className="text-slate-400 text-[9.5px] font-mono">{item.loadValue} kW / {item.capValue} kW ({item.users} Consumidores)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(item.loadValue / item.capValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {selectedRealityLevel === 'BAIRRO' && (
                  <>
                    {[
                      { name: "Bairro Lapa, São Paulo-SP", loadValue: 410, capValue: 800, subs: 1 },
                      { name: "Bairro Pirituba, São Paulo-SP", loadValue: 380, capValue: 1000, subs: 2 },
                      { name: "Bairro Anhanguera, São Paulo-SP", loadValue: 121, capValue: 500, subs: 1 },
                      { name: "Distrito Industrial, Osasco-SP", loadValue: 890, capValue: 1500, subs: 1 }
                    ].map((item, id) => (
                      <div key={id} className="bg-black/30 border border-[#222]/50 p-2.5 rounded-lg flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-sans">
                          <span className="text-slate-300 font-bold">{item.name}</span>
                          <span className="text-slate-400 text-[9.5px] font-mono">{item.loadValue} kW / {item.capValue} kW ({item.subs} Subestações)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#3b82f6] h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(item.loadValue / item.capValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {selectedRealityLevel === 'MUNICIPIO' && (
                  <>
                    {[
                      { name: "Município de São Paulo", loadValue: 2.4, capValue: 6.0, desc: "Capital Metropolitana (Enel SP)" },
                      { name: "Município de Osasco", loadValue: 1.1, capValue: 3.5, desc: "Polo Logístico e Data Centers" },
                      { name: "Município de Barueri", loadValue: 0.9, capValue: 2.0, desc: "Alphaville de Média de Tensão" }
                    ].map((item, id) => (
                      <div key={id} className="bg-black/30 border border-[#222]/50 p-2.5 rounded-lg flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-200 font-bold font-sans">{item.name}</span>
                          <span className="text-slate-400 text-[10px]">{item.loadValue} MW / {item.capValue} MW</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-cyan-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(item.loadValue / item.capValue) * 100}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-slate-500">{item.desc}</div>
                      </div>
                    ))}
                  </>
                )}

                {selectedRealityLevel === 'ESTADO' && (
                  <>
                    {[
                      { name: "Região Metropolitana SP (GSP)", loadValue: 6.8, capValue: 12.0, pct: "56%" },
                      { name: "Região de Campinas & Interior", loadValue: 4.2, capValue: 8.0, pct: "52%" },
                      { name: "Baixada Santista & Litoral", loadValue: 1.8, capValue: 3.0, pct: "60%" }
                    ].map((item, id) => (
                      <div key={id} className="bg-black/30 border border-[#222]/50 p-2.5 rounded-lg flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-200 font-bold font-sans">{item.name}</span>
                          <span className="text-slate-400 text-[10px]">{item.loadValue} GW / {item.capValue} GW</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${(item.loadValue / item.capValue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {selectedRealityLevel === 'PAIS' && (
                  <div className="bg-black/40 border border-[#222] p-3 rounded-lg text-slate-350 leading-relaxed font-sans text-xs flex flex-col gap-2">
                    <div className="flex justify-between items-center font-mono text-[10px] border-b border-[#222] pb-1.5 mb-1 text-slate-400 font-bold font-mono">
                      <span>S.I.N. (SISTEMA INTERLIGADO BRASILEIRO)</span>
                      <span className="text-emerald-400">STATUS: SINCRONIZADO</span>
                    </div>
                    <p className="text-[10.5px]">
                      O Brasil possui 97% de sua transmissão interligada sob o controle do ONS (Operador Nacional do Sistema). No momento atual, as hidrelétricas do Sudeste e Paraná representam 64% do despacho base, enquanto o despacho solar local do nosso HMI apoia a geração local de Pirituba.
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-1 bg-black/50 p-2.5 rounded-lg border border-[#222]/40 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 block">DEMANDA NACIONAL ATIVA:</span>
                        <span className="text-slate-200 font-bold">78.4 GW (Horário Normal)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">RESERVA DE REDUNDÂNCIA:</span>
                        <span className="text-emerald-400 font-bold">12.8 GW (Segurança N+2)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Offer Balancing Block (5 Columns) */}
            <div className="lg:col-span-5 bg-[#111115] border border-[#222] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-3 shrink-0">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-450" />
                    Balanço de Geração Local & Oferta
                  </span>
                  <span className="text-[8.5px] font-mono text-emerald-450 border border-emerald-950/40 bg-emerald-950/10 px-1.5 rounded font-extrabold uppercase">Live</span>
                </div>

                <div className="space-y-3.5 font-sans">
                  {/* Energy Mix */}
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">Oferta Local Solar Fotovoltaica</span>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-slate-300">Painéis Trina Solar 125kW:</span>
                      <span className="text-[#ffb703] font-bold">{telemetry.solarPowerKw.toFixed(1)} kW</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full">
                      <div className="bg-[#ffb703] h-full rounded-full" style={{ width: `${Math.min(100, (telemetry.solarPowerKw / 125) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">Oferta Rede Coletora Externa Enel</span>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-slate-300">Conexão Linhão 138kV AC:</span>
                      <span className="text-indigo-400 font-bold">{(telemetry.gridActivePower).toFixed(2)} MW</span>
                    </div>
                    <div className="w-full h-1 bg-slate-900 rounded-full">
                      <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, (telemetry.gridActivePower / 2.5) * 100)}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono">Status Despacho Baterias BESS</span>
                    <div className="flex items-center justify-between font-mono text-xs font-mono">
                      <span className="text-slate-350">Módulo Lítio Ferro Fosfato (LFP):</span>
                      <span className={`font-bold ${telemetry.bessCurrent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {telemetry.bessCurrent > 0 ? `Carregando: ${(telemetry.bessCurrent * telemetry.bessVoltage / 1000).toFixed(1)} kW` : `Bypass Ativo: ${(-telemetry.bessCurrent * telemetry.bessVoltage / 1000).toFixed(1)} kW`}
                      </span>
                    </div>
                    <div className="text-[10px] flex justify-between font-mono text-slate-500 mt-0.5">
                      <span>Carga Restante SoC:</span>
                      <span className="text-slate-300 font-bold">{telemetry.bessSoc}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator Grid */}
              <div className="bg-[#07070a] border border-[#222]/50 p-3 rounded-lg mt-4 text-[10px] font-mono flex flex-col gap-2.5">
                <div className="flex justify-between border-b border-[#222]/30 pb-2">
                  <span className="text-slate-500 font-bold">DEMANDA TOTAL DA SUBESTAÇÃO:</span>
                  <span className="text-slate-200 font-bold">{((telemetry.dcLoad1PowerKw + telemetry.dcLoad2PowerKw + computedOdataLoadKw)).toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between text-emerald-450">
                  <span className="font-bold">OFERTA TOTAL DA REDE DA USINA:</span>
                  <span className="font-bold">{((telemetry.solarPowerKw + (telemetry.gridActivePower * 1000) + Math.max(0, -telemetry.bessCurrent * telemetry.bessVoltage / 1000))).toFixed(1)} kW</span>
                </div>
                <div className="text-[9.5px] text-slate-500 border-t border-[#222]/30 pt-1.5 flex justify-between">
                  <span>Margem Operacional Segura:</span>
                  <span className="text-emerald-400 font-bold">{(100 * (1 - ((telemetry.dcLoad1PowerKw + telemetry.dcLoad2PowerKw + computedOdataLoadKw) / (telemetry.solarPowerKw + (telemetry.gridActivePower * 1000) + 1)))).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Real World (RW) Telemetry Bento Matrix */}
            <div className="lg:col-span-12 bg-[#111115] border border-[#222] rounded-xl p-4 mt-1 text-left">
              <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-4">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                  <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                  Mundo Real (RW) - Matriz de Monitoramento de Todos os Parâmetros Operacionais
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase font-extrabold">Real-World Telemetry Data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                
                {/* 1. Rede Externa CA */}
                <div className="bg-[#0b0c10] border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] text-slate-350 uppercase font-bold font-mono tracking-wide border-b border-[#1c1c20] pb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
                    1. Rede Externa CA Enel
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tensão Nominal:</span>
                      <span className="text-white font-mono font-bold">{telemetry.gridVoltage.toFixed(1)} kV</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Frequência:</span>
                      <span className="text-emerald-400 font-mono font-bold">{telemetry.gridFreq.toFixed(2)} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Potência Ativa:</span>
                      <span className="text-cyan-400 font-mono font-bold">{telemetry.gridActivePower.toFixed(2)} MW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Potência Reativa:</span>
                      <span className="text-slate-400 font-mono">{telemetry.gridReactivePower.toFixed(2)} MVar</span>
                    </div>
                  </div>
                </div>

                {/* 2. Conversor Retificador */}
                <div className="bg-[#0b0c10] border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] text-slate-350 uppercase font-bold font-mono tracking-wide border-b border-[#1c1c20] pb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                    2. Retificador AC/DC C1
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tensão Saída:</span>
                      <span className="text-white font-mono">{telemetry.rectifierVoltageOut.toFixed(1)} Vcc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corrente CC:</span>
                      <span className="text-blue-400 font-mono font-bold">{Math.round(telemetry.rectifierCurrentOut)} Acc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Temperatura:</span>
                      <span className={`font-mono font-bold ${telemetry.rectifierTempCelsius > 65 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                        {telemetry.rectifierTempCelsius.toFixed(1)} °C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eficiência CC:</span>
                      <span className="text-slate-300 font-mono">{telemetry.rectifierEfficiency.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* 3. Banco Baterias BESS */}
                <div className="bg-[#0b0c10] border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] text-slate-355 uppercase font-bold font-mono tracking-wide border-b border-[#1c1c20] pb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-purple-400 rounded-full animate-pulse" />
                    3. Baterias BESS LFP
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tensão Acoplamento:</span>
                      <span className="text-white font-mono">{telemetry.bessVoltage.toFixed(1)} Vcc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corrente Líquida:</span>
                      <span className={`font-mono font-bold ${telemetry.bessCurrent > 0 ? 'text-amber-400' : telemetry.bessCurrent < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {telemetry.bessCurrent >= 0 ? '+' : ''}{telemetry.bessCurrent.toFixed(1)} Acc
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Percentual SoC:</span>
                      <span className="text-slate-200 font-mono font-bold">{telemetry.bessSoc.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Temperatura Interna:</span>
                      <span className="text-slate-400 font-mono">{telemetry.bessTemp.toFixed(1)} °C</span>
                    </div>
                  </div>
                </div>

                {/* 4. Geração Solar PV1 */}
                <div className="bg-[#0b0c10] border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] text-slate-355 uppercase font-bold font-mono tracking-wide border-b border-[#1c1c20] pb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full animate-pulse" />
                    4. Painel Solar PV1
                  </span>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tensão Arranjo:</span>
                      <span className="text-white">{telemetry.solarVoltage.toFixed(1)} Vcc</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Corrente Inversor:</span>
                      <span className="text-white">{telemetry.solarCurrent.toFixed(1)} Acc</span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-slate-400">Potência Gerada:</span>
                      <span className="text-[#fbbf24] font-bold font-mono">{telemetry.solarPowerKw.toFixed(1)} kW</span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-slate-400">Irradiação Local:</span>
                      <span className="text-slate-400 font-bold font-mono">{telemetry.solarIrradiance.toFixed(0)} W/m²</span>
                    </div>
                  </div>
                </div>

                {/* 5. Cargas Conectadas */}
                <div className="bg-[#0b0c10] border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-2.5">
                  <span className="text-[10px] text-slate-355 uppercase font-bold font-mono tracking-wide border-b border-[#1c1c20] pb-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-orange-400 rounded-full animate-pulse" />
                    5. Demanda das Cargas
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Carga Industrial:</span>
                      <span className="text-slate-200 font-mono">{telemetry.dcLoad1PowerKw.toFixed(1)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Carga Comercial:</span>
                      <span className="text-slate-300 font-mono">{telemetry.dcLoad2PowerKw.toFixed(1)} kW</span>
                    </div>
                    <div className="flex justify-between font-sans flex items-center justify-between">
                      <span className="text-slate-400">Data Center ODATA:</span>
                      <span className="text-slate-100 font-bold font-mono">{computedOdataLoadKw} kW</span>
                    </div>
                    <div className="flex justify-between font-sans flex items-center justify-between">
                      <span className="text-slate-500">Barramento Geral:</span>
                      <span className="text-slate-300 font-mono">{telemetry.bus800VdcVoltage.toFixed(1)} Vcc</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* --- 2. MODO ESTUDO DISPLAY --- */}
        {simulationMode === 'STUDY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-fade-in text-left">
            
            {/* Simulation controllers (7 Columns) */}
            <div className="lg:col-span-7 bg-[#111115] border border-[#222] rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                  <Sliders className="h-4 w-4 text-purple-400" />
                  Painel de Injeção de Falhas de Carga de Estudo (Contingência)
                </span>
                <span className="text-[9px] text-purple-400 border border-purple-500/20 px-1.5 rounded uppercase font-bold">Simulator Core</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Simulated Block 1: Regional Blackout */}
                <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                  studyRegionalBlackout 
                    ? 'bg-red-950/20 border-red-500/40 text-red-100 shadow-lg shadow-red-500/5' 
                    : 'bg-black/30 border-[#222] hover:bg-black/50'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-sans flex items-center gap-1.5">
                        <ShieldAlert className={`h-4 w-4 ${studyRegionalBlackout ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                        Simular Apagão Regional
                      </span>
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold ${studyRegionalBlackout ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 border border-[#333] text-slate-500'}`}>
                        {studyRegionalBlackout ? 'ATIVADO' : 'NORMAL'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans">
                      Corte programado no disjuntor de transferência de Pirituba, isolando a subestação local da Enel. Sophia é instruída com protocolos de colapso de distribuição de bairro.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !studyRegionalBlackout;
                      setStudyRegionalBlackout(newVal);
                      if (newVal) {
                        speakSophiaCustom("ALERTA: Disjuntor Regional de Lapa e Pirituba foi desligado! O transformador principal registrou queda abrupta de entrada. O barramento de 13.8 kilo volts foi isolado e operamos temporariamente de forma autônoma. Sophia alerta para verificação de chaves de comutação.", "ALERT");
                      } else {
                        speakSophiaCustom("Sistema regional restaurado com sucesso. Barramento re-energizado e linhas de campo realimentadas sob sincronismo elétrico normal.", "CONFIRM");
                      }
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                      studyRegionalBlackout
                        ? 'bg-red-600 border-red-400 text-white shadow'
                        : 'bg-[#1a1a24] border-[#3f3f4d] text-slate-300 hover:bg-[#252533]'
                    }`}
                  >
                    {studyRegionalBlackout ? 'Restaurar Rede Regional' : 'Acionar Apagão Regional'}
                  </button>
                </div>

                {/* Simulated Block 2: National Blackout */}
                <div className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                  studyNationalBlackout 
                    ? 'bg-[#1b081b] border-purple-500/50 text-purple-100 shadow-lg shadow-purple-500/5' 
                    : 'bg-black/30 border-[#222] hover:bg-black/50'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-sans flex items-center gap-1.5 font-sans">
                        <Zap className={`h-4 w-4 ${studyNationalBlackout ? 'text-purple-500 animate-bounce' : 'text-slate-400'}`} />
                        Simular Apagão Nacional
                      </span>
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold ${studyNationalBlackout ? 'bg-purple-600 text-white animate-pulse' : 'bg-slate-900 border border-[#333] text-slate-500'}`}>
                        {studyNationalBlackout ? 'BLACKOUT' : 'ESTÁVEL'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-sans">
                      Simula a perda total de importação do Sistema Interligado Nacional (S.I.N.). A voltagem cai instantaneamente para zero e o sistema entra em automação de emergência (Grid-Off total).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newVal = !studyNationalBlackout;
                      setStudyNationalBlackout(newVal);
                      if (newVal) {
                        speakSophiaCustom("CONSERVAÇÃO EXTREMA: Colapso nacional simulado em barramento 138kV. Perda total de conexão do linhão do Sistema Interligado. Ativando intertravamento lógico GOOSE em menos de quinze milissegundos. Grupo motor gerador diesel e banco de bateria acionados para alimentar cargas críticas de TI da ODATA Osasco.", "ALERT");
                      } else {
                        speakSophiaCustom("Acoplamento restabelecido com o Sistema Interligado Nacional. Frequência sincronizada em 60 Hertz exatos. Cargas retomarão suprimento pela malha de transmissão principal.", "CONFIRM");
                      }
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                      studyNationalBlackout
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-[#1a1a24] border-[#3f3f4d] text-slate-300 hover:bg-[#252533]'
                    }`}
                  >
                    {studyNationalBlackout ? 'Parar Simulação Blackout' : 'Executar Blackout Nacional'}
                  </button>
                </div>

              </div>

              {/* Redundancy Toggle */}
              <div className="bg-black/40 border border-[#222] p-3 rounded-lg flex items-center justify-between gap-4 font-sans text-xs">
                <div className="flex items-start gap-2.5">
                  <GitBranch className={`h-5 w-5 ${studyN1Redundancy ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="text-slate-200 font-bold block">Controle de Redundância Ativa Inteligente N+1</span>
                    <span className="text-slate-500 text-[10px]">
                      Habilita o desvio instantâneo automático (Bypass secundário) de proteção no IED se ocorrer avaria.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newVal = !studyN1Redundancy;
                    setStudyN1Redundancy(newVal);
                    if (newVal) {
                      speakSophiaCustom("Redundância ativa energizada em modo N mais um. Isso garante barreira lógica redundante. Em caso de sobrecarga no retificador principal, o ramal secundário seccionador assume a carga de apoio.", "CONFIRM");
                    } else {
                      speakSophiaCustom("AVISO: Redundância passiva desligada. Sem bypass de proteção alternativo. Falhas elétricas causarão desligamentos definitivos devido ao isolamento do ramal.", "ALERT");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                    studyN1Redundancy 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/25'
                  }`}
                >
                  {studyN1Redundancy ? 'Redundância ON' : 'Redundância OFF'}
                </button>
              </div>

              {/* NEW: Sliders para Ajustar Parâmetros Didáticos (Ensino) */}
              <div className="bg-black/20 border border-[#222] p-3 rounded-lg flex flex-col gap-3 font-sans text-xs">
                <span className="text-slate-200 font-bold flex items-center gap-1.5 border-b border-[#222] pb-1.5">
                  <Sliders className="h-4 w-4 text-purple-400" />
                  Ajustar Parâmetros Didáticos (Ambiente de Ensino)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold">Fator de Carga do Bairro: <span className="text-purple-400 font-mono">{loadScaleFactor.toFixed(1)}x</span></label>
                    <input 
                      type="range" 
                      min="0.2" 
                      max="2.5" 
                      step="0.1" 
                      value={loadScaleFactor}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setLoadScaleFactor(val);
                        speakSophiaCustom(`Fator de escala de carga do bairro reajustado para ${val.toFixed(1)} vezes. Veja o impacto no consumo de barramento e na temperatura do transformador.`, "TALKING");
                      }}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-500 block">Aumenta demanda residencial na rede</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold">Limite de Alarme Térmico: <span className="text-purple-400 font-mono">{tempAlarmThreshold.toFixed(1)} °C</span></label>
                    <input 
                      type="range" 
                      min="40.0" 
                      max="90.0" 
                      step="1.0" 
                      value={tempAlarmThreshold}
                      onChange={(e) => {
                        setTempAlarmThreshold(parseFloat(e.target.value));
                      }}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-500 block">Setpoint para relógio térmico do IED</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-bold">Latência de Desvio N-1: <span className="text-purple-400 font-mono">{maneuverBypassLatency} ms</span></label>
                    <input 
                      type="range" 
                      min="1" 
                      max="50" 
                      step="1" 
                      value={maneuverBypassLatency}
                      onChange={(e) => {
                        setManeuverBypassLatency(parseInt(e.target.value));
                      }}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-500 block">Tempo de reação de bypass secundário</span>
                  </div>
                </div>
              </div>

              {/* NEW: Simulações Didáticas de Falhas de Ensino */}
              <div className="bg-black/20 border border-[#222] p-3 rounded-lg flex flex-col gap-2.5 font-sans text-xs">
                <span className="text-slate-200 font-bold flex items-center gap-1.5 border-b border-[#222] pb-1.5">
                  <Flame className="h-4 w-4 text-purple-400 animate-pulse" />
                  Simular Anomalias no Universo de Ensino (Perturbação)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setActiveAnomalySimulation('OVERLOAD');
                      speakSophiaCustom("ENSINO - EVENTO DE SOBRECARGA: Simulando pico severo de consumo nas cargas comerciais e industriais. A corrente nos tiristores se aproxima do limite crítico de 800 Ampéres, disparando o alarme de temperatura no IED de controle.", "ALERT");
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeAnomalySimulation === 'OVERLOAD'
                        ? 'bg-red-950/40 text-red-400 border-red-500/40'
                        : 'bg-black/40 border-[#222] text-slate-450 hover:bg-[#1a1c22]'
                    }`}
                  >
                    ⚡ Sobrecarga Crítica
                  </button>

                  <button
                    onClick={() => {
                      setActiveAnomalySimulation('SYNC_LOSS');
                      speakSophiaCustom("ENSINO - PERDA DE PTP: O relógio GPS mestre perde temporariamente a conexão satélite. O protocolo IEEE 1588 degrada para o modo holdup, e a precisão do timestamping decai de nanosegundos para milisegundos operacionais.", "ALERT");
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeAnomalySimulation === 'SYNC_LOSS'
                        ? 'bg-orange-950/40 text-orange-400 border-orange-500/40'
                        : 'bg-black/40 border-[#222] text-slate-450 hover:bg-[#1a1c22]'
                    }`}
                  >
                    ⏰ Perda Sincronismo
                  </button>

                  <button
                    onClick={() => {
                      setActiveAnomalySimulation('CT_SATURATION');
                      speakSophiaCustom("ENSINO - SATURAÇÃO DE TC: Simulando alteração na onda senoidal de medição por acúmulo de fluxo magnético no transformador de corrente. O IED de proteção acusa erro nas amostras Sampled Values, gerando harmônicas espúrias.", "ALERT");
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeAnomalySimulation === 'CT_SATURATION'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-500/40'
                        : 'bg-black/40 border-[#222] text-slate-450 hover:bg-[#1a1c22]'
                    }`}
                  >
                    〰 Saturation de TC
                  </button>
                </div>

                {activeAnomalySimulation !== 'NONE' && (
                  <div className="flex justify-between items-center bg-purple-950/10 border border-purple-500/20 p-2 rounded mt-1 font-mono text-[10px]">
                    <span className="text-purple-400">Anomalia ativa: <span className="font-bold underline">{activeAnomalySimulation}</span></span>
                    <button 
                      onClick={() => {
                        setActiveAnomalySimulation('NONE');
                        speakSophiaCustom("Simulação de anomalia evacuada. Parâmetros elétricos e lógicos normalizados.", "CONFIRM");
                      }}
                      className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold border border-purple-500/30 rounded cursor-pointer"
                    >
                      Remover Simulação
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Study Results / Technical diagnostics (5 Columns) */}
            <div className="lg:col-span-5 bg-[#111115] border border-[#222] rounded-xl p-4 flex flex-col justify-between font-mono">
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-sans flex items-center gap-1.5 mb-3 animate-fade-in">
                  <Activity className="h-4.5 w-4.5 text-purple-450" />
                  Diagnóstico Técnico do Estudo
                </h4>

                <div className="space-y-3.5 text-[11px] text-slate-400 leading-normal">
                  <div className="flex justify-between items-center border-b border-[#222]/60 pb-1.5">
                    <span>SISTEMA DE ENSINO:</span>
                    <span className="text-purple-400 font-bold">AJUSTES & SIMULAÇÃO ATIVOS</span>
                  </div>

                  <div className="flex justify-between items-center border-[#222]/60 border-b pb-1.5">
                    <span>STATUS SUPRIMENTO TI (ODATA):</span>
                    <span className={`font-bold ${studyNationalBlackout ? 'text-purple-400 animate-pulse' : 'text-emerald-400'}`}>
                      {studyNationalBlackout ? 'diesel GMG (100% redundante)' : 'REDE FÍSICA CA+SOLAR'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-[#222]/60 pb-1.5">
                    <span>VOLTAGEM NO BARRAMENTO AC:</span>
                    <span className={`font-bold ${studyNationalBlackout ? 'text-red-500' : 'text-emerald-400'}`}>
                      {studyNationalBlackout ? '0.00 kV (Grid Loss)' : '138.21 kV (Medido)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#222]/60 pb-1.5">
                    <span>DEMANDA AMBIENTE DE ENSINO:</span>
                    <span className="text-white font-bold">{(1920 * loadScaleFactor).toFixed(0)} kW (Escopo)</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#222]/60 pb-1.5">
                    <span>TEMPERATURA ALARME DE ENSINO:</span>
                    <span className="text-[#fbbf24] font-bold">{tempAlarmThreshold.toFixed(1)} °C</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-[#222]/60 pb-1.5">
                    <span>LATÊNCIA DE COMUTAÇÃO GOOSE:</span>
                    <span className="text-slate-350">{maneuverBypassLatency} ms (Meta IEC 61850 &lt; 15ms)</span>
                  </div>

                  {activeAnomalySimulation === 'OVERLOAD' && (
                    <div className="p-2.5 rounded border border-red-500/20 bg-red-950/20 text-[10px] text-red-400 leading-relaxed font-sans mt-3">
                      ⚠️ <strong>Estudo de Sobrecarga Ativo:</strong> Carga simulada em {((telemetry.dcLoad1PowerKw + telemetry.dcLoad2PowerKw + computedOdataLoadKw) * loadScaleFactor).toFixed(1)} kW ultrapassa o limite de operação nominal. Risco elevado na junta do retificador AC/DC C1.
                    </div>
                  )}

                  {activeAnomalySimulation === 'SYNC_LOSS' && (
                    <div className="p-2.5 rounded border border-orange-500/20 bg-orange-950/20 text-[10px] text-orange-400 leading-relaxed font-sans mt-3">
                      ⚠️ <strong>Estudo de Desconexão GPS:</strong> PTP em Holdup mode. O IED entra em contingência de tempo, monitorando oscilações a nível local via MMS. Perda de registro diferencial.
                    </div>
                  )}

                  {activeAnomalySimulation === 'CT_SATURATION' && (
                    <div className="p-2.5 rounded border border-amber-500/20 bg-amber-950/20 text-[10px] text-amber-400 leading-relaxed font-sans mt-3">
                      ⚠️ <strong>Estudo de Saturação:</strong> Onda distorcida por saturação física do núcleo do transformador de corrente. Recomenda-se aumentar a banda morta ou reajustar o limiar diferencial de proteção.
                    </div>
                  )}

                  {studyNationalBlackout && (
                    <div className="p-2.5 rounded border border-purple-500/25 bg-purple-500/5 text-[10px] text-purple-400 leading-relaxed font-sans mt-3">
                      💡 <strong>Evolução do Apagão:</strong> Com o apagão nacional ativo, a subestação está em modo ilha. As cargas domésticas de Lapa e Pirituba foram isoladas (0 kW), enquanto as baterias descarregam a 80A para garantir a integridade dos servidores da ODATA Osasco.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[#222]/80 text-center text-[10px] text-slate-500">
                <span>LABORATÓRIO DE ENSINO ATIVO • ESTÁVEL</span>
              </div>
            </div>

          </div>
        )}

        {/* --- 3. MODO MANUTENÇÃO DISPLAY --- */}
        {simulationMode === 'MAINTENANCE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch animate-fade-in">
            
            {/* Equipment checklist (7 Columns) */}
            <div className="lg:col-span-7 bg-[#111115] border border-[#222] rounded-xl p-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-4">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                  <Wrench className="h-4 w-4 text-amber-500" />
                  Gerenciar Ativos Parados para Manutenção, Ampliação e Integração
                </span>
                <span className="text-[9px] text-amber-500 border border-amber-500/20 bg-amber-500/5 px-1.5 py-0.5 rounded uppercase font-bold">LOTO (Locks)</span>
              </div>

              {/* Grid of crucial equipment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'TRANSFORMER',
                    name: "T1 - Transformador Central 138kV",
                    desc: "Bobina isolante principal, chaves e buchas de campo",
                    state: maintTransformer,
                    setter: setMaintTransformer,
                    vocalName: "Transformador Central de cento e trinta e oito quilovolts"
                  },
                  {
                    id: 'RECTIFIER',
                    name: "C1 - Filtro Retificador Tiristorizado",
                    desc: "Pontes tiristorizadas para barramento de 800Vcc",
                    state: maintRectifier,
                    setter: setMaintRectifier,
                    vocalName: "Retificador tiristorizado e filtro harmônico de barramento contínuo"
                  },
                  {
                    id: 'BESS',
                    name: "BESS - Banco de Baterias LFP",
                    desc: "Mapeamento térmico de células de lítio-ferro",
                    state: maintBess,
                    setter: setMaintBess,
                    vocalName: "Módulo acumulador de energia de baterias bess"
                  },
                  {
                    id: 'SOLAR',
                    name: "PV1 - Geração Solar Fotovoltaica",
                    desc: "Strings de arranjos fotovoltaicos paralelos",
                    state: maintSolar,
                    setter: setMaintSolar,
                    vocalName: "Inversores e arranjo solar fotovoltaico local de pirituba"
                  }
                ].map(eq => (
                  <div key={eq.id} className={`p-3.5 border rounded-xl flex flex-col justify-between gap-3 transition-all ${
                    eq.state === 'MAINTENANCE' 
                      ? 'bg-amber-950/25 border-amber-500/50 text-amber-200 shadow-md shadow-amber-500/5' 
                      : eq.state === 'EXPANSION'
                        ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                        : 'bg-black/40 border-[#222] text-slate-350'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-bold font-sans pr-1 leading-snug">{eq.name}</span>
                        <span className={`text-[8px] font-mono leading-none tracking-wide font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                          eq.state === 'MAINTENANCE' 
                            ? 'bg-amber-500 text-slate-950 animate-pulse' 
                            : eq.state === 'EXPANSION'
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-600 text-white'
                        }`}>
                          {eq.state === 'ACTIVE' ? 'SISTEMA ATIVO' : eq.state === 'EXPANSION' ? 'AMPLIAÇÃO / INTEG' : 'LOTO MANUTENÇÃO'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-sans leading-normal">{eq.desc}</p>
                    </div>

                    <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-[#222]/60 mt-2 shrink-0">
                      {[
                        { s: 'ACTIVE' as const, lbl: 'Ativo' },
                        { s: 'MAINTENANCE' as const, lbl: 'Manutênc' },
                        { s: 'EXPANSION' as const, lbl: 'Integ' }
                      ].map(stateOpt => (
                        <button
                          key={stateOpt.s}
                          onClick={() => {
                            eq.setter(stateOpt.s);
                            if (stateOpt.s === 'MAINTENANCE') {
                              speakSophiaCustom(`Protocolo LOCKOUT TAGOUT ativado para o equipamento ${eq.vocalName}. O interruptor de carga correspondente foi desligado logicamente no HMI e o ativo está parado para segurança dos eletricistas em nível de proteção física.`, "ALERT");
                            } else if (stateOpt.s === 'EXPANSION') {
                              speakSophiaCustom(`Comissionamento de nova integração e ampliação de capacidade ativado para ${eq.vocalName}. Alterando parâmetros térmicos e redefinindo malha do barramento IEC 61850 para suportar nova carga nominal.`, "CONFIRM");
                            } else {
                              speakSophiaCustom(`Equipamento ${eq.vocalName} re-energizado com sucesso. Retomando fluxo de telemetria ativa e dados de sincronismo padrão de campo.`, "CALM");
                            }
                          }}
                          className={`flex-1 text-[9px] font-mono py-1 rounded cursor-pointer font-bold ${
                            eq.state === stateOpt.s
                              ? eq.state === 'MAINTENANCE'
                                ? 'bg-amber-500 text-slate-950'
                                : eq.state === 'EXPANSION'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          {stateOpt.lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* NEW: Troca de Ativos e Componentes Físicos */}
              <div className="bg-black/20 border border-[#222] p-4 rounded-xl mt-4 font-sans text-xs">
                <span className="text-slate-200 font-bold flex items-center gap-1.5 border-b border-[#222] pb-2 mb-3">
                  <Wrench className="h-4 w-4 text-amber-500 animate-pulse" />
                  Troca de Ativos e Componentes de Campo (Manutenção Corretiva)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    { id: 'oil', label: 'Substituir Óleo do T1', key: 'oilReplaced', desc: 'Renova óleo dielétrico isolante de bobinas' },
                    { id: 'filter', label: 'Trocar Filtro de Harmônicas C1', key: 'filterReplaced', desc: 'Isola picos de corrente tiristorizada' },
                    { id: 'sensors', label: 'Trocar Sensores de Temp', key: 'sensorsReplaced', desc: 'Estabiliza flutuações e medição RTD' },
                    { id: 'fuse', label: 'Trocar Fusível de Campo', key: 'fuseReplaced', desc: 'Substitui fusível de acoplador solar PV1' }
                  ].map(item => {
                    const active = maintSwaps[item.key as keyof typeof maintSwaps];
                    return (
                      <div key={item.id} className="bg-black/40 border border-[#222] p-2.5 rounded-lg flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-300">{item.label}</span>
                            <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded ${active ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-500'}`}>
                              {active ? 'CONCLUÍDO' : 'Pendente'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            setMaintSwaps(prev => ({ ...prev, [item.key]: !active }));
                            if (!active) {
                              speakSophiaCustom(`Reposição concluída com sucesso. ${item.label} foi executado e registrado no SCADA. Ativo calibrado em condições nominais ideais de operação.`, "CONFIRM");
                            } else {
                              speakSophiaCustom(`Status de reposição do ${item.label} redefinido para pendente.`, "CALM");
                            }
                          }}
                          className={`w-full py-1 rounded text-[10px] font-bold cursor-pointer transition-all border ${
                            active
                              ? 'bg-emerald-950/20 border-emerald-550/40 text-emerald-350 hover:bg-emerald-950/30 font-bold'
                              : 'bg-[#1b1c24] border-[#3a3b4c] text-slate-400 hover:bg-[#252631]'
                          }`}
                        >
                          {active ? 'Desfazer Reposição' : 'Concluir Reposição'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NEW: Simulação de Ensaios de Campo em Manutenção */}
              <div className="bg-black/20 border border-[#222] p-4 rounded-xl mt-4 font-sans text-xs">
                <span className="text-slate-200 font-bold flex items-center gap-1.5 border-b border-[#222] pb-2 mb-3">
                  <Activity className="h-4 w-4 text-amber-500" />
                  Simulador de Ensaios e Comissionamento de Campo (Ensaios Elétricos)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="bg-black/40 border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-200 block">Ensaio de Isolamento (Megohmetro)</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                        Injeta 5.000 Vcc sob as bobinas primárias para atestar resistência da rigidez dielétrica do óleo.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveMaintTest('MEGGER');
                        setMeggerResult({
                          status: 'APROVADO',
                          valueMOhms: Math.floor(5200 + Math.random() * 400),
                          label: 'Rigidez excelente (> 5000 MΩ). Isolação sem fuga.'
                        });
                        speakSophiaCustom("Iniciando varredura dielétrica por megohmetro simulado em T1. Injetando tensão de cinco quilovolts contínuos. Resistência de isolação superior a cinco mil megohms. Estágio aprovado em teste de campo e registrado com segurança.", "CONFIRM");
                      }}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold cursor-pointer transition-all"
                    >
                      Executar Teste Megohmetro
                    </button>
                  </div>

                  <div className="bg-black/40 border border-[#222] p-3 rounded-lg flex flex-col justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-200 block">Injeção de Corrente Secundária (IEDs)</span>
                      <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                        Injeta correntes nas bobinas de leitura do relé para calibrar as curvas de sobrecorrente ANSI 50/51.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveMaintTest('SECONDARY_INJECTION');
                        setSecInjectionStatus('CURVA DE DISPARO VERIFICADA NO IED: TEMPO DE RESPOSTA 1.83ms (ANSI 50)');
                        speakSophiaCustom("Iniciando aferição de injeção secundária de corrente. Simulando rampas de sobrecorrente no relé de proteção. Tempo de reação de um ponto oitenta e três milissegundos atesta o fechamento da proteção física rápida.", "CONFIRM");
                      }}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold cursor-pointer transition-all"
                    >
                      Simular Injeção de Corrente
                    </button>
                  </div>
                </div>

                {activeMaintTest !== 'NONE' && (
                  <div className="bg-amber-950/10 border border-amber-500/20 p-2.5 rounded mt-3 text-left font-mono text-[10px] space-y-1">
                    <div className="flex justify-between font-bold border-b border-amber-500/10 pb-1 text-amber-400">
                      <span>Resultado do Teste Ativo ({activeMaintTest})</span>
                      <button 
                        onClick={() => {
                          setActiveMaintTest('NONE');
                          setMeggerResult(null);
                          setSecInjectionStatus(null);
                        }}
                        className="text-[9px] underline hover:text-amber-300 cursor-pointer"
                      >
                        Limpar Teste
                      </button>
                    </div>
                    {activeMaintTest === 'MEGGER' && meggerResult && (
                      <div className="space-y-0.5">
                        <div className="text-white">Status Isolamento: <span className="text-emerald-400 font-bold">{meggerResult.status}</span></div>
                        <div className="text-slate-300">Medição: <span className="text-[#fbbf24] font-bold">{meggerResult.valueMOhms} MΩ</span></div>
                        <div className="text-slate-400 text-[9px]">{meggerResult.label}</div>
                      </div>
                    )}
                    {activeMaintTest === 'SECONDARY_INJECTION' && secInjectionStatus && (
                      <div className="text-slate-200">
                        {secInjectionStatus}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Setpoints config parameters forms (5 Columns) */}
            <div className="lg:col-span-5 bg-[#111115] border border-[#222] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#222] pb-3 mb-3.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                    <Sliders className="h-4 w-4 text-amber-500" />
                    Alterar Parâmetros de Proteção IEDs
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono font-extrabold uppercase font-mono">Setpoints Limits</span>
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setParamSuccessMsg("Parâmetros operacionais gravados nos IEDs via protocolo MMS da subestação!");
                    speakSophiaCustom("Novos limites de frequência e limite de sobretensão gravados na memória estática dos dispositivos inteligentes. Calibragem de barramento concluída.", "CONFIRM");
                    setTimeout(() => setParamSuccessMsg(null), 5000);
                  }}
                  className="space-y-4 font-mono text-[11px] text-slate-300"
                >
                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Limite Sobrefrequência ANSI 81 (60 Hz):</span>
                      <span className="text-amber-400 font-bold font-mono">{customFreqLimit.toFixed(1)} Hz</span>
                    </div>
                    <input 
                      type="range"
                      min="60.1"
                      max="62.5"
                      step="0.1"
                      value={customFreqLimit}
                      onChange={(e) => setCustomFreqLimit(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <div className="flex justify-between items-center text-slate-400 font-sans">
                      <span>Limite Sobretensão ANSI 59 (138 kV):</span>
                      <span className="text-amber-400 font-bold font-mono">{customVoltLimit.toFixed(0)} kV</span>
                    </div>
                    <input 
                      type="range"
                      min="139"
                      max="155"
                      step="1"
                      value={customVoltLimit}
                      onChange={(e) => setCustomVoltLimit(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {paramSuccessMsg && (
                    <div className="p-2 bg-emerald-950/25 border border-emerald-500/25 text-emerald-400 rounded text-[9px] leading-relaxed">
                      ✓ {paramSuccessMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 bg-amber-500/15 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold font-sans cursor-pointer transition-colors"
                  >
                    Salvar Parâmetros e Sincronizar IEDs
                  </button>
                </form>

                {/* NEW: Sliders de Ajuste de Calibração e Comissionamento */}
                <div className="border border-[#222] bg-black/20 rounded-xl p-3.5 mt-5 text-left font-mono">
                  <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-3">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                      <Sliders className="h-4 w-4 text-amber-500" />
                      Ajustes de Adiantamento e Calibragem
                    </span>
                    <span className="text-[8.5px] text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">CALIBRATION</span>
                  </div>

                  <div className="space-y-4 font-sans text-xs text-slate-300">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Setpoint Ventilação do T1:</span>
                        <span className="text-amber-400 font-bold font-mono">{maintFanThreshold.toFixed(1)} °C</span>
                      </div>
                      <input 
                        type="range"
                        min="30"
                        max="70"
                        step="1"
                        value={maintFanThreshold}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setMaintFanThreshold(val);
                          speakSophiaCustom(`Limite do setpoint de dissipação mecânica forçada redefinido para ${val.toFixed(0)} graus celsius, acelerando ventiladores de refrigeração no transformador central.`, "TALKING");
                        }}
                        className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                      <span className="text-[9px] text-slate-500 block">Aciona resfriamento forçado do transformador</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Pressão do Gás Nitrogênio:</span>
                        <span className="text-amber-400 font-bold font-mono">{maintNitrogenPressure.toFixed(1)} psi</span>
                      </div>
                      <input 
                        type="range"
                        min="5"
                        max="30"
                        step="0.5"
                        value={maintNitrogenPressure}
                        onChange={(e) => setMaintNitrogenPressure(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                      <span className="text-[9px] text-slate-500 block">Pressurização de colchão inerte contra umidade</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Resistência Shunt Aterra:</span>
                        <span className="text-amber-400 font-bold font-mono">{maintShuntResist.toFixed(2)} Ohm</span>
                      </div>
                      <input 
                        type="range"
                        min="0.05"
                        max="0.50"
                        step="0.01"
                        value={maintShuntResist}
                        onChange={(e) => setMaintShuntResist(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-amber-500"
                      />
                      <span className="text-[9px] text-slate-500 block">Impedância transiente do circuito terra</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* LOTO Notice panel */}
              <div className="bg-[#09090b] border border-amber-500/10 p-3 rounded-lg mt-4 text-[9.5px] text-slate-500 leading-normal font-sans">
                ⚠️ <strong>Atenção:</strong> De acordo com a norma regulamentadora de segurança, chaves e disjuntores em manutenção física devem possuir cadeamento LOTO no HMI clássico para bloquear manipulações acidentais por outros operadores.
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
