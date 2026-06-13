Roadmap general — Micelio (migración al stack de las HUs)

Contexto

El repo actual es un prototipo vanilla (HTML + CSS + JS, sin build, sin backend): árbol de archivos vía File System Access API, editor <textarea>, splitpanes, grafo en canvas y render markdown básico. Las 39 HUs de HUs.md describen un producto distinto: frontend Next.js/React + CodeMirror 6 + unified/rehype + Yjs, backend .NET 9 con Cloudflare D1/R2/Durable Objects.

Decisión del usuario: migrar al stack de las HUs, pero sin integración Cloudflare por ahora. El backend gestiona todo localmente (SQLite + disco) detrás de puertos con dependency injection (ID1Client, IBlobStorage, selección por config Storage:Provider), de modo que enchufar Cloudflare después sea solo agregar adaptadores. Esto es exactamente el patrón que las HU-39 y HU-04 ya especifican.

El entregable de este plan es eo, orden de fases, dependenciasentre épicas y qué se porta del prototipo. No es el plan detallado de una HU individual (eso se
hace por ciclo, HU por HU).

---
Estructura objetivo del repo

Mycelium/
├── frontend/                  ypeScript
│   ├── app/(workspace)/page.tsx     # grid 4 col × 2 filas (DESIGN_SYSTEM)
│   ├── app/(auth)/login, regissword, reset-password
│   ├── components/            # rail, topbar, explorer, editor, panes, settings
│   ├── stores/                panelLayoutStore, tabsStore...
│   ├── lib/                   # api client, indexeddb, markdown pipeline
│   └── styles/tokens.css      w + semánticos)
├── backend/                   # .NET 9 minimal API
│   ├── src/Micelio.Api/
│   │   ├── Ports/             # ID1Client, IBlobStorage (futuro: ICollabRelay)
│   │   ├── Adapters/Local/    iskBlobStorage, LocalDbInitializer
│   │   ├── Adapters/Cloudflare/ # D1Client, R2BlobStorage (stubs hasta integrar)
│   │   ├── Features/          as, papelera, búsqueda,preferencias
│   │   └── appsettings.Develop=local, Jwt:Secret dev
│   └── migrations/local/local_schema.sql
├── docs/
│   ├── DESIGN_SYSTEM.md       # mover el actual aquí (las HUs lo referencian en docs/)
│   └── FUTURE_IMPLEMENTATIONS.ote, pinning, persistencia de tabs
├── legacy/                    # (opcional) prototipo vanilla actual, como referencia
└── HUs.md

Qué se porta del prototipo: la ed (js/graph.js) como base paraHU-30 (mini-grafo D3/canvas) y el grafo global del rail; conceptos del parser de wikilinks
(js/markdown.js). El resto (pane sobre React/CodeMirror — portarlo costaría más que rehacerlo.

Colores: el prototipo usa un tema oscuro bioluminiscente (verde-cian sobre azul profundo) que
difiere de los tokens claros deutorizó adaptar colores; se respeta la arquitectura de tokens de 2 capas y se calibran los valores al armar tokens.css (Fase 1),
verificando contraste en las 4

---
Fases del roadmap

El orden respeta dependencias: backend local primero (todo lo demás persiste contra él), shell
después (todo lo visual vive de colaboración al final (única épica con dependencia dura de Cloudflare).

Fase 0 — Re-fundación del repo (sin HU)

- Scaffold frontend/ (Next.js 15 + TS + Zustand + Lucide React) y backend/ (.NET 9).
- Mover DESIGN_SYSTEM.md → docsTATIONS.md, mover prototipo alegacy/.
- styles/tokens.css con tokens miniscencia/cantarela, dark mode,tipografía (Geist Sans, Source Serif 4, JetBrains Mono) y métricas — todo según DESIGN_SYSTEM.

Fase 1 — Backend local + autenticación

- HU-39 Proveedor local conmutable: ID1Client, LocalSqliteD1Client, LocalDbInitializer +
local_schema.sql (usuarios, vautas, papelera, notas_fts FTS5),seed de usuario pre-verificado, Storage:Provider.
- HU-32 Registro/login (JWT 15 cal el e-mail de verificación seomite vía seed/flag).
- HU-33 Vault personal privado

Fase 2 — Shell del workspace

- HU-38 AppTopbar (logo, búsqueCompartir deshabilitado, avatar).
- HU-28 Rail de íconos (dos grupos, patrón ::before, toggle de paneles).
- HU-29 Paneles laterales colaplLayoutStore).
- HU-20 Navegación SPA sin recarga (/workspace?note={id}, botón Atrás).

Fase 3 — Explorer y gestión de archivos

- HU-22 Carpetas anidadas (crear/renombrar/eliminar, persistencia expandido).
- HU-23 Notas: crear/renombrar/a de papelera del rail).
- HU-24 Drag & drop de notas y carpetas (dnd-kit).

