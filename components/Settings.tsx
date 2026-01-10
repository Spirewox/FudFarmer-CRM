
import React, { useState, useEffect } from 'react';
import { IUser, useAuth, ValidUserRole } from '../contexts/AuthContext';
import { Location, Agent } from '../types';
import { StorageService } from '../services/storageService';
import { Save, User, Lock, Moon, Sun, Trash2, AlertTriangle, CheckCircle2, Users, Plus, X, Pencil } from 'lucide-react';
import { useUsers } from '@/hooks/useQueries';
import { axiosDelete, axiosPost } from '@/lib/api';
import { toast } from 'react-toastify';

const Settings: React.FC = () => {
  const { user } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'Profile' | 'Users' | 'Preferences' | 'Data'>('Profile');

  // Profile State
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState<string>(user?.location || Location.LAGOS);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<IUser>>({
    role: ValidUserRole.sales_agent,
    location: Location.LAGOS
  });

  const {data : agents, isLoading : agentsLoading, refetch : refetchAgents} = useUsers({
    page : 1,
    limit : 100
  })

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setMessage('Passwords do not match or are empty.');
      return;
    }

    setLoading(true);
    try {

        await axiosPost('auth/reset-password',{currentPassword, newPassword},true)
      setMessage('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
        toast.error(error.message)
      setMessage('Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fudfarmer_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fudfarmer_theme', 'light');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure? This will erase all your leads, customers, and records and restore default data. This cannot be undone.')) {
        StorageService.resetData();
    }
  };

  // User Management Logic
  const handleEditUserClick = (agent: IUser) => {
      setEditingUser(agent);
      setShowUserModal(true);
  };

  const handleAddNewUserClick = () => {
      setEditingUser({ role: ValidUserRole.sales_agent, location: Location.LAGOS });
      setShowUserModal(true);
  };

  const handleDeleteUser = async (agentId: string) => {
    try {
        if (agentId === user?._id) {
          alert("You cannot delete your own account.");
          return;
      }
      if (confirm("Are you sure you want to delete this user?")) {
        await axiosDelete(`users/${agentId}/`,true)
        toast.success("Agent deleted successfully")
      }
    } catch (error) {
        toast.error(error.message)
    }finally{

    }
  };

  const handleSaveUser = async() => {
    setIsSubmitting(true)
    try {
        if (!editingUser.full_name || !editingUser.email) return;

      if (editingUser._id) {
          // Edit existing
          
      } else {
        await axiosPost('users/create',editingUser,true)
        
      }
      toast.success("Agent added successfully")
      refetchAgents()
      setShowUserModal(false);
      setEditingUser({ role: ValidUserRole.sales_agent, location: Location.LAGOS });
    } catch (error) {
        toast.error(error.message)
    }finally{
        setIsSubmitting(false)
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, preferences, and system data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation for Settings */}
        <aside className="w-full md:w-64 space-y-2">
            <button
                onClick={() => setActiveTab('Profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'Profile' 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
                <User size={18} />
                <span>Profile</span>
            </button>
            
            {user?.role === ValidUserRole.admin && (
                <button
                    onClick={() => setActiveTab('Users')}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'Users' 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                >
                    <Users size={18} />
                    <span>Users</span>
                </button>
            )}

            <button
                onClick={() => setActiveTab('Preferences')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'Preferences' 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
                <Moon size={18} />
                <span>Preferences</span>
            </button>

            {/* <button
                onClick={() => setActiveTab('Data')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'Data' 
                    ? 'bg-secondary text-secondary-foreground' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
                <Trash2 size={18} />
                <span>Data</span>
            </button> */}
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
            
            {message && (
                <div className={`p-3 rounded-md text-sm font-medium flex items-center gap-2 ${message.includes('Failed') || message.includes('match') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.includes('Failed') ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
                    {message}
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'Profile' && (
                <div className="space-y-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="font-semibold text-lg">Personal Information</h3>
                            <p className="text-sm text-muted-foreground">Update your contact details.</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input type="text" disabled value={name} onChange={e => setName(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <input type="email" readOnly value={email} onChange={e => setEmail(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone</label>
                                        <input type="text" disabled value={phone} onChange={e => setPhone(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Location</label>
                                        <select value={location} disabled onChange={e => setLocation(e.target.value as Location)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                            <option value={Location.LAGOS}>Lagos</option>
                                            <option value={Location.IFE}>Ife</option>
                                        </select>
                                    </div>
                                </div>
                                {/* <div className="pt-2">
                                    <button disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                                        <Save size={16} className="mr-2" /> Save Changes
                                    </button>
                                </div> */}
                            </form>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="font-semibold text-lg">Security</h3>
                            <p className="text-sm text-muted-foreground">Change your login password.</p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <button disabled={loading} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent h-9 px-4 py-2">
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab (Admin Only) */}
            {activeTab === 'Users' && user?.role === ValidUserRole.admin && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                             <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
                             <p className="text-muted-foreground">Manage user accounts and permissions.</p>
                        </div>
                        <button 
                            onClick={handleAddNewUserClick}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                        >
                            <Plus size={16} className="mr-2" /> Add User
                        </button>
                    </div>

                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {agents?.users?.map((agent) => (
                                        <tr key={agent._id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-medium flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                                                    {agent.full_name.charAt(0)}
                                                </div>
                                                {agent.full_name} {agent._id === user._id && <span className="text-xs text-muted-foreground">(You)</span>}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${
                                                    agent.role === ValidUserRole.admin 
                                                    ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80' 
                                                    : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                }`}>
                                                    {agent.role}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">{agent.email}</td>
                                            <td className="p-4 align-middle">{agent.location}</td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* <button 
                                                        onClick={() => handleEditUserClick(agent)}
                                                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground"
                                                        title="Edit User"
                                                    >
                                                        <Pencil size={14} />
                                                    </button> */}
                                                    {agent._id !== user._id && (
                                                        <button 
                                                            onClick={() => handleDeleteUser(agent._id)}
                                                            className="h-8 w-8 inline-flex items-center justify-center rounded-md border bg-transparent hover:bg-red-50 text-muted-foreground hover:text-red-600 border-input"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'Preferences' && (
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 border-b">
                        <h3 className="font-semibold text-lg">Appearance</h3>
                        <p className="text-sm text-muted-foreground">Customize how the app looks on your device.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-base font-medium">Dark Mode</label>
                                <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
                            </div>
                            <button 
                                onClick={toggleDarkMode}
                                className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${darkMode ? 'bg-primary' : 'bg-input'}`}
                            >
                                <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'} flex items-center justify-center`}>
                                    {darkMode ? <Moon size={12} /> : <Sun size={12} />}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Tab */}
            {activeTab === 'Data' && (
                 <div className="rounded-lg border border-red-200 bg-red-50/50 text-card-foreground shadow-sm">
                    <div className="p-6 border-b border-red-200">
                        <h3 className="font-semibold text-lg text-red-900">Danger Zone</h3>
                        <p className="text-sm text-red-700">Irreversible actions regarding your data.</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-base font-medium text-red-900">Reset Application Data</label>
                                <p className="text-sm text-red-700 max-w-sm">This will clear all local leads, customers, feedback logs, and tasks. The app will revert to its initial demo state.</p>
                            </div>
                            <button onClick={handleReset} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 h-9 px-4 py-2">
                                <Trash2 size={16} className="mr-2"/> Reset All Data
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>

      {/* User Management Modal */}
      {showUserModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg sm:rounded-lg animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold leading-none tracking-tight">{editingUser._id ? 'Edit User' : 'Add New User'}</h2>
                      <button onClick={() => setShowUserModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">Full Name</label>
                          <input type="text" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">Email</label>
                          <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-sm font-medium leading-none">Phone</label>
                          <input type="text" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="080..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-sm font-medium leading-none">Role</label>
                              <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as any})} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize">
                                {Object.values(ValidUserRole).map(t => <option className="capitalize" key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-medium leading-none">Location</label>
                              <select value={editingUser.location} onChange={e => setEditingUser({...editingUser, location: e.target.value as any})} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                  <option value="Lagos">Lagos</option>
                                  <option value="Ife">Ife</option>
                              </select>
                          </div>
                      </div>
                      {/* {!editingUser._id && (
                        <div className="space-y-2">
                             <label className="text-sm font-medium leading-none">Password</label>
                             <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Set initial password" />
                        </div>
                      )} */}
                      <div className="flex justify-end pt-2 gap-3">
                          <button disabled={isSubmitting} onClick={() => setShowUserModal(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent hover:bg-accent h-9 px-4 py-2">Cancel</button>
                          <button disabled={isSubmitting} onClick={handleSaveUser} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">Save User</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
