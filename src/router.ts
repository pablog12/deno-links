import { type Handler, type Route, route } from "jsr:@std/http";
import { getCurrentUser } from "./auth.ts";

export class Router {
  #routes: Route[] = []; // # means private array of routes

  currentUser?: GitHubUser | null = null;

  #addRoute(method: string, path: string, handler: Handler) {
    const pattern = new URLPattern({ pathname: path });
    this.#routes.push({
      pattern,
      method,
      handler: async (req, info, params) => {
        try {
          this.currentUser = await getCurrentUser(req);
          return await handler(req, info!, params!);
        } catch (error) {
          console.error(
            "Router Error: error handling request",
            error,
          );
          return new Response((error as Error).message, { status: 500 });
        }
      },
    });
  }

  get(path: string, handler: Handler) {
    this.#addRoute("GET", path, handler);
  }

  post(path: string, handler: Handler) {
    this.#addRoute("POST", path, handler);
  }

  put(path: string, handler: Handler) {
    this.#addRoute("PUT", path, handler);
  }

  delete(path: string, handler: Handler) {
    this.#addRoute("DELETE", path, handler);
  }

  get handler() {
    return route(
      this.#routes,
      (_req) => new Response("Not found", { status: 404 }),
    );
  }
}
