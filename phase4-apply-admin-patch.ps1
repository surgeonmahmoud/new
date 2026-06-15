# =========================================================
# Phase 4 Admin Patch - settings + student dropdown helpers
# Run inside project root
# =========================================================
$ProjectPath = (Get-Location).Path
$Report = Join-Path $ProjectPath "phase4-admin-report.txt"
Remove-Item $Report -ErrorAction SilentlyContinue
"===== PHASE 4 ADMIN PATCH REPORT =====" | Out-File $Report -Encoding utf8
"Project Path: $ProjectPath" | Out-File $Report -Append -Encoding utf8

function Log($msg) { $msg | Out-File $Report -Append -Encoding utf8; Write-Host $msg }
function Backup($path) { if (Test-Path $path) { Copy-Item $path "$path.bak-phase4-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force; Log "BACKUP: $path" } }
function ReadFile($path) { return Get-Content $path -Raw -Encoding UTF8 }
function WriteFile($path, $content) { Set-Content -Path $path -Value $content.Trim() -Encoding UTF8 }

$SourceJs = Join-Path $ProjectPath "phase4-admin-patch.js"
$TargetJs = Join-Path $ProjectPath "assets\js\admin-phase4.js"
if (!(Test-Path $SourceJs)) { Write-Host "Missing phase4-admin-patch.js" -ForegroundColor Red; exit }
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath "assets\js") | Out-Null
Backup $TargetJs
Copy-Item $SourceJs $TargetJs -Force
Log "UPDATED: assets\js\admin-phase4.js"

function InsertScript($file) {
  if (!(Test-Path $file)) { return }
  $content = ReadFile $file
  if ($content.Contains('/assets/js/admin-phase4.js')) { Log "SKIP SCRIPT EXISTS: $file"; return }
  Backup $file
  $tag = '  <script src="/assets/js/admin-phase4.js"></script>'
  if ($content.Contains('</body>')) { $content = $content.Replace('</body>', "$tag`n</body>") }
  else { $content = $content + "`n" + $tag }
  WriteFile $file $content
  Log "INSERTED admin-phase4.js: $file"
}

# Add script to all Mahmoud admin pages
$AdminDir = Join-Path $ProjectPath "admin-mahmoud"
if (Test-Path $AdminDir) { Get-ChildItem $AdminDir -Filter *.html | ForEach-Object { InsertScript $_.FullName } }

# Add settings section to dashboard safely
$Dashboard = Join-Path $ProjectPath "admin-mahmoud\dashboard.html"
if (Test-Path $Dashboard) {
  $content = ReadFile $Dashboard
  if (!$content.Contains('mahmoud-settings-box')) {
    Backup $Dashboard
    $section = @'

<section id="mahmoud-settings-box" class="card admin-card mahmoud-settings-box">
  <h2 class="card-title">إعدادات الدخول والدعم</h2>
  <div class="settings-grid">
    <div class="form-group"><label>رمز كنترول محمود</label><input id="set-code-mahmoud" type="password"></div>
    <div class="form-group"><label>رمز لوحة زياد</label><input id="set-code-ziad" type="password"></div>
    <div class="form-group"><label>عدد المحاولات</label><input id="set-max-attempts" type="number" min="1"></div>
    <div class="form-group"><label>مدة الإيقاف بالدقائق</label><input id="set-lock-minutes" type="number" min="1"></div>
  </div>
  <button class="btn btn-primary" onclick="saveMahmoudControlSettings()">حفظ رموز الدخول</button>
  <hr>
  <div class="form-group"><label>رابط دعم الموقع</label><input id="set-support-link" type="url"></div>
  <button class="btn btn-primary" onclick="saveMahmoudSupportLink()">حفظ رابط الدعم</button>
</section>

<section class="card admin-card subjects-config-box">
  <h2 class="card-title">إعدادات المواد</h2>
  <div class="settings-grid">
    <div class="form-group"><label>اسم المادة</label><input id="subject-name" placeholder="مثال: الفيزياء"></div>
    <div class="form-group"><label>الصف</label><select id="subject-grade"></select></div>
    <div class="form-group"><label>النظام</label><select id="subject-system"></select></div>
    <div class="form-group"><label>المسار</label><select id="subject-track"></select></div>
    <div class="form-group"><label>ترتيب الظهور</label><input id="subject-sort" type="number" value="0"></div>
  </div>
  <button class="btn btn-primary" onclick="addSubjectConfig()">إضافة مادة</button>
  <div class="table-wrap" style="margin-top:16px">
    <table><thead><tr><th>المادة</th><th>الصف</th><th>النظام</th><th>المسار</th><th>الترتيب</th><th>الحالة</th></tr></thead><tbody id="subjects-config-body"></tbody></table>
  </div>
</section>
'@
    if ($content.Contains('</main>')) { $content = $content.Replace('</main>', "$section`n</main>") }
    else { $content = $content + "`n" + $section }
    WriteFile $Dashboard $content
    Log "ADDED settings/subjects section to dashboard"
  }
}

# CSS
$AdminCss = Join-Path $ProjectPath "assets\css\admin.css"
if (Test-Path $AdminCss) {
  $css = ReadFile $AdminCss
  if (!$css.Contains('PHASE4_ADMIN_PATCH_CSS')) {
    Backup $AdminCss
    $append = @'

/* PHASE4_ADMIN_PATCH_CSS */
.mahmoud-settings-box,
.subjects-config-box {
  margin-top: 20px;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}
.mahmoud-settings-box input,
.mahmoud-settings-box select,
.subjects-config-box input,
.subjects-config-box select,
select.form-select {
  width: 100%;
  background: var(--bg3, #16162a);
  border: 1px solid var(--border, #2a2a4a);
  color: var(--text, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
}
.subjects-config-box table {
  width: 100%;
  border-collapse: collapse;
}
.subjects-config-box th,
.subjects-config-box td {
  padding: 10px;
  border-bottom: 1px solid var(--border, #2a2a4a);
}
'@
    Add-Content -Path $AdminCss -Value $append -Encoding UTF8
    Log "APPENDED phase4 admin CSS"
  }
}

"" | Out-File $Report -Append -Encoding utf8
"===== POST CHECK =====" | Out-File $Report -Append -Encoding utf8
foreach ($f in @("assets\js\admin-phase4.js", "admin-mahmoud\dashboard.html", "assets\css\admin.css")) {
  $p = Join-Path $ProjectPath $f
  if (Test-Path $p) { "FOUND: $f" | Out-File $Report -Append -Encoding utf8 } else { "MISSING: $f" | Out-File $Report -Append -Encoding utf8 }
}
Log "DONE"
Write-Host "DONE Phase 4 admin patch applied. Press Ctrl+F5." -ForegroundColor Cyan
