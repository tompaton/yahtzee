#!/bin/bash

npm run build

cp dist/index.html ~/dev/tompaton.com/html/pages/yahtzee.html
rm -f ~/dev/tompaton.com/html/pages/yahtzee/index.*
cp -r dist/yahtzee ~/dev/tompaton.com/html/pages/
