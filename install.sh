#!/usr/bin/env bash
# StaticClock one-click install. Counted download via this project's Worker.
# Usage: curl -fsSL https://staticclock-download-tracker.vibelock.workers.dev/install.sh | bash
set -euo pipefail

HOST="${STATICCLOCK_HOME_HOST:-https://staticclock-download-tracker.vibelock.workers.dev}"
ASSET="${STATICCLOCK_HOME_ASSET:-staticclock-0.2.0.tar.gz}"
WORKDIR="${STATICCLOCK_HOME:-$HOME/staticclock}"

mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "Downloading counted tarball from ${HOST}/download (User-Agent Mozilla/5.0)…"
curl -fsSL -A 'Mozilla/5.0' "${HOST}/download?asset=${ASSET}" -o "${ASSET}"

tar -xzf "${ASSET}"
DIR="$(find . -maxdepth 1 -type d -name 'staticclock-*' | head -n 1)"
if [ -n "${DIR}" ]; then
  cd "${DIR}"
fi

python3 -m venv .venv
# shellcheck disable=SC1091
. .venv/bin/activate
python -m pip install -U pip
python -m pip install -e .

echo
echo "Installed StaticClock."
echo "Run:  staticclock ui"
echo "Then open http://127.0.0.1:8765  (loopback only)"
echo "Author: Aziel Eliab."
