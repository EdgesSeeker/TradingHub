import React, { useState, useEffect } from 'react';
import storage from '../utils/storage';

const TopOps = () => {
  const [selectedTrade, setSelectedTrade] = useState('');
  const [completedTrades, setCompletedTrades] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [tags, setTags] = useState({});
  const [screenshots, setScreenshots] = useState({});
  const [checklist, setChecklist] = useState({});
  
  // New state for unsaved changes and view mode
  const [unsavedNotes, setUnsavedNotes] = useState({});
  const [unsavedTags, setUnsavedTags] = useState({});
  const [unsavedTagArrays, setUnsavedTagArrays] = useState({});
  const [unsavedScreenshots, setUnsavedScreenshots] = useState({});
  const [unsavedChecklist, setUnsavedChecklist] = useState({});
  const [isViewMode, setIsViewMode] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [categories, setCategories] = useState([
    "Fresh Breaking News Trades",
    "Offerings (Kapitalerhöhungen, Platzierungen)",
    "Breakouts",
    "Exhaustion Gaps oder Panics (Blow-Offs)",
    "Daily Swings/Volatility Trades",
    "Bouncy Ball Breakdowns / Dead Cat Bounces",
    "Squeeze/Short Squeeze Plays",
    "Reversals (Trendwenden nach langen Moves)"
  ]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const analysisQuestions = [
    "What was the Move?",
    "Was there breaking news?",
    "What was the broader market context?",
    "What catalysts or headlines moved the ticker?",
    "Was this expected or unexpected?",
    "What did the chart look like before the move?",
    "Where were the key levels?",
    "What pattern was it (breakout, breakdown, panic, bounce, etc.)?",
    "Multi-day setup or one-day play?",
    "What was the volume relative to average?",
    "Was there liquidity?",
    "Tape action / halts?",
    "How could one have traded this opportunity?",
    "Long vs. short thesis",
    "Entries and exits",
    "Risk/reward alignment",
    "Was I involved? Why or why not?",
    "Did I execute my plan?",
    "If no trade: what held me back?",
    "How to spot this in real time?",
    "Was it on my watchlist?",
    "Which category does it belong to?",
    "What is the core lesson?",
    "How does this fit into my playbook?",
    "What would I do differently?",
    "Rate A+, B, or C setup"
  ];

  const checklistItems = [
    "Chart analysieren",
    "Volumen analysieren", 
    "News analysieren",
    "Entries/Exits definieren",
    "Risk/Reward kalkulieren",
    "Psychology reflektieren",
    "Lessons learned festhalten"
  ];

  const trades = [
    // 2022
    { id: 'btc-11-8-9-2022', title: 'BTC (11/8–9/2022)', date: '2022-11-08' },
    { id: 'aapl-11-10-2022', title: 'AAPL (11/10/2022)', date: '2022-11-10' },
    { id: 'tsla-11-10-2022', title: 'TSLA (11/10/2022)', date: '2022-11-10' },
    { id: 'uso-11-18-20-2022', title: 'USO (11/18–20/2022)', date: '2022-11-18' },
    { id: 'mrtx-11-22-2022', title: 'MRTX (11/22/2022)', date: '2022-11-22' },
    
    // 2023
    { id: 'bbby-1-10-13-2023', title: 'BBBY (1/10–13/2023)', date: '2023-01-10' },
    { id: 'gns-1-19-20-2023', title: 'GNS (1/19–20/2023)', date: '2023-01-19' },
    { id: 'nflx-1-20-2023', title: 'NFLX (1/20/2023)', date: '2023-01-20' },
    { id: 'lucid-1-27-2023', title: 'LCID (1/27/2023)', date: '2023-01-27' },
    { id: 'amc-ape-1-27-2023', title: 'AMC/APE (1/27/2023)', date: '2023-01-27' },
    { id: 'msgm-1-31-2023', title: 'MSGM (1/31/2023)', date: '2023-01-31' },
    { id: 'ai-best-march-2023', title: 'AI (best March 2023)', date: '2023-03-15' },
    { id: 'cxai-april-2023', title: 'CXAI (April 2023)', date: '2023-04-01' },
    { id: 'atlx-5-3-4-2023', title: 'ATLX (5/3–4/2023)', date: '2023-05-03' },
    { id: 'nvda-5-24-ah-2023', title: 'NVDA (5/24 AH 2023)', date: '2023-05-24' },
    { id: 'ucar-6-1-2023', title: 'UCAR (6/1/2023)', date: '2023-06-01' },
    { id: 'ai-june-2023', title: 'AI (June 2023)', date: '2023-06-15' },
    { id: 'btc-coin-7-13-2023', title: 'BTC/COIN (7/13/2023)', date: '2023-07-13' },
    { id: 'arm-ipo-sept-2023', title: 'ARM IPO (September 2023)', date: '2023-09-14' },
    { id: 'cart-ipo-sept-2023', title: 'CART IPO (September 2023)', date: '2023-09-19' },
    { id: 'tsla-10-2-2023', title: 'TSLA (10/2/2023)', date: '2023-10-02' },
    { id: 'ai-nov-20-2023', title: 'AI (11/20/2023)', date: '2023-11-20' },
    { id: 'coin-mara-late-dec-2023', title: 'COIN/MARA (late Dec 2023)', date: '2023-12-20' },
    
    // 2024
    { id: 'cytk-1-8-2024', title: 'CYTK (1/8/2024)', date: '2024-01-08' },
    { id: 'nvda-1-8-2024', title: 'NVDA (1/8/2024)', date: '2024-01-08' },
    { id: 'smci-1-19-2024', title: 'SMCI (1/19/2024)', date: '2024-01-19' },
    { id: 'uso-2-1-2024', title: 'USO (2/1/2024)', date: '2024-02-01' },
    { id: 'smci-2-5-2024', title: 'SMCI (2/5/2024)', date: '2024-02-05' },
    { id: 'smci-3-1-2024', title: 'SMCI (3/1/2024)', date: '2024-03-01' },
    { id: 'btc-3-5-2024', title: 'BTC (3/5/2024)', date: '2024-03-05' },
    { id: 'nvda-3-8-2024', title: 'NVDA (3/8/2024)', date: '2024-03-08' },
    { id: 'rddt-march-2024', title: 'RDDT (March 2024)', date: '2024-03-21' },
    { id: 'djt-4-1-2024', title: 'DJT (4/1/2024)', date: '2024-04-01' },
    { id: 'btc-4-12-2024', title: 'BTC (4/12/2024)', date: '2024-04-12' },
    { id: 'gld-4-12-2024', title: 'GLD (4/12/2024)', date: '2024-04-12' },
    { id: 'gme-amc-may-2024', title: 'GME/AMC (May 2024)', date: '2024-05-01' },
    { id: 'gme-amc-june-2024', title: 'GME/AMC (June 2024)', date: '2024-06-01' },
    { id: 'nvda-semis-june-2024', title: 'NVDA/Semis (June 2024)', date: '2024-06-15' },
    { id: 'panic-august-2024', title: 'Panic (/NKD, /NQ, AAPL, BAC, CRWD, Semis, VXX)', date: '2024-08-01' },
    { id: 'smci-august-2024', title: 'SMCI (August 2024)', date: '2024-08-15' },
    { id: 'china-gap-9-30-2024', title: '"China gap" (9/30/2024)', date: '2024-09-30' },
    { id: 'china-tech-oct-2024', title: 'China tech (TIGR, FUTU, JD, BABA)', date: '2024-10-01' },
    { id: 'oil-oct-2024', title: 'Oil (October 2024)', date: '2024-10-15' },
    { id: 'smci-11-4-2024', title: 'SMCI (11/4/2024)', date: '2024-11-04' },
    { id: 'btc-nov-2024', title: 'BTC (November 2024)', date: '2024-11-15' },
    { id: 'mstr-short-11-21-2024', title: 'MSTR short (11/21/2024, best intraday)', date: '2024-11-21' },
    { id: 'btc-breakout-nov-2024', title: 'BTC breakout (best swing November 2024)', date: '2024-11-25' },
    { id: 'euphoria-reversal-12-27-30-2024', title: 'Euphoria reversal (12/27, 12/30/2024)', date: '2024-12-27' },
    { id: 'fnma-12-30-2024', title: 'FNMA (12/30/2024)', date: '2024-12-30' },
    
    // 2025
    { id: 'qnccf-1-2-2025', title: 'QNCCF (1/2/2025)', date: '2025-01-02' },
    { id: 'fnma-breakout-1-15-2025', title: 'FNMA breakout (1/15/2025)', date: '2025-01-15' },
    { id: 'quantum-names-1-7-2025', title: 'Quantum names (from 1/7/2025)', date: '2025-01-07' },
    { id: 'deepseek-1-24-27-2025', title: 'Deepseek (1/24, 1/27/2025)', date: '2025-01-24' },
    { id: 'tariff-tickers-1-31-2025', title: 'Tariff tickers (1/31/2025)', date: '2025-01-31' },
    { id: 'mbt-2-2-2025', title: '/MBT (2/2/2025)', date: '2025-02-02' },
    { id: 'eth-2-2-2025', title: '/ETH (2/2/2025)', date: '2025-02-02' },
    { id: 'pltr-2-19-2025', title: 'PLTR (2/19/2025)', date: '2025-02-19' },
    { id: 'smci-2-19-2025', title: 'SMCI (2/19/2025)', date: '2025-02-19' },
    { id: 'uso-3-3-2025', title: 'USO (3/3/2025)', date: '2025-03-03' },
    { id: 'tariff-headline-3-5-2025', title: 'Tariff headline (3/5/2025)', date: '2025-03-05' },
    { id: 'lmt-ba-3-21-2025', title: 'LMT/BA (3/21/2025)', date: '2025-03-21' },
    { id: 'tariff-decision-4-2-2025', title: 'Tariff decision (4/2/2025)', date: '2025-04-02' },
    { id: 'china-raising-tariffs-4-4-2025', title: 'China raising tariffs (4/4/2025)', date: '2025-04-04' },
    { id: 'market-reversal-4-7-2025', title: 'Market reversal (4/7/2025)', date: '2025-04-07' },
    { id: 'nq-overextension-4-10-2025', title: 'NQ overextension (4/10/2025)', date: '2025-04-10' },
    { id: 'nvda-ah-headline-4-15-2025', title: 'NVDA AH headline (4/15/2025)', date: '2025-04-15' },
    { id: 'gld-4-22-2025', title: 'GLD (4/22/2025)', date: '2025-04-22' },
    { id: 'trump-headline-4-22-2025', title: 'Trump headline (4/22/2025)', date: '2025-04-22' },
    { id: 'ktta-5-6-2025', title: 'KTTA (5/6/2025)', date: '2025-05-06' },
    { id: 'goog-5-7-2025', title: 'GOOG (5/7/2025)', date: '2025-05-07' },
    { id: 'tariff-announcement-5-12-2025', title: 'Tariff announcement (5/12/2025)', date: '2025-05-12' },
    { id: 'pltr-5-13-2025', title: 'PLTR (5/13/2025)', date: '2025-05-13' },
    { id: 'nuclear-trump-tweet-5-22-2025', title: 'Nuclear Trump tweet (5/22/2025)', date: '2025-05-22' },
    { id: 'trump-tariff-threat-5-23-2025', title: 'Trump tariff threat (5/23/2025)', date: '2025-05-23' },
    { id: 'snps-cdns-5-28-2025', title: 'SNPS, CDNS (5/28/2025)', date: '2025-05-28' },
    { id: 'crcl-best-june-2025', title: 'CRCL (best June 2025)', date: '2025-06-15' },
    { id: 'tsla-6-5-2025', title: 'TSLA (6/5/2025)', date: '2025-06-05' },
    { id: 'oil-6-12-23-2025', title: 'Oil (6/12, 6/23/2025)', date: '2025-06-12' },
    { id: 'gme-6-11-2025', title: 'GME (6/11/2025)', date: '2025-06-11' },
    { id: 'aeva-7-1-2025', title: 'AEVA (7/1/2025)', date: '2025-07-01' },
    { id: 'bmnr-7-1-2025', title: 'BMNR (7/1/2025)', date: '2025-07-01' },
    { id: 'copper-7-8-30-2025', title: 'Copper (7/8, 7/30/2025)', date: '2025-07-08' },
    { id: 'btc-july-2025', title: 'BTC (July 2025)', date: '2025-07-15' },
    { id: 'nvda-7-14-2025', title: 'NVDA (7/14/2025)', date: '2025-07-14' },
    { id: 'crypto-bill-7-15-2025', title: 'Crypto bill (7/15/2025)', date: '2025-07-15' },
    { id: 'qs-7-21-2025', title: 'QS (7/21/2025)', date: '2025-07-21' },
    { id: 'open-july-2025', title: 'OPEN (July 2025)', date: '2025-07-25' },
    { id: 'kss-et-al-7-22-2025', title: 'KSS et al. (7/22/2025)', date: '2025-07-22' },
    { id: 'nvo-7-28-2025', title: 'NVO (7/28/2025)', date: '2025-07-28' },
    { id: 'fig-7-31-2025', title: 'FIG (7/31/2025)', date: '2025-07-31' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedCompleted = await storage.loadSetting('topOpsCompleted') || [];
      const savedNotes = await storage.loadSetting('topOpsNotes') || {};
      const savedTags = await storage.loadSetting('topOpsTags') || {};
      const savedScreenshots = await storage.loadSetting('topOpsScreenshots') || {};
      const savedChecklist = await storage.loadSetting('topOpsChecklist') || {};
      const savedCategories = await storage.loadSetting('topOpsCategories') || [
        "Fresh Breaking News Trades",
        "Offerings (Kapitalerhöhungen, Platzierungen)",
        "Breakouts",
        "Exhaustion Gaps oder Panics (Blow-Offs)",
        "Daily Swings/Volatility Trades",
        "Bouncy Ball Breakdowns / Dead Cat Bounces",
        "Squeeze/Short Squeeze Plays",
        "Reversals (Trendwenden nach langen Moves)"
      ];
      
      // Ensure savedCompleted is an array before creating Set
      const completedArray = Array.isArray(savedCompleted) ? savedCompleted : [];
      setCompletedTrades(new Set(completedArray));
      setNotes(savedNotes);
      setTags(savedTags);
      setScreenshots(savedScreenshots);
      setChecklist(savedChecklist);
      // Update categories if they're still using old format
      const defaultCategories = [
        "Fresh Breaking News Trades",
        "Offerings (Kapitalerhöhungen, Platzierungen)",
        "Breakouts",
        "Exhaustion Gaps oder Panics (Blow-Offs)",
        "Daily Swings/Volatility Trades",
        "Bouncy Ball Breakdowns / Dead Cat Bounces",
        "Squeeze/Short Squeeze Plays",
        "Reversals (Trendwenden nach langen Moves)"
      ];
      
      // Always use the new default categories
      setCategories(defaultCategories);
      // Save the new categories to ensure they're always available
      storage.saveSetting('topOpsCategories', defaultCategories);
      
      // Initialize unsaved state with saved data
      setUnsavedNotes(savedNotes);
      setUnsavedTags(savedTags);
      setUnsavedScreenshots(savedScreenshots);
      setUnsavedChecklist(savedChecklist);
      
      // Initialize tag arrays (convert old single tags to arrays)
      const tagArrays = {};
      Object.keys(savedTags).forEach(tradeId => {
        if (savedTags[tradeId]) {
          tagArrays[tradeId] = Array.isArray(savedTags[tradeId]) ? savedTags[tradeId] : [savedTags[tradeId]];
        } else {
          tagArrays[tradeId] = [];
        }
      });
      setUnsavedTagArrays(tagArrays);
      
      // Initialize view mode for each trade
      const viewModeState = {};
      trades.forEach(trade => {
        viewModeState[trade.id] = Object.keys(savedNotes[trade.id] || {}).length > 0;
      });
      setIsViewMode(viewModeState);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      console.log('Saving TopOps data...');
      
      // Save the unsaved changes to the main state
      setNotes(unsavedNotes);
      setTags(unsavedTagArrays); // Save tag arrays instead of single tags
      setScreenshots(unsavedScreenshots);
      setChecklist(unsavedChecklist);
      
      // Ensure we have valid data to save
      const completedArray = Array.from(completedTrades);
      const notesData = unsavedNotes || {};
      const tagsData = unsavedTagArrays || {};
      const screenshotsData = unsavedScreenshots || {};
      const checklistData = unsavedChecklist || {};
      
      console.log('Data to save:', {
        completed: completedArray.length,
        notes: Object.keys(notesData).length,
        tags: Object.keys(tagsData).length,
        screenshots: Object.keys(screenshotsData).length,
        checklist: Object.keys(checklistData).length
      });
      
      await storage.saveSetting('topOpsCompleted', completedArray);
      await storage.saveSetting('topOpsNotes', notesData);
      await storage.saveSetting('topOpsTags', tagsData);
      await storage.saveSetting('topOpsScreenshots', screenshotsData);
      await storage.saveSetting('topOpsChecklist', checklistData);
      
      // Switch to view mode for the current trade
      setIsViewMode(prev => ({
        ...prev,
        [selectedTrade]: true
      }));
      
      setHasUnsavedChanges(false);
      
      console.log('TopOps data saved successfully!');
      
      // Show success feedback to user
      alert('✅ Analysis saved successfully!');
      
    } catch (error) {
      console.error('Error saving TopOps data:', error);
      alert('❌ Error saving analysis. Please try again.');
    }
  };

  const toggleCompleted = async (tradeId) => {
    const newCompleted = new Set(completedTrades);
    if (newCompleted.has(tradeId)) {
      newCompleted.delete(tradeId);
    } else {
      newCompleted.add(tradeId);
    }
    setCompletedTrades(newCompleted);
    
    // Save completed status immediately
    try {
      const completedArray = Array.from(newCompleted);
      await storage.saveSetting('topOpsCompleted', completedArray);
    } catch (error) {
      console.error('Error saving completed status:', error);
    }
  };

  const handleFileUpload = (tradeId, files) => {
    const fileArray = Array.from(files);
    
    // Convert files to base64 strings
    const filePromises = fileArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            data: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    });
    
    Promise.all(filePromises).then(fileData => {
      setUnsavedScreenshots(prev => ({
        ...prev,
        [tradeId]: [...(prev[tradeId] || []), ...fileData]
      }));
      setHasUnsavedChanges(true);
    });
  };

  const toggleChecklistItem = (tradeId, itemIndex) => {
    const tradeChecklist = unsavedChecklist[tradeId] || [];
    const newChecklist = [...tradeChecklist];
    newChecklist[itemIndex] = !newChecklist[itemIndex];
    
    setUnsavedChecklist(prev => ({
      ...prev,
      [tradeId]: newChecklist
    }));
    setHasUnsavedChanges(true);
  };

  const deleteScreenshot = (tradeId, screenshotIndex) => {
    const tradeScreenshots = unsavedScreenshots[tradeId] || [];
    const newScreenshots = tradeScreenshots.filter((_, index) => index !== screenshotIndex);
    
    setUnsavedScreenshots(prev => ({
      ...prev,
      [tradeId]: newScreenshots
    }));
    setHasUnsavedChanges(true);
  };

  const handleNoteChange = (tradeId, questionIndex, value) => {
    const newNotes = { ...unsavedNotes };
    if (!newNotes[tradeId]) newNotes[tradeId] = {};
    newNotes[tradeId][questionIndex] = value;
    setUnsavedNotes(newNotes);
    setHasUnsavedChanges(true);
  };

  const handleTagChange = (tradeId, value) => {
    setUnsavedTags(prev => ({ ...prev, [tradeId]: value }));
    setHasUnsavedChanges(true);
  };

  const toggleTag = (tradeId, category) => {
    const currentTags = unsavedTagArrays[tradeId] || [];
    let newTags;
    
    if (currentTags.includes(category)) {
      // Remove tag if already selected
      newTags = currentTags.filter(tag => tag !== category);
    } else {
      // Add tag if not selected
      newTags = [...currentTags, category];
    }
    
    setUnsavedTagArrays(prev => ({
      ...prev,
      [tradeId]: newTags
    }));
    setHasUnsavedChanges(true);
  };

  const toggleEditMode = (tradeId) => {
    setIsViewMode(prev => ({
      ...prev,
      [tradeId]: !prev[tradeId]
    }));
  };

  const discardChanges = () => {
    // Reset unsaved changes to saved state
    setUnsavedNotes(notes);
    setUnsavedTags(tags);
    setUnsavedScreenshots(screenshots);
    setUnsavedChecklist(checklist);
    
    // Reset tag arrays
    const tagArrays = {};
    Object.keys(tags).forEach(tradeId => {
      if (tags[tradeId]) {
        tagArrays[tradeId] = Array.isArray(tags[tradeId]) ? tags[tradeId] : [tags[tradeId]];
      } else {
        tagArrays[tradeId] = [];
      }
    });
    setUnsavedTagArrays(tagArrays);
    
    setHasUnsavedChanges(false);
  };

  // Category management functions
  const addCategory = async () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      const updatedCategories = [...categories, newCategoryName.trim()];
      setCategories(updatedCategories);
      setNewCategoryName('');
      await storage.saveSetting('topOpsCategories', updatedCategories);
    }
  };

  const editCategory = async (oldName, newName) => {
    if (newName.trim() && newName.trim() !== oldName) {
      const updatedCategories = categories.map(cat => cat === oldName ? newName.trim() : cat);
      setCategories(updatedCategories);
      setEditingCategory(null);
      await storage.saveSetting('topOpsCategories', updatedCategories);
      
      // Update all trades that use this category
      const updatedTags = { ...unsavedTags };
      Object.keys(updatedTags).forEach(tradeId => {
        if (updatedTags[tradeId] === oldName) {
          updatedTags[tradeId] = newName.trim();
        }
      });
      setUnsavedTags(updatedTags);
      setHasUnsavedChanges(true);
    }
  };

  const deleteCategory = async (categoryName) => {
    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This will remove it from all trades that use it.`)) {
      const updatedCategories = categories.filter(cat => cat !== categoryName);
      setCategories(updatedCategories);
      await storage.saveSetting('topOpsCategories', updatedCategories);
      
      // Remove this category from all trades
      const updatedTags = { ...unsavedTags };
      Object.keys(updatedTags).forEach(tradeId => {
        if (updatedTags[tradeId] === categoryName) {
          updatedTags[tradeId] = '';
        }
      });
      setUnsavedTags(updatedTags);
      setHasUnsavedChanges(true);
    }
  };

  const selectedTradeData = trades.find(t => t.id === selectedTrade);

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#f8fafc',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          🚀 Best Opportunities Study
        </h1>

        {/* Compact Checklist */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #334155'
        }}>
                     <h2 style={{
             fontSize: '1.125rem',
             fontWeight: '600',
             color: '#f8fafc',
             marginBottom: '0.75rem'
           }}>
             📋 Trade Checklist ({completedTrades.size}/{trades.length} completed)
           </h2>
           <p style={{
             fontSize: '0.75rem',
             color: '#94a3b8',
             marginBottom: '0.75rem',
             fontStyle: 'italic'
           }}>
             💡 Klicke auf einen Trade, um die Analyse zu öffnen. Checkbox zum Markieren als erledigt.
           </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.375rem'
          }}>
                         {trades.map((trade) => (
               <div key={trade.id} style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '0.375rem',
                 padding: '0.375rem',
                 backgroundColor: completedTrades.has(trade.id) ? '#10b981' : '#334155',
                 borderRadius: '0.25rem',
                 cursor: 'pointer',
                 transition: 'all 0.2s ease',
                 fontSize: '0.75rem',
                 color: completedTrades.has(trade.id) ? '#ffffff' : '#cbd5e1',
                 border: selectedTrade === trade.id ? '2px solid #3b82f6' : '1px solid transparent'
               }}
               onClick={() => setSelectedTrade(trade.id)}
               onMouseOver={(e) => e.target.style.backgroundColor = completedTrades.has(trade.id) ? '#059669' : '#475569'}
               onMouseOut={(e) => e.target.style.backgroundColor = completedTrades.has(trade.id) ? '#10b981' : '#334155'}
               >
                 <input
                   type="checkbox"
                   checked={completedTrades.has(trade.id)}
                   onChange={(e) => {
                     e.stopPropagation();
                     toggleCompleted(trade.id);
                   }}
                   style={{
                     width: '0.875rem',
                     height: '0.875rem',
                     accentColor: '#10b981'
                   }}
                 />
                 <span style={{ fontWeight: '500', flex: '1' }}>{trade.title}</span>
                 <span style={{ fontSize: '0.625rem', opacity: '0.7' }}>
                   {new Date(trade.date).toLocaleDateString('de-DE')}
                 </span>
                 {selectedTrade === trade.id && (
                   <span style={{ 
                     fontSize: '0.625rem', 
                     color: '#3b82f6', 
                     fontWeight: '600',
                     marginLeft: '0.25rem'
                   }}>
                     👁️
                   </span>
                 )}
               </div>
             ))}
          </div>
        </div>

        {/* Analysis Section */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          border: '1px solid #334155'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#f8fafc',
            marginBottom: '1rem'
          }}>
            🔍 Deep Analysis
          </h2>

          {/* Trade Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#94a3b8',
              marginBottom: '0.375rem'
            }}>
              Select Trade to Analyze:
            </label>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.375rem',
                color: '#f8fafc',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Choose a trade to analyze...</option>
              {trades.map(trade => (
                <option key={trade.id} value={trade.id}>
                  {trade.title} - {new Date(trade.date).toLocaleDateString('de-DE')}
                </option>
              ))}
            </select>
          </div>

          {/* Analysis Content */}
          {selectedTradeData && (
            <div>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '1rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                border: '1px solid #475569'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#f8fafc',
                  margin: 0
                }}>
                  📊 {selectedTradeData.title} Analysis
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  margin: '0.25rem 0 0 0'
                }}>
                  {new Date(selectedTradeData.date).toLocaleDateString('de-DE', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Screenshots Section - Large and Prominent */}
              <div style={{ 
                marginBottom: '2rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #475569'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#10b981',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📸 Screenshots & Charts
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>
                    (Upload 3-4 charts in different timeframes)
                  </span>
                </h4>
                
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(selectedTrade, e.target.files)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: '#475569',
                    border: '2px dashed #64748b',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}
                />
                
                                 {unsavedScreenshots[selectedTrade] && unsavedScreenshots[selectedTrade].length > 0 && (
                   <div style={{
                     display: 'grid',
                     gap: '1.5rem',
                     justifyContent: 'start'
                   }}>
                                           {unsavedScreenshots[selectedTrade].map((file, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <div style={{ 
                            color: '#94a3b8', 
                            fontSize: '0.875rem', 
                            fontWeight: '600',
                            marginBottom: '0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>Chart {index + 1}: {file.name}</span>
                            {!isViewMode[selectedTrade] && (
                              <button
                                onClick={() => deleteScreenshot(selectedTrade, index)}
                                style={{
                                  backgroundColor: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                                title="Delete screenshot"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          <img 
                            src={file.data} 
                            alt={`Screenshot ${index + 1}`}
                            style={{
                              width: '100%',
                              maxHeight: '600px',
                              objectFit: 'contain',
                              borderRadius: '0.5rem',
                              border: '1px solid #64748b'
                            }}
                          />
                        </div>
                      ))}
                   </div>
                 )}
              </div>

              {/* Category Selection */}
              <div style={{ 
                marginBottom: '2rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #475569'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#3b82f6',
                    margin: 0
                  }}>
                    🏷️ Category
                  </h4>
                  <button
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#475569',
                      color: '#f8fafc',
                      border: '1px solid #64748b',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#64748b'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#475569'}
                  >
                    {showCategoryManager ? '✕ Close' : '⚙️ Manage Categories'}
                  </button>
                </div>

                {/* Category Manager */}
                {showCategoryManager && (
                  <div style={{
                    backgroundColor: '#475569',
                    borderRadius: '0.375rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '1px solid #64748b'
                  }}>
                    <h5 style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      marginBottom: '0.75rem'
                    }}>
                      Category Management
                    </h5>
                    
                    {/* Add new category */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category name..."
                        style={{
                          flex: '1',
                          padding: '0.5rem',
                          backgroundColor: '#64748b',
                          border: '1px solid #94a3b8',
                          borderRadius: '0.25rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                      />
                      <button
                        onClick={addCategory}
                        disabled={!newCategoryName.trim()}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: newCategoryName.trim() ? '#10b981' : '#64748b',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.875rem',
                          cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => newCategoryName.trim() && (e.target.style.backgroundColor = '#059669')}
                        onMouseOut={(e) => newCategoryName.trim() && (e.target.style.backgroundColor = '#10b981')}
                      >
                        ➕ Add
                      </button>
                    </div>

                    {/* Category list */}
                    <div style={{
                      display: 'grid',
                      gap: '0.5rem'
                    }}>
                      {categories.map((category, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          backgroundColor: '#64748b',
                          borderRadius: '0.25rem',
                          border: '1px solid #94a3b8'
                        }}>
                          {editingCategory === category ? (
                            <>
                              <input
                                type="text"
                                defaultValue={category}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    editCategory(category, e.target.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingCategory(null);
                                  }
                                }}
                                onBlur={(e) => editCategory(category, e.target.value)}
                                style={{
                                  flex: '1',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#94a3b8',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '0.125rem',
                                  color: '#1e293b',
                                  fontSize: '0.875rem'
                                }}
                                autoFocus
                              />
                            </>
                          ) : (
                            <>
                              <span style={{
                                flex: '1',
                                fontSize: '0.875rem',
                                color: '#f8fafc'
                              }}>
                                {category}
                              </span>
                              <button
                                onClick={() => setEditingCategory(category)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#3b82f6',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '0.125rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                                title="Edit category"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteCategory(category)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '0.125rem',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s ease'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                                title="Delete category"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Selection */}
                {isViewMode[selectedTrade] ? (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#475569',
                    border: '1px solid #64748b',
                    borderRadius: '0.375rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    minHeight: '2.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.25rem'
                  }}>
                    {(unsavedTagArrays[selectedTrade] || []).length > 0 ? (
                      (unsavedTagArrays[selectedTrade] || []).map((tag, index) => (
                        <span key={index} style={{
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      'No categories selected'
                    )}
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: '#475569',
                    border: '1px solid #64748b',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    minHeight: '2.5rem'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      marginBottom: '0.5rem',
                      fontStyle: 'italic'
                    }}>
                      Select multiple categories (click to toggle):
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {categories.map(cat => {
                        const isSelected = (unsavedTagArrays[selectedTrade] || []).includes(cat);
                        return (
                          <button
                            key={cat}
                            onClick={() => toggleTag(selectedTrade, cat)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              backgroundColor: isSelected ? '#10b981' : '#64748b',
                              color: '#ffffff',
                              border: '1px solid',
                              borderColor: isSelected ? '#059669' : '#94a3b8',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontWeight: isSelected ? '600' : '400'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = isSelected ? '#059669' : '#94a3b8'}
                            onMouseOut={(e) => e.target.style.backgroundColor = isSelected ? '#10b981' : '#64748b'}
                          >
                            {isSelected ? '✓ ' : ''}{cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis Questions */}
              <div style={{ 
                marginBottom: '2rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #475569'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#f59e0b',
                  marginBottom: '1.5rem'
                }}>
                  📝 Analysis Questions
                </h4>
                
                <div style={{
                  display: 'grid',
                  gap: '1.5rem'
                }}>
                  {analysisQuestions.map((question, index) => (
                    <div key={index} style={{
                      backgroundColor: '#475569',
                      borderRadius: '0.375rem',
                      padding: '1rem',
                      border: '1px solid #64748b'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#f8fafc',
                        marginBottom: '0.5rem'
                      }}>
                        {index + 1}. {question}
                      </label>
                      {isViewMode[selectedTrade] ? (
                        <div style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '0.75rem',
                          backgroundColor: '#64748b',
                          border: '1px solid #94a3b8',
                          borderRadius: '0.25rem',
                          color: '#f8fafc',
                          fontSize: '0.875rem',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word'
                        }}>
                          {unsavedNotes[selectedTrade]?.[index] || 'No analysis entered yet...'}
                        </div>
                      ) : (
                        <textarea
                          value={unsavedNotes[selectedTrade]?.[index] || ''}
                          onChange={(e) => handleNoteChange(selectedTrade, index, e.target.value)}
                          placeholder="Enter your analysis..."
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '0.75rem',
                            backgroundColor: '#64748b',
                            border: '1px solid #94a3b8',
                            borderRadius: '0.25rem',
                            color: '#f8fafc',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div style={{ 
                marginBottom: '2rem',
                backgroundColor: '#334155',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                border: '1px solid #475569'
              }}>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#10b981',
                  marginBottom: '1rem'
                }}>
                  ✅ Analysis Checklist
                </h4>
                
                <div style={{
                  display: 'grid',
                  gap: '0.5rem'
                }}>
                  {checklistItems.map((item, index) => (
                    <label key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#475569',
                      borderRadius: '0.25rem',
                      cursor: isViewMode[selectedTrade] ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.875rem',
                      color: (unsavedChecklist[selectedTrade]?.[index]) ? '#10b981' : '#cbd5e1',
                      border: '1px solid #64748b'
                    }}>
                      <input
                        type="checkbox"
                        checked={unsavedChecklist[selectedTrade]?.[index] || false}
                        onChange={() => toggleChecklistItem(selectedTrade, index)}
                        disabled={isViewMode[selectedTrade]}
                        style={{
                          width: '1rem',
                          height: '1rem',
                          accentColor: '#10b981'
                        }}
                      />
                      <span style={{ 
                        fontWeight: (unsavedChecklist[selectedTrade]?.[index]) ? '600' : '400',
                        textDecoration: (unsavedChecklist[selectedTrade]?.[index]) ? 'line-through' : 'none'
                      }}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                {isViewMode[selectedTrade] ? (
                  <button
                    onClick={() => toggleEditMode(selectedTrade)}
                    style={{
                      flex: '1',
                      padding: '1rem',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                  >
                    ✏️ Edit Analysis
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveData}
                      style={{
                        flex: '1',
                        padding: '1rem',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      💾 Save Analysis
                    </button>
                    {hasUnsavedChanges && (
                      <button
                        onClick={discardChanges}
                        style={{
                          padding: '1rem',
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                      >
                        ❌ Discard
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && !isViewMode[selectedTrade] && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.375rem',
                  color: '#92400e',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginBottom: '1rem'
                }}>
                  ⚠️ You have unsaved changes. Click "Save Analysis" to save them.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopOps;
