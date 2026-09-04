# Trading Journal

Ein Trading-Journal, das die Qualitaet einer Entscheidung vom Ergebnis trennt.
Gebaut 2025, damit ich messen kann, ob ich mich an mein eigenes System gehalten
habe.

## Warum

Ich handle Aktien, seit ich siebzehn bin. Irgendwann habe ich gemerkt, dass
Bauchgefuehl nicht traegt. Man braucht klare Regeln, und man braucht ein System,
das festhaelt, ob man ihnen gefolgt ist.

Der Grund dafuer ist nicht Disziplin, sondern Messbarkeit. **Ein guter Trade
kann ein Verlust-Trade sein.** Wenn ich mich an mein System gehalten habe und es
geht trotzdem schief, war die Entscheidung richtig und ich aendere nichts. Wenn
ich mich nicht daran gehalten habe und es geht gut, war es Glueck, und daraus
lerne ich das Falsche. Ohne diese Trennung bewertet man jeden Trade nach dem
Ausgang, und dann optimiert man auf Zufall.

Deshalb traegt hier jeder Trade ein Feld, ob die Regeln eingehalten wurden, und
wenn nicht, warum. Erst dadurch werden Anpassungen pruefbar: wenn ich das Risiko
pro Position senke oder ein Setup streiche, sehe ich hinterher an den Zahlen, ob
es gewirkt hat, statt es zu glauben.

Die Kriterien selbst sind hart und nicht verhandelbar. Volumen ueber 30
Millionen, ADR ueber 5 Prozent, maximal 2 Prozent Risiko pro Position, Stop
unter der Struktur. Sie stehen als Pflicht-Checkliste vor der Eingabe.

## Was drin steckt

**Eine Checkliste vor jedem Einstieg.** Zwoelf Punkte mit harten Zahlen, kein
Bauchgefuehl. Sie steht in `src/components/TradePlanning.js` und laeuft vor der
Eingabe, nicht danach. Der Trade laesst sich auch mit unvollstaendiger Liste
speichern, aber dann steht es in den Daten.

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

**Der Depotwert hat vier Quellen und keine gewinnt zuverlaessig.** Er steht als
Einstellung in der IndexedDB, wird beim Laden aber aus drei localStorage-Listen
ueberschrieben (`equityCurve`, `manualEquityEntries`, `currentEquity`, jeweils
der hoechste Wert), und wenn keine davon etwas hergibt, faellt der Code auf eine
fest verdrahtete Zahl zurueck. Alle Prozentangaben im Risiko-Dashboard haengen
daran. Aufgefallen ist es, weil Positionsgroessen ueber 200 Prozent des Depots
angezeigt wurden, obwohl sie auf 22 Prozent gedeckelt waren: gerechnet wurde
gegen einen anderen Depotwert als den gesetzten. Ein Wert gehoert an eine
Stelle.

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

## Demo-Daten

Wer das Projekt frisch startet, sieht eine leere App. `scripts/seed-demo-data.js`
schreibt 34 **erfundene** Trades in die IndexedDB: keine echten Positionen, keine
echten Kurse.

Der Datensatz ist so gebaut, dass er die Aussage oben zeigt. Die 21 Trades mit
eingehaltenen Regeln stehen zusammen im Plus, die 13 Regelbrueche tragen den
gesamten Verlust. Genau diese Trennung soll das Werkzeug sichtbar machen.

App starten, F12 druecken, den Inhalt der Datei in die Console kopieren, Seite
neu laden. Entfernen mit `seedDemoData.remove()`, das fasst nur Zeilen mit
`isDemo: true` an.

## Lokal starten

```bash
npm install
cp .env.example .env    # Anthropic-Schluessel eintragen, optional
npm start
```

Laeuft auf `http://localhost:3000`. Ohne Schluessel funktioniert alles ausser
dem KI-Wochenbericht, der faellt dann auf die lokale Auswertung zurueck.
