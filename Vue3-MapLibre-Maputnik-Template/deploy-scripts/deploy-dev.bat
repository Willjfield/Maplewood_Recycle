git checkout develop
git add -A
git commit -m "dev build"
git checkout deploy-dev
git pull
git add -A
git commit -m "prep merge"
git merge develop
git add -A
git commit -m "dev build"
git push
git checkout develop