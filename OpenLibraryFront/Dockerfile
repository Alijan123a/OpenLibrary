FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:8002
ARG NEXT_PUBLIC_LOGIN_API=http://localhost:8002/api/login/
ARG NEXT_PUBLIC_CHECK_ROLE=http://localhost:8002/api/user-role/
ARG NEXT_PUBLIC_QR_SERVICE_URL=http://localhost:8001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_LOGIN_API=$NEXT_PUBLIC_LOGIN_API
ENV NEXT_PUBLIC_CHECK_ROLE=$NEXT_PUBLIC_CHECK_ROLE
ENV NEXT_PUBLIC_QR_SERVICE_URL=$NEXT_PUBLIC_QR_SERVICE_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
