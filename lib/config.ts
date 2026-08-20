export type AppConfigStatus = {
  supabaseUrlConfigured: boolean;
  supabasePublishableKeyConfigured: boolean;
  supabaseReady: boolean;
  timezone: string;
};

export function getAppConfigStatus(): AppConfigStatus {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  return {
    supabaseUrlConfigured: Boolean(supabaseUrl && supabaseUrl.startsWith("https://")),
    supabasePublishableKeyConfigured: Boolean(publishableKey && publishableKey.length > 20),
    supabaseReady: Boolean(
      supabaseUrl &&
      supabaseUrl.startsWith("https://") &&
      publishableKey &&
      publishableKey.length > 20
    ),
    timezone: process.env.INSTITUTION_TIMEZONE || "America/Argentina/Buenos_Aires",
  };
}
