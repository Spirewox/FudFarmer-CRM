
import React, { useState, useEffect } from 'react';
import { Agent, Task, TaskPriority, TaskStatus, Location, Customer, Lead, Feedback, Enquiry, Compensation } from '../types';
import { StorageService } from '../services/storageService';
import { User, Plus, Briefcase, CheckSquare, X, Mail, MessageSquare, RefreshCw, Calendar, MapPin, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const Team: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'Agents' | 'Tasks'>('Agents');
  
  // Data for agent details
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Modals & Selection
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Forms
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({ role: 'Sales Agent', location: Location.LAGOS });
  const [newTask, setNewTask] = useState<Partial<Task>>({ priority: TaskPriority.MEDIUM, status: TaskStatus.TODO });

  useEffect(() => {
    setAgents(StorageService.getAgents());
    setTasks(StorageService.getTasks());
    setCustomers(StorageService.getCustomers());
    setLeads(StorageService.getLeads());
  }, []);

  const handleSaveAgent = () => {
    if (!newAgent.name || !newAgent.email) return;
    const agent: Agent = {
        id: StorageService.generateId(),
        name: newAgent.name,
        email: newAgent.email,
        phone: newAgent.phone || '',
        role: newAgent.role as any,
        location: newAgent.location as Location,
        joinedDate: new Date().toISOString().split('T')[0],
    };
    const updated = [...agents, agent];
    setAgents(updated);
    StorageService.saveAgents(updated);
    setShowAgentModal(false);
    setNewAgent({ role: 'Sales Agent', location: Location.LAGOS });
  };

  const handleSaveTask = () => {
    if (!newTask.title || !newTask.assignedToId) return;
    const assignee = agents.find(a => a.id === newTask.assignedToId);
    
    const task: Task = {
        id: StorageService.generateId(),
        title: newTask.title,
        description: newTask.description || '',
        assignedToId: newTask.assignedToId,
        assignedToName: assignee?.name || 'Unknown',
        dueDate: newTask.dueDate || '',
        priority: newTask.priority as TaskPriority,
        status: newTask.status as TaskStatus,
        createdBy: 'Admin User',
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    StorageService.saveTasks(updated);
    setShowTaskModal(false);
    setNewTask({ priority: TaskPriority.MEDIUM, status: TaskStatus.TODO });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, status } : t);
    setTasks(updated);
    StorageService.saveTasks(updated);
  };

  // Agent Stats Logic
  const getAgentStats = (agentId: string) => {
    const agentCustomers = customers.filter(c => c.addedByAgentId === agentId);
    const agentLeads = leads.filter(l => l.salesAgentId === agentId || l.salesAgent === agents.find(a => a.id === agentId)?.name);
    const agentTasks = tasks.filter(t => t.assignedToId === agentId);
    const completedTasks = agentTasks.filter(t => t.status === TaskStatus.DONE);
    
    return {
        customerCount: agentCustomers.length,
        leadCount: agentLeads.length,
        leadValue: agentLeads.reduce((acc, l) => acc + l.potentialValue, 0),
        taskCount: agentTasks.length,
        taskCompletion: agentTasks.length > 0 ? Math.round((completedTasks.length / agentTasks.length) * 100) : 0
    };
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch(p) {
        case TaskPriority.HIGH: return 'text-red-700 bg-red-50 border-red-200';
        case TaskPriority.MEDIUM: return 'text-orange-700 bg-orange-50 border-orange-200';
        case TaskPriority.LOW: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Team & Tasks</h1>
                <p className="text-muted-foreground">Manage sales agents and assign duties.</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('Agents')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'Agents' ? 'bg-primary text-primary-foreground shadow' : 'bg-transparent hover:bg-muted'}`}
                >
                    Agents
                </button>
                <button 
                    onClick={() => setActiveTab('Tasks')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'Tasks' ? 'bg-primary text-primary-foreground shadow' : 'bg-transparent hover:bg-muted'}`}
                >
                    Tasks
                </button>
            </div>
        </div>

        {activeTab === 'Agents' ? (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button 
                        onClick={() => setShowAgentModal(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        <Plus size={16} className="mr-2" /> Add Agent
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map(agent => {
                        const stats = getAgentStats(agent.id);
                        return (
                            <div key={agent.id} className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedAgent(agent)}>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold text-secondary-foreground">
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold leading-none">{agent.name}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">{agent.role}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 py-2">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Customers</p>
                                            <p className="text-xl font-bold">{stats.customerCount}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">Leads Value</p>
                                            <p className="text-lg font-bold text-green-600">₦{(stats.leadValue / 1000).toFixed(0)}k</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin size={12}/> {agent.location}</span>
                                        <span className="flex items-center gap-1"><CheckSquare size={12}/> {stats.taskCompletion}% tasks done</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <h3 className="font-semibold">Task Board</h3>
                    <button 
                        onClick={() => setShowTaskModal(true)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                    >
                        <Plus size={16} className="mr-2" /> Assign Task
                    </button>
                </div>
                <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Task</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Assigned To</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Priority</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Due Date</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {tasks.map(task => (
                                <tr key={task.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">
                                        <div>
                                            <p className="font-medium">{task.title}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                                {task.assignedToName.charAt(0)}
                                            </div>
                                            <span>{task.assignedToName}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-muted-foreground">
                                        {task.dueDate}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <select 
                                            value={task.status}
                                            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                            className="text-xs font-medium bg-transparent border rounded-md px-2 py-1"
                                        >
                                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {tasks.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No tasks assigned yet.</td></tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* Agent Details Slide-over */}
        {selectedAgent && (
            <div className="fixed inset-0 z-50 flex justify-end">
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedAgent(null)}></div>
                <div className="w-full max-w-2xl bg-card border-l shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b flex justify-between items-start sticky top-0 bg-card z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                                {selectedAgent.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{selectedAgent.name}</h2>
                                <p className="text-muted-foreground">{selectedAgent.role} • {selectedAgent.location}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedAgent(null)} className="rounded-full p-2 hover:bg-muted transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border rounded-lg bg-muted/20">
                                <p className="text-xs text-muted-foreground">Joined</p>
                                <p className="font-medium text-sm">{selectedAgent.joinedDate}</p>
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/20">
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium text-sm truncate" title={selectedAgent.email}>{selectedAgent.email}</p>
                            </div>
                            <div className="p-4 border rounded-lg bg-muted/20">
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-medium text-sm">{selectedAgent.phone}</p>
                            </div>
                        </div>

                        {/* Agent's Customers */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <User size={18} /> Acquired Customers
                            </h3>
                            <div className="rounded-md border bg-card">
                                {customers.filter(c => c.addedByAgentId === selectedAgent.id).length > 0 ? (
                                    <div className="divide-y">
                                        {customers.filter(c => c.addedByAgentId === selectedAgent.id).map(c => (
                                            <div key={c.id} className="p-3 text-sm flex justify-between items-center">
                                                <span>{c.name}</span>
                                                <span className="text-muted-foreground text-xs">{c.joinedDate}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-sm text-muted-foreground italic">No customers added by this agent.</div>
                                )}
                            </div>
                        </div>

                        {/* Agent's Leads */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Briefcase size={18} /> Managed Leads
                            </h3>
                            <div className="rounded-md border bg-card">
                                {leads.filter(l => l.salesAgentId === selectedAgent.id || l.salesAgent === selectedAgent.name).length > 0 ? (
                                    <div className="divide-y">
                                        {leads.filter(l => l.salesAgentId === selectedAgent.id || l.salesAgent === selectedAgent.name).map(l => (
                                            <div key={l.id} className="p-3 text-sm flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{l.businessName}</p>
                                                    <p className="text-xs text-muted-foreground">{l.status}</p>
                                                </div>
                                                <span className="font-medium">₦{l.potentialValue.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-sm text-muted-foreground italic">No leads managed by this agent.</div>
                                )}
                            </div>
                        </div>

                         {/* Agent's Tasks */}
                         <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <CheckSquare size={18} /> Assigned Tasks
                            </h3>
                            <div className="rounded-md border bg-card">
                                {tasks.filter(t => t.assignedToId === selectedAgent.id).length > 0 ? (
                                    <div className="divide-y">
                                        {tasks.filter(t => t.assignedToId === selectedAgent.id).map(t => (
                                            <div key={t.id} className="p-3 text-sm flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{t.title}</p>
                                                    <p className="text-xs text-muted-foreground">Due: {t.dueDate}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${t.status === TaskStatus.DONE ? 'bg-green-100 text-green-800 border-green-200' : 'bg-secondary text-foreground'}`}>
                                                    {t.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-sm text-muted-foreground italic">No tasks assigned.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        )}

        {/* New Agent Modal */}
        {showAgentModal && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                    <h2 className="text-lg font-semibold mb-4">Add Sales Agent</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Full Name" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newAgent.name || ''} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
                        <input type="email" placeholder="Email Address" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newAgent.email || ''} onChange={e => setNewAgent({...newAgent, email: e.target.value})} />
                        <input type="text" placeholder="Phone Number" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newAgent.phone || ''} onChange={e => setNewAgent({...newAgent, phone: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newAgent.location} onChange={e => setNewAgent({...newAgent, location: e.target.value as Location})}>
                                <option value={Location.LAGOS}>Lagos</option>
                                <option value={Location.IFE}>Ife</option>
                            </select>
                            <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value as any})}>
                                <option value="Sales Agent">Sales Agent</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                             <button onClick={() => setShowAgentModal(false)} className="px-4 py-2 border rounded-md hover:bg-muted text-sm">Cancel</button>
                             <button onClick={handleSaveAgent} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Save Agent</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* New Task Modal */}
        {showTaskModal && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                    <h2 className="text-lg font-semibold mb-4">Assign Task</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Task Title" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newTask.title || ''} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                        <textarea placeholder="Description" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" value={newTask.description || ''} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Assign To</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newTask.assignedToId || ''} onChange={e => setNewTask({...newTask, assignedToId: e.target.value})}>
                                <option value="" disabled>Select Agent</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newTask.dueDate || ''} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
                            <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})}>
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                             <button onClick={() => setShowTaskModal(false)} className="px-4 py-2 border rounded-md hover:bg-muted text-sm">Cancel</button>
                             <button onClick={handleSaveTask} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Assign Task</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Team;