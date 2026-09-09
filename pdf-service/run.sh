#!/usr/bin/env bash
# Chạy pdf-service không cần Docker (Mac/Linux).
# Cách dùng:
#   chmod +x run.sh
#   ./run.sh
set -e

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "Tạo virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Cài dependencies..."
pip install --upgrade pip > /dev/null
pip install -r requirements.txt

echo "Khởi động pdf-service tại http://localhost:8001 (docs: http://localhost:8001/docs)"
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
