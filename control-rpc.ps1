param([ValidateSet('start','stop','status','enable-startup','disable-startup')][string]$Action)
$ErrorActionPreference = 'Stop'
$rpcRoot = $PSScriptRoot
$entry = Join-Path $rpcRoot 'index.js'
$statusFile = Join-Path $rpcRoot 'rpc-status.json'
$startupFile = Join-Path ([Environment]::GetFolderPath('Startup')) 'LaplaceRPC.vbs'
function Get-RpcProcesses {
    @(Get-CimInstance Win32_Process | Where-Object {
        $_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.IndexOf($entry, [StringComparison]::OrdinalIgnoreCase) -ge 0
    })
}
function Show-Status {
    $running = @(Get-RpcProcesses)
    if (!$running.Count) { Write-Host 'STOPPED: LaplaceRPC has no running process.'; return }
    Write-Host ('RUNNING in background. Process ID: ' + (($running.ProcessId) -join ', '))
    $status = $null
    if (Test-Path -LiteralPath $statusFile) {
        try { $status = Get-Content -LiteralPath $statusFile -Raw | ConvertFrom-Json } catch {}
    }
    if ($status -and $status.pid -in $running.ProcessId) {
        if ($status.connected) {
            Write-Host ('Discord accepted activity for ' + $status.username + ' at ' + $status.updated)
            Write-Host ($status.activity.name + ': ' + $status.activity.details + ' / ' + $status.activity.state)
            Write-Host 'Profile visibility is controlled by Discord activity privacy settings.'
        } else { Write-Host ('Waiting for Discord: ' + $status.error) }
    } else { Write-Host 'Waiting for Discord to confirm activity for this process.' }
}
switch ($Action) {
    'start' {
        if (!@(Get-RpcProcesses).Count) {
            Remove-Item -LiteralPath $statusFile -ErrorAction SilentlyContinue
            if (!(Test-Path -LiteralPath (Join-Path $rpcRoot 'config.json'))) { throw 'Copy config.example.json to config.json and set your Application ID first.' }
            $node = (Get-Command node.exe -ErrorAction Stop).Source
            $child = Start-Process -FilePath $node -ArgumentList ('"' + $entry + '"') -WorkingDirectory $rpcRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $rpcRoot 'console.log') -RedirectStandardError (Join-Path $rpcRoot 'error.log') -PassThru
            Start-Sleep -Seconds 3
            if ($child.HasExited) { throw ('LaplaceRPC exited: ' + (Get-Content -LiteralPath (Join-Path $rpcRoot 'error.log') -Raw)) }
        }
        Show-Status
    }
    'stop' {
        $running = @(Get-RpcProcesses)
        foreach ($item in $running) {
            Stop-Process -Id $item.ProcessId -ErrorAction Stop
            Wait-Process -Id $item.ProcessId -Timeout 10 -ErrorAction SilentlyContinue
        }
        if (@(Get-RpcProcesses).Count) { throw 'A LaplaceRPC process is still running.' }
        Remove-Item -LiteralPath $statusFile -ErrorAction SilentlyContinue
        Show-Status
    }
    'status' { Show-Status }
    'enable-startup' {
        $launcher = Join-Path $rpcRoot 'control-rpc.ps1'
        $vbs = 'CreateObject("WScript.Shell").Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""' + $launcher.Replace('"','""') + '"" start", 0, False'
        Set-Content -LiteralPath $startupFile -Value $vbs -Encoding Unicode
        Write-Host 'LaplaceRPC automatic startup enabled.'
    }
    'disable-startup' {
        if (Test-Path -LiteralPath $startupFile) { Remove-Item -LiteralPath $startupFile }
        Write-Host 'LaplaceRPC automatic startup disabled.'
    }
}
