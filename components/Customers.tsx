import React, { useState, useEffect } from 'react';
import { Location,} from '../types';
import { Plus, Search, MapPin, Building2, User, Award, Crown, Zap, X, MessageSquare, Mail, RefreshCw, Calendar, Phone, DollarSign, Filter, ShoppingBag, MessageSquarePlus, FileQuestion, Package, Truck, Store, Copy, Check, Briefcase } from 'lucide-react';
import { CustomerOverview, useCustomerLocations, useCustomerOverview } from '@/hooks/useCustomers';
import { CustomerSegment, CustomerSegmentType, ICustomer, ValidCustomerType } from '@/interface/customer.interface';
import { IFeedback, ValidFeedbackTypes } from '@/interface/feedback.interface';
import { Skeleton } from './ui/Skeleton';
import { useUsers } from '@/hooks/useQueries';
import { toast } from 'react-toastify';
import { useAuth, ValidUserRole } from '@/contexts/AuthContext';
import { axiosPatch, axiosPost } from '@/lib/api';
import { ValidOrderType } from '@/interface/order.interface';
import { IEnquiry } from '@/interface/enquiry.interface';
import { Pagination } from './ui/Pagination';

const Customers: React.FC = () => {
  const {user} = useAuth()
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter State
  const [filterType, setFilterType] = useState<ValidCustomerType | 'All'>('All');
  const [filterLocation, setFilterLocation] = useState<string | 'All'>('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [originalCustomer, setOriginalCustomer] = useState<Partial<ICustomer> | null>(null);
  
  // Detail View State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOverview | null>(null);
  
  // Copy State
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Action Modals State
  const [actionCustomer, setActionCustomer] = useState<CustomerOverview | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  // Input States for Actions
  const [orderAmount, setOrderAmount] = useState('');
  const [orderVolume, setOrderVolume] = useState('');
  const [orderType, setOrderType] = useState<ValidOrderType>(ValidOrderType.delivery);
  const [agentSearch, setAgentSearch] = useState('');
  const [page, setPage] = useState(1)
  const limit = 10
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackType, setFeedbackType] = useState<ValidFeedbackTypes>(ValidFeedbackTypes.complaint);
  const [enquirySubject, setEnquirySubject] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [isSubmitting,setIsSubmitting] = useState(false)
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterLocation, filterType]);
  const {data : customerDatas, isLoading : customerDataLoading, refetch : refetchCustomerData} = useCustomerOverview({
    limit,
    page,
    search : searchTerm,
    customer_location : filterLocation == "All" ? "" : filterLocation,
    customer_type : filterType == "All" ? "" : filterType
  })
  const {data : locations} = useCustomerLocations()
  const {data : users} = useUsers({
    limit,
    page,
    search : agentSearch
  })


  const [newCustomer, setNewCustomer] = useState<Partial<ICustomer>>({
    customer_name : "",
    customer_type: ValidCustomerType.b2b,
    customer_location: Location.LAGOS,
    segments: [],
  });

  const openEditCustomer = (customer: CustomerOverview) => {
    const snapshot = {
      customer_name: customer.customer_name,
      customer_email: customer.customer_email,
      customer_phone: customer.customer_phone,
      customer_type: customer.customer_type,
      customer_location: customer.customer_location,
      company_name: customer.company_name,
      segments: customer.segments || [],
      assigned_agent: customer.assigned_agent,
    };

    setIsEditing(true);
    setEditingCustomerId(customer._id);
    setOriginalCustomer(snapshot);
    setNewCustomer(snapshot);
    setShowAddCustomerModal(true);
  };

  const resetCustomerForm = () => {
    setIsEditing(false);
    setEditingCustomerId(null);
    setOriginalCustomer(null);
    setNewCustomer({
      customer_type: ValidCustomerType.b2b,
      segments: [],
      customer_location: Location.LAGOS,
    });
  };


  const handleSaveCustomer = async () => {
    try {
      setIsSubmitting(true);

      if (!newCustomer.customer_name) return;

      if (isEditing && editingCustomerId) {
        const changes = getChangedFields();

        if (Object.keys(changes).length === 0) return;

        await axiosPatch(`customers/${editingCustomerId}`, changes, true);
        toast.success("Customer updated successfully");
      } else {
        // CREATE
        await axiosPost('customers', newCustomer, true);
        toast.success("New customer added successfully");
      }

      refetchCustomerData();
      setShowAddCustomerModal(false);
      resetCustomerForm();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  const toggleSegment = (segment: CustomerSegmentType) => {
    setNewCustomer((prev) => {
      const current: CustomerSegmentType[] = prev.segments || [];
      return {
        ...prev,
        segments: current.includes(segment)
          ? current.filter((s) => s !== segment)
          : [...current, segment],
      };
    });
  };

  const handleViewDetails = (customer: CustomerOverview) => {
    setSelectedCustomer(customer);
  };
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // --- Action Handlers ---

  const openOrderModal = (e: React.MouseEvent, customer: CustomerOverview) => {
    e.stopPropagation();
    setActionCustomer(customer);
    setOrderAmount('');
    setOrderVolume('');
    setOrderType(ValidOrderType.delivery);
    setShowOrderModal(true);
  };

  const handleSaveOrder = async() => {
    try {
      setIsSubmitting(true)
      if (!actionCustomer || !orderAmount) return;
      const amount = parseFloat(orderAmount);
      await axiosPost('customers/create-order',{customer : actionCustomer._id, order_volume : orderVolume, order_amount : orderAmount, order_type : orderType}, true)
      setShowOrderModal(false);
      setActionCustomer(null);
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsSubmitting(false)
    }
  };

  const openFeedbackModal = (e: React.MouseEvent, customer: CustomerOverview) => {
    e.stopPropagation();
    setActionCustomer(customer);
    setFeedbackContent('');
    setFeedbackType(ValidFeedbackTypes.complaint);
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async() => {
    try {
      setIsSubmitting(true)
      if (!actionCustomer || !feedbackContent) return;

      const newFeedback: IFeedback = {
        customer: actionCustomer._id,
        type: feedbackType,
        content: feedbackContent,
      };
      await axiosPost(`feedbacks`,newFeedback,true)
      refetchCustomerData()
      toast.success("Feedback submitted successfully")
      setShowFeedbackModal(false);
      setActionCustomer(null);
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsSubmitting(false)
    }
  };

  const openEnquiryModal = (e: React.MouseEvent, customer: CustomerOverview) => {
    e.stopPropagation();
    setActionCustomer(customer);
    setEnquirySubject('');
    setEnquiryMessage('');
    setShowEnquiryModal(true);
  };

  const handleSaveEnquiry = async() => {
    try {
      setIsSubmitting(true)
      if (!actionCustomer || !enquiryMessage) return;

      const newEnquiry: IEnquiry = {
        customer_name: actionCustomer.customer_name,
        customer_email: actionCustomer.customer_email,
        subject: enquirySubject || 'Quick Enquiry',
        message: enquiryMessage,
        date: new Date(),
      };
      await axiosPost('enquiries',newEnquiry,true)
      refetchCustomerData()
      setShowEnquiryModal(false);
      setActionCustomer(null);
      toast.success("Customer Enquiry Saved Successfully")
    } catch (error) {
      toast.error(error.message)
    }finally{
      setIsSubmitting(false)
    }
    
  };

  // --- Logic Helpers ---

  // Logic: > 1 Order = Repeat, Else New
  const getStatus = (c: CustomerOverview) => {
    return c.total_orders > 1 ? 'Repeat' : 'New';
  };

  // Logic: Based on Spend
  const getGrade = (c: CustomerOverview) => {
    if (c.total_orders <= 1) return null; // New customers don't get a grade yet
    if (c.total_order_cost >= 500000) return 'Gold';
    if (c.total_order_cost >= 100000) return 'Silver';
    return 'Bronze';
  };

  const getGradeBadge = (grade: string | null) => {
    if (!grade) return null;
    switch(grade) {
        case 'Gold': 
            return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 border border-yellow-200"><Crown size={12} fill="currentColor" /> Gold</span>;
        case 'Silver': 
            return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200"><Award size={12} /> Silver</span>;
        case 'Bronze': 
            return <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-700 border border-orange-200"><Award size={12} /> Bronze</span>;
        default: return null;
    }
  };

  const hasChanges = React.useMemo(() => {
    if (!isEditing || !originalCustomer) return true;

    return Object.keys(newCustomer).some((key) => {
      return JSON.stringify(newCustomer[key]) !== JSON.stringify(originalCustomer[key]);
    });
  }, [newCustomer, originalCustomer, isEditing]);

  const getChangedFields = () => {
    if (!originalCustomer) return newCustomer;

    const changes: Partial<ICustomer> = {};

    Object.keys(newCustomer).forEach((key) => {
      if (
        JSON.stringify(newCustomer[key]) !==
        JSON.stringify(originalCustomer[key])
      ) {
        changes[key] = newCustomer[key];
      }
    });

    return changes;
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
           <p className="text-muted-foreground">Manage your client base, segments, and loyalty tiers.</p>
        </div>
        <button 
          onClick={() => setShowAddCustomerModal(true)}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
        >
          <Plus size={16} className="mr-2" /> Add Customer
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search customers..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
             <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background whitespace-nowrap">
                <Filter size={14} className="text-muted-foreground"/>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="bg-transparent border-none text-sm font-medium focus:outline-none capitalize"
                >
                    <option value="All">All Types</option>
                    {Object.values(ValidCustomerType).map(t => <option key={t} value={t} className="uppercase">{t}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background whitespace-nowrap">
                <MapPin size={14} className="text-muted-foreground"/>
                <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value as any)}
                    className="bg-transparent border-none text-sm font-medium focus:outline-none"
                >
                    <option value="All">All Locations</option>
                    {locations?.map((item,idx) => <option value={item} key={`${item}-${idx}`} className='capitalize'>{item}</option>)}
                </select>
             </div>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          {
            customerDataLoading ? <CustomerTableSkeleton/> : (
              <div>
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status & Grade</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type & Segments</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Orders</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {customerDatas?.data?.map((customer) => {
                      const status = getStatus(customer);
                      const grade = getGrade(customer);

                      return (
                          <tr 
                            key={customer._id} 
                            onClick={() => handleViewDetails(customer)}
                            className="border-b transition-colors hover:bg-muted/50 cursor-pointer group"
                          >
                          <td className="p-4 align-middle">
                              <div className="flex flex-col">
                              <span className="font-medium">{customer.customer_name}</span>
                              {customer.company_name && (
                                  <span className="text-xs text-muted-foreground">{customer.company_name}</span>
                              )}
                              </div>
                          </td>
                          <td className="p-4 align-middle">
                              <div className="flex flex-col gap-1 items-start">
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${status === 'Repeat' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                      {status === 'Repeat' ? <Zap size={10} fill="currentColor"/> : <Plus size={10}/>}
                                      {status}
                                  </span>
                                  {getGradeBadge(grade)}
                              </div>
                          </td>
                          <td className="p-4 align-middle">
                              <div className="flex flex-col gap-2">
                                  <span className={`inline-flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors uppercase ${customer.customer_type === ValidCustomerType.b2b ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'}`}>
                                  {customer.customer_type === ValidCustomerType.b2b ? <Building2 size={12}/> : <User size={12}/>}
                                  {customer.customer_type}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {customer.segments?.map(seg => (
                                        <span key={seg} className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            {seg}
                                        </span>
                                    ))}
                                  </div>
                              </div>
                          </td>
                          <td className="p-4 align-middle">
                              <div className="flex flex-col text-sm text-muted-foreground">
                              <span>{customer.customer_email}</span>
                              <span>{customer.customer_phone}</span>
                              <span className="inline-flex items-center gap-1 text-xs mt-1">
                                  <MapPin size={10} /> {customer.customer_location}
                              </span>
                              </div>
                          </td>
                          <td className="p-4 align-middle">
                              <div className="flex flex-col">
                                  <span className="font-medium">{customer.total_orders} orders</span>
                                  <span className="text-xs text-muted-foreground">₦{customer.total_order_cost.toLocaleString()}</span>
                              </div>
                          </td>
                          <td className="p-4 align-middle text-right">
                              <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                      onClick={(e) => openOrderModal(e, customer)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-background hover:bg-accent hover:text-accent-foreground"
                                      title="Add New Order"
                                  >
                                      <ShoppingBag size={14} />
                                  </button>
                                  <button 
                                      onClick={(e) => openFeedbackModal(e, customer)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-background hover:bg-accent hover:text-accent-foreground"
                                      title="Log Feedback"
                                  >
                                      <MessageSquarePlus size={14} />
                                  </button>
                                  <button 
                                      onClick={(e) => openEnquiryModal(e, customer)}
                                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-background hover:bg-accent hover:text-accent-foreground"
                                      title="Log Enquiry"
                                  >
                                      <FileQuestion size={14} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditCustomer(customer);
                                    }}
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-background hover:bg-accent hover:text-accent-foreground"
                                    title="Edit Customer"
                                  >
                                    <User size={14} />
                                  </button>
                              </div>
                          </td>
                          </tr>
                      );
                    })}
                    {customerDatas?.data?.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 align-middle text-center text-muted-foreground">
                          No customers found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination page={customerDatas?.meta?.page} totalPages={customerDatas?.meta?.totalPages} onPageChange={(newPage) => {
            if (newPage < 1) return;
            setPage(newPage);
          }} />
              </div>
            
            )
          }
          
        </div>
      </div>

      {/* Slide-over Detail Panel */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCustomer(null)}></div>
            <div className="w-full max-w-2xl bg-card border-l shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b flex justify-between items-start sticky top-0 bg-card z-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight">{selectedCustomer.customer_name}</h2>
                            {getGradeBadge(getGrade(selectedCustomer))}
                        </div>
                        {selectedCustomer.company_name && (
                            <p className="text-muted-foreground">{selectedCustomer.company_name}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                             {selectedCustomer.segments?.map(seg => (
                                    <span key={seg} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                                        {seg}
                                    </span>
                                ))}
                        </div>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="rounded-full p-2 hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border p-4 bg-muted/20">
                            <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                            <p className="text-2xl font-bold">₦{selectedCustomer.total_order_cost.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border p-4 bg-muted/20">
                            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                            <p className="text-2xl font-bold">{selectedCustomer.total_orders}</p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User size={18} /> Contact Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 group p-1.5 -ml-1.5 rounded hover:bg-muted/50 transition-colors">
                                <Mail size={14} className="text-muted-foreground shrink-0"/>
                                <span className="truncate flex-1">{selectedCustomer.customer_email}</span>
                                <button 
                                    onClick={() => copyToClipboard(selectedCustomer.customer_email, 'email')}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                                    title="Copy Email"
                                >
                                    {copiedField === 'email' ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 group p-1.5 -ml-1.5 rounded hover:bg-muted/50 transition-colors">
                                <Phone size={14} className="text-muted-foreground shrink-0"/>
                                <span className="truncate flex-1">{selectedCustomer.customer_phone}</span>
                                <button 
                                    onClick={() => copyToClipboard(selectedCustomer.customer_phone, 'phone')}
                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                                    title="Copy Phone"
                                >
                                    {copiedField === 'phone' ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                                </button>
                            </div>
                            <div className="flex items-center gap-2 p-1.5 -ml-1.5">
                                <MapPin size={14} className="text-muted-foreground"/>
                                <span>{selectedCustomer.customer_location}</span>
                            </div>
                            <div className="flex items-center gap-2 p-1.5 -ml-1.5">
                                <Calendar size={14} className="text-muted-foreground"/>
                                <span>Joined {new Date(selectedCustomer.createdAt).toISOString()}</span>
                            </div>
                             {selectedCustomer.added_by && (
                                <div className="flex items-center gap-2 p-1.5 -ml-1.5 col-span-full">
                                    <Briefcase size={14} className="text-muted-foreground"/>
                                    <span>Added by: <span className="font-medium">{selectedCustomer.added_by}</span></span>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-t" />

                    {/* Interaction History Tabs */}
                    <div className="space-y-6">
                        {/* Feedback History */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <MessageSquare size={18} /> Feedback History
                            </h3>
                            {selectedCustomer?.feedbacks?.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedCustomer?.feedbacks?.map((item, idx) => (
                                        <div key={idx} className="rounded-md border p-3 text-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium capitalize ${item.type === ValidFeedbackTypes.complaint ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {item.type}
                                                </span>
                                                <span className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-muted-foreground">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No feedback recorded.</p>
                            )}
                        </div>

                        {/* Enquiries */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Mail size={18} /> Recent Enquiries
                            </h3>
                            {selectedCustomer?.recent_enquiries?.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedCustomer?.recent_enquiries?.map((item, idx) => (
                                        <div key={idx} className="rounded-md border p-3 text-sm">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-medium">{item.subject}</span>
                                                <span className="text-muted-foreground text-xs">{new Date(item.date).toLocaleString()}</span>
                                            </div>
                                            <p className="text-muted-foreground truncate">{item.subject}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No enquiries found.</p>
                            )}
                        </div>

                        {/* Compensations */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <RefreshCw size={18} /> Compensations
                            </h3>
                            {selectedCustomer?.compensations?.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedCustomer?.compensations?.map((item,idx) => (
                                        <div key={idx} className="rounded-md border p-3 text-sm flex justify-between items-center">
                                            <div>
                                                <p className="font-medium">{item.reason}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-destructive">-₦{item.value.toLocaleString()}</p>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{item.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No compensations recorded.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Action Modals --- */}
      
      {/* New Order Modal */}
      {showOrderModal && actionCustomer && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-lg font-semibold mb-1">New Order</h2>
                <p className="text-sm text-muted-foreground mb-4">Record a new order for {actionCustomer.customer_name}.</p>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Order Volume</label>
                            <div className="relative mt-1">
                                <Package size={14} className="absolute left-2.5 top-3 text-muted-foreground"/>
                                <input 
                                    type="number" 
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Qty"
                                    value={orderVolume}
                                    onChange={(e) => setOrderVolume(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Order Amount (₦)</label>
                            <div className="relative mt-1">
                                <DollarSign size={14} className="absolute left-2.5 top-3 text-muted-foreground"/>
                                <input 
                                    type="number" 
                                    autoFocus
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-8 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="0.00"
                                    value={orderAmount}
                                    onChange={(e) => setOrderAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium">Order Type</label>
                        <div className="flex gap-2 mt-1">
                            <button
                                onClick={() => setOrderType(ValidOrderType.delivery)}
                                className={`flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium px-2.5 py-2.5 transition-colors border ${orderType === ValidOrderType.delivery ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-transparent hover:bg-accent hover:text-accent-foreground'}`}
                            >
                                <Truck size={14} className="mr-2" /> Delivery
                            </button>
                            <button
                                onClick={() => setOrderType(ValidOrderType.pickup)}
                                className={`flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium px-2.5 py-2.5 transition-colors border ${orderType === ValidOrderType.pickup ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-transparent hover:bg-accent hover:text-accent-foreground'}`}
                            >
                                <Store size={14} className="mr-2" /> Pickup
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                         <button disabled={isSubmitting} onClick={() => setShowOrderModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent h-9 px-4 py-2">Cancel</button>
                         <button disabled={isSubmitting} onClick={handleSaveOrder} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">Save Order</button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Quick Feedback Modal */}
      {showFeedbackModal && actionCustomer && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-lg font-semibold mb-1">Quick Feedback</h2>
                <p className="text-sm text-muted-foreground mb-4">Log feedback from {actionCustomer.customer_name}.</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Type</label>
                        <div className="flex gap-2 mt-1">
                            {Object.values(ValidFeedbackTypes).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setFeedbackType(t)}
                                    className={`flex-1 text-xs border rounded-md py-1.5 capitalize ${feedbackType === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground'}`}
                                >
                                  {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Content</label>
                        <textarea 
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24 resize-none mt-1"
                            placeholder="What did they say?"
                            value={feedbackContent}
                            onChange={(e) => setFeedbackContent(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                         <button disabled={isSubmitting} onClick={() => setShowFeedbackModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent h-9 px-4 py-2">Cancel</button>
                         <button disabled={isSubmitting} onClick={handleSaveFeedback} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">Save Feedback</button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Quick Enquiry Modal */}
      {showEnquiryModal && actionCustomer && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-lg font-semibold mb-1">Quick Enquiry</h2>
                <p className="text-sm text-muted-foreground mb-4">Log enquiry from {actionCustomer.customer_name}.</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Subject</label>
                        <input 
                            type="text"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-1"
                            placeholder="e.g. Price Check"
                            value={enquirySubject}
                            onChange={(e) => setEnquirySubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Message</label>
                        <textarea 
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-24 resize-none mt-1"
                            placeholder="What do they need?"
                            value={enquiryMessage}
                            onChange={(e) => setEnquiryMessage(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                         <button disabled={isSubmitting} onClick={() => setShowEnquiryModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent h-9 px-4 py-2">Cancel</button>
                         <button disabled={isSubmitting} onClick={handleSaveEnquiry} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">Save Enquiry</button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {isEditing ? "Edit Customer" : "Add New Customer"}
              </h2>
              <p className="text-sm text-muted-foreground">Enter customer details below.</p>
            </div>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="radio" className="accent-primary h-4 w-4" checked={newCustomer.customer_type === ValidCustomerType.b2c} onChange={() => setNewCustomer({...newCustomer, customer_type: ValidCustomerType.b2c})} />
                    B2C (Individual)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="radio" className="accent-primary h-4 w-4" checked={newCustomer.customer_type === ValidCustomerType.b2b} onChange={() => setNewCustomer({...newCustomer, customer_type: ValidCustomerType.b2b})} />
                    B2B (Business)
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Name</label>
                <input 
                  type="text" 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newCustomer.customer_name || ''} 
                  onChange={e => setNewCustomer({...newCustomer, customer_name: e.target.value})}
                />
              </div>

              {newCustomer.customer_type === ValidCustomerType.b2b && (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Company Name</label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newCustomer.company_name || ''} 
                    onChange={e => setNewCustomer({...newCustomer, company_name: e.target.value})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Email</label>
                  <input 
                    type="email" 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newCustomer.customer_email || ''} 
                    onChange={e => setNewCustomer({...newCustomer, customer_email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Phone</label>
                  <input 
                    type="text" 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newCustomer.customer_phone || ''} 
                    onChange={e => setNewCustomer({...newCustomer, customer_phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Location</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newCustomer.customer_location || Location.LAGOS} 
                  onChange={e => setNewCustomer({...newCustomer, customer_location: e.target.value as Location})}
                >
                  <option value={Location.LAGOS}>Lagos</option>
                  <option value={Location.IFE}>Ife</option>
                </select>
              </div>

              {user.role === ValidUserRole.admin && <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Assigned Agent (Attribution)</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={newCustomer.assigned_agent || ''} 
                  onChange={e => {
                    console.log(e.target.value)
                    setNewCustomer({...newCustomer, assigned_agent: e.target.value})}}
                >
                  <option value="">-- Select Agent --</option>
                  {users?.users?.map(a => <option key={a._id} value={a._id}>{a.full_name}</option>)}
                </select>
              </div>}

              {!isEditing && <div className="grid grid-cols-2 gap-4 border-t pt-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Initial Orders</label>
                    <input 
                        type="number" 
                        min="0"
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={newCustomer.order_volume} 
                        onChange={e => setNewCustomer({...newCustomer, order_volume: parseInt(e.target.value)})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Total Spent (₦)</label>
                    <input 
                        type="number" 
                        min="0"
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={newCustomer.order_amount} 
                        onChange={e => setNewCustomer({...newCustomer, order_amount: parseInt(e.target.value)})}
                    />
                 </div>
              </div>}              {
                (!!newCustomer.order_volume || !!newCustomer.order_volume) &&
                <div className='border-t pt-4'>
                  <label className="text-sm font-medium">Order Type</label>
                  <div className="grid grid-cols-2 gap-4 ">
                  
                    <div className="flex gap-2 mt-1">
                      <button
                            onClick={() => setNewCustomer({...newCustomer, order_type: ValidOrderType.delivery})}
                            className={`flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium px-2.5 py-2.5 transition-colors border ${newCustomer.order_type === ValidOrderType.delivery ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-transparent hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            <Truck size={14} className="mr-2" /> Delivery
                      </button>
                      <button
                        onClick={() => setNewCustomer({...newCustomer, order_type: ValidOrderType.pickup})}
                        className={`flex-1 inline-flex items-center justify-center rounded-md text-xs font-medium px-2.5 py-2.5 transition-colors border ${newCustomer.order_type === ValidOrderType.pickup ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-transparent hover:bg-accent hover:text-accent-foreground'}`}
                      >
                        <Store size={14} className="mr-2" /> Pickup
                      </button>
                    </div>
                  </div>
                </div>
                
              }

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Segments</label>
                <div className="grid grid-cols-2 gap-2">
                    {CustomerSegment?.map(seg => (
                        <label key={seg} className="flex items-center space-x-2 rounded-md border p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={newCustomer.segments?.includes(seg)}
                                onChange={() => toggleSegment(seg)}
                                className="h-4 w-4 accent-primary rounded border-gray-300"
                            />
                            <span className="text-sm font-medium leading-none">{seg}</span>
                        </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                disabled={isSubmitting} 
                onClick={() => {
                  setShowAddCustomerModal(false);
                  resetCustomerForm();
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting || (isEditing && !hasChanges)}
                onClick={handleSaveCustomer}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                {isEditing ? "Update Customer" : "Save Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;


export function CustomerTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table className="w-full caption-bottom text-sm">
      <thead className="[&_tr]:border-b">
        <tr>
          <th className="h-12 px-4 text-left">Customer</th>
          <th className="h-12 px-4 text-left">Status & Grade</th>
          <th className="h-12 px-4 text-left">Type & Segments</th>
          <th className="h-12 px-4 text-left">Contact</th>
          <th className="h-12 px-4 text-left">Orders</th>
          <th className="h-12 px-4 text-right">Quick Actions</th>
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b">
            {/* Customer */}
            <td className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </td>

            {/* Status & Grade */}
            <td className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </td>

            {/* Type & Segments */}
            <td className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </div>
            </td>

            {/* Contact */}
            <td className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </td>

            {/* Orders */}
            <td className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </td>

            {/* Actions */}
            <td className="p-4">
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
