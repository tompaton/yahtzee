import { createStore } from "solid-js/store";
import { For } from "solid-js";

import styles from './App.module.css';


const [state, setState] = createStore({
  roll: [1, 2, 3, 4, 5], roll_input: "",
  players: [
    {
      name: 'Tom', current: true,
      scores: {
        "ones": [[1, 1, 1, 2, 3]],
        "twos": [[2, 3, 4, 5, 6], [2, 2, 3, 4, 5]],
        "threes": [[5, 5, 5, 5, 5]],
        "fours": [[4, 4, 4, 2, 1]],
        "fives": [[5, 5, 5, 5, 5]],
        "sixes": [[6, 6, 6, 6, 1]],
        "triple": [[3, 3, 3, 2, 2]],
        "quad": [[3, 3, 3, 2, 2]],
        "fullhouse": [[3, 3, 3, 2, 2]],
        "small": [[1, 3, 4, 5, 6]],
        "large": [[2, 3, 4, 5, 6]],
        "yahtzee": [[6, 6, 6, 6, 6], [5, 5, 5, 5, 5]],
        "chance": [[1, 1, 1, 1, 1]],
      }
    },
    {
      name: 'P2', current: false,
      scores: {
        "ones": [],
        "twos": [],
        "threes": [],
        "fours": [],
        "fives": [],
        "sixes": [],
        "triple": [],
        "quad": [],
        "fullhouse": [],
        "small": [],
        "large": [],
        "yahtzee": [],
        "chance": [],
      }
    }
  ]
});


function zeroScores() {
  let i = 0;
  for (const player of state.players) {
    for (const row in player.scores)
      setState("players", i, "scores", row, []);
    i++;
  }
}

function roll() {
  for (let i = 0; i < 5; i++)
    setState("roll", i, Math.ceil(6.0 * Math.random()));
}

function setRoll(roll_string) {
  const result = [];
  let remainder = "";

  for (let i = 0; i < roll_string.length; i++) {
    let c = roll_string.charAt(i);
    if (c == '1' || c == '2' || c == '3' || c == '4' || c == '5' || c == '6') {
      result.push(+c);
      remainder += c;
    }
  }

  if (result.length == 5) {
    for (let i = 0; i < 5; i++)
      setState("roll", i, result[i]);
    setState("roll_input", "");
  } else {
    setState("roll_input", remainder);
  }
}

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
          <nav>
            <RollInput />
            <button onClick={() => roll()}>Roll</button>
          </nav>
          <Roll />
        </section>
        <section>
          <nav>
            <button onClick={() => zeroScores()}>Zero</button>
          </nav>
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

