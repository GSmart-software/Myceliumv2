# Implementación independiente por rama

**Decisión** · vigente · consecuencia de [[Dos ramas en vez de monorepo]]

> [!danger] Regla de oro
> **No se migra código entre `web-cloud` y `desktop-tauri`.** Ni `merge`, ni
> `cherry-pick`, ni `rebase` entre las dos ramas principales. Cada versión se implementa
> de forma **independiente** para que puedan divergir sin pelear.

## Qué implica

- Una funcionalidad que va a las dos versiones se **implementa dos veces**, guiada por
  una **spec de comportamiento compartida** (misma UX, mismos criterios de aceptación).
- Los merges solo ocurren **rama de feature → su propia principal**:
  `feat/<slug>-desktop` → `desktop-tauri`, `feat/<slug>-web` → `web-cloud`.
- Llevar algo ya hecho de una a la otra es un proceso manual, archivo por archivo y
  **verificado**: [[Reflejar cambios de desktop a web]].

## Por qué

Las dos versiones comparten la UI pero **divergen en la capa de datos** (dispatcher
local con SQLite vs cliente HTTP contra .NET — ver [[Capa de datos del desktop]] y
[[Capa de datos de la web]]). Un merge arrastraría inevitablemente el archivo divergente
equivocado: el caso típico es `lib/api.ts`, que tiene el mismo nombre y contrato pero
implementaciones **opuestas**.

## Cómo se maneja en la práctica

1. **Clasificar** el archivo antes de tocarlo: ¿compartido o divergente?
   ```sh
   git diff --stat web-cloud desktop-tauri -- <archivo>
   ```
2. **Compartido** → se puede traer entero (`git checkout <rama> -- <archivo>`).
3. **Divergente** → se aplica a mano o con `git apply --3way`, resolviendo imports.
4. **Registrar** la divergencia nueva en [[RAMAS]] si un archivo antes compartido pasó a
   divergir. Esto pasó varias veces (la terminal hizo divergir `tabsStore`, `TabBar`,
   `EditorPane`, `Rail`, `SettingsDrawer`, `LeftPanel`…).

> [!warning] Mantener [[RAMAS]] al día no es burocracia
> Es lo que evita que el próximo reflejo pise una implementación. Cuando una
> funcionalidad solo-desktop toca archivos antes compartidos, **anotarlo**.

## Relacionadas

- [[Dos ramas en vez de monorepo]] — la decisión de la que se deriva.
- [[Reflejar cambios de desktop a web]] — el procedimiento permitido.
- [[Flujo de trabajo con subagentes]] — un agente por rama, nunca cruzando.
- [[RAMAS]] — inventario de divergencias.
