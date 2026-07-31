const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Load .env from the project root (two levels up from this file).
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  port: process.env.PORT || 3000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
};

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds the Supabase client from environment variables.
 * Throws a clear, actionable error if the env vars are missing or malformed
 * so we never boot against a silently broken IdP connection.
 */
function createSupabaseClient() {
  if (!env.supabaseUrl || !env.supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_KEY. Copy .env.example to .env and fill in your Supabase project values."
    );
  }
  if (!isValidHttpUrl(env.supabaseUrl)) {
    throw new Error(
      `SUPABASE_URL "${env.supabaseUrl}" is not a valid http(s) URL.`
    );
  }
  return createClient(env.supabaseUrl, env.supabaseKey);
}

const supabase = createSupabaseClient();

module.exports = { env, supabase, createSupabaseClient };
