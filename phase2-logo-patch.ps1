
# =========================================================
# Phase 2 Patch - Logo everywhere + login text + support button
# Run inside project root: D:\...\mazakrawi
# Safe: backups before editing, no SQL, no destructive actions
# =========================================================

$ProjectPath = (Get-Location).Path
$Report = Join-Path $ProjectPath "phase2-logo-report.txt"
Remove-Item $Report -ErrorAction SilentlyContinue

"===== PHASE 2 LOGO PATCH REPORT =====" | Out-File $Report -Encoding utf8
"Project Path: $ProjectPath" | Out-File $Report -Append -Encoding utf8
"Started: $(Get-Date)" | Out-File $Report -Append -Encoding utf8

function Write-Log($msg) {
    $msg | Out-File $Report -Append -Encoding utf8
    Write-Host $msg
}

function Backup-File($path) {
    if (Test-Path $path) {
        $backup = "$path.bak-phase2-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $path $backup -Force
        Write-Log "BACKUP: $path -> $backup"
    }
}

function Read-Utf8($path) {
    return Get-Content $path -Raw -Encoding UTF8
}

function Write-Utf8($path, $content) {
    Set-Content -Path $path -Value $content.Trim() -Encoding UTF8
}

function Ensure-BeforeBodyEnd($path, $snippet, $marker) {
    if (!(Test-Path $path)) { return }
    $content = Read-Utf8 $path
    if ($content -match [regex]::Escape($marker)) {
        return
    }
    Backup-File $path
    if ($content -match "</body>") {
        $content = $content -replace "</body>", "$snippet`n</body>"
        Write-Utf8 $path $content
        Write-Log "UPDATED: inserted $marker in $path"
    } else {
        Add-Content -Path $path -Value $snippet -Encoding UTF8
        Write-Log "UPDATED: appended $marker in $path"
    }
}

function Ensure-ScriptBeforeBodyEnd($path, $src) {
    $snippet = "  <script src=`"$src`"></script>"
    Ensure-BeforeBodyEnd $path $snippet $src
}

function Ensure-SupportButton($path) {
    $snippet = "  <a href=`"https://t.me/Mahmoud_M_Hassan101BOT`" class=`"support-float`" data-support-link aria-label=`"دعم الموقع`">💬</a>"
    Ensure-BeforeBodyEnd $path $snippet "data-support-link"
}

function Ensure-ControlGateScript($path) {
    # Only for pages that include Supabase client already or public pages.
    Ensure-ScriptBeforeBodyEnd $path "/assets/js/control-gate.js"
}

function Replace-Text($path, $old, $new) {
    if (!(Test-Path $path)) { return }
    $content = Read-Utf8 $path
    if ($content.Contains($old)) {
        Backup-File $path
        $content = $content.Replace($old, $new)
        Write-Utf8 $path $content
        Write-Log "UPDATED TEXT: $path"
    }
}

function Ensure-AuthLogo($path) {
    if (!(Test-Path $path)) { return }
    $content = Read-Utf8 $path
    if ($content -match "auth-logo-img" -or $content -match "league-logo.png") { return }
    Backup-File $path
    $logo = "`n      <img src=`"/assets/img/league-logo.png`" alt=`"شعار دوري المذاكراوية`" class=`"auth-logo-img`" />"
    if ($content -match "<div class=\"auth-box\"[^>]*>") {
        $content = [regex]::Replace($content, "(<div class=\"auth-box\"[^>]*>)", "`$1$logo", 1)
    } elseif ($content -match "<body[^>]*>") {
        $content = [regex]::Replace($content, "(<body[^>]*>)", "`$1$logo", 1)
    }
    Write-Utf8 $path $content
    Write-Log "UPDATED: auth logo in $path"
}

function Ensure-StudentNavLogo($path) {
    if (!(Test-Path $path)) { return }
    $content = Read-Utf8 $path
    if ($content -match "nav-logo-img") { return }
    if (!($content -match "nav-brand" -or $content -match "brand-title")) { return }
    Backup-File $path
    $img = "<img src=`"/assets/img/league-logo.png`" alt=`"شعار دوري المذاكراوية`" class=`"nav-logo-img`" />`n      "
    if ($content -match "<div class=\"nav-brand\"[^>]*>") {
        $content = [regex]::Replace($content, "(<div class=\"nav-brand\"[^>]*>)", "`$1`n      $img", 1)
    } else {
        $content = [regex]::Replace($content, "(<div class=\"brand-title\"[^>]*>)", "$img`$1", 1)
    }
    Write-Utf8 $path $content
    Write-Log "UPDATED: student/sidebar logo in $path"
}

