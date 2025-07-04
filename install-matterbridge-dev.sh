#!/bin/bash
# install-matterbridge-dev.sh
# This script globally installs Matterbridge from the dev branch.
# To be used inside the Dev Container only with the mounted matterbridge volume.

echo "Installing Matterbridge from the dev branch..."
set -e
cd /
if [ ! -d "/workspaces" ]; then
  echo "Directory /workspaces does not exist. Exiting."
  exit 1
fi
sudo chown -R node:node matterbridge
sudo chmod g+s matterbridge
rm -rf matterbridge/* matterbridge/.[!.]* matterbridge/..?*
git clone -b dev https://github.com/Luligu/matterbridge.git matterbridge
cd matterbridge
npm ci
npm run build
npm install . --global
rm -rf .git .github .vscode docker screenshot
echo "Matterbridge has been installed from the dev branch."