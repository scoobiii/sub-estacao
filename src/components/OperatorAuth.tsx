import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Eye, 
  Lock, 
  Unlock, 
  Users, 
  CheckCircle2, 
  UserPlus, 
  LogOut, 
  Key, 
  AlertTriangle,
  FileSpreadsheet,
  Cpu
} from 'lucide-react';
import { Operator } from '../types';

interface OperatorAuthProps {
  guiStyle: 'CLASSIC_SCADA' | 'HITACHI_ADMS';
  currentUser: Operator | null;
  activeOperators: Operator[];
  onLogin: (operator: Operator) => void;
  onLogout: () => void;
  onRegister: (name: string, role: 'monitoramento' | 'adm', registration: string) => void;
  unauthorizedActionAttempt: string | null;
  onClearAttempt: () => void;
}

export default function OperatorAuth({
  guiStyle,
  currentUser,
  activeOperators,
  onLogin,
  onLogout,
  onRegister,
  unauthorizedActionAttempt,
  onClearAttempt
}: OperatorAuthProps) {
  const isClassic = guiStyle === 'CLASSIC_SCADA';

  // State for login inputs
  const [typedRegistration, setTypedRegistration] = useState('');
  const [typedPin, setTypedPin] = useState('1234');
  const [loginError, setLoginError] = useState<string | null>(null);

  // State for adding a new operator (Register)
  const [registerName, setRegisterName] = useState('');
  const [registerRole, setRegisterRole] = useState<'monitoramento' | 'adm'>('monitoramento');
  const [registerReg, setRegisterReg] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Hardcoded predefined list of authorized network personnel
  // To show 'defina a quantidade de operadores'
  const [presetOperators] = useState<Omit<Operator, 'status' | 'activeSince'>[]>([
    { id: 'op1', name: 'Eng. Adriano Santos', role: 'adm', registration: 'SENAI-ADM-01', avatarColor: 'bg-red-500' },
    { id: 'op2', name: 'Téc. Roberto Souza', role: 'adm', registration: 'SENAI-ADM-02', avatarColor: 'bg-orange-500' },
    { id: 'op3', name: 'Op. Patrícia Lima', role: 'monitoramento', registration: 'SENAI-MON-01', avatarColor: 'bg-blue-500' },
    { id: 'op4', name: 'Est. Lucas Mendes', role: 'monitoramento', registration: 'SENAI-MON-02', avatarColor: 'bg-emerald-500' },
  ]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Look up in active list or preset list
    const foundPreset = presetOperators.find(o => o.registration.trim().toUpperCase() === typedRegistration.trim().toUpperCase());
    const foundActive = activeOperators.find(o => o.registration.trim().toUpperCase() === typedRegistration.trim().toUpperCase());

    if (foundActive) {
      onLogin(foundActive);
      setTypedRegistration('');
      setTypedPin('1234');
    } else if (foundPreset) {
      // Login matching preset
      const fullOp: Operator = {
        ...foundPreset,
        status: 'ATIVO',
        activeSince: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      onLogin(fullOp);
      setTypedRegistration('');
      setTypedPin('1234');
    } else {
      setLoginError('Credencial de Operador ou Registro SENAI não encontrado no banco de dados da subestação.');
    }
  };

  const handleSelectPreset = (op: Omit<Operator, 'status' | 'activeSince'>) => {
    setTypedRegistration(op.registration);
    setLoginError(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName || !registerReg) return;

    onRegister(registerName, registerRole, registerReg);
    setRegisterName('');
    setRegisterReg('');
    setRegisterSuccess(true);
    setTimeout(() => setRegisterSuccess(false), 3000);
  };

  return (
    <div className={`p-5 min-h-[500px] border-t-2 ${
      isClassic 
        ? 'bg-[#151924] border-t-blue-500 text-slate-350 font-mono' 
        : 'text-slate-100 bg-[#0c0c0e] border-[#222] rounded-2xl'
    }`}>
      
      {/* ACCESS DENIED POPUP BAR */}
      {unauthorizedActionAttempt && (
        <div className="mb-6 p-4 bg-red-950/90 border-2 border-red-500/50 rounded-xl flex items-start gap-3.5 animate-bounce shadow-2xl z-50">
          <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-red-300 font-sans">AÇÃO IMPEDIDA - CONDIÇÃO DE TRIP DE SEGURANÇA</h4>
            <p className="text-xs text-red-200 mt-1">
              Tentativa não autorizada: <strong className="text-yellow-400">"{unauthorizedActionAttempt}"</strong>. 
              Sua sessão atual possui direitos de <strong className="underline text-orange-400">NÍVEL MONITORAMENTO (Leitura-Apenas)</strong>. 
              Para manobrar disjuntores, alterar limites ANSI dos IEDs, injetar stress ou sincronizar os geradores diesel ODATA, realize autenticação com uma conta de nível de <strong className="text-emerald-400">ADMINISTRADOR (ADM)</strong>.
            </p>
          </div>
          <button 
            onClick={onClearAttempt}
            className="text-[10px] bg-red-900/60 hover:bg-red-800 text-white font-bold py-1 px-3 rounded cursor-pointer uppercase transition-all"
          >
            Disparar OK
          </button>
        </div>
      )}

      {/* Main Grid: Info and Login Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column: Overview of operators directory (7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Card: Grid Security System Operator Count */}
          <div className={`p-4 border ${
            isClassic ? 'bg-[#090b11] border-[#292f40]' : 'bg-[#050505] border-[#252528] rounded-xl'
          }`}>
            <span className="text-[10px] font-mono tracking-widest text-[#22d3ee] uppercase font-bold flex items-center gap-1.5 mb-2">
              <Users className="h-4.5 w-4.5" />
              Diretório Operacional do Terminal • Norma ISA-101 / IEC 62443
            </span>
            <div className="flex items-center justify-between mt-1 mb-4">
              <h3 className="text-base font-extrabold font-sans text-slate-100">
                Quantidade Máxima de Operadores Reconhecidos: <span className="text-cyan-400">{presetOperators.length + activeOperators.filter(o => !presetOperators.some(p => p.registration === o.registration)).length}</span>
              </h3>
              <div className="text-[11px] font-mono bg-[#111] px-2.5 py-1 rounded border border-[#222]">
                Sessões Ativas Online: <strong className="text-emerald-400 font-extrabold">{activeOperators.filter(o => o.status === 'ATIVO').length}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              A auditoria de cibersegurança do Senai-SP exige que cada comando enviado por MMS ou GOOSE possua assinatura com credencial eletrônica rastreável do operador (ANSI 50/51, 86, etc). O sistema bloqueia manobras de usuários de monitoramento simples.
            </p>

            {/* List of personnel */}
            <div className="space-y-2.5">
              <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
                Operadores de Escala Cadastrados no Banco de Dados
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presetOperators.map((op) => {
                  const isActive = activeOperators.some(o => o.registration === op.registration && o.status === 'ATIVO');
                  const isCurrent = currentUser?.registration === op.registration;
                  
                  return (
                    <div 
                      key={op.id}
                      onClick={() => handleSelectPreset(op)}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-cyan-500/10 border-cyan-500/40' 
                          : isActive 
                            ? 'bg-slate-900/60 border-slate-700/50' 
                            : 'bg-[#111113] border-[#222] hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${op.avatarColor}`}>
                          {op.name.charAt(4)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{op.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">Reg: {op.registration}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-mono font-bold block uppercase ${
                          op.role === 'adm' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                          {op.role === 'adm' ? 'ADMS ADM' : 'Monitoramento'}
                        </span>
                        <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded ${
                          isActive 
                            ? 'bg-emerald-900/30 text-emerald-400' 
                            : 'bg-slate-900 text-slate-500'
                        }`}>
                          {isActive ? 'Conectado' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 font-mono mt-3.5 leading-snug">
              ℹ️ DICA: Clique em qualquer cartão de operador acima para preencher automaticamente suas credenciais no formulário ao lado.
            </p>
          </div>

          {/* SESSÕES TÉCNICAS ATIVAS LOGGER */}
          <div className={`p-4 border flex-grow ${
            isClassic ? 'bg-[#090b11] border-[#292f40]' : 'bg-[#050505] border-[#252528] rounded-xl'
          }`}>
            <span className="text-[10px] font-mono tracking-widest text-[#a855f7] uppercase font-bold flex items-center gap-1.5 mb-2">
              <FileSpreadsheet className="h-4.5 w-4.5" />
              Sessões de Trabalho de Terminal e Termografia de Barramento
            </span>
            
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#222] text-slate-500">
                    <th className="pb-2">Operador</th>
                    <th className="pb-2">Nível</th>
                    <th className="pb-2">ID Registro</th>
                    <th className="pb-2">Hora Entrada</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#18181a] text-slate-300">
                  {activeOperators.map((ao) => (
                    <tr key={ao.id} className="hover:bg-black/20">
                      <td className="py-2.5 font-sans font-bold text-white">{ao.name}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                          ao.role === 'adm' ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400'
                        }`}>
                          {ao.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5">{ao.registration}</td>
                      <td className="py-2.5">{ao.activeSince}</td>
                      <td className="py-2.5 text-right">
                        <span className="text-emerald-400">● {ao.status}</span>
                      </td>
                    </tr>
                  ))}
                  {activeOperators.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        Nenhum operador conectado em regime ativo no momento. Use o terminal ao lado para entrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Login Form & Register (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* LOGIN AUTH FORM */}
          <div className={`p-4 border ${
            isClassic ? 'bg-[#090b11] border-[#292f40]' : 'bg-[#050505] border-[#252528] rounded-xl'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5 font-sans">
                <Key className="h-4.5 w-4.5 text-amber-500" />
                Terminal de Autenticação SCADA
              </h3>
              {currentUser ? (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold">
                  Sessão Ativa
                </span>
              ) : (
                <span className="bg-slate-900 border border-slate-700 text-slate-400 text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold">
                  Sem Login
                </span>
              )}
            </div>

            {currentUser ? (
              /* If Logged In */
              <div className="space-y-4 p-3 bg-black/40 border border-[#222] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white text-sm font-extrabold ${currentUser.avatarColor}`}>
                    {currentUser.name.charAt(4)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 font-sans">{currentUser.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Reg: {currentUser.registration}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-[#222] pt-3">
                  <span className="text-slate-500">Nível Operacional:</span>
                  <span className={`text-right font-bold uppercase ${
                    currentUser.role === 'adm' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {currentUser.role === 'adm' ? 'Administrador (ADM)' : 'Monitoramento'}
                  </span>

                  <span className="text-slate-500">Horário Login:</span>
                  <span className="text-right text-slate-300">{currentUser.activeSince}</span>

                  <span className="text-slate-500 font-bold block pt-1">Privilégios HMI:</span>
                  <span className={`text-right font-bold block pt-1 ${
                    currentUser.role === 'adm' ? 'text-emerald-400' : 'text-amber-400 text-[10px]'
                  }`}>
                    {currentUser.role === 'adm' ? '[Acesso Total / Comando]' : '[Leitura-Apenas / Visualizar]'}
                  </span>
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="w-full bg-red-950/40 border border-red-900 hover:bg-red-900/60 active:scale-98 text-red-200 font-sans font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar Sessão de Trabalho do Operador
                </button>
              </div>
            ) : (
              /* If Logged Out Form */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {loginError && (
                  <div className="p-2.5 bg-red-950/50 border border-red-900 rounded-lg text-xs text-red-300">
                    ⚠️ {loginError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block font-sans">
                    Identidade Operacional (ID Registro)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      id="input-login-reg"
                      type="text"
                      placeholder="Ex: SENAI-ADM-01"
                      value={typedRegistration}
                      onChange={(e) => setTypedRegistration(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block font-sans">
                    Senha / PIN de Linha de Proteção
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      id="input-login-pin"
                      type="password"
                      placeholder="••••"
                      value={typedPin}
                      onChange={(e) => setTypedPin(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Senha padrão: <strong>1234</strong></span>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  className="w-full bg-cyan-400 hover:bg-cyan-500 text-slate-950 font-sans font-extrabold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-400/10"
                >
                  <Unlock className="h-4 w-4" />
                  Autenticar e Abrir Sessão de Escala
                </button>
              </form>
            )}
          </div>

          {/* DYNAMIC REGISTRATION Form (Add New Operator to DB) */}
          <div className={`p-4 border ${
            isClassic ? 'bg-[#090b11] border-[#292f40]' : 'bg-[#050505] border-[#252528] rounded-xl'
          }`}>
            <h3 className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5 font-sans mb-3">
              <UserPlus className="h-4 w-4 text-purple-400" />
              Garantia de Plantão: Cadastrar Operador Auxiliar
            </h3>

            {registerSuccess && (
              <div className="mb-3 p-2 bg-emerald-950/40 border border-emerald-900 rounded-lg text-xs text-emerald-300 text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Operador cadastrado com sucesso!
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs text-left">
              <div className="space-y-1">
                <label className="font-bold text-slate-400 font-sans block">Nome do Operador</label>
                <input
                  id="input-reg-name"
                  type="text"
                  placeholder="Ex: Op. Andréia Santos"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 font-sans block">ID Registro</label>
                  <input
                    id="input-reg-code"
                    type="text"
                    placeholder="SENAI-MON-03"
                    value={registerReg}
                    onChange={(e) => setRegisterReg(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400 font-sans block">Nível de Acesso</label>
                  <select
                    id="select-reg-role"
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value as 'monitoramento' | 'adm')}
                    className="w-full bg-[#0a0a0c] border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:ring-0"
                  >
                    <option value="monitoramento">Monitoramento</option>
                    <option value="adm">Administrador (ADM)</option>
                  </select>
                </div>
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-sans font-bold text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Registrar no Banco de Dados do Relé
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
