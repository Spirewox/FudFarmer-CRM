
import React, { useState, useEffect } from 'react';
import { Compensation, CompensationCategory } from '../types';
import { StorageService } from '../services/storageService';
import { RefreshCw, CheckCircle, Clock, Plus, Tag, Gift, ShoppingBag, Ticket, Banknote, User } from 'lucide-react';
import { ICompensation, ValidCompensationStatus, ValidCompensationType } from '@/interface/compensation.interface';
import { axiosPatch, axiosPost } from '@/lib/api';
import { toast } from 'react-toastify';
import { useCompensationList } from '@/hooks/useCompensationQueries';
import { useCustomerList } from '@/hooks/useCustomers';
import { ICustomer } from '@/interface/customer.interface';

const Compensations: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [newComp, setNewComp] = useState<Partial<ICompensation>>({ 
    status: ValidCompensationStatus.pending,
    category: ValidCompensationType.product
  });
  const [mode, setMode] = useState<'create' | 'status'>('create');
  const [selectedComp, setSelectedComp] = useState<ICompensation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {data : compensationList, isLoading : compListLoading, refetch : refetchCompList} = useCompensationList()

  const {data : customerList} = useCustomerList({
    customer_location  : ""
  })

const handleSave = async () => {
  try {
    setIsSubmitting(true);

    if (mode === 'create') {
      if (!newComp.customer || !newComp.value) return;

      await axiosPost('compensations', newComp, true);
      toast.success('Compensation recorded');
    }

    if (mode === 'status' && selectedComp?._id) {
      await axiosPatch(
        `compensations/${selectedComp._id}/status`,
        { status: newComp.status },
        true
      );
      toast.success('Status updated');
    }

    refetchCompList();
    setShowModal(false);
    setSelectedComp(null);
    setMode('create');
    setNewComp({
      status: ValidCompensationStatus.pending,
      category: ValidCompensationType.product,
    });
  } catch (error: any) {
    toast.error(error?.message || 'Something went wrong');
  } finally {
    setIsSubmitting(false);
  }
};


  const getCategoryIcon = (category: ValidCompensationType) => {
    switch(category) {
        case ValidCompensationType.product: return <ShoppingBag size={12} />;
        case ValidCompensationType.merch: return <Gift size={12} />;
        case ValidCompensationType.voucher: return <Ticket size={12} />;
        case ValidCompensationType.refund: return <Banknote size={12} />;
        default: return <Tag size={12} />;
    }
  };

  const isStatusMode = mode === 'status';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Compensations</h1>
           <p className="text-muted-foreground">Manage refunds and customer compensations.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus size={16} className="mr-2" /> Record Compensation
        </button>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reason</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Value</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
                {compensationList?.data?.map((comp) => (
                <tr key={comp._id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer"   onClick={() => {
                  setSelectedComp(comp);
                  setNewComp({ status: comp.status });
                  setMode('status');
                  setShowModal(true);
                }}>
                    <td className="p-4 align-middle font-medium">{(comp.customer as ICustomer)?.customer_name}</td>
                    <td className="p-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            comp.category === ValidCompensationType.voucher ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            comp.category === ValidCompensationType.merch ? 'bg-pink-50 text-pink-700 border-pink-200' :
                            comp.category === ValidCompensationType.refund ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                            {getCategoryIcon(comp.category)}
                            {comp.category}
                        </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{comp.reason}</td>
                    <td className="p-4 align-middle font-medium text-destructive">₦{comp.value.toLocaleString()}</td>
                    <td className="p-4 align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        comp.status === ValidCompensationStatus.paid_issued ? 'bg-green-100 text-green-800' :
                        comp.status === ValidCompensationStatus.approved ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {comp.status === ValidCompensationStatus.paid_issued ? <CheckCircle size={12}/> : comp.status ===ValidCompensationStatus.approved ? <RefreshCw size={12}/> : <Clock size={12}/>}
                        {comp.status}
                    </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{new Date(comp.createdAt).toLocaleString()}</td>
                </tr>
                ))}
                {compensationList?.data?.length === 0 && (
                    <tr><td colSpan={6} className="p-4 align-middle text-center text-muted-foreground">No compensations recorded.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">{mode === 'create' ? 'Record Compensation' : 'Update Compensation Status'}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Customer Name</label>
                <User size={14} className="absolute left-3 top-3 text-muted-foreground"/>
                <select 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                    disabled={isStatusMode}
                    value={String(isStatusMode ? (selectedComp?.customer as ICustomer)?._id : newComp.customer)}
                    onChange={e => setNewComp({...newComp, customer: e.target.value})}
                >
                    <option value="">-- Select Customer --</option>
                    {customerList?.map(t => <option key={t._id} value={t._id}>{t.customer_name}</option>)}
                </select>
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">Compensation Category</label>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.values(ValidCompensationType).map((cat) => (
                         <button
                            key={cat}
                            disabled={isStatusMode}
                            onClick={() => setNewComp({...newComp, category: cat})}
                            className={`inline-flex items-center justify-center rounded-md text-xs font-medium px-3 py-2 transition-colors border ${newComp.category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-accent hover:text-accent-foreground border-input'} ${isStatusMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                         >
                            {cat}
                         </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">Reason</label>
                 <input type="text" placeholder="e.g. Spoilt goods, late delivery" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" readOnly={isStatusMode}
                value={isStatusMode ? selectedComp?.reason : newComp.reason || ''} onChange={e => setNewComp({...newComp, reason: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Value (₦)</label>
                    <input type="number" placeholder="0.00" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" readOnly={isStatusMode}
                    value={isStatusMode ? selectedComp?.value : newComp.value || ''} onChange={e => setNewComp({...newComp, value: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Status</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring capitalize" value={newComp.status} onChange={e => setNewComp({...newComp, status: e.target.value as any})}>
                        {Object.values(ValidCompensationStatus).map((item,idx) => <option className='capitalize' key={idx} value={item}>{item}</option>)}
                    </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">Cancel</button>
              <button disabled={isSubmitting} onClick={handleSave} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">{mode === 'create' ? 'Save Record' : 'Update Status'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compensations;
