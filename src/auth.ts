import { createGitHubOAuthConfig, createHelpers } from "jsr:@deno/kv-oauth";
import { pick } from "jsr:@std/collections";
import { getUser, type GitHubUser, storeUser } from "./db.ts";

const oauthConfig = createGitHubOAuthConfig();
const { handleCallback, getSessionId } = createHelpers(oauthConfig);

export async function getCurrentUser(request: Request) {
  const sessionId = await getSessionId(request);
  console.log("sessionId", sessionId);
  return sessionId ? await getUser(sessionId) : null;
}

export async function getGitHubProfile(accessToken: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    response.body?.cancel();
    throw new Error("Failed to fetch GitHub user profile");
  }

  return await response.json() as Promise<GitHubUser>;
}

/**
 * Handle the GitHub OAuth callback
 * @param request - The request
 * @returns The response
 */
export async function handleGitHubOAuthCallback(request: Request) {
  const { response, tokens, sessionId } = await handleCallback(request);
  const userData = await getGitHubProfile(tokens?.accessToken);
  const filteredUserData = pick(userData, [
    "login",
    "html_url",
    "avatar_url",
  ]);
  await storeUser(sessionId, filteredUserData);
  return response;
}
