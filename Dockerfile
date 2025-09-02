# Dockerfile - eval-runner with enforced transparent Tor routing
FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive
USER root
# Install runtime deps + iptables-legacy
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      bash \
      ca-certificates \
      nodejs \
      npm \
      python3 \
      python3-pip \
      procps \
      inotify-tools \
      psmisc \
      lsof \
      rsync \
      curl \
      wget \
      iproute2 \
      iptables \
      iputils-ping \
      util-linux \
      && rm -rf /var/lib/apt/lists/*

# Install fast changing deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      gosu \
      && rm -rf /var/lib/apt/lists/*

# Force iptables-legacy
RUN update-alternatives --set iptables /usr/sbin/iptables-legacy && \
    update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy

# Create non-root user 'runner'
RUN useradd -ms /bin/bash runner


# Copy entrypoint script
COPY ./run-via-tor.sh /usr/local/bin/run-via-tor.sh
RUN chmod +x /usr/local/bin/run-via-tor.sh

# Entrypoint runs as root, applies iptables, then drops privileges
ENTRYPOINT ["/usr/local/bin/run-via-tor.sh"]
USER runner
WORKDIR /home/runner
CMD ["/bin/bash"]
