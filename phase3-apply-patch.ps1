# =========================================================
# Phase 3 Education + Report Patch
# Run inside project root
# =========================================================
$ProjectPath = (Get-Location).Path
$Report = Join-Path $ProjectPath "phase3-education-report.txt"
Remove-Item $Report -ErrorAction SilentlyContinue
"===== PHASE 3 EDUCATION PATCH REPORT =====" | Out-File $Report -Encoding utf8
"Project Path: $ProjectPath" | Out-File $Report -Append -Encoding utf8

function Log($msg) { $msg | Out-File $Report -Append -Encoding utf8; Write-Host $msg }
function Backup($path) { if (Test-Path $path) { Copy-Item $path "$path.bak-phase3-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force; Log "BACKUP: $path" } }
function ReadFile($path) { return Get-Content $path -Raw -Encoding UTF8 }
function WriteFile($path, $content) { Set-Content -Path $path -Value $content.Trim() -Encoding UTF8 }

$SourceJs = Join-Path $ProjectPath "phase3-education-config.js"
$TargetJs = Join-Path $ProjectPath "assets\js\education-config.js"
if (!(Test-Path $SourceJs)) { Write-Host "Missing phase3-education-config.js" -ForegroundColor Red; exit }
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath "assets\js") | Out-Null
Backup $TargetJs
Copy-Item $SourceJs $TargetJs -Force
Log "UPDATED: assets\js\education-config.js"

function InsertScriptBefore($file, $scriptSrc, $beforeSrc) {
    if (!(Test-Path $file)) { return }
    $content = ReadFile $file
    if ($content.Contains($scriptSrc)) { Log "SKIP SCRIPT EXISTS: $file"; return }
    Backup $file
    $tag = "  <script src=`"$scriptSrc`"></script>"
    if ($content.Contains("<script src=`"$beforeSrc`"></script>")) {
        $content = $content.Replace("<script src=`"$beforeSrc`"></script>", "$tag`n  <script src=`"$beforeSrc`"></script>")
    } elseif ($content.Contains("</body>")) {
        $content = $content.Replace("</body>", "$tag`n</body>")
    } else {
        $content = $content + "`n" + $tag
    }
    WriteFile $file $content
    Log "INSERTED SCRIPT: $scriptSrc into $file"
}

InsertScriptBefore (Join-Path $ProjectPath "signup.html") "/assets/js/education-config.js" "/assets/js/auth.js"
InsertScriptBefore (Join-Path $ProjectPath "student\report.html") "/assets/js/education-config.js" "/assets/js/report.js"

# CSS for RTL sliders and report select, appended once
$CssPath = Join-Path $ProjectPath "assets\css\main.css"
if (Test-Path $CssPath) {
    $css = ReadFile $CssPath
    if (!$css.Contains("PHASE3_EDUCATION_REPORT_PATCH")) {
        Backup $CssPath
        $append = @'

/* PHASE3_EDUCATION_REPORT_PATCH */
.form-select,
select.form-select,
#achSubject {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  padding: 10px 14px;
  font-size: 0.9rem;
  direction: rtl;
  outline: none;
}

input[type="range"].rtl-slider {
  direction: ltr;
  transform: scaleX(-1);
}

input[type="range"].rtl-slider::-webkit-slider-thumb {
  transform: scaleX(-1);
}

#achAmount:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
'@
        Add-Content -Path $CssPath -Value $append -Encoding UTF8
        Log "APPENDED CSS: main.css"
    } else {
        Log "SKIP CSS: already patched"
    }
}

"" | Out-File $Report -Append -Encoding utf8
"===== POST CHECK =====" | Out-File $Report -Append -Encoding utf8
foreach ($f in @("signup.html", "student\report.html", "assets\js\education-config.js")) {
    $p = Join-Path $ProjectPath $f
    if (Test-Path $p) { "FOUND: $f" | Out-File $Report -Append -Encoding utf8 } else { "MISSING: $f" | Out-File $Report -Append -Encoding utf8 }
}
Log "DONE"
Write-Host "DONE Phase 3 patch applied. Press Ctrl+F5." -ForegroundColor Cyan
