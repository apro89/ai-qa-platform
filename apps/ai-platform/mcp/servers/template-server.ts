/**
 * Template MCP server module
 *
 * Copy this file to create a new MCP server implementation. Name the file
 * to match the service id (example: `repo-mcp.ts`) and export the expected
 * lifecycle or registration API so the application composition root can
 * discover and wire the server when needed.
 */

// Import the MCP SDK or adapter you use in production. This is a template
// and intentionally avoids runtime dependencies; replace with your SDK calls.
// import { MpcServer } from '@modelcontextprotocol/sdk'

export const SERVICE_ID = "template-mcp";

export interface ServerOptions {
  port?: number;
}

export function createServer(_opts: ServerOptions = {}) {
  // Replace this skeleton with real implementation using your MCP SDK.
  return {
    id: SERVICE_ID,
    async start() {
      // Initialize listeners, handlers, authorization, and register with MCP.
      console.log(`Starting MCP server: ${SERVICE_ID}`);
    },
    async stop() {
      // Clean up resources and unregister.
      console.log(`Stopping MCP server: ${SERVICE_ID}`);
    },
  };
}

export default createServer;
