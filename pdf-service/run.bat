@echo off
REM Chay pdf-service khong can Docker (Windows).
REM Cach dung: run.bat

cd /d "%~dp0"

IF NOT EXIST venv (
    echo Tao virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Cai dependencies...
pip install --upgrade pip >nul
pip install -r requirements.txt

echo Khoi dong pdf-service tai http://localhost:8001 (docs: http://localhost:8001/docs)
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
