import React, { useState, useEffect } from 'react';
import { Code, Save, Upload, Trash2, Play, Settings } from 'lucide-react';

const PineScriptManager = ({ onScriptLoad, onScriptSave }) => {
  const [scripts, setScripts] = useState([]);
  const [selectedScript, setSelectedScript] = useState(null);
  const [scriptName, setScriptName] = useState('');
  const [scriptCode, setScriptCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load saved scripts from localStorage
  useEffect(() => {
    const savedScripts = localStorage.getItem('pineScripts');
    if (savedScripts) {
      setScripts(JSON.parse(savedScripts));
    }
  }, []);

  // Save scripts to localStorage
  const saveScriptsToStorage = (newScripts) => {
    localStorage.setItem('pineScripts', JSON.stringify(newScripts));
    setScripts(newScripts);
  };

  // Create new script
  const createNewScript = () => {
    const newScript = {
      id: Date.now().toString(),
      name: 'New Script',
      code: `//@version=5
indicator("My Custom Indicator", overlay=true)

// Your Pine Script code here
sma20 = ta.sma(close, 20)
sma50 = ta.sma(close, 50)

plot(sma20, color=color.blue, title="SMA 20")
plot(sma50, color=color.red, title="SMA 50")`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedScripts = [...scripts, newScript];
    saveScriptsToStorage(updatedScripts);
    setSelectedScript(newScript);
    setScriptName(newScript.name);
    setScriptCode(newScript.code);
    setIsEditing(true);
  };

  // Save current script
  const saveCurrentScript = () => {
    if (!selectedScript) return;

    const updatedScript = {
      ...selectedScript,
      name: scriptName,
      code: scriptCode,
      updatedAt: new Date().toISOString()
    };

    const updatedScripts = scripts.map(script => 
      script.id === selectedScript.id ? updatedScript : script
    );

    saveScriptsToStorage(updatedScripts);
    setSelectedScript(updatedScript);
    setIsEditing(false);

    if (onScriptSave) {
      onScriptSave(updatedScript);
    }
  };

  // Load script
  const loadScript = (script) => {
    setSelectedScript(script);
    setScriptName(script.name);
    setScriptCode(script.code);
    setIsEditing(false);

    if (onScriptLoad) {
      onScriptLoad(script);
    }
  };

  // Delete script
  const deleteScript = (scriptId) => {
    const updatedScripts = scripts.filter(script => script.id !== scriptId);
    saveScriptsToStorage(updatedScripts);
    
    if (selectedScript && selectedScript.id === scriptId) {
      setSelectedScript(null);
      setScriptName('');
      setScriptCode('');
      setIsEditing(false);
    }
  };

  // Import script from file
  const importScript = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const newScript = {
          id: Date.now().toString(),
          name: file.name.replace('.pine', ''),
          code: content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const updatedScripts = [...scripts, newScript];
        saveScriptsToStorage(updatedScripts);
        setSelectedScript(newScript);
        setScriptName(newScript.name);
        setScriptCode(newScript.code);
        setIsEditing(true);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ padding: '1rem', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#1e293b',
        borderRadius: '0.5rem',
        border: '1px solid #475569'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Code size={24} color="#3b82f6" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#f8fafc' }}>
            Pine Script Manager
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={createNewScript}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '0.375rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Code size={16} />
            New Script
          </button>
          
          <label style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#475569',
            border: 'none',
            borderRadius: '0.375rem',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".pine,.txt"
              onChange={importScript}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 120px)' }}>
        {/* Script List */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            padding: '1rem',
            backgroundColor: '#1e293b',
            borderRadius: '0.5rem',
            border: '1px solid #475569',
            flex: 1
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#f8fafc' }}>
              Your Scripts ({scripts.length})
            </h3>
            
            {scripts.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center' }}>
                No scripts yet. Create your first Pine Script!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {scripts.map(script => (
                  <div key={script.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: selectedScript?.id === script.id ? '#3b82f6' : '#334155',
                    borderRadius: '0.375rem',
                    border: '1px solid #475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => loadScript(script)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#f8fafc'
                      }}>
                        {script.name}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}>
                        {new Date(script.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScript(script.id);
                      }}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: '#dc2626',
                        border: 'none',
                        borderRadius: '0.25rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Script Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedScript ? (
            <>
              {/* Script Header */}
              <div style={{
                padding: '1rem',
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                border: '1px solid #475569',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="text"
                    value={scriptName}
                    onChange={(e) => setScriptName(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.375rem',
                      color: '#f8fafc',
                      fontSize: '1rem',
                      fontWeight: '600',
                      width: '200px'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                    {selectedScript.updatedAt && `Last updated: ${new Date(selectedScript.updatedAt).toLocaleString()}`}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isEditing && (
                    <button
                      onClick={saveCurrentScript}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#10b981',
                        border: 'none',
                        borderRadius: '0.375rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Save size={16} />
                      Save
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: isEditing ? '#475569' : '#3b82f6',
                      border: 'none',
                      borderRadius: '0.375rem',
                      color: '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Settings size={16} />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              {/* Code Editor */}
              <div style={{
                flex: 1,
                backgroundColor: '#1e293b',
                borderRadius: '0.5rem',
                border: '1px solid #475569',
                overflow: 'hidden'
              }}>
                <textarea
                  value={scriptCode}
                  onChange={(e) => setScriptCode(e.target.value)}
                  disabled={!isEditing}
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '1rem',
                    backgroundColor: '#0f172a',
                    border: 'none',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    resize: 'none',
                    outline: 'none'
                  }}
                  placeholder="// Your Pine Script code here..."
                />
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Code size={48} color="#475569" style={{ marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#f8fafc' }}>
                  No Script Selected
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>
                  Select a script from the list or create a new one to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PineScriptManager;
