
import React, { useState, useEffect, useMemo } from 'react';
import { Feedback, FeedbackType, Sentiment, Customer, Compensation, CompensationCategory } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Loader, BarChart3, PieChart as PieIcon, Plus, Filter, CheckCircle2, XCircle, Search, Calendar, User, ArrowRight, Clock, Gift, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FeedbackLog: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // UI State
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null); // For "Attending" to feedback
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Resolved'>('All');
  const [filterType, setFilterType] = useState<FeedbackType | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State (New Feedback)
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<FeedbackType>(FeedbackType.COMPLAINT);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Resolution State
  const [resolutionNote, setResolutionNote] = useState('');

  // Compensation Modal State
  const [showCompModal, setShowCompModal] = useState(false);
  const [compData, setCompData] = useState<Partial<Compensation>>({
      status: 'Pending',
      category: CompensationCategory.PRODUCT
  });

  useEffect(() => {
    setFeedbacks(StorageService.getFeedback());
    setCustomers(StorageService.getCustomers());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent || !newCustomerName) return;

    setIsAnalyzing(true);
    const sentiment = await GeminiService.analyzeSentiment(newContent);
    setIsAnalyzing(false);

    const newFeedback: Feedback = {
      id: StorageService.generateId(),
      customerId: '0', 
      customerName: newCustomerName,
      type: newType,
      content: newContent,
      date: new Date().toISOString().split('T')[0],
      status: 'Open',
      sentiment: sentiment,
    };

    const updated = [newFeedback, ...feedbacks];
    setFeedbacks(updated);
    StorageService.saveFeedback(updated);
    
    // Reset and Close
    setNewContent('');
    setNewCustomerName('');
    setShowAddModal(false);
  };

  const handleResolve = () => {
    if (!selectedFeedback) return;

    const updated = feedbacks.map(f => {
        if (f.id === selectedFeedback.id) {
            return {
                ...f,
                status: 'Resolved' as const,
                resolutionNote: resolutionNote,
                resolvedDate: new Date().toISOString().split('T')[0]
            };
        }
        return f;
    });

    setFeedbacks(updated);
    StorageService.saveFeedback(updated);
    setSelectedFeedback(null); // Close modal
    setResolutionNote('');
  };

  const handleOpenComp = () => {
    if(!selectedFeedback) return;
    setCompData({
        customerName: selectedFeedback.customerName,
        customerId: selectedFeedback.customerId,
        reason: `Ref: ${selectedFeedback.type} - ${selectedFeedback.content.substring(0, 20)}...`,
        amount: 0,
        status: 'Pending',
        category: CompensationCategory.PRODUCT
    });
    setShowCompModal(true);
  };

  const handleSaveComp = () => {
    if (!compData.amount || !compData.customerName) return;
    
    const allComps = StorageService.getCompensations();
    const newComp: Compensation = {
        id: StorageService.generateId(),
        customerId: compData.customerId || '0',
        customerName: compData.customerName,
        reason: compData.reason || '',
        amount: Number(compData.amount),
        date: new Date().toISOString().split('T')[0],
        status: compData.status as any,
        category: compData.category as any,
    };
    
    StorageService.saveCompensations([newComp, ...allComps]);
    setShowCompModal(false);
    
    // Auto-append to resolution note
    setResolutionNote(prev => {
        const note = `[System] Compensation of ₦${newComp.amount.toLocaleString()} issued.`;
        return prev ? `${prev}\n${note}` : note;
    });
  };

  const getSentimentIcon = (sentiment?: Sentiment) => {
    switch (sentiment) {
      case Sentiment.POSITIVE: return <ThumbsUp size={14} className="text-green-500" />;
      case Sentiment.NEGATIVE: return <ThumbsDown size={14} className="text-red-500" />;
      default: return <Minus size={14} className="text-muted-foreground" />;
    }
  };

  // Filtered Data
  const filteredFeedbacks = feedbacks.filter(f => {
    const matchStatus = filterStatus === 'All' || f.status === filterStatus;
    const matchType = filterType === 'All' || f.type === filterType;
    const matchSearch = f.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        f.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  // Analytics Data
  const sentimentData = useMemo(() => {
    const counts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
    feedbacks.forEach(f => {
      if (f.sentiment) counts[f.sentiment]++;
      else counts['Neutral']++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [feedbacks]);

  const complaintsBySegmentData = useMemo(() => {
    const segmentCounts: Record<string, number> = {};
    feedbacks.filter(f => f.type === FeedbackType.COMPLAINT).forEach(f => {
      const customer = customers.find(c => c.id === f.customerId || c.name === f.customerName);
      if (customer && customer.segments && customer.segments.length > 0) {
        customer.segments.forEach(seg => { segmentCounts[seg] = (segmentCounts[seg] || 0) + 1; });
      } else {
        segmentCounts['Unassigned'] = (segmentCounts['Unassigned'] || 0) + 1;
      }
    });
    return Object.entries(segmentCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [feedbacks, customers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Feedback Management</h1>
            <p className="text-muted-foreground">Track customer satisfaction and resolve complaints.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input shadow-sm h-10 px-4 py-2 ${showAnalytics ? 'bg-secondary text-secondary-foreground' : 'bg-transparent hover:bg-accent hover:text-accent-foreground'}`}
            >
                {showAnalytics ? <PieIcon size={16} className="mr-2"/> : <BarChart3 size={16} className="mr-2"/>}
                Analytics
            </button>
            <button 
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
            >
                <Plus size={16} className="mr-2" /> Record Feedback
            </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-72 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold leading-none tracking-tight">Sentiment Overview</h3>
              </div>
              <div className="flex-1 p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" stroke="hsl(var(--card))">
                        {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Positive' ? '#22c55e' : entry.name === 'Negative' ? '#ef4444' : '#9ca3af'} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} itemStyle={{ color: 'hsl(var(--popover-foreground))' }}/>
                    <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-72 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold leading-none tracking-tight">Complaints by Segment</h3>
              </div>
              <div className="flex-1 p-4">
                {complaintsBySegmentData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complaintsBySegmentData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}}/>
                        <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false}/>
                        <Tooltip cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}} contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} itemStyle={{ color: 'hsl(var(--popover-foreground))' }}/>
                        <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} name="Complaints" barSize={15} />
                    </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No segment data.</div>
                )}
              </div>
           </div>
        </div>
      )}

      {/* Main Table Section */}
      <div className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
                    <Filter size={14} className="text-muted-foreground"/>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-transparent border-none text-sm font-medium focus:outline-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                </div>
                <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
                    <Filter size={14} className="text-muted-foreground"/>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-transparent border-none text-sm font-medium focus:outline-none"
                    >
                        <option value="All">All Types</option>
                        {Object.values(FeedbackType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                    type="text"
                    placeholder="Search content or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
            </div>
        </div>

        {/* Feedback List */}
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Content</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type & Sentiment</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                    </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                    {filteredFeedbacks.map((item) => (
                    <tr 
                        key={item.id} 
                        onClick={() => setSelectedFeedback(item)}
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                        <td className="p-4 align-middle whitespace-nowrap text-muted-foreground text-xs">{item.date}</td>
                        <td className="p-4 align-middle font-medium">{item.customerName}</td>
                        <td className="p-4 align-middle max-w-[180px] truncate text-muted-foreground" title={item.content}>{item.content}</td>
                        <td className="p-4 align-middle">
                            <div className="flex gap-2">
                                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium border ${
                                    item.type === FeedbackType.COMPLAINT ? 'border-red-200 bg-red-50 text-red-700' :
                                    item.type === FeedbackType.SUGGESTION ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                    'border-green-200 bg-green-50 text-green-700'
                                }`}>
                                    {item.type}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium bg-muted">
                                    {getSentimentIcon(item.sentiment)} {item.sentiment}
                                </span>
                            </div>
                        </td>
                        <td className="p-4 align-middle">
                             <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                item.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                             }`}>
                                {item.status === 'Resolved' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                {item.status}
                             </span>
                        </td>
                        <td className="p-4 align-middle text-right">
                             <button className="text-primary hover:text-primary/80 font-medium text-xs inline-flex items-center">
                                Attend <ArrowRight size={12} className="ml-1"/>
                             </button>
                        </td>
                    </tr>
                    ))}
                    {filteredFeedbacks.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found matching your filters.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Record Feedback Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Record Feedback</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={20}/></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Customer Name</label>
                    <input
                        type="text"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="Who is this from?"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Type</label>
                    <div className="flex gap-2">
                    {Object.values(FeedbackType).map((type) => (
                        <button
                        key={type}
                        type="button"
                        onClick={() => setNewType(type)}
                        className={`flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium px-2.5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border ${newType === type ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent hover:bg-accent hover:text-accent-foreground'}`}
                        >
                        {type}
                        </button>
                    ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Content</label>
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-32 resize-none"
                        placeholder="What did the customer say?"
                        required
                    />
                </div>
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isAnalyzing}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2"
                    >
                        {isAnalyzing ? <Loader className="animate-spin mr-2" size={16}/> : <MessageSquare size={16} className="mr-2" />}
                        {isAnalyzing ? 'Analyzing...' : 'Save Feedback'}
                    </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Attend to Feedback Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg border bg-card shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-start bg-muted/20">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                             <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                selectedFeedback.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                             }`}>
                                {selectedFeedback.status === 'Resolved' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                {selectedFeedback.status}
                             </span>
                             <span className="text-sm text-muted-foreground">{selectedFeedback.date}</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">{selectedFeedback.customerName}</h2>
                        <div className="flex items-center gap-2 mt-2">
                             <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium border ${
                                    selectedFeedback.type === FeedbackType.COMPLAINT ? 'border-red-200 bg-red-50 text-red-700' :
                                    selectedFeedback.type === FeedbackType.SUGGESTION ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                    'border-green-200 bg-green-50 text-green-700'
                             }`}>
                                    {selectedFeedback.type}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium bg-background">
                                    {getSentimentIcon(selectedFeedback.sentiment)} AI Sentiment: {selectedFeedback.sentiment}
                            </span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedFeedback(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="space-y-2 mb-8">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Feedback</label>
                        <div className="p-4 bg-muted/30 rounded-md border text-sm leading-relaxed">
                            "{selectedFeedback.content}"
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={14}/> Resolution & Actions
                        </label>
                        
                        {selectedFeedback.status === 'Open' ? (
                            <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
                                <p className="text-sm text-muted-foreground">Record the steps taken to address this feedback (e.g., called customer, issued refund, etc).</p>
                                <textarea
                                    value={resolutionNote}
                                    onChange={(e) => setResolutionNote(e.target.value)}
                                    placeholder="Describe action taken..."
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                />
                                <div className="flex justify-between items-center pt-2 gap-2">
                                     <button 
                                        onClick={handleOpenComp}
                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 h-9 px-4 py-2"
                                    >
                                        <Gift size={16} className="mr-2"/> Give Compensation
                                    </button>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedFeedback(null)}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleResolve}
                                            disabled={!resolutionNote}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white shadow hover:bg-green-700 h-9 px-4 py-2"
                                        >
                                            <CheckCircle2 size={16} className="mr-2"/> Mark as Resolved
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-green-800">Resolved on {selectedFeedback.resolvedDate}</span>
                                    <CheckCircle2 size={16} className="text-green-600"/>
                                </div>
                                <p className="text-sm text-green-700">
                                    {selectedFeedback.resolutionNote || "No resolution note recorded."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Compensation Modal */}
      {showCompModal && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-xl sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-lg font-semibold mb-4">Issue Compensation</h2>
                <div className="space-y-4">
                     <div className="space-y-2">
                         <label className="text-sm font-medium leading-none">Customer</label>
                         <input type="text" disabled value={compData.customerName || ''} className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(CompensationCategory).map((cat) => (
                                <button
                                key={cat}
                                onClick={() => setCompData({...compData, category: cat})}
                                className={`inline-flex items-center justify-center rounded-md text-xs font-medium px-3 py-2 transition-colors border ${compData.category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-accent hover:text-accent-foreground border-input'}`}
                                >
                                {cat}
                                </button>
                            ))}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Reason</label>
                        <input 
                            type="text" 
                            value={compData.reason || ''} 
                            onChange={(e) => setCompData({...compData, reason: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Amount (₦)</label>
                            <input 
                                type="number" 
                                value={compData.amount || ''} 
                                onChange={(e) => setCompData({...compData, amount: parseInt(e.target.value)})}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Status</label>
                            <select 
                                value={compData.status} 
                                onChange={(e) => setCompData({...compData, status: e.target.value as any})}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                     </div>
                     <div className="flex justify-end gap-3 pt-2">
                         <button onClick={() => setShowCompModal(false)} className="px-4 py-2 border rounded-md hover:bg-muted text-sm">Cancel</button>
                         <button onClick={handleSaveComp} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Save & Issue</button>
                     </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackLog;
