# OpenAgent + AgentOS Demo

This guide walks you through running OpenAgent with an [AgentOS](https://github.com/agno-agi/agno) backend. OpenAgent is a terminal interface that connects to AgentOS agents, providing a great user experience for interacting with AI agents from the command line.

## Prerequisites

- **Bun 1.3+** - [Install Bun](https://bun.sh)
- **Python 3.13+** - Required for the AgentOS example
- **uv** - Python package manager - [Install uv](https://docs.astral.sh/uv/getting-started/installation/)

## Quick Start

### 1. Clone and Install OpenAgent

```bash
git clone https://github.com/ajshedivy/openagent.git
cd openagent
bun install
```

### 2. Configure the AgentOS Provider

Create or update `opencode.json` in the project root with the AgentOS provider configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "agentos": {
      "name": "Agno AgentOS",
      "options": {
        "baseURL": "http://localhost:7777"
      }
    }
  }
}
```

### 3. Set Up the AgentOS Example

Navigate to the `agentos/` directory and set up the Python environment:

```bash
cd agentos
uv sync
```

Create a `.env` file with your Anthropic API key:

```bash
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
```

### 4. Start the AgentOS Server

From the `agentos/` directory, start the server:

```bash
uv run main.py
```

The AgentOS server will start on `http://localhost:7777`.

### 5. Run OpenAgent

In a new terminal, from the project root:

```bash
# Development mode
bun dev

# Or run the built binary
./packages/opencode/dist/opencode-darwin-arm64/bin/openagent
```

OpenAgent will connect to the AgentOS server and you can start interacting with the News Agent.

## Building OpenAgent Locally

To compile a standalone executable:

```bash
./packages/opencode/script/build.ts --single
```

Then run it:

```bash
./packages/opencode/dist/opencode-<platform>/bin/openagent
```

Replace `<platform>` with your platform (e.g., `darwin-arm64`, `linux-x64`).

## Example AgentOS Agent

The included example (`agentos/main.py`) creates a "News Agent" that can fetch top stories from Hacker News:

```python
from agno.os import AgentOS
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools import tool

@tool(requires_confirmation=True)
def get_top_hackernews_stories(num_stories: int) -> str:
    """Fetch top stories from Hacker News."""
    # ... implementation

web_agent = Agent(
    name="News Agent",
    model=Claude(id="claude-sonnet-4-5"),
    tools=[get_top_hackernews_stories],
    markdown=True,
)

agent_os = AgentOS(agents=[web_agent], enable_mcp_server=True)
app = agent_os.get_app()
```

Connect to the News Agent via the `/agno` command to open the AgentOS Hub:

![AgentOS Hub](docs/agentos-hub.png)

Try asking the agent: "What are the top 5 stories on Hacker News today?"

## Configuration Options

The `opencode.json` provider configuration supports:

| Option | Description | Default |
|--------|-------------|---------|
| `name` | Display name for the provider | Required |
| `options.baseURL` | AgentOS server URL | Required |

## Troubleshooting

### Connection Refused

If OpenAgent can't connect to AgentOS:

1. Verify the AgentOS server is running: `curl http://localhost:7777/health`
2. Check the `baseURL` in `opencode.json` matches the server address
3. Ensure no firewall is blocking the connection

### Missing API Key

If the AgentOS agent fails to respond:

1. Verify `.env` file exists in `agentos/` directory
2. Confirm `ANTHROPIC_API_KEY` is set with a valid key

## Learn More

- [AgentOS Documentation](https://docs.agno.com)
- [OpenAgent Repository](https://github.com/ajshedivy/openagent)
- [Contributing Guide](./CONTRIBUTING.md)
