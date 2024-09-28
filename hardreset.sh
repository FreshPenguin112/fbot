proot-distro reset ubuntu && echo "apt update && apt install -y --reinstall nodejs python3 procps inotify-tools lsof rsync" | proot-distro login ubuntu --isolated
