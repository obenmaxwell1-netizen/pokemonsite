$utf8 = New-Object System.Text.UTF8Encoding $false
$files = Get-ChildItem -Path "d:\Maxwell pokemon site" -Recurse -Include *.html,*.js,*.ts -Exclude node_modules
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, $utf8)
    $newContent = $content -replace 'contact@pokemoncenter\.com', 'support@pokeemoncenter.com'
    $newContent = $newContent -replace 'contact@xn--pokemoncenter-dhb\.com', 'support@pokeemoncenter.com'
    $newContent = $newContent -replace 'orders@xn--pokemoncenter-dhb\.com', 'support@pokeemoncenter.com'
    $newContent = $newContent -replace 'contact@pokeemoncenter\.com', 'support@pokeemoncenter.com'
    $newContent = $newContent -replace 'admin@pokemoncenter\.com', 'admin@pokeemoncenter.com'
    if ($content -ne $newContent) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8)
        Write-Host "Updated $($file.FullName)"
    }
}
