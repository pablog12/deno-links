import { render } from "npm:preact-render-to-string";
import { UnauthorizedPage } from "./ui.tsx";

/**
 * Create an unauthorized response
 * @returns The unauthorized response
 */
export function unauthorizedResponse() {
    return new Response(render(UnauthorizedPage()), {
        status: 401,
        headers: {
            "content-type": "text/html",
        },
    });
}
