#!/usr/bin/env bash
set -euo pipefail
# Run from an extracted Reading Racer Linux archive. No administrator access required.
source_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
app_dir="${XDG_DATA_HOME:-$HOME/.local/share}/reading-racer"
launcher_dir="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$app_dir" "$launcher_dir"
cp -a "$source_dir"/. "$app_dir"/
chmod +x "$app_dir/reading-racer"
cat > "$launcher_dir/reading-racer.desktop" <<DESKTOP
[Desktop Entry]
Name=Reading Racer
Comment=Offline learning adventures for little pilots
Exec="$app_dir/reading-racer"
Icon=$app_dir/resources/app/dist/icons/icon-512.png
Terminal=false
Type=Application
Categories=Education;Game;
StartupWMClass=reading-racer
DESKTOP
printf 'Reading Racer is installed. Find it in your application menu.\n'
