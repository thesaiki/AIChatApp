# AIChatApp on Akamai LKE

This repository contains a deployable starter for the architecture described in [`akamai-agent-architecture.md`](/Users/sanair/Desktop/akamai-agent-architecture.md): a React chat frontend, a stateful Node.js/WebSocket backend, Kubernetes manifests for Akamai Linode Kubernetes Engine (LKE), and a GitHub Actions workflow that builds and deploys the stack.

The repo is intentionally split into two layers:

- Application layer: `frontend/` and `backend/`
- Platform layer: `infra/k8s/` and `.github/workflows/`

## What this deploys

- `frontend`: a simple React/Vite chat client
- `backend`: an Express + WebSocket service with health checks and placeholder agent loop wiring
- `ingress`: path-based routing for `/`, `/api`, and `/ws`
- `optional/vllm-gpu-deployment.yaml`: an optional self-hosted inference pod for a GPU node pool

## Prerequisites

You need these created outside this repository before the deployment workflow can succeed:

- An Akamai LKE cluster
- An Akamai API token with access to the LKE cluster
- A PostgreSQL connection string
- A Redis connection string
- A public DNS hostname pointed at your LKE ingress load balancer
- A GitHub repository with Actions enabled

## Required GitHub configuration

Create these repository secrets:

- `LINODE_TOKEN`: Akamai / Linode API token
- `LKE_CLUSTER_ID`: numeric cluster ID
- `POSTGRES_URL`: connection string for managed PostgreSQL
- `REDIS_URL`: connection string for managed Redis
- `SESSION_SECRET`: random secret for session signing
- `OBJECT_STORAGE_ACCESS_KEY`: Akamai Object Storage access key
- `OBJECT_STORAGE_SECRET_KEY`: Akamai Object Storage secret key

Optional secrets:

- `LLM_API_KEY`: if your backend talks to a private OpenAI-compatible endpoint
- `GHCR_PULL_USERNAME`: only needed if your GHCR packages remain private
- `GHCR_PULL_TOKEN`: only needed if your GHCR packages remain private

Create these repository variables:

- `APP_HOST`: DNS name for the app, for example `chat.example.com`
- `K8S_NAMESPACE`: defaults to `ai-chat` if omitted
- `OBJECT_STORAGE_BUCKET`: defaults to `ai-chat-archive` if omitted
- `OBJECT_STORAGE_ENDPOINT`: defaults to `https://us-east-1.linodeobjects.com` if omitted
- `LLM_BASE_URL`: defaults to `http://vllm-service.ai-chat.svc.cluster.local:8000/v1` if omitted

## Deployment flow

1. Push this repository to GitHub.
2. Add the required repository secrets and variables.
3. Run the `Deploy to Akamai LKE` workflow manually from the Actions tab.
4. GitHub Actions builds the frontend and backend images and pushes them to GHCR.
5. The workflow fetches the kubeconfig for your LKE cluster from the Akamai API.
6. The workflow creates or updates the Kubernetes namespace and runtime secrets.
7. The workflow renders the manifests in `infra/k8s/` with the current image tags and deploys them with `kubectl apply -k`.

## Local structure

```text
.
├── .github/workflows/deploy-lke.yml
├── backend/
├── frontend/
└── infra/k8s/
```

## Notes

- The `optional/` manifests are not included in the default `kustomization.yaml`. Apply them separately when your GPU node pool is ready.
- The starter backend is intentionally simple. It is the place to add Redis fan-out, PostgreSQL persistence, tool adapters, and the full LLM orchestration loop from the architecture doc.
