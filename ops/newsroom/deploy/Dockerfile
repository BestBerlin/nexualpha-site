# Runtime for the newsroom scheduler on BaoTa: Node 20 (same base as the Telegram stack) + psql for the CLI.
FROM node:20-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends postgresql-client ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Singapore NODE_ENV=production
WORKDIR /srv/newsroom/app
ENTRYPOINT ["bash", "/srv/newsroom/app/deploy/scheduler.sh"]
