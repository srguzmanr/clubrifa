import { useState } from 'react';
import { supabase } from './supabase';

interface AuthProps {
  onLogin: (usuario: any) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [rol, setRol] = useState('participante');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setCargando(false);
      return;
    }

    // Fetch the usuario record with their role
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    if (userError || !usuario) {
      setError('Usuario no encontrado en el sistema');
      setCargando(false);
      return;
    }

    setCargando(false);
    onLogin(usuario);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellido,
          rol,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setCargando(false);
      return;
    }

    // The trigger auto-creates the usuario row
    // Now fetch it
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', data.user!.id)
      .single();

    if (userError || !usuario) {
      setError('Error creando perfil de usuario');
      setCargando(false);
      return;
    }

    setCargando(false);
    onLogin(usuario);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: '8px' }}>
          🎟️ ClubRifa
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
          {modo === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        <form onSubmit={modo === 'login' ? handleLogin : handleRegistro}>
          {modo === 'registro' && (
            <>
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                style={inputStyle}
              />
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                style={inputStyle}
              >
                <option value="participante">
                  Participante (compra boletos)
                </option>
                <option value="vendedor">Vendedor / Promotor</option>
                <option value="admin">Administrador</option>
              </select>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Contraseña (mínimo 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && (
            <p
              style={{
                color: '#e74c3c',
                fontSize: '0.85rem',
                margin: '0 0 12px 0',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: cargando ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
            }}
          >
            {cargando
              ? 'Cargando...'
              : modo === 'login'
              ? 'Iniciar Sesión'
              : 'Crear Cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          {modo === 'login' ? (
            <>
              ¿No tienes cuenta?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setModo('registro');
                }}
                style={{ color: '#2563eb' }}
              >
                Regístrate
              </a>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setModo('login');
                }}
                style={{ color: '#2563eb' }}
              >
                Inicia sesión
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: '12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};
