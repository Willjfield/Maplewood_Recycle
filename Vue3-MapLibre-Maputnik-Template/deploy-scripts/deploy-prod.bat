git checkout develop
git add -A
git commit -m "prod build"
git checkout deploy-prod
git pull
git add -A
git commit -m "prep merge"
git merge develop
git add -A
git commit -m "prod build"
git push
git checkout develop