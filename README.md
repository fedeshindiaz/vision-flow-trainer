# ONUr

Otoneuro Uruguay Rehabilitacion. App web React + Vite + TypeScript para entrenamiento vestibulo-visual con protocolos RVO x1, RVO x2, optocinetico, seguimiento suave y sacadas correctivas.

## Desarrollo

```bash
npm install
npm run dev
```

Verificaciones:

```bash
npm run build
npm run lint
npm test
```

## Google Cast real

ONUr incluye una arquitectura base de Google Cast real. No usa un flujo manual de abrir una URL en la TV. El sender web carga el Google Cast Web Sender SDK, muestra un boton `Transmitir` y usa un Custom Web Receiver para que la TV renderice el canvas fullscreen mientras el celular o PC queda como control remoto.

Archivos principales:

- `src/cast/CastProvider.tsx`: carga e inicializa el Web Sender SDK.
- `src/hooks/useCastSender.ts`: envia mensajes al receiver y sincroniza snapshots.
- `src/cast/castMessages.ts`: namespace, tipos y validacion defensiva.
- `src/components/CastButton.tsx`: boton Cast con `google-cast-launcher`.
- `src/pages/CastReceiver.tsx`: receiver fullscreen en `/cast-receiver`.
- `src/hooks/useExerciseSession.ts`: estado de ejercicio compartible entre UI local y Cast.

### Configuracion requerida

Para usar Cast real hace falta registrar un Custom Web Receiver en la Google Cast SDK Developer Console.

1. Deployar la app en HTTPS publico.
2. Verificar que `https://TU-DOMINIO/cast-receiver` abre la vista receiver.
3. Crear una Custom Receiver Application en la consola de Google Cast.
4. Usar como receiver URL: `https://TU-DOMINIO/cast-receiver`.
5. Copiar el Receiver Application ID.
6. Configurar la variable:

```bash
VITE_CAST_APP_ID=TU_RECEIVER_APPLICATION_ID
```

Sin `VITE_CAST_APP_ID`, la app sigue funcionando normal y el boton muestra `Cast no configurado`.

### Protocolo de mensajes

Namespace: `urn:x-cast:com.onur.visionflow`

Mensajes implementados:

- `INIT_STATE`
- `PATCH_STATE`
- `PLAY`
- `PAUSE`
- `RESET`
- `SKIP`
- `SET_PROTOCOL`
- `SET_BACKGROUND`
- `SET_OBJECTIVE`
- `SET_PARAMETER`
- `PING`
- `PONG`
- `RECEIVER_READY`
- `ERROR`

El sender manda estado completo al conectar, patches al cambiar parametros y snapshots cada 1 segundo durante una sesion activa. El receiver calcula el elapsed visual localmente desde `startedAt` y `accumulatedElapsedMs`, y renderiza solo la experiencia visual fullscreen.

### Limitaciones conocidas

- Requiere navegador compatible con Google Cast, principalmente Chrome.
- Requiere Chromecast, Google TV o Smart TV compatible con Cast.
- El Custom Web Receiver debe estar alojado en HTTPS y registrado en Google Cast SDK Developer Console.
- No todas las Smart TVs implementan Cast igual.
- AirPlay no esta cubierto por esta implementacion.

## Exclusiones intencionales

La app no agrega historial, sintomas, CSV, login, backend ni persistencia clinica de sesiones.
