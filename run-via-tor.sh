#!/usr/bin/env bash
set -euo pipefail

# Simple, robust entrypoint to force TCP through Tor (TransPort).
# - prefers iptables-legacy if present
# - avoids touching mangle if it's not available
# - tolerates harmless failures when flushing

echo "[eval-runner] whoami: $(whoami)"
cat /etc/os-release 2>/dev/null || true

# Defaults (override via env)
TOR_HOST="${TOR_HOST:-tor-router}"
TOR_SOCKS_PORT="${TOR_SOCKS_PORT:-9050}"      # socks usually 9050
TOR_TRANSPROXY_PORT="${TOR_TRANSPROXY_PORT:-9040}"
TOR_CONTROL_PORT="${TOR_CONTROL_PORT:-9051}"
NONROOT_USER="${NONROOT_USER:-runner}"

# choose iptables binary (prefer legacy if available)
if command -v iptables-legacy >/dev/null 2>&1; then
  IPTABLES_CMD="iptables-legacy"
elif command -v iptables >/dev/null 2>&1; then
  IPTABLES_CMD="iptables"
else
  echo "[eval-runner] ERROR: no iptables binary found inside the container"
  exit 1
fi

echo "[eval-runner] using iptables binary: ${IPTABLES_CMD}"

# Must be root to manipulate iptables
if [ "$(id -u)" -ne 0 ]; then
  echo "[eval-runner] ERROR: entrypoint must run as root to setup iptables (start container with --cap-add=NET_ADMIN)"
  exec "$@"
fi

# Resolve TOR_IP (fallback to localhost)
TOR_IP="$(getent hosts "$TOR_HOST" 2>/dev/null | awk '{print $1}' || true)"
if [ -z "$TOR_IP" ]; then
  TOR_IP="127.0.0.1"
fi
echo "[eval-runner] resolved TOR_IP=${TOR_IP}"

# If a 'tor' process exists in this network namespace, capture its UID so we can exclude it
TOR_PID="$(pgrep -x tor || true)"
TOR_UID=""
if [ -n "$TOR_PID" ] && [ -r "/proc/$TOR_PID/status" ]; then
  TOR_UID=$(awk '/^Uid:/{print $2}' /proc/"$TOR_PID"/status || true)
  echo "[eval-runner] found tor PID=${TOR_PID} UID=${TOR_UID} - will exclude it from redirection"
fi

# Flush rules (ignore harmless failures)
echo "[eval-runner] flushing iptables (ignoring unsupported tables/errors)"
# general flush
$IPTABLES_CMD -F 2>/dev/null || true
$IPTABLES_CMD -t nat -F 2>/dev/null || true
# only flush mangle if it exists and is usable
if $IPTABLES_CMD -t mangle -L >/dev/null 2>&1; then
  $IPTABLES_CMD -t mangle -F 2>/dev/null || true
fi
$IPTABLES_CMD -X 2>/dev/null || true

# Allow loopback
$IPTABLES_CMD -t nat -A OUTPUT -o lo -j RETURN 2>/dev/null || true
$IPTABLES_CMD -A OUTPUT -o lo -j ACCEPT 2>/dev/null || true

# Allow direct connections to Tor's ports (so we don't redirect Tor -> Tor)
$IPTABLES_CMD -t nat -A OUTPUT -d "${TOR_IP}" -p tcp --dport "${TOR_SOCKS_PORT}" -j RETURN 2>/dev/null || true
$IPTABLES_CMD -A OUTPUT -d "${TOR_IP}" -p tcp --dport "${TOR_SOCKS_PORT}" -j ACCEPT 2>/dev/null || true
$IPTABLES_CMD -t nat -A OUTPUT -d "${TOR_IP}" -p tcp --dport "${TOR_TRANSPROXY_PORT}" -j RETURN 2>/dev/null || true
$IPTABLES_CMD -A OUTPUT -d "${TOR_IP}" -p tcp --dport "${TOR_TRANSPROXY_PORT}" -j ACCEPT 2>/dev/null || true
# control port (if you want to allow control connections)
$IPTABLES_CMD -t nat -A OUTPUT -d "${TOR_IP}" -p tcp --dport "${TOR_CONTROL_PORT}" -j RETURN 2>/dev/null || true
$IPTABLES_CMD -A OUTPUT -d "${TOR_IP}" -p tcp --dport "${TOR_CONTROL_PORT}" -j ACCEPT 2>/dev/null || true

# Exclude tor's own UID (if present) from nat redirection
if [ -n "${TOR_UID}" ]; then
  # owner match is only valid in nat OUTPUT for local processes; ignore errors if unsupported
  $IPTABLES_CMD -t nat -A OUTPUT -m owner --uid-owner "${TOR_UID}" -j RETURN 2>/dev/null || true
fi

# Redirect all other TCP OUTPUT -> Tor's TransPort (local REDIRECT if Tor is local, otherwise DNAT)
if [ "${TOR_IP}" = "127.0.0.1" ] || [ "${TOR_IP}" = "0.0.0.0" ]; then
  echo "[eval-runner] using REDIRECT to local port ${TOR_TRANSPROXY_PORT}"
  $IPTABLES_CMD -t nat -A OUTPUT -p tcp -m tcp --dport 1:65535 -j REDIRECT --to-ports "${TOR_TRANSPROXY_PORT}"
else
  echo "[eval-runner] using DNAT to ${TOR_IP}:${TOR_TRANSPROXY_PORT}"
  $IPTABLES_CMD -t nat -A OUTPUT -p tcp -j DNAT --to-destination "${TOR_IP}:${TOR_TRANSPROXY_PORT}"
fi

# Block UDP to prevent leaks (you can change to DROP or allow specific ports if desired)
$IPTABLES_CMD -A OUTPUT -p udp -j REJECT 2>/dev/null || true

echo "[eval-runner] iptables rules applied (TCP -> Tor TransPort; UDP REJECT)."

# show applied rules for debugging
$IPTABLES_CMD -t nat -L -n -v 2>/dev/null || true
$IPTABLES_CMD -L -n -v 2>/dev/null || true

# Drop privileges and exec the requested command as non-root 'runner'
#if [ $# -eq 0 ]; then
#  echo "[eval-runner] no command given — dropping to an interactive shell as '${NONROOT_USER}'"
#  exec gosu "${NONROOT_USER}" /bin/bash
#else
#  echo "[eval-runner] executing as '${NONROOT_USER}': $*"
#  exec gosu "${NONROOT_USER}" "$@"
#fi
