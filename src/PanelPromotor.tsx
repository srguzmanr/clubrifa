import { useEffect, useState } from 'react';
import { supabase } from './supabase';

interface Venta {
  id: string;
  fecha_venta: string;
  monto_total: number;
  detalle_ventas: { id: string }[];
}

export function PanelPromotor({
  vendedorId,
  onVolver,
}: {
  vendedorId: string;
  onVolver: () => void;
}) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      // Cargar info del vendedor
      const { data: vendedorData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', vendedorId)
        .single();

      setVendedor(vendedorData);

      // Cargar ventas del vendedor
      const { data: ventasData } = await supabase
        .from('ventas')
        .select(
          `
          id,
          fecha_venta,
          monto_total,
          detalle_ventas (id)
        `
        )
        .eq('id_vendedor', vendedorId)
        .order('fecha_venta', { ascending: false });

      setVentas(ventasData || []);
      setLoading(false);
    }

    cargarDatos();
  }, [vendedorId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Cargando panel...</p>
      </div>
    );
  }

  const totalVentas = ventas.length;
  const totalBoletos = ventas.reduce(
    (sum, v) => sum + v.detalle_ventas.length,
    0
  );
  const totalMonto = ventas.reduce((sum, v) => sum + Number(v.monto_total), 0);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>Panel de Promotor</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Bienvenido, {vendedor?.nombre} {vendedor?.apellido}
          </p>
        </div>
        <button
          onClick={onVolver}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ← Volver
        </button>
      </div>

      {/* Resumen */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '16px' }}>
          📊 Resumen
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#f0f9ff',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: '0 0 8px 0',
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              Ventas
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: '700',
                color: '#0369a1',
              }}
            >
              {totalVentas}
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#f0fdf4',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: '0 0 8px 0',
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              Boletos
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: '700',
                color: '#15803d',
              }}
            >
              {totalBoletos}
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#fefce8',
              padding: '20px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: '0 0 8px 0',
                color: '#666',
                fontSize: '0.875rem',
              }}
            >
              Monto Total
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '2rem',
                fontWeight: '700',
                color: '#a16207',
              }}
            >
              ${totalMonto.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div>
        <h2 style={{ fontSize: '1rem', color: '#666', marginBottom: '16px' }}>
          📋 Mis Ventas Recientes
        </h2>

        {ventas.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No tienes ventas registradas aún.
          </p>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {ventas.map((venta) => (
              <div
                key={venta.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
                    {venta.detalle_ventas.length} boleto(s)
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    {formatearFecha(venta.fecha_venta)}
                  </p>
                </div>
                <p style={{ margin: 0, fontWeight: '600', color: '#15803d' }}>
                  ${Number(venta.monto_total).toLocaleString()} MXN
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
