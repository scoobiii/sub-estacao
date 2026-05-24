export type SwitchState = 'OPEN' | 'CLOSED';

export interface CircuitBreaker {
  id: string;
  name: string;
  type: 'disjuntor' | 'seccionadora';
  state: SwitchState;
  position: { x: number; y: number };
  associatedBus: string;
}

export type SyncProtocol = 'PTP' | 'IRIG-B' | 'GPS' | 'NTP';

export interface Telemetry {
  gridVoltage: number;    // kV (AC side, e.g. 138)
  gridFreq: number;       // Hz (e.g. 60)
  gridActivePower: number; // MW
  gridReactivePower: number; // MVAr
  
  rectifierVoltageOut: number; // VDC (aims for 800)
  rectifierCurrentOut: number; // A
  rectifierTempCelsius: number; // °C (thermal focus)
  rectifierEfficiency: number; // %
  
  bus800VdcVoltage: number; // VDC (the core 800V Bus)
  bus800VdcCurrent: number; // A Total
  bus800VdcPowerKw: number; // kW
  
  bessVoltage: number;    // VDC
  bessCurrent: number;    // A (+ is charging, - discharging)
  bessSoc: number;        // State of Charge %
  bessTemp: number;       // °C
  bessStatus: 'CHARGING' | 'DISCHARGING' | 'STANDBY' | 'FAULT';
  
  solarVoltage: number;   // VDC
  solarCurrent: number;   // A
  solarPowerKw: number;   // kW
  solarIrradiance: number; // W/m²
  
  dcLoad1Voltage: number; // VDC
  dcLoad1Current: number; // A
  dcLoad1PowerKw: number; // kW
  
  dcLoad2Voltage: number; // VDC
  dcLoad2Current: number; // A
  dcLoad2PowerKw: number; // kW
}

export interface NetworkPacket {
  id: string;
  timestamp: string;      // HH:mm:ss.SSS (with nanosecond precision if PTP)
  protocol: 'GOOSE' | 'SV' | 'MMS' | 'PTP';
  source: string;         // IED.MU_Bay1, IED.Prot_Line, SCADA, Clocks
  destination: string;    // Multicast or SCADA IP
  description: string;    // Details of data payload
  payload: Record<string, string | number | boolean>;
  isAlert?: boolean;
}

export interface IEDConfig {
  id: string;
  name: string;
  description: string;
  role: 'MU' | 'PUB_SUB_PROT' | 'BCU' | 'SCADA' | 'CLOCK'; // Merging Unit, Protection, Bay Control, etc.
  ipAddress: string;
  // Protective Settings
  ansi59Limit: number;    // Overvoltage AC limit (V) - e.g., 145kV
  ansi27DCLimitLow: number;  // Undervoltage 800VDC threshold (V) - e.g., 720V
  ansi59DCLimitHigh: number; // Overvoltage 800VDC threshold (V) - e.g., 880V
  gooseAppId: string;
  gooseVlan: number;
  ptpDomain: number;
  timeSyncMode: SyncProtocol;
}

export interface ThermogramHotspot {
  id: string;
  componentName: string;
  baseTemp: number;       // °C typical ambient environment
  currentTemp: number;    // °C active live
  criticalTemp: number;   // °C threshold for alarm
  x: number;              // Position percentage in thermal image
  y: number;              // Position percentage in thermal image
  failureMode: string;    // e.g. "Alta resistência de contato", "Sobrecarga de Retificação"
  status: 'NORMAL' | 'WARM' | 'CRITICAL';
}
