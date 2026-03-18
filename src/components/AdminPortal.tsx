import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import { 
  HiSquares2X2 as LayoutDashboard, 
  HiUsers as Users, 
  HiTicket as Ticket, 
  HiDocumentText as FileText, 
  HiMapPin as MapPin, 
  HiCheckCircle as CheckCircle2, 
  HiWrenchScrewdriver as HardHat,
  HiBriefcase as Briefcase, 
  HiCreditCard as CreditCard, 
  HiChartBar as BarChart3, 
  HiPlusCircle as PlusSquare, 
  HiChatBubbleLeftRight as MessageSquare, 
  HiCog6Tooth as Settings,
  HiArrowLeftOnRectangle as LogOut,
  HiBars3 as Menu,
  HiXMark as X,
  HiChevronRight as ChevronRight,
  HiMagnifyingGlass as Search,
  HiBell as Bell,
  HiUser as User,
  HiFunnel as Filter,
  HiEllipsisVertical as MoreVertical,
  HiArrowUpRight as ArrowUpRight,
  HiArrowDownRight as ArrowDownRight,
  HiClock as Clock,
  HiCurrencyDollar as DollarSign,
  HiStar as Star,
  HiPaperAirplane as Send,
  HiHeart as Heart,
  HiChatBubbleOvalLeft as MessageCircle,
  HiShare as Share2,
  HiArrowPath as Loader2,
  HiPhoto as ImageIcon,
  HiPlay as Play,
  HiCamera as Camera,
  HiLockClosed as Lock,
  HiEye as Eye,
  HiEyeSlash as EyeOff,
  HiExclamationCircle as AlertCircle,
  HiCheckCircle as CheckCircle,
  HiGlobeAlt as Globe,
  HiEnvelope as Mail,
  HiPhone as Phone,
  HiCodeBracket as Code,
  HiPaperClip as PaperClip,
  HiArrowLeft
} from 'react-icons/hi2';
import Logo from './Logo';
import LogoutConfirmModal from './LogoutConfirmModal';
import MessagingSystem from './MessagingSystem';
import ActivityFeed from './ActivityFeed';
import QuotationPortal from './QuotationPortal';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  auth,
  db,
  collection, 
  onSnapshot, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  query, 
  where,
  orderBy, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  setDoc,
  doc,
  deleteDoc,
  limit,
  handleFirestoreError,
  OperationType
} from '../firebase';
// import { 
//   collection, 
//   onSnapshot, 
//   query, 
//   orderBy, 
//   addDoc, 
//   serverTimestamp,
//   updateDoc,
//   setDoc,
//   doc,
//   deleteDoc,
//   limit
// } from 'firebase/firestore';

import TicketDetailView from './TicketDetailView';

