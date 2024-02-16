import { createStore } from "solid-js/store";
import { batch, createDeferred, createMemo, For, Show, Switch, Match } from "solid-js";

import styles from './App.module.css';


const [state, setState] = createStore({
  started: false,
  help: true,
  roll: [null, null, null, null, null],
  roll_input: "",
  hold: [false, false, false, false, false],
  rerolls: 3,
  rolling: false,
  undo: null,
  winner: null,
  show_forfeit: false,
  show_hint: false,
  show_probs: false,
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

function initSave() {
  if (localStorage.mastermind) {
    setState(JSON.parse(localStorage.mastermind));
  }
  createDeferred(() => {
    console.log('saving...');
    localStorage.mastermind = JSON.stringify(state);
  });
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
  batch(() => {
    setState('players', Array.from(names, newPlayer));
    setState('players', 0, 'current', true);
    clearRoll();
    setState('started', false);
    setState("winner", null);
    setState("undo", null);
  });
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

  batch(() => {
    for (let i = 0; i < names.length && i < state.players.length; i++)
      setState('players', i, 'name', names[i].trim());
  });
}

function toggleHold(i) {
  if (state.roll[i] === null) return;

  batch(() => {
    setState("hold", i, !state.hold[i]);

    // automatically hold all dice of same value
    if (state.hold[i]) {
      const value = state.roll[i];
      holdValue(value);
    }
  });
}

function holdValue(value) {
  for (let i = 0; i < 5; i++)
    if (state.roll[i] == value)
      setState("hold", i, true);
}

function rollDice() {
  if (state.rerolls == 0)
    return;

  batch(() => {
    setState("rolling", true);
    setState("started", true);
    setState("help", false);

    setState("undo", {
      'label': "Undo re-roll",
      'player': null,
      'row': null,
      'roll': Array.from(state.roll),
      'hold': Array.from(state.hold),
      'rerolls': state.rerolls,
      'yahtzee_bonus': null
    });
  });

  window.setTimeout(rollDiceComplete, 250);
}

function rollDiceComplete() {
  batch(() => {
    setState("rolling", false);

    for (let i = 0; i < 5; i++)
      if (!state.hold[i])
        setState("roll", i, Math.ceil(6.0 * Math.random()));

    setState("rerolls", state.rerolls - 1);
    if (state.rerolls == 0)
      setState('hold', [true, true, true, true, true]);
  });
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

  batch(() => {
    if (result.length == 5) {
      for (let i = 0; i < 5; i++)
        setState("roll", i, result[i]);
      setState("roll_input", "");
      setState("started", true);
      setState('help', false);
      setState("undo", null); // no undo for manual entry
    } else {
      setState("roll_input", remainder);
    }
  });
}

function setScore(player_index, row, roll) {
  const player = state.players[player_index];
  batch(() => {
    // special case for yahtzee bonus:
    // first yahtzee can be filled in to any row you like, but putting it anywhere
    // other than the yahtzee row would be a bit unusual...
    // subsequent yahtzee gets scored in any open row (though it seems in some
    // variants you must do the upper section first)
    // but we also want to record the bonus.
    let yahtzee_bonus = false;
    if (isYahtzee(roll) && player.scores.yahtzee.length && isYahtzee(player.scores.yahtzee[0])) {
      appendRoll(player, 'yahtzee', roll);
      yahtzee_bonus = true;
    }
    appendRoll(player, row, roll);

    setState("undo", {
      'label': "Undo set score",
      'player': player_index,
      'row': row,
      'roll': Array.from(roll),
      'hold': Array.from(state.hold),
      'rerolls': state.rerolls,
      'yahtzee_bonus': yahtzee_bonus
    });

    clearRoll();
    nextPlayer();
    if (gameFinished())
      highlightWinner();
  });
}

function doUndo() {
  if (state.undo === null) return;

  batch(() => {
    if (state.undo.player !== null) {
      setState('winner', null);
      setCurrent(state.undo.player);
    }

    if (state.undo.roll !== null) {
      setState("roll", Array.from(state.undo.roll));
    }

    if (state.undo.rerolls !== null) {
      setState("rerolls", state.undo.rerolls);
    }

    if (state.undo.hold !== null) {
      setState("hold", Array.from(state.undo.hold));
    }

    if (state.undo.row !== null) {
      popScore(state.undo.player, state.undo.row);
    }

    if (state.undo.yahtzee_bonus != null) {
      if (state.undo.yahtzee_bonus) {
        popScore(state.undo.player, "yahtzee_bonus");
      }
    }

    setState("undo", null);
  });
}

function setCurrent(player_index) {
  for (let i = 0; i < state.players.length; i++)
    setState("players", i, "current", false);
  setState("players", player_index, "current", true);
}

function popScore(player_index, row) {
  let rolls = Array.from(state.players[player_index].scores[row]);
  rolls.pop();
  setState("players", player_index, "scores", row, rolls);
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

function gameFinished() {

  const scores = state.players[currentPlayerIndex()].scores;
  for (const value in scores)
    if (scores[value].length == 0)
      return false;

  return true;
}

function highlightWinner() {
  let max_score = 0, winner = null;
  for (let i = 0; i < state.players.length; i++) {
    let score = allScores(state.players[i].scores)["total"];
    if (score > max_score) {
      max_score = score;
      winner = i;
    }
    setState("players", i, "current", false);
  }

  setState("winner", winner);
  setState("rerolls", 0);
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

function countIf(check, rolls) {
  let count = 0;
  for (let roll of rolls)
    if (check(roll)) count++;
  return count;
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
  return Math.max(0, total - 100);
}

function isChance(dice) {
  return true;
}

function has3Of(value) {
  return (dice) => {
    const counts = countDice(dice);
    return counts[value] >= 3;
  }
}

function allScores(scores) {
  const result = {
    "ones": totalJust(1, scores.ones),
    "twos": totalJust(2, scores.twos),
    "threes": totalJust(3, scores.threes),
    "fours": totalJust(4, scores.fours),
    "fives": totalJust(5, scores.fives),
    "sixes": totalJust(6, scores.sixes),
    "triple": totalAll(isTuple(3), scores.triple),
    "quad": totalAll(isTuple(4), scores.quad),
    "fullhouse": totalIf(25, isFullHouse, scores.fullhouse),
    "small": totalIf(30, isStraight(4), scores.small),
    "large": totalIf(40, isStraight(5), scores.large),
    "yahtzee": totalIf(50, isYahtzee, scores.yahtzee),
    "yahtzee_bonus": yahtzeeBonus(scores.yahtzee),
    "chance": totalAll(isChance, scores.chance)
  };

  result.upper_subtotal = result.ones + result.twos + result.threes + result.fours + result.fives + result.sixes;
  result.upper_bonus = result.upper_subtotal >= 63 ? 35 : 0;
  result.upper_total = result.upper_subtotal + result.upper_bonus;
  result.lower_total = result.triple + result.quad + result.fullhouse + result.small + result.large + result.yahtzee + result.chance + result.yahtzee_bonus;
  result.total = result.upper_total + result.lower_total;

  return result;
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

function currentPlayerIndex() {
  let i = 0;
  for (let player of state.players) {
    if (player.current) return i;
    i++;
  }
  // during nextPlayer() current will be false for all players for a moment
  return 0;
}

function App() {
  initSave();

  return (
    <div classList={{ [styles.App]: true, [styles.started]: state.started }}>
      <header class={styles.header}>
        <h1>
          Yahtzee Scoresheet
        </h1>
        <button onClick={() => zeroScores()}>New Game</button>
        <button onClick={() => setState('help', !state.help)}>Help</button>
        <Show when={state.undo}>
          <button onclick={() => doUndo()}>{state.undo.label}</button>
        </Show>
      </header>
      <Show when={state.help}>
        <div class={styles.help}>
          <button onclick={() => setState('help', false)}>x</button>
          <h1>
            Yahtzee Scoresheet
          </h1>
          <ul>
            <li>Roll Dice or enter the dice into the textbox to start</li>
            <li>Click New Game to change the number of players</li>
            <li>Click player names at any point to rename</li>
            <li>Enter names of players separated by commas.</li>
            <li>Click a dice to "hold" when re-rolling</li>
            <li>Up to 3 rolls per turn</li>
            <li>Click the row with the desired score to record it</li>
            <li>Upper bonus will be scored automatically</li>
            <li>Yahtzee bonus will be scored automatically, but you must put the score in an appropriate row according to the Joker rules</li>
            <li>Some hints/statistics for the current player can be enabled by clicking the checkboxes below the scoresheet</li>
            <li>Note: Probabilities displayed are simplistic and don't consider re-rolls.</li>
          </ul>
        </div>
      </Show>
      <Roll />
      <RollDescription />
      <ScoreSheet />
      <div class={styles.options}>
        <input type="checkbox" id="show_probs"
          value={state.show_probs} checked={state.show_probs}
          onclick={() => setState("show_probs", !state.show_probs)} />
        <label for="show_probs">Show probabilities?</label>
        {" "}
        <input type="checkbox" id="show_forfeit"
          value={state.show_forfeit} checked={state.show_forfeit}
          onclick={() => setState("show_forfeit", !state.show_forfeit)} />
        <label for="show_forfeit">Show points forfeitted for row?</label>
        {" "}
        <input type="checkbox" id="show_hint"
          value={state.show_hint} checked={state.show_hint}
          onclick={() => setState("show_hint", !state.show_hint)} />
        <label for="show_hint">Show hints?</label>
      </div>
    </div>
  );
}

const LABEL = {
  "ones": "Aces",
  "twos": "Twos",
  "threes": "Threes",
  "fours": "Fours",
  "fives": "Fives",
  "sixes": "Sixes",
  "upper_subtotal": "Total",
  "upper_bonus": "Bonus",
  "triple": "3 of a Kind",
  "quad": "4 of a Kind",
  "fullhouse": "Full House",
  "small": "Small Straight",
  "large": "Large Straight",
  "yahtzee": "YAHTZEE",
  "chance": "Chance",
  "yahtzee_bonus": "YAHTZEE BONUS",
  "lower_total": "Lower Section Total",
  "upper_total": "Upper Section Total",
  "total": "Grand Total",
};


function RollDescription() {
  const upper_section = ["", "ones", "twos", "threes", "fours", "fives", "sixes"];
  const what = () => {
    const scores = state.players[currentPlayerIndex()].scores;
    if (isYahtzee(state.roll)) return "yahtzee";
    if (isStraight(5)(state.roll) && !scores.large.length) return "large";
    if (isStraight(4)(state.roll) && !scores.small.length) return "small";
    if (isTuple(4)(state.roll) && !scores.quad.length) return "quad";
    if (isFullHouse(state.roll) && !scores.fullhouse.length) return "fullhouse";
    if (isTuple(3)(state.roll) && !scores.triple.length) return "triple";
    const count = countDice(state.roll);
    for (let i = 6; i > 0; i--)
      if (count[i] > 1 && !scores[upper_section[i]].length)
        return upper_section[i];
    return "";
  };

  const score_what = (row) => {
    if (!row) return;
    const value = upper_section.indexOf(row);
    if (value > 0)
      if (state.rerolls > 0)
        return <span title="click to hold" onclick={() => holdValue(value)}>{LABEL[row]}?</span>;
      else
        return <span title="click to score" onclick={() => setScore(currentPlayerIndex(), row, state.roll)}>{LABEL[row]}? <i>✏️</i></span>;

    return <span title="click to score" onclick={() => setScore(currentPlayerIndex(), row, state.roll)}>{LABEL[row]}! <i>✏️</i></span>;
  };

  return (
    <div class={styles.what}>{() => score_what(what())}</div>
  );
}

function ScoreSheet() {
  const all_possible_rolls = createMemo(() => {
    const rolls = [];

    const possible = [];
    for (let i = 0; i < 5; i++) {
      if (state.hold[i])
        possible.push([state.roll[i]]);
      else
        possible.push([1, 2, 3, 4, 5, 6]);
    }

    for (let a of possible[0])
      for (let b of possible[1])
        for (let c of possible[2])
          for (let d of possible[3])
            for (let e of possible[4])
              rolls.push([a, b, c, d, e]);

    return rolls;
  });

  const sheet = createMemo(() => {
    const result = [];
    for (let player of state.players) {
      const all = allScores(player.scores);

      const current_roll = {};
      for (let value in all)
        current_roll[value] = [state.roll];
      const maybe = allScores(current_roll);

      const item = {};
      result.push(item);

      for (let value in all) {
        if (player.scores[value] === undefined) {
          // want total values in actual
          item[value] = { actual: all[value], maybe: null, forfeit: null, hint: [], probs: null };
        } else if (player.scores[value].length) {
          item[value] = { actual: all[value], maybe: null, forfeit: null, hint: [], probs: null };
        } else if (player.current) {
          item[value] = { actual: null, maybe: maybe[value], forfeit: MAX[value] - maybe[value], hint: [], probs: null };
        } else {
          item[value] = { actual: null, maybe: null, forfeit: null, hint: [], probs: null };
        }
      }

      if (player.current) {
        const all_rolls = all_possible_rolls();
        const denominator = all_rolls.length;
        item["ones"].probs = (countIf(has3Of(1), all_rolls) / denominator).toFixed(3) + '%';
        item["twos"].probs = (countIf(has3Of(2), all_rolls) / denominator).toFixed(3) + '%';
        item["threes"].probs = (countIf(has3Of(3), all_rolls) / denominator).toFixed(3) + '%';
        item["fours"].probs = (countIf(has3Of(4), all_rolls) / denominator).toFixed(3) + '%';
        item["fives"].probs = (countIf(has3Of(5), all_rolls) / denominator).toFixed(3) + '%';
        item["sixes"].probs = (countIf(has3Of(6), all_rolls) / denominator).toFixed(3) + '%';

        item["triple"].probs = (countIf(isTuple(3), all_rolls) / denominator).toFixed(3) + '%';
        item["quad"].probs = (countIf(isTuple(4), all_rolls) / denominator).toFixed(3) + '%';
        item["fullhouse"].probs = (countIf(isFullHouse, all_rolls) / denominator).toFixed(3) + '%';
        item["small"].probs = (countIf(isStraight(4), all_rolls) / denominator).toFixed(3) + '%';
        item["large"].probs = (countIf(isStraight(5), all_rolls) / denominator).toFixed(3) + '%';
        item["yahtzee"].probs = (countIf(isYahtzee, all_rolls) / denominator).toFixed(3) + '%';
        item["chance"].probs = (countIf(isChance, all_rolls) / denominator).toFixed(3) + '%';

        // fill in hint for best scoring row
        let max_score = 0, max_value = null;
        for (let value in item) {
          if (item[value].maybe !== null && item[value].maybe > max_score) {
            max_value = value; max_score = item[value].maybe;
          }
        }
        if (max_value !== null)
          item[max_value].hint.push(HintIcon("good", "Highest score for this roll"));

        // fill in hint for row with lowest forfeit
        let min_forfeit = 999, min_value = null;
        for (let value in item) {
          if (item[value].forfeit !== null && item[value].forfeit < min_forfeit) {
            min_value = value; min_forfeit = item[value].forfeit;
          }
        }
        if (min_value !== null && state.roll[0] !== null)
          item[min_value].hint.push(HintIcon("good", "Lowest score forfeit for this roll"));

        // fill in hint for upper section bonus
        let avg_upper_bonus = {
          "ones": 3, "twos": 6, "threes": 9, "fours": 12, "fives": 15, "sixes": 18
        };
        for (let value in avg_upper_bonus) {
          if (item[value].maybe && item[value].maybe < avg_upper_bonus[value]) {
            item[value].hint.push(HintIcon("bad", "Below average for upper bonus"));
          }
          if (item[value].maybe !== null && item[value].maybe >= avg_upper_bonus[value]) {
            item[value].hint.push(HintIcon("ok", "Above average for upper bonus"));
          }
        }

      }
    }
    return result;
  });

  return (
    <table class={styles.scores}>
      <colgroup>
        <col />
        <For each={state.players}>{(player, index) =>
          <col classList={{ [styles.player]: true, [styles.current]: player.current, [styles.winner]: index() === state.winner }} />
        }</For>
        <Show when={state.show_probs}>
          <col class={styles.probs} />
        </Show>
        <Show when={state.show_forfeit}>
          <col class={styles.forfeit} />
        </Show>
        <Show when={state.show_hint}>
          <col class={styles.hint} />
        </Show>
      </colgroup>
      <tbody>
        <Row class={styles.head} label="Upper Section" forfeit=""
          value={(index) => <th title="click to rename players" onclick={renamePlayers}>{state.players[index].name}</th>} />
        <InputRow value="ones" sheet={sheet} rule="Count and add only Aces" />
        <InputRow value="twos" sheet={sheet} rule="Count and add only Twos" />
        <InputRow value="threes" sheet={sheet} rule="Count and add only Threes" />
        <InputRow value="fours" sheet={sheet} rule="Count and add only Fours" />
        <InputRow value="fives" sheet={sheet} rule="Count and add only Fives" />
        <InputRow value="sixes" sheet={sheet} rule="Count and add only Sixes" />
        <CalcRow value="upper_subtotal" sheet={sheet} />
        <CalcRow value="upper_bonus" sheet={sheet} rule="If total score is over 63, score 35" />
        <CalcRow value="upper_total" sheet={sheet} />

        <Row class={styles.head} label="Lower Section" value={() => <td></td>} forfeit="" />
        <InputRow value="triple" sheet={sheet} rule="Add total of all dice" />
        <InputRow value="quad" sheet={sheet} rule="Add total of all dice" />
        <InputRow value="fullhouse" sheet={sheet} rule="Score 25" />
        <InputRow value="small" sheet={sheet} rule="Sequence of 4, score 30" />
        <InputRow value="large" sheet={sheet} rule="Sequence of 5, score 40" />
        <InputRow value="yahtzee" sheet={sheet} rule="5 of a kind, score 50" />
        <InputRow value="chance" sheet={sheet} rule="Score total of all dice" />
        <CalcRow value="yahtzee_bonus" sheet={sheet} rule="Score 100 for each additional Yahtzee" />

        <CalcRow value="lower_total" sheet={sheet} />
        <CalcRow value="upper_total" sheet={sheet} />
        <CalcRow value="total" sheet={sheet} />
      </tbody>
    </table>
  )
}

function Row(props) {
  const { label, rule, value, probs, forfeit, hint, ...attrs } = props;
  return (
    <tr {...attrs}>
      <th>
        {label}
        <Show when={rule}><span class={styles.rule}>{rule}</span></Show>
      </th>
      <For each={state.players}>{(player, index) => value(index())}</For>
      <Show when={state.show_probs}><td>{probs}</td></Show>
      <Show when={state.show_forfeit}><td>{forfeit}</td></Show>
      <Show when={state.show_hint}><td>{hint}</td></Show>
    </tr>
  );
}

function InputRow(props) {
  const { rule, value, sheet } = props;

  return (
    <Row label={LABEL[value]} rule={rule} value={(index) =>
      <InputCol actual={() => sheet()[index][value].actual}
        maybe={() => sheet()[index][value].maybe}
        onclick={() => setScore(index, value, state.roll)} />}
      probs={() => sheet()[currentPlayerIndex()][value].probs}
      forfeit={() => sheet()[currentPlayerIndex()][value].forfeit}
      hint={() => sheet()[currentPlayerIndex()][value].hint} />
  );
}

function CalcRow(props) {
  const { rule, value, sheet } = props;

  return (
    <Row class={styles.foot} label={LABEL[value]} rule={rule}
      value={(index) => <td>{sheet()[index][value].actual || 0}</td>}
      forfeit="" />
  );
}

function InputCol(props) {
  const { actual, maybe, onclick } = props;
  return (
    <Switch fallback={<td></td>}>
      <Match when={maybe() !== null}>
        <td class={styles.maybe}
          title="click to score roll against this row"
          onclick={() => onclick()}>
          {maybe}
          <i>✏️</i>
        </td>
      </Match>
      <Match when={actual() !== null}>
        <td class={styles.actual}>{actual}</td>
      </Match>
    </Switch>
  );
}

function HintIcon(type, msg) {
  return <span class={styles.hint} title={msg}>{{ 'good': '🟢', 'bad': '🔴', 'ok': '🟠' }[type]}</span>;
}

function Roll() {
  const roll = () => {
    const result = [];
    for (let i = 0; i < 5; i++)
      result.push({ 'index': i, 'face': state.roll[i], 'hold': state.hold[i] });
    return result;
  };
  return (
    <div class={styles.turn}>
      <div class={styles.dice}>
        <For each={roll()}>
          {(die) => <Die onclick={() => toggleHold(die.index)} face={die.face} hold={die.hold} />}
        </For>
      </div>
      <div class={styles.roll}>
        <Switch>
          <Match when={state.rerolls == 3}><div title="3 rolls available">🟢🟢🟢</div></Match>
          <Match when={state.rerolls == 2}><div title="2 rolls available">🔴🟢🟢</div></Match>
          <Match when={state.rerolls == 1}><div title="1 rolls available">🔴🔴🟢</div></Match>
          <Match when={state.rerolls == 0}><div title="No rolls available">🔴🔴🔴</div></Match>
        </Switch>

        <button onClick={() => rollDice()} disabled={state.rolling} style={{ 'padding': '1em 1.5em' }}>Roll Dice</button>

        <RollInput />

      </div>
    </div>
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
    />
  );
}

const DOTS = { 1: [7], 2: [3, 4], 3: [3, 4, 7], 4: [1, 3, 4, 6], 5: [1, 3, 4, 6, 7], 6: [1, 2, 3, 4, 5, 6] };
function Die(props) {
  const { face, hold, onclick } = props;
  return (
    <div
      onclick={onclick}
      classList={{ [styles.face]: true, [styles.hold]: hold, [styles.rolling]: state.rolling }}
      title={face === null ? "" : face + (hold ? " (click to allow re-roll)" : " (click to hold)")}>
      <For each={DOTS[face]}>{(dot) => <div class={styles['dot' + dot]} />}</For>
    </div>
  );
}

export default App;
