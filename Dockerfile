# ---- 第 1 阶段：安装依赖 ----
  FROM node:20-alpine AS deps

  # 启用 corepack 并激活 pnpm（Node20 默认提供 corepack）
  RUN corepack enable && corepack prepare pnpm@latest --activate
  
  WORKDIR /app
  
  # 仅复制依赖清单，提高构建缓存利用率
  COPY package.json pnpm-lock.yaml ./
  
  # 安装所有依赖（含 devDependencies，后续会裁剪）
  RUN pnpm install --frozen-lockfile
  
  # ---- 第 2 阶段：构建项目 ----
  FROM node:20-alpine AS builder
  WORKDIR /app
  
  # 把 deps 阶段已经准备好的 pnpm / corepack 环境拷过来（含 /usr/local/bin/pnpm）
  COPY --from=deps /usr/local /usr/local
  
  # 复制依赖和源码
  COPY --from=deps /app/node_modules ./node_modules
  COPY . .
  
  # 在构建阶段也显式设置 DOCKER_ENV 和 DOCKER_BUILD
  ENV DOCKER_ENV=true
  ENV DOCKER_BUILD=true
  
  # 弹弹play API 凭证（构建时注入，用于官方镜像开箱即用弹幕功能，可选）
  ARG DANDANPLAY_APP_ID
  ARG DANDANPLAY_APP_SECRET
  
  # 用 pnpm 构建（此时 pnpm 已从 deps 阶段拷过来，不再访问网络）
  RUN pnpm run build
  
  # ---- 第 3 阶段：运行时镜像 ----
  FROM node:20-alpine AS runner
  
  # 安装 FFmpeg，用于“FFmpeg 转存下载”
  RUN apk add --no-cache ffmpeg
  
  # 创建非 root 用户
  RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
  
  WORKDIR /app
  ENV NODE_ENV=production
  ENV HOSTNAME=0.0.0.0
  ENV PORT=3000
  ENV DOCKER_ENV=true
  
  # 弹弹play API 凭证（从构建阶段继承，支持开箱即用弹幕）
  ARG DANDANPLAY_APP_ID
  ARG DANDANPLAY_APP_SECRET
  ENV DANDANPLAY_APP_ID=${DANDANPLAY_APP_ID}
  ENV DANDANPLAY_APP_SECRET=${DANDANPLAY_APP_SECRET}
  
  # 从构建器中复制 standalone 输出
  COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
  COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
  COPY --from=builder --chown=nextjs:nodejs /app/start.js ./start.js
  COPY --from=builder --chown=nextjs:nodejs /app/public ./public
  COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
  
  USER nextjs
  EXPOSE 3000
  CMD ["node", "start.js"]