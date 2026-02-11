import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function PanelAdmin() {
  const [vista, setVista] = useState<'rifas' | 'crear' | 'ventas'>('rifas');
  const [rifas, setRifas] = useState<any[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ganadorInfo, setGanadorInfo] = useState<any>(null);
  const [ejecutandoSorteo, setEjecutandoSorteo] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioBoleto, setPrecioBoleto] = useState('');
  const [cantidadBoletos, setCantidadBoletos] = useState('');
  const [fechaEjecucion, setFechaEjecucion] = useState('');
  const [premioNombre, setPremioNombre] = useState('');
  const [premioValor, setPremioValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarRifas();
  }, []);

  const cargarRifas = async () => {
    setCargando(true);
    const { data } = await supabase
      .from('rifas')
      .select(
        `
        *,
        premios (*),
        boletos (id, estado, numero),
        ganadores (*)
      `
      )
      .order('fecha_creacion', { ascending: false });
    if (data) setRifas(data);
    setCargando(false);
  };

  const cargarVentas = async () => {
    const { data } = await supabase
      .from('ventas')
      .select(
        `
        *,
        usuarios!ventas_id_comprador_fkey (nombre, apellido, email),
        rifas (nombre)
      `
      )
      .order('fecha_venta', { ascending: false });
    if (data) setVentas(data);
  };

  const crearRifa = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_id', user!.id)
      .single();

    const { data: rifa, error: rifaError } = await supabase
      .from('rifas')
      .insert({
        id_creador: usuario!.id,
        nombre,
        descripcion,
        precio_boleto: parseFloat(precioBoleto),
        cantidad_boletos: parseInt(cantidadBoletos),
        fecha_ejecucion: fechaEjecucion,
        estado: 'borrador',
      })
      .select()
      .single();

    if (rifaError) {
      setMensaje('Error: ' + rifaError.message);
      setGuardando(false);
      return;
    }

    await supabase.from('premios').insert({
      id_rifa: rifa.id,
      nombre: premioNombre,
      valor: parseFloat(premioValor),
      tipo: 'principal',
      lugar: 1,
    });

    const boletos = Array.from(
      { length: parseInt(cantidadBoletos) },
      (_, i) => ({
        id_rifa: rifa.id,
        numero: i + 1,
        estado: 'disponible',
      })
    );
    await supabase.from('boletos').insert(boletos);

    setNombre('');
    setDescripcion('');
    setPrecioBoleto('');
    setCantidadBoletos('');
    setFechaEjecucion('');
    setPremioNombre('');
    setPremioValor('');
    setGuardando(false);
    setMensaje('✅ Rifa creada con ' + cantidadBoletos + ' boletos');
    cargarRifas();
  };

  const cambiarEstado = async (rifaId: string, nuevoEstado: string) => {
    await supabase
      .from('rifas')
      .update({ estado: nuevoEstado })
      .eq('id', rifaId);
    cargarRifas();
  };

  // === THE SORTEO ===
  const ejecutarSorteo = async (rifa: any) => {
    setEjecutandoSorteo(true);
    setGanadorInfo(null);

    // 1. Get all SOLD tickets with their owner
    const { data: boletosVendidos } = await supabase
      .from('boletos')
      .select('id, numero, id_comprador')
      .eq('id_rifa', rifa.id)
      .eq('estado', 'vendido');

    if (!boletosVendidos || boletosVendidos.length === 0) {
      alert('No hay boletos vendidos para esta rifa.');
      setEjecutandoSorteo(false);
      return;
    }

    // 2. Pick a random ticket
    const indiceGanador = Math.floor(Math.random() * boletosVendidos.length);
    const boletoGanador = boletosVendidos[indiceGanador];

    if (!boletoGanador.id_comprador) {
      alert('El boleto ganador no tiene comprador asignado.');
      setEjecutandoSorteo(false);
      return;
    }

    // 3. Get winner info
    const { data: ganador } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email')
      .eq('id', boletoGanador.id_comprador)
      .single();

    // 4. Get the prize
    const premio = rifa.premios[0];

    // 5. Record the winner
    await supabase.from('ganadores').insert({
      id_rifa: rifa.id,
      id_boleto: boletoGanador.id,
      id_premio: premio.id,
      id_ganador: ganador!.id,
      numero_boleto: boletoGanador.numero,
    });

    // 6. Update rifa status
    await supabase
      .from('rifas')
      .update({ estado: 'finalizada' })
      .eq('id', rifa.id);

    // 7. Show winner
    setGanadorInfo({
      nombre: ganador!.nombre + ' ' + ganador!.apellido,
      email: ganador!.email,
      numeroBoleto: boletoGanador.numero,
      premio: premio.nombre,
      rifaNombre: rifa.nombre,
    });

    setEjecutandoSorteo(false);
    cargarRifas();
  };

  // === CSV EXPORT ===
  const exportarCSV = () => {
    if (ventas.length === 0) return;

    const headers = ['Fecha', 'Rifa', 'Comprador', 'Email', 'Boletos', 'Monto'];
    const rows = ventas.map((v) => [
      new Date(v.fecha_venta).toLocaleDateString('es-MX'),
      v.rifas?.nombre || '',
      (v.usuarios?.nombre || '') + ' ' + (v.usuarios?.apellido || ''),
      v.usuarios?.email || '',
      v.cantidad_boletos,
      v.monto_total,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ventas_clubrifa.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>Panel de Administrador</h2>

      {/* Winner announcement modal */}
      {ganadorInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              maxWidth: '450px',
              width: '90%',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ margin: '0 0 8px 0' }}>¡Tenemos Ganador!</h2>
            <p style={{ color: '#666', margin: '0 0 24px 0' }}>
              {ganadorInfo.rifaNombre}
            </p>

            <div
              style={{
                backgroundColor: '#f0f9ff',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                }}
              >
                {ganadorInfo.nombre}
              </p>
              <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                {ganadorInfo.email}
              </p>
              <p style={{ margin: '0', fontSize: '0.9rem' }}>
                🎟️ Boleto #{ganadorInfo.numeroBoleto}
              </p>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                }}
              >
                🏆 {ganadorInfo.premio}
              </p>
            </div>

            <button
              onClick={() => setGanadorInfo(null)}
              style={{
                padding: '10px 32px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setVista('rifas')}
          style={vista === 'rifas' ? tabActivo : tabInactivo}
        >
          📋 Mis Rifas
        </button>
        <button
          onClick={() => setVista('crear')}
          style={vista === 'crear' ? tabActivo : tabInactivo}
        >
          ➕ Crear Rifa
        </button>
        <button
          onClick={() => {
            setVista('ventas');
            cargarVentas();
          }}
          style={vista === 'ventas' ? tabActivo : tabInactivo}
        >
          💰 Ventas
        </button>
      </div>

      {/* === VIEW: LIST OF RIFAS === */}
      {vista === 'rifas' && (
        <div>
          {cargando ? (
            <p>Cargando rifas...</p>
          ) : rifas.length === 0 ? (
            <p>
              No hay rifas creadas.{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setVista('crear');
                }}
              >
                Crea tu primera rifa
              </a>
            </p>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {rifas.map((rifa) => {
                const vendidos =
                  rifa.boletos?.filter((b: any) => b.estado === 'vendido')
                    .length || 0;
                const total = rifa.boletos?.length || 0;
                const yaTieneSorteo =
                  rifa.ganadores && rifa.ganadores.length > 0;
                return (
                  <div
                    key={rifa.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                      }}
                    >
                      <div>
                        <h3 style={{ margin: '0 0 4px 0' }}>{rifa.nombre}</h3>
                        <p
                          style={{
                            margin: '0',
                            color: '#666',
                            fontSize: '0.85rem',
                          }}
                        >
                          {rifa.descripcion}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor:
                            rifa.estado === 'activa'
                              ? '#d4edda'
                              : rifa.estado === 'borrador'
                              ? '#fff3cd'
                              : rifa.estado === 'cerrada'
                              ? '#f8d7da'
                              : rifa.estado === 'finalizada'
                              ? '#cce5ff'
                              : '#e2e3e5',
                          color:
                            rifa.estado === 'activa'
                              ? '#155724'
                              : rifa.estado === 'borrador'
                              ? '#856404'
                              : rifa.estado === 'cerrada'
                              ? '#721c24'
                              : rifa.estado === 'finalizada'
                              ? '#004085'
                              : '#383d41',
                        }}
                      >
                        {rifa.estado.toUpperCase()}
                      </span>
                    </div>

                    <div
                      style={{
                        margin: '12px 0',
                        fontSize: '0.9rem',
                        color: '#444',
                      }}
                    >
                      <span>🎟️ ${rifa.precio_boleto} MXN</span>
                      <span style={{ margin: '0 12px' }}>|</span>
                      <span>
                        📊 {vendidos}/{total} vendidos
                      </span>
                      <span style={{ margin: '0 12px' }}>|</span>
                      <span>
                        🏆 {rifa.premios?.[0]?.nombre || 'Sin premio'}
                      </span>
                    </div>

                    {/* Action buttons based on current state */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      {rifa.estado === 'borrador' && (
                        <button
                          onClick={() => cambiarEstado(rifa.id, 'activa')}
                          style={btnVerde}
                        >
                          Activar
                        </button>
                      )}
                      {rifa.estado === 'activa' && (
                        <button
                          onClick={() => cambiarEstado(rifa.id, 'cerrada')}
                          style={btnRojo}
                        >
                          Cerrar Ventas
                        </button>
                      )}
                      {rifa.estado === 'cerrada' && !yaTieneSorteo && (
                        <>
                          <button
                            onClick={() => cambiarEstado(rifa.id, 'activa')}
                            style={btnVerde}
                          >
                            Reabrir
                          </button>
                          <button
                            onClick={() => ejecutarSorteo(rifa)}
                            disabled={ejecutandoSorteo || vendidos === 0}
                            style={{
                              ...btnAzul,
                              opacity:
                                ejecutandoSorteo || vendidos === 0 ? 0.5 : 1,
                              cursor:
                                ejecutandoSorteo || vendidos === 0
                                  ? 'not-allowed'
                                  : 'pointer',
                            }}
                          >
                            {ejecutandoSorteo
                              ? '🎲 Sorteando...'
                              : '🎲 Ejecutar Sorteo'}
                          </button>
                        </>
                      )}
                      {rifa.estado === 'finalizada' && (
                        <span
                          style={{
                            color: '#004085',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                          }}
                        >
                          ✅ Sorteo completado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === VIEW: CREATE RIFA === */}
      {vista === 'crear' && (
        <div style={{ maxWidth: '500px' }}>
          <form onSubmit={crearRifa}>
            <h3>Nueva Rifa</h3>

            <label style={labelStyle}>Nombre de la rifa</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Rifa Navideña 2026"
              required
              style={inputStyle}
            />

            <label style={labelStyle}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve de la rifa"
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            />

            <label style={labelStyle}>Precio por boleto (MXN)</label>
            <input
              type="number"
              value={precioBoleto}
              onChange={(e) => setPrecioBoleto(e.target.value)}
              placeholder="50"
              min="1"
              required
              style={inputStyle}
            />

            <label style={labelStyle}>Cantidad de boletos</label>
            <input
              type="number"
              value={cantidadBoletos}
              onChange={(e) => setCantidadBoletos(e.target.value)}
              placeholder="100"
              min="1"
              max="10000"
              required
              style={inputStyle}
            />

            <label style={labelStyle}>Fecha del sorteo</label>
            <input
              type="datetime-local"
              value={fechaEjecucion}
              onChange={(e) => setFechaEjecucion(e.target.value)}
              required
              style={inputStyle}
            />

            <h3 style={{ marginTop: '24px' }}>Premio Principal</h3>

            <label style={labelStyle}>Nombre del premio</label>
            <input
              type="text"
              value={premioNombre}
              onChange={(e) => setPremioNombre(e.target.value)}
              placeholder="Ej: Smart TV 55 pulgadas"
              required
              style={inputStyle}
            />

            <label style={labelStyle}>Valor estimado (MXN)</label>
            <input
              type="number"
              value={premioValor}
              onChange={(e) => setPremioValor(e.target.value)}
              placeholder="12000"
              min="1"
              required
              style={inputStyle}
            />

            {mensaje && (
              <p
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: mensaje.startsWith('✅')
                    ? '#d4edda'
                    : '#f8d7da',
                  color: mensaje.startsWith('✅') ? '#155724' : '#721c24',
                }}
              >
                {mensaje}
              </p>
            )}

            <button
              type="submit"
              disabled={guardando}
              style={{
                ...btnVerde,
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                marginTop: '8px',
              }}
            >
              {guardando ? 'Creando...' : 'Crear Rifa'}
            </button>
          </form>
        </div>
      )}

      {/* === VIEW: ALL SALES === */}
      {vista === 'ventas' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0 }}>Registro de Ventas</h3>
            {ventas.length > 0 && (
              <button onClick={exportarCSV} style={btnVerde}>
                📥 Exportar CSV
              </button>
            )}
          </div>

          {ventas.length === 0 ? (
            <p>No hay ventas registradas.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}
                >
                  <th style={thStyle}>Fecha</th>
                  <th style={thStyle}>Rifa</th>
                  <th style={thStyle}>Comprador</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Boletos</th>
                  <th style={thStyle}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>
                      {new Date(venta.fecha_venta).toLocaleDateString('es-MX')}
                    </td>
                    <td style={tdStyle}>{venta.rifas?.nombre}</td>
                    <td style={tdStyle}>
                      {venta.usuarios?.nombre} {venta.usuarios?.apellido}
                    </td>
                    <td style={tdStyle}>{venta.usuarios?.email}</td>
                    <td style={tdStyle}>{venta.cantidad_boletos}</td>
                    <td style={tdStyle}>${venta.monto_total} MXN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// Styles
const tabActivo: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
const tabInactivo: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: 'transparent',
  color: '#333',
  border: '1px solid #ddd',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: '16px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#444',
};
const btnVerde: React.CSSProperties = {
  padding: '6px 16px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
const btnRojo: React.CSSProperties = {
  padding: '6px 16px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
const btnAzul: React.CSSProperties = {
  padding: '6px 16px',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};
const thStyle: React.CSSProperties = { padding: '8px 12px' };
const tdStyle: React.CSSProperties = { padding: '8px 12px' };
