import { createStore } from "solid-js/store";
import { createMemo, For, Show, Switch, Match } from "solid-js";

import styles from './App.module.css';


const [state, setState] = createStore({
  roll: [null, null, null, null, null],
  roll_input: "",
  hold: [false, false, false, false, false],
  rerolls: 3,
  show_forfeit: false,
  players: [
    {
      name: 'Player One',
      current: true,
      scores: blankScores()
    },
    {
      name: 'Player Two',
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
  const names = inputNames();
  if (names === null) return;

  const newPlayer = (player) => {
    return {
      'name': player.trim(),
      'current': false,
      'scores': blankScores()
    };
  }
  setState('players', Array.from(names, newPlayer));
  setState('players', 0, 'current', true);
  clearRoll();
}

function inputNames() {
  const current_names = Array.from(state.players, (player) => player.name).join(', ');
  const new_names = prompt("Player names? (comma separated)", current_names);
  if (new_names === null) return null;
  return new_names.split(',');
}

function renamePlayers() {
  const names = inputNames();
  if (names === null) return;

  for (let i = 0; i < names.length && i < state.players.length; i++)
    setState('players', i, 'name', names[i].trim());
}

function toggleHold(i) {
  if (state.roll[i] === null) return;
  setState("hold", i, !state.hold[i]);
}

function rollDice() {
  if (state.rerolls == 0)
    return;

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
        <nav></nav>
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
          <nav>
            <input type="checkbox" id="show_forfeit" value={state.show_forfeit} onclick={() => setState("show_forfeit", !state.show_forfeit)} />
            <label for="show_forfeit">Show points forfeitted for row?</label>
          </nav>
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

function scoreOnes(scores) {
  return totalJust(1, scores.ones);
}

function scoreTwos(scores) {
  return totalJust(2, scores.twos);
}

function scoreThrees(scores) {
  return totalJust(3, scores.threes);
}

function scoreFours(scores) {
  return totalJust(4, scores.fours);
}

function scoreFives(scores) {
  return totalJust(5, scores.fives);
}

function scoreSixes(scores) {
  return totalJust(6, scores.sixes);
}

function scoreUpperSubtotal(scores) {
  return scoreOnes(scores)
    + scoreTwos(scores)
    + scoreThrees(scores)
    + scoreFours(scores)
    + scoreFives(scores)
    + scoreSixes(scores);
}

function scoreUpperBonus(scores) {
  return scoreUpperSubtotal(scores) >= 63 ? 35 : 0;
}

function scoreUpperTotal(scores) {
  return scoreUpperSubtotal(scores) + scoreUpperBonus(scores);
}

function scoreTriple(scores) {
  return totalAll(isTuple(3), scores.triple);
}

function scoreQuad(scores) {
  return totalAll(isTuple(4), scores.quad);
}

function scoreFullhouse(scores) {
  return totalIf(25, isFullHouse, scores.fullhouse);
}

function scoreSmall(scores) {
  return totalIf(30, isStraight(4), scores.small);
}

function scoreLarge(scores) {
  return totalIf(40, isStraight(5), scores.large);
}

function scoreYahtzee(scores) {
  return totalIf(50, isYahtzee, scores.yahtzee);
}

function scoreChance(scores) {
  return totalAll(isChance, scores.chance);
}

function scoreYahtzeeBonus(scores) {
  return yahtzeeBonus(scores.yahtzee);
}

function scoreLowerTotal(scores) {
  return scoreTriple(scores)
    + scoreQuad(scores)
    + scoreFullhouse(scores)
    + scoreSmall(scores)
    + scoreLarge(scores)
    + scoreYahtzee(scores)
    + scoreChance(scores)
    + scoreYahtzeeBonus(scores);
}

function scoreTotal(scores) {
  return scoreUpperTotal(scores) + scoreLowerTotal(scores);
}

function allScores(scores) {
  return {
    "ones": scoreOnes(scores),
    "twos": scoreTwos(scores),
    "threes": scoreThrees(scores),
    "fours": scoreFours(scores),
    "fives": scoreFives(scores),
    "sixes": scoreSixes(scores),
    "upper_subtotal": scoreUpperSubtotal(scores),
    "upper_bonus": scoreUpperBonus(scores),
    "upper_total": scoreUpperTotal(scores),
    "triple": scoreTriple(scores),
    "quad": scoreQuad(scores),
    "fullhouse": scoreFullhouse(scores),
    "small": scoreSmall(scores),
    "large": scoreLarge(scores),
    "yahtzee": scoreYahtzee(scores),
    "yahtzee_bonus": scoreYahtzeeBonus(scores),
    "chance": scoreChance(scores),
    "lower_total": scoreLowerTotal(scores),
    "total": scoreTotal(scores)
  };
}

const MAX = {
  "ones": 5,
  "twos": 10,
  "threes": 15,
  "fours": 20,
  "fives": 25,
  "sixes": 30,
  "triple": 30,
  "quad": 30,
  "fullhouse": 25,
  "small": 30,
  "large": 40,
  "yahtzee": 50,
  "chance": 30,
};

function currentPlayerScored(value) {
  for (let player of state.players)
    if (player.current && player.scores[value].length > 0) return true;
  return false;
}

function ScoreSheet() {

  const actual_scores = createMemo(() => {
    return Array.from(state.players, (player) => allScores(player.scores));
  });

  const maybe_scores = createMemo(() => {
    const scores = {};
    for (let value in blankScores())
      scores[value] = [state.roll];
    return allScores(scores);
  });

  const forfeit_scores = createMemo(() => {
    const forfeit = {};

    for (const [value, score] of Object.entries(maybe_scores())) {
      forfeit[value] = MAX[value] - score;
    }

    return forfeit;
  });

  return (
    <table class={styles.scores}>
      <colgroup>
        <col />
        <For each={state.players}>{(player) =>
          <col classList={{ [styles.current]: player.current }} />
        }</For>
        <Show when={state.show_forfeit}><col /></Show>
      </colgroup>
      <tbody>
        <Row class={styles.head} label="Upper Section" forfeit=""
          value={(player) => <th title="click to rename players" onclick={renamePlayers}>{player.name}</th>} />
        <InputRow label="Aces" value="ones" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Twos" value="twos" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Threes" value="threes" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Fours" value="fours" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Fives" value="fives" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Sixes" value="sixes" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <CalcRow label="Total" value="upper_subtotal" actual={actual_scores} />
        <CalcRow label="Bonus" value="upper_bonus" actual={actual_scores} />
        <CalcRow label="Total" value="upper_total" actual={actual_scores} />

        <Row class={styles.head} label="Lower Section" value={(player) => <td></td>} forfeit="" />
        <InputRow label="3 of a Kind" value="triple" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="4 of a Kind" value="quad" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Full House" value="fullhouse" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Small Straight" value="small" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Large Straight" value="large" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="YAHTZEE" value="yahtzee" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <InputRow label="Chance" value="chance" actual={actual_scores} maybe={maybe_scores} forfeit={forfeit_scores} />
        <CalcRow label="YAHTZEE BONUS" value="yahtzee_bonus" actual={actual_scores} />

        <CalcRow label="Lower Section Total" value="lower_total" actual={actual_scores} />
        <CalcRow label="Upper Section Total" value="upper_total" actual={actual_scores} />
        <CalcRow label="Grand Total" value="total" actual={actual_scores} />
      </tbody>
    </table>
  )
}

function Row(props) {
  const { label, value, forfeit, ...attrs } = props;
  return (
    <tr {...attrs}>
      <th>{label}</th>
      <For each={state.players}>{(player, index) => value(player, index())}</For>
      <Show when={state.show_forfeit}><td>{forfeit}</td></Show>
    </tr>
  );
}

function InputRow(props) {
  const { label, value, actual, maybe, forfeit } = props;

  return (
    <Row label={label} value={(player, index) => <Switch fallback={<td></td>}>
      <Match when={player.scores[value].length == 0 && player.current}>
        <td class={styles.maybe}
          title="click to score roll against this row"
          onclick={() => setScore(player, value, state.roll)}>
          {maybe()[value]}
          <i>✏️</i>
        </td>
      </Match>
      <Match when={player.scores[value].length > 0}>
        <td class={styles.actual}>{actual()[index][value]}</td>
      </Match>
    </Switch>}
      forfeit={<Show when={!currentPlayerScored(value)}>{forfeit()[value]}</Show>} />
  );
}

function CalcRow(props) {
  const { label, value, actual } = props;

  return (
    <Row class={styles.foot} label={label} value={(player, index) => <td>{actual()[index][value]}</td>} forfeit="" />
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
    <div classList={{ [styles.face]: true, [styles.hold]: hold }} title={face === null ? "" : face + (hold ? " (click to allow re-roll)" : " (click to hold)")}>
      <For each={DOTS[face]}>{(dot) => <div class={styles['dot' + dot]} />}</For>
    </div>
  );
}

export default App;