function isTuple(N) {
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
  return Math.max(0, total - 100);
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

  const score_upper_subtotal = (scores) => {
    return score_ones(scores)
      + score_twos(scores)
      + score_threes(scores)
      + score_fours(scores)
      + score_fives(scores)
      + score_sixes(scores);
  };
  const score_upper_bonus = (scores) => { return score_upper_subtotal(scores) >= 63 ? 35 : 0 };
  const score_upper_total = (scores) => { return score_upper_subtotal(scores) + score_upper_bonus(scores) };

  const score_triple = (scores) => totalAll(isTuple(3), scores["triple"]);
  const score_quad = (scores) => totalAll(isTuple(4), scores["quad"]);
  const score_fullhouse = (scores) => totalIf(25, isFullHouse, scores.fullhouse);
  const score_small = (scores) => totalIf(30, isStraight(4), scores.small);
  const score_large = (scores) => totalIf(40, isStraight(5), scores.large);
  const score_yahtzee = (scores) => totalIf(50, isYahtzee, scores.yahtzee);
  const score_chance = (scores) => totalAll(isChance, scores.chance);

  const score_yahtzee_bonus = (scores) => yahtzeeBonus(scores.yahtzee);

  const score_lower_total = (scores) => {
    return score_triple(scores)
      + score_quad(scores)
      + score_fullhouse(scores)
      + score_small(scores)
      + score_large(scores)
      + score_yahtzee(scores)
      + score_chance(scores)
      + score_yahtzee_bonus(scores);
  };
  const score_total = (scores) => { return score_upper_total(scores) + score_lower_total(scores) };

  const td_value = (player, row, score) => {
    if (player.scores[row].length == 0) {
      if (player.current)
        return <Maybe val={() => score({ [row]: [state.roll] })} />;
      else return '';
    }
    return <Actual val={() => score(player.scores)} />;
  };

  const td_ones = (player) => td_value(player, 'ones', score_ones);
  const td_twos = (player) => td_value(player, 'twos', score_twos);
  const td_threes = (player) => td_value(player, 'threes', score_threes);
  const td_fours = (player) => td_value(player, 'fours', score_fours);
  const td_fives = (player) => td_value(player, 'fives', score_fives);
  const td_sixes = (player) => td_value(player, 'sixes', score_sixes);

  const td_upper_subtotal = (player) => score_upper_subtotal(player.scores);
  const td_upper_bonus = (player) => score_upper_bonus(player.scores);

  const td_upper_total = (player) => score_upper_total(player.scores);

  const td_triple = (player) => td_value(player, 'triple', score_triple);
  const td_quad = (player) => td_value(player, 'quad', score_quad);
  const td_fullhouse = (player) => td_value(player, 'fullhouse', score_fullhouse);
  const td_small = (player) => td_value(player, 'small', score_small);
  const td_large = (player) => td_value(player, 'large', score_large);
  const td_yahtzee = (player) => td_value(player, 'yahtzee', score_yahtzee);
  const td_chance = (player) => td_value(player, 'chance', score_chance);
  const td_yahtzee_bonus = (player) => score_yahtzee_bonus(player.scores);

  const td_lower_total = (player) => score_lower_total(player.scores);
  const td_total = (player) => score_total(player.scores);

  return (
    <table class={styles.scores}>
      <tbody>
        <Row class="head" label="Upper Section" th={(player) => player.name} />
        <Row label="Aces" td={td_ones} />
        <Row label="Twos" td={td_twos} />
        <Row label="Threes" td={td_threes} />
        <Row label="Fours" td={td_fours} />
        <Row label="Fives" td={td_fives} />
        <Row label="Sixes" td={td_sixes} />
        <Row class="foot" label="Total" td={td_upper_subtotal} />
        <Row class="foot" label="Bonus" td={td_upper_bonus} />
        <Row class="foot" label="Total" td={td_upper_total} />

        <Row class="head" label="Lower Section" td={(player) => ''} />
        <Row label="3 of a Kind" td={td_triple} />
        <Row label="4 of a Kind" td={td_quad} />
        <Row label="Full House" td={td_fullhouse} />
        <Row label="Small Straight" td={td_small} />
        <Row label="Large Straight" td={td_large} />
        <Row label="YAHTZEE" td={td_yahtzee} />
        <Row label="Chance" td={td_chance} />
        <Row label="YAHTZEE BONUS" td={td_yahtzee_bonus} />

        <Row class="foot" label="Lower Section Total" td={td_lower_total} />
        <Row class="foot" label="Upper Section Total" td={td_upper_total} />
        <Row class="foot" label="Grand Total" td={td_total} />
      </tbody>
    </table>
  )
}

function Row(props) {
  const { label: label, th: player_th, td: player_td, ...attrs } = props;
  return (
    <tr {...attrs}>
      <th>{label}</th>
      <For each={state.players}>
        {(player) => {
          if (player_th) return <th>{player_th(player)}</th>;
          if (player_td) return <td>{player_td(player)}</td>;
        }}
      </For>
    </tr>
  );
}

function Actual(props) {
  const { val } = props;
  return <span class={styles.actual}>{val}</span>;
}

function Maybe(props) {
  const { val } = props;
  return <span class={styles.maybe}>{val}</span>;
}


function RollInput() {
  const roll_string = () => {
    let s = "";
    for (const i of state.roll)
      s += i.toString();
    return s;
  };

  return (
    <input onInput={(e) => setRoll(e.currentTarget.value)}
      minlength={5} maxLength={5} size={5}
      value={state.roll_input}
      placeholder={roll_string()}
      style={{ "margin-right": "2em" }}
    />
  );
}

function Roll() {
  return (
    <table>
      <tbody>
        <tr>
          <For each={state.roll}>
            {(die) => <td><Die face={die} /></td>}
          </For>
        </tr>
      </tbody>
    </table>
  );
}

const DOTS = { 1: [7], 2: [3, 4], 3: [3, 4, 7], 4: [1, 3, 4, 6], 5: [1, 3, 4, 6, 7], 6: [1, 2, 3, 4, 5, 6] };
function Die(props) {
  const { face } = props;
  return <div class={styles.face} title={face}><For each={DOTS[face]}>{(dot) => <div class={styles['dot' + dot]} />}</For></div>;
}

export default App;
