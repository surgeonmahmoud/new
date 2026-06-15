
# =========================================================
# FIX: Clean markdown fences and verify CSS/JS links in project
# Run in PowerShell from anywhere. It targets D:\الموقع\mazakrawi
# =========================================================
$ProjectPath = "D:\الموقع\mazakrawi"
Set-Location $ProjectPath
$Report = Join-Path $ProjectPath "fix-frontend-clean-report.txt"
Remove-Item $Report -ErrorAction SilentlyContinue
"===== FRONTEND CLEAN REPORT =====`r`n" | Out-File $Report -Encoding utf8

$files = Get-ChildItem -Recurse -Include *.html,*.css,*.js
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $old = $content

    # Remove markdown code fences that may be left by AI output
    $content = $content -replace "(?m)^\s*```html\s*$", ""
    $content = $content -replace "(?m)^\s*```css\s*$", ""
    $content = $content -replace "(?m)^\s*```javascript\s*$", ""
    $content = $content -replace "(?m)^\s*```js\s*$", ""
    $content = $content -replace "(?m)^\s*```\s*$", ""

    # Remove accidental visible text at beginning/end like html``` or css```
    $content = $content -replace "^\s*html```\s*", ""
    $content = $content -replace "^\s*css```\s*", ""
    $content = $content -replace "^\s*javascript```\s*", ""
    $content = $content -replace "```\s*$", ""

    # Fix escaped slashes if any landed in HTML links/scripts
    $content = $content -replace "<\/", "</"

    if ($content -ne $old) {
        Set-Content -Path $file.FullName -Value $content.Trim() -Encoding UTF8
        "CLEANED: $($file.FullName)" | Out-File $Report -Append -Encoding utf8
        Write-Host "CLEANED: $($file.FullName)" -ForegroundColor Green
    }
}

"`r`n===== POST CHECK =====" | Out-File $Report -Append -Encoding utf8
$patterns = @("```", "html```", "css```", "javascript```")
foreach ($p in $patterns) {
    "`r`n--- $p ---" | Out-File $Report -Append -Encoding utf8
    $found = Select-String -Path (Get-ChildItem -Recurse -Include *.html,*.css,*.js).FullName -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
    if ($found) {
        foreach ($m in $found) {
            "FOUND: $($m.Path) line $($m.LineNumber): $($m.Line.Trim())" | Out-File $Report -Append -Encoding utf8
            Write-Host "FOUND: $p in $($m.Path) line $($m.LineNumber)" -ForegroundColor Yellow
        }
    } else {
        "OK: Not found" | Out-File $Report -Append -Encoding utf8
    }
}

"`r`n===== CSS FILES =====" | Out-File $Report -Append -Encoding utf8
Get-Item "assets\css\main.css", "assets\css\admin.css" | Select-Object FullName, Length, LastWriteTime | Out-File $Report -Append -Encoding utf8

Write-Host "DONE. Report: fix-frontend-clean-report.txt" -ForegroundColor Cyan
