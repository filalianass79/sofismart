# Import facture — OCR + Intelligence Artificielle

## Pipeline

```
Upload → OCR → Nettoyage → IA (OpenAI / Claude / Gemini) → Zod → Matching → Validation humaine
```

## Providers supportés

| Provider | `AI_PROVIDER` | Clé API | Modèle par défaut |
|----------|---------------|---------|-------------------|
| **OpenAI** | `openai` | `OPENAI_API_KEY` ou `AI_API_KEY` | `gpt-4o-mini` |
| **Claude** | `claude` | `ANTHROPIC_API_KEY` ou `AI_API_KEY` | `claude-3-5-haiku-latest` |
| **Gemini** | `gemini` | `GEMINI_API_KEY` ou `AI_API_KEY` | `gemini-2.0-flash` |

## Configuration production (Lightsail)

### 1. Activer automatiquement

```bash
cd /opt/sofismart
chmod +x scripts/enable-ai-production.sh
./scripts/enable-ai-production.sh openai   # ou claude | gemini
nano .env.production                       # ajouter la clé API
```

### 2. Variables `.env.production`

```env
AI_EXTRACTION_ENABLED=true
AI_PROVIDER=openai
AI_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0
AI_MAX_RUNS_PER_USER_PER_DAY=50
```

**Claude :**
```env
AI_PROVIDER=claude
AI_MODEL=claude-3-5-haiku-latest
ANTHROPIC_API_KEY=sk-ant-...
```

**Gemini :**
```env
AI_PROVIDER=gemini
AI_MODEL=gemini-2.0-flash
GEMINI_API_KEY=AIza...
```

### 3. Déployer

```bash
git pull
docker compose --env-file .env.production --profile migrate run --rm migrator npx prisma migrate deploy
docker compose --env-file .env.production up -d --build
```

### 4. Vérifier

```bash
curl -s http://127.0.0.1:3000/api/purchases/invoice-import/ai-config \
  -H "Cookie: <session>" | jq
```

Réponse attendue : `"enabled": true`, `"activeProvider": "openai"`.

## API

| Route | Description |
|-------|-------------|
| `GET /api/purchases/invoice-import/ai-config` | Providers disponibles + actif |
| `POST /api/purchases/invoice-import/:id/run-ai-extraction` | Relancer IA |

## Sécurité

- Clés API **uniquement** côté serveur (`.env.production`, jamais commitées)
- Limite `AI_MAX_RUNS_PER_USER_PER_DAY` par utilisateur
- Historique dans `InvoiceExtractionRun`
