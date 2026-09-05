# Create virtual environment if it doesn't exist
if (-not (Test-Path venv)) {
    Write-Host "Creating Python virtual environment using Python 3.13..." -ForegroundColor Cyan
    py -3.13 -m venv venv
}

# Run pip within the virtual environment directly to avoid policy or activation issues
Write-Host "Upgrading pip..." -ForegroundColor Cyan
& .\venv\Scripts\python.exe -m pip install --upgrade pip

Write-Host "Installing requirements from requirements.txt..." -ForegroundColor Cyan
& .\venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host "Setup complete!" -ForegroundColor Green
