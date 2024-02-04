import { createStore } from "solid-js/store";

import styles from './App.module.css';


const [state, setState] = createStore({
  players: [
    {
      name: 'Tom',
      scores: {
        "ones": [[1, 1, 1, 2, 3]],
        "twos": [[2, 3, 4, 5, 6], [2, 2, 3, 4, 5]],
        "threes": [[5, 5, 5, 5, 5]],
        "fours": [],
        "fives": [[5, 5, 5, 5, 5]],
        "sixes": [],
        "3ofakind": [[3, 3, 3, 2, 2]],
        "4ofakind": [[3, 3, 3, 2, 2]],
        "fullhouse": [[3, 3, 3, 2, 2]],
        "smstraight": [[1, 3, 4, 5, 6]],
        "lgstraight": [[2, 3, 4, 5, 6]],
        "yahtzee": [[6, 6, 6, 6, 6], [5, 5, 5, 5, 5]],
        "chance": [[1, 1, 1, 1, 1]],
      }
    }
  ]
});


function App() {

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>
          Yahtzee Scoresheet
        </h1>
      </header>
      <article>
        <section>
          <ScoreSheet />
        </section>
      </article>
    </div>
  );
}

function totalJust(val, rolls) {
  if (rolls.length == 0) return 0;
  const dice = rolls[rolls.length - 1];

  var total = 0;
  for (const die of dice)
    if (die == val) {
      total += die;
    }
  return total;
}

function totalAll(check, rolls) {
  if (rolls.length == 0) return 0;
  const dice = rolls[rolls.length - 1];

  if (!check(dice)) return 0;

  var total = 0;
  for (const die of dice)
    total += die;
  return total;
}

function totalIf(score, check, rolls) {
  if (rolls.length == 0) return 0;
  const dice = rolls[rolls.length - 1];

  if (check(dice)) return score;
  else return 0;
}

function is3ofakind(dice) {
  const counts = {};
  for (const die of dice)
    counts[die] = (counts[die] || 0) + 1;

  for (let i = 1; i <= 6; i++)
    if (counts[i] >= 3) return true;

  return false;
}

function is4ofakind(dice) {
  const counts = {};
  for (const die of dice)
    counts[die] = (counts[die] || 0) + 1;

  for (let i = 1; i <= 6; i++)
    if (counts[i] >= 4) return true;

  return false;
}

function isFullHouse(dice) {
  const counts = {};
  for (const die of dice)
    counts[die] = (counts[die] || 0) + 1;

  let pair = false, triple = false;
  for (let i = 1; i <= 6; i++) {
    if (counts[i] == 2) pair = true;
    if (counts[i] == 3) triple = true;
  }

  return pair && triple;
}

function isStraight(length) {
  return (dice) => {
    const counts = {};
    for (const die of dice)
      counts[die] = (counts[die] || 0) + 1;

    if (length == 4) {
      if (counts[1] && counts[2] && counts[3] && counts[4]) return true;
      if (counts[2] && counts[3] && counts[4] && counts[5]) return true;
      if (counts[3] && counts[4] && counts[5] && counts[6]) return true;
    }
    if (length == 5) {
      if (counts[1] && counts[2] && counts[3] && counts[4] && counts[5]) return true;
      if (counts[2] && counts[3] && counts[4] && counts[5] && counts[6]) return true;
    }
    return false;
  };
}

function isYahtzee(dice) {
  return dice[0] == dice[1] && dice[1] == dice[2] && dice[2] == dice[3] && dice[3] == dice[4];
}

function yahtzeeBonus(rolls) {
  let total = 0;
  for (const roll of rolls)
    if (isYahtzee(roll)) total += 100;
  return total;
}

function isChance(dice) {
  return true;
}