interface AdminPortalProps {
  onLogout: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ onLogout }) => {
  const { t, language } = useLanguage();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('desklink_admin_activeTab') || 'Dashboard');
  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsFirebaseAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('desklink_admin_activeTab', activeTab);
  }, [activeTab]);
  const [activeUserSubTab, setActiveUserSubTab] = useState('Clients');
  const [activeTicketSubTab, setActiveTicketSubTab] = useState('Pending');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedEngineer, setSelectedEngineer] = useState<any>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [openUserMenuId, setOpenUserMenuId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'client',
    status: 'Active'
  });
  const [newUpdateText, setNewUpdateText] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteCurrency, setQuoteCurrency] = useState('USD');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [isAssigningEngineer, setIsAssigningEngineer] = useState(false);
  const [assignData, setAssignData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    locationFrom: '',
    phone: '',
    attachments: [] as { name: string, type: string, data: string }[]
  });

  // Firestore Data State
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);

  useEffect(() => {
    if (!isFirebaseAuthenticated) return;

    const unsubTickets = onSnapshot(query(collection(db, "tickets"), orderBy("createdAt", "desc")), (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "tickets"));

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "users"));

    const unsubClients = onSnapshot(collection(db, "clients"), (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "clients"));

    const unsubJobs = onSnapshot(query(collection(db, "jobs"), orderBy("completedAt", "desc")), (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "jobs"));

    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc")), (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "posts"));

    const unsubMessages = onSnapshot(query(collection(db, "messages"), orderBy("timestamp", "asc")), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "messages"));

    const unsubInvoices = onSnapshot(query(collection(db, "invoices"), orderBy("createdAt", "desc")), (snapshot: any) => {
      setInvoices(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, "invoices"));

    const unsubQuotations = onSnapshot(query(collection(db, "quotations"), orderBy("createdAt", "desc")), (snapshot: any) => {
      setQuotations(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, "quotations"));

    return () => {
      unsubTickets();
      unsubUsers();
      unsubClients();
      unsubJobs();
      unsubPosts();
      unsubMessages();
      unsubInvoices();
      unsubQuotations();
    };
  }, [isFirebaseAuthenticated]);

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('All');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('All');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState('All');

  // Settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const newTicketsCount = tickets.filter(t => t.status === 'Pending').length;
  const newQuotationsCount = quotations.filter(q => q.status === 'Draft').length;

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", "admin_desklink"),
      where("unread", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessagesCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const menuItems = [
    { id: 'Dashboard', icon: LayoutDashboard },
    { id: 'Manage Users', icon: Users },
    { id: 'Tickets', icon: Ticket, badge: newTicketsCount },
    { id: 'Completed Jobs', icon: CheckCircle2 },
    { id: 'Billing & Invoices', icon: CreditCard },
    { id: 'Quotations', icon: FileText, badge: newQuotationsCount },
    { id: 'Post News', icon: PlusSquare },
    { id: 'Messages', icon: MessageSquare },
    { id: 'Settings', icon: Settings },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportReport = () => {
    const completedTickets = tickets.filter(t => t.status === 'Completed');
    if (completedTickets.length === 0) {
      addNotification({
        title: 'Export Failed',
        message: 'No completed jobs found to export.',
        type: 'error'
      });
      return;
    }

    // CSV Headers
    const headers = ['Job ID', 'Subject', 'Client', 'Engineer', 'Type', 'Completed Date'];
    
    // CSV Rows
    const rows = completedTickets.map(job => {
      const jobId = `JB-${job.id.slice(0, 4).toUpperCase()}`;
      const subject = `"${(job.subject || '').replace(/"/g, '""')}"`;
      const client = `"${(job.clientName || '').replace(/"/g, '""')}"`;
      const engineer = `"${(job.engineerName || 'N/A').replace(/"/g, '""')}"`;
      const type = `"${(job.serviceType || 'N/A').replace(/"/g, '""')}"`;
      const completedDate = job.updatedAt ? new Date(job.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A';
      
      return [jobId, subject, client, engineer, type, completedDate].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DeskLink_Completed_Jobs_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification({
      title: 'Export Successful',
      message: 'Completed jobs report has been downloaded.',
      type: 'success'
    });
  };

  const handlePost = async () => {
    if (!newPostContent.trim() || !newPostTitle.trim()) return;
    try {
      await addDoc(collection(db, "posts"), {
        title: newPostTitle,
        author: 'Admin',
        content: newPostContent,
        imageUrl: newPostImage,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0
      });
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostImage(null);
      addNotification({
        type: 'success',
        title: 'News Shared',
        message: 'News post shared successfully!'
      });
    } catch (error) {
      console.error("Error adding post:", error);
      addNotification({
        type: 'error',
        title: 'Post Failed',
        message: 'Failed to share post.'
      });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // If adding staff or admin, we need to create an auth account
      if (newUser.role === 'staff' || newUser.role === 'admin') {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            newUser.email, 
            newUser.password || 'DeskLink2024!' // Default password if none provided
          );
          
          const userRef = doc(db, "users", userCredential.user.uid);
          await setDoc(userRef, {
            uid: userCredential.user.uid,
            displayName: newUser.username,
            email: newUser.email,
            role: newUser.role.toLowerCase(),
            status: newUser.status,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          console.error("Error creating auth account:", err);
          throw err;
        }
      } else {
        const userRef = doc(collection(db, "users"));
        const userData = {
          uid: userRef.id,
          displayName: newUser.username,
          email: newUser.email,
          role: newUser.role.toLowerCase(),
          status: newUser.status,
          createdAt: serverTimestamp()
        };
        
        await setDoc(userRef, userData);
      }

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'user_added',
          title: 'New User Added',
          description: `Admin added a new ${newUser.role}: ${newUser.username}`,
          userId: 'admin_desklink',
          userName: 'Admin',
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }
      
      setShowAddUserModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'client', status: 'Active' });
      addNotification({
        type: 'success',
        title: 'User Added',
        message: `${newUser.role} added successfully!`
      });
    } catch (error: any) {
      console.error("Error adding user:", error);
      addNotification({
        type: 'error',
        title: 'Add Failed',
        message: error.message || 'Failed to add user.'
      });
    }
  };

  const handleToggleOnSite = async (ticketId: string, currentStatus: boolean) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      const isQuoteAccepted = ticket?.quote?.status === 'Accepted' || ticket?.status === 'Quote Accepted' || ticket?.status === 'In Progress';
      const newOnSiteStatus = !currentStatus;
      
      await updateDoc(doc(db, "tickets", ticketId), {
        isOnSite: newOnSiteStatus,
        status: newOnSiteStatus ? 'On Site' : (isQuoteAccepted ? 'In Progress' : 'Assigned'),
        updatedAt: serverTimestamp(),
        updates: [
          ...(ticket?.updates || []),
          { 
            text: `Engineer is now ${newOnSiteStatus ? 'ON SITE' : 'OFF SITE'}.`, 
            timestamp: new Date().toISOString(),
            author: 'Admin'
          }
        ]
      });
      
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Engineer is now ${newOnSiteStatus ? 'on site' : 'off site'}.`
      });
      
      // Update local state if needed
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ 
          ...selectedTicket, 
          isOnSite: newOnSiteStatus,
          status: newOnSiteStatus ? 'On Site' : (isQuoteAccepted ? 'In Progress' : 'Assigned')
        });
      }
    } catch (error) {
      console.error("Error toggling on-site status:", error);
    }
  };

  const handleAddUpdate = async (ticketId: string) => {
    if (!newUpdateText.trim()) return;
    setIsAddingUpdate(true);
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      const currentUpdates = selectedTicket.updates || [];
      const newUpdate = {
        text: newUpdateText,
        timestamp: new Date().toISOString(),
        author: 'Admin'
      };
      
      await updateDoc(ticketRef, {
        updates: [...currentUpdates, newUpdate],
        updatedAt: serverTimestamp()
      });
      
      setNewUpdateText('');
      addNotification({
        type: 'success',
        title: 'Update Sent',
        message: 'Client has been notified of the update.'
      });
      
      // Update local state
      setSelectedTicket({ 
        ...selectedTicket, 
        updates: [...currentUpdates, newUpdate] 
      });
    } catch (error) {
      console.error("Error adding update:", error);
    } finally {
      setIsAddingUpdate(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      setSettingsStatus({ type: 'error', message: 'Please enter a new password.' });
      return;
    }

    setIsSavingSettings(true);
    setSettingsStatus(null);

    try {
      // In a real app, we'd check the current password against Firestore
      // For this demo, we'll update the admin password in a settings document
      await setDoc(doc(db, "settings", "admin_config"), {
        adminPassword: newPassword,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSettingsStatus({ type: 'success', message: 'Admin password updated successfully!' });
      setNewPassword('');
      setCurrentPassword('');
    } catch (error) {
      console.error("Error updating settings:", error);
      setSettingsStatus({ type: 'error', message: 'Failed to update settings. Please try again.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'ticket_status_update',
          title: 'Ticket Status Updated',
          description: `Ticket #${ticketId.substring(0, 6)} status changed to ${newStatus}`,
          userId: 'admin_desklink',
          userName: 'Admin',
          targetUserId: tickets.find(t => t.id === ticketId)?.clientId,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }
      
      const ticket = tickets.find(t => t.id === ticketId);
      
      // Notify client
      if (ticket?.clientId) {
        await addNotification({
          type: 'ticket',
          title: 'Ticket Status Updated',
          message: `Your ticket #${ticketId.substring(0, 6)} status changed to ${newStatus}`,
          link: `/tickets/${ticketId}`
        }, ticket.clientId);
      }

      // Notify engineer if assigned
      if (ticket?.assignedEngineerId) {
        await addNotification({
          type: 'ticket',
          title: 'Ticket Status Updated',
          message: `Ticket #${ticketId.substring(0, 6)} status changed to ${newStatus}`,
          link: `/tickets/${ticketId}`
        }, ticket.assignedEngineerId);
      }

      if (newStatus === 'Completed') {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 3000);
      } else {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Ticket ${newStatus.toLowerCase()} successfully!`
        });
      }
      
      setShowTicketModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update ticket status.'
      });
    }
  };

  const handleGiveQuote = async (ticketId: string) => {
    if (!quoteAmount.trim()) return;
    setIsSubmittingQuote(true);
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      
      await updateDoc(doc(db, "tickets", ticketId), {
        quote: {
          amount: quoteAmount,
          description: quoteDescription,
          currency: quoteCurrency,
          status: 'Quoted',
          createdAt: new Date().toISOString()
        },
        status: 'Waiting for client approval',
        updatedAt: serverTimestamp()
      });

      // Also create a separate quotation record for the Quotation Portal
        await addDoc(collection(db, "quotations"), {
          clientName: (ticket?.clientName && ticket?.clientName !== 'Unknown Client') ? ticket.clientName : (ticket?.clientEmail || 'Unknown Client'),
          clientUid: ticket?.clientUid || '',
          project: `Ticket Quote: ${ticket?.subject || 'Service'}`,
          description: quoteDescription || ticket?.description || '',
          amount: quoteAmount,
          currency: quoteCurrency,
          status: 'Sent',
          ticketId: ticketId,
          createdAt: serverTimestamp()
        });

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'ticket_quoted',
          title: 'Ticket Quoted',
          description: `Admin provided a quote for Ticket #${ticketId.substring(0, 6)}`,
          userId: 'admin_desklink',
          userName: 'Admin',
          targetUserId: tickets.find(t => t.id === ticketId)?.clientId,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }

      addNotification({
        type: 'success',
        title: 'Quote Sent',
        message: 'The quotation has been sent to the client for approval.'
      });

      setQuoteAmount('');
      setQuoteDescription('');
      setShowTicketModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error giving quote:", error);
      addNotification({
        type: 'error',
        title: 'Quote Failed',
        message: 'Failed to send quotation.'
      });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAssignData(prev => ({
            ...prev,
            attachments: [...prev.attachments, {
              name: file.name,
              type: file.type,
              data: reader.result as string
            }]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAssignEngineer = async () => {
    if (!assignData.firstName || !assignData.lastName || !assignData.email) {
      addNotification({
        type: 'error',
        title: 'Missing Info',
        message: 'Please fill in required engineer details.'
      });
      return;
    }
    
    setIsAssigningEngineer(true);
    try {
      const isQuoteAccepted = selectedTicket.quote?.status === 'Accepted' || selectedTicket.status === 'Quote Accepted';
      
      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        status: isQuoteAccepted ? 'In Progress' : 'Assigned',
        engineerName: `${assignData.firstName} ${assignData.lastName}`,
        engineerEmail: assignData.email,
        engineerPhone: assignData.phone,
        engineerLocationFrom: assignData.locationFrom,
        engineerAttachments: assignData.attachments,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'engineer_assigned',
          title: 'Engineer Assigned',
          description: `Engineer ${assignData.firstName} ${assignData.lastName} assigned to Ticket #${selectedTicket.id.substring(0, 6)}${isQuoteAccepted ? ' and moved to In Progress' : ''}`,
          userId: 'admin_desklink',
          userName: 'Admin',
          targetUserId: selectedTicket.clientId,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }

      addNotification({
        type: 'success',
        title: 'Engineer Assigned',
        message: `Engineer ${assignData.firstName} has been assigned successfully.`
      });

      setShowAssignForm(false);
      setShowTicketModal(false);
      setSelectedTicket(null);
      setAssignData({
        firstName: '',
        lastName: '',
        email: '',
        locationFrom: '',
        phone: '',
        attachments: []
      });
    } catch (error) {
      console.error("Error assigning engineer:", error);
      addNotification({
        type: 'error',
        title: 'Assignment Failed',
        message: 'Failed to assign engineer.'
      });
    } finally {
      setIsAssigningEngineer(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        const activeTicketsCount = tickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length;
        const newEngineersCount = users.filter(u => u.role === 'engineer' && u.status === 'Pending').length;
        const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0'), 0);
        
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+12.5%', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Active Tickets', value: activeTicketsCount.toString(), change: '+3', icon: Ticket, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'New Engineers', value: newEngineersCount.toString(), change: '+5', icon: HardHat, color: 'text-orange-500', bg: 'bg-orange-50' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                      <stat.icon className="w-7 h-7" />
                    </div>
                    <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                      {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-900">Recent Tickets</h3>
                    <button onClick={() => setActiveTab('Tickets')} className="text-brand-teal text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {tickets.slice(0, 5).map((ticket, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setSelectedTicket(ticket); setShowTicketModal(true); }}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs ${
                            ticket.priority === 'High' ? 'bg-rose-50 text-rose-500' : 
                            ticket.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            {ticket.priority.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-brand-teal transition-colors">{ticket.subject}</p>
                            <p className="text-xs text-slate-500">#{ticket.id.slice(0, 6).toUpperCase()} • {ticket.clientName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            ticket.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                            ticket.status === 'Waiting for client approval' ? 'bg-purple-100 text-purple-600' :
                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                            ticket.status === 'On Site' ? 'bg-amber-100 text-amber-600' :
                            ticket.status === 'Completed' ? 'bg-slate-100 text-slate-400' :
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {ticket.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-all" />
                        </div>
                      </div>
                    ))}
                    {tickets.length === 0 && <p className="text-center text-slate-400 py-12">No tickets found</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900">Live Activity</h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                  <ActivityFeed role="admin" />
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                  <h3 className="text-lg font-black mb-2 relative z-10">System Status</h3>
                  <p className="text-xs text-slate-400 mb-6 relative z-10">Global nodes operational. Latency: 24ms</p>
                  <div className="space-y-4 relative z-10">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} className="h-full bg-brand-teal" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Network Uptime</span>
                      <span className="text-brand-teal">99.99%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Manage Users':
        const filteredClients = users
          .filter(u => 
            u.role === 'client' && 
            ((u.displayName?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
             (u.name?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
             (u.companyName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
             (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())) &&
            (userStatusFilter === 'All' || u.status === userStatusFilter)
          )
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });

        const filteredEngineers = users
          .filter(u => 
            u.role === 'engineer' && 
            ((u.displayName?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
             (u.fullName?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
             (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())) &&
            (userStatusFilter === 'All' || u.status === userStatusFilter)
          )
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });

        const staffUsers = users
          .filter(u => u.role === 'admin' || u.role === 'staff')
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-black">Manage Users</h3>
                <div className="flex gap-2 mt-4 bg-slate-100 p-1 rounded-2xl w-fit">
                  {['Clients', 'Engineers', 'Staff'].map(sub => (
                    <button 
                      key={sub}
                      onClick={() => setActiveUserSubTab(sub)}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeUserSubTab === sub 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 items-center">
                {(userSearch || userStatusFilter !== 'All') && (
                  <button 
                    onClick={() => {
                      setUserSearch('');
                      setUserStatusFilter('All');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-teal/50 appearance-none cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={`Search ${activeUserSubTab.toLowerCase()}...`} 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-teal/50 w-64"
                  />
                </div>
                {activeUserSubTab === 'Staff' && (
                  <button 
                    onClick={() => {
                      setNewUser(prev => ({ ...prev, role: 'staff' }));
                      setShowAddUserModal(true);
                    }}
                    className="px-4 py-2 bg-brand-teal text-slate-900 rounded-xl text-sm font-bold"
                  >
                    + Add Staff
                  </button>
                )}
              </div>
            </div>

            {activeUserSubTab === 'Clients' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client & Company</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-sm overflow-hidden border border-slate-200">
                              {client.photoURL ? <img src={client.photoURL} className="w-full h-full object-cover" /> : (client.name?.charAt(0) || client.displayName?.charAt(0) || client.email?.charAt(0))}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{client.name || client.displayName || 'Unnamed Client'}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{client.companyName || 'No Company'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{client.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-600 font-medium">{client.country || client.location || 'N/A'}</span>
                            {client.city && <span className="text-[10px] text-slate-400 uppercase font-bold">{client.city}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600">
                            {client.companySize || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            client.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {client.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{client.createdAt?.toDate ? client.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4 text-right relative overflow-visible">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenUserMenuId(openUserMenuId === client.id ? null : client.id);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {openUserMenuId === client.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenUserMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden text-left"
                                >
                                  <button 
                                    onClick={async () => {
                                      const newStatus = client.status === 'Active' ? 'Inactive' : 'Active';
                                      await updateDoc(doc(db, "users", client.id), { status: newStatus });
                                      setOpenUserMenuId(null);
                                      addNotification({
                                        type: 'success',
                                        title: 'Status Updated',
                                        message: `Client ${client.displayName} marked as ${newStatus}`
                                      });
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark as {client.status === 'Active' ? 'Inactive' : 'Active'}
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm(`Are you sure you want to delete client ${client.displayName}?`)) {
                                        await deleteDoc(doc(db, "users", client.id));
                                        setOpenUserMenuId(null);
                                        addNotification({
                                          type: 'success',
                                          title: 'Client Deleted',
                                          message: `Client ${client.displayName} deleted`
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Delete Client
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

            {activeUserSubTab === 'Engineers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEngineers.map((eng) => (
                  <div key={eng.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-teal/30 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl overflow-hidden">
                        {eng.photoURL ? <img src={eng.photoURL} className="w-full h-full object-cover" /> : (eng.displayName?.charAt(0) || eng.email?.charAt(0))}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenUserMenuId(openUserMenuId === eng.id ? null : eng.id);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          <AnimatePresence>
                            {openUserMenuId === eng.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenUserMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden text-left"
                                >
                                  <button 
                                    onClick={async () => {
                                      const newStatus = eng.status === 'Active' ? 'Inactive' : 'Active';
                                      await updateDoc(doc(db, "users", eng.id), { status: newStatus });
                                      setOpenUserMenuId(null);
                                      addNotification({
                                        type: 'success',
                                        title: 'Status Updated',
                                        message: `Engineer status updated to ${newStatus}`
                                      });
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark as {eng.status === 'Active' ? 'Inactive' : 'Active'}
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm(`Are you sure you want to delete engineer ${eng.displayName || eng.fullName}?`)) {
                                        await deleteDoc(doc(db, "users", eng.id));
                                        setOpenUserMenuId(null);
                                        addNotification({
                                          type: 'success',
                                          title: 'Engineer Deleted',
                                          message: `Engineer deleted`
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Delete Engineer
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          eng.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 
                          eng.status === 'Busy' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {eng.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-teal transition-colors">{eng.displayName || eng.fullName || 'Unnamed Engineer'}</h4>
                    <p className="text-sm text-slate-500 mb-4">{eng.specialization?.label || eng.specialization || 'General Engineer'} • {eng.location || (eng.city?.label ? `${eng.city.label}, ${eng.country?.label}` : 'N/A')}</p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] text-slate-400 uppercase font-bold">Hourly</div>
                        <div className="text-xs font-bold text-slate-900">${eng.hourlyRate || '0'}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] text-slate-400 uppercase font-bold">Half Day</div>
                        <div className="text-xs font-bold text-slate-900">${eng.halfDayRate || '0'}</div>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] text-slate-400 uppercase font-bold">Full Day</div>
                        <div className="text-xs font-bold text-slate-900">${eng.fullDayRate || '0'}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star className="w-4 h-4 fill-current" /> {eng.rating || 'N/A'}
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedEngineer(eng);
                          setShowEngineerModal(true);
                        }}
                        className="text-xs font-bold text-brand-teal uppercase tracking-widest hover:underline"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeUserSubTab === 'Staff' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffUsers.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{staff.displayName || staff.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{staff.email}</td>
                        <td className="px-6 py-4 text-sm font-bold text-brand-teal uppercase">{staff.role}</td>
                        <td className="px-6 py-4 text-right relative overflow-visible">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenUserMenuId(openUserMenuId === staff.id ? null : staff.id);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {openUserMenuId === staff.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenUserMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden text-left"
                                >
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm(`Are you sure you want to delete staff member ${staff.displayName || staff.email}?`)) {
                                        await deleteDoc(doc(db, "users", staff.id));
                                        setOpenUserMenuId(null);
                                        addNotification({
                                          type: 'success',
                                          title: 'Staff Deleted',
                                          message: `Staff member deleted`
                                        });
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Delete Staff
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        );
      case 'Tickets':
        const ticketSubTabs = [
          { id: 'Pending', label: 'New Tickets', icon: Clock },
          { id: 'Approved', label: 'Approved', icon: CheckCircle },
          { id: 'Waiting for client approval', label: 'Waiting for Approval', icon: Clock },
          { id: 'Rejected', label: 'Rejected', icon: X },
          { id: 'Quote Accepted', label: 'Assign Engineer', icon: HardHat },
          { id: 'In Progress', label: 'In Progress', icon: Play },
          { id: 'Completed', label: 'Completed', icon: CheckCircle }
        ];

        const filteredTickets = tickets.filter(ticket => {
          const matchesSearch = (ticket.subject?.toLowerCase() || '').includes(ticketSearch.toLowerCase()) ||
                               (ticket.clientName?.toLowerCase() || '').includes(ticketSearch.toLowerCase()) ||
                               (ticket.clientEmail?.toLowerCase() || '').includes(ticketSearch.toLowerCase());
          
          const matchesPriority = ticketPriorityFilter === 'All' || ticket.priority === ticketPriorityFilter;
          const matchesCategory = ticketCategoryFilter === 'All' || ticket.category === ticketCategoryFilter;

          if (activeTicketSubTab === 'In Progress') {
            return matchesSearch && matchesPriority && matchesCategory && (ticket.status === 'In Progress' || ticket.status === 'On Site');
          }
          return matchesSearch && matchesPriority && matchesCategory && ticket.status === activeTicketSubTab;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-black">Service Tickets</h3>
                <p className="text-xs text-slate-500 mt-1">Manage and track all service requests</p>
              </div>
              <div className="flex gap-4 items-center w-full md:w-auto">
                {(ticketSearch || activeTicketSubTab !== 'Pending' || ticketPriorityFilter !== 'All' || ticketCategoryFilter !== 'All') && (
                  <button 
                    onClick={() => {
                      setTicketSearch('');
                      setActiveTicketSubTab('Pending');
                      setTicketPriorityFilter('All');
                      setTicketCategoryFilter('All');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={ticketPriorityFilter}
                    onChange={(e) => setTicketPriorityFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-teal/50 appearance-none cursor-pointer"
                  >
                    <option value="All">All Priority</option>
                    <option value="Critical (SLA)">Critical (SLA)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    value={ticketCategoryFilter}
                    onChange={(e) => setTicketCategoryFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-teal/50 appearance-none cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Network">Network</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search subject or client..." 
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-teal/50 w-full md:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Ticket Sub-Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
              {ticketSubTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTicketSubTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTicketSubTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tickets.filter(t => {
                    if (tab.id === 'All') return true;
                    if (tab.id === 'In Progress') return t.status === 'In Progress' || t.status === 'On Site';
                    return t.status === tab.id;
                  }).length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeTicketSubTab === tab.id ? 'bg-brand-teal/10 text-brand-teal' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {tickets.filter(t => {
                        if (tab.id === 'All') return true;
                        if (tab.id === 'In Progress') return t.status === 'In Progress' || t.status === 'On Site';
                        return t.status === tab.id;
                      }).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ticket ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-brand-teal text-sm flex items-center gap-2">
                        TK-{ticket.id.slice(0, 4).toUpperCase()}
                        {ticket.createdAt && (new Date().getTime() - (ticket.createdAt?.seconds ? ticket.createdAt.seconds * 1000 : new Date(ticket.createdAt).getTime()) < 24 * 60 * 60 * 1000) && (
                          <span className="px-1.5 py-0.5 bg-brand-teal text-brand-dark text-[8px] font-black uppercase rounded animate-pulse">New</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">
                            {ticket.clientName && ticket.clientName !== 'Unknown Client' 
                              ? ticket.clientName 
                              : (ticket.clientEmail || 'Unknown Client')}
                          </span>
                          {ticket.clientEmail && ticket.clientEmail !== ticket.clientName && (
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ticket.clientEmail}</span>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm transition-all duration-500 ${ticket.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          ticket.priority === 'Critical (SLA)' ? 'bg-rose-100 text-rose-600' :
                          ticket.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          ticket.status === 'Completed' ? 'bg-slate-100 text-slate-400' : 
                          ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                          ticket.status === 'On Site' ? 'bg-amber-100 text-amber-600' :
                          ticket.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          ticket.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                          ticket.status === 'Waiting for client approval' ? 'bg-purple-100 text-purple-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {ticket.createdAt ? (
                          ticket.createdAt.seconds 
                            ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString()
                            : new Date(ticket.createdAt).toLocaleDateString()
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {(ticket.status === 'Pending' || ticket.status === 'Waiting for client approval') && (
                          <>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await updateDoc(doc(db, "tickets", ticket.id), {
                                    status: 'Waiting for client approval',
                                    updatedAt: serverTimestamp(),
                                    updates: [
                                      ...(ticket.updates || []),
                                      { text: 'Ticket status changed to Waiting for client approval.', timestamp: new Date().toISOString() }
                                    ]
                                  });
                                  addNotification({
                                    type: 'system',
                                    title: 'Status Updated',
                                    message: `Ticket TK-${ticket.id.slice(0,4).toUpperCase()} is now waiting for client approval.`
                                  });
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticket.id}`);
                                }
                              }}
                              className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                              title="Wait for Approval"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await updateDoc(doc(db, "tickets", ticket.id), {
                                    status: 'Approved',
                                    updatedAt: serverTimestamp(),
                                    updates: [
                                      ...(ticket.updates || []),
                                      { text: 'Ticket approved by administrator.', timestamp: new Date().toISOString() }
                                    ]
                                  });
                                  addNotification({
                                    type: 'success',
                                    title: 'Ticket Approved',
                                    message: `Ticket TK-${ticket.id.slice(0,4).toUpperCase()} has been approved.`
                                  });
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticket.id}`);
                                }
                              }}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                              title="Approve Ticket"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await updateDoc(doc(db, "tickets", ticket.id), {
                                    status: 'Rejected',
                                    updatedAt: serverTimestamp(),
                                    updates: [
                                      ...(ticket.updates || []),
                                      { text: 'Ticket rejected by administrator.', timestamp: new Date().toISOString() }
                                    ]
                                  });
                                  addNotification({
                                    type: 'system',
                                    title: 'Ticket Rejected',
                                    message: `Ticket TK-${ticket.id.slice(0,4).toUpperCase()} has been rejected.`
                                  });
                                } catch (err) {
                                  handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticket.id}`);
                                }
                              }}
                              className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                              title="Reject Ticket"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className="px-4 py-2 bg-slate-50 text-brand-teal font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No tickets matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
      case 'Completed Jobs':
        const completedTickets = tickets.filter(t => t.status === 'Completed');
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">Completed Jobs History</h3>
              <button 
                onClick={handleExportReport}
                className="text-brand-teal font-bold text-sm flex items-center gap-2 hover:bg-teal-50 px-3 py-1 rounded-lg transition-all"
              >
                <FileText className="w-4 h-4" /> Export Report
              </button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Job ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Engineer</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedTickets.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 text-sm">JB-{job.id.slice(0, 4).toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm text-slate-400 line-through">{job.subject}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{job.clientName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{job.engineerName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{job.serviceType || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {job.updatedAt ? new Date(job.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => {
                              setSelectedTicket(job);
                              setShowTicketModal(true);
                            }}
                            className="text-brand-teal font-bold text-xs hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {completedTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                          No completed jobs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'Quotations':
        return <QuotationPortal role="admin" />;
      case 'Post News':
        return (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-brand-teal font-bold shrink-0">AD</div>
                <div className="flex-1 space-y-4">
                  <input 
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="News Title"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-brand-teal/50 transition-all"
                  />
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share news or platform updates..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-brand-teal/50 transition-all resize-none"
                    rows={3}
                  />
                  
                  {newPostImage && (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-100 group">
                      <img src={newPostImage} className="w-full h-full object-cover" alt="Post preview" />
                      <button 
                        onClick={() => setNewPostImage(null)}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-500 hover:text-brand-teal transition-colors text-sm font-bold cursor-pointer">
                    <ImageIcon className="w-4 h-4" /> 
                    <span>Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <button className="flex items-center gap-2 text-slate-500 hover:text-brand-teal transition-colors text-sm font-bold">
                    <FileText className="w-4 h-4" /> Article
                  </button>
                </div>
                <button 
                  onClick={handlePost}
                  disabled={!newPostContent.trim()}
                  className="px-6 py-2 bg-brand-teal text-slate-900 rounded-xl text-sm font-bold shadow-lg shadow-brand-teal/20 hover:bg-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                      {post.author?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{post.author || 'Admin'}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                  
                  {post.imageUrl && (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 border border-slate-50">
                      <img src={post.imageUrl} className="w-full h-full object-cover" alt="Post banner" />
                    </div>
                  )}
                  
                  <h3 className="font-bold text-slate-900 mb-2">{post.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{post.content}</p>
                  <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                    <button className="flex items-center gap-2 text-slate-400 hover:text-brand-teal transition-colors text-xs font-bold">
                      <ArrowUpRight className="w-4 h-4" /> {post.likes || 0} Likes
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-brand-teal transition-colors text-xs font-bold">
                      <MessageSquare className="w-4 h-4" /> {post.commentsCount || 0} Comments
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Messages':
        const adminUser = {
          uid: 'admin_desklink',
          email: 'admin@desklink.com',
          displayName: 'Admin',
          role: 'admin'
        };
        return <MessagingSystem currentUser={adminUser} role="admin" allUsers={users} />;
      case 'Billing & Invoices':
        const totalOutstanding = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0'), 0);
        const paidThisMonth = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0'), 0);
        const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Outstanding</p>
                <div className="text-3xl font-bold text-slate-900">${totalOutstanding.toLocaleString()}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paid This Month</p>
                <div className="text-3xl font-bold text-emerald-500">${paidThisMonth.toLocaleString()}</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overdue Invoices</p>
                <div className="text-3xl font-bold text-rose-500">{overdueCount}</div>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-black">Recent Invoices</h3>
                <button className="text-brand-teal text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{inv.clientName}</p>
                        <p className="text-xs text-slate-400">INV-{inv.id.slice(0, 4).toUpperCase()} • {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{inv.amount}</p>
                      <span className={`text-[10px] font-bold uppercase ${
                        inv.status === 'Paid' ? 'text-emerald-500' : 
                        inv.status === 'Overdue' ? 'text-rose-500' : 'text-orange-500'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'Settings':
        return (
          <div className="max-w-2xl space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <h3 className="text-xl font-bold text-black">System Settings</h3>
              
              {/* Password Change Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Security & Access</h4>
                    <p className="text-xs text-slate-500">Manage your administrative credentials.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-teal/50 transition-all"
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {settingsStatus && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
                    settingsStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {settingsStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{settingsStatus.message}</span>
                  </div>
                )}

                <button 
                  onClick={handleUpdatePassword}
                  disabled={isSavingSettings}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
              <BarChart3 className="w-12 h-12" />
            </div>
            <div className="max-w-md">
              <h3 className="text-2xl font-bold text-black mb-2">{activeTab}</h3>
              <p className="text-slate-500">This management module is currently being populated with real-time data from the DeskLink global network. Check back shortly for full administrative controls.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex">
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-6"
            >
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500">
                <motion.div
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <CheckCircle className="w-16 h-16" />
                </motion.div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900">Task Completed!</h3>
                <p className="text-slate-500 font-medium">The ticket has been successfully closed.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : 80,
          x: typeof window !== 'undefined' && window.innerWidth < 1024 ? (isMobileSidebarOpen ? 0 : -280) : 0
        }}
        className={`bg-slate-900 flex flex-col z-[70] shadow-2xl transition-all duration-300 fixed lg:sticky top-0 h-screen`}
      >
        <div className="p-8 flex items-center justify-between">
          {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && <Logo />}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:block p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all group relative ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'}`} />
              {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm">{item.id}</span>
                  {item.id === 'Messages' && unreadMessagesCount > 0 && (
                    <span className="bg-brand-teal text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-brand-teal/20">
                      {unreadMessagesCount}
                    </span>
                  )}
                  {item.id !== 'Messages' && item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-4 p-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {isSidebarOpen && <span className="text-sm font-bold uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <LogoutConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onLogout}
        title="Confirm Admin Logout"
        message="Are you sure you want to log out of the administrator dashboard?"
        confirmLabel="Log Out"
        cancelLabel="Cancel"
      />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 ${activeTab === 'Messages' ? 'h-screen overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Top Bar with Breadcrumbs */}
        <div className="flex items-center justify-between px-6 md:px-12 py-6 md:py-8 z-40 gap-4 bg-white/50 backdrop-blur-sm sticky top-0 border-b border-slate-100/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-black leading-none mb-1">
                {activeTab + (activeTab === 'Messages' && unreadMessagesCount > 0 ? ` (${unreadMessagesCount})` : '')}
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <button 
                  onClick={() => setActiveTab('Dashboard')}
                  className="hover:text-brand-teal transition-colors"
                >
                  Admin Portal
                </button>
                <ChevronRight className="w-2.5 h-2.5" />
                <span className="text-brand-teal">
                  {activeTab}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Network Live</span>
            </div>

            <div className="flex items-center gap-3">
              <NotificationDropdown />

              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shrink-0 shadow-sm"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>



        <div className={`${activeTab === 'Messages' ? 'flex-1' : 'p-6 md:p-12 pt-4 md:pt-6 max-w-[1600px] mx-auto w-full'}`}>
          {renderContent()}
        </div>
      </main>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddUserModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-black">Add New {newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1)}</h3>
                  <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form className="space-y-6" onSubmit={handleAddUser}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          placeholder="Enter username" 
                          className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-teal outline-none transition-all" 
                          required
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="user@company.com" 
                        className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-teal outline-none transition-all" 
                        required
                      />
                    </div>
                  </div>
                  {(newUser.role === 'staff' || newUser.role === 'admin') && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="password" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          placeholder="Enter password" 
                          className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-teal outline-none transition-all" 
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-teal outline-none transition-all"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-brand-teal text-slate-900 font-bold rounded-xl hover:bg-teal-300 transition-all shadow-lg shadow-brand-teal/20"
                  >
                    Create User
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Engineer Detail Modal */}
      <AnimatePresence>
        {showEngineerModal && selectedEngineer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEngineerModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Engineer Profile</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Detailed registration information</p>
                </div>
                <button onClick={() => setShowEngineerModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Profile Hero */}
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="w-32 h-32 bg-white border border-slate-200 rounded-3xl flex items-center justify-center overflow-hidden shrink-0">
                    {selectedEngineer.photoURL || selectedEngineer.profilePic ? (
                      <img 
                        src={selectedEngineer.photoURL || selectedEngineer.profilePic} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <User className="w-12 h-12 text-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedEngineer.displayName || selectedEngineer.fullName}</h2>
                    <p className="text-brand-teal font-bold mb-4">{selectedEngineer.specialization?.label || selectedEngineer.specialization || 'IT Professional'}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedEngineer.city?.label || selectedEngineer.city}, {selectedEngineer.country?.label || selectedEngineer.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedEngineer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedEngineer.phoneCountryCode?.value} {selectedEngineer.phoneNumber}</span>
                      </div>
                      {selectedEngineer.whatsappNumber && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-emerald-500" />
                          <span>{selectedEngineer.whatsappCountryCode?.value} {selectedEngineer.whatsappNumber} (WhatsApp)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { label: 'Hourly Rate', value: `$${selectedEngineer.hourlyRate || '0'}/hr`, icon: CreditCard },
                    { label: 'Half-day Rate', value: `$${selectedEngineer.halfDayRate || '0'}/4h`, icon: CreditCard },
                    { label: 'Full-day Rate', value: `$${selectedEngineer.fullDayRate || '0'}/8h`, icon: CreditCard },
                    { label: 'Experience', value: `${selectedEngineer.experience || '0'}+ Years`, icon: Clock },
                    { label: 'Status', value: selectedEngineer.status || 'Active', icon: CheckCircle },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                      <div className="w-12 h-12 bg-brand-teal/10 rounded-xl flex items-center justify-center">
                        <stat.icon className="w-6 h-6 text-brand-teal" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{stat.label}</div>
                        <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skills & Languages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Code className="w-5 h-5 text-brand-teal" /> Technical Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedEngineer.skills) ? (
                        selectedEngineer.skills.map((skill: any, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
                            {skill.label || skill}
                          </span>
                        ))
                      ) : (
                        (selectedEngineer.skills || '').split(',').map((skill: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
                            {skill.trim()}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-brand-teal" /> Languages
                    </h4>
                    <div className="space-y-2">
                      {(selectedEngineer.languages || []).map((lang: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="font-bold text-slate-700">{lang.name}</span>
                          <span className="text-[10px] px-2 py-1 bg-brand-teal/10 text-brand-teal rounded-md font-bold uppercase">
                            {lang.level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CV Section */}
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                        <FileText className="w-8 h-8 text-brand-teal" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Curriculum Vitae</h4>
                        <p className="text-xs text-slate-500">Verified Resume Document</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {selectedEngineer.cvFile && (
                        <>
                          <a 
                            href={typeof selectedEngineer.cvFile === 'string' ? selectedEngineer.cvFile : '#'} 
                            download={selectedEngineer.fullName ? `${selectedEngineer.fullName}_CV.pdf` : 'CV.pdf'}
                            className="px-6 py-3 bg-brand-teal text-slate-900 font-bold rounded-xl hover:bg-teal-300 transition-all flex items-center gap-2 shadow-lg shadow-brand-teal/20"
                          >
                            <FileText className="w-4 h-4" /> Download CV
                          </a>
                          <button 
                            onClick={() => {
                              if (typeof selectedEngineer.cvFile === 'string') {
                                window.open(selectedEngineer.cvFile, '_blank');
                              }
                            }}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                          >
                            Preview
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 bg-white flex justify-end sticky bottom-0 z-10">
                <button 
                  onClick={() => setShowEngineerModal(false)}
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full h-full flex flex-col overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <button onClick={() => setShowTicketModal(false)} className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors">
                      <HiArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h3 className="text-xl font-bold text-slate-900">Ticket Details</h3>
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold ml-10">Review and manage service request</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID:</span>
                    <span className="text-xs font-bold text-slate-900">TK-{selectedTicket.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <button onClick={() => setShowTicketModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
                <TicketDetailView ticket={selectedTicket} t={t} language={language} />
                
                {/* Admin Controls for Approval */}
                {(selectedTicket.status === 'Pending' || selectedTicket.status === 'Waiting for client approval') && (
                  <div className="mt-8 space-y-6 pt-8 border-t border-slate-200">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h4 className="font-bold text-slate-900">New Service Request</h4>
                        <p className="text-xs text-slate-500">Please review the details and approve or reject this ticket.</p>
                      </div>
                        <div className="flex gap-4 w-full md:w-auto">
                          <button 
                            onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Waiting for client approval')}
                            className="flex-1 md:flex-none px-6 py-3 bg-purple-50 text-purple-600 font-bold rounded-xl hover:bg-purple-100 transition-all"
                          >
                            Wait for Approval
                          </button>
                          <button 
                            onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Rejected')}
                            className="flex-1 md:flex-none px-8 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Approved')}
                            className="flex-1 md:flex-none px-8 py-3 bg-brand-teal text-slate-900 font-bold rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-brand-teal/20"
                          >
                            Approve
                          </button>
                        </div>
                    </div>
                  </div>
                )}

                {/* Admin Controls for Giving Quote */}
                {selectedTicket.status === 'Approved' && (
                  <div className="mt-8 space-y-6 pt-8 border-t border-slate-200">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-brand-teal" /> 
                        {t.clientPortal.quotations.giveQuote}
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                            {t.clientPortal.quotations.quoteAmount}
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              {quoteCurrency === 'USD' ? (
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              ) : (
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">€</span>
                              )}
                              <input 
                                type="text"
                                value={quoteAmount}
                                onChange={(e) => setQuoteAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="0.00"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 !pl-16 text-sm outline-none focus:border-brand-teal/50 transition-all"
                              />
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-2xl">
                              <button
                                onClick={() => setQuoteCurrency('USD')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${quoteCurrency === 'USD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                USD
                              </button>
                              <button
                                onClick={() => setQuoteCurrency('EUR')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${quoteCurrency === 'EUR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                EUR
                              </button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                            {t.clientPortal.quotations.quoteDescription}
                          </label>
                          <div className="relative">
                            <MessageSquare className="absolute left-4 top-5 w-4 h-4 text-slate-400" />
                            <textarea 
                              value={quoteDescription}
                              onChange={(e) => setQuoteDescription(e.target.value)}
                              placeholder={t.clientPortal.quotations.modal.descriptionPlaceholder}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 !pl-16 text-sm outline-none focus:border-brand-teal/50 transition-all resize-none"
                              rows={3}
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => handleGiveQuote(selectedTicket.id)}
                          disabled={isSubmittingQuote || !quoteAmount.trim()}
                          className="w-full py-4 bg-slate-900 text-brand-teal rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmittingQuote ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <Send className="w-4 h-4" />
                              {t.clientPortal.quotations.submitQuote}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Controls for On-Site and Updates */}
                {(selectedTicket.status === 'Quote Accepted' || selectedTicket.status === 'Assigned' || selectedTicket.status === 'In Progress' || selectedTicket.status === 'On Site') && (
                  <div className="mt-8 space-y-6 pt-8 border-t border-slate-200">
                    {selectedTicket.status === 'Quote Accepted' && !showAssignForm && (
                      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-blue-900">Ready for Assignment</h4>
                          <p className="text-xs text-blue-600">The client has accepted the quote. You can now assign an engineer.</p>
                        </div>
                        <button 
                          onClick={() => setShowAssignForm(true)}
                          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Assign Engineer
                        </button>
                      </div>
                    )}

                    {showAssignForm && (
                      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-brand-teal" /> 
                            Assign Engineer Details
                          </h4>
                          <button onClick={() => setShowAssignForm(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name *</label>
                            <input 
                              type="text"
                              value={assignData.firstName}
                              onChange={(e) => setAssignData({...assignData, firstName: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-brand-teal/50 transition-all"
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surname *</label>
                            <input 
                              type="text"
                              value={assignData.lastName}
                              onChange={(e) => setAssignData({...assignData, lastName: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-brand-teal/50 transition-all"
                              placeholder="Doe"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address *</label>
                            <input 
                              type="email"
                              value={assignData.email}
                              onChange={(e) => setAssignData({...assignData, email: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-brand-teal/50 transition-all"
                              placeholder="john.doe@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                            <input 
                              type="tel"
                              value={assignData.phone}
                              onChange={(e) => setAssignData({...assignData, phone: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm outline-none focus:border-brand-teal/50 transition-all"
                              placeholder="+1 234 567 890"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location Traveling From</label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="text"
                                value={assignData.locationFrom}
                                onChange={(e) => setAssignData({...assignData, locationFrom: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 pl-10 text-sm outline-none focus:border-brand-teal/50 transition-all"
                                placeholder="City, Country"
                              />
                            </div>
                          </div>
                          
                          <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attachments (PDF, JPG, PNG)</label>
                            <div className="flex flex-wrap gap-4">
                              <label className="w-32 h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-teal/50 hover:bg-slate-50 transition-all group">
                                <PaperClip className="w-6 h-6 text-slate-300 group-hover:text-brand-teal transition-colors" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Files</span>
                                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                              </label>
                              
                              {assignData.attachments.map((file, idx) => (
                                <div key={idx} className="w-32 h-32 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between relative group">
                                  <button 
                                    onClick={() => setAssignData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  <div className="flex-1 flex items-center justify-center">
                                    {file.type.startsWith('image/') ? (
                                      <img src={file.data} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                      <FileText className="w-10 h-10 text-slate-300" />
                                    )}
                                  </div>
                                  <p className="text-[8px] font-bold text-slate-500 truncate mt-2">{file.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleAssignEngineer}
                          disabled={isAssigningEngineer || !assignData.firstName || !assignData.lastName || !assignData.email}
                          className="w-full py-4 bg-slate-900 text-brand-teal rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isAssigningEngineer ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Complete Assignment
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {(selectedTicket.status === 'Assigned' || selectedTicket.status === 'In Progress' || selectedTicket.status === 'On Site') && (
                      <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div>
                          <h4 className="font-bold text-slate-900">Engineer On-Site Status</h4>
                          <p className="text-xs text-slate-500">Toggle this when the engineer arrives at the client location.</p>
                        </div>
                        <button 
                          onClick={() => handleToggleOnSite(selectedTicket.id, selectedTicket.isOnSite)}
                          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                            selectedTicket.isOnSite 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {selectedTicket.isOnSite ? 'Engineer On Site' : 'Mark as On Site'}
                        </button>
                      </div>
                    )}

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-brand-teal" /> 
                        Send Update to Client
                      </h4>
                      <div className="flex gap-3">
                        <textarea 
                          value={newUpdateText}
                          onChange={(e) => setNewUpdateText(e.target.value)}
                          placeholder="Type an update for the client..."
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-brand-teal/50 transition-all resize-none"
                          rows={2}
                        />
                        <button 
                          onClick={() => handleAddUpdate(selectedTicket.id)}
                          disabled={isAddingUpdate || !newUpdateText.trim()}
                          className="px-6 bg-brand-teal text-slate-900 rounded-2xl font-bold text-sm hover:bg-teal-300 transition-all disabled:opacity-50 shrink-0"
                        >
                          {isAddingUpdate ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send'}
                        </button>
                      </div>
                      
                      {selectedTicket.updates && selectedTicket.updates.length > 0 && (
                        <div className="space-y-3 mt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Previous Updates</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {selectedTicket.updates.slice().reverse().map((update: any, idx: number) => (
                                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <p className="text-xs text-slate-700">{update.text}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-[9px] font-bold text-brand-teal uppercase">{update.author || 'System'}</span>
                                    <p className="text-[9px] text-slate-400">{new Date(update.timestamp).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 border-t border-slate-200 bg-white flex flex-wrap gap-4 justify-end sticky bottom-0 z-10">
                {(selectedTicket.status === 'Pending' || selectedTicket.status === 'Waiting for client approval') && (
                  <>
                    <button 
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Waiting for client approval')}
                      className="px-6 py-3 bg-purple-50 text-purple-600 font-bold rounded-xl hover:bg-purple-100 transition-all"
                    >
                      Wait for Approval
                    </button>
                    <button 
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Rejected')}
                      className="px-6 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all"
                    >
                      Reject Ticket
                    </button>
                    <button 
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Approved')}
                      className="px-8 py-3 bg-brand-teal text-slate-900 font-bold rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-brand-teal/20"
                    >
                      Approve & List as Job
                    </button>
                  </>
                )}
                {(selectedTicket.status === 'Assigned' || selectedTicket.status === 'In Progress' || selectedTicket.status === 'On Site') && (
                  <button 
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'Completed')}
                    className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Mark as Completed
                  </button>
                )}
                <button 
                  onClick={() => setShowTicketModal(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPortal;
