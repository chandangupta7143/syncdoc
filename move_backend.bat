@echo off
echo Moving backend to D:\REGRIP\PROJECT\BACKEND...

:: Create target directory if it doesn't exist
if not exist "D:\REGRIP\PROJECT\BACKEND" mkdir "D:\REGRIP\PROJECT\BACKEND"

:: Copy all files except node_modules
xcopy "D:\REGRIP\PROJECT\FRONTEND\regrip\backend\*" "D:\REGRIP\PROJECT\BACKEND\" /E /I /Y /EXCLUDE:exclude.txt

echo.
echo Backend successfully moved to D:\REGRIP\PROJECT\BACKEND
echo (You can now delete the original backend folder inside frontend if you want)
pause
