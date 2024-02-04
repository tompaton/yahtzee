import { createStore } from "solid-js/store";
import { For } from "solid-js";

import styles from './App.module.css';


const [state, setState] = createStore({
  players: [
    {
      name: 'Tom',
      scores: {
        "ones": [[1, 1, 1, 2, 3]],
        "twos": [[2, 3, 4, 5, 6], [2, 2, 3, 4, 5]],
        "threes": [[5, 5, 5, 5, 5]],
        "fours": [[4, 4, 4, 2, 1]],
        "fives": [[5, 5, 5, 5, 5]],
        "sixes": [[6, 6, 6, 6, 1]],
        "3ofakind": [[3, 3, 3, 2, 2]],
        "4ofakind": [[3, 3, 3, 2, 2]],
        "fullhouse": [[3, 3, 3, 2, 2]],
        "smstraight": [[1, 3, 4, 5, 6]],
        "lgstraight": [[2, 3, 4, 5, 6]],
        "yahtzee": [[6, 6, 6, 6, 6], [5, 5, 5, 5, 5]],
        "chance": [[1, 1, 1, 1, 1]],
      }
    },
    {
      name: 'P2',
      scores: {
        "ones": [],
        "twos": [],
        "threes": [],
        "fours": [],
        "fives": [],
        "sixes": [],
        "3ofakind": [],
        "4ofakind": [],
        "fullhouse": [],
        "smstraight": [],
        "lgstraight": [],
        "yahtzee": [],
        "chance": [],
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

function countDice(dice) {
  const counts = {};
  for (const die of dice)
    counts[die] = (counts[die] || 0) + 1;
  return counts;
}

function isNofakind(N) {
  return (dice) => {
    const counts = countDice(dice);

    for (let i = 1; i <= 6; i++)
      if (counts[i] >= N) return true;

    return false;
  };
}

function isFullHouse(dice) {
  const counts = countDice(dice);

  let pair = false, triple = false;
  for (let i = 1; i <= 6; i++) {
    if (counts[i] == 2) pair = true;
    if (counts[i] == 3) triple = true;
  }

  return pair && triple;
}

function isStraight(length) {
  return (dice) => {
    const counts = countDice(dice);

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
  return total - 100;
}

function isChance(dice) {
  return true;
}

function ScoreSheet() {
  const score_ones = (scores) => totalJust(1, scores.ones);
  const score_twos = (scores) => totalJust(2, scores.twos);
  const score_threes = (scores) => totalJust(3, scores.threes);
  const score_fours = (scores) => totalJust(4, scores.fours);
  const score_fives = (scores) => totalJust(5, scores.fives);
  const score_sixes = (scores) => totalJust(6, scores.sixes);

  const score_upper_subtotal = (scores) => { return score_ones(scores) + score_twos(scores) + score_threes(scores) + score_fours(scores) + score_fives(scores) + score_sixes(scores) };
  const score_upper_bonus = (scores) => { return score_upper_subtotal(scores) >= 63 ? 35 : 0 };
  const score_upper_total = (scores) => { return score_upper_subtotal(scores) + score_upper_bonus(scores) };

  const score_3ofakind = (scores) => totalAll(isNofakind(3), scores["3ofakind"]);
  const score_4ofakind = (scores) => totalAll(isNofakind(4), scores["4ofakind"]);
  const score_fullhouse = (scores) => totalIf(25, isFullHouse, scores.fullhouse);
  const score_smstraight = (scores) => totalIf(30, isStraight(4), scores.smstraight);
  const score_lgstraight = (scores) => totalIf(40, isStraight(5), scores.lgstraight);
  const score_yahtzee = (scores) => totalIf(50, isYahtzee, scores.yahtzee);
  const score_chance = (scores) => totalAll(isChance, scores.chance);

  const score_yahtzee_bonus = (scores) => yahtzeeBonus(scores.yahtzee);

  const score_lower_total = (scores) => { return score_3ofakind(scores) + score_4ofakind(scores) + score_fullhouse(scores) + score_smstraight(scores) + score_lgstraight(scores) + score_yahtzee(scores) + score_chance(scores) + score_yahtzee_bonus(scores) };
  const score_total = (scores) => { return score_upper_total(scores) + score_lower_total(scores) };

  const td_value = (player, row, score) => {
    if (player.scores[row].length == 0) return '';
    return score(player.scores);
  };
  const td_ones = (player) => td_value(player, 'ones', score_ones);
  const td_twos = (player) => td_value(player, 'twos', score_twos);
  const td_threes = (player) => td_value(player, 'threes', score_threes);
  const td_fours = (player) => td_value(player, 'fours', score_fours);
  const td_fives = (player) => td_value(player, 'fives', score_fives);
  const td_sixes = (player) => td_value(player, 'sixes', score_sixes);

  const td_upper_subtotal = (player) => score_upper_subtotal(player.scores);
  const td_upper_bonus = (player) => {
    for (const row of ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'])
      if (player.scores[row].length == 0) return '';
    return score_upper_bonus(player.scores);
  };
  const td_upper_total = (player) => score_upper_total(player.scores);

  const td_3ofakind = (player) => score_3ofakind(player.scores);
  const td_4ofakind = (player) => score_4ofakind(player.scores);
  const td_fullhouse = (player) => score_fullhouse(player.scores);
  const td_smstraight = (player) => score_smstraight(player.scores);
  const td_lgstraight = (player) => score_lgstraight(player.scores);
  const td_yahtzee = (player) => score_yahtzee(player.scores);
  const td_chance = (player) => score_chance(player.scores);
  const td_yahtzee_bonus = (player) => score_yahtzee_bonus(player.scores);

  const td_lower_total = (player) => score_lower_total(player.scores);
  const td_total = (player) => score_total(player.scores);

  return (
    <table>
      <tbody>
        <tr class="head">
          <th>Upper Section</th>
          <For each={state.players}>{(player) =>
            <th>{player.name}</th>
          }</For>
        </tr>
        <tr>
          <th>Aces</th>
          <For each={state.players}>{(player) =>
            <td>{td_ones(player)}</td>
          }</For>
        </tr>
        <tr>
          <th>Twos</th>
          <td>{td_twos(state.players[0])}</td>
        </tr>
        <tr>
          <th>Threes</th>
          <td>{td_threes(state.players[0])}</td>
        </tr>
        <tr>
          <th>Fours</th>
          <td>{td_fours(state.players[0])}</td>
        </tr>
        <tr>
          <th>Fives</th>
          <td>{td_fives(state.players[0])}</td>
        </tr>
        <tr>
          <th>Sixes</th>
          <td>{td_sixes(state.players[0])}</td>
        </tr>
        <tr class="foot">
          <th>Total</th>
          <td>{td_upper_subtotal(state.players[0])}</td>
        </tr>
        <tr class="foot">
          <th>Bonus</th>
          <td>{td_upper_bonus(state.players[0])}</td>
        </tr>
        <tr class="foot">
          <th>Total</th>
          <td>{td_upper_total(state.players[0])}</td>
        </tr>

        <tr class="head">
          <th>Lower Section</th>
          <td></td>
        </tr>
        <tr>
          <th>3 of a Kind</th>
          <td>{td_3ofakind(state.players[0])}</td>
        </tr>
        <tr>
          <th>4 of a Kind</th>
          <td>{td_4ofakind(state.players[0])}</td>
        </tr>
        <tr>
          <th>Full House</th>
          <td>{td_fullhouse(state.players[0])}</td>
        </tr>
        <tr>
          <th>Small Straight</th>
          <td>{td_smstraight(state.players[0])}</td>
        </tr>
        <tr>
          <th>Large Straight</th>
          <td>{td_lgstraight(state.players[0])}</td>
        </tr>
        <tr>
          <th>YAHTZEE</th>
          <td>{td_yahtzee(state.players[0])}</td>
        </tr>
        <tr>
          <th>Chance</th>
          <td>{td_chance(state.players[0])}</td>
        </tr>
        <tr>
          <th>YAHTZEE BONUS</th>
          <td>{td_yahtzee_bonus(state.players[0])}</td>
        </tr>
        <tr class="foot">
          <th>Lower Section Total</th>
          <td>{td_lower_total(state.players[0])}</td>
        </tr>
        <tr class="foot">
          <th>Upper Section Total</th>
          <td>{td_upper_total(state.players[0])}</td>
        </tr>
        <tr class="foot">
          <th>Grand Total</th>
          <td>{td_total(state.players[0])}</td>
        </tr>

      </tbody>
    </table>
  )
}

export default App;
