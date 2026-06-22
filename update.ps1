$utf8 = New-Object System.Text.UTF8Encoding $false
$cart = [System.IO.File]::ReadAllText('d:\Maxwell pokemon site\cart.html', $utf8)
$cart = $cart -replace '(?i)#8B5CF6', '#d4af37' -replace '(?i)#7C3AED', '#b8860b'
[System.IO.File]::WriteAllText('d:\Maxwell pokemon site\cart.html', $cart, $utf8)

$ts = [System.IO.File]::ReadAllText('d:\Maxwell pokemon site\supabase\functions\send-invoice\index.ts', $utf8)
$ts = $ts -replace 're_F9LM1idE_GeEtTYTLZXb6oM7Qk22QyzFA', 're_SLiYyaJt_M6XvRLR8grHpaEiZRetStmgf'
$ts = $ts.Replace('Pokémon Center', 'Pokeemon Center')
$ts = $ts.Replace('pokéemoncenter.com', 'pokeemoncenter.com')
[System.IO.File]::WriteAllText('d:\Maxwell pokemon site\supabase\functions\send-invoice\index.ts', $ts, $utf8)

$inv = [System.IO.File]::ReadAllText('d:\Maxwell pokemon site\invoice.html', $utf8)
$inv = $inv -replace '(?i)#8B5CF6', '#d4af37' -replace '(?i)#7C3AED', '#b8860b'
$inv = $inv.Replace('Pokémon Center', 'Pokeemon Center')
[System.IO.File]::WriteAllText('d:\Maxwell pokemon site\invoice.html', $inv, $utf8)
