# ONUr

Otoneuro Uruguay Rehabilitacion. App web React + Vite + TypeScript para entrenamiento vestibulo-visual con protocolos RVO x1, RVO x2, optocinetico, seguimiento suave y sacadas correctivas.

Nombre canonico del producto: **ONUr**. El repositorio historico puede aparecer como `vision-flow-trainer`, pero el paquete, UI, README y documentacion usan ONUr. El namespace Cast se mantiene como `urn:x-cast:com.onur.visionflow` por compatibilidad con el receiver ya registrado.

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

## Persistencia local

La app guarda en `localStorage` solo configuracion operativa: protocolo seleccionado, fondo, objetivo, frecuencia, amplitud, duracion, series, descanso, tamano de objetivo, separacion/tamano de franjas y metronomo. No guarda sesiones clinicas, historial, sintomas ni CSV. Al refrescar, la configuracion vuelve, pero la sesion arranca en estado `idle`.

## PWA

ONUr genera manifest y service worker con `vite-plugin-pwa`. En produccion puede instalarse en el dispositivo y servir assets cacheados para tolerar WiFi inestable. Para validar:

```bash
npm run build
npm run preview
```

Luego revisar en Chrome DevTools > Application que exista Manifest y Service Worker.

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

Flujo recomendado antes del registro:

1. Probar localmente que `http://localhost:5173/cast-receiver` abre la pantalla receiver.
2. Confirmar que esa pantalla muestra solo el canvas visual y un overlay minimo, sin paneles de configuracion.
3. Deployar la app en una URL publica HTTPS.
4. Abrir directamente `https://TU-DOMINIO/cast-receiver` y confirmar que no da 404.
5. Registrar esa URL como Custom Receiver en Google Cast SDK Developer Console.
6. Copiar el Receiver Application ID.
7. Configurar la variable:

```bash
VITE_CAST_APP_ID=TU_RECEIVER_APPLICATION_ID
```

8. Rebuild/redeployar la app para que el sender web use ese App ID.

Sin `VITE_CAST_APP_ID`, la app sigue funcionando normal y el boton muestra `Cast no configurado`.

Receiver URL a registrar:

```text
https://TU-DOMINIO/cast-receiver
```

En hosts de SPA, la ruta directa `/cast-receiver` debe servir `index.html`. Si el deploy devuelve 404 al abrir esa URL directamente, configurar fallback/rewrite a `index.html` antes de registrar el receiver. En Netlify suele hacerse con `_redirects` o `netlify.toml`; en Vercel, con rewrites si el preset no lo resuelve automaticamente.

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
