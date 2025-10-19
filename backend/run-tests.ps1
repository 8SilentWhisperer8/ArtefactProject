# Beautiful Test Runner for ArtefactProject
# Run Django tests with organized visual output

param(
    [string]$TestPath = "tests.unit tests.system tests.performance"
)

# Color definitions
$HeaderColor = "Cyan"
$SuccessColor = "Green"
$FailColor = "Red"
$InfoColor = "Yellow"

function Show-Header {
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor $HeaderColor
    Write-Host "                      ARTEFACT PROJECT TEST SUITE                              " -ForegroundColor $HeaderColor
    Write-Host "                         Visual Test Results                                   " -ForegroundColor $HeaderColor
    Write-Host "===============================================================================" -ForegroundColor $HeaderColor
    Write-Host ""
}

function Show-TestTableHeader {
    Write-Host ""
    Write-Host "+=========+====================================================+=========================+==========+" -ForegroundColor $InfoColor
    Write-Host "| Test ID | Description                                        | Expected Outcome        |  Result  |" -ForegroundColor $InfoColor
    Write-Host "+=========+====================================================+=========================+==========+" -ForegroundColor $InfoColor
}

function Show-TestTableFooter {
    Write-Host "+=========+====================================================+=========================+==========+" -ForegroundColor $InfoColor
    Write-Host ""
}

function Show-Footer {
    param([bool]$Success)
    
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor $HeaderColor
    Write-Host "                           TEST EXECUTION COMPLETE                             " -ForegroundColor $HeaderColor
    Write-Host "===============================================================================" -ForegroundColor $HeaderColor
    Write-Host ""
    
    if ($Success) {
        Write-Host "*** ========================================================================= ***" -ForegroundColor $SuccessColor
        Write-Host "         ALL TESTS PASSED - PRODUCTION READY" -ForegroundColor $SuccessColor
        Write-Host "*** ========================================================================= ***" -ForegroundColor $SuccessColor
    } else {
        Write-Host "!!! ========================================================================= !!!" -ForegroundColor $FailColor
        Write-Host "         SOME TESTS FAILED - CHECK OUTPUT ABOVE" -ForegroundColor $FailColor
        Write-Host "!!! ========================================================================= !!!" -ForegroundColor $FailColor
    }
    Write-Host ""
}

# Main execution
Show-Header

Write-Host "===============================================================================" -ForegroundColor $InfoColor
Write-Host "Running: python manage.py test $TestPath -v 2" -ForegroundColor $InfoColor
Write-Host "===============================================================================" -ForegroundColor $InfoColor
Write-Host ""

# Run the tests
$cmd = "python manage.py test $TestPath -v 2"
Invoke-Expression $cmd

# Check result
if ($LASTEXITCODE -eq 0) {
    Show-Footer -Success $true
} else {
    Show-Footer -Success $false
}

# Print quick reference
Write-Host "[INFO] For detailed test matrix, see: tests\TEST_RESULTS.md" -ForegroundColor $InfoColor
Write-Host "[INFO] For quick reference, see: tests\QUICK_REFERENCE.md" -ForegroundColor $InfoColor
Write-Host ""

exit $LASTEXITCODE
