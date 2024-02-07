import { createStore } from "solid-js/store";
import { For, Switch, Match } from "solid-js";

import styles from './App.module.css';


const [state, setState] = createStore({
  roll: [null, null, null, null, null],
  roll_input: "",
  hold: [false, true, true, false, false],
  rerolls: 3,
  players: [
    {
      name: 'Tom',
      current: true,
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
      name: 'P2',
      current: false,
      scores: blankScores()
    }
  ]
});


function blankScores() {
  return {
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
  };
}

function zeroScores() {
  const current_names = Array.from(state.players, (player) => player.name).join(', ');
  const names = prompt("Player names? (comma separated)", current_names);
  if (names === null) return;

  const newPlayer = (player) => {
    return {
      'name': player.trim(),
      'current': false,
      'scores': blankScores()
    };
  }
  setState('players', Array.from(names.split(','), newPlayer));
  setState('players', 0, 'current', true);
  clearRoll();
}

function toggleHold(i) {
  setState("hold", i, !state.hold[i]);
}

function rollDice() {
  for (let i = 0; i < 5; i++)
    if (!state.hold[i])
      setState("roll", i, Math.ceil(6.0 * Math.random()));

  setState("rerolls", state.rerolls - 1);
  if (state.rerolls == 0)
    setState('hold', [true, true, true, true, true]);
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

function setScore(player, row, roll) {
  // special case for yahtzee bonus:
  // first yahtzee can be filled in to any row you like, but putting it anywhere
  // other than the yahtzee row would be a bit unusual...
  // subsequent yahtzee gets scored in any open row (though it seems in some
  // variants you must do the upper section first)
  // but we also want to record the bonus.
  if (isYahtzee(roll) && player.scores.yahtzee.length && isYahtzee(player.scores.yahtzee[0])) {
    appendRoll(player, 'yahtzee', roll);
  }

  appendRoll(player, row, roll);
  clearRoll();
  nextPlayer();
}

function appendRoll(player, row, roll) {
  let rolls = Array.from(player.scores[row]);
  rolls.push(Array.from(roll));

  for (let i = 0; i < state.players.length; i++)
    if (state.players[i] == player) {
      setState("players", i, "scores", row, rolls);
    }
}

function clearRoll() {
  setState("roll_input", "");
  setState("roll", [null, null, null, null, null]);
  setState("hold", [false, false, false, false, false]);
  setState("rerolls", 3);
}

function nextPlayer() {
  let i = 0;
  for (; i < state.players.length; i++)
    if (state.players[i].current) break;

  setState("players", i, "current", false);
  setState("players", (i + 1) % state.players.length, "current", true);
}

function App() {

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>
          Yahtzee Scoresheet
        </h1>
        <nav>
          <button onClick={() => zeroScores()}>New Game</button>
        </nav>
      </header>
      <article>
        <section>
          <Roll />
        </section>
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
  return dice[0] !== null && dice[0] == dice[1] && dice[1] == dice[2] && dice[2] == dice[3] && dice[3] == dice[4];
}

function yahtzeeBonus(rolls) {
  let total = 0;
  for (const roll of rolls)
    if (isYahtzee(roll)) total += 100;
  return Math.min(Math.max(0, total - 100), 300);
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

  const score_triple = (scores) => totalAll(isTuple(3), scores.triple);
  const score_quad = (scores) => totalAll(isTuple(4), scores.quad);
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

  return (
    <table class={styles.scores}>
      <colgroup>
        <col />
        <For each={state.players}>{(player) =>
          <col classList={{ [styles.current]: player.current }} />
        }</For>
      </colgroup>
      <tbody>
        <Row class={styles.head} label="Upper Section" value={(player) => <th>{player.name}</th>} />
        <InputRow label="Aces" value="ones" score={score_ones} />
        <InputRow label="Twos" value="twos" score={score_twos} />
        <InputRow label="Threes" value="threes" score={score_threes} />
        <InputRow label="Fours" value="fours" score={score_fours} />
        <InputRow label="Fives" value="fives" score={score_fives} />
        <InputRow label="Sixes" value="sixes" score={score_sixes} />
        <CalcRow label="Total" score={score_upper_subtotal} />
        <CalcRow label="Bonus" score={score_upper_bonus} />
        <CalcRow label="Total" score={score_upper_total} />

        <Row class={styles.head} label="Lower Section" value={(player) => <td></td>} />
        <InputRow label="3 of a Kind" value="triple" score={score_triple} />
        <InputRow label="4 of a Kind" value="quad" score={score_quad} />
        <InputRow label="Full House" value="fullhouse" score={score_fullhouse} />
        <InputRow label="Small Straight" value="small" score={score_small} />
        <InputRow label="Large Straight" value="large" score={score_large} />
        <InputRow label="YAHTZEE" value="yahtzee" score={score_yahtzee} />
        <InputRow label="Chance" value="chance" score={score_chance} />
        <CalcRow label="YAHTZEE BONUS" score={score_yahtzee_bonus} />

        <CalcRow label="Lower Section Total" score={score_lower_total} />
        <CalcRow label="Upper Section Total" score={score_upper_total} />
        <CalcRow label="Grand Total" score={score_total} />
      </tbody>
    </table>
  )
}

function Row(props) {
  const { label, value, ...attrs } = props;
  return (
    <tr {...attrs}>
      <th>{label}</th>
      <For each={state.players}>{(player) => value(player)}</For>
    </tr>
  );
}

function InputRow(props) {
  const { label, value, score } = props;

  return (
    <Row label={label} value={(player) => <Switch fallback={<td></td>}>
      <Match when={player.scores[value].length == 0 && player.current}>
        <td class={styles.maybe}
          title="click to score roll against this row"
          onclick={() => setScore(player, value, state.roll)}>
          {score({ [value]: [state.roll] })}
          <i>✏️</i>
        </td>
      </Match>
      <Match when={player.scores[value].length > 0}>
        <td class={styles.actual}>{score(player.scores)}</td>
      </Match>
    </Switch>} />
  );
}

function CalcRow(props) {
  const { score, label } = props;

  return (
    <Row class={styles.foot} label={label} value={(player) => <td>{score(player.scores)}</td>} />
  );
}

function RollInput() {
  const roll_string = () => {
    let s = "";
    for (const i of state.roll)
      if (i !== null)
        s += i.toString();
    return s;
  };

  return (
    <input onInput={(e) => setRoll(e.currentTarget.value)}
      minlength={5} maxLength={5} size={5}
      value={state.roll_input}
      placeholder={roll_string()}
      style={{ "margin-top": "1em" }}
    />
  );
}

function Roll() {
  const roll = () => {
    const result = [];
    for (let i = 0; i < 5; i++)
      result.push({ 'index': i, 'face': state.roll[i], 'hold': state.hold[i] });
    return result;
  };
  return (
    <table>
      <tbody>
        <tr>
          <For each={roll()}>
            {(die) => <td onclick={() => toggleHold(die.index)}><Die face={die.face} hold={die.hold} /></td>}
          </For>
          <td>
            <button onClick={() => rollDice()} style={{ 'padding': '0.5em 1em' }}>Roll Dice</button>
            <br />
            <RollInput />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const DOTS = { 1: [7], 2: [3, 4], 3: [3, 4, 7], 4: [1, 3, 4, 6], 5: [1, 3, 4, 6, 7], 6: [1, 2, 3, 4, 5, 6] };
function Die(props) {
  const { face, hold } = props;
  return (
    <div classList={{ [styles.face]: true, [styles.hold]: hold }} title={face}>
      <For each={DOTS[face]}>{(dot) => <div class={styles['dot' + dot]} />}</For>
    </div>
  );
}

export default App;
