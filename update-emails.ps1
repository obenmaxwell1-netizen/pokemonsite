$files = Get-ChildItem -Path 'd:\Maxwell pokemon site' -Recurse -Include *.html, *.js, *.ts
foreach ($f in $files) {
    if ($f.FullName -match 'node_modules|\.git') { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $updated = $content -replace 'contact@pokemoncenter\.com', 'support@pokeemoncenter.com'
    $updated = $updated -replace 'contact@pokéemoncenter\.com', 'support@pokeemoncenter.com'
    $updated = $updated -replace 'orders@xn--pokemoncenter-dhb\.com', 'support@pokeemoncenter.com'
    $updated = $updated -replace 'contact@xn--pokemoncenter-dhb\.com', 'support@pokeemoncenter.com'
    if ($content -ne $updated) {
        [System.IO.File]::WriteAllText($f.FullName, $updated, [System.Text.Encoding]::UTF8)
        Write-Host "Updated "
    }
}
