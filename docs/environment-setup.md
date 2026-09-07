# AEP Environment Setup

## Core Tools

- n8n — self-hosted using Docker
- ngrok — exposes local n8n webhooks for testing
- Supabase — AEP database
- Postman — API and webhook testing
- Node.js — JavaScript runtime
- Git / GitHub — version control

## Verified Connections

- n8n is accessible through the browser
- ngrok webhook routing works
- n8n can write to Supabase
- Postman can send POST requests to n8n webhooks
- Node.js is installed and working

## Secrets

Real credentials must never be committed to Git.

Use `.env` for local secrets.

Use `.env.example` to document required environment variables without exposing real values.
