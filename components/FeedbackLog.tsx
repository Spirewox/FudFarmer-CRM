
import React, { useState, useEffect, useMemo } from 'react';
import { Feedback, FeedbackType, Sentiment, Customer, Compensation, CompensationCategory } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Loader, BarChart3, PieChart as PieIcon, Plus, Filter, CheckCircle2, XCircle, Search, Calendar, User, ArrowRight, Clock, Gift, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { IFeedback, ValidFeedBackSentiment, ValidFeedBackStatus, ValidFeedbackTypes } from '@/interface/feedback.interface';
import { useCustomerList } from '@/hooks/useCustomers';
import { useFeedbackAnalytics, useFeedbackList } from '@/hooks/useFeedbackQueries';
import { ICustomer } from '@/interface/customer.interface';
import { ICompensation, ValidCompensationStatus, ValidCompensationType } from '@/interface/compensation.interface';
import { toast } from 'react-toastify';
import { axiosPatch, axiosPost } from '@/lib/api';

const FeedbackLog: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<string | null>(null)
  
  // UI State
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<IFeedback | null>(null); // For "Attending" to feedback
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'All' | ValidFeedBackStatus>('All');
  const [filterType, setFilterType] = useState<ValidFeedbackTypes | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State (New Feedback)
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<ValidFeedbackTypes>(ValidFeedbackTypes.complaint);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolution State
  const [resolutionNote, setResolutionNote] = useState('');

  // Compensation Modal State
  const [showCompModal, setShowCompModal] = useState(false);
  const [compData, setCompData] = useState<Partial<ICompensation>>({
    status: ValidCompensationStatus.pending,
    category: ValidCompensationType.product
  });

  const {data : feedbackList, isLoading : feedbackListLoading, refetch : refetchFeedbackList} = useFeedbackList({
    search  : searchTerm,
    status : filterStatus == "All" ? "" : filterStatus,
    type : filterType == "All" ? "" : filterType
  })

  const {data : feedbackAnalytics, isLoading : analyticsLoading, refetch : refetchAnalytics} = useFeedbackAnalytics()

  const {data : customersList} = useCustomerList({
    customer_location : ""
  })

  useEffect(() => {
    setFeedbacks(StorageService.getFeedback());
    setCustomers(StorageService.getCustomers());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    try {
        setIsSubmitting(true)
        e.preventDefault();
        if (!newContent || !customer) return;


        const newFeedback: IFeedback = {
        customer,
        type: newType,
        content: newContent,
        };
        await axiosPost('feedbacks',newFeedback,true)
        refetchFeedbackList()
        // Reset and Close
        setNewContent('');
        setNewCustomerName('');
        setShowAddModal(false);
    } catch (error) {
        toast.error(error.message)
    }finally{
        setIsSubmitting(false)
    }
    
  };

  const handleResolve = async () => {
    try {
        setIsSubmitting(true)
        if (!selectedFeedback) return;
        await axiosPatch(`feedbacks/${selectedFeedback._id}/resolve`,{resolution : resolutionNote},true)
        refetchFeedbackList()
        setSelectedFeedback(null); // Close modal
        setResolutionNote('');
    } catch (error) {
        toast.error(error.message)
    }finally{
        setIsSubmitting(false)
    }
  };

  const handleOpenComp = async() => {
    if(!selectedFeedback) return;
    setCompData({
        customer : selectedFeedback.customer,
        reason: `Ref: ${selectedFeedback.type} - ${selectedFeedback.content.substring(0, 20)}...`,
        value: 0,
        status: ValidCompensationStatus.pending,
        category: ValidCompensationType.product
    });
    setShowCompModal(true);
  };
  const handleSaveComp = async() => {
    try {
        if (!compData.value || !compData.customer) return;

        await axiosPost(`compensations`,{customer : (compData.customer as ICustomer)._id,category : compData.category, reason : compData.reason, status : compData.status,value : compData.value},true)
        refetchFeedbackList()
        setShowCompModal(false);
        setResolutionNote(prev => {
            const note = `[System] Compensation of ₦${compData.value.toLocaleString()} issued.`;
            return prev ? `${prev}\n${note}` : note;
        });
    } catch (error) {
        toast.error(error.message)
    }finally{
        setIsSubmitting(false)
    }
  };

  const getSentimentIcon = (sentiment?: ValidFeedBackSentiment) => {
    switch (sentiment) {
      case ValidFeedBackSentiment.positive: return <ThumbsUp size={14} className="text-green-500" />;
      case ValidFeedBackSentiment.negative: return <ThumbsDown size={14} className="text-red-500" />;
      default: return <Minus size={14} className="text-muted-foreground" />;
    }
  };


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
                    <Pie data={feedbackAnalytics.sentiments} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" stroke="hsl(var(--card))">
                        {feedbackAnalytics.sentiments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name == 'Positive' ? '#22c55e' : entry.name == 'Negative' ? '#ef4444' : '#9ca3af'} />
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
                {feedbackAnalytics?.complaintsBySegment?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={feedbackAnalytics?.complaintsBySegment} layout="vertical" margin={{ left: 10 }}>
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
                        className="bg-transparent border-none text-sm font-medium focus:outline-none capitalize"
                    >
                        <option value="All">All Status</option>
                        {Object.values(ValidFeedBackStatus).map(t => <option className="capitalize" key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background">
                    <Filter size={14} className="text-muted-foreground"/>
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="bg-transparent border-none text-sm font-medium focus:outline-none capitalize"
                    >
                        <option value="All">All Types</option>
                        {Object.values(ValidFeedbackTypes).map(t => <option className="capitalize" key={t} value={t}>{t}</option>)}
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
                {feedbackListLoading ? <FeedbackSkeleton/> : (
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
                    {feedbackList?.map((item) => (
                    <tr 
                        key={item._id} 
                        onClick={() => setSelectedFeedback(item)}
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                        <td className="p-4 align-middle whitespace-nowrap text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="p-4 align-middle font-medium">{(item?.customer as ICustomer)?.customer_name}</td>
                        <td className="p-4 align-middle max-w-[180px] truncate text-muted-foreground" title={item.content}>{item.content}</td>
                        <td className="p-4 align-middle">
                            <div className="flex gap-2">
                                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium border capitalize ${
                                    item.type === ValidFeedbackTypes.complaint ? 'border-red-200 bg-red-50 text-red-700' :
                                    item.type === ValidFeedbackTypes.suggestion ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
                                    'border-green-200 bg-green-50 text-green-700'
                                }`}>
                                    {item.type}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium bg-muted capitalize">
                                    {getSentimentIcon(item.sentiment)} {item.sentiment}
                                </span>
                            </div>
                        </td>
                        <td className="p-4 align-middle">
                             <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                item.status === ValidFeedBackStatus.resolved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                             }`}>
                                {item.status === ValidFeedBackStatus.resolved ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
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
                    {feedbackList?.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found matching your filters.</td></tr>
                    )}
                </tbody>
                </table>
                )}
                
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
                    <div className="relative">
                        <User size={14} className="absolute left-3 top-3 text-muted-foreground"/>
                        <select 
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                            value={customer || ""}
                            onChange={(e) => setCustomer(e.target.value as any)}
                        >
                            <option value="">-- Select Customer --</option>
                            {customersList?.map(t => <option key={t._id} value={t._id}>{t.customer_name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Type</label>
                    <div className="flex gap-2">
                    {Object.values(ValidFeedbackTypes).map((type) => (
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
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 py-2"
                    >
                        {isSubmitting ? <Loader className="animate-spin mr-2" size={16}/> : <MessageSquare size={16} className="mr-2" />}
                        {isSubmitting ? 'Submitting...' : 'Save Feedback'}
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
                                selectedFeedback.status === ValidFeedBackStatus.resolved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                             }`}>
                                {selectedFeedback.status === ValidFeedBackStatus.resolved ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                {selectedFeedback.status}
                             </span>
                             <span className="text-sm text-muted-foreground">{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">{(selectedFeedback.customer as ICustomer).customer_name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                             <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium border ${
                                    selectedFeedback.type === ValidFeedbackTypes.complaint ? 'border-red-200 bg-red-50 text-red-700' :
                                    selectedFeedback.type === ValidFeedbackTypes.suggestion ? 'border-yellow-200 bg-yellow-50 text-yellow-700' :
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
                        
                        {selectedFeedback.status === ValidFeedBackStatus.open ? (
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
                                    <span className="text-sm font-bold text-green-800">Resolved on {new Date(selectedFeedback.resolution_date).toLocaleString()}</span>
                                    <CheckCircle2 size={16} className="text-green-600"/>
                                </div>
                                <p className="text-sm text-green-700">
                                    {selectedFeedback.resolution || "No resolution note recorded."}
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
                         <input type="text" disabled value={(compData.customer as ICustomer).customer_name || ''} className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(ValidCompensationType).map((cat) => (
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
                                value={compData.value || ''} 
                                onChange={(e) => setCompData({...compData, value: parseInt(e.target.value)})}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Status</label>
                            <select 
                                value={compData.status} 
                                onChange={(e) => setCompData({...compData, status: e.target.value as any})}
                                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                            >
                                {Object.values(ValidCompensationStatus).map(t => <option className="capitalize" key={t} value={t}>{t}</option>)}
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


const FeedbackSkeleton = ()=>{
    return(<table className="w-full caption-bottom text-sm">
  <thead className="[&_tr]:border-b">
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <th key={i} className="h-12 px-4 text-left align-middle">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        </th>
      ))}
    </tr>
  </thead>

  <tbody>
    {Array.from({ length: 6 }).map((_, rowIdx) => (
      <tr key={rowIdx} className="border-b">
        {/* Date */}
        <td className="p-4">
          <div className="h-3 w-28 bg-muted rounded animate-pulse" />
        </td>

        {/* Customer */}
        <td className="p-4">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </td>

        {/* Content */}
        <td className="p-4">
          <div className="h-3 w-full max-w-[180px] bg-muted rounded animate-pulse" />
        </td>

        {/* Type & Sentiment */}
        <td className="p-4">
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
            <div className="h-5 w-24 rounded bg-muted animate-pulse" />
          </div>
        </td>

        {/* Status */}
        <td className="p-4">
          <div className="h-5 w-24 rounded-full bg-muted animate-pulse" />
        </td>

        {/* Action */}
        <td className="p-4 text-right">
          <div className="h-4 w-14 ml-auto bg-muted rounded animate-pulse" />
        </td>
      </tr>
    ))}
  </tbody>
</table>
)
}