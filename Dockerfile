# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS base
ENV YARN_CACHE_FOLDER=/yarn-cache
WORKDIR /workspace
RUN corepack enable

FROM base AS dependencies
COPY package.json yarn.lock nx.json tsconfig.json .prettierrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/web-admin/package.json apps/web-admin/package.json
COPY apps/web-manager/package.json apps/web-manager/package.json
COPY apps/web-valet/package.json apps/web-valet/package.json
COPY libs/3d/package.json libs/3d/package.json
COPY libs/contracts/package.json libs/contracts/package.json
COPY libs/forms/package.json libs/forms/package.json
COPY libs/network/package.json libs/network/package.json
COPY libs/sample-lib/package.json libs/sample-lib/package.json
COPY libs/ui/package.json libs/ui/package.json
COPY libs/util/package.json libs/util/package.json
RUN --mount=type=cache,target=/yarn-cache yarn install --frozen-lockfile

FROM dependencies AS development
ENV NODE_ENV=development
COPY . .
CMD ["yarn", "workspace", "@autospace/api", "dev"]

FROM dependencies AS builder
ARG WORKSPACE
COPY . .
RUN test -n "$WORKSPACE"
RUN yarn workspace "$WORKSPACE" build

FROM node:20-bookworm-slim AS production
ARG WORKSPACE
ENV NODE_ENV=production
ENV WORKSPACE=$WORKSPACE
WORKDIR /workspace
RUN corepack enable \
    && groupadd --system --gid 1001 autospace \
    && useradd --system --uid 1001 --gid autospace autospace
COPY --from=builder --chown=autospace:autospace /workspace /workspace
USER autospace
CMD ["sh", "-c", "exec yarn workspace \"$WORKSPACE\" start"]
