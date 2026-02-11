interface Premio {
  nombre: string;
  valor: number;
}

interface Boleto {
  estado: string;
}

interface Rifa {
  id: string;
  nombre: string;
  fecha_ejecucion: string;
  precio_boleto: number;
  premios: Premio[];
  boletos: Boleto[];
}

interface Props {
  rifa: Rifa;
  onComprar: () => void;
}

export function RifaCard({ rifa, onComprar }: Props) {
  const boletosVendidos = rifa.boletos.filter(
    (b) => b.estado === 'vendido'
  ).length;
  const totalBoletos = rifa.boletos.length;
  const porcentajeVendido = (boletosVendidos / totalBoletos) * 100;
  const mostrarUrgencia = porcentajeVendido >= 70;

  const premio = rifa.premios[0];

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '320px',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Nombre de la rifa */}
      <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>
        {rifa.nombre}
      </h2>

      {/* Premio */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ margin: '0', fontWeight: '600' }}>
          🎁 {premio?.nombre || 'Premio por anunciar'}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
          Valor estimado: ${premio?.valor?.toLocaleString() || 0} MXN
        </p>
      </div>

      {/* Fecha */}
      <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
        📅 {formatearFecha(rifa.fecha_ejecucion)}
      </p>

      {/* Indicador de participación */}
      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem' }}>
        {mostrarUrgencia ? (
          <span style={{ color: '#e53935', fontWeight: '600' }}>
            🎟️ ¡Solo quedan {totalBoletos - boletosVendidos} boletos!
          </span>
        ) : (
          <span>👥 {boletosVendidos} personas ya participan</span>
        )}
      </p>

      {/* Botón de compra */}
      <button
        onClick={onComprar}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        ${rifa.precio_boleto} MXN - Comprar boleto
      </button>
    </div>
  );
}
