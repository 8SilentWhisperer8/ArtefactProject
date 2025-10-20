@echo off
REM Django test runner
set TEST_PATH=%*
if "%TEST_PATH%"=="" set TEST_PATH=tests

python manage.py test %TEST_PATH%
echo.

REM Run the tests
python manage.py test %TEST_PATH% -v 2

REM Check exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo                           TEST EXECUTION COMPLETE
    echo ===============================================================================
    echo.
    echo *** ========================================================================= ***
    echo          ALL TESTS PASSED - PRODUCTION READY
    echo *** ========================================================================= ***
) else (
    echo.
    echo ===============================================================================
    echo                           TEST EXECUTION COMPLETE
    echo ===============================================================================
    echo.
    echo !!! ========================================================================= !!!
    echo          SOME TESTS FAILED - CHECK OUTPUT ABOVE
    echo !!! ========================================================================= !!!
)

echo.
echo [INFO] For detailed test matrix, see: tests\TEST_RESULTS.md
echo [INFO] For quick reference, see: tests\QUICK_REFERENCE.md
echo [INFO] For visual dashboard, see: tests\DASHBOARD.md
echo.

endlocal
exit /b %ERRORLEVEL%
