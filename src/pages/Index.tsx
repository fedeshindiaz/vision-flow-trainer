import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity, Download, Maximize2, Minimize2, Pause, Play, RotateCcw, Save, Shield, SkipForward, Trash2,
} from "lucide-react";

import {
  EXERCISES, PRESETS, HISTORY_KEY, MAX_HISTORY, SAFETY_KEY,
  buildRecommendation, safeGet, safeSet, toCSV,
} from "@/lib/rvo-types";
import type {
  BackgroundKey, ClarityKey, DotColor, ExerciseKey, HistoryRecord, SaccadeDirection, SessionState,
} from "@/lib/rvo-types";
import { ExerciseCanvas, type CanvasHandle } from "@/components/rvo/ExerciseCanvas";
import { ControlSlider } from "@/components/rvo/ControlSlider";
import { Metronome } from "@/components/rvo/Metronome";
import { ProgressRing } from "@/components/rvo/ProgressRing";
import { SafetyModal } from "@/components/rvo/SafetyModal";

const BG_OPTS: { value: BackgroundKey; label: string }[] = [
  { value: "plain", label: "Plano" },
  { value: "grid", label: "Grilla" },
  { value: "stripes", label: "Rayas" },
  { value: "busy", label: "Complejo" },
];
const COLOR_OPTS: { value: DotColor; label: string }[] = [
  { value: "red", label: "Rojo" },
  { value: "blue", label: "Azul" },
  { value: "black", label: "Negro" },
  { value: "white", label: "Blanco" },
];
const SAC_OPTS: { value: SaccadeDirection; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "diagonal", label: "Diagonal" },
  { value: "random", label: "Aleatoria" },
];

