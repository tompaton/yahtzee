# Yahtzee Scoresheet

## TODO

Solidjs Yahtzee score sheet

Suggest optimal row to score roll
 - rather than picking the highest score, it might be best to minimize the loss?
 - max 4s is 20, so a 16 there forfeits 4 possible points.
 - max chance is 30, so a 16 there forfeits 14 possible points.

Suggest which dice to reroll

Optimise for marginal value of score and collection of bonuses

Show probabilities of outcomes from current dice

Solidjs values/formulas for each score/total etc. show probability if row is still open, potential score when roll is complete, actual score once locked in.

Keep a history of rolls with alternate could-have-been scenarios


## Usage


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
