#!/bin/sh

HASH=`git log --pretty=format:%h  HEAD^..HEAD|head -n1`
GITBRANCH=`git branch | grep \* | cut -d ' ' -f2-`
GITTAG=`git describe --abbrev=0 --tags 2>/dev/null`
##CDATE=`git log --pretty=format:%ci  HEAD^..HEAD|head -n1`

#m4 -d -DRELEASENUMBER="${HASH}" -DGITTAG="${GITTAG}"
#sed -e "s/\"releasenumber\": *\"[a-f0-9]*\"/\"releasenumber\": \"RELEASENUMBER\"/;s/\"gittag\": *\"[a-f0-9.]*\"/\"gittag\": \"GITTAG\"/"
sed -e "s/\"releasenumber\": *\"RELEASENUMBER\"/\"releasenumber\": \"${HASH}\"/;s/\"gittag\": *\"GITTAG\"/\"gittag\": \"${GITTAG}\"/;s/\"gitbranch\": *\"GITBRANCH\"/\"gitbranch\": \"${GITBRANCH}\"/"