function Ensure-AdminLogo($path) {
    if (!(Test-Path $path)) { return }
    $content = Read-Utf8 $path
    if ($content -match "admin-logo-img" -or $content -match "league-logo.png") { return }
    Backup-File $path
    $img = "<img src=`"/assets/img/league-logo.png`" alt=`"شعار دوري المذاكراوية`" class=`"admin-logo-img`" />`n      "
    if ($content -match "<div class=\"sidebar-header\"[^>]*>") {
        $content = [regex]::Replace($content, "(<div class=\"sidebar-header\"[^>]*>)", "`$1`n      $img", 1)
    } elseif ($content -match "<div class=\"admin-sidebar\"[^>]*>") {
        $content = [regex]::Replace($content, "(<div class=\"admin-sidebar\"[^>]*>)", "`$1`n      $img", 1)
    } elseif ($content -match "<nav class=\"admin-sidebar\"[^>]*>") {
        $content = [regex]::Replace($content, "(<nav class=\"admin-sidebar\"[^>]*>)", "`$1`n      $img", 1)
    } elseif ($content -match "<aside class=\"admin-sidebar\"[^>]*>") {
        $content = [regex]::Replace($content, "(<aside class=\"admin-sidebar\"[^>]*>)", "`$1`n      $img", 1)
    }
    Write-Utf8 $path $content
    Write-Log "UPDATED: admin/panel logo in $path"
}

# ---------------------------------------------------------
# Check logo exists
# ---------------------------------------------------------
$LogoPath = Join-Path $ProjectPath "assets\img\league-logo.png"
if (Test-Path $LogoPath) {
    Write-Log "OK: logo exists: assets\img\league-logo.png"
} else {
    Write-Log "WARNING: logo missing: assets\img\league-logo.png"
    Write-Host "WARNING: logo missing: assets\img\league-logo.png" -ForegroundColor Yellow
}

# ---------------------------------------------------------
# Update login/signup logo + formal text + support
# ---------------------------------------------------------
$Login = Join-Path $ProjectPath "login.html"
$Signup = Join-Path $ProjectPath "signup.html"

Ensure-AuthLogo $Login
Ensure-AuthLogo $Signup

Replace-Text $Login "ما عندكش حساب؟" "لا تملك حسابًا؟"
Replace-Text $Login "إنشاء لاعب" "أنشئ حسابًا جديدًا"
Replace-Text $Login "ادخل بياناتك وابدأ التذكير" "أدخل بياناتك وابدأ رحلتك في الدوري"
Replace-Text $Login "ادخل بياناتك وابدأ التذكير" "أدخل بياناتك وابدأ رحلتك في الدوري"
Replace-Text $Login "ادخل بياناتك" "أدخل بياناتك"
Replace-Text $Login "ما عندكش حساب؟ إنشاء لاعب" "لا تملك حسابًا؟ أنشئ حسابًا جديدًا"

Ensure-SupportButton $Login
Ensure-SupportButton $Signup
Ensure-ControlGateScript $Login
Ensure-ControlGateScript $Signup

# ---------------------------------------------------------
# Student pages: sidebar logo + support button + support script
# ---------------------------------------------------------
$StudentDir = Join-Path $ProjectPath "student"
if (Test-Path $StudentDir) {
    Get-ChildItem $StudentDir -Filter *.html | ForEach-Object {
        Ensure-StudentNavLogo $_.FullName
        Ensure-SupportButton $_.FullName
        Ensure-ControlGateScript $_.FullName
    }
}

# ---------------------------------------------------------
# Admin/Ziad/Doctor panels: add logo in sidebar/header if missing
# ---------------------------------------------------------
foreach ($dirName in @("admin-mahmoud", "ziad", "doctor")) {
    $Dir = Join-Path $ProjectPath $dirName
    if (Test-Path $Dir) {
        Get-ChildItem $Dir -Filter *.html | ForEach-Object {
            Ensure-AdminLogo $_.FullName
        }
    }
}

