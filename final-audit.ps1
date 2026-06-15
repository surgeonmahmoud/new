# =========================================================
# Final Audit - Mazakrawi Project
# Safe: read-only checks, no file modifications
# Run inside project root
# =========================================================
$ProjectPath = (Get-Location).Path
$Report = Join-Path $ProjectPath "final-audit-report.txt"
Remove-Item $Report -ErrorAction SilentlyContinue

function W($msg) { $msg | Out-File $Report -Append -Encoding utf8; Write-Host $msg }

"===== FINAL AUDIT REPORT =====" | Out-File $Report -Encoding utf8
W "Project Path: $ProjectPath"
W "Created: $(Get-Date)"

$Expected = @(
  "index.html", "login.html", "signup.html",
  "student\home.html", "student\report.html", "student\operation.html", "student\quiz.html", "student\doctor-question.html", "student\hall-of-fame.html", "student\leaderboards.html",
  "admin-mahmoud\dashboard.html", "admin-mahmoud\students.html", "admin-mahmoud\reports.html", "admin-mahmoud\operation.html", "admin-mahmoud\quizzes.html", "admin-mahmoud\doctor-question.html", "admin-mahmoud\seasons.html", "admin-mahmoud\doctors.html", "admin-mahmoud\logs.html",
  "ziad\dashboard.html", "ziad\students.html", "ziad\reports.html", "ziad\leaderboards.html", "ziad\analytics.html",
  "doctor\dashboard.html", "doctor\students.html", "doctor\reports.html", "doctor\leaderboards.html", "doctor\logs.html",
  "assets\css\main.css", "assets\css\admin.css",
  "assets\js\supabase.js", "assets\js\utils.js", "assets\js\auth.js", "assets\js\student.js", "assets\js\report.js", "assets\js\operation.js", "assets\js\xp.js", "assets\js\leaderboards.js", "assets\js\admin-mahmoud.js", "assets\js\ziad-panel.js", "assets\js\doctor-panel.js"
)

W "`n===== EXPECTED FILES ====="
foreach ($f in $Expected) {
  if (Test-Path $f) { W "FOUND: $f" } else { W "MISSING: $f" }
}

$CodeFiles = Get-ChildItem -Recurse -File -Include *.html,*.js,*.css
$HtmlFiles = Get-ChildItem -Recurse -File -Include *.html

W "`n===== HTML DOCTYPE CHECK ====="
foreach ($f in $HtmlFiles) {
  $c = Get-Content $f.FullName -Raw -Encoding UTF8
  if ($c -match "<!DOCTYPE html>" -or $c -match "<!doctype html>") { W "OK DOCTYPE: $($f.FullName)" }
  else { W "WARNING NO DOCTYPE: $($f.FullName)" }
}

W "`n===== BROKEN HTML TEXT CHECK ====="
$BrokenHtmlPatterns = @(
  "/assets/css/main.css", "/assets/js/supabase.jsscript", "/assets/js/auth.jsscript", "/assets/js/operation-room-v3.jsscript", "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2script>", "&lt;", "&gt;"
)
foreach ($p in $BrokenHtmlPatterns) {
  W "`n--- Pattern: $p ---"
  $found = Select-String -Path $HtmlFiles.FullName -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
  if ($found) { foreach ($m in $found) { W "FOUND: $($m.Path) line $($m.LineNumber): $($m.Line.Trim())" } }
  else { W "OK: Not found" }
}

W "`n===== RISK / WRONG PATTERNS ====="
$BadPatterns = @(
  "```", ".delete(", "delete()", "DROP TABLE", "TRUNCATE", "service_role", "SUPABASE_SERVICE_ROLE", "DATABASE_URL", "YOUR_SUPABASE", "PASTE_SUPABASE", "submission_date", "actual_duration", "planned_duration", "xp_amount", "xp_earned", "study_reports", "duration_minutes" # duration_minutes is allowed; appears as INFO if found
)
foreach ($p in $BadPatterns) {
  W "`n--- Pattern: $p ---"
  $found = Select-String -Path $CodeFiles.FullName -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
  if ($found) { foreach ($m in $found) { W "FOUND: $($m.Path) line $($m.LineNumber): $($m.Line.Trim())" } }
  else { W "OK: Not found" }
}

W "`n===== OLD EDUCATION LABELS CHECK ====="
$OldLabels = @("مصري", "أزهري", "عام", "ثانوي نظام قديم")
foreach ($p in $OldLabels) {
  W "`n--- Old/Legacy Label: $p ---"
  $found = Select-String -Path $CodeFiles.FullName -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
  if ($found) { foreach ($m in $found) { W "FOUND: $($m.Path) line $($m.LineNumber): $($m.Line.Trim())" } }
  else { W "OK: Not found" }
}

W "`n===== SUPABASE CONFIG QUICK CHECK ====="
if (Test-Path "assets\js\supabase.js") {
  $s = Get-Content "assets\js\supabase.js" -Raw -Encoding UTF8
  if ($s -match "service_role") { W "ERROR: service_role appears in supabase.js" } else { W "OK: No service_role in supabase.js" }
  if ($s -match "PASTE_|YOUR_SUPABASE") { W "WARNING: Supabase placeholders may still exist" } else { W "OK: Supabase placeholders not detected" }
  if ($s -match "window.supabaseClient") { W "OK: window.supabaseClient found" } else { W "WARNING: window.supabaseClient not found" }
}

W "`n===== SUMMARY ====="
W "HTML files: $($HtmlFiles.Count)"
W "Code files: $($CodeFiles.Count)"
W "DONE"
