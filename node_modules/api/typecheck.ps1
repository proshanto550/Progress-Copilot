$ErrorActionPreference = 'Continue'
$output = & 'C:\nvm4w\nodejs\node.exe' 'C:\nvm4w\nodejs\node_modules\typescript\bin\tsc' '--noEmit' '--ignoreDeprecations' '6.0' 2>&1
$output | Select-Object -First 200
exit 0