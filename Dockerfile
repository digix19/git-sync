FROM oven/bun:1.3-debian

# Install Node.js 22, git, curl, ca-certificates, and system Chromium
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    chromium \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright OS dependencies for Chromium
RUN npx playwright install-deps chromium || true

# Ensure a non-root developer user with UID 1000 exists
RUN if id -u 1000 >/dev/null 2>&1; then \
      existing=$(id -nu 1000); \
      if [ "$existing" != "developer" ]; then \
        usermod -l developer "$existing" 2>/dev/null || true; \
        mkdir -p /home/developer; \
        chown -R developer:$(id -g 1000) /home/developer; \
      fi; \
    else \
      useradd -ms /bin/bash -u 1000 developer; \
    fi
USER developer

# Set working directory
WORKDIR /workspace

# Keep the container alive for dev container attach
CMD ["sleep", "infinity"]
