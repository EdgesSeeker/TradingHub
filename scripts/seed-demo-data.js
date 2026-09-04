/*
 * Demo-Daten fuer Screenshots und zum Ausprobieren.
 *
 * Alle Trades hier sind ERFUNDEN. Keine echten Positionen, keine echten Kurse.
 *
 * Benutzung:
 *   1. App starten (npm start), im Browser oeffnen
 *   2. F12 druecken, Reiter "Console"
 *   3. Diese Datei komplett hineinkopieren, Enter
 *   4. Seite neu laden
 *
 * Zum Entfernen: seedDemoData.remove() in der Console aufrufen.
 * Es werden ausschliesslich Zeilen mit isDemo === true angefasst.
 */
(function () {
  const DB = 'TradingJournalDB';
  const STORE = 'trades';

  // Fester Zufall, damit derselbe Datensatz reproduzierbar ist
  let seed = 20250904;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

  const SYMBOLS = ['NVDA','SMCI','APP','CRWD','ANET','VRT','MSTR','COIN','TSLA','PLTR','ARM','CELH','DUOL','ONON','RKLB'];
  const SETUPS  = ['Breakout','SMA Touch','Pullback','Gap Up','Flag'];

  const VIOLATIONS = [
    'Position zu gross, Risiko lag bei 4 Prozent statt 2',
    'Einstieg ohne Trigger, dem Kurs hinterhergelaufen',
    'Kein Stop gesetzt, Position nur im Kopf begrenzt',
    'Setup passte nicht, Einstieg nach fremdem Hinweis',
    'Zu frueh verkauft, ohne dass eine Regel das verlangt hat'
  ];

  const CHECKLIST = [
    'Market trend determined (Green/Yellow/Red)',
    'Volume > 30 million',
    'ADR > 5% or CFD available',
    'Industry rank < 30 (1/6/12)',
    '+30% in last 30 days',
    'Linear pullback & undercut/reclaim of 10/20 SMA',
    'At least 1 surf day above 10/20 SMA',
    'Clear daily trendline visible in chart',
    'Position size calculated properly for equity and risk (max 2%)',
    'Stop loss logically defined (below structure)',
    'Mental Game: Do I have rational reasons for this trade? (yes=1/no=0)',
    'Pre-trade screenshot taken for documentation'
  ];

  const EQUITY = 30000;

  function buildTrades(count = 34) {
    const trades = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      // 3 von 4 Trades regelkonform. Das ist die Aussage des Datensatzes:
      // die Regelbrueche kosten ueberproportional.
      const followed = rnd() > 0.26;

      const entry = new Date(today);
      entry.setDate(entry.getDate() - Math.floor((count - i) * 2.6) - Math.floor(rnd() * 3));
      const exit = new Date(entry);
      exit.setDate(exit.getDate() + 1 + Math.floor(rnd() * 9));
      if (exit > today) exit.setTime(today.getTime());   // nichts in der Zukunft

      const entryPrice = round(18 + rnd() * 320);
      const riskPct    = followed ? 0.008 + rnd() * 0.012 : 0.03 + rnd() * 0.02;
      const stopLoss   = round(entryPrice * (1 - (0.05 + rnd() * 0.04)));
      const shares     = Math.max(1, Math.round((EQUITY * riskPct) / (entryPrice - stopLoss)));

      // Regelkonform: Erwartungswert positiv, Verluste am Stop begrenzt.
      // Regelbruch: haeufiger Verlust, und der Verlust laeuft weiter als geplant.
      const win = followed ? rnd() > 0.42 : rnd() > 0.72;
      const movePct = win
        ? (followed ? 0.05 + rnd() * 0.18 : 0.03 + rnd() * 0.08)
        : -(followed ? 0.04 + rnd() * 0.03 : 0.07 + rnd() * 0.11);

      const exitPrice = round(entryPrice * (1 + movePct));
      const commission = round(1.5 + rnd() * 3);
      const pnl = round((exitPrice - entryPrice) * shares - commission);

      const ticked = followed
        ? CHECKLIST.slice()
        : CHECKLIST.filter(() => rnd() > 0.42);

      trades.push({
        id: `demo_${entry.getTime()}_${i}`,
        isDemo: true,

        symbol: pick(SYMBOLS),
        side: 'Long',
        direction: 'Long',
        setup: pick(SETUPS),
        status: 'closed',

        entryDate: entry.toISOString().split('T')[0],
        exitDate:  exit.toISOString().split('T')[0],
        date:      entry.toISOString().split('T')[0],

        entryPrice,
        exitPrice,
        currentPrice: exitPrice,
        stopLoss,
        quantity: shares,
        shares,
        positionSize: round(entryPrice * shares),
        aptr14: round(4 + rnd() * 7, 1),

        pnl,
        profit: pnl,
        commission,

        ruleAdherence: followed,
        ruleCompliance: followed,
        ruleViolationReason: followed ? '' : pick(VIOLATIONS),
        checklist: ticked,
        tradeGrade: followed ? (win ? 'A' : 'B') : 'C',

        mentalGame: {
          rationalReasons: followed ? 1 : 0,
          note: followed
            ? 'Plan vor dem Einstieg geschrieben, Stop stand vorher fest.'
            : 'Im Moment entschieden. Kein Plan, kein vorher gesetzter Stop.'
        },

        setupNotes: followed
          ? 'Setup erfuellt alle Kriterien, Volumen und ADR im Rahmen.'
          : 'Setup unvollstaendig, Kriterien nicht geprueft.',
        executionNotes: win
          ? 'Ziel erreicht, Ausstieg nach Plan.'
          : (followed ? 'Stop sauber ausgeloest, Verlust wie geplant.' : 'Stop nachgezogen statt ausgefuehrt.'),
        notes: 'Demo-Daten, erfunden',
        screenshots: [],
        broker: 'Demo'
      });
    }
    return trades;
  }

  function open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  async function write(rows) {
    const db = await open();
    await new Promise((res, rej) => {
      const tx = db.transaction([STORE], 'readwrite');
      const os = tx.objectStore(STORE);
      rows.forEach((t) => os.put(t));
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }

  async function removeDemo() {
    const db = await open();
    const rows = await new Promise((res, rej) => {
      const r = db.transaction([STORE], 'readonly').objectStore(STORE).getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const demo = rows.filter((t) => t.isDemo === true);
    await new Promise((res, rej) => {
      const tx = db.transaction([STORE], 'readwrite');
      const os = tx.objectStore(STORE);
      demo.forEach((t) => os.delete(t.id));
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
    console.log(`${demo.length} Demo-Trades entfernt. Seite neu laden.`);
  }

  const trades = buildTrades();
  write(trades).then(() => {
    const sum = (a) => a.reduce((s, t) => s + t.pnl, 0);
    const ok  = trades.filter((t) => t.ruleAdherence);
    const bad = trades.filter((t) => !t.ruleAdherence);
    console.log(`${trades.length} Demo-Trades geschrieben. Seite neu laden.`);
    console.table({
      'Regeln eingehalten': { Trades: ok.length,  'Summe P&L': round(sum(ok)) },
      'Regeln gebrochen':   { Trades: bad.length, 'Summe P&L': round(sum(bad)) }
    });
  }).catch((e) => console.error('Fehlgeschlagen:', e));

  window.seedDemoData = { remove: removeDemo, build: buildTrades };
})();
