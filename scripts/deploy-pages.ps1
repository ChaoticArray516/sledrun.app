param(
  [string]$ProjectName = 'sledrun',
  [string]$Branch = 'main',
  [switch]$SkipBuild,
  [switch]$SyncR2,
  [switch]$InsecureTls,
  [int]$MaxRetries = 5,
  [string]$NodeDir = 'H:\sdkpkg\webArch\ClientSide\npm\node-v22.23.4\node-v22.23.4-win-x64',
  [string]$TokenFile = (Join-Path $PSScriptRoot '..\..\deploy\cloudflare\api_token.txt')
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$token = $null

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "=== $Message ==="
}

function Read-CloudflareCredentials {
  if (-not (Test-Path -LiteralPath $TokenFile)) {
    throw "Token file not found: $TokenFile"
  }
  $raw = Get-Content -LiteralPath $TokenFile -Raw
  $tokenMatch = [regex]::Match($raw, 'cfut_[A-Za-z0-9]+')
  $accountMatch = [regex]::Match($raw, 'CLOUDFLARE_ACCOUNT_ID\s*=\s*([0-9a-f]+)')
  if (-not $tokenMatch.Success -or -not $accountMatch.Success) {
    throw "Could not parse token/account from $TokenFile"
  }
  $script:token = $tokenMatch.Value
  $env:CLOUDFLARE_API_TOKEN = $tokenMatch.Value
  $env:CLOUDFLARE_ACCOUNT_ID = $accountMatch.Groups[1].Value
  Write-Host "Cloudflare credentials loaded (token length $($tokenMatch.Value.Length), account $($accountMatch.Groups[1].Value.Substring(0,6))...)"
}

function Invoke-Wrangler {
  param([string[]]$Arguments)
  $output = & npx --no-install wrangler @Arguments 2>&1 | Out-String
  Write-Host $output.Trim()
  return @{ ExitCode = $LASTEXITCODE; Output = $output }
}

function Invoke-WithRetry {
  param(
    [string]$Label,
    [scriptblock]$Action
  )
  for ($i = 1; $i -le $MaxRetries; $i++) {
    Write-Host "--- $Label attempt $i/$MaxRetries ---"
    $result = & $Action
    if ($result.ExitCode -eq 0) {
      return $result
    }
    Start-Sleep -Seconds 4
  }
  throw "$Label failed after $MaxRetries attempts"
}

function Sync-R2Assets {
  Write-Step 'R2 bucket and assets'
  $bucket = 'sledrun-game-assets'
  $corsFile = Join-Path $projectRoot 'deploy\r2-cors.json'
  $assetRoot = Join-Path $projectRoot 'public\game\v1'

  if (-not (Test-Path -LiteralPath $assetRoot)) {
    throw "Game assets not found: $assetRoot. Run npm run build:game first."
  }

  $null = Invoke-Wrangler @('r2', 'bucket', 'create', $bucket)
  $cors = Invoke-Wrangler @('r2', 'bucket', 'cors', 'set', $bucket, '--file', $corsFile, '--force')
  if ($cors.ExitCode -ne 0) { throw 'Failed to set R2 CORS' }

  $base = (Resolve-Path $assetRoot).Path
  $files = Get-ChildItem -LiteralPath $assetRoot -Recurse -File |
    Where-Object { $_.Extension -in '.js', '.wasm', '.glb', '.png' }

  foreach ($file in $files) {
    $rel = $file.FullName.Substring($base.Length + 1).Replace('\', '/')
    $key = "v1/$rel"
    $result = Invoke-WithRetry -Label "upload $key" -Action {
      Invoke-Wrangler @('r2', 'object', 'put', "$bucket/$key", '--file', $file.FullName, '--remote', '--force')
    }
    if ($result.ExitCode -ne 0) { throw "R2 upload failed: $key" }
  }
  Write-Host "R2 assets uploaded: $($files.Count) files"
}

function Test-DeployedUrl {
  param([string]$Url)
  Add-Type -AssemblyName System.Net.Http
  $handler = New-Object System.Net.Http.HttpClientHandler
  $handler.AllowAutoRedirect = $false
  $client = New-Object System.Net.Http.HttpClient($handler)
  try {
    $response = $client.GetAsync($Url).Result
    return [pscustomobject]@{
      Url = $Url
      Status = [int]$response.StatusCode
      Location = ($response.Headers.Location -as [string])
      Cache = ($response.Headers.CacheControl -as [string])
      ContentType = ($response.Content.Headers.ContentType -as [string])
    }
  } finally {
    $client.Dispose()
  }
}

try {
  if (Test-Path -LiteralPath $NodeDir) {
    $env:PATH = "$NodeDir;$env:PATH"
  }
  if ($InsecureTls) {
    $env:NODE_TLS_REJECT_UNAUTHORIZED = '0'
    Write-Warning 'NODE_TLS_REJECT_UNAUTHORIZED=0 is enabled for this run only.'
  }

  Read-CloudflareCredentials

  if (-not $SkipBuild) {
    Write-Step 'Build'
    & npm run check
    if ($LASTEXITCODE -ne 0) { throw 'npm run check failed' }
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw 'npm run build failed' }
    & node scripts/check.mjs
    if ($LASTEXITCODE -ne 0) { throw 'scripts/check.mjs failed' }
  }

  if ($SyncR2) {
    Sync-R2Assets
  }

  Write-Step 'Pages deploy'
  $deploy = Invoke-WithRetry -Label 'pages deploy' -Action {
    Invoke-Wrangler @('pages', 'deploy', 'dist', '--project-name', $ProjectName, '--branch', $Branch)
  }
  $urlMatch = [regex]::Match($deploy.Output, 'https://[a-z0-9.-]+\.pages\.dev')
  $deploymentUrl = if ($urlMatch.Success) { $urlMatch.Value } else { "https://$ProjectName.pages.dev" }

  Write-Step 'Verify'
  $checks = @(
    "$deploymentUrl/",
    "$deploymentUrl/snow-road",
    "$deploymentUrl/3d-sledding",
    "$deploymentUrl/unknown",
    "$deploymentUrl/snow-road/",
    "$deploymentUrl/og.png",
    "$deploymentUrl/favicon.ico",
    "$deploymentUrl/game/v1/home-MPI2L3TH.js"
  )
  foreach ($url in $checks) {
    try {
      $r = Test-DeployedUrl $url
      $suffix = if ($r.Location) { " -> $($r.Location)" } else { '' }
      Write-Host ("{0} {1}{2}" -f $r.Status, $url, $suffix)
    } catch {
      Write-Host "ERR $url : $($_.Exception.Message)"
    }
  }

  Write-Step 'Done'
  Write-Host "Project: $ProjectName"
  Write-Host "Deployment URL: $deploymentUrl"
  Write-Host "Production URL: https://$ProjectName.pages.dev"
} finally {
  Remove-Item Env:\CLOUDFLARE_API_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:\CLOUDFLARE_ACCOUNT_ID -ErrorAction SilentlyContinue
  if ($InsecureTls) {
    Remove-Item Env:\NODE_TLS_REJECT_UNAUTHORIZED -ErrorAction SilentlyContinue
  }
}
