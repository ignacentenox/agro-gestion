# Flujo Git Profesional (Cliente en Tiempo Real)

## Objetivo
Mantener un historial claro, auditable y entendible para el cliente, evitando commits ambiguos como "v3.0".

## Estrategia de ramas
- `main`: estable, siempre desplegable.
- `dev`: integración de features validadas.
- `feature/<modulo>-<detalle>`: nuevas funcionalidades.
- `fix/<modulo>-<detalle>`: correcciones de bugs.
- `hotfix/<modulo>-<detalle>`: urgencias sobre `main`.
- `chore/<detalle>`: tareas técnicas sin impacto funcional.
- `docs/<detalle>`: documentación.

## Ejemplos de nombres de rama
- `feature/auth-recuperar-sesion`
- `feature/facturas-importador-pdf`
- `fix/login-error-conexion-prisma7`
- `chore/prisma-adapter-pg-runtime`
- `docs/flujo-git-y-commits`

## Formato de commit (Conventional Commits)
Estructura:
`tipo(scope): resumen en imperativo`

Tipos permitidos:
- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `refactor`: mejora interna sin cambiar comportamiento
- `perf`: mejora de performance
- `docs`: cambios de documentación
- `test`: pruebas
- `chore`: mantenimiento técnico
- `build`: cambios de build/deps
- `ci`: cambios de CI/CD

Scopes sugeridos:
- `auth`, `login`, `api`, `dashboard`, `facturas`, `prisma`, `db`, `ui`, `scripts`, `docs`

## Ejemplos de commits buenos
- `feat(facturas): agregar filtro por rango de fechas`
- `fix(login): corregir error de conexion con prisma adapter pg`
- `refactor(api): separar validaciones de comprobantes`
- `chore(prisma): migrar inicializacion a adapter pg`
- `docs(workflow): definir convencion de ramas y commits`

## Plantilla recomendada de commit
Usar la plantilla en `.gitmessage.txt` para mantener consistencia.

## Checklist antes de push
- Rama correctamente nombrada.
- Commit describe una sola intención.
- No subir secretos ni `.env`.
- App compila y login funciona.
- Si aplica: migraciones + seed probados.

## Cadencia para mostrar progreso al cliente
- 1 commit por bloque funcional cerrado (15 a 45 min de trabajo).
- Push frecuente a rama de trabajo.
- PR hacia `dev` con resumen corto de valor de negocio.

## Flujo diario sugerido
1. Crear rama desde `dev`.
2. Implementar un bloque funcional.
3. Commit con formato estándar.
4. Push y actualizar PR.
5. Al finalizar, merge a `dev`.
6. Releases a `main` con tag semántico (`vX.Y.Z`).
