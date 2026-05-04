import { Icon } from "./ui";

export function SafetyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="modal">
        <div className="modal-title">
          <div className="modal-icon">
            <Icon name="shield" />
          </div>
          <div>
            <h2 id="safety-title">Indicaciones de seguridad</h2>
            <p>Leé esto antes de usar la app.</p>
          </div>
        </div>

        <div className="modal-copy">
          <p>Esta herramienta es visual y educativa. No reemplaza una evaluación profesional.</p>
          <p>
            Detené el ejercicio si aparece mareo intenso, náuseas, visión doble, dolor cervical,
            dolor de cabeza fuerte, desorientación o molestias que no bajan al descansar.
          </p>
          <p>Comenzá con fondos simples, baja frecuencia y poca amplitud. Progresá gradualmente.</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-action" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="primary-action compact" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
