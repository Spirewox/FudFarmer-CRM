
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Location, Agent } from '../types';
import { Plus, DollarSign, MapPin, Phone, User, X, Briefcase, StickyNote, BrainCircuit, CheckCircle2, TrendingUp, Loader, Search, Filter } from 'lucide-react';
import { ILead, ValidLeadStatus } from '@/interface/lead.interface';
import { useLeadList, useLeadsLocations } from '@/hooks/useLeadsQueries';
import { useUsers } from '@/hooks/useQueries';
import { toast } from 'react-toastify';
import { axiosPatch, axiosPost } from '@/lib/api';
import { Skeleton } from './ui/Skeleton';
import { useAuth, ValidUserRole } from '@/contexts/AuthContext';

const LeadManager: React.FC = () => {
  const {user} = useAuth()
  const [showModal, setShowModal] = useState(false);
  
  // Selection & AI State
  const [selectedLead, setSelectedLead] = useState<ILead | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ValidLeadStatus | 'All'>('All');
  const [filterLocation, setFilterLocation] = useState<string | 'All'>('All');
  const [filterAgentId, setFilterAgentId] = useState<string>('All');
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {data : leadLists, isLoading : listLoading, refetch : listRefetch} = useLeadList(
    {
      search : searchTerm,
      agent : filterAgentId === "All" ? "" : filterAgentId,
      location : filterLocation === "All" ? "" : filterLocation,
      status : filterStatus == "All" ? "" : filterStatus,
    }
  )
  const {data : locations} = useLeadsLocations()
  const {data : users} = useUsers({
    limit : 20,
    page : 1,
  })

  const [newLead, setNewLead] = useState<Partial<ILead>>({
    status: ValidLeadStatus.new,
    location: Location.LAGOS,
    agent: ''
  });


  const handleSave = async() => {
    try {
      setIsSubmitting(true)
      if (!newLead.business_name) return;
      await axiosPost('leads', newLead,true)
      listRefetch()
      toast.success("Lead added successfully")
      setShowModal(false);
      setNewLead({ status: ValidLeadStatus.new, location: Location.LAGOS, agent: '' });
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsSubmitting(false)
    }

  };

  const updateStatus = async(id: string, newStatus: ValidLeadStatus) => {
    try {
      setIsSubmitting(true)
      await axiosPatch(`leads/${id}/status`, {status : newStatus}, true)
      listRefetch()
      setSelectedLead(null)
      toast.success('Status updated successfully')
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsSubmitting(false)
    }

  };

  // const handleScoreLead = async () => {
  //   if (!selectedLead) return;
  //   setIsScoring(true);
    
  //   const result = await GeminiService.scoreLead(selectedLead.notes, selectedLead.businessName);
    
  //   const updatedLead = { ...selectedLead, aiScore: result.score, aiInsight: result.insight };
  //   const updatedLeads = leads.map(l => l.id === selectedLead.id ? updatedLead : l);
    
  //   setLeads(updatedLeads);
  //   StorageService.saveLeads(updatedLeads);
  //   setSelectedLead(updatedLead);
  //   setIsScoring(false);
  // };

  const getStatusBadgeStyles = (status: ValidLeadStatus) => {
    switch (status) {
      case ValidLeadStatus.new: return 'bg-blue-100 text-blue-800 hover:bg-blue-100/80';
      case ValidLeadStatus.contacted: return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80';
      case ValidLeadStatus.negotiation: return 'bg-purple-100 text-purple-800 hover:bg-purple-100/80';
      case ValidLeadStatus.closed_won: return 'bg-green-100 text-green-800 hover:bg-green-100/80';
      case ValidLeadStatus.closed_lost: return 'bg-gray-100 text-gray-800 hover:bg-gray-100/80';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getScoreColor = (score?: number) => {
      if (!score) return 'text-muted-foreground';
      if (score >= 80) return 'text-green-600';
      if (score >= 50) return 'text-yellow-600';
      return 'text-red-600';
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
            <p className="text-muted-foreground">Track and manage business opportunities.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus size={18} className="mr-2" /> New Lead
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
             <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background whitespace-nowrap">
                <Filter size={14} className="text-muted-foreground"/>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-transparent border-none text-sm font-medium focus:outline-none capitalize"
                >
                    <option value="All">All Statuses</option>
                    {Object.values(ValidLeadStatus).map(s => <option className='capitalize' key={s} value={s}>{s}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background whitespace-nowrap">
                <MapPin size={14} className="text-muted-foreground"/>
                <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value as any)}
                    className="bg-transparent border-none text-sm font-medium focus:outline-none"
                >
                    <option value="All">All Locations</option>
                    {locations?.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
             </div>
             {
              user.role == ValidUserRole.admin &&              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-background whitespace-nowrap">
                <User size={14} className="text-muted-foreground"/>
                <select
                    value={filterAgentId}
                    onChange={(e) => setFilterAgentId(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium focus:outline-none max-w-[150px]"
                >
                    <option value="All">All Agents</option>
                    {users?.users?.map(a => <option key={a._id} value={a._id}>{a.full_name}</option>)}
                </select>
             </div>
             }

        </div>

        <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
                type="text"
                placeholder="Search business or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
        </div>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="relative w-full overflow-auto">
          {listLoading ? <LeadTableSkeleton/> : (
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Business</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Value (₦)</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Sales Agent</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {leadLists?.map((lead) => (
                  <tr 
                      key={lead._id} 
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                  >
                    <td className="p-4 align-middle font-medium">
                        {lead.business_name}
                        {/* {lead.aiScore && (
                            <div className="flex items-center gap-1 mt-1">
                                <BrainCircuit size={10} className={getScoreColor(lead.aiScore)} />
                                <span className={`text-[10px] font-bold ${getScoreColor(lead.aiScore)}`}>{lead.aiScore}/100</span>
                            </div>
                        )} */}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm">{lead.contact_person}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10}/> {lead.contact_person_phone}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-muted-foreground"/> {lead.location}
                      </div>
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {lead.value.toLocaleString()}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                              {lead.agent_name ? lead.agent_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          {lead.agent_name}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div onClick={(e) => e.stopPropagation()}>
                          <select 
                              value={lead.status}
                              onChange={(e) => updateStatus(lead._id, e.target.value as ValidLeadStatus)}
                              className={`text-xs font-semibold px-2 py-1 rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring capitalize ${getStatusBadgeStyles(lead.status)}`}
                          >
                              {Object.values(ValidLeadStatus).map(s => <option className='capitalize' key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                    </td>
                    <td className="p-4 align-middle max-w-[200px] truncate text-muted-foreground" title={lead.notes}>
                      {lead.notes}
                    </td>
                  </tr>
                ))}
                {leadLists?.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No leads found matching your criteria.</td></tr>
                )}
              </tbody>
            </table>)
          }

        </div>
      </div>

       {/* Add Lead Modal */}
       {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">New Lead</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Business Name" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newLead.business_name || ''} onChange={e => setNewLead({...newLead, business_name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Contact Person" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newLead.contact_person || ''} onChange={e => setNewLead({...newLead, contact_person: e.target.value})} />
                <input type="text" placeholder="Phone" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newLead.contact_person_phone || ''} onChange={e => setNewLead({...newLead, contact_person_phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value as Location})}>
                    <option value={Location.LAGOS}>Lagos</option>
                    <option value={Location.IFE}>Ife</option>
                 </select>
                 <input type="number" placeholder="Value (₦)" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newLead.value || ''} onChange={e => setNewLead({...newLead, value: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-medium text-muted-foreground">Sales Agent</label>
                 <div className="relative">
                    <User size={14} className="absolute left-3 top-3 text-muted-foreground"/>
                    <select 
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                        value={newLead.agent || ''} 
                        onChange={e => setNewLead({...newLead, agent: e.target.value})} 
                    >
                      <option value="">-- Select Agent --</option>
                      {users?.users?.map(a => <option key={a._id} value={a._id}>{a.full_name}</option>)}
                    </select>
                 </div>
              </div>
              <textarea placeholder="Notes (Product interest, requirements...)" className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24 resize-none" value={newLead.notes || ''} onChange={e => setNewLead({...newLead, notes: e.target.value})}></textarea>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">Cancel</button>
              <button onClick={handleSave} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">Save Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Slide-over */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLead(null)}></div>
            <div className="w-full max-w-2xl bg-card border-l shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b flex justify-between items-start sticky top-0 bg-card z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold tracking-tight">{selectedLead.business_name}</h2>
                            <select 
                                value={selectedLead.status}
                                onChange={(e) => updateStatus(selectedLead._id, e.target.value as ValidLeadStatus)}
                                className={`text-xs font-semibold px-2 py-1 rounded-md border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring capitalize ${getStatusBadgeStyles(selectedLead.status)}`}
                            >
                                {Object.values(ValidLeadStatus).map(s => <option className='capitalize' key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                            <MapPin size={14} /> {selectedLead.location}
                        </div>
                    </div>
                    <button onClick={() => setSelectedLead(null)} className="rounded-full p-2 hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* AI Score Section */}
                    {/* <div className="rounded-xl border bg-gradient-to-br from-background to-muted p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold flex items-center gap-2">
                                <BrainCircuit className="text-purple-600" size={20} /> AI Deal Scoring
                            </h3>
                            {selectedLead.aiScore !== undefined && (
                                <div className={`text-2xl font-bold ${getScoreColor(selectedLead.aiScore)}`}>
                                    {selectedLead.aiScore}/100
                                </div>
                            )}
                        </div>
                        
                        {selectedLead.aiInsight ? (
                            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg border">
                                {selectedLead.aiInsight}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Analyze this lead's notes to get a conversion probability score.</p>
                        )}
                        
                        <div className="pt-2">
                            <button 
                                onClick={handleScoreLead}
                                disabled={isScoring}
                                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 h-8 px-3"
                            >
                                {isScoring ? <Loader size={14} className="animate-spin mr-2"/> : <BrainCircuit size={14} className="mr-2"/>}
                                {selectedLead.aiScore ? 'Re-Analyze Lead' : 'Score Lead with AI'}
                            </button>
                        </div>
                    </div> */}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Potential Value</p>
                            <p className="text-2xl font-bold text-foreground">₦{selectedLead.value.toLocaleString()}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Sales Agent</p>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                    {selectedLead.agent_name ? selectedLead.agent_name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="font-medium">{selectedLead.agent_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User size={18} /> Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                                <User size={14} className="text-muted-foreground"/>
                                <span>{selectedLead.contact_person}</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-muted/30">
                                <Phone size={14} className="text-muted-foreground"/>
                                <span>{selectedLead.contact_person_phone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <StickyNote size={18} /> Notes & Requirements
                        </h3>
                        <div className="p-4 bg-muted/20 rounded-md border min-h-[100px] text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedLead.notes}
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-between">
                      <span className="text-xs text-muted-foreground">Lead ID: {selectedLead._id}</span>
                      <button className="text-destructive text-sm font-medium hover:underline">Delete Lead</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeadManager;


export function LeadTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table className="w-full caption-bottom text-sm">
      <thead className="[&_tr]:border-b">
        <tr>
          <th className="h-12 px-4 text-left">Business</th>
          <th className="h-12 px-4 text-left">Contact</th>
          <th className="h-12 px-4 text-left">Location</th>
          <th className="h-12 px-4 text-left">Value (₦)</th>
          <th className="h-12 px-4 text-left">Sales Agent</th>
          <th className="h-12 px-4 text-left">Status</th>
          <th className="h-12 px-4 text-left">Notes</th>
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b">
            {/* Business */}
            <td className="p-4">
              <Skeleton className="h-4 w-40" />
            </td>

            {/* Contact */}
            <td className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
            </td>

            {/* Location */}
            <td className="p-4">
              <Skeleton className="h-4 w-24" />
            </td>

            {/* Value */}
            <td className="p-4">
              <Skeleton className="h-4 w-20" />
            </td>

            {/* Sales Agent */}
            <td className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </td>

            {/* Status */}
            <td className="p-4">
              <Skeleton className="h-6 w-20 rounded-md" />
            </td>

            {/* Notes */}
            <td className="p-4">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}