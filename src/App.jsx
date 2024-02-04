import styles from './App.module.css';

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


function ScoreSheet() {
  return (
    <table>
      <thead>
        <tr>
          <th>Upper Section</th>
          <th>TP</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Aces</th>
          <td></td>
        </tr>
        <tr>
          <th>Twos</th>
          <td></td>
        </tr>
        <tr>
          <th>Threes</th>
          <td></td>
        </tr>
        <tr>
          <th>Fours</th>
          <td></td>
        </tr>
        <tr>
          <th>Fives</th>
          <td></td>
        </tr>
        <tr>
          <th>Sixes</th>
          <td></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>Total</th>
          <td></td>
        </tr>
        <tr>
          <th>Bonus</th>
          <td></td>
        </tr>
        <tr>
          <th>Total</th>
          <td></td>
        </tr>
      </tfoot>
      <thead>
        <tr>
          <th>Lower Section</th>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>3 of a Kind</th>
          <td></td>
        </tr>
        <tr>
          <th>4 of a Kind</th>
          <td></td>
        </tr>
        <tr>
          <th>Full House</th>
          <td></td>
        </tr>
        <tr>
          <th>Small Straight</th>
          <td></td>
        </tr>
        <tr>
          <th>Large Straight</th>
          <td></td>
        </tr>
        <tr>
          <th>YAHTZEE</th>
          <td></td>
        </tr>
        <tr>
          <th>Chance</th>
          <td></td>
        </tr>
        <tr>
          <th>YAHTZEE BONUS</th>
          <td></td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>Lower Section Total</th>
          <td></td>
        </tr>
        <tr>
          <th>Upper Section Total</th>
          <td></td>
        </tr>
        <tr>
          <th>Grand Total</th>
          <td></td>
        </tr>
      </tfoot>
    </table>
  )
}

export default App;