function ScoreSheet() {
  const score_ones = () => totalJust(1, state.players[0].scores.ones);
  const score_twos = () => totalJust(2, state.players[0].scores.twos);
  const score_threes = () => totalJust(3, state.players[0].scores.threes);
  const score_fours = () => totalJust(4, state.players[0].scores.fours);
  const score_fives = () => totalJust(5, state.players[0].scores.fives);
  const score_sixes = () => totalJust(6, state.players[0].scores.sixes);

  const score_upper_subtotal = () => { return score_ones() + score_twos() + score_threes() + score_fours() + score_fives() + score_sixes() };
  const score_upper_bonus = () => { return score_upper_subtotal() >= 63 ? 35 : 0 };
  const score_upper_total = () => { return score_upper_subtotal() + score_upper_bonus() };

  const score_3ofakind = () => totalAll(is3ofakind, state.players[0].scores["3ofakind"]);
  const score_4ofakind = () => totalAll(is4ofakind, state.players[0].scores["4ofakind"]);
  const score_fullhouse = () => totalIf(25, isFullHouse, state.players[0].scores.fullhouse);
  const score_smstraight = () => totalIf(30, isStraight(4), state.players[0].scores.smstraight);
  const score_lgstraight = () => totalIf(40, isStraight(5), state.players[0].scores.lgstraight);
  const score_yahtzee = () => totalIf(50, isYahtzee, state.players[0].scores.yahtzee);
  const score_chance = () => totalAll(isChance, state.players[0].scores.chance);

  const score_yahtzee_bonus = () => yahtzeeBonus(state.players[0].scores.yahtzee);

  const score_lower_total = () => { return score_3ofakind() + score_4ofakind() + score_fullhouse() + score_smstraight() + score_lgstraight() + score_yahtzee() + score_chance() + score_yahtzee_bonus() };
  const score_total = () => { return score_upper_total() + score_lower_total() };

  const td_ones = () => score_ones();
  const td_twos = () => score_twos();
  const td_threes = () => score_threes();
  const td_fours = () => score_fours();
  const td_fives = () => score_fives();
  const td_sixes = () => score_sixes();

  const td_upper_subtotal = () => score_upper_subtotal();
  const td_upper_bonus = () => score_upper_bonus();
  const td_upper_total = () => score_upper_total();

  const td_3ofakind = () => score_3ofakind();
  const td_4ofakind = () => score_4ofakind();
  const td_fullhouse = () => score_fullhouse();
  const td_smstraight = () => score_smstraight();
  const td_lgstraight = () => score_lgstraight();
  const td_yahtzee = () => score_yahtzee();
  const td_chance = () => score_chance();
  const td_yahtzee_bonus = () => score_yahtzee_bonus();

  const td_lower_total = () => score_lower_total();
  const td_total = () => score_total();

  return (
    <table>
      <tbody>
        <tr class="head">
          <th>Upper Section</th>
          <th>{state.players[0].name}</th>
        </tr>
        <tr>
          <th>Aces</th>
          <td>{td_ones()}</td>
        </tr>
        <tr>
          <th>Twos</th>
          <td>{td_twos()}</td>
        </tr>
        <tr>
          <th>Threes</th>
          <td>{td_threes()}</td>
        </tr>
        <tr>
          <th>Fours</th>
          <td>{td_fours()}</td>
        </tr>
        <tr>
          <th>Fives</th>
          <td>{td_fives()}</td>
        </tr>
        <tr>
          <th>Sixes</th>
          <td>{td_sixes()}</td>
        </tr>
        <tr class="foot">
          <th>Total</th>
          <td>{td_upper_subtotal()}</td>
        </tr>
        <tr class="foot">
          <th>Bonus</th>
          <td>{td_upper_bonus()}</td>
        </tr>
        <tr class="foot">
          <th>Total</th>
          <td>{td_upper_total()}</td>
        </tr>
        <tr class="head">
          <th>Lower Section</th>
          <td></td>
        </tr>
        <tr>
          <th>3 of a Kind</th>
          <td>{td_3ofakind()}</td>
        </tr>
        <tr>
          <th>4 of a Kind</th>
          <td>{td_4ofakind()}</td>
        </tr>
        <tr>
          <th>Full House</th>
          <td>{td_fullhouse()}</td>
        </tr>
        <tr>
          <th>Small Straight</th>
          <td>{td_smstraight()}</td>
        </tr>
        <tr>
          <th>Large Straight</th>
          <td>{td_lgstraight()}</td>
        </tr>
        <tr>
          <th>YAHTZEE</th>
          <td>{td_yahtzee()}</td>
        </tr>
        <tr>
          <th>Chance</th>
          <td>{td_chance()}</td>
        </tr>
        <tr>
          <th>YAHTZEE BONUS</th>
          <td>{td_yahtzee_bonus()}</td>
        </tr>
        <tr class="foot">
          <th>Lower Section Total</th>
          <td>{td_lower_total()}</td>
        </tr>
        <tr class="foot">
          <th>Upper Section Total</th>
          <td>{td_upper_total()}</td>
        </tr>
        <tr class="foot">
          <th>Grand Total</th>
          <td>{td_total()}</td>
        </tr>
      </tbody>
    </table>
  )
}

export default App;
