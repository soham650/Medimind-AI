import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { specialist } = await req.json()
    
    // Fetch matching doctors from public.profiles
    const { data: doctors, error } = await supabaseClient
      .from('profiles')
      .select('id, name, specialist, email, mobile, clinic_id, clinics(name, location, rating)')
      .eq('role', 'doctor')
      .ilike('specialist', `%${specialist || 'General Physician'}%`)
      .limit(5)

    if (error) throw error

    return new Response(
      JSON.stringify({ doctors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
