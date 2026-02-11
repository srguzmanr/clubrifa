import { useState } from 'react';
import { supabase } from './supabase';

interface Boleto {
  id: string;
  numero: number;
}

interface Props {
  boletos: Boleto[];
  precioBoleto: number;
  rifaId: string;
  rifaNombre: string;
  compradorId: string;
  onExito: () => void;
  onCerrar: () => void;
}

export function PantallaPago({
  boletos,
  precioBoleto,
  rifaId,
  rifaNombre,
  compradorId,
  onExito,
  onCerrar,
}: Props) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const total = boletos.length * precioBoleto;

  const procesarPago = async () => {
    setProcesando(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: venta, error: errorVenta } = await supabase
        .from('ventas')
        .insert({
          id_comprador: compradorId,
          metodo_pago: 'tarjeta',
          monto_total: total,
          stripe_payment_id: 'sim_' + Date.now(),
        })
        .select()
        .single();

      if (errorVenta) throw errorVenta;

      const detalles = boletos.map((boleto) => ({
        id_venta: venta.id,
        id_boleto: boleto.id,
      }));

      const { error: errorDetalle } = await supabase
        .from('detalle_ventas')
        .insert(detalles);

      if (errorDetalle) throw errorDetalle;

      const { error: errorBoletos } = await supabase
        .from('boletos')
        .update({ estado: 'vendido', id_comprador: compradorId })
        .in(
          'id',
          boletos.map((b) => b.id)
        );

      if (errorBoletos) throw errorBoletos;

      setExito(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  if (exito) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ margin: '0 0 16px 0' }}>Compra exitosa</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Compraste {boletos.length} boleto(s) para {rifaNombre}
          </p>
          <p style={{ marginBottom: '24px' }}>
            <strong>Tus numeros:</strong>{' '}
            {boletos.map((b) => b.numero).join(', ')}
          </p>
          <button
            onClick={onExito}
            style={{
              padding: '12px 32px',
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
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0 }}>Confirmar compra</h2>
          <button
            onClick={onCerrar}
            disabled={procesando}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: procesando ? 'not-allowed' : 'pointer',
            }}
          >
            x
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#f9fafb',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>{rifaNombre}</strong>
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            Boletos:{' '}
            {boletos.map((b) => String(b.numero).padStart(2, '0')).join(', ')}
          </p>
          <p style={{ margin: '0', fontSize: '1.25rem', fontWeight: '600' }}>
            Total: ${total.toLocaleString()} MXN
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={procesarPago}
          disabled={procesando}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: procesando ? '#93c5fd' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: procesando ? 'not-allowed' : 'pointer',
          }}
        >
          {procesando
            ? 'Procesando pago...'
            : 'Pagar $' + total.toLocaleString() + ' MXN'}
        </button>

        <p
          style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
            marginTop: '16px',
          }}
        >
          Pago simulado para demostracion
        </p>
      </div>
    </div>
  );
}
