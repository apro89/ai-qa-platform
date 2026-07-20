# Running Phase 5 Demo with LLM Providers

This guide explains how to run the Phase 5 demo with different LLM providers: **OpenAI** (cloud-based, requires API key) or **Ollama** (local, free, no API key required).

## Quick Start

### Option A: Ollama (Recommended for Testing - Free & Local)

**1. Install Ollama**

- Download from: https://ollama.ai
- Install and run the application

**2. Start Ollama Server**

In a terminal, start Ollama:

```bash
ollama serve
```

**3. In Another Terminal, Pull a Model**

```bash
# Fast & recommended
ollama pull mistral

# Or try other models:
ollama pull llama2          # Meta's LLaMA model
ollama pull neural-chat     # Intel's chat-optimized model
ollama pull dolphin-mixtral # Powerful mixture of experts
ollama pull orca-mini       # Smaller and faster
```

**4. Run the Demo with Ollama**

```bash
cd apps/ai-platform

# Set Ollama as the provider
export LLM_PROVIDER=ollama
export OLLAMA_MODEL=mistral

# Run the demo
npm run phase5:demo
```

---

### Option B: OpenAI (Cloud-Based, Requires API Key & Payment)

**1. Get an OpenAI API Key**

1. Go to: https://platform.openai.com/account/api-keys
2. Sign in with your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**2. Run the Demo with OpenAI**

```bash
cd apps/ai-platform

# Set your API key
export OPENAI_API_KEY=sk-your-actual-key-here
export OPENAI_MODEL=gpt-4o

# Run the demo
npm run phase5:demo
```

---

## Using Environment Files (.env)

Instead of setting environment variables manually each time, you can create a `.env` file.

### Create a `.env` File

In the `apps/ai-platform/` directory, create a file called `.env`:

```bash
cd apps/ai-platform
touch .env
```

### For Ollama Setup

Add this to your `.env` file:

```env
# LLM Provider Configuration
LLM_PROVIDER=ollama
OLLAMA_MODEL=mistral
OLLAMA_BASE_URL=http://localhost:11434
```

**Available Ollama Models:**

```env
OLLAMA_MODEL=mistral          # Fast & recommended
OLLAMA_MODEL=llama2           # Meta's LLaMA 2
OLLAMA_MODEL=neural-chat      # Intel's chat model
OLLAMA_MODEL=dolphin-mixtral  # Powerful mixture
OLLAMA_MODEL=orca-mini        # Smaller/faster
```

### For OpenAI Setup

Add this to your `.env` file:

```env
# LLM Provider Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o
```

**Available OpenAI Models:**

```env
OPENAI_MODEL=gpt-4o           # Latest & most capable
OPENAI_MODEL=gpt-4            # Previous version
OPENAI_MODEL=gpt-3.5-turbo    # Faster & cheaper (if available)
```

### Load Environment Variables

**Option 1: Using a Package (Recommended)**

Install `dotenv`:

```bash
npm install dotenv
```

Then in `phase5-demo.ts`, add at the very top:

```typescript
import 'dotenv/config';
```

**Option 2: Manual Load**

Before running the demo:

```bash
# macOS/Linux
source .env
npm run phase5:demo

# Windows (PowerShell)
$env:PSISE = $null
Get-Content .env | ForEach-Object {
    $key, $value = $_ -split '=', 2
    if ($key -and -not $_.StartsWith('#')) {
        [Environment]::SetEnvironmentVariable($key, $value)
    }
}
npm run phase5:demo
```

**Option 3: Using `direnv` (Advanced)**

```bash
# Install direnv
# macOS: brew install direnv
# Then rename .env to .envrc
mv .env .envrc
direnv allow
```

---

## .gitignore Setup

**Important:** Never commit your `.env` file with real API keys to version control!

Add to `.gitignore` in the project root:

```bash
# Environment variables
.env
.env.local
.env.*.local
.envrc
```

---

## Configuration Reference

### Ollama Configuration

```env
# Provider selection
LLM_PROVIDER=ollama

# Model to use (must be pulled first with 'ollama pull')
OLLAMA_MODEL=mistral

# Ollama server URL (default: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434
```

### OpenAI Configuration

```env
# Provider selection
LLM_PROVIDER=openai

# Your OpenAI API key
OPENAI_API_KEY=sk-your-key

# Model to use
OPENAI_MODEL=gpt-4o

# Optional: Custom base URL
# OPENAI_BASE_URL=https://api.openai.com/v1
```

