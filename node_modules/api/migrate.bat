@echo off
cd /d "C:\Users\pg\OneDrive\Desktop\Progress Copilot\api"
call npm run prisma:migrate -- --name init > "C:\Users\pg\OneDrive\Desktop\Progress Copilot\api\migrate.log" 2>&1
echo EXITCODE=%ERRORLEVEL% >> "C:\Users\pg\OneDrive\Desktop\Progress Copilot\api\migrate.log"