import { createClient } from "npm:@supabase/supabase-js@2"

type StoryPayload = {
  projectId?: string
  type?: string
  config?: Record<string, unknown>
}

const TABLE = Deno.env.get("SCROLLIX_STORIES_TABLE")?.trim() || "stories"
const DEFAULT_FRAMER_DOMAINS = [
  "framer.com",
  "framer.app",
  "framercanvas.com",
  "framer.website",
]

const parseAllowedOrigins = () =>
  (Deno.env.get("SCROLLIX_ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

const isFramerOrigin = (origin: string) => {
  try {
    const parsed = new URL(origin)
    if (parsed.protocol !== "https:") return false

    const hostname = parsed.hostname.toLowerCase()
    return DEFAULT_FRAMER_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
  } catch {
    return false
  }
}

const resolveOrigin = (requestOrigin: string | null) => {
  const allowed = parseAllowedOrigins()
  if (requestOrigin) {
    if (isFramerOrigin(requestOrigin)) return requestOrigin
    if (allowed.includes(requestOrigin)) return requestOrigin
  }

  if (allowed.length > 0) return allowed[0]
  return "https://framer.com"
}

const corsHeaders = (requestOrigin: string | null) => ({
  "Access-Control-Allow-Origin": resolveOrigin(requestOrigin),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
  "Content-Type": "application/json",
})

const resolveServiceRoleKey = () => {
  const explicit = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (explicit) return explicit

  const raw = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    return parsed.default || Object.values(parsed)[0] || null
  } catch {
    return null
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")
const serviceRoleKey = resolveServiceRoleKey()

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or service role key in function environment")
}

const admin = createClient(supabaseUrl, serviceRoleKey)

const jsonResponse = (status: number, body: Record<string, unknown>, requestOrigin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(requestOrigin),
  })

Deno.serve(async (req) => {
  const origin = req.headers.get("origin")

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) })
  }

  try {
    const url = new URL(req.url)

    if (req.method === "GET") {
      const projectId = (url.searchParams.get("projectId") || "").trim()
      if (!projectId) {
        return jsonResponse(400, { error: "projectId is required" }, origin)
      }

      const { data, error } = await admin
        .from(TABLE)
        .select("id,type,config,content_json,updated_at")
        .eq("id", projectId)
        .maybeSingle()

      if (error) {
        return jsonResponse(500, { error: error.message }, origin)
      }

      if (!data) {
        return jsonResponse(404, { error: "Story not found" }, origin)
      }

      return jsonResponse(200, { story: data }, origin)
    }

    if (req.method === "POST") {
      const body = (await req.json()) as StoryPayload
      const projectId = (body.projectId || "").trim()
      const type = (body.type || "3d-stack-cards").trim()
      const config = body.config

      if (!config || typeof config !== "object") {
        return jsonResponse(400, { error: "config object is required" }, origin)
      }

      const row: Record<string, unknown> = {
        type,
        config,
        content_json: config,
        updated_at: new Date().toISOString(),
      }

      const fallbackUserId = Deno.env.get("SCROLLIX_DEFAULT_USER_ID")?.trim()
      if (fallbackUserId) {
        row.user_id = fallbackUserId
      }

      if (projectId) {
        row.id = projectId
      }

      const { data, error } = await admin
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("id")
        .single()

      if (error) {
        return jsonResponse(500, { error: error.message }, origin)
      }

      return jsonResponse(200, { projectId: data.id }, origin)
    }

    return jsonResponse(405, { error: "Method not allowed" }, origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return jsonResponse(500, { error: message }, origin)
  }
})
