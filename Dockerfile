# ── Prism UI ── Dev Dockerfile ───────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json* ./
RUN npm install

# Source code is volume-mounted at runtime for HMR,
# but we copy it here as a fallback for non-compose usage.
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
