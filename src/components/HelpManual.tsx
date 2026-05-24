import React, { useState } from 'react';
import { BookOpen, HelpCircle, ArrowRight, CheckCircle2, Award, Calendar } from 'lucide-react';

export default function HelpManual() {
  const [openSection, setOpenSection] = useState<string | null>('iec61850');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="bg-[#0f0f0f] rounded-xl border border-[#262626] p-4">
      
      {/* Course Banner Head */}
      <div className="bg-[#050505] border border-[#262626]/85 p-4 rounded-xl mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 w-fit mb-1.5">
            <Award className="h-3 w-3" /> SENAI Pirituba • São Paulo
          </span>
          <h2 className="text-md sm:text-lg font-bold text-slate-100 font-sans">
            Automação de Subestações Digitais - Tecnologia e Aplicações
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Curso de Aperfeiçoamento Profissional • Setor Sistemas de Energia GTD • Carga horária: 40 horas
          </p>
        </div>
        <div className="bg-[#0f0f0f] border border-[#262626] font-mono text-[10.5px] p-2.5 rounded-lg text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Período Escolar
          </div>
          <div className="text-[10px] mt-1 text-slate-400">11/06/2026 - 16/07/2026</div>
          <div className="text-[10px] text-slate-400">Sábados • 08h00 às 17h00</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-4.5 w-4.5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300 font-sans">
          Guia Didático de Automação, Redes e Termografia
        </h3>
      </div>

      <div className="space-y-3 font-sans">
        
        {/* Section 1 - IEC 61850 */}
        <div className="border border-[#262626]/40 rounded-lg overflow-hidden bg-[#050505]/40">
          <button
            onClick={() => toggleSection('iec61850')}
            className="w-full text-left p-3 flex justify-between items-center font-bold text-xs text-slate-200 hover:bg-slate-900/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-mono">IEC 61850</span>
              Comunicações Digitais (GOOSE, SV, MMS)
            </span>
            <span className="text-slate-500 text-lg">{openSection === 'iec61850' ? '−' : '+'}</span>
          </button>
          
          {openSection === 'iec61850' && (
            <div className="p-3.5 border-t border-slate-900/60 text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                A norma <strong>IEC 61850</strong> revolucionou o setor elétrico ao substituir os antigos cabos metálicos de controle por fibra óptica, integrando a subestação de forma totalmente digital. Divide-se em três serviços cruciais:
              </p>
              <ul className="space-y-2.5 pl-1.5">
                <li className="flex gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 font-mono">GOOSE (Generic Object Oriented Substation Events):</strong> 
                    <p className="mt-0.5 text-slate-400">
                      Mensagens horizontais multicast ultra-rápidas entre relés (tempo crítico &lt; 3 milissegundos). Utilizadas para intertravamento e comando de trip (desarme) instantâneos. No simulador, ao registrar falha de curto-circuito, os comandos de disparo são enviados via pacotes GOOSE!
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 font-mono">SV (Sampled Values - IEC 61850-9-2):</strong>
                    <p className="mt-0.5 text-slate-400">
                      Transmissão contínua em alta velocidade de dados de corrente e tensão digitalizados por Merging Units (MU). Geralmente opera a 80 amostras por ciclo em 60Hz. Alimenta os osciloscópios dos relés de proteção.
                    </p>
                  </div>
                </li>
                <li className="flex gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 font-mono">MMS (Manufacturing Message Specification):</strong>
                    <p className="mt-0.5 text-slate-400">
                      Protocolo de supervisão vertical focado no SCADA central. Transmite logs, diagnósticos de telemetria geral de cargas e leituras parametrizadas assíncronas.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 2 - 800V DC Bus */}
        <div className="border border-[#262626]/40 rounded-lg overflow-hidden bg-[#050505]/40">
          <button
            onClick={() => toggleSection('bus800V')}
            className="w-full text-left p-3 flex justify-between items-center font-bold text-xs text-slate-200 hover:bg-slate-900/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-mono">CC 800V</span>
              O Papel do Barramento de 800 VDC em Subestações de Próxima Geração
            </span>
            <span className="text-slate-500 text-lg">{openSection === 'bus800V' ? '−' : '+'}</span>
          </button>
          
          {openSection === 'bus800V' && (
            <div className="p-3.5 border-t border-slate-900/60 text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                Os barramentos de Corrente Contínua de Alta Tensão (como o de <strong>800 Vcc</strong> idealizado na especificação) estão no coração da transição energética:
              </p>
              <ul className="space-y-2 pl-1 text-slate-400">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Eficiência Superior:</strong> Permite acoplar a geração fotovoltaica e os sistemas de bateria (BESS) diretamente em CC. Elimina múltiplos inversores intermediários, mitigando perdas de chaveamento elétrico em até 8%.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Proteção Concentrada:</strong> Sistemas digitais exigem detecção térmica local e lógica de subtensão CC rápidos (ANSI 27DC) para contornar instabilidades e evitar o colapso físico de células de bateria de Lítio.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Carregamento Rápido:</strong> O padrão de 800Vcc é a tensão nativa ideal para carregadores ultrarrápidos de veículos elétricos e microrredes industriais.</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 3 - Sincronismo */}
        <div className="border border-[#262626]/40 rounded-lg overflow-hidden bg-[#050505]/40">
          <button
            onClick={() => toggleSection('sync')}
            className="w-full text-left p-3 flex justify-between items-center font-bold text-xs text-slate-200 hover:bg-slate-900/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded text-[10px] font-mono">TIME-SYNC</span>
              Tempo Real e Precisão Temporal (PTP, IRIG-B, NTP)
            </span>
            <span className="text-slate-500 text-lg">{openSection === 'sync' ? '−' : '+'}</span>
          </button>
          
          {openSection === 'sync' && (
            <div className="p-3.5 border-t border-[#262626]/30 text-xs text-slate-400 space-y-3 leading-relaxed font-sans">
              <p>
                No processamento de Sampled Values em subestações digitais, atrasos de microssegundos podem mudar a polaridade elétrica medida e deslocar a fase, provocando disparos indesejados! Veja a comparação das tecnologias:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-center text-[10.5px] font-mono mt-2">
                <div className="border border-[#262626]/85 p-2 rounded bg-[#0f0f0f]">
                  <span className="text-cyan-400 font-bold block">PTP (IEEE 1588)</span>
                  <span className="text-[9px] text-slate-500">Precisão: &lt; 1 μs (Microsegundo)</span>
                  <span className="text-[8px] text-emerald-400 block mt-1">Ideal para SV 9-2</span>
                </div>
                <div className="border border-[#262626]/85 p-2 rounded bg-[#0f0f0f]">
                  <span className="text-amber-400 font-bold block">GPS Antena</span>
                  <span className="text-[9px] text-slate-500">Precisão: ~50 ns (Nano)</span>
                  <span className="text-[8px] text-emerald-400 block mt-1">Sinc. Global</span>
                </div>
                <div className="border border-[#262626]/85 p-2 rounded bg-[#0f0f0f]">
                  <span className="text-indigo-400 font-bold block">IRIG-B</span>
                  <span className="text-[9px] text-slate-500">Precisão: &lt; 10 μs</span>
                  <span className="text-[8px] text-slate-400 block mt-1">Legado Industrial</span>
                </div>
                <div className="border border-[#262626]/85 p-2 rounded bg-[#0f0f0f]">
                  <span className="text-red-400 font-bold block">NTP Default</span>
                  <span className="text-[9px] text-slate-500">Precisão: 1 - 50 ms (Mili)</span>
                  <span className="text-[8px] text-rose-400 block mt-1">Insuficiente para SV</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4 - Termografia */}
        <div className="border border-[#262626]/40 rounded-lg overflow-hidden bg-[#050505]/40">
          <button
            onClick={() => toggleSection('thermo')}
            className="w-full text-left p-3 flex justify-between items-center font-bold text-xs text-slate-200 hover:bg-slate-900/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded text-[10px] font-mono">T-CAMERA</span>
              Critérios de Criticidade Termográfica (Delta-T NETA)
            </span>
            <span className="text-slate-500 text-lg">{openSection === 'thermo' ? '−' : '+'}</span>
          </button>
          
          {openSection === 'thermo' && (
            <div className="p-3.5 border-t border-[#262626]/30 text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                Como profissional de Termografia (grade curricular do SENAI Pirituba), o diagnóstico baseia-se na diferença de temperatura entre conexões idênticas ou em relação à temperatura ambiente (&Delta;T):
              </p>
              <div className="space-y-2 mt-2 font-mono text-[10px]">
                <div className="p-2 border border-[#262626]/30 rounded bg-emerald-950/10 text-emerald-400 flex justify-between">
                  <span>Delta: De 1 °C a 10 °C</span>
                  <span>Ação: Baixo Risco - Manutenção Preventiva na próxima parada ordinária.</span>
                </div>
                <div className="p-2 border border-[#262626]/30 rounded bg-amber-950/10 text-amber-500 flex justify-between font-bold">
                  <span>Delta: De 11 °C a 20 °C</span>
                  <span>Ação: Atenção - Programar reparo de aperto para impedir progressão térmica.</span>
                </div>
                <div className="p-2 border border-[#262626]/30 rounded bg-orange-950/10 text-orange-400 flex justify-between font-bold">
                  <span>Delta: De 21 °C a 40 °C</span>
                  <span>Ação: Severo - Limpar e reapertar conexões deterioradas imediatamente.</span>
                </div>
                <div className="p-2 border border-red-950/20 rounded bg-red-950/10 text-red-400 flex justify-between font-bold animate-pulse">
                  <span>Delta: Acima de 40 °C</span>
                  <span>Ação: Crítico - Desconexão imperativa sob iminente colapso mecânico ou curto.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5 - OpenInfra / OSM API */}
        <div className="border border-[#262626]/40 rounded-lg overflow-hidden bg-[#050505]/40">
          <button
            onClick={() => toggleSection('openinfra')}
            className="w-full text-left p-3 flex justify-between items-center font-bold text-xs text-slate-200 hover:bg-slate-900/50 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-mono">GIS & API</span>
              Integração de Mapas e API OpenInfra (GIS Substation Data)
            </span>
            <span className="text-slate-500 text-lg">{openSection === 'openinfra' ? '−' : '+'}</span>
          </button>
          
          {openSection === 'openinfra' && (
            <div className="p-3.5 border-t border-[#262626]/30 text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                O ecossistema <strong>OpenInfraMap</strong> (disponível em <a href="https://openinframap.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">openinframap.org</a> e documentado no <a href="https://github.com/openinframap" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">GitHub</a>) é um projeto de código aberto que renderiza a rede mundial de eletricidade, telecomunicações, gasodutos e infraestruturas solares / eólicas sobre dados abertos do <strong>OpenStreetMap (OSM)</strong>.
              </p>

              <h4 className="text-slate-200 font-bold font-mono text-[11px] mt-2 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Estrutura de Consulta Pública (Overpass QL)
              </h4>
              <p>
                Para recuperar subestações de energia reais ao redor de um ponto geográfico dinâmico (com base em dados de geolocalização do navegador ou inputs manuais), o simulador usa a biblioteca nativa fetch apontando para os intérpretes do <strong>Overpass API</strong>. A linguagem de consulta estruturada (Overpass Query Language) se assemelha a:
              </p>

              <div className="bg-[#0f0f0f] border border-[#262626]/85 p-3 rounded font-mono text-[10px] text-slate-350 space-y-1 overflow-x-auto">
                <div><span className="text-yellow-500">[out:json][timeout:15];</span></div>
                <div>(</div>
                <div className="pl-4">node<span className="text-cyan-400">["power"="substation"]</span>(around:<span className="text-purple-400">&#123;radius_meters&#125;</span>, <span className="text-purple-400">&#123;lat&#125;</span>, <span className="text-purple-400">&#123;lon&#125;</span>);</div>
                <div className="pl-4">way<span className="text-cyan-400">["power"="substation"]</span>(around:<span className="text-purple-400">&#123;radius_meters&#125;</span>, <span className="text-purple-400">&#123;lat&#125;</span>, <span className="text-purple-400">&#123;lon&#125;</span>);</div>
                <div>);</div>
                <div><span className="text-yellow-500">out center;</span></div>
              </div>

              <h4 className="text-slate-200 font-bold font-mono text-[11px] mt-3.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Tratamento de Chaves Semânticas (Tags de Alta Tensão)
              </h4>
              <p>
                As concessionárias de transmissão mundiais cooperam catalogando metadados importantes nas redes reguladas. Após o retorno do objeto JSON, o simulador parseia os dados usando mapeamento condicional:
              </p>

              <ul className="space-y-1.5 pl-2 text-[11px]">
                <li className="flex items-start gap-1">
                  <span className="text-cyan-400 font-mono font-bold shrink-0">"power"="substation"</span>
                  <span className="text-slate-400">— Identifica formalmente que o perímetro ou nó geométrico é uma subestação transformadora de cargas.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-amber-400 font-mono font-bold shrink-0">"voltage"</span>
                  <span className="text-slate-400">— Tensão em Volts (ex: 138000 para 138 kV). No código, convertemos dividindo o valor padrão por 1000.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-emerald-400 font-mono font-bold shrink-0">"operator" ou "brand"</span>
                  <span className="text-slate-400">— Determina qual concessionária regional opera o barramento físico (ex: Enel, CTEEP, Furnas, CPFL).</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-purple-400 font-mono font-bold shrink-0">"substation"</span>
                  <span className="text-slate-400">— Define o nível hierárquico, distinguindo barramentos de "transmission" (transmissão) e "distribution" (distribuição).</span>
                </li>
              </ul>

              <div className="bg-[#12110c] text-amber-500 border border-amber-500/20 text-[10.5px] p-2.5 rounded mt-3 leading-relaxed">
                <strong>Dica de Desenvolvimento:</strong> Ao comissionar novas microrredes locais usando o formulário de cadastro do módulo, você simula o envio de relatórios de telemetria SCADA de volta ao GIS operacional, expandindo a flexibilidade técnica didática do laboratório integrado!
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
