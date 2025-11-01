@echo off
REM Upload schoolmgtdb.sql to Railway MySQL Database
REM Usage: upload-database.bat

echo Uploading database to Railway...

mysql -h ballast.proxy.rlwy.net -u root -pAvngfWibvxTercOiYBiicVYUauOhWdol --port 35590 --protocol=TCP railway < schoolmgtdb.sql

if %errorlevel% equ 0 (
    echo Database uploaded successfully!
) else (
    echo Error uploading database. Please check your connection details.
)

pause