Fase 4 — Editor núcleo

- HU-01 CodeMirror 6 + live preview por línea (decoraciones inline), modos live/split/read/raw,
pipeline unified/rehype.
- HU-02 Barra de formato + selector de modo (íconos Lucide, atajos Ctrl+B/I/K, Ctrl+1–4).
- HU-04 Autoguardado: IndexedDB0 s vía IBlobStorage (adaptadorLocalDiskBlobStorage), dot de estado en el tab, cola offline.
- HU-19 Cache de notas reciente

Fase 5 — Pestañas y multi-pane

- HU-25 Tab bar por pane (abrirrl+Shift+T).
- HU-26 Splits por drag de pestaña a bordes, anidados, divisores ajustables.
- HU-27 Pane vinculado como pre
- HU-31 Búsqueda/reemplazo en la nota activa (Ctrl+F + barra del topbar).

Fase 6 — Render extendido y diagramas

- HU-03 Tablas, callouts, KaTeX, footnotes, highlight de código, checkboxes.
- HU-18 Mermaid en el pipeline
- HU-16/HU-17 Excalidraw embebido (@excalidraw/excalidraw) + export PNG/SVG.

Fase 7 — Búsqueda global y grafo

- HU-21 Full-text FTS5 (índice ya creado en Fase 1) + panel de búsqueda del rail.
- HU-30 Panel derecho: mini-gras), salientes, retroenlaces,metadatos.

Fase 8 — Temas y preferencias

- HU-12 Selector de tema + dark mode (persistencia en backend).
- HU-34 Perfil y preferencias (ync de preferencias).
- HU-14 Tipografía configurable. HU-13/HU-15 CSS personalizado + import/export (guardado vía
IBlobStorage).

Fase 9 — Import/Export

- HU-07 Importar .md (drag & drult Obsidian.
- HU-08 Exportar .md (cliente). HU-09 Exportar ZIP (JSZip; rama servidor ≥200 MB diferida).
- HU-10 Exportar PDF (Puppeteer

Fase 10 — Compartición y colabo

- HU-35/HU-36 Compartir carpetas (membresias en D1 local — sindependencia Cloudflare).
- HU-05/HU-06/HU-37 Edición simelay se define como puertoICollabRelay con adaptador local (WebSocket en el backend .NET) y futuro adaptador Durable
Objects. Si se prefiere, esta sración Cloudflare.

---
Decisiones de arquitectura clave

1. Patrón de puertos (HU-39/HU-04): todo acceso a datos/blobs pasa por ID1Client / IBlobStorage
registrados por DI según Storage). Los adaptadores Cloudflare secrean como proyectos/clases desde el día 1 (aunque vacíos) para que el contrato quede fijado.
2. Envelope D1: LocalSqliteD1Clue D1 ({results, success, meta})para que repositorios/mappers sean idénticos en ambos modos.
3. Email en local: sin Resend;  y/o flag de auto-verificación enmodo local.
4. Colaboración: nuevo puerto Ien HUs, extensión natural delpatrón) para no acoplar Yjs a Durable Objects.
5. Base local desechable: micele/blobs/ se borran para resetearestado.

Verificación (por fase)

- Backend: dotnet run con Storage:Provider=local; login con el usuario seed vía curl/frontend;
borrar micelio.local.db y veriftente.
- Frontend: npm run dev con NEXT_PUBLIC_API_URL=http://localhost:5279; verificar cada CA de la
HU implementada manualmente en CAs muy concretos que sirven dechecklist).
- Regla transversal: todo compo4 combinaciones tema × dark y sinconexión (IndexedDB) donde aplique.

Próximo paso tras aprobar el roadmap

Ejecutar Fase 0 (re-fundación) y luego planificar en detalle Fase 1 / HU-39, que es la primera HU implementable.