# ---------------------------------------------------------
# Append CSS once
# ---------------------------------------------------------
$CssPath = Join-Path $ProjectPath "assets\css\main.css"
if (Test-Path $CssPath) {
    $Css = Read-Utf8 $CssPath
    if ($Css -notmatch "Phase 2 Patch: Logo distribution") {
        Backup-File $CssPath
@'

/* =========================================================
   Phase 2 Patch: Logo distribution + larger homepage logo
   ========================================================= */
.landing-logo-img,
.landing-card-v2 .site-logo {
  width: 154px !important;
  height: 154px !important;
  margin-bottom: 18px !important;
}

.auth-logo-img {
  width: 88px !important;
  height: 88px !important;
  margin: 0 auto 16px !important;
}

.nav-logo-img {
  width: 46px !important;
  height: 46px !important;
  margin: 0 auto 8px !important;
  border-radius: 12px;
  filter: drop-shadow(0 0 14px rgba(255, 215, 0, 0.18));
}

.admin-logo-img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  display: block;
  margin: 14px auto 8px;
  border-radius: 14px;
  filter: drop-shadow(0 0 14px rgba(0, 212, 255, 0.16));
}

.admin-sidebar .admin-logo-img,
.sidebar-header .admin-logo-img {
  margin-top: 4px;
}

.nav-brand {
  text-align: center;
}

@media (max-width: 640px) {
  .landing-logo-img,
  .landing-card-v2 .site-logo {
    width: 128px !important;
    height: 128px !important;
  }

  .auth-logo-img {
    width: 76px !important;
    height: 76px !important;
  }
}
'@ | Out-File $CssPath -Append -Encoding utf8
        Write-Log "APPENDED: Phase 2 CSS to assets\css\main.css"
    } else {
        Write-Log "SKIPPED: Phase 2 CSS already exists in main.css"
    }
}

# Admin css too, because admin pages may not load main logo classes in all views
$AdminCssPath = Join-Path $ProjectPath "assets\css\admin.css"
if (Test-Path $AdminCssPath) {
    $AdminCss = Read-Utf8 $AdminCssPath
    if ($AdminCss -notmatch "Phase 2 Patch: Admin logo") {
        Backup-File $AdminCssPath
@'

/* =========================================================
   Phase 2 Patch: Admin logo
   ========================================================= */
.admin-logo-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
  display: block;
  margin: 14px auto 8px;
  border-radius: 14px;
  filter: drop-shadow(0 0 14px rgba(0, 212, 255, 0.16));
}

.sidebar-header .admin-logo-img,
.admin-sidebar .admin-logo-img {
  margin-top: 4px;
}
'@ | Out-File $AdminCssPath -Append -Encoding utf8
        Write-Log "APPENDED: Phase 2 CSS to assets\css\admin.css"
    } else {
        Write-Log "SKIPPED: Phase 2 CSS already exists in admin.css"
    }
}

# ---------------------------------------------------------
# Final checks
# ---------------------------------------------------------
"" | Out-File $Report -Append -Encoding utf8
"===== POST CHECK =====" | Out-File $Report -Append -Encoding utf8

$Targets = @(
  "index.html",
  "login.html",
  "signup.html",
  "student\home.html",
  "admin-mahmoud\dashboard.html",
  "ziad\dashboard.html",
  "doctor\dashboard.html"
)
foreach ($t in $Targets) {
    $p = Join-Path $ProjectPath $t
    if (Test-Path $p) {
        $c = Read-Utf8 $p
        if ($c -match "league-logo.png") { "OK LOGO: $t" | Out-File $Report -Append -Encoding utf8 }
        else { "NO LOGO: $t" | Out-File $Report -Append -Encoding utf8 }
    }
}

Write-Log "DONE"
Write-Host "DONE ✅ Phase 2 logo patch applied" -ForegroundColor Cyan
Write-Host "Now press Ctrl+F5 in browser. If anything is wrong, upload phase2-logo-report.txt" -ForegroundColor Cyan
