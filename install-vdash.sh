#!/bin/sh

# Setează variabilele
FOLDER="./src/games/dino/vdash-utils"
REPO_URL="https://github.com/NETHLAB/victor-vdash-utils.git"
BRANCH="main"

if [ ! -d "$FOLDER" ]; then
  git clone "$REPO_URL" "$FOLDER"
else
  cd "$FOLDER" || exit 1
  git fetch
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
  cd ../../../../
fi
