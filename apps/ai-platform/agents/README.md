# Agent boundary

Each agent owns planning and tool decisions only. It invokes application services through typed interfaces, never writes directly to Git, Jira, Azure DevOps, or the filesystem.
