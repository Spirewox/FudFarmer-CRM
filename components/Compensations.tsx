
import React, { useState, useEffect } from 'react';
import { Compensation, CompensationCategory } from '../types';
import { StorageService } from '../services/storageService';
import { RefreshCw, CheckCircle, Clock, Plus, Tag, Gift, ShoppingBag, Ticket, Banknote } from 'lucide-react';

const Compensations: React.FC = () => {
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newComp, setNewComp] = useState<Partial<Compensation>>({ 
    status: 'Pending',
    category: CompensationCategory.PRODUCT 
  });

  useEffect(() => {
    setCompensations(StorageService.getCompensations());
  }, []);

  const handleSave = () => {
    if (!newComp.customerName || !newComp.amount) return;
    
    const item: Compensation = {
      id: StorageService.generateId(),
      customerId: '0',
      customerName: newComp.customerName,
      reason: newComp.reason || '',
      amount: Number(newComp.amount),
      date: new Date().toISOString().split('T')[0],
      status: newComp.status as 'Pending' | 'Approved' | 'Paid',
      category: newComp.category as CompensationCategory,
    };

    const updated = [item, ...compensations];
    setCompensations(updated);
    StorageService.saveCompensations(updated);
    setShowModal(false);
    setNewComp({ status: 'Pending', category: CompensationCategory.PRODUCT });
  };

  const getCategoryIcon = (category: CompensationCategory) => {
    switch(category) {
        case CompensationCategory.PRODUCT: return <ShoppingBag size={12} />;
        case CompensationCategory.MERCH: return <Gift size={12} />;
        case CompensationCategory.VOUCHER: return <Ticket size={12} />;
        case CompensationCategory.REFUND: return <Banknote size={12} />;
        default: return <Tag size={12} />;
    }
  };

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
                {compensations.map((comp) => (
                <tr key={comp.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{comp.customerName}</td>
                    <td className="p-4 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            comp.category === CompensationCategory.VOUCHER ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            comp.category === CompensationCategory.MERCH ? 'bg-pink-50 text-pink-700 border-pink-200' :
                            comp.category === CompensationCategory.REFUND ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                            {getCategoryIcon(comp.category)}
                            {comp.category}
                        </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{comp.reason}</td>
                    <td className="p-4 align-middle font-medium text-destructive">₦{comp.amount.toLocaleString()}</td>
                    <td className="p-4 align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        comp.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        comp.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {comp.status === 'Paid' ? <CheckCircle size={12}/> : comp.status === 'Approved' ? <RefreshCw size={12}/> : <Clock size={12}/>}
                        {comp.status}
                    </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{comp.date}</td>
                </tr>
                ))}
                {compensations.length === 0 && (
                    <tr><td colSpan={6} className="p-4 align-middle text-center text-muted-foreground">No compensations recorded.</td></tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold leading-none tracking-tight mb-4">Record Compensation</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">Customer Name</label>
                 <input type="text" placeholder="e.g. Mama Nkechi" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newComp.customerName || ''} onChange={e => setNewComp({...newComp, customerName: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">Compensation Category</label>
                 <div className="grid grid-cols-2 gap-2">
                    {Object.values(CompensationCategory).map((cat) => (
                         <button
                            key={cat}
                            onClick={() => setNewComp({...newComp, category: cat})}
                            className={`inline-flex items-center justify-center rounded-md text-xs font-medium px-3 py-2 transition-colors border ${newComp.category === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent hover:bg-accent hover:text-accent-foreground border-input'}`}
                         >
                            {cat}
                         </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium leading-none">Reason</label>
                 <input type="text" placeholder="e.g. Spoilt goods, late delivery" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newComp.reason || ''} onChange={e => setNewComp({...newComp, reason: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Value (₦)</label>
                    <input type="number" placeholder="0.00" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newComp.amount || ''} onChange={e => setNewComp({...newComp, amount: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Status</label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={newComp.status} onChange={e => setNewComp({...newComp, status: e.target.value as any})}>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid/Issued</option>
                    </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">Cancel</button>
              <button onClick={handleSave} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">Save Record</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compensations;
