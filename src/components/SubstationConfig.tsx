import React, { useState } from 'react';
import { 
  MapPin, 
  Globe, 
  Compass, 
  Plus, 
  Trash2, 
  Search, 
  Navigation, 
  Activity, 
  Check, 
  AlertCircle, 
  Building2 
} from 'lucide-react';
import { Substation } from '../types';

interface SubstationConfigProps {
  substations: Substation[];
  selectedSubstationId: string;
  onSelectSubstation: (id: string) => void;
  onAddSubstation: (sub: Substation) => void;
  onDeleteSubstation: (id: string) => void;
}

export default function SubstationConfig({
  substations,
  selectedSubstationId,
  onSelectSubstation,
  onAddSubstation,
  onDeleteSubstation,
}: SubstationConfigProps) {
  // Geolocation & OSM state
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(30); // km
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccessMsg, setApiSuccessMsg] = useState<string | null>(null);

  // Form state
  const [newSubName, setNewSubName] = useState('');
  const [newSubLat, setNewSubLat] = useState('');
  const [newSubLon, setNewSubLon] = useState('');
  const [newSubVoltage, setNewSubVoltage] = useState('138 kV');
  const [newSubOperator, setNewSubOperator] = useState('');
  const [newSubCity, setNewSubCity] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('Distribuição');

  // Trigger geolocation request
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserCoords({ lat, lon });
        setNewSubLat(lat.toFixed(6));
        setNewSubLon(lon.toFixed(6));
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Permissão para geolocalização foi negada pelo usuário.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Informações de localização indisponíveis.');
            break;
          case error.TIMEOUT:
            setGeoError('Tempo limite esgotado ao tentar obter localização.');
            break;
          default:
            setGeoError('Ocorreu um erro desconhecido ao obter localização.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Run the OpenStreetMap / OpenInfra Overpass Query
  const handleFetchOpenInfraData = async () => {
    const latToQuery = userCoords ? userCoords.lat : -23.5049; // Default to SENAI Pirituba SP if not localized
    const lonToQuery = userCoords ? userCoords.lon : -46.7214;

    setIsFetchingApi(true);
    setApiError(null);
    setApiSuccessMsg(null);

    try {
      const radiusMeters = searchRadius * 1000;
      // Overpass QL query to search for substation elements (both node and way types with centers)
      const query = `[out:json][timeout:15];(node["power"="substation"](around:${radiusMeters},${latToQuery},${lonToQuery});way["power"="substation"](around:${radiusMeters},${latToQuery},${lonToQuery}););out center;`;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Servidor da API OpenInfra/OSM retornou status inconsistente.');
      }

      const data = await res.json();
      const elements = data.elements || [];

      if (elements.length === 0) {
        setApiError(`Nenhuma subestação cadastrada no OpenStreetMap foi encontrada num raio de ${searchRadius} km.`);
        setIsFetchingApi(false);
        return;
      }

      let countAdded = 0;
      elements.forEach((ele: any) => {
        // Build unique ID
        const finalId = `osm_${ele.id}`;
        // Prevent adding duplicate ID
        if (substations.some(s => s.id === finalId)) return;

        const nameValue = ele.tags?.name || `Subestação OSM #${ele.id.toString().slice(-4)}`;
        const latValue = ele.lat || ele.center?.lat;
        const lonValue = ele.lon || ele.center?.lon;

        if (latValue && lonValue) {
          const fetchedVoltage = ele.tags?.voltage 
            ? `${(parseFloat(ele.tags.voltage) / 1000).toFixed(0)} kV` 
            : '138 kV (Estimado)';
          const fetchedOperator = ele.tags?.operator || ele.tags?.brand || 'Concessionária Local';
          const fetchedCity = ele.tags?.['addr:city'] || ele.tags?.['is_in:city'] || 'Região Metropolitana';
          
          onAddSubstation({
            id: finalId,
            name: nameValue,
            lat: latValue,
            lon: lonValue,
            voltage: fetchedVoltage,
            operator: fetchedOperator,
            city: fetchedCity,
            type: ele.tags?.substation === 'transmission' ? 'Transmissão' : 'Distribuição',
            source: 'OPENINFRA'
          });
          countAdded++;
        }
      });

      setIsFetchingApi(false);
      setApiSuccessMsg(`Busca concluída! ${elements.length} subestações localizadas pela API (${countAdded} novas integradas na lista).`);
    } catch (err: any) {
      console.error(err);
      setApiError('Não foi possível conectar à API OpenInfra (Overpass API). Verifique sua conexão à internet.');
      setIsFetchingApi(false);
    }
  };

  // Form submission for manual substation
  const handleSaveManualSubstation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    const latNum = parseFloat(newSubLat);
    const lonNum = parseFloat(newSubLon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setApiError('Latitude ou Longitude inválida. Certifique-se de inserir valores decimais.');
      return;
    }

    const uniqueId = `manual_${Date.now()}`;
    const newSub: Substation = {
      id: uniqueId,
      name: newSubName.trim(),
      lat: latNum,
      lon: lonNum,
      voltage: newSubVoltage,
      operator: newSubOperator.trim() || 'Operador Especialista',
      city: newSubCity.trim() || 'São Paulo',
      type: newSubCategory,
      source: 'MANUAL'
    };

    onAddSubstation(newSub);
    
    // Clear form inputs
    setNewSubName('');
    setNewSubOperator('');
    setNewSubCity('');
    // Notice of success
    setApiSuccessMsg(`Subestação "${newSub.name}" cadastrada com sucesso!`);
    setTimeout(() => setApiSuccessMsg(null), 5000);
  };

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#262626] p-4 flex flex-col gap-6">
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 font-sans flex items-center gap-2">
            <Globe className="h-4.5 w-4.5 text-cyan-400" />
            Configurações Regionais & API OpenInfra (Geolocalização)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gerencie múltiplos postos de monitoramento elétrico real e simule o comissionamento de novos barramentos georreferenciados.
          </p>
        </div>
        <span className="text-[10px] font-mono text-slate-500 font-medium shrink-0">
          VIRTUAL GIS SUBSYSTEM
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Coordinates & API Fetches (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Card 1: Geolocation Handler */}
          <div className="bg-[#050505] border border-[#262626] rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-2">
              <Compass className="h-4 w-4 text-amber-500" />
              1. Localizar Sensor de Campo (GPS / Georeferenciador)
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              Obtenha a sua geolocalização física para identificar subestações e linhas de transmissão de alta tensão reais ao seu redor mapeadas pela comunidade internacional de infraestrutura.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="bg-[#1a1a1a] hover:bg-[#222222] text-slate-100 font-semibold border border-[#3f3f3f] px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Navigation className={`h-4 w-4 text-cyan-400 ${isLocating && 'animate-pulse'}`} />
                {isLocating ? 'Obtendo GPS...' : 'Adquirir Coordenadas do Navegador'}
              </button>

              {userCoords ? (
                <div className="bg-[#020d09] text-emerald-450 border border-emerald-950/40 text-[10px] font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Sincronizado: {userCoords.lat.toFixed(6)}°, {userCoords.lon.toFixed(6)}°
                </div>
              ) : (
                <div className="bg-[#0f0f0f] text-amber-500 border border-[#262626] text-[10px] font-mono px-3 py-1.5 rounded-lg">
                  Referência Padrão: SENAI Pirituba, SP (-23.5049°, -46.7214°)
                </div>
              )}
            </div>

            {geoError && (
              <div className="bg-[#0e0202] text-red-400 border border-red-950/40 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5 leading-relaxed font-mono">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{geoError}</span>
              </div>
            )}
          </div>

          {/* Card 2: OpenInfra / Overpass OSM API Loader */}
          <div className="bg-[#050505] border border-[#262626] rounded-xl p-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan-400" />
              2. Consulta Automática OpenInfra API (Overpass OSM)
            </h4>
            <p className="text-[10.5px] text-slate-400 leading-normal">
              O OpenStreetMap armazena as coordenadas precisas de milhares de subestações transformadoras públicas. Ao acionar a busca, consultaremos este banco de dados aberto e dinâmico diretamente em tempo real:
            </p>

            {/* Slider Radius */}
            <div className="space-y-2 bg-[#0f0f0f]/40 p-3 rounded-lg border border-[#262626]/60">
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="text-slate-500 font-mono">Raio Geográfico de Busca:</span>
                <span className="text-cyan-400 font-bold font-mono">{searchRadius} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full h-1 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFetchOpenInfraData}
                disabled={isFetchingApi}
                className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/15 border border-cyan-500/30 px-4 py-2 rounded-lg text-xs flex items-center gap-2 font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Globe className={`h-4 w-4 ${isFetchingApi && 'animate-spin'}`} />
                {isFetchingApi ? 'Buscando Dados Elétricos...' : 'Pesquisar e Sincronizar Subestações'}
              </button>
            </div>

            {/* Response Messages */}
            {apiError && (
              <div className="bg-[#0e0202] text-red-400 border border-red-950/40 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5 leading-relaxed font-mono">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {apiSuccessMsg && (
              <div className="bg-[#020d09] text-emerald-400 border border-emerald-950/40 text-[10px] p-2.5 rounded-lg flex items-start gap-1.5 leading-relaxed font-mono">
                <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>{apiSuccessMsg}</span>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Add Substation Manually (5 Columns) */}
        <div className="lg:col-span-5 bg-[#050505] border border-[#262626] rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-2 mb-3">
            <Plus className="h-4.5 w-4.5 text-purple-400" />
            Cadastrar Subestação Manualmente
          </h4>
          <p className="text-[10px] text-slate-500 leading-normal mb-4">
            Insira os dados técnicos e defina novas coordenadas do parque gerador ou ponto de consumo industrial para o simulador.
          </p>

          <form onSubmit={handleSaveManualSubstation} className="space-y-3.5 text-[11px] font-mono text-slate-300">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-slate-500 block">Nome da Subestação:</label>
              <input
                type="text"
                placeholder="Ex. SE Pirituba II - Ramal 800V"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                required
                className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Grid Coordinates Row */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-slate-500 block">Latitude (°):</label>
                <input
                  type="text"
                  placeholder="-23.5049"
                  value={newSubLat}
                  onChange={(e) => setNewSubLat(e.target.value)}
                  required
                  className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 block">Longitude (°):</label>
                <input
                  type="text"
                  placeholder="-46.7214"
                  value={newSubLon}
                  onChange={(e) => setNewSubLon(e.target.value)}
                  required
                  className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Operator and City */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-slate-500 block">Concessionária/Operador:</label>
                <input
                  type="text"
                  placeholder="Ex. Enel SP"
                  value={newSubOperator}
                  onChange={(e) => setNewSubOperator(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 block">Município / UF:</label>
                <input
                  type="text"
                  placeholder="Ex. São Paulo"
                  value={newSubCity}
                  onChange={(e) => setNewSubCity(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Voltage and Category */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-slate-500 block">Tensão Nominal:</label>
                <select
                  value={newSubVoltage}
                  onChange={(e) => setNewSubVoltage(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                >
                  <option value="13.8 kV">Média (13.8 kV)</option>
                  <option value="138 kV">Alta (138 kV)</option>
                  <option value="230 kV">Alta (230 kV)</option>
                  <option value="500 kV">Extra-Alta (500 kV)</option>
                  <option value="800 VDC">Contínua (800 VDC)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-500 block">Categoria:</label>
                <select
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#262626]/80 p-2 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                >
                  <option value="Distribuição">Distribuição</option>
                  <option value="Transmissão">Transmissão</option>
                  <option value="Geração Solar">Geração Solar</option>
                  <option value="Industrial CC">Industrial CC</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/30 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
            >
              <Plus className="h-4.5 w-4.5" /> Salvar Subestação no Simulador
            </button>
          </form>
        </div>

      </div>

      {/* Section D: List and Selector Box */}
      <div className="bg-[#050505] border border-[#262626] rounded-xl p-4 flex flex-col gap-3 font-mono">
        <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-1.5">
          <Activity className="h-4.5 w-4.5 text-cyan-400" />
          Rede de Subestações Disponíveis ({substations.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[350px] overflow-y-auto pr-1">
          {substations.map((sub) => {
            const isActive = sub.id === selectedSubstationId;
            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubstation(sub.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between gap-3.5 ${
                  isActive
                    ? 'bg-[#12110c] border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-[#0f0f0f] border-[#262626] hover:bg-[#151515]'
                }`}
              >
                <div>
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold font-sans text-slate-200 line-clamp-1">
                      {sub.name}
                    </span>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${
                      sub.source === 'OPENINFRA'
                        ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/15'
                        : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/15'
                    }`}>
                      {sub.source}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="text-[10px] text-slate-400 mt-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Concessionária:</span>
                      <span className="text-slate-300 text-right truncate max-w-[130px] font-sans">
                        {sub.operator}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Localização:</span>
                      <span className="text-slate-350 text-right font-mono text-[9px]">
                        {sub.lat.toFixed(4)}°, {sub.lon.toFixed(4)}°
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Tensão / Tipo:</span>
                      <span className="text-slate-300 text-right text-[9.5px]">
                        {sub.voltage} ({sub.type})
                      </span>
                    </div>
                    {sub.city && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Município/Região:</span>
                        <span className="text-slate-300 text-right truncate max-w-[130px] font-sans text-[9px]">
                          {sub.city}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer block actions */}
                <div className="flex items-center justify-between border-t border-[#262626]/60 pt-2.5">
                  {isActive ? (
                    <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      MONITORANDO AGORA
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-bold hover:text-slate-300 transition-colors">
                      CLIQUE PARA CONECTAR
                    </span>
                  )}

                  {/* Delete button (Only allow deleting added manual or fetched entries) */}
                  {(sub.id !== 'sub_pirituba' && sub.id !== 'sub_anhanguera' && sub.id !== 'sub_lapa') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSubstation(sub.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      title="Excluir subestação do painel"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
