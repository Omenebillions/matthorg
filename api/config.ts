function cleanEnvValue(value: string | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export default function handler(_req: any, res: any) {
  const supabaseUrl = cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const supabaseAnonKey = cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  );

  res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    hasSupabase: Boolean(supabaseUrl && supabaseAnonKey),
    hasR2: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY),
    hasGemini: Boolean(process.env.GEMINI_API_KEY),
    hasPaystack: Boolean(process.env.PAYSTACK_SECRET_KEY),
  });
}