# MCP Servers

This directory contains internal MCP server implementations that are exposed under a service identity.

Naming and placement:

- Use a kebab-case service id such as `repo-mcp` or `playwright-mcp`.
- Each server should live in its own file or folder and export a clear `start()`/`stop()` or registration function.

Template:

- See `template-server.ts` for a minimal skeleton showing how to implement and export a server module.

Deployment:

- Production MCP servers are independently deployed and authorized; this repository stores the server adapter implementations and allowlists.
