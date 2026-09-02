import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IdCard } from 'lucide-react';

export default function Login() {
  const [documento, setDocumento] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(documento);
    
    if (result && result.success) {
      if (result.allowedModules.length > 0) {
        const primerModulo = result.allowedModules[0];
        navigate(`/${primerModulo}`);
      } else {
        alert('Ingreso exitoso, pero no tienes módulos asignados.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f8] p-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <span className="text-[#503629]">
              <IdCard size={44} />
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#503629]">Ingresa tu número de documento para continuar</h2>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="Ej. 1020304050"
              className="w-full p-3 border border-gray-400 rounded-lg focus:ring-2 focus:ring-[#A88C7D] focus:border-[#A88C7D] outline-none transition-all"
              value={documento} 
              onChange={e => setDocumento(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#503629] text-white font-bold py-3 rounded-lg hover:bg-[#3d291f] transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}