@echo off
echo [FLUX] Downloading Agent...
:: In a real production environment, this would be a compiled EXE.
:: For this demo, we use the Node.js Mock Agent.
node %~dp0mock-agent.js %*
pause
