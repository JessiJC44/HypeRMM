// Central configuration for agent release URLs.
// GitHub Releases is the default, free, and fully supported distribution channel.
// If you ever move binaries to a different host (Cloudflare R2, S3, self-hosted CDN),
// set AGENT_RELEASE_URL_BASE environment variable to override this default.
export const AGENT_RELEASES_BASE =
  process.env.AGENT_RELEASE_URL_BASE ||
  "https://github.com/JessiJC44/HypeRMM/releases/latest/download";
