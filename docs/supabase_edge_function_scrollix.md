# Scrollix Edge Function (Supabase)

## 1) Prerrequisitos

```powershell
npx supabase --version
npx supabase login
npx supabase link --project-ref <TU_PROJECT_REF>
```

## 2) Archivos creados en este repo

- `supabase/config.toml`
- `supabase/functions/scrollix-story/index.ts`

Esta funcion expone:
- `GET /functions/v1/scrollix-story?projectId=<id>`
- `POST /functions/v1/scrollix-story`

## 3) Configurar secretos/variables

### Opcion minima (recomendada para empezar)

```powershell
npx supabase secrets set SCROLLIX_STORIES_TABLE=stories
```

La funcion ya permite automaticamente origenes Framer:
- `*.framercanvas.com`
- `*.framer.app`
- `*.framer.com`
- `*.framer.website`

Si quieres permitir origenes extra, agrega:

```powershell
npx supabase secrets set SCROLLIX_ALLOWED_ORIGINS=https://mi-dashboard.com,https://staging.mi-dashboard.com
```

Si tu tabla exige `user_id NOT NULL`, agrega tambien:

```powershell
npx supabase secrets set SCROLLIX_DEFAULT_USER_ID=<UUID_DE_USUARIO_EXISTENTE>
```

## 4) Deploy de la funcion

```powershell
npx supabase functions deploy scrollix-story
```

URL final:

```text
https://<TU_PROJECT_REF>.supabase.co/functions/v1/scrollix-story
```

## 5) Pruebas rapidas

### Crear/actualizar story

```powershell
curl -X POST "https://<TU_PROJECT_REF>.supabase.co/functions/v1/scrollix-story" `
  -H "Content-Type: application/json" `
  -d '{"type":"3d-stack-cards","config":{"cards":[],"settings":{}}}'
```

### Leer story

```powershell
curl "https://<TU_PROJECT_REF>.supabase.co/functions/v1/scrollix-story?projectId=<ID_DEVUELTO>"
```

## 6) Conectar Framer

En Framer usa solo la URL de la funcion para `GET/POST`.
No uses `sb_secret` ni `service_role` en Framer.
