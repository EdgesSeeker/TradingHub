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
Feld, ob die Regeln eingehalten wurden, und wenn nicht, warum. Das ist der
ganze Kern.

## Was drin steckt

**Eine Checkliste vor jedem Einstieg.** Dreizehn Punkte mit harten Zahlen, kein
Bauchgefuehl. Sie steht in `src/components/BookOfTruth.js` und laeuft vor der
Eingabe, nicht danach.

**Regeltreue als Datenfeld.** `ruleAdherence` und `ruleViolationReason` liegen an
jedem Trade. Damit ist die Frage "war das Pech oder war ich es" auswertbar statt
Erinnerung.

**Ein Wochenbericht, den ein Sprachmodell schreibt.** `src/services/aiAnalysis.js`
baut aus den Trades der Woche einen Prompt, schickt ihn an die Anthropic-API und
zerlegt die Antwort. Interessant daran sind drei Stellen:

- Der Prompt endet mit der Anweisung, **keine Empfehlungen** zu geben, sondern
  nur eine faktische Zusammenfassung fuer die manuelle Durchsicht. Ich wollte
  eine Auswertung, keinen Ratgeber.
- Die Daten werden auf zwanzig Trades und feste Feldlaengen beschnitten, bevor
  sie rausgehen.
- Es gibt einen `createFallbackAnalysis`, der die Zahlen lokal rechnet, wenn die
  API nicht antwortet. Der Bericht kommt also auch dann.

**Eigene Speicher- und Migrationsschicht.** `src/utils/storage.js`,
`migration.js` und `dataValidation.js`. Die App laeuft offline im Browser, die
Daten liegen lokal, und aeltere Datenstaende werden beim Start auf das aktuelle
Schema gehoben.

## Was ich heute anders machen wuerde

**Der API-Schluessel gehoert nicht in den Browser.** Er kam frueher direkt aus
dem Code, jetzt aus der Umgebung, aber bei Create React App landet auch eine
`REACT_APP_`-Variable beim Bauen fest im Bundle. Richtig waere ein kleiner
eigener Server, der den Aufruf macht und den Schluessel behaelt. Fuer eine App,
die nur bei mir lokal laeuft, war das kein Problem. Fuer eine, die jemand
aufruft, waere es eins.

**Einzelne Komponenten sind zu gross geworden.** `TradingEquityCurve.js` hat
ueber 4.000 Zeilen. Das ist gewachsen und nicht geschnitten.

## Stack

React, Recharts, Tailwind, lokale Speicherung im Browser, Anthropic-API fuer den
Wochenbericht.

## Lokal starten

```bash
npm install
cp .env.example .env    # Anthropic-Schluessel eintragen, optional
npm start
```

Ohne Schluessel laeuft alles ausser dem KI-Wochenbericht. Der faellt dann auf
die lokale Auswertung zurueck.

---

## Funktionen im Einzelnen

#### 📊 Dashboard
- **Manuelle Trade-Eingabe**: Trades direkt in der Anwendung eingeben
- **P&L Verkauf**: Gewinne teilweise oder komplett verkaufen
- **Trading Statistiken**: 
  - Gesamte Trades
  - Win Rate (%)
  - Net P&L
  - Expected Value
  - Profit Factor
  - Anzahl Gewinner/Verlierer
  - Durchschnittlicher Gewinn/Verlust
  - Größter Gewinn/Verlust

#### 📈 P&L Verlauf
- Interaktive Grafik des kumulativen P&L über Zeit
- Detaillierte P&L-Informationen

#### 💼 Portfolio
- Übersicht aller Trades mit Such- und Filterfunktionen
- P&L Verkäufe anzeigen und verwalten
- Sortierung nach verschiedenen Kriterien
- CSV-Export der Trading-Daten

#### 📝 Journal
- Trading-Notizen und Reflexionen
- Lektionen und Strategien dokumentieren
- Filterung und Suche in Journal-Einträgen

#### ⚙️ Weitere Features
- **Zeitraum-Auswahl**: Heute, diese Woche, dieser Monat, Jahr, Benutzerdefiniert
- **Offline-Funktionalität**: Alle Daten werden lokal im Browser gespeichert
- **Moderne UI**: Sauberes, responsives Design
- **Keine Server-Kosten**: Läuft komplett lokal

