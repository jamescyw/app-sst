import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [documento, setDocumento] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const result = await login(documento);
    
    // Si fue exitoso y tiene módulos asignados
    if (result && result.success) {
      if (result.allowedModules.length > 0) {
        // Redirige al primer módulo al que tiene permiso
        const primerModulo = result.allowedModules[0];
        navigate(`/${primerModulo}`);
      } else {
        alert('Ingreso exitoso, pero no tienes módulos asignados.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login SST</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Documento</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={documento} onChange={e => setDocumento(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition-colors">
            Ingresar
          </button>
        </div>
      </form>
    </div>
  );
}