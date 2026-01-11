/**
 * API Key validation for webhook endpoints
 *
 * API keys are stored in environment variables and validated on each request.
 * Each key is associated with a source name for logging/tracking.
 */

interface ApiKeyValidation {
  valid: boolean;
  source?: string;
}

const API_KEYS: Record<string, string | undefined> = {
  askconciergeai: process.env.CRM_API_KEY_ASKCONCIERGE,
  zapier: process.env.CRM_API_KEY_ZAPIER,
};

/**
 * Validates an API key from the Authorization header
 * Expected format: "Bearer <api_key>"
 */
export function validateApiKey(request: Request): ApiKeyValidation {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false };
  }

  const key = authHeader.slice(7); // Remove "Bearer " prefix

  for (const [source, validKey] of Object.entries(API_KEYS)) {
    if (validKey && key === validKey) {
      return { valid: true, source };
    }
  }

  return { valid: false };
}

/**
 * Middleware-style function to validate API key and return error response if invalid
 */
export function requireApiKey(request: Request): { error?: Response; source?: string } {
  const { valid, source } = validateApiKey(request);

  if (!valid) {
    return {
      error: new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid or missing API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { source };
}
