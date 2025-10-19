@echo off
REM Beautiful Test Runner for ArtefactProject
REM Runs Django tests with organized visual output

setlocal enabledelayedexpansion

REM Get test path from argument or use default
set TEST_PATH=%*
if "%TEST_PATH%"=="" set TEST_PATH=tests.unit tests.system tests.performance

echo.
echo ===============================================================================
echo                      ARTEFACT PROJECT TEST SUITE
echo                         Visual Test Results
echo ===============================================================================
echo.

echo ═══════════════════════════════════════════════════════════════════════════════
echo Running: python manage.py test %TEST_PATH% -v 2
echo ═══════════════════════════════════════════════════════════════════════════════
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
