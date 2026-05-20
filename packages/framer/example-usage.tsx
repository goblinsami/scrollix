import { ScrollixCards } from './ScrollixCards'

export default function Example() {
  return (
    <ScrollixCards
      supabaseUrl="https://YOUR-PROJECT.supabase.co"
      supabaseAnonKey="YOUR_SUPABASE_ANON_KEY"
      runtimeScriptUrl="https://cdn.scrollix.app/scrollix-runtime.js"
    />
  )
}
