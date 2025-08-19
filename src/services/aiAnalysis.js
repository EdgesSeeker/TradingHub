// AI Analysis Service using Antropic API
const ANTHROPIC_API_KEY = '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';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// CORS Proxy URLs to try in order
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors.bridged.cc/'
];

export const getCompanyInfo = async (symbol) => {
  try {
    console.log(`Fetching company info for ${symbol}...`);
    
    const prompt = `Erzeuge eine kompakte Analyse zu folgendem Unternehmen für mein Trading-Journal:

**Was macht das Unternehmen?**
Branche, Geschäftsmodell, Kernprodukte/Dienstleistungen, Hauptmärkte (1–3 Sätze)

**Wichtige aktuelle Katalysten:**
Nenne die 2–3 wichtigsten Ereignisse, Trends oder Entwicklungen, die den Aktienkurs in den nächsten 6–12 Monaten beeinflussen können (z.B. neue Produkte, strategische Partnerschaften, regulatorische Änderungen, Branchentrends, Übernahmen/Fusionen).

**Kurshebel & Potenzial:**
Welche konkreten Gründe/Katalysten sprechen dafür, dass sich der Aktienkurs in den nächsten 12–24 Monaten verdoppeln könnte? (Fasse alle relevanten Argumente und Szenarien zusammen; keine spekulativen Aussagen, sondern belegbare Chancen.)

**Wichtige geschäftliche Termine:**
Stehen relevante Earnings, Kapitalmarkt-Tage oder Firmenveranstaltungen bevor? Wenn ja: Wann und warum sind sie entscheidend?

**Zusätzliche auffällige Risiken oder Gegenargumente:**
Nenne maximal 2 Risiken oder Warnsignale, die gegen eine Verdopplung sprechen könnten (z.B. Bilanz, Wettbewerb, regulatorische Hürden).

Format:
Bulletpoints, klar und kurz, maximal 8–10 Sätze insgesamt.
Keine unnötigen Floskeln, Fokus auf Fakten und Relevanz für kurzfristiges/swing Trading.

Unternehmen: ${symbol}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 Sekunden Timeout
    
    // Try direct API call first
    let response;
    try {
      console.log('🌐 Trying direct API request...');
      response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        signal: controller.signal
      });
    } catch (directError) {
      console.log('Direct API call failed, trying CORS proxies...');
      
      // Try CORS proxies
      for (const proxy of CORS_PROXIES) {
        try {
          console.log(`🔄 Trying proxy: ${proxy}`);
          
          const proxyUrl = proxy + ANTHROPIC_API_URL;
          response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 1000,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ]
            }),
            signal: controller.signal
          });
          
          if (response.ok) {
            console.log(`✅ Proxy ${proxy} succeeded!`);
            break;
          }
        } catch (proxyError) {
          console.log(`❌ Proxy ${proxy} failed:`, proxyError.message);
          continue;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error('All API attempts failed');
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid API response format');
    }
    
    return data.content[0].text;
    
  } catch (error) {
    console.error('Error fetching company info:', error);
    
    // Fallback: Return a basic template when API fails
    return createFallbackCompanyInfo(symbol);
  }
};

const createFallbackCompanyInfo = (symbol) => {
  return `**Was macht das Unternehmen?**
${symbol} ist ein Unternehmen, dessen Geschäftsmodell und Branche analysiert werden sollte. Für detaillierte Informationen empfehle ich eine manuelle Recherche.

**Wichtige aktuelle Katalysten:**
• Earnings Reports und Quartalszahlen
• Neue Produktankündigungen oder Partnerschaften
• Marktentwicklungen und Branchentrends

**Kurshebel & Potenzial:**
• Wachstum in Kernmärkten
• Neue Technologien oder Produktlinien
• Marktanteilsgewinne

**Wichtige geschäftliche Termine:**
• Nächste Earnings-Veröffentlichung (siehe Finanzkalender)
• Analysten-Tage oder Investor Relations Events

**Zusätzliche auffällige Risiken oder Gegenargumente:**
• Marktwettbewerb und Preisdruck
• Regulatorische Herausforderungen

💡 **Hinweis:** Diese Analyse wurde automatisch generiert, da die KI-API nicht verfügbar war. Für eine vollständige Analyse führen Sie bitte eine manuelle Recherche durch.`;
};

export const analyzeWeeklyReport = async (reportData) => {
  try {
    // Prepare the analysis prompt with limited data to avoid CORS and size issues
    const prompt = createAnalysisPrompt(reportData);
    
    console.log('Sending request to Antropic API...');
    console.log('Prompt length:', prompt.length);
    
    // Timeout für die API-Anfrage
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 Sekunden Timeout
    
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid API response format');
    }
    
    return parseAIResponse(data.content[0].text);
    
  } catch (error) {
    console.error('Error calling Antropic API:', error);
    
    // Fallback: Erstelle immer eine lokale Analyse wenn API fehlschlägt
    console.log('Creating fallback analysis due to API error...');
    return createFallbackAnalysis(reportData);
  }
};

const createAnalysisPrompt = (reportData) => {
  // Limit the data to avoid CORS and size issues
  const limitedTrades = reportData.trades.slice(0, 20).map(trade => ({
    symbol: trade.symbol,
    date: trade.date || trade.entryDate || trade.exitDate,
    status: trade.status,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    shares: trade.shares || trade.positionSize,
    pnl: trade.pnl || trade.profit || trade.profitLoss,
    ruleAdherence: trade.ruleAdherence || trade.ruleCompliance,
    ruleViolationReason: trade.ruleViolationReason,
    executionNotes: trade.executionNotes ? trade.executionNotes.substring(0, 300) : '',
    mentalGame: trade.mentalGame ? JSON.stringify(trade.mentalGame).substring(0, 300) : '',
    setupNotes: trade.setupNotes ? trade.setupNotes.substring(0, 200) : '',
    direction: trade.direction,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit
  }));

  const limitedData = {
    ...reportData,
    trades: limitedTrades,
    detailedTrades: limitedTrades
  };

  return `Please analyze the following list of trades from my weekly trading journal. For each trade, fields include symbol, entry and exit prices, position size, profit/loss, status, rule compliance, execution notes, mental game notes, and setup notes.

Your task is to generate a concise weekly summary report including:

**Basic statistics:**
- Total number of trades
- Number and percentage of winning and losing trades
- Overall win rate (%)
- Total net profit/loss ($)
- Average profit/loss per trade ($)
- Maximum single trade winner and loser with symbol and P&L
- Rule compliance count and percentage

**Performance by setup type:**
- List setups used with number of trades, win rate, and net P&L for each setup

**Common mistakes or issues flagged in the data:**
- Frequency and types of rule violations (e.g., entry without trigger, oversized position, stop loss missing)
- Emotional or influencer-driven trades (trade notes mentioning Discord, FOMO, external calls, etc.)
- Any pattern or repeated errors noted in mental game comments
- Position sizing issues (too large positions, inconsistent sizing)
- Entry timing problems (chasing, late entries, poor setups)
- Exit strategy issues (no stop loss, no take profit, emotional exits)
- Setup quality problems (weak setups, no clear catalyst, poor risk/reward)

**Trade status summary:**
- Number of open vs. closed positions
- Overview of unrealized P&L on open trades, if available

**Other key numeric insights you find relevant** (e.g., average risk-reward ratio if data available)

At the end, provide a brief paragraph highlighting main observations from the data (e.g., "Win rate is X%, but rule compliance is low, with frequent position sizing issues noted."), but do not deliver deep coaching or recommendations—this is only a factual summary for further manual review.

**Trade Data:**
${JSON.stringify(limitedData, null, 2)}

Please format the response clearly with sections and bullet points for easy reading.`;
};

const parseAIResponse = (responseText) => {
  try {
    // Clean markdown artifacts for a tidy plain-text view
    const noBold = responseText.replace(/\*\*(.*?)\*\*/g, '$1');
    const noHashes = noBold.replace(/^#+\s*/gm, '');
    const cleaned = noHashes.trim();
    return { rawText: cleaned };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return { rawText: responseText || 'Parsing error.' };
  }
};

const createFallbackAnalysis = (reportData) => {
  try {
    const { summary, trades, detailedTrades, mistakes, highlights, ruleViolations } = reportData;
    
    // Berechne zusätzliche Metriken
    const symbolsTraded = [...new Set(trades.map(t => t.symbol))];
    const avgPnL = summary.totalTrades > 0 ? summary.totalPnL / summary.totalTrades : 0;
    const riskRewardRatio = summary.avgLoss !== 0 ? summary.avgWin / Math.abs(summary.avgLoss) : 0;
    
    // Beste und schlechteste Trades
    const bestTrade = trades.reduce((best, trade) => 
      (trade.pnl || 0) > (best.pnl || 0) ? trade : best, trades[0] || {});
    const worstTrade = trades.reduce((worst, trade) => 
      (trade.pnl || 0) < (worst.pnl || 0) ? trade : worst, trades[0] || {});
    
    // Setup-Analyse
    const setupTypes = {};
    detailedTrades.forEach(trade => {
      if (trade.setupNotes) {
        const setup = trade.setupNotes.split(' ')[0] || 'Unknown';
        setupTypes[setup] = (setupTypes[setup] || 0) + 1;
      }
    });
    
    const setupStats = Object.entries(setupTypes)
      .map(([setup, count]) => `${setup}: ${count}`)
      .join(', ');
    
    return {
      rawText: `Weekly Trade Data Summary – Week ${reportData.weekNumber}/${reportData.year}

Basic Statistics
Total number of trades: ${summary.totalTrades}

Winning trades: ${summary.winningTrades}

Losing trades: ${summary.losingTrades}

Win rate: ${summary.winRate.toFixed(1)}%

Total net profit/loss: $${summary.totalPnL.toFixed(2)}

Average profit/loss per trade: $${avgPnL.toFixed(2)}

Maximum winner: ${bestTrade.symbol || 'N/A'} ${bestTrade.status || 'closed'}, +$${bestTrade.pnl || 0}

Maximum loser: ${worstTrade.symbol || 'N/A'} ${worstTrade.status || 'closed'}, -$${Math.abs(worstTrade.pnl || 0)}

Rule compliance count: ${summary.ruleCompliance}/${summary.totalTrades}

Rule compliance percentage: ${summary.totalTrades > 0 ? ((summary.ruleCompliance / summary.totalTrades) * 100).toFixed(1) : 0}%

Performance by Setup Type
${setupStats || 'No setup types identified'}

Common Mistakes / Issues Flagged
Rule violations: ${summary.ruleViolations}/${summary.totalTrades} trades indicated as violating some rule.

Frequent issues:
- Entry without clear trigger/setup
- Sizing not according to system
- Influencer driven trades
- Emotional triggers and FOMO

Trade Status Summary
Closed positions: ${summary.totalTrades - summary.openTrades}

Open positions: ${summary.openTrades}

Unrealized P&L: Not available in provided data

Other Key Numeric Insights
Average position size: Not directly calculable
Number of trades with mental game notes: ${trades.filter(t => t.mentalGame && Object.keys(t.mentalGame).length > 0).length}

Main Observations
Win rate this week is ${summary.winRate.toFixed(1)}% across ${summary.totalTrades} trades, with a ${summary.totalPnL >= 0 ? 'positive' : 'negative'} total net profit of $${summary.totalPnL.toFixed(2)}. Rule compliance is ${((summary.ruleCompliance / summary.totalTrades) * 100).toFixed(1)}%, indicating ${summary.ruleCompliance === 0 ? 'no' : 'some'} trades followed the established rules. ${summary.ruleViolations > 0 ? `There were ${summary.ruleViolations} rule violations noted.` : ''} This pattern suggests ${summary.ruleCompliance === 0 ? 'process risk remains high' : 'mixed adherence to trading plan'} even with overall ${summary.totalPnL >= 0 ? 'profit' : 'loss'}.`
    };
    
  } catch (error) {
    console.error('Error in fallback analysis:', error);
    return {
      rawText: 'Fallback analysis failed due to error in data processing.'
    };
  }
};

export const exportAIAnalysis = (analysis, weekNumber, year) => {
  let content = `KI-GENERIERTER WEEKLY REPORT - Woche ${weekNumber}/${year}\n`;
  content += `Generiert: ${new Date().toLocaleString()}\n`;
  content += '='.repeat(80) + '\n\n';

  const text = analysis.rawText || '';
  content += text + '\n';

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ki_analysis_woche_${weekNumber}_${year}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
