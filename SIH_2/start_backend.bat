@echo off
echo Setting up RE-SOURCE Python Backend...
echo.

cd backend

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo.
echo Creating virtual environment...
python -m venv circularity_env

echo.
echo Activating virtual environment...
call circularity_env\Scripts\activate

echo.
echo Installing required packages...
pip install -r requirements.txt

echo.
echo Starting RE-SOURCE Backend Server...
echo The server will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

python app.py
