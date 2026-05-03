import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}

const ITEMS = [
  "Esta beta es una herramienta visual de entrenamiento/rehabilitación y no reemplaza la evaluación de un profesional de la salud.",
  "Detené el ejercicio si aparece mareo intenso, náuseas, dolor cervical, dolor de cabeza fuerte, visión doble, desorientación o síntomas que no bajan al descansar.",
  "Para progresar, la referencia práctica es que el punto se mantenga claro y que los síntomas sean tolerables.",
];

export function SafetyModal({ open, onAccept, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Indicaciones de seguridad</DialogTitle>
        </DialogHeader>
        <ul className="space-y-3 text-sm leading-relaxed">
          {ITEMS.map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button onClick={onAccept}>Aceptar indicaciones</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