---

## Running the Demo

### With .env File (Easiest)

```bash
cd apps/ai-platform
npm run phase5:demo
```

The demo will automatically load settings from `.env`.

### Without .env File (Manual)

**Ollama:**

```bash
cd apps/ai-platform
export LLM_PROVIDER=ollama
export OLLAMA_MODEL=mistral
npm run phase5:demo
```

**OpenAI:**

```bash
cd apps/ai-platform
export OPENAI_API_KEY=sk-your-key
export OPENAI_MODEL=gpt-4o
npm run phase5:demo
```

---

## Troubleshooting

### Ollama Connection Issues

**Error:** `Cannot connect to Ollama at http://localhost:11434`

**Solution:**

1. Make sure Ollama is running: `ollama serve`
2. Check the URL is correct: `http://localhost:11434`
3. Verify the model is pulled: `ollama list`

### OpenAI Authentication Issues

**Error:** `Authentication failed: Incorrect API key provided`

**Solution:**

1. Verify your API key is correct: https://platform.openai.com/account/api-keys
2. Check for extra spaces in your key
3. Ensure billing is enabled on your account

### Rate Limiting

**Error:** `You exceeded your current quota`

**Solution:**

- Check your OpenAI billing: https://platform.openai.com/account/billing/overview
- Add a payment method if needed
- Consider using Ollama instead (free, local)

---

## Examples

### Example 1: Run with Ollama (Mistral Model)

```bash
cd apps/ai-platform

# Create .env file
cat > .env << EOF
LLM_PROVIDER=ollama
OLLAMA_MODEL=mistral
EOF

# Make sure Ollama is running
ollama serve  # In another terminal

# Run the demo
npm run phase5:demo
```

### Example 2: Run with OpenAI (GPT-4)

```bash
cd apps/ai-platform

# Create .env file with your real API key
cat > .env << EOF
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key
OPENAI_MODEL=gpt-4o
EOF

# Run the demo
npm run phase5:demo
```

### Example 3: Switch Between Providers

```bash
cd apps/ai-platform

# Edit .env and change the provider
# LLM_PROVIDER=ollama   # or openai
# Then run
npm run phase5:demo
```

---

## Environment Variable Details

### LLM_PROVIDER

- **Type:** `string`
- **Values:** `ollama` or `openai`
- **Default:** `openai`
- **Description:** Which LLM provider to use

### OLLAMA_MODEL

- **Type:** `string`
- **Examples:** `mistral`, `llama2`, `neural-chat`, `dolphin-mixtral`, `orca-mini`
- **Default:** `mistral`
- **Description:** Which Ollama model to use (must be pulled first)

### OLLAMA_BASE_URL

- **Type:** `string`
- **Default:** `http://localhost:11434`
- **Description:** URL where Ollama server is running

### OPENAI_API_KEY

- **Type:** `string` (secret)
- **Description:** Your OpenAI API key (starts with `sk-`)
- **⚠️ Important:** Never commit this to version control

### OPENAI_MODEL

- **Type:** `string`
- **Examples:** `gpt-4o`, `gpt-4`, `gpt-3.5-turbo`
- **Default:** `gpt-4o`
- **Description:** Which OpenAI model to use

---

## Next Steps

1. **Choose a Provider:**
   - Use **Ollama** if you want free, local testing
   - Use **OpenAI** if you need cutting-edge capabilities

2. **Set Up Environment:**
   - Create `.env` file with your configuration
   - Add `.env` to `.gitignore`

3. **Run the Demo:**

   ```bash
   cd apps/ai-platform
   npm run phase5:demo
   ```

4. **Verify Integration:**
   - Check the logs for successful provider initialization
   - Look for the response from the LLM provider
   - Review token usage and timing information

---

## Architecture

Both providers implement the same `ILLMProvider` interface:

```
ILLMProvider (interface)
├─ OpenAIProvider (cloud-based)
└─ OllamaProvider (local, free)
```

This means you can switch providers without changing any business logic code!

---

## Support

- **Ollama Issues?** Visit: https://ollama.ai
- **OpenAI Issues?** Visit: https://platform.openai.com/docs
- **Project Issues?** Check the Phase 5 documentation: `docs/ai-platform/PHASE_5_LLM_PROVIDER_LAYER.md`
