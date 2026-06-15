# =========================================================
# Apply Phase 1 Patch - دوري المذاكراوية
# Run this PowerShell script inside project root:
# D:\الموقع\mazakrawi
# =========================================================

$ProjectPath = (Get-Location).Path
$Report = Join-Path $ProjectPath "phase1-patch-report.txt"

Remove-Item $Report -ErrorAction SilentlyContinue
"===== PHASE 1 PATCH REPORT =====" | Out-File $Report -Encoding utf8
"Project Path: $ProjectPath" | Out-File $Report -Append -Encoding utf8

function Backup-File($path) {
  if (Test-Path $path) {
    $backup = "$path.bak-phase1-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $path $backup -Force
    "BACKUP: $path -> $backup" | Out-File $Report -Append -Encoding utf8
  }
}

# Ensure folders
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath "assets\js") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $ProjectPath "assets\css") | Out-Null

# Required source files
$SrcIndex = Join-Path $ProjectPath "phase1-index.html"
$SrcJs = Join-Path $ProjectPath "phase1-control-gate.js"

if (!(Test-Path $SrcIndex)) {
  Write-Host "Missing phase1-index.html in project root" -ForegroundColor Red
  exit
}
if (!(Test-Path $SrcJs)) {
  Write-Host "Missing phase1-control-gate.js in project root" -ForegroundColor Red
  exit
}

# Patch index
$IndexPath = Join-Path $ProjectPath "index.html"
Backup-File $IndexPath
Copy-Item $SrcIndex $IndexPath -Force
"UPDATED: index.html" | Out-File $Report -Append -Encoding utf8

# Patch control-gate.js
$TargetJs = Join-Path $ProjectPath "assets\js\control-gate.js"
Backup-File $TargetJs
Copy-Item $SrcJs $TargetJs -Force
"UPDATED: assets\js\control-gate.js" | Out-File $Report -Append -Encoding utf8

# Append CSS once
$CssPath = Join-Path $ProjectPath "assets\css\main.css"
if (!(Test-Path $CssPath)) {
  Write-Host "Missing assets\css\main.css" -ForegroundColor Red
  exit
}
$Css = Get-Content $CssPath -Raw -Encoding UTF8
if ($Css -notmatch "Phase 1 Patch: Logo \+ Unified Control Gate") {
@'
/* =========================================================
   Phase 1 Patch: Logo + Unified Control Gate + Support Button
   ========================================================= */
.site-logo,
.auth-logo-img,
.nav-logo-img,
.logo-mark {
  display: block;
  object-fit: contain;
}

.site-logo {
  width: 112px;
  height: 112px;
  margin: 0 auto 14px;
  filter: drop-shadow(0 0 24px rgba(255, 215, 0, 0.22));
}

.auth-logo-img {
  width: 78px;
  height: 78px;
  margin: 0 auto 14px;
  filter: drop-shadow(0 0 18px rgba(255, 215, 0, 0.2));
}

.nav-logo-img {
  width: 36px;
  height: 36px;
}

.landing-v2 {
  position: relative;
}

.landing-card-v2 {
  position: relative;
  background: rgba(16, 16, 30, 0.72);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 34px 28px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.35);
  backdrop-filter: blur(12px);
}

.landing-logo-img {
  width: 126px;
  height: 126px;
}

.landing-control-link {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 20;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(16, 16, 30, 0.72);
  color: var(--text-muted, #9ca3af);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  backdrop-filter: blur(10px);
}

.landing-control-link:hover {
  color: var(--gold, #ffd700);
  border-color: rgba(255, 215, 0, 0.35);
  transform: translateY(-1px);
}

.control-gate-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.72);
}

.control-gate-modal.show {
  display: flex;
}

.control-gate-box {
  width: min(420px, 96vw);
  background: var(--bg2, #10101e);
  border: 1px solid var(--border2, #3a3a60);
  border-radius: 22px;
  padding: 26px;
  text-align: center;
  box-shadow: 0 24px 90px rgba(0,0,0,0.55), 0 0 28px rgba(108,63,197,0.2);
  position: relative;
}

.control-gate-close {
  position: absolute;
  left: 14px;
  top: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
}

.control-gate-close:hover {
  color: var(--danger, #ff4466);
}

.control-gate-logo {
  width: 76px;
  height: 76px;
}

.control-gate-box h2 {
  font-family: var(--font-display, inherit);
  font-size: 1.35rem;
  margin: 4px 0 6px;
  color: var(--text, #fff);
}

.control-gate-hint {
  color: var(--text-muted, #9ca3af);
  font-size: 0.88rem;
  margin-bottom: 14px;
}

.control-gate-input {
  width: 100%;
  text-align: center;
  letter-spacing: 0.18em;
  direction: ltr;
  background: var(--bg3, #16162a);
  border: 1px solid var(--border, #2a2a4a);
  color: var(--text, #fff);
  border-radius: 12px;
  padding: 13px 14px;
  margin-bottom: 12px;
  outline: none;
  font-size: 1.1rem;
}

.control-gate-input:focus {
  border-color: var(--purple-light, #9b6bff);
  box-shadow: 0 0 0 3px rgba(155, 107, 255, 0.14);
}

.control-gate-error {
  min-height: 1.3em;
  color: var(--danger, #ff4466);
  font-size: 0.84rem;
  margin-top: 10px;
}

.support-float {
  position: fixed;
  left: 18px;
  bottom: 18px;
  z-index: 9998;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4ff, #6c3fc5);
  color: #fff;
  text-decoration: none;
  font-size: 1.35rem;
  box-shadow: 0 12px 34px rgba(0, 212, 255, 0.22);
  border: 1px solid rgba(255,255,255,0.14);
  transition: 0.2s ease;
}

.support-float:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 18px 44px rgba(0, 212, 255, 0.32);
}

@media (max-width: 640px) {
  .landing-control-link {
    top: 12px;
    left: 12px;
    font-size: 0.78rem;
    padding: 7px 12px;
  }

  .site-logo,
  .landing-logo-img {
    width: 98px;
    height: 98px;
  }

  .support-float {
    width: 48px;
    height: 48px;
    left: 14px;
    bottom: 14px;
  }
}
'@ | Out-File $CssPath -Append -Encoding utf8
  "APPENDED: assets\css\main.css phase1 styles" | Out-File $Report -Append -Encoding utf8
} else {
  "SKIPPED: CSS already contains phase1 styles" | Out-File $Report -Append -Encoding utf8
}

# Check logo exists
if (Test-Path (Join-Path $ProjectPath "assets\img\league-logo.png")) {
  "OK: Logo exists assets\img\league-logo.png" | Out-File $Report -Append -Encoding utf8
} else {
  "WARNING: Logo missing assets\img\league-logo.png" | Out-File $Report -Append -Encoding utf8
  Write-Host "WARNING: Logo missing assets\img\league-logo.png" -ForegroundColor Yellow
}

"DONE" | Out-File $Report -Append -Encoding utf8
Write-Host "DONE ✅ Phase 1 patch applied" -ForegroundColor Cyan
Write-Host "Upload phase1-patch-report.txt if anything looks wrong" -ForegroundColor Cyan
