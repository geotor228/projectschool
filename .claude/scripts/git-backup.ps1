$repoPath = "C:\Users\User\projectschool"
$logFile = Join-Path $repoPath ".claude\scripts\git-backup.log"
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

Add-Content -Path $logFile -Value "$timestamp - task started"

try {
    Set-Location $repoPath
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    git add -A
    $changes = git status --porcelain
    if ($changes) {
        git commit -m "Automated backup $timestamp" | Out-Null
        git push origin main | Out-Null
        Add-Content -Path $logFile -Value "$timestamp - backed up ($($changes.Count) changed files)"
    } else {
        Add-Content -Path $logFile -Value "$timestamp - no changes"
    }
} catch {
    Add-Content -Path $logFile -Value "$timestamp - ERROR: $($_.Exception.Message)"
}
