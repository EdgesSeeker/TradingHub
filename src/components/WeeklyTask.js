import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  List
} from 'lucide-react';
import storage from '../utils/storage';

const WeeklyTask = () => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    taskName: '',
    status: 'Not Started'
  });

  // Load tasks from storage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await storage.loadSetting('weeklyTasks');
        if (savedTasks) {
          setTasks(savedTasks);
        }
      } catch (error) {
        console.error('Error loading weekly tasks:', error);
      }
    };
    
    loadTasks();
  }, []);

  // Save tasks to storage
  const saveTasks = async (updatedTasks) => {
    try {
      await storage.saveSetting('weeklyTasks', updatedTasks);
    } catch (error) {
      console.error('Error saving weekly tasks:', error);
    }
  };

  // Add new task
  const handleAddTask = async () => {
    if (!newTask.taskName.trim()) {
      alert('Task name is required!');
      return;
    }

    const task = {
      id: Date.now(),
      ...newTask,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    
    setNewTask({
      taskName: '',
      status: 'Not Started'
    });
    setShowAddForm(false);
  };

  // Update task
  const handleUpdateTask = async (updatedTask) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id 
        ? { ...updatedTask, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setEditingTask(null);
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);
      await saveTasks(updatedTasks);
    }
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'Done':
        return { 
          icon: <CheckCircle size={16} color="#10b981" />, 
          color: '#10b981',
          bgColor: '#065f46'
        };
      case 'In Progress':
        return { 
          icon: <Clock size={16} color="#f59e0b" />, 
          color: '#f59e0b',
          bgColor: '#92400e'
        };
      case 'Not Started':
        return { 
          icon: <AlertCircle size={16} color="#ef4444" />, 
          color: '#ef4444',
          bgColor: '#7f1d1d'
        };
      default:
        return { 
          icon: <AlertCircle size={16} color="#94a3b8" />, 
          color: '#94a3b8',
          bgColor: '#374151'
        };
    }
  };

  // Get task statistics
  const getTaskStats = () => {
    const total = tasks.length;
    const done = tasks.filter(task => task.status === 'Done').length;
    const inProgress = tasks.filter(task => task.status === 'In Progress').length;
    const notStarted = tasks.filter(task => task.status === 'Not Started').length;
    
    return { total, done, inProgress, notStarted };
  };

  const stats = getTaskStats();

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#0f172a',
      minHeight: '100vh',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <List size={32} color="white" />
            </div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Weekly Tasks
            </h1>
          </div>
          <p style={{
            fontSize: '1.125rem',
            color: '#94a3b8',
            margin: 0
          }}>
            Simple weekly task management - just add your tasks and track progress
          </p>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#f8fafc',
              marginBottom: '0.5rem'
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Total Tasks
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {stats.done}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Done
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#f59e0b',
              marginBottom: '0.5rem'
            }}>
              {stats.inProgress}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              In Progress
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ef4444',
              marginBottom: '0.5rem'
            }}>
              {stats.notStarted}
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Not Started
            </div>
          </div>
        </div>

        {/* Add Task Button */}
        <div style={{
          marginBottom: '2rem',
          textAlign: 'right'
        }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#1e293b',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid #334155',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#f8fafc',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <List size={20} />
              Add New Task
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#f8fafc',
                  marginBottom: '0.5rem'
                }}>
                  Task Name *
                </label>
                <input
                  type="text"
                  value={newTask.taskName}
                  onChange={(e) => setNewTask({...newTask, taskName: e.target.value})}
                  placeholder="e.g., Review trading journal entries"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#f8fafc',
                  marginBottom: '0.5rem'
                }}>
                  Status
                </label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Save size={16} />
                Save Task
              </button>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '1rem',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #334155'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#f8fafc',
              margin: 0
            }}>
              Weekly Tasks ({tasks.length})
            </h3>
          </div>
          
          {tasks.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.125rem', margin: 0 }}>
                No tasks yet. Add your first weekly task to get started!
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: '#334155',
                    borderBottom: '1px solid #475569'
                  }}>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569'
                    }}>
                      Task Name
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc',
                      borderRight: '1px solid #475569'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '1rem',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#f8fafc'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} style={{
                      borderBottom: '1px solid #334155'
                    }}>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155',
                        fontSize: '0.875rem',
                        color: '#f8fafc',
                        fontWeight: '500'
                      }}>
                        {task.taskName}
                      </td>
                      <td style={{
                        padding: '1rem',
                        borderRight: '1px solid #334155'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: getStatusInfo(task.status).bgColor,
                          borderRadius: '1rem',
                          width: 'fit-content'
                        }}>
                          {getStatusInfo(task.status).icon}
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: getStatusInfo(task.status).color
                          }}>
                            {task.status}
                          </span>
                        </div>
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={() => setEditingTask(task)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              padding: '0.25rem'
                            }}
                            title="Edit task"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '0.25rem'
                            }}
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Task Modal */}
        {editingTask && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '2rem',
              borderRadius: '1rem',
              border: '1px solid #334155',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#f8fafc',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Edit3 size={20} />
                Edit Task
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#f8fafc',
                    marginBottom: '0.5rem'
                  }}>
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={editingTask.taskName}
                    onChange={(e) => setEditingTask({...editingTask, taskName: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#f8fafc',
                    marginBottom: '0.5rem'
                  }}>
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#334155',
                      border: '1px solid #475569',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setEditingTask(null)}
                  style={{
                    backgroundColor: '#64748b',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateTask(editingTask)}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyTask;
