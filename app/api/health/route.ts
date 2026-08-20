import { getAppConfigStatus } from "../../../lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = getAppConfigStatus();

  return Response.json({
    ok: true,
    service: "turnero-uade",
    timestamp: new Date().toISOString(),
    configuration: {
      supabaseUrlConfigured: config.supabaseUrlConfigured,
      supabasePublishableKeyConfigured: config.supabasePublishableKeyConfigured,
      supabaseReady: config.supabaseReady,
      timezone: config.timezone,
    },
    nextStep: config.supabaseReady
      ? "supabase-connectivity-test"
      : "configure-vercel-environment-variables",
  });
}
