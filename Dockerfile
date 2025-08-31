# Dockerfile - eval-runner with enforced transparent Tor routing (single file)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install packages needed for runtime, iptables, and helpers
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

# Create non-root user 'runner'
RUN useradd -ms /bin/bash runner

# Create embedded entrypoint script (no separate files)
RUN cat > /usr/local/bin/run-via-tor.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Defaults (can override with ENV at runtime)
TOR_HOST="${TOR_HOST:-tor-router}"
TOR_SOCKS_PORT="${TOR_SOCKS_PORT:-9050}"
TOR_TRANSPROXY_PORT="${TOR_TRANSPROXY_PORT:-9040}"
NONROOT_USER="runner"

echo "[eval-runner] starting entrypoint: forcing TCP via Tor (host=${TOR_HOST} trans=${TOR_TRANSPROXY_PORT})"

# Must be root to manipulate iptables
if [ "$(id -u)" -ne 0 ]; then
  echo "[eval-runner] ERROR: entrypoint must run as root to setup iptables (run container with --cap-add=NET_ADMIN)"
  exec "$@"
fi

# Resolve tor IP (fallback to localhost if unresolved)
TOR_IP="$(getent hosts "$TOR_HOST" 2>/dev/null | awk '{print $1}' || true)"
if [ -z "$TOR_IP" ]; then
  TOR_IP="127.0.0.1"
fi
echo "[eval-runner] resolved TOR_IP=$TOR_IP"

# Try find a 'tor' process in THIS network namespace (if sharing with tor container)
TOR_PID="$(pgrep -x tor || true)"
TOR_UID=""
if [ -n "$TOR_PID" ] && [ -r "/proc/$TOR_PID/status" ]; then
  TOR_UID=$(awk '/^Uid:/{print $2}' /proc/"$TOR_PID"/status || true)
  echo "[eval-runner] found tor PID=${TOR_PID} UID=${TOR_UID} - will exclude it from redirection"
fi

# Turn on forwarding just in case
sysctl -w net.ipv4.ip_forward=1 >/dev/null || true

# Flush previous rules (clean start)
iptables -F
iptables -t nat -F
iptables -t mangle -F
iptables -X || true

# Allow loopback
iptables -t nat -A OUTPUT -o lo -j RETURN
iptables -A OUTPUT -o lo -j ACCEPT

# Allow direct connections to the Tor control ports / socks / transpport (so we don't redirect to tor itself)
iptables -t nat -A OUTPUT -d "$TOR_IP" -p tcp --dport "$TOR_SOCKS_PORT" -j RETURN
iptables -A OUTPUT -d "$TOR_IP" -p tcp --dport "$TOR_SOCKS_PORT" -j ACCEPT
iptables -t nat -A OUTPUT -d "$TOR_IP" -p tcp --dport "$TOR_TRANSPROXY_PORT" -j RETURN
iptables -A OUTPUT -d "$TOR_IP" -p tcp --dport "$TOR_TRANSPROXY_PORT" -j ACCEPT

# If we detected the tor process UID in this namespace, exclude that UID from NAT redirection
if [ -n "$TOR_UID" ]; then
  # owner match is only valid in nat OUTPUT for local processes
  iptables -t nat -A OUTPUT -m owner --uid-owner "$TOR_UID" -j RETURN || true
fi

# Redirect all other TCP OUTPUT -> to Tor's TransPort
# If Tor is local (127.0.0.1) or likely bound to localhost in shared ns, use REDIRECT;
# otherwise use DNAT to the remote Tor IP:TransPort.
if [ "$TOR_IP" = "127.0.0.1" ] || [ "$TOR_IP" = "0.0.0.0" ]; then
  echo "[eval-runner] using REDIRECT to local port $TOR_TRANSPROXY_PORT"
  iptables -t nat -A OUTPUT -p tcp -m tcp --dport 1:65535 -j REDIRECT --to-ports "$TOR_TRANSPROXY_PORT"
else
  echo "[eval-runner] using DNAT to $TOR_IP:$TOR_TRANSPROXY_PORT"
  iptables -t nat -A OUTPUT -p tcp -j DNAT --to-destination "${TOR_IP}:${TOR_TRANSPROXY_PORT}"
fi

# Block UDP to prevent accidental leaks (change if you want explicit DNS tunneling)
iptables -A OUTPUT -p udp -j REJECT

echo "[eval-runner] iptables rules applied — all TCP will go through Tor (or be rejected if UDP)."

# Drop privileges and exec the requested command as non-root 'runner'
if [ $# -eq 0 ]; then
  echo "[eval-runner] no command given — dropping to an interactive shell as '${NONROOT_USER}'"
  exec setpriv --reuid="${NONROOT_USER}" --regid="${NONROOT_USER}" --clear-groups --login /bin/bash
else
  echo "[eval-runner] executing as '${NONROOT_USER}': $*"
  exec setpriv --reuid="${NONROOT_USER}" --regid="${NONROOT_USER}" --clear-groups -- "$@"
fi
EOF

# Make entrypoint executable
RUN chmod +x /usr/local/bin/run-via-tor.sh

# Ensure script runs as PID1 (root) so it can set iptables, then drops privileges internally
ENTRYPOINT ["/usr/local/bin/run-via-tor.sh"]
CMD ["/bin/bash"]
