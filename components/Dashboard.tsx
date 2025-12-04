import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, AlertTriangle, Wallet, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeLeads: 0,
    pendingComplaints: 0,
    projectedRevenue: 0,
  });
  const [locationData, setLocationData] = useState<any[]>([]);
  const [feedbackData, setFeedbackData] = useState<any[]>([]);

  useEffect(() => {
    const customers = StorageService.getCustomers();
    const leads = StorageService.getLeads();
    const feedback = StorageService.getFeedback();

    const activeLeads = leads.filter(l => l.status !== 'Closed Lost' && l.status !== 'Closed Won');
    const revenue = activeLeads.reduce((acc, curr) => acc + curr.potentialValue, 0);
    const complaints = feedback.filter(f => f.type === 'Complaint' && f.status === 'Open');

    setStats({
      totalCustomers: customers.length,
      activeLeads: activeLeads.length,
      pendingComplaints: complaints.length,
      projectedRevenue: revenue,
    });

    const lagosCust = customers.filter(c => c.location === 'Lagos').length;
    const ifeCust = customers.filter(c => c.location === 'Ife').length;
    setLocationData([
      { name: 'Lagos', customers: lagosCust },
      { name: 'Ife', customers: ifeCust },
    ]);

    const sentimentCounts = feedback.reduce((acc: any, curr) => {
      const type = curr.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    setFeedbackData([
      { name: 'Complaints', value: sentimentCounts['Complaint'] || 0 },
      { name: 'Suggestions', value: sentimentCounts['Suggestion'] || 0 },
      { name: 'Appreciation', value: sentimentCounts['Appreciation'] || 0 },
    ]);

  }, []);

  const COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of FudFarmer operations.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Customers", value: stats.totalCustomers, icon: <Users className="h-4 w-4 text-muted-foreground" /> },
          { title: "Active Leads", value: stats.activeLeads, icon: <TrendingUp className="h-4 w-4 text-muted-foreground" /> },
          { title: "Pipeline Value", value: `₦${stats.projectedRevenue.toLocaleString()}`, icon: <Wallet className="h-4 w-4 text-muted-foreground" /> },
          { title: "Open Complaints", value: stats.pendingComplaints, icon: <AlertTriangle className="h-4 w-4 text-muted-foreground" /> },
        ].map((item, idx) => (
          <div key={idx} className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">{item.title}</h3>
              {item.icon}
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Customers by Location</h3>
          </div>
          <div className="p-6 pt-0 pl-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} allowDecimals={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}} 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Bar dataKey="customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Feedback Breakdown</h3>
          </div>
          <div className="p-6 pt-0 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feedbackData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="hsl(var(--card))"
                  strokeWidth={2}
                >
                  {feedbackData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                   itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;