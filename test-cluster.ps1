# test-cluster.ps1

Write-Host "Starting Main Instance (Admin + User) on Port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PORT=3000; `$env:PORT_V1=4000; `$env:PORT_V2=4001; `$env:PORT_ADMIN=5000; `$env:ENABLE_ADMIN_API='true'; npm run dev"

Write-Host "Starting Worker 1 (User Only) on Port 3002..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PORT=3002; `$env:PORT_V1=4002; `$env:PORT_V2=4003; `$env:ENABLE_ADMIN_API='false'; npm run dev"

Write-Host "Starting Worker 2 (User Only) on Port 3003..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:PORT=3003; `$env:PORT_V1=4004; `$env:PORT_V2=4005; `$env:ENABLE_ADMIN_API='false'; npm run dev"

Write-Host "Starting Load Balancer on Port 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd load-balancer; `$env:PORT=8080; `$env:MAIN_INSTANCE_URL='http://localhost:3000'; `$env:WORKER_URLS='http://localhost:3002,http://localhost:3003'; npm start"

Write-Host "Cluster started in separate windows!" -ForegroundColor Magenta