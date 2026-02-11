interface Boleto {
  id: string;
  numero: number;
  estado: string;
}

interface Props {
  boletos: Boleto[];
  precioBoleto: number;
  onContinuar: (boletosSeleccionados: Boleto[]) => void;
  onCerrar: () => void;
}

import { useState } from 'react';

export function SelectorBoletos({
  boletos,
  precioBoleto,
  onContinuar,
  onCerrar,
}: Props) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  const toggleBoleto = (id: string, estado: string) => {
    if (estado === 'vendido') return;

    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const boletosSeleccionados = boletos.filter((b) =>
    seleccionados.includes(b.id)
  );
  const total = boletosSeleccionados.length * precioBoleto;

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
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0 }}>Selecciona tus boletos</h2>
          <button
            onClick={onCerrar}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Grid de boletos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          {boletos.map((boleto) => {
            const vendido = boleto.estado === 'vendido';
            const seleccionado = seleccionados.includes(boleto.id);

            return (
              <button
                key={boleto.id}
                onClick={() => toggleBoleto(boleto.id, boleto.estado)}
                disabled={vendido}
                style={{
                  padding: '16px 8px',
                  border: '2px solid',
                  borderColor: vendido
                    ? '#ccc'
                    : seleccionado
                    ? '#2563eb'
                    : '#e0e0e0',
                  borderRadius: '8px',
                  backgroundColor: vendido
                    ? '#f5f5f5'
                    : seleccionado
                    ? '#dbeafe'
                    : 'white',
                  cursor: vendido ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  color: vendido ? '#999' : '#333',
                }}
              >
                {String(boleto.numero).padStart(2, '0')}
                {vendido && (
                  <div style={{ fontSize: '10px', color: '#999' }}>Vendido</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Leyenda */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#666',
          }}
        >
          <span>⬜ Disponible</span>
          <span>🟦 Seleccionado</span>
          <span>⬛ Vendido</span>
        </div>

        {/* Resumen */}
        <div
          style={{
            borderTop: '1px solid #e0e0e0',
            paddingTop: '16px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Boletos seleccionados:</strong>{' '}
            {boletosSeleccionados.length}
          </p>
          <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
            Total: ${total.toLocaleString()} MXN
          </p>
        </div>

        {/* Botón continuar */}
        <button
          onClick={() => onContinuar(boletosSeleccionados)}
          disabled={boletosSeleccionados.length === 0}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor:
              boletosSeleccionados.length === 0 ? '#ccc' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor:
              boletosSeleccionados.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {boletosSeleccionados.length === 0
            ? 'Selecciona al menos un boleto'
            : `Continuar al pago (${boletosSeleccionados.length} boleto${
                boletosSeleccionados.length > 1 ? 's' : ''
              })`}
        </button>
      </div>
    </div>
  );
}
