# Trading Journal

Ein Werkzeug, das mich an meine eigenen Regeln bindet. Gebaut 2025, weil ich
sie unter Druck gebrochen habe und es hinterher nicht mehr wusste.

## Warum

Ich habe Aktien gehandelt und dafuer klare Kriterien aufgeschrieben. Volumen
ueber 30 Millionen, ADR ueber 5 Prozent, maximal 2 Prozent Risiko pro Position,
Stop unter der Struktur. Auf dem Papier hielt ich mich daran. In der Praxis
nicht, und im Nachhinein liess sich nicht mehr sagen, welcher Verlust aus einem
schlechten Setup kam und welcher daraus, dass ich meine eigene Liste ignoriert
habe.

Also habe ich die Liste in Software gegossen. Jeder Trade traegt seitdem ein
Feld, ob die Regeln eingehalten wurden, und wenn nicht, warum. Das ist der Kern.

## Was drin steckt

**Eine Checkliste vor jedem Einstieg.** Dreizehn Punkte mit harten Zahlen, kein
Bauchgefuehl. Sie steht in `src/components/BookOfTruth.js` und laeuft vor der
Eingabe, nicht danach.

**Regeltreue als Datenfeld.** `ruleAdherence` und `ruleViolationReason` liegen an
jedem Trade. Damit ist die Frage "war das Pech oder war ich es" auswertbar statt
Erinnerung.

**Ein Wochenbericht, den ein Sprachmodell schreibt.** `src/services/aiAnalysis.js`
baut aus den Trades der Woche einen Prompt, schickt ihn an die Anthropic-API und
zerlegt die Antwort. Drei Stellen darin sind die interessanten:

- Der Prompt endet mit der Anweisung, **keine Empfehlungen** zu geben, sondern
  nur eine faktische Zusammenfassung fuer die manuelle Durchsicht. Ich wollte
  eine Auswertung, keinen Ratgeber.
- Die Daten werden auf zwanzig Trades und feste Feldlaengen beschnitten, bevor
  sie rausgehen.
- Es gibt einen `createFallbackAnalysis`, der die Zahlen lokal rechnet, wenn die
  API nicht antwortet. Der Bericht kommt also auch dann.

**Eigene Speicher- und Migrationsschicht.** `src/utils/storage.js`,
`migration.js` und `dataValidation.js`. Die Daten liegen in der IndexedDB des
Browsers, und aeltere Datenstaende werden beim Start auf das aktuelle Schema
gehoben.

## Was ich heute anders machen wuerde

**Der API-Schluessel gehoert nicht in den Browser.** Er kam frueher direkt aus
dem Code, jetzt aus der Umgebung, aber bei Create React App landet auch eine
`REACT_APP_`-Variable beim Bauen fest im Bundle. Richtig waere ein kleiner
eigener Server, der den Aufruf macht und den Schluessel behaelt. Fuer eine App,
die nur lokal bei mir laeuft, war das kein Problem. Fuer eine, die jemand
aufruft, waere es eins.

**Einzelne Komponenten sind zu gross geworden.** `TradingEquityCurve.js` hat
ueber 4.000 Zeilen. Das ist gewachsen und nicht geschnitten.

## Funktionen

**Dashboard.** Trade-Eingabe von Hand, Teil- und Komplettverkaeufe, dazu die
Kennzahlen: Trefferquote, Netto-Ergebnis, Erwartungswert, Profitfaktor,
Durchschnitt und Extremwerte je Trade.

**Verlauf.** Kumulatives Ergebnis ueber die Zeit als Kurve, mit Zeitraum-Filter
von heute bis alles.

**Portfolio.** Alle Trades mit Suche, Filter und Sortierung, Export als CSV.

**Journal.** Notizen und Lehren je Trade, durchsuchbar.

**Wochenrueckblick.** Der KI-Bericht oben, plus eine lokale Auswertung als
Rueckfallebene.

## Wo die Daten liegen

Trades, Verkaeufe und Einstellungen liegen in der **IndexedDB des Browsers**,
also auf dem eigenen Rechner. Kein Server, kein Konto, kein Tracking.

**Eine Ausnahme, und sie ist wichtig:** wer den KI-Wochenbericht benutzt,
schickt die Trades dieser Woche an die Anthropic-API. Ohne Schluessel passiert
das nicht, dann rechnet die lokale Rueckfallebene.

## Stack

React 18, Recharts, Lucide, date-fns, eigenes CSS, IndexedDB, Anthropic-API
fuer den Wochenbericht.

## Lokal starten

```bash
npm install
cp .env.example .env    # Anthropic-Schluessel eintragen, optional
npm start
```

Laeuft auf `http://localhost:3000`. Ohne Schluessel funktioniert alles ausser
dem KI-Wochenbericht, der faellt dann auf die lokale Auswertung zurueck.
