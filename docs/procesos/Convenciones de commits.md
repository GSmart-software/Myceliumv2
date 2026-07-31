# Convenciones de commits

## Formato

`tipo(area): descripción` — **en español**, imperativo, descripción concreta.

```
feat(terminal): terminal nativa integrada estilo VS Code [FUN-L-07]
fix(explorador): la decisión de drop sigue al puntero, no al ghost [DEF-023 parte 2]
docs(backlog): consolidar y eliminar FUTURE_IMPLEMENTATIONS.md
```

- **Referenciá el ID** del bug o funcionalidad entre corchetes (`[DEF-023]`,
  `[FUN-L-07]`) — ver [[bugs-progreso]] y [[BACKLOG]].
- En el cuerpo, explicá **la causa raíz** cuando sea un fix, no solo el cambio. Los
  commits de este repo son parte de la memoria del proyecto.

> [!danger] Ningún commit debe atribuirse a una IA
> Prohibido el trailer `Co-Authored-By: Claude …` y cualquier mención que sugiera que
> una IA participó. **Todos los commits figuran como del propio usuario.** Es una
> convención explícita y firme (registrada en [[CLAUDE]] y en el commit `239d9d6`).

## Alcance de un commit

- Un commit por unidad coherente. Los cambios de una funcionalidad + su spec + la
  actualización del checklist pueden ir juntos.
- El commit de **desktop** y el de **web** de la misma funcionalidad son
  **independientes** (ver [[Reflejar cambios de desktop a web]]): mensajes
  equivalentes, adaptando el cuerpo si la implementación difiere.

## Ramas

- Rama activa por defecto: **`desktop-tauri`**. Mantener el árbol limpio entre
  funcionalidades.
- Trabajo no trivial: rama de feature (`feat/<slug>-desktop`, `feat/<slug>-web`) e
  integración con `merge --no-ff` a su rama principal. Ver
  [[Flujo de trabajo con subagentes]].
- **Nunca** fusionar `web-cloud` con `desktop-tauri` — ver
  [[Implementacion independiente por rama]].

## Remoto

> [!warning] Nada de `push` sin confirmación explícita del usuario
> Tampoco borrar ramas remotas. `origin` está desalineado a propósito: tiene
> `desktop-cloud`, `main` y `deploy/cloudflare`; los renombres se hicieron **en local**.
> Los comandos para alinearlo están anotados en [[RAMAS]], pendientes de decisión.

## Relacionadas

- [[Verificar antes de integrar]] — qué debe estar verde antes de commitear.
- [[Flujo de trabajo con subagentes]] — quién commitea qué.
- [[RAMAS]] — estado de las ramas local y remoto.
- [[Mapa de documentacion]] — índice general.
