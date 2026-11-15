# easycms.dev on a server of its own (README.md, Deploying). Build on the server's architecture
# (arm64 for the Hetzner CAX server): the SQLite and image libraries are native.
#
#   docker build -t easy-cms-website .

FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# A branch, tag or commit of maritonx/easy-cms for the docs; empty: the latest release.
ARG DOCS_REF=""
ENV DOCS_REF=${DOCS_REF}
# prebuild brings the docs from maritonx/easy-cms (content/docs, public/screenshots) and builds the
# search index; the build needs no database, since every page reads it on request.
RUN pnpm build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/cms.db
# The whole app, not Next's standalone output: pages read content/docs and the OG fonts from disk
# at request time, and `easy-cms migrate` runs before the server starts.
COPY --from=build --chown=node:node /app /app
RUN mkdir -p /app/data /app/uploads && chown node:node /app/data /app/uploads
USER node
EXPOSE 3000
# Apply new migrations, then serve. The database and uploads live in volumes.
CMD ["sh", "-c", "node node_modules/easy-cms/bin/easy-cms.js migrate && exec node_modules/.bin/next start"]