const Index = () => {
  // Config (state used for UI)
  const [exerciseKey, setExerciseKey] = useState<ExerciseKey>("vor_x2_horizontal");
  const [presetKey, setPresetKey] = useState<string>("base");
  const [frequency, setFrequency] = useState(0.8);
  const [amplitude, setAmplitude] = useState(35);
  const [duration, setDuration] = useState(40);
  const [dotSize, setDotSize] = useState(36);
  const [dotColor, setDotColor] = useState<DotColor>("red");
  const [background, setBackground] = useState<BackgroundKey>("grid");
  const [totalSets, setTotalSets] = useState(3);
  const [restDuration, setRestDuration] = useState(30);
  const [saccadeDirection, setSaccadeDirection] = useState<SaccadeDirection>("horizontal");

  // Symptoms
  const [symptomBefore, setSymptomBefore] = useState(0);
  const [symptomAfter, setSymptomAfter] = useState(0);
  const [clarity, setClarity] = useState<ClarityKey>("clear");

  // Session machine
  const [state, setState] = useState<SessionState>("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [elapsed, setElapsed] = useState(0); // seconds in current segment
  const elapsedRef = useRef(0);
  const segStartRef = useRef<number>(0); // performance.now anchor
  const segLenRef = useRef<number>(0); // total seconds for current segment
  const tickRef = useRef<number>(0);
  const stateRef = useRef<SessionState>("idle");
  stateRef.current = state;

  // History
  const [history, setHistory] = useState<HistoryRecord[]>(() => safeGet<HistoryRecord[]>(HISTORY_KEY, []));
  const [showSafety, setShowSafety] = useState<boolean>(() => !safeGet<boolean>(SAFETY_KEY, false));
  const [showDone, setShowDone] = useState(false);

  // Fullscreen
  const exerciseAreaRef = useRef<HTMLDivElement>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const exDef = EXERCISES[exerciseKey];
  const isLocked = state === "playing" || state === "paused" || state === "resting";

  // Apply preset
  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setPresetKey(key);
    setFrequency(p.frequency);
    setAmplitude(p.amplitude);
    setDuration(p.duration);
    setDotSize(p.dotSize);
    setTotalSets(p.totalSets);
    setRestDuration(p.restDuration);
    setBackground(p.background);
    toast.success(`Preset aplicado: ${p.label}`);
  };

  // Timer loop using rAF anchored to performance.now (no resets when changing freq/amp)
  const startTick = () => {
    cancelAnimationFrame(tickRef.current);
    const loop = () => {
      const now = performance.now();
      const e = (now - segStartRef.current) / 1000 + elapsedRef.current;
      const total = segLenRef.current;
      if (e >= total) {
        // segment complete
        const cur = stateRef.current;
        if (cur === "playing") {
          if (currentSetRef.current < totalSetsRef.current) {
            // go to rest
            setElapsed(0);
            elapsedRef.current = 0;
            segStartRef.current = performance.now();
            segLenRef.current = restDurationRef.current;
            setState("resting");
          } else {
            // done
            cancelAnimationFrame(tickRef.current);
            setElapsed(total);
            setState("done");
            setShowDone(true);
            return;
          }
        } else if (cur === "resting") {
          // start next set
          setCurrentSet((s) => s + 1);
          setElapsed(0);
          elapsedRef.current = 0;
          segStartRef.current = performance.now();
          segLenRef.current = durationRef.current;
          setState("playing");
        }
      } else {
        setElapsed(e);
      }
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);
  };

  // Refs that may change while running
  const durationRef = useRef(duration); durationRef.current = duration;
  const restDurationRef = useRef(restDuration); restDurationRef.current = restDuration;
  const totalSetsRef = useRef(totalSets); totalSetsRef.current = totalSets;
  const currentSetRef = useRef(currentSet); currentSetRef.current = currentSet;

  useEffect(() => () => cancelAnimationFrame(tickRef.current), []);

  // Main button
  const handleMain = () => {
    if (state === "idle") {
      setCurrentSet(1);
      currentSetRef.current = 1;
      elapsedRef.current = 0;
      setElapsed(0);
      segStartRef.current = performance.now();
      segLenRef.current = duration;
      setState("playing");
      startTick();
    } else if (state === "playing") {
      // pause: freeze elapsed
      cancelAnimationFrame(tickRef.current);
      elapsedRef.current = elapsed;
      setState("paused");
    } else if (state === "paused") {
      segStartRef.current = performance.now();
      // segLen unchanged, elapsedRef holds prior progress
      setState("playing");
      startTick();
    } else if (state === "resting") {
      // skip rest -> next set
      cancelAnimationFrame(tickRef.current);
      if (currentSet < totalSets) {
        setCurrentSet((s) => s + 1);
        currentSetRef.current = currentSet + 1;
      }
      elapsedRef.current = 0;
      setElapsed(0);
      segStartRef.current = performance.now();
      segLenRef.current = duration;
      setState("playing");
      startTick();
    } else if (state === "done") {
      handleReset();
    }
  };

  const handleReset = () => {
    cancelAnimationFrame(tickRef.current);
    setState("idle");
    setCurrentSet(1);
    setElapsed(0);
    elapsedRef.current = 0;
    setShowDone(false);
    requestAnimationFrame(() => canvasHandleRef.current?.recenter());
  };

  const mainLabel = useMemo(() => {
    switch (state) {
      case "idle": return "Iniciar";
      case "playing": return "Pausar";
      case "paused": return "Continuar";
      case "resting": return "Saltar descanso";
      case "done": return "Repetir";
    }
  }, [state]);

  const segTotal = state === "resting" ? restDuration : duration;
  const remaining = Math.max(0, segTotal - elapsed);
  const progress = segTotal > 0 ? Math.min(1, elapsed / segTotal) : 0;

  // Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && exerciseAreaRef.current) {
        await exerciseAreaRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("El navegador bloqueó el modo pantalla completa");
    }
  };

  // History
  const saveSession = () => {
    const rec: HistoryRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      exerciseKey,
      exerciseName: exDef.name,
      preset: presetKey,
      frequency, amplitude, duration, dotSize, dotColor,
      backgroundKey: background, totalSets, restDuration,
      saccadeMode: exerciseKey === "saccades" ? saccadeDirection : null,
      symptomBefore, symptomAfter, clarity,
      completed: true,
      recommendation: buildRecommendation(symptomAfter, clarity),
    };
    const next = [rec, ...history].slice(0, MAX_HISTORY);
    setHistory(next);
    safeSet(HISTORY_KEY, next);
    toast.success("Sesión guardada");
    setShowDone(false);
    handleReset();
  };

  const exportCSV = () => {
    if (history.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }
    const csv = toCSV(history);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "neurovisual-rvo-historial.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const clearHistory = () => {
    setHistory([]);
    safeSet(HISTORY_KEY, []);
    toast.success("Historial borrado");
  };

  const acceptSafety = () => {
    safeSet(SAFETY_KEY, true);
    setShowSafety(false);
    toast.success("Indicaciones aceptadas");
  };

  const recommendation = buildRecommendation(symptomAfter, clarity);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">NeuroVisual.RVO</h1>
              <p className="text-xs text-muted-foreground">Entrenamiento vestíbulo-visual · beta</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">{exDef.name}</Badge>
            <Button size="sm" variant="outline" onClick={() => setShowSafety(true)}>
              <Shield className="mr-1 h-4 w-4" /> Seguridad
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[380px_1fr]">
        {/* SIDEBAR */}
        <aside className="space-y-4">
          <Card className="space-y-4 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ejercicio</label>
              <Select value={exerciseKey} onValueChange={(v) => setExerciseKey(v as ExerciseKey)} disabled={isLocked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(EXERCISES).map((e) => (
                    <SelectItem key={e.key} value={e.key}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Preset</label>
              <Select value={presetKey} onValueChange={applyPreset} disabled={isLocked}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(PRESETS).map((p) => (
                    <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ControlSlider label="Velocidad" value={frequency} min={0.2} max={3} step={0.1} unit="Hz"
              onChange={(v) => setFrequency(Number(v.toFixed(1)))} />
            <ControlSlider label="Amplitud" value={amplitude} min={10} max={80} step={5} unit="%"
              onChange={setAmplitude} />
            <ControlSlider label="Duración por serie" value={duration} min={10} max={180} step={5} unit="s"
              disabled={isLocked} onChange={setDuration} />
            <ControlSlider label="Tamaño del punto" value={dotSize} min={10} max={80} step={5} unit="px"
              onChange={setDotSize} />
            <ControlSlider label="Series" value={totalSets} min={1} max={8} step={1}
              disabled={isLocked} onChange={setTotalSets} />
            <ControlSlider label="Descanso" value={restDuration} min={10} max={120} step={5} unit="s"
              disabled={isLocked} onChange={setRestDuration} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fondo</label>
                <Select value={background} onValueChange={(v) => setBackground(v as BackgroundKey)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BG_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Color</label>
                <Select value={dotColor} onValueChange={(v) => setDotColor(v as DotColor)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {exerciseKey === "saccades" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Dirección de sacadas</label>
                <Select value={saccadeDirection} onValueChange={(v) => setSaccadeDirection(v as SaccadeDirection)}
                  disabled={isLocked}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SAC_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              {Array.from({ length: totalSets }).map((_, i) => {
                const idx = i + 1;
                const isCur = idx === currentSet && state !== "idle";
                const isDone = idx < currentSet || state === "done";
                return (
                  <span key={i}
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-xs font-semibold ${
                      isDone ? "border-accent bg-accent/10 text-accent"
                      : isCur ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-muted-foreground"
                    }`}>
                    {idx}
                  </span>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" size="lg" onClick={handleMain}
                variant={state === "playing" ? "secondary" : "default"}>
                {state === "playing" ? <Pause className="mr-1 h-4 w-4" />
                  : state === "resting" ? <SkipForward className="mr-1 h-4 w-4" />
                  : <Play className="mr-1 h-4 w-4" />}
                {mainLabel}
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset} title="Reiniciar">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={toggleFullscreen} title="Pantalla completa">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <h2 className="text-sm font-bold">Síntomas</h2>
            <ControlSlider label="Mareo antes (0–10)" value={symptomBefore} min={0} max={10} step={1}
              onChange={setSymptomBefore} />
            <ControlSlider label="Mareo después (0–10)" value={symptomAfter} min={0} max={10} step={1}
              onChange={setSymptomAfter} />
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Claridad visual</label>
              <Select value={clarity} onValueChange={(v) => setClarity(v as ClarityKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">El punto se mantuvo claro</SelectItem>
                  <SelectItem value="blurry">El punto se volvió borroso</SelectItem>
                  <SelectItem value="lost">Perdí el punto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border border-dashed bg-secondary/40 p-2 text-xs text-muted-foreground">
              {recommendation}
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Historial ({history.length})</h2>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={exportCSV} title="Exportar CSV">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={clearHistory} title="Borrar historial">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {history.length === 0 && (
                <p className="text-xs text-muted-foreground">Aún no hay sesiones guardadas.</p>
              )}
              {history.slice(0, 5).map((r) => (
                <div key={r.id} className="rounded-md border bg-secondary/30 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.exerciseName}</span>
                    <span className="text-muted-foreground">
                      {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {r.frequency} Hz · {r.amplitude}% · {r.totalSets}×{r.duration}s · mareo {r.symptomBefore}→{r.symptomAfter}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* EXERCISE AREA */}
        <section
          ref={exerciseAreaRef}
          className="relative flex min-h-[60vh] flex-col overflow-hidden rounded-xl border bg-card lg:min-h-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-card/80 px-4 py-2 backdrop-blur">
            <div className="flex items-center gap-3">
              <ProgressRing
                value={progress}
                size={64}
                stroke={6}
                label={`${Math.ceil(remaining)}s`}
                sub={state === "resting" ? "descanso" : `serie ${currentSet}/${totalSets}`}
              />
              <div>
                <p className="text-sm font-semibold">{exDef.cue}</p>
                <p className="text-xs text-muted-foreground">{exDef.instruction}</p>
              </div>
            </div>
            {exDef.hasMetronome && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Metrónomo</span>
                <Metronome frequency={frequency} active={state === "playing"} />
              </div>
            )}
          </div>

          <div className="relative flex-1">
            {state === "resting" ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-secondary/40 p-6 text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Descanso</p>
                <p className="text-6xl font-bold tabular-nums">{Math.ceil(remaining)}s</p>
                <p className="text-sm">Próxima serie: {Math.min(currentSet + 1, totalSets)} de {totalSets}</p>
                <Button onClick={handleMain}><SkipForward className="mr-1 h-4 w-4" /> Saltar descanso</Button>
              </div>
            ) : (
              <ExerciseCanvas
                ref={canvasHandleRef}
                params={{
                  mode: exDef.mode,
                  axis: exDef.axis,
                  saccadeDirection,
                  frequency,
                  amplitude,
                  dotSize,
                  dotColor,
                  background,
                  running: state === "playing",
                }}
              />
            )}
          </div>

          {/* Bottom progress bar */}
          <div className="h-1.5 w-full bg-border">
            <div
              className="h-full bg-accent transition-[width] duration-200"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </section>
      </main>

      <SafetyModal
        open={showSafety}
        onAccept={acceptSafety}
        onClose={() => setShowSafety(false)}
      />

      <Dialog open={showDone} onOpenChange={setShowDone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesión completada</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Completaste {totalSets} {totalSets === 1 ? "serie" : "series"} de {exDef.name}.</p>
            <p className="text-muted-foreground">
              Recordá completar tus síntomas en el panel lateral antes de guardar.
            </p>
            <div className="rounded-md border bg-secondary/40 p-3 text-xs">{recommendation}</div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowDone(false); handleReset(); }}>
              Nueva sesión
            </Button>
            <Button onClick={saveSession}>
              <Save className="mr-1 h-4 w-4" /> Guardar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
