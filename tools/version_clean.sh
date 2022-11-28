#!/bin/sh

sed -e 's/"releasenumber": *"[a-f0-9]*"/"releasenumber": "RELEASENUMBER"/;s/"gittag": *"[a-f0-9.]*"/"gittag": "GITTAG"/;s/"gitbranch": *"[-A-Za-z0-9_.()]*"/"gitbranch": "GITBRANCH"/'
