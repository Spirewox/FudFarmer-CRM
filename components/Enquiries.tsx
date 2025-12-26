
import React, { useState, useEffect } from 'react';
import { Enquiry } from '../types';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Mail, Plus, Wand2, Copy, CheckCircle2, Clock, XCircle, ChevronRight, User } from 'lucide-react';
import { useEnquiryList } from '@/hooks/useEnquiryQueries';
import { toast } from 'react-toastify';
import { IEnquiry, ValidEnquiryStatus } from '@/interface/enquiry.interface';
import { axiosPatch, axiosPost } from '@/lib/api';

const Enquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<IEnquiry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // New Enquiry Form State
  const [newEnquiry, setNewEnquiry] = useState<Partial<IEnquiry>>({
    date: new Date(),
  });

  // Resolution State
  const [resolution, setResolution] = useState('');
  const [generating, setGenerating] = useState(false);

  const {data : enquiryList, isLoading : enquiryLoading, refetch : refetchEnquiry} = useEnquiryList()
  console.log(enquiryList)

  useEffect(() => {
    setEnquiries(StorageService.getEnquiries());
  }, []);

  const handleSaveNew = async() => {
    try {
      setIsSubmitting(true)
      if (!newEnquiry.customer_name || !newEnquiry.message) return;

      const enquiry: IEnquiry = {
        customer_name: newEnquiry.customer_name,
        customer_email: newEnquiry.customer_email || '',
        subject: newEnquiry.subject || 'General Enquiry',
        message: newEnquiry.message,
        date : newEnquiry.date
      };

      await axiosPost('enquiries',enquiry,true)
      refetchEnquiry()
      setShowAddModal(false);
      setNewEnquiry({ date: new Date() });
    } catch (error) {
      toast.error(error)
    }finally{
      setIsSubmitting(false)
    }
  };

  const handleResolve = async() => {
    try {
      setIsSubmitting(true)
      if (!selectedEnquiry || !resolution) return;

      await axiosPatch(`enquiries/${selectedEnquiry._id}/resolve`,{resolution},true)
      refetchEnquiry()
      setSelectedEnquiry(null);
      setResolution('');
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsSubmitting(false)
    }
  };

  const handleGenerateResponse = async () => {
    if (!selectedEnquiry) return;
    setGenerating(true);
    const response = await GeminiService.draftResponse(selectedEnquiry.customer_name, selectedEnquiry.message);
    setResolution(response);
    setGenerating(false);
  };

  const openResolveModal = (enquiry: IEnquiry) => {
    setSelectedEnquiry(enquiry);
    setResolution(enquiry.resolution || '');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Enquiries</h1>
           <p className="text-muted-foreground">Log and track customer questions and requests.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus size={16} className="mr-2" /> Record Enquiry
        </button>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subject / Message</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {enquiryList?.data?.map((enq) => (
                <tr 
                  key={enq._id} 
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => openResolveModal(enq)}
                >
                  <td className="p-4 align-middle whitespace-nowrap text-muted-foreground text-xs">{new Date(enq.date).toLocaleString()}</td>
                  <td className="p-4 align-middle font-medium">
                    <div className="flex flex-col">
                        <span>{enq.customer_name}</span>
                        <span className="text-xs text-muted-foreground font-normal">{enq.customer_email}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle max-w-[300px]">
                    <div className="flex flex-col">
                        <span className="font-medium text-xs mb-1">{enq.subject}</span>
                        <span className="truncate text-muted-foreground" title={enq.message}>{enq.message}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                     <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        enq.status === ValidEnquiryStatus.closed ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                     }`}>
                        {enq.status === ValidEnquiryStatus.closed ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                        {enq.status}
                     </span>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                        <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
               {enquiries.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No enquiries recorded yet.</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Enquiry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold leading-none tracking-tight">Record New Enquiry</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><XCircle size={20}/></button>
             </div>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Customer Name</label>
                        <input
                            type="text"
                            value={newEnquiry.customer_name || ''}
                            onChange={(e) => setNewEnquiry({...newEnquiry, customer_name: e.target.value})}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Date</label>
                        <input
                            type="date"
                            value={new Date(newEnquiry.date).toISOString() || ''}
                            onChange={(e) => setNewEnquiry({...newEnquiry, date: new Date(e.target.value)})}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Email / Contact (Optional)</label>
                    <input
                        type="text"
                        value={newEnquiry.customer_email || ''}
                        onChange={(e) => setNewEnquiry({...newEnquiry, customer_email: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Subject</label>
                    <input
                        type="text"
                        value={newEnquiry.subject || ''}
                        onChange={(e) => setNewEnquiry({...newEnquiry, subject: e.target.value})}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        placeholder="e.g. Bulk Order Pricing"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Message / Request</label>
                    <textarea
                        value={newEnquiry.message || ''}
                        onChange={(e) => setNewEnquiry({...newEnquiry, message: e.target.value})}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24 resize-none"
                    />
                </div>
                <div className="flex justify-end pt-2 gap-3">
                    <button disabled={isSubmitting} onClick={() => setShowAddModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent h-9 px-4 py-2">Cancel</button>
                    <button disabled={isSubmitting} onClick={handleSaveNew} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">Save Enquiry</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* View / Resolve Enquiry Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg border bg-card shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-start bg-muted/20">
                    <div>
                         <div className="flex items-center gap-2 mb-1">
                             <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                selectedEnquiry.status === ValidEnquiryStatus.closed ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                             }`}>
                                {selectedEnquiry.status === ValidEnquiryStatus.closed ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                {selectedEnquiry.status}
                             </span>
                             <span className="text-sm text-muted-foreground">{new Date(selectedEnquiry.date).toLocaleString()}</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">{selectedEnquiry.subject}</h2>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <User size={14} /> {selectedEnquiry.customer_name}
                            {selectedEnquiry.customer_email && <span className="text-xs">({selectedEnquiry.customer_email})</span>}
                        </div>
                    </div>
                    <button onClick={() => setSelectedEnquiry(null)} className="text-muted-foreground hover:text-foreground"><XCircle size={24}/></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="space-y-2 mb-8">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enquiry Details</label>
                        <div className="p-4 bg-muted/30 rounded-md border text-sm leading-relaxed">
                            {selectedEnquiry.message}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            Resolution
                        </label>
                        
                        {selectedEnquiry.status === ValidEnquiryStatus.open ? (
                            <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">How was this handled?</p>
                                    {/* <button 
                                        onClick={handleGenerateResponse}
                                        disabled={generating}
                                        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-7 px-3"
                                    >
                                        <Wand2 size={12} className="mr-2" /> {generating ? 'Thinking...' : 'Generate AI Response'}
                                    </button> */}
                                </div>
                                <textarea
                                    value={resolution}
                                    onChange={(e) => setResolution(e.target.value)}
                                    placeholder="Enter resolution details (e.g., Sent price list, called customer)..."
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                />
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setSelectedEnquiry(null)}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleResolve}
                                        disabled={!resolution}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                                    >
                                        <CheckCircle2 size={16} className="mr-2"/> Mark as Closed
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-800">Status: Closed</span>
                                    <CheckCircle2 size={16} className="text-gray-600"/>
                                </div>
                                <p className="text-sm text-gray-700">
                                    {selectedEnquiry.resolution || "No resolution details recorded."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
