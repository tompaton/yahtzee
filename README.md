# Yahtzee Scoresheet

Yahtzee scoresheet/game/helper page.

* Play Yahtzee online with 1 or more players
* Or you can directly enter dice rolls to score a game
* Some hints are provided to help play an optimal game

The page also stores a history of game scores.

Note that all data is stored locally on your device.

## Hints

* Probabilities  
  Basic calculation of probability of rolling dice required to score on each row
  based on current dice.  
  This is naive because it doesn't consider re-rolls.

* Forfeitted points  
  The best scoring row may in fact minimize the number of points forfeitted, 
  rather than maximize the score itself.

* Identifying the current roll  
  Sometimes it's just helpful to have straights etc. automatically identified
  so you don't inadvertently re-roll.


## Development

```bash
$ npm install # or pnpm install or yarn install
```

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)


(c) 2024 Tom Paton  https://tompaton.com/


# TODO

- copyright/links to tompaton.com

- allow selecting players from history
- compute some stats in history for each player (min, max, average, quartiles...)
- compute probabilities including re-rolls, hints at re-roll strategy

- improved mobile/ipad layout
  - separate page for all scores, only show current player
  - hide filled rows