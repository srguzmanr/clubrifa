import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Auth } from './Auth';
import { RifaCard } from './RifaCard';
import { SelectorBoletos } from './SelectorBoletos';
import { PantallaPago } from './PantallaPago';
import { PanelPromotor } from './PanelPromotor';
import { PanelAdmin } from './PanelAdmin';

function App() {
  const [usuario, setUsuario] = useState<any>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [rifas, setRifas] = useState<any[]>([]);
  const [rifaSeleccionada, setRifaSeleccionada] = useState<any>(null);
  const [boletosParaComprar, setBoletosParaComprar] = useState<any[] | null>(
    null
  );

  // Check if user is already logged in (persisted session)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from('usuarios')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) setUsuario(data);
            setCargandoSesion(false);
          });
      } else {
        setCargandoSesion(false);
      }
    });
  }, []);

  // Load rifas when participante logs in
  useEffect(() => {
    if (usuario?.rol === 'participante') {
      cargarRifas();
    }
  }, [usuario]);

  const cargarRifas = async () => {
    const { data } = await supabase
      .from('rifas')
      .select(
        `
        *,
        premios (*),
        boletos (*)
      `
      )
      .eq('estado', 'activa');
    if (data) setRifas(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  const handleComprar = (rifa: any) => {
    setRifaSeleccionada(rifa);
    setBoletosParaComprar(null);
  };

  const handleContinuarPago = (boletos: any[]) => {
    setBoletosParaComprar(boletos);
  };

  const handleExitoPago = () => {
    setRifaSeleccionada(null);
    setBoletosParaComprar(null);
    cargarRifas();
  };

  const handleCerrarSelector = () => {
    setRifaSeleccionada(null);
  };

  const handleCerrarPago = () => {
    setBoletosParaComprar(null);
  };

  // Loading screen while checking session
  if (cargandoSesion) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui',
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  // Not logged in — show auth screen
  if (!usuario) {
    return <Auth onLogin={setUsuario} />;
  }

  // Logged in — show the right panel based on role
  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto',
      }}
    >
      {/* Header with user info and logout */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
        }}
      >
        <div>
          <strong>🎟️ ClubRifa</strong>
          <span style={{ margin: '0 12px', color: '#ccc' }}>|</span>
          <span>
            {usuario.nombre} {usuario.apellido}
          </span>
          <span
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor:
                usuario.rol === 'admin'
                  ? '#e74c3c'
                  : usuario.rol === 'vendedor'
                  ? '#f39c12'
                  : '#2563eb',
              color: 'white',
              borderRadius: '4px',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
            }}
          >
            {usuario.rol}
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 16px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Role-based content */}
      {usuario.rol === 'admin' && <PanelAdmin />}

      {usuario.rol === 'vendedor' && <PanelPromotor vendedorId={usuario.id} />}

      {usuario.rol === 'participante' && (
        <>
          <h2>Rifas Activas</h2>
          {rifas.length === 0 ? (
            <p>No hay rifas activas en este momento.</p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {rifas.map((rifa) => (
                <RifaCard
                  key={rifa.id}
                  rifa={rifa}
                  onComprar={() => handleComprar(rifa)}
                />
              ))}
            </div>
          )}

          {rifaSeleccionada && !boletosParaComprar && (
            <SelectorBoletos
              boletos={rifaSeleccionada.boletos}
              precioBoleto={rifaSeleccionada.precio_boleto}
              onContinuar={handleContinuarPago}
              onCerrar={handleCerrarSelector}
            />
          )}

          {rifaSeleccionada && boletosParaComprar && (
            <PantallaPago
              boletos={boletosParaComprar}
              precioBoleto={rifaSeleccionada.precio_boleto}
              rifaId={rifaSeleccionada.id}
              rifaNombre={rifaSeleccionada.nombre}
              compradorId={usuario.id}
              onExito={handleExitoPago}
              onCerrar={handleCerrarPago}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
