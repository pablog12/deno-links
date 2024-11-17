import { Router } from "./router.ts";
import {
  generateShortCode,
  getClickEvent,
  getShortLink,
  getUserLinks,
  incrementClickCount,
  storeShortLink,
  watchShortLink,
} from "./db.ts";
import { render } from "npm:preact-render-to-string";
import {
  CreateShortlinkPage,
  HomePage,
  LinksPage,
  NotFoundPage,
  ShortlinkViewPage,
} from "./ui.tsx";
import { handleGitHubOAuthCallback } from "./auth.ts";
import { createGitHubOAuthConfig, createHelpers } from "jsr:@deno/kv-oauth";
import { unauthorizedResponse } from "./lib.ts";
import { serveDir } from "@std/http";

const app = new Router();

// GitHub OAuth config
const oauthConfig = createGitHubOAuthConfig({
  redirectUri: Deno.env.get("GITHUB_REDIRECT_URI"),
});

// GitHub OAuth helpers
const {
  signIn,
  signOut,
} = createHelpers(oauthConfig);

// GitHub OAuth routes
app.get("/oauth/signin", (req: Request) => signIn(req));
app.get("/oauth/signout", signOut);
app.get("/oauth/callback", handleGitHubOAuthCallback);

// App routes
app.get("/", () =>
  new Response(render(HomePage({ user: app.currentUser })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  }));

app.get("/health-check", () => new Response("OK"));

app.get("/links", async () => {
  if (!app.currentUser) return unauthorizedResponse();

  const shortLinks = await getUserLinks(app.currentUser.login);
  console.log(shortLinks);

  return new Response(render(LinksPage({ shortLinkList: shortLinks })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

// Create a new short link
app.post("/links", async (req) => {
  if (!app.currentUser) return unauthorizedResponse();

  // Parse form data
  const formData = await req.formData();
  const longUrl = formData.get("longUrl") as string;

  if (!longUrl) {
    return new Response("Missing longUrl", { status: 400 });
  }

  const shortCode = await generateShortCode(longUrl);
  await storeShortLink(longUrl, shortCode, app.currentUser.login);

  // Redirect to the links list page after successful creation
  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/links",
    },
  });
});

app.get("/links/new", (_req) => {
  if (!app.currentUser) return unauthorizedResponse();

  return new Response(render(CreateShortlinkPage()), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

app.get("/links/:id", async (_req, _info, params) => {
  if (!app.currentUser) return unauthorizedResponse();

  const shortCode = params?.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode!);

  return new Response(render(ShortlinkViewPage({ shortLink })), {
    status: 200,
    headers: {
      "content-type": "text/html",
    },
  });
});

// Get a short link
app.get("/links/:shortCode", async (_req, _info, params) => {
  const shortCode = params?.pathname.groups.shortCode;
  const link = await getShortLink(shortCode!);
  return new Response(JSON.stringify(link), {
    status: 201,
    headers: {
      "content-type": "application/json",
    },
  });
});

app.get("/realtime/:id", (_req, _info, params) => {
  if (!app.currentUser) return unauthorizedResponse();
  const shortCode = params?.pathname.groups["id"];

  const stream = watchShortLink(shortCode!);

  const body = new ReadableStream({
    async start(controller) {
      while (true) {
        const { done } = await stream.read();
        if (done) {
          return;
        }

        const shortLink = await getShortLink(shortCode!);
        const clickAnalytics = shortLink?.clickCount! > 0 &&
          await getClickEvent(shortCode!, shortLink?.clickCount!);

        controller.enqueue(
          new TextEncoder().encode(
            `data: ${
              JSON.stringify({
                clickCount: shortLink?.clickCount,
                clickAnalytics,
              })
            }\n\n`,
          ),
        );
        console.log("Stream updated");
      }
    },
    cancel() {
      stream.cancel();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});

app.get("/:id", async (req, _info, params) => {
  const shortCode = params.pathname.groups["id"];
  const shortLink = await getShortLink(shortCode);

  if (shortLink) {
    // Capture analytics data
    const ipAddress = req.headers.get("x-forwarded-for") ||
      req.headers.get("cf-connecting-ip") || "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const country = req.headers.get("cf-ipcountry") || "Unknown";

    // Increment click count and store analytics data
    await incrementClickCount(shortCode, {
      ipAddress,
      userAgent,
      country,
    });

    // Redirect to the long URL
    return new Response(null, {
      status: 303,
      headers: {
        "Location": shortLink.longUrl,
      },
    });
  } else {
    // Render 404 page
    return new Response(render(NotFoundPage({ shortCode })), {
      status: 404,
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
});

// Static Assets
app.get("/static/*", (req) => serveDir(req));

export default {
  fetch(req) {
    return app.handler(req);
  },
} satisfies Deno.ServeDefaultExport;