## Installation

#### Voraussetzungen
- Node.js (Version 14 oder höher)
- npm (wird mit Node.js installiert)

#### Installation durchführen

1. **Node.js installieren** (falls noch nicht vorhanden):
   - Gehen Sie zu https://nodejs.org/
   - Laden Sie die LTS-Version herunter und installieren Sie sie

2. **Projekt starten**:
   ```bash
   cd "C:\Trading\Automated Trading\TradingJournal"
   npm install
   npm start
   ```

3. **Browser öffnen**:
   - Die Anwendung öffnet sich automatisch unter `http://localhost:3000`

## Verwendung

#### Trades manuell eingeben

1. **Auf der Startseite** klicken Sie auf "Trade manuell hinzufügen"
2. **Füllen Sie die Felder aus**:
   - Symbol (z.B. AAPL, EURUSD)
   - Seite (Kauf/Verkauf)
   - Menge
   - Einstiegs- und Ausstiegspreis
   - Einstiegs- und Ausstiegsdatum
   - Broker (XTB, IBKR, Andere)
   - Kommission (optional)
   - Notizen (optional)
3. **Klicken Sie auf "Trade hinzufügen"**

#### P&L verkaufen

1. **Auf der Startseite** finden Sie den P&L Verkauf-Bereich
2. **Wählen Sie den Verkaufstyp**:
   - Komplett verkaufen
   - Teilweise verkaufen (Betrag oder Prozent)
3. **Geben Sie den Grund an** (Gewinnmitnahme, Risikomanagement, etc.)
4. **Bestätigen Sie den Verkauf**

#### Navigation

- **Dashboard**: Übersicht und Trade-Eingabe
- **P&L Verlauf**: Grafik der Gewinnentwicklung
- **Portfolio**: Alle Trades und Verkäufe
- **Journal**: Trading-Notizen

#### Zeitraum-Filter

Wählen Sie verschiedene Zeiträume für die Analyse:
- Heute
- Diese Woche
- Dieser Monat
- Dieses Jahr
- Alle Trades

## Datenspeicherung

#### Lokale Speicherung
- **IndexedDB**: Alle Trades, P&L Verkäufe und Einstellungen werden lokal im Browser gespeichert
- **Keine Server-Kommunikation**: Alle Daten bleiben auf Ihrem Computer
- **Offline-Funktionalität**: Die Anwendung funktioniert ohne Internetverbindung

#### Datenexport
- **CSV-Export**: Trades können als CSV-Datei exportiert werden
- **Browser-Daten**: Alle Daten sind in Ihrem Browser gespeichert

## Technischer Stack

- **Frontend**: React 18
- **Styling**: Custom CSS (Tailwind-inspiriert)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Datenbank**: IndexedDB (Browser)
- **Datum**: date-fns

## Datenschutz

- **100% lokal**: Keine Daten werden an externe Server gesendet
- **Browser-Speicherung**: Alle Daten bleiben in Ihrem Browser
- **Keine Tracking**: Keine Analyse- oder Tracking-Tools

## Troubleshooting

#### "npm" Befehl nicht gefunden
- Stellen Sie sicher, dass Node.js installiert ist
- Öffnen Sie eine neue Kommandozeile nach der Installation

#### Anwendung startet nicht
- Überprüfen Sie, ob Sie im richtigen Verzeichnis sind
- Führen Sie `npm install` erneut aus

#### Daten verschwinden
- Überprüfen Sie die Browser-Einstellungen
- Stellen Sie sicher, dass IndexedDB aktiviert ist

## Zukünftige Features

- [ ] Erweiterte Chart-Analysen
- [ ] Trading-Strategien-Templates
- [ ] Performance-Metriken
- [ ] Backup/Restore-Funktionalität
- [ ] Dark Mode
- [ ] Mobile App

## Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Stellen Sie sicher, dass alle Abhängigkeiten installiert sind
3. Testen Sie mit einem anderen Browser

---

**Hinweis**: Diese Anwendung ist für lokale Nutzung konzipiert. Alle Trading-Entscheidungen liegen in Ihrer Verantwortung.
