import React, { useState, useEffect, useMemo } from 'react';
import NotificationDropdown from './NotificationDropdown';
import { 
  db, 
  auth, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  onAuthStateChanged,
  orderBy, 
  addDoc, 
  updateDoc,
  serverTimestamp, 
  doc, 
  setDoc,
  getDocs,
  handleFirestoreError,
  OperationType
} from '../firebase';
// import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { 
  HiHome as Home, 
  HiPlusCircle as PlusCircle, 
  HiTicket as Ticket, 
  HiSquares2X2 as Layers, 
  HiBriefcase as Briefcase, 
  HiCreditCard as CreditCard, 
  HiUsers as Users, 
  HiBuildingOffice2 as Building2, 
  HiQuestionMarkCircle as HelpCircle, 
  HiChatBubbleLeftRight as MessageSquare,
  HiChatBubbleOvalLeft as MessageCircle,
  HiArrowLeftOnRectangle as LogOut,
  HiBell as Bell,
  HiMagnifyingGlass as Search,
  HiChevronRight as ChevronRight,
  HiBars3 as Menu,
  HiXMark as X,
  HiUser as User,
  HiBolt as Zap,
  HiGlobeAlt as Globe,
  HiClock as Clock,
  HiCurrencyDollar as DollarSign,
  HiShieldCheck as ShieldCheck,
  HiPlus as Plus,
  HiCheckCircle as CheckCircle,
  HiStar as Star,
  HiCodeBracket as Code,
  HiDocumentText as FileText,
  HiEnvelope as Mail,
  HiPhone as Phone,
  HiArrowTrendingUp as TrendingUp,
  HiExclamationCircle as AlertCircle,
  HiShieldCheck as Shield,
  HiListBullet as List,
  HiFunnel as Filter,
  HiPresentationChartLine as Activity,
  HiCog6Tooth as Settings,
  HiComputerDesktop as Monitor,
  HiTruck as Truck,
  HiPlusCircle as PlusSquare,
  HiChartBar as BarChart3,
  HiUserPlus as UserPlus,
  HiLockClosed as Lock,
  HiBookOpen as BookOpen,
  HiClock as History,
  HiPaperAirplane as Send,
  HiMapPin as MapPin,
  HiMap as MapIcon,
  HiChevronDown as ChevronDown,
  HiPaperClip as PaperClip,
  HiArrowPath as Loader2,
  HiArrowLeft
} from 'react-icons/hi2';
import { FaHeadset as Headphones } from 'react-icons/fa6';
import { Country, City } from 'country-state-city';
import countriesLib from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
import ruCountries from 'i18n-iso-countries/langs/ru.json';
import Select from 'react-select';

countriesLib.registerLocale(enCountries);
countriesLib.registerLocale(ruCountries);
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Logo from './Logo';
import { motion, AnimatePresence } from 'framer-motion';

const notifyAdmins = async (notification: any) => {
  try {
    const adminDocs = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
    const adminIds = adminDocs.docs.map(doc => doc.id);
    
    for (const adminId of adminIds) {
      await addDoc(collection(db, "users", adminId, "notifications"), {
        ...notification,
        read: false,
        timestamp: serverTimestamp()
      });
    }
  } catch (err) {
    console.error("Error notifying admins:", err);
  }
};
import LogoutConfirmModal from './LogoutConfirmModal';
import TicketDetailView from './TicketDetailView';
import MessagingSystem from './MessagingSystem';
import ActivityFeed from './ActivityFeed';
import QuotationPortal from './QuotationPortal';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

interface ClientPortalProps {
  user: any;
  onLogout: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ user, onLogout }) => {
  const { t, language, setLanguage } = useLanguage();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('desklink_client_activeTab') || 'home');

  useEffect(() => {
    localStorage.setItem('desklink_client_activeTab', activeTab);
  }, [activeTab]);
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showTicketReview, setShowTicketReview] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subUsers, setSubUsers] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [ticketData, setTicketData] = useState({
    serviceType: 'On-Demand Dispatch',
    estimatedDuration: '',
    priority: 'Medium',
    subject: '',
    description: '',
    country: '',
    city: '',
    location: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    ticketNumber: '',
    dateTime: '',
    attachments: [] as { name: string, type: string, data: string }[]
  });
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'Viewer'
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCreateOppModal, setShowCreateOppModal] = useState(false);
  const [newOpp, setNewOpp] = useState({
    type: '',
    title: '',
    description: '',
    location: '',
    budget: '',
    timeline: ''
  });

  useEffect(() => {
    if (user?.email && !ticketData.contactEmail) {
      setTicketData(prev => ({ ...prev, contactEmail: user.email }));
    }
  }, [user?.email, ticketData.contactEmail]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedEngineer, setSelectedEngineer] = useState<any>(null);
  const [showEngineerModal, setShowEngineerModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      padding: '8px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#009688'
      }
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#009688' : state.isFocused ? '#f1f5f9' : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      padding: '12px'
    })
  };

  const countries = useMemo(() => {
    return Country.getAllCountries().map(c => {
      let translatedName = c.name;
      if (language === 'ru') {
        translatedName = countriesLib.getName(c.isoCode, 'ru') || c.name;
      } else if (language === 'uz') {
        translatedName = c.name; // Fallback
      }
      return {
        value: c.isoCode,
        label: translatedName,
        flag: c.flag
      };
    });
  }, [language]);

  const cities = useMemo(() => {
    if (!ticketData.country) return [];
    return City.getCitiesOfCountry(ticketData.country)?.map(c => ({
      value: c.name,
      label: c.name
    })) || [];
  }, [ticketData.country]);

  const [isFirebaseAuthenticated, setIsFirebaseAuthenticated] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsFirebaseAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseAuthenticated || !user?.email) return;

    const userEmail = user?.email || auth.currentUser?.email;
    if (!userEmail) return;

    const q = query(
      collection(db, "tickets"), 
      where("clientEmail", "==", userEmail), 
      orderBy("createdAt", "desc")
    );

    const unsubTickets = onSnapshot(q, (snapshot: any) => {
      const ticketList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      // Since mock onSnapshot doesn't filter, we filter manually here
      const filteredTickets = ticketList.filter((t: any) => t.clientEmail === userEmail);
      
      console.log("Fetched tickets for", userEmail, ":", filteredTickets.length);
      setTickets(filteredTickets.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      }));
    });

    const unsubInvoices = onSnapshot(
      query(collection(db, "invoices"), where("clientEmail", "==", userEmail), orderBy("createdAt", "desc")),
      (snapshot: any) => {
        const invoiceList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        const filteredInvoices = invoiceList.filter((inv: any) => inv.clientEmail === userEmail);
        setInvoices(filteredInvoices);
      }
    );

    const unsubMessages = onSnapshot(
      query(collection(db, "messages"), where("receiverId", "==", user.uid || user.id), where("unread", "==", true)),
      (snapshot: any) => {
        setUnreadMessagesCount(snapshot.size);
      }
    );

    const unsubQuotations = onSnapshot(
      query(collection(db, "quotations"), where("clientUid", "==", user?.uid), orderBy("createdAt", "desc")),
      (snapshot: any) => {
        setQuotations(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubSubUsers = onSnapshot(
      query(collection(db, "users"), where("parentClientEmail", "==", userEmail)),
      (snapshot: any) => {
        const userList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        const filteredUsers = userList.filter((u: any) => u.parentClientEmail === userEmail);
        setSubUsers(filteredUsers);
      }
    );

    const unsubEngineers = onSnapshot(collection(db, "users"), (snapshot: any) => {
      setEngineers(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })).filter((u: any) => u.role === 'engineer'));
    });

    return () => {
      unsubTickets();
      unsubInvoices();
      unsubMessages();
      unsubQuotations();
      unsubSubUsers();
      unsubEngineers();
    };
  }, [user?.email, user.uid, user.id]);

  const handleTicketInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validation logic
    if (['contactPhone', 'ticketNumber'].includes(name)) {
      // Allow numbers, spaces, plus, and dashes
      if (/[^0-9+\-\s]/.test(value)) return;
    }

    setTicketData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Validation logic
    if (['username'].includes(name)) {
      // Text only: No digits
      if (/\d/.test(value)) return;
    }

    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userRef = doc(collection(db, "users"));
      const userData = {
        uid: userRef.id,
        displayName: newUser.username,
        email: newUser.email,
        role: 'client', // Sub-users are also clients but with restricted roles in app logic
        parentClientEmail: user.email,
        status: 'Active',
        createdAt: serverTimestamp()
      };
      
      await setDoc(userRef, userData);
      
      setShowAddUserModal(false);
      setNewUser({ username: '', email: '', role: 'Viewer' });
      addNotification({
        type: 'success',
        title: 'User Added',
        message: 'User added successfully!'
      });
    } catch (error) {
      console.error("Error adding user:", error);
      addNotification({
        type: 'error',
        title: 'Add Failed',
        message: 'Failed to add user. Please check permissions.'
      });
    }
  };

  const handleTicketSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Clean payload to ensure it matches security rules exactly
      const ticketPayload = {
        serviceType: ticketData.serviceType,
        estimatedDuration: ticketData.estimatedDuration,
        priority: ticketData.priority,
        subject: ticketData.subject,
        description: ticketData.description,
        country: ticketData.country,
        city: ticketData.city,
        location: ticketData.location,
        contactEmail: ticketData.contactEmail || user?.email || auth.currentUser?.email || '',
        contactPhone: ticketData.contactPhone,
        ticketNumber: ticketData.ticketNumber,
        dateTime: ticketData.dateTime,
        attachments: ticketData.attachments || [],
        authorUid: user?.uid || auth.currentUser?.uid || 'unknown',
        clientName: user?.companyName || user?.displayName || user?.name || user?.fullName || auth.currentUser?.displayName || 'Unknown Client',
        clientEmail: user?.email || auth.currentUser?.email || user?.companyEmail || 'unknown',
        status: 'Pending',
        createdAt: serverTimestamp(),
      };

      console.log("Submitting ticket with payload:", ticketPayload);

      const docRef = await addDoc(collection(db, "tickets"), ticketPayload);
      console.log("Ticket submitted successfully with ID:", docRef.id);
      
      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'ticket_created',
          title: 'New Ticket Logged',
          description: `Client ${user?.displayName || user?.email} logged a new ticket: ${ticketData.subject}`,
          userId: user?.uid || auth.currentUser?.uid,
          userName: user?.displayName || user?.email,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }
      
      addNotification({
        type: 'success',
        title: 'Ticket Submitted',
        message: 'Ticket submitted successfully!'
      });

      // Notify Admins
      notifyAdmins({
        type: 'ticket',
        title: 'New Ticket Created',
        message: `Client ${user?.displayName || user?.email} created a new ticket: ${ticketPayload.subject}`,
        link: `/admin?ticket=${docRef.id}`
      });
      
      // Reset form and navigate
      setCurrentStep(1);
      setActiveTab('my-tickets');
      setActiveSubTab(null);
      setTicketData({
        serviceType: 'On-Demand Dispatch',
        estimatedDuration: '',
        priority: 'Medium',
        subject: '',
        description: '',
        country: '',
        city: '',
        location: '',
        contactEmail: user?.email || '',
        contactPhone: '',
        ticketNumber: '',
        dateTime: '',
        attachments: []
      });
    } catch (error) {
      console.error("Error submitting ticket:", error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit ticket'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptQuote = async (ticketId: string) => {
    try {
      const isEngineerAssigned = !!selectedTicket?.engineerName;
      
      await updateDoc(doc(db, "tickets", ticketId), {
        "quote.status": 'Accepted',
        status: isEngineerAssigned ? 'In Progress' : 'Quote Accepted',
        updatedAt: serverTimestamp(),
        updates: [
          ...(selectedTicket?.updates || []),
          { 
            text: `Client accepted the quotation.${isEngineerAssigned ? ' Ticket moved to In Progress.' : ''}`, 
            timestamp: new Date().toISOString(), 
            author: 'Client' 
          }
        ]
      });

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'quote_accepted',
          title: 'Quote Accepted',
          description: `Client accepted the quote for Ticket #${ticketId.substring(0, 6)}${isEngineerAssigned ? ' and moved to In Progress' : ''}`,
          userId: user?.uid || auth.currentUser?.uid,
          userName: user?.displayName || user?.email,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }

      addNotification({
        type: 'success',
        title: 'Quote Accepted',
        message: 'The quotation has been accepted. We will now proceed with assigning an engineer.'
      });

      // Notify Admins
      notifyAdmins({
        type: 'success',
        title: 'Quote Accepted',
        message: `Client ${user?.displayName || user?.email} accepted the quote for Ticket #${ticketId.substring(0, 6)}`,
        link: `/admin?ticket=${ticketId}`
      });

      setShowTicketReview(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error accepting quote:", error);
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to accept quotation.'
      });
    }
  };

  const handleDeclineQuote = async (ticketId: string) => {
    try {
      await updateDoc(doc(db, "tickets", ticketId), {
        "quote.status": 'Declined',
        status: 'Rejected',
        updatedAt: serverTimestamp(),
        updates: [
          ...(selectedTicket?.updates || []),
          { text: 'Client declined the quotation.', timestamp: new Date().toISOString(), author: 'Client' }
        ]
      });

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'quote_declined',
          title: 'Quote Declined',
          description: `Client declined the quote for Ticket #${ticketId.substring(0, 6)}`,
          userId: user?.uid || auth.currentUser?.uid,
          userName: user?.displayName || user?.email,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }

      addNotification({
        type: 'success',
        title: 'Quote Declined',
        message: 'The quotation has been declined.'
      });

      // Notify Admins
      notifyAdmins({
        type: 'error',
        title: 'Quote Declined',
        message: `Client ${user?.displayName || user?.email} declined the quote for Ticket #${ticketId.substring(0, 6)}`,
        link: `/admin?ticket=${ticketId}`
      });

      setShowTicketReview(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error declining quote:", error);
      addNotification({
        type: 'error',
        title: 'Action Failed',
        message: 'Failed to decline quotation.'
      });
    }
  };

  const handleAddUpdate = async (ticketId: string) => {
    if (!newUpdateText.trim()) return;
    
    setIsAddingUpdate(true);
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      const update = {
        text: newUpdateText,
        timestamp: new Date().toISOString(),
        author: 'Client'
      };

      await updateDoc(ticketRef, {
        updates: [
          ...(selectedTicket?.updates || []),
          update
        ],
        updatedAt: serverTimestamp()
      });

      // Log activity
      try {
        await addDoc(collection(db, "activities"), {
          type: 'ticket_update',
          title: 'Ticket Updated by Client',
          description: `Client added an update to Ticket #${ticketId.substring(0, 6)}`,
          userId: user?.uid || auth.currentUser?.uid,
          userName: user?.displayName || user?.email,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "activities");
      }

      setNewUpdateText('');
      addNotification({
        type: 'success',
        title: 'Update Sent',
        message: 'Your update has been sent successfully.'
      });
      
      // Update local state for immediate feedback
      setSelectedTicket((prev: any) => ({
        ...prev,
        updates: [...(prev?.updates || []), update]
      }));
    } catch (error) {
      console.error("Error adding update:", error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to send update. Please try again.'
      });
    } finally {
      setIsAddingUpdate(false);
    }
  };

  const serviceTypeLabels: Record<string, string> = {
    'On-Demand Dispatch': t.clientPortal.logTicket.options.serviceTypes.onDemand,
    'Project-Based': t.clientPortal.logTicket.options.serviceTypes.project,
    'Maintenance': t.clientPortal.logTicket.options.serviceTypes.maintenance,
    'Hourly': t.clientPortal.logTicket.options.serviceTypes.hourly,
    'Half Day': t.clientPortal.logTicket.options.serviceTypes.halfDay,
    'Full Day': t.clientPortal.logTicket.options.serviceTypes.fullDay
  };

  const priorityLabels: Record<string, string> = {
    'Low': t.clientPortal.logTicket.options.priorities.low,
    'Medium': t.clientPortal.logTicket.options.priorities.medium,
    'High': t.clientPortal.logTicket.options.priorities.high,
    'Critical (SLA)': t.clientPortal.logTicket.options.priorities.critical
  };

  const renderContent = () => {
    if (activeSubTab && activeTab !== 'home') {
      // Special case for Location sub-tab in Company Profile
      if (activeTab === 'company-profile' && activeSubTab === t.clientPortal.subItems.companyProfile.location) {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveSubTab(null)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {navigation.find(n => n.id === activeTab)?.name || activeTab}
                </div>
                <h2 className="text-2xl font-bold text-black">{activeSubTab}</h2>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.companyProfile.country}</label>
                  <p className="p-4 bg-slate-50 rounded-xl font-semibold text-slate-900">{user?.country || 'United States'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.companyProfile.city}</label>
                  <p className="p-4 bg-slate-50 rounded-xl font-semibold text-slate-900">{user?.city || 'Silicon Valley'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.companyProfile.location}</label>
                <p className="p-4 bg-slate-50 rounded-xl font-semibold text-slate-900 leading-relaxed">
                  {user?.location || '123 Business Avenue, Suite 500, Silicon Valley, CA 94025, United States'}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // My Tickets Sub-tabs
      if (activeTab === 'my-tickets') {
        if (activeSubTab === t.clientPortal.subItems.myTickets.list) {
          return (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {navigation.find(n => n.id === activeTab)?.name || activeTab}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.id}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.subject}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.status}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.engineer}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.date}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="p-4 font-bold text-slate-700 flex items-center gap-2">
                          {ticket.id.slice(0, 5).toUpperCase()}
                          {ticket.createdAt && (new Date().getTime() - (ticket.createdAt?.seconds ? ticket.createdAt.seconds * 1000 : new Date(ticket.createdAt).getTime()) < 24 * 60 * 60 * 1000) && (
                            <span className="px-1.5 py-0.5 bg-brand-teal text-brand-dark text-[8px] font-black uppercase rounded animate-pulse">New</span>
                          )}
                        </td>
                        <td className={`p-4 transition-all duration-500 ${ticket.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                          {ticket.subject}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            ticket.status === 'Completed' || ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                            ticket.status === 'On Site' ? 'bg-amber-100 text-amber-700' :
                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'Assigned' ? 'bg-indigo-100 text-indigo-700' :
                            ticket.status === 'Quote Accepted' ? 'bg-emerald-50 text-emerald-600' :
                            ticket.status === 'Quoted' || ticket.status === 'Waiting for client approval' ? 'bg-purple-100 text-purple-700' :
                            ticket.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.status === 'Completed' ? t.clientPortal.myTickets.status.completed :
                             ticket.status === 'Resolved' ? t.clientPortal.myTickets.status.resolved :
                             ticket.status === 'On Site' ? t.clientPortal.myTickets.status.onSite :
                             ticket.status === 'Assigned' ? t.clientPortal.myTickets.status.assigned :
                             ticket.status === 'Quote Accepted' ? t.clientPortal.myTickets.status.quoteAccepted :
                             ticket.status === 'Quoted' || ticket.status === 'Waiting for client approval' ? 'Waiting for Approval' :
                             ticket.status === 'Approved' ? t.clientPortal.myTickets.status.approved :
                             ticket.status === 'Rejected' ? t.clientPortal.myTickets.status.rejected :
                             ticket.status === 'In Progress' ? t.clientPortal.myTickets.status.inProgress :
                             t.clientPortal.myTickets.status.open}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">{ticket.engineerName || 'Unassigned'}</td>
                        <td className="p-4 text-slate-500 text-sm">
                          {ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
        if (activeSubTab === t.clientPortal.subItems.myTickets.engineer) {
          return (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{activeTab}</div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tickets.filter(t => t.engineerName).length > 0 ? tickets.filter(t => t.engineerName).map((ticket) => {
                  const engineerData = engineers.find(e => e.displayName === ticket.engineerName || e.fullName === ticket.engineerName);
                  return (
                    <div 
                      key={ticket.id} 
                      onClick={() => {
                        if (engineerData) {
                          setSelectedEngineer(engineerData);
                          setShowEngineerModal(true);
                        }
                      }}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-brand-teal/50 transition-all group"
                    >
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 overflow-hidden">
                        {engineerData?.photoURL || engineerData?.profilePic ? (
                          <img src={engineerData.photoURL || engineerData.profilePic} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-brand-teal transition-colors">{ticket.engineerName}</h4>
                        <p className="text-sm text-slate-500">Assigned to: {ticket.subject}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase">Verified Engineer</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                    No engineers currently assigned to your tickets.
                  </div>
                )}
              </div>
            </div>
          );
        }
        if (activeSubTab === t.clientPortal.subItems.myTickets.comments) {
          return (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{activeTab}</div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
                {tickets.length > 0 ? tickets.slice(0, 3).map((ticket) => (
                  <div key={ticket.id} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                      <h4 className="font-bold text-slate-900">{ticket.subject}</h4>
                      <span className="text-xs text-slate-400">Ticket ID: {ticket.id.slice(0,5).toUpperCase()}</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold">DN</div>
                        <div className="flex-1 bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                          <p className="text-sm text-slate-600">We have received your request and an engineer has been assigned. They will be on-site as scheduled.</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">DeskLink Support • 2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 text-slate-400">No recent comments or updates.</div>
                )}
              </div>
            </div>
          );
        }
        if (activeSubTab === t.clientPortal.subItems.myTickets.completion) {
          return (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{activeTab}</div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket ID</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Date</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.filter(t => t.status === 'Completed' || t.status === 'Resolved').length > 0 ? 
                      tickets.filter(t => t.status === 'Completed' || t.status === 'Resolved').map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-700">{ticket.id.slice(0, 5).toUpperCase()}</td>
                          <td className={`p-4 transition-all duration-500 ${ticket.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                            {ticket.subject}
                          </td>
                          <td className="p-4 text-slate-500 text-sm">
                            {ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowFeedbackModal(true);
                              }}
                              className="px-4 py-2 bg-[#009688] text-white text-xs font-bold rounded-lg hover:bg-[#00796B] transition-all"
                            >
                              Give Feedback
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="p-10 text-center text-slate-400">No completed tickets awaiting feedback.</td>
                        </tr>
                      )
                    }
                  </tbody>
                </table>
              </div>
            </div>
          );
        }
      }

      // Company Profile Sub-tabs
      if (activeTab === 'company-profile') {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{activeTab}</div>
                <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              {activeSubTab === t.clientPortal.subItems.companyProfile.details && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.companyProfile.generalInfo}</label>
                    <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Company Name</span>
                        <span className="text-sm font-bold text-slate-900">{user?.companyName || 'Global Tech Solutions'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.industry}</span>
                        <span className="text-sm font-bold text-slate-900">{user?.industry || 'Information Technology'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.employees}</span>
                        <span className="text-sm font-bold text-slate-900">{user?.companySize || '500 - 1000'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Online Presence</label>
                    <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.website}</span>
                        <span className="text-sm font-bold text-[#009688]">{user?.website || `www.${(user?.companyName || 'globaltech').toLowerCase().replace(/\s+/g, '')}.com`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">LinkedIn</span>
                        <span className="text-sm font-bold text-[#009688]">linkedin.com/company/{(user?.companyName || 'globaltech').toLowerCase().replace(/\s+/g, '')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {activeSubTab === t.clientPortal.subItems.companyProfile.billing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax Information</label>
                    <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Tax ID / VAT</span>
                        <span className="text-sm font-bold text-slate-900">US-998877665</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Currency</span>
                        <span className="text-sm font-bold text-slate-900">USD</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Billing Address</label>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        123 Business Avenue, Suite 500, Silicon Valley, CA 94025, United States
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.companyProfile.operating && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Regions</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['United States', 'United Kingdom', 'Germany', 'Singapore', 'Japan', 'Australia', 'Canada', 'France'].map(country => (
                      <div key={country} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-sm font-bold text-slate-700">{country}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.companyProfile.industry && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Industry Classification</label>
                  <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {user?.companyName || 'Global Tech Solutions'} operates primarily in the <span className="font-bold text-slate-900">{user?.industry || 'Information Technology & Services'}</span> sector, with a focus on enterprise cloud infrastructure and global network management.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Cloud Computing', 'Cybersecurity', 'Network Infrastructure', 'Managed IT'].map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Services & Rates Sub-tabs
      if (activeTab === 'services') {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {navigation.find(n => n.id === activeTab)?.name || activeTab}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              {activeSubTab === t.clientPortal.subItems.services.catalog && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'L1 Support Dispatch', desc: 'Basic hardware replacement and site checks.' },
                    { name: 'L2 Network Engineering', desc: 'Configuration and troubleshooting of network devices.' },
                    { name: 'Data Center Smart Hands', desc: 'Physical assistance in data center environments.' },
                    { name: 'Site Surveys & Audits', desc: 'Comprehensive site documentation and assessment.' },
                    { name: 'IMAC Services', desc: 'Install, Move, Add, Change for IT equipment.' },
                    { name: 'Project Management', desc: 'End-to-end coordination of complex IT rollouts.' }
                  ].map(service => (
                    <div key={service.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#009688]/30 transition-all group">
                      <h4 className="font-bold text-slate-900 group-hover:text-[#009688] transition-colors">{service.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{service.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.services.models && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'On-Demand', desc: 'Pay-as-you-go dispatch for urgent needs.', icon: Zap },
                    { title: 'Project-Based', desc: 'Fixed-price or T&M for specific projects.', icon: Briefcase },
                    { title: 'Managed Services', desc: 'Retainer-based continuous support.', icon: Layers }
                  ].map(model => (
                    <div key={model.title} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#009688] mx-auto shadow-sm">
                        <model.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-900">{model.title}</h4>
                      <p className="text-xs text-slate-500">{model.desc}</p>
                    </div>
                  ))}
                </div>
              )}              {activeSubTab === t.clientPortal.subItems.services.coverage && (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold">Global Presence</h4>
                      <p className="text-slate-400 text-sm">Verified engineers in 92+ countries across all continents.</p>
                    </div>
                    <Globe className="w-12 h-12 text-brand-teal opacity-50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Americas', 'EMEA', 'Asia Pacific'].map(region => (
                      <div key={region} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h5 className="font-bold text-slate-900 mb-2">{region}</h5>
                        <ul className="text-xs text-slate-500 space-y-1">
                          <li>• Full country coverage</li>
                          <li>• 24/7 Dispatch available</li>
                          <li>• Local language support</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      // Opportunities Sub-tabs
      if (activeTab === 'opportunities') {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {navigation.find(n => n.id === activeTab)?.name || activeTab}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              {(activeSubTab === t.clientPortal.subItems.opportunities.dispatch || 
                activeSubTab === t.clientPortal.subItems.opportunities.project ||
                activeSubTab === t.clientPortal.subItems.opportunities.contract ||
                activeSubTab === t.clientPortal.subItems.opportunities.fte ||
                activeSubTab === t.clientPortal.subItems.opportunities.msp) && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">Active {activeSubTab}</h4>
                    <button 
                      onClick={() => {
                        setNewOpp(prev => ({ ...prev, type: activeSubTab }));
                        setShowCreateOppModal(true);
                      }}
                      className="px-4 py-2 bg-[#009688] text-white text-xs font-bold rounded-lg hover:bg-[#00796B] transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create New
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900">Sample Opportunity {i}</h5>
                            <p className="text-xs text-slate-400">Created on: March 0{i}, 2026</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Under Review</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.opportunities.tracking && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Draft', count: 2, color: 'bg-slate-100 text-slate-600' },
                      { label: 'In Review', count: 5, color: 'bg-blue-100 text-blue-600' },
                      { label: 'Active', count: 8, color: 'bg-emerald-100 text-emerald-600' },
                      { label: 'Closed', count: 12, color: 'bg-gray-100 text-gray-400' }
                    ].map(stat => (
                      <div key={stat.label} className="p-4 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
                        <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2 text-xs font-bold`}>{stat.count}</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-64 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-6">Opportunity Pipeline</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Jan', value: 400 },
                        { name: 'Feb', value: 300 },
                        { name: 'Mar', value: 600 },
                        { name: 'Apr', value: 800 },
                        { name: 'May', value: 500 },
                        { name: 'Jun', value: 900 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="value" fill="#009688" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      }

      // Billing Sub-tabs
      if (activeTab === 'billing') {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {navigation.find(n => n.id === activeTab)?.name || activeTab}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              {activeSubTab === t.clientPortal.subItems.billing.advice && (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-800">New billing advice ready for March 2026</p>
                    </div>
                    <button className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg">Review Now</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900">Advice #BA-2026-0{i}</h5>
                            <p className="text-xs text-slate-400">Feb 2026 Period</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">$1,450.00</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.billing.approval && (
                <div className="space-y-6">
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">No pending approvals at this time.</p>
                    <p className="text-xs text-slate-400 mt-1">All billing advice has been processed.</p>
                  </div>
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.billing.invoices && (
                <div className="space-y-4">
                  {invoices.map(inv => (
                    <div key={inv.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900">INV-{inv.id.slice(0, 4).toUpperCase()}</h5>
                          <p className="text-xs text-slate-400">{inv.createdAt ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-bold text-slate-900">{inv.amount}</span>
                        <button className="p-2 text-[#009688] hover:bg-[#009688]/10 rounded-lg transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}


              {activeSubTab === t.clientPortal.subItems.billing.history && (
                <div className="space-y-4">
                  {[2025, 2024].map(year => (
                    <div key={year} className="space-y-2">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{year} Archive</h5>
                      <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">Annual Billing Summary {year}</span>
                        <button className="text-xs font-bold text-[#009688] hover:underline">Download PDF</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      // User Management Page
      if (activeTab === 'user-management') {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.clientPortal.userManagement.title}</h2>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Active Users</h4>
                  <div className="flex gap-4 items-center">
                    {userSearch && (
                      <button 
                        onClick={() => setUserSearch('')}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-[#009688]/50 w-64"
                      />
                    </div>
                    <button onClick={() => setShowAddUserModal(true)} className="px-4 py-2 bg-[#009688] text-white text-xs font-bold rounded-lg flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Add User
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subUsers
                    .filter(u => 
                      (u.displayName?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
                      (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())
                    )
                    .map(u => (
                    <div key={u.email} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{u.displayName}</h5>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <button className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {subUsers.filter(u => 
                    (u.displayName?.toLowerCase() || '').includes(userSearch.toLowerCase()) || 
                    (u.email?.toLowerCase() || '').includes(userSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400 italic">
                      {userSearch ? 'No users matching your search.' : t.clientPortal.userManagement.noUsers}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-6">
                <h4 className="font-bold text-slate-900">Access Control</h4>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">Two-Factor Authentication</h5>
                      <p className="text-xs text-slate-500">Require 2FA for all sub-users.</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">IP Whitelisting</h5>
                      <p className="text-xs text-slate-500">Restrict access to specific IP ranges.</p>
                    </div>
                    <button className="text-xs font-bold text-[#009688] hover:underline">Configure</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Help & Support Sub-tabs
      if (activeTab === 'help') {
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveSubTab(null)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#009688] hover:border-[#009688]/30 transition-all">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {navigation.find(n => n.id === activeTab)?.name || activeTab}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{activeSubTab}</h2>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
              {activeSubTab === t.clientPortal.subItems.help.howItWorks && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {t.clientPortal.help.howItWorksItems.map((s: any) => (
                    <div key={s.step} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <span className="text-2xl font-black text-[#009688]/20">{s.step}</span>
                      <h5 className="font-bold text-slate-900">{s.title}</h5>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.help.faqs && (
                <div className="space-y-4">
                  {t.clientPortal.help.faqItems.map((faq: any, i: number) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <h5 className="font-bold text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#009688]" />
                        {faq.q}
                      </h5>
                      <p className="text-sm text-slate-600 pl-6">{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.help.contact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-[#009688] text-white rounded-2xl space-y-4">
                    <h4 className="font-bold text-lg">{t.clientPortal.help.supportCenter}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-white/60" />
                        <span className="font-bold">support@desklink.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-white/60" />
                        <span className="font-bold">+1 (800) 123-4567</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4">
                    <h4 className="font-bold text-lg">{t.clientPortal.help.accountManager}</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-brand-teal" />
                      </div>
                      <div>
                        <h5 className="font-bold">{t.clientPortal.help.managerName}</h5>
                        <p className="text-xs text-slate-400">{t.clientPortal.help.managerRole}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === t.clientPortal.subItems.help.guidelines && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-900">Portal Usage Guidelines</h4>
                  <ul className="text-sm text-slate-600 space-y-3 list-disc pl-5">
                    <li>Always provide clear site access instructions for engineers.</li>
                    <li>Ensure a local site contact is available and reachable.</li>
                    <li>Upload relevant site documentation to the ticket.</li>
                    <li>Review and approve billing advice within 5 business days.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      }

    }

    const serviceTypeLabels: Record<string, string> = {
      'On-Demand Dispatch': t.clientPortal.logTicket.options.serviceTypes.onDemand,
      'Project-Based': t.clientPortal.logTicket.options.serviceTypes.project,
      'Maintenance': t.clientPortal.logTicket.options.serviceTypes.maintenance,
      'Hourly': t.clientPortal.logTicket.options.serviceTypes.hourly,
      'Half Day': t.clientPortal.logTicket.options.serviceTypes.halfDay,
      'Full Day': t.clientPortal.logTicket.options.serviceTypes.fullDay
    };

    const formatDateTime = (dateTimeStr: string) => {
      if (!dateTimeStr) return '';
      try {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(date);
      } catch (e) {
        return dateTimeStr;
      }
    };

    const priorityLabels: Record<string, string> = {
      'Low': t.clientPortal.logTicket.options.priorities.low,
      'Medium': t.clientPortal.logTicket.options.priorities.medium,
      'High': t.clientPortal.logTicket.options.priorities.high,
      'Critical (SLA)': t.clientPortal.logTicket.options.priorities.critical
    };

    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 bg-brand-teal rounded-2xl flex items-center justify-center text-brand-dark shadow-lg shadow-brand-teal/20">
                  <Home className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{t.clientPortal.welcome}, {user?.name || t.clientPortal.guest}</h1>
                  <p className="text-slate-500 font-medium">{t.clientPortal.subtitle}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('log-ticket')}
                className="px-8 py-4 bg-brand-teal text-brand-dark font-black rounded-2xl hover:bg-teal-300 transition-all shadow-lg shadow-brand-teal/20 flex items-center gap-2 group"
              >
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                {t.clientPortal.logTicket.title}
              </button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal group-hover:bg-brand-teal group-hover:text-brand-dark transition-all duration-500">
                        <Ticket className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.clientPortal.stats.activeTickets}</span>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{tickets.filter(t => t.status !== 'Completed' && t.status !== 'Resolved').length}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 w-fit px-3 py-1.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{t.clientPortal.stats.activeTicketsDesc}</span>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t.clientPortal.stats.teamMembers}</span>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{subUsers.length + 1}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-50 w-fit px-3 py-1.5 rounded-full">
                      <Shield className="w-3.5 h-3.5" />
                      <span>{t.clientPortal.stats.teamMembersDesc}</span>
                    </div>
                  </div>
                </div>

                {/* Recent Tickets */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-900">{t.clientPortal.myTickets.title}</h3>
                    <button onClick={() => setActiveTab('my-tickets')} className="text-brand-teal text-sm font-bold hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {tickets.slice(0, 5).map((ticket, i) => (
                      <div key={ticket.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setSelectedTicket(ticket); setActiveTab('my-tickets'); setActiveSubTab(t.clientPortal.subItems.myTickets.list); }}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs ${
                            ticket.priority === 'High' ? 'bg-rose-50 text-rose-500' : 
                            ticket.priority === 'Medium' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                          }`}>
                            {ticket.priority.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-brand-teal transition-colors">{ticket.subject}</p>
                            <p className="text-xs text-slate-500">#{ticket.id.slice(0, 6).toUpperCase()} • {ticket.status}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-all" />
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
                  <ActivityFeed userId={user?.uid} role="client" />
                </div>

                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                  <h3 className="text-lg font-black mb-2 relative z-10">Network Health</h3>
                  <p className="text-xs text-slate-400 mb-6 relative z-10">Connected to DeskLink Global. Latency: 18ms</p>
                  <div className="space-y-4 relative z-10">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-brand-teal" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Status</span>
                      <span className="text-brand-teal">Optimal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'log-ticket':
        const steps = [
          { id: 1, name: t.clientPortal.logTicket.steps.service, icon: Zap },
          { id: 2, name: t.clientPortal.logTicket.steps.location, icon: MapPin },
          { id: 3, name: t.clientPortal.logTicket.steps.contact, icon: Mail },
          { id: 4, name: t.clientPortal.logTicket.steps.details, icon: FileText },
          { id: 5, name: t.clientPortal.logTicket.steps.review, icon: CheckCircle },
        ];

        const countries = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
        const cities = ticketData.country 
          ? City.getCitiesOfCountry(ticketData.country)?.map(c => ({ value: c.name, label: c.name })) || []
          : [];

        const isStepValid = () => {
          switch (currentStep) {
            case 1: return ticketData.serviceType && ticketData.priority;
            case 2: return ticketData.country && ticketData.city;
            case 3: return ticketData.contactEmail;
            case 4: return ticketData.subject && ticketData.description;
            default: return true;
          }
        };

        return (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <h2 className="text-2xl font-bold text-black">{t.clientPortal.logTicket.title}</h2>
              <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                {steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold transition-all ${
                        currentStep === step.id ? 'bg-[#009688] text-white shadow-lg shadow-[#009688]/20' :
                        currentStep > step.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {currentStep > step.id ? <CheckCircle className="w-3 h-3 md:w-4 md:h-4" /> : step.id}
                      </div>
                      <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tighter ${currentStep === step.id ? 'text-[#009688]' : 'text-slate-400'}`}>
                        {step.name}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-4 md:w-8 h-[2px] mb-4 shrink-0 ${currentStep > step.id ? 'bg-emerald-100' : 'bg-slate-100'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {currentStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.serviceType}</label>
                        <select 
                          value={ticketData.serviceType}
                          onChange={(e) => setTicketData({...ticketData, serviceType: e.target.value})}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all"
                        >
                          <option value="On-Demand Dispatch">{t.clientPortal.logTicket.options.serviceTypes.onDemand}</option>
                          <option value="Project-Based">{t.clientPortal.logTicket.options.serviceTypes.project}</option>
                          <option value="Maintenance">{t.clientPortal.logTicket.options.serviceTypes.maintenance}</option>
                          <option value="Hourly">{t.clientPortal.logTicket.options.serviceTypes.hourly}</option>
                          <option value="Half Day">{t.clientPortal.logTicket.options.serviceTypes.halfDay}</option>
                          <option value="Full Day">{t.clientPortal.logTicket.options.serviceTypes.fullDay}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.priority}</label>
                        <select 
                          value={ticketData.priority}
                          onChange={(e) => setTicketData({...ticketData, priority: e.target.value})}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all"
                        >
                          <option value="Low">{t.clientPortal.logTicket.options.priorities.low}</option>
                          <option value="Medium">{t.clientPortal.logTicket.options.priorities.medium}</option>
                          <option value="High">{t.clientPortal.logTicket.options.priorities.high}</option>
                          <option value="Critical (SLA)">{t.clientPortal.logTicket.options.priorities.critical}</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.estimatedDuration}</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            name="estimatedDuration"
                            value={ticketData.estimatedDuration}
                            onChange={handleTicketInputChange}
                            placeholder={t.clientPortal.logTicket.placeholders.estimatedDuration} 
                            className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.country}</label>
                        <Select
                          options={countries}
                          value={countries.find(c => c.value === ticketData.country)}
                          onChange={(val: any) => setTicketData({...ticketData, country: val?.value || '', city: ''})}
                          placeholder={t.clientPortal.logTicket.placeholders.country}
                          styles={customSelectStyles}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.city}</label>
                        <Select
                          options={cities}
                          value={cities.find(c => c.value === ticketData.city)}
                          onChange={(val: any) => setTicketData({...ticketData, city: val?.value || ''})}
                          placeholder={t.clientPortal.logTicket.placeholders.city}
                          isDisabled={!ticketData.country}
                          styles={customSelectStyles}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.location}</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            value={ticketData.location}
                            onChange={(e) => setTicketData({...ticketData, location: e.target.value})}
                            placeholder={t.clientPortal.logTicket.placeholders.location} 
                            className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.contactEmail}</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="email" 
                            value={ticketData.contactEmail}
                            onChange={(e) => setTicketData({...ticketData, contactEmail: e.target.value})}
                            placeholder={t.clientPortal.logTicket.placeholders.contactEmail} 
                            className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.contactPhone}</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="tel" 
                            name="contactPhone"
                            value={ticketData.contactPhone}
                            onChange={handleTicketInputChange}
                            placeholder={t.clientPortal.logTicket.placeholders.contactPhone} 
                            className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.ticketNumber}</label>
                          <div className="relative">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              name="ticketNumber"
                              value={ticketData.ticketNumber}
                              onChange={handleTicketInputChange}
                              placeholder={t.clientPortal.logTicket.placeholders.ticketNumber} 
                              className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.dateTime}</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="datetime-local" 
                              value={ticketData.dateTime}
                              onChange={(e) => setTicketData({...ticketData, dateTime: e.target.value})}
                              className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.subject}</label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            name="subject"
                            value={ticketData.subject}
                            onChange={handleTicketInputChange}
                            placeholder={t.clientPortal.logTicket.placeholders.subject} 
                            className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">{t.clientPortal.logTicket.description}</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-4 top-5 w-4 h-4 text-slate-400" />
                          <textarea 
                            rows={4} 
                            value={ticketData.description}
                            onChange={(e) => setTicketData({...ticketData, description: e.target.value})}
                            className="w-full p-3 !pl-16 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all resize-none" 
                            placeholder={t.clientPortal.logTicket.placeholders.description}
                            required
                          ></textarea>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Attachments (Photos/Documents)</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {ticketData.attachments.map((file, idx) => (
                            <div key={idx} className="relative aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group">
                              {file.type.startsWith('image/') ? (
                                <img src={file.data} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <FileText className="w-8 h-8" />
                                </div>
                              )}
                              <button 
                                onClick={() => setTicketData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                                className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                                <p className="text-[8px] text-white truncate">{file.name}</p>
                              </div>
                            </div>
                          ))}
                          <label className="aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-brand-teal/50 hover:text-brand-teal cursor-pointer transition-all">
                            <Plus className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Upload</span>
                            <input 
                              type="file" 
                              multiple 
                              className="hidden" 
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) {
                                  Array.from(files).forEach(file => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setTicketData(prev => ({
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
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep >= 5 && (
                    <div className="space-y-6">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.serviceType}</p>
                            <p className="font-semibold text-slate-900">{serviceTypeLabels[ticketData.serviceType] || ticketData.serviceType}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.priority}</p>
                            <p className="font-semibold text-slate-900">{priorityLabels[ticketData.priority] || ticketData.priority}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.estimatedDuration}</p>
                            <p className="font-semibold text-slate-900">{ticketData.estimatedDuration}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.country}</p>
                            <p className="font-semibold text-slate-900">{countries.find(c => c.value === ticketData.country)?.label || ticketData.country}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.city}</p>
                            <p className="font-semibold text-slate-900">{ticketData.city}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.ticketNumber}</p>
                            <p className="font-semibold text-slate-900">{ticketData.ticketNumber}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.contactEmail}</p>
                            <p className="font-semibold text-slate-900">{ticketData.contactEmail}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.contactPhone}</p>
                            <p className="font-semibold text-slate-900">{ticketData.contactPhone}</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-200">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.subject}</p>
                          <p className="font-semibold text-slate-900">{ticketData.subject}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.description}</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{ticketData.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.location}</p>
                            <p className="font-semibold text-slate-900">{ticketData.location}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.clientPortal.logTicket.dateTime}</p>
                            <p className="font-semibold text-slate-900">{formatDateTime(ticketData.dateTime)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-6">
                    {currentStep > 1 && (
                      <button 
                        onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                      >
                        {t.clientPortal.common.back}
                      </button>
                    )}
                    {currentStep < 5 ? (
                      <button 
                        onClick={() => setCurrentStep(prev => Math.min(prev + 1, 5))}
                        disabled={!isStepValid()}
                        className="flex-1 py-4 bg-[#009688] text-white font-semibold rounded-xl hover:bg-[#00796B] transition-all shadow-lg shadow-[#009688]/20 disabled:opacity-50"
                      >
                        {t.signup.continue}
                      </button>
                    ) : (
                      <button 
                        onClick={handleTicketSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-4 bg-[#009688] text-white font-semibold rounded-xl hover:bg-[#00796B] transition-all shadow-lg shadow-[#009688]/20 disabled:opacity-50"
                      >
                        {isSubmitting ? t.clientPortal.logTicket.submitting : t.clientPortal.logTicket.confirm}
                      </button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        );
      case 'my-tickets':
        return (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-black">{t.clientPortal.myTickets.title}</h2>
              <div className="flex flex-wrap items-center gap-3">
                {(ticketSearch || statusFilter !== 'All' || priorityFilter !== 'All' || categoryFilter !== 'All') && (
                  <button 
                    onClick={() => {
                      setTicketSearch('');
                      setStatusFilter('All');
                      setPriorityFilter('All');
                      setCategoryFilter('All');
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t.clientPortal.myTickets.filters.search}
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#009688]/50 w-full md:w-64 shadow-sm"
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-[#009688] text-white border-[#009688]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.myTickets.filters.status}</label>
                      <div className="flex flex-wrap gap-2">
                        {['All', 'Open', 'In Progress', 'Resolved', 'Completed'].map(status => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              statusFilter === status 
                                ? 'bg-[#009688] text-white' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {status === 'All' ? t.clientPortal.myTickets.filters.all : 
                             status === 'Open' ? t.clientPortal.myTickets.status.open :
                             status === 'In Progress' ? t.clientPortal.myTickets.status.inProgress :
                             status === 'Resolved' ? t.clientPortal.myTickets.status.resolved :
                             t.clientPortal.myTickets.status.completed}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.myTickets.filters.priority}</label>
                      <div className="flex flex-wrap gap-2">
                        {['All', 'Low', 'Medium', 'High', 'Critical'].map(priority => (
                          <button
                            key={priority}
                            onClick={() => setPriorityFilter(priority)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              priorityFilter === priority 
                                ? 'bg-[#009688] text-white' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {priority === 'All' ? t.clientPortal.myTickets.filters.all : priority}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                      <div className="flex flex-wrap gap-2">
                        {['All', 'Hardware', 'Software', 'Network', 'Security', 'Other'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              categoryFilter === cat 
                                ? 'bg-[#009688] text-white' 
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.id}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.subject}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.type}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.priority}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.status}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.engineer}</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.clientPortal.myTickets.table.date}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowTicketReview(true);
                        }}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="p-4 font-bold text-slate-700 text-sm">#{ticket.id.slice(0, 5).toUpperCase()}</td>
                        <td className="p-4">
                          <div className={`font-semibold transition-all duration-500 ${ticket.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                            {ticket.subject}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{ticket.description}</div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-600">{ticket.serviceType || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            ticket.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                            ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                            ticket.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            ticket.status === 'Completed' || ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                            ticket.status === 'On Site' ? 'bg-amber-100 text-amber-700' :
                            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            ticket.status === 'Assigned' ? 'bg-indigo-100 text-indigo-700' :
                            ticket.status === 'Quote Accepted' ? 'bg-emerald-50 text-emerald-600' :
                            ticket.status === 'Quoted' || ticket.status === 'Waiting for client approval' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.status === 'Completed' ? t.clientPortal.myTickets.status.completed : 
                             ticket.status === 'Resolved' ? t.clientPortal.myTickets.status.resolved :
                             ticket.status === 'On Site' ? t.clientPortal.myTickets.status.onSite :
                             ticket.status === 'Assigned' ? t.clientPortal.myTickets.status.assigned :
                             ticket.status === 'Quote Accepted' ? t.clientPortal.myTickets.status.quoteAccepted :
                             ticket.status === 'Quoted' || ticket.status === 'Waiting for client approval' ? 'Waiting for Approval' :
                             ticket.status === 'In Progress' ? t.clientPortal.myTickets.status.inProgress :
                             t.clientPortal.myTickets.status.open}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {ticket.engineerName?.charAt(0) || 'U'}
                            </div>
                            <span>{ticket.engineerName || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          {ticket.createdAt ? (
                            typeof ticket.createdAt === 'string' 
                              ? new Date(ticket.createdAt).toLocaleDateString() 
                              : ticket.createdAt.seconds 
                                ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() 
                                : 'N/A'
                          ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Ticket className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">{t.clientPortal.common.noData}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'services':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-black">{t.clientPortal.services.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { ...t.clientPortal.services.onDemand, icon: Truck },
                { ...t.clientPortal.services.project, icon: Briefcase },
                { ...t.clientPortal.services.managed, icon: Layers },
              ].map((service) => (
                <div key={service.title} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-[#009688]/10 rounded-xl flex items-center justify-center text-[#009688] mb-4">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-black mb-2">{service.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{service.desc}</p>
                  <div className="text-lg font-black text-[#009688]">{service.price}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#1E293B] text-white p-8 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <Globe className="w-8 h-8 text-brand-teal" />
                <h3 className="text-xl font-bold">{t.clientPortal.services.coverage.title}</h3>
              </div>
              <p className="text-slate-400 mb-6">{t.clientPortal.services.coverage.desc}</p>
              <button className="px-6 py-3 bg-brand-teal text-brand-dark font-semibold rounded-xl hover:bg-brand-teal/90 transition-all">
                {t.clientPortal.services.coverage.cta}
              </button>
            </div>
          </div>
        );
      case 'billing':
        const currentBalance = invoices.filter(i => i.status !== 'Paid').reduce((sum, i) => sum + parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0'), 0);
        const pendingAdvice = invoices.filter(i => i.status === 'Pending').length;

        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-black">{t.clientPortal.billing.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.clientPortal.billing.balance}</p>
                <div className="text-3xl font-bold text-slate-900">${currentBalance.toLocaleString()}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.clientPortal.billing.pending}</p>
                <div className="text-3xl font-bold text-orange-500">{pendingAdvice}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.clientPortal.billing.nextBilling}</p>
                <div className="text-3xl font-bold text-slate-900">Apr 01</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{t.clientPortal.billing.recentInvoices}</h3>
                <button className="text-[#009688] text-sm font-semibold hover:underline">{t.clientPortal.common.viewAll}</button>
              </div>
              <div className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">INV-{inv.id.slice(0, 4).toUpperCase()}</p>
                        <p className="text-xs text-slate-400">{inv.createdAt ? new Date(inv.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{inv.amount}</p>
                      <span className={`text-[10px] font-bold uppercase ${inv.status === 'Paid' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'user-management':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">{t.clientPortal.userManagement.title}</h2>
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#009688] text-white font-semibold rounded-xl hover:bg-[#00796B] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t.clientPortal.userManagement.addUser}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subUsers.map((u) => (
                <div key={u.email} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{u.displayName}</h4>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-500 mb-1">{u.role}</span>
                    <span className={`text-[10px] font-bold uppercase ${u.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {u.status}
                    </span>
                  </div>
                </div>
              ))}
              {subUsers.length === 0 && (
                <div className="col-span-full text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400">{t.clientPortal.userManagement.noUsers}</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'company-profile':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-black">{t.clientPortal.companyProfile.title}</h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                  <Building2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-black">{user?.companyName || 'Global Tech Solutions'}</h3>
                  <p className="text-slate-500">{user?.companySize || 'Enterprise'} Client • {t.clientPortal.companyProfile.memberSince} {user?.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).getFullYear() : '2022'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.clientPortal.companyProfile.generalInfo}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.industry}</span>
                      <span className="text-sm font-bold text-slate-900">{user?.industry || 'Information Technology'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.employees}</span>
                      <span className="text-sm font-bold text-slate-900">{user?.companySize || '500 - 1000'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.website}</span>
                      <span className="text-sm font-bold text-[#009688]">{user?.website || `www.${(user?.companyName || 'globaltech').toLowerCase().replace(/\s+/g, '')}.com`}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-50">
                      <span className="text-sm text-slate-500">{t.clientPortal.companyProfile.contactDetails}</span>
                      <span className="text-sm font-bold text-slate-900">{user?.contactPhone || '+1 (800) 555-0199'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.clientPortal.companyProfile.primaryAddress}</h4>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t.clientPortal.companyProfile.country}</span>
                      <span className="font-bold text-slate-900">{user?.country || 'United States'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{t.clientPortal.companyProfile.city}</span>
                      <span className="font-bold text-slate-900">{user?.city || 'Silicon Valley'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">{t.clientPortal.companyProfile.location}</span>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {user?.location || '123 Business Avenue, Suite 500, Silicon Valley, CA 94025, United States'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-black">{t.clientPortal.help.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4">{t.clientPortal.help.faqs}</h3>
                <div className="space-y-4">
                  {[
                    'How do I track my ticket status?',
                    'What are the standard response times?',
                    'How do I approve billing advice?',
                    'Can I add multiple users to my account?'
                  ].map((q) => (
                    <button key={q} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-600 transition-all">
                      <span>{q}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-[#009688] text-white p-8 rounded-2xl shadow-lg shadow-[#009688]/20">
                  <h3 className="font-bold text-lg mb-2">{t.clientPortal.help.immediateHelp}</h3>
                  <p className="text-white/80 text-sm mb-6">{t.clientPortal.help.supportDesc}</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-white/60" />
                      <span className="font-bold">support@desklink.com</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-white/60" />
                      <span className="font-bold">+1 (800) 123-4567</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">{t.clientPortal.companyProfile.country} Support</span>
                        <span className="font-bold">Global / Multi-Country</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">{t.clientPortal.companyProfile.city} Support</span>
                        <span className="font-bold">All Major Tech Hubs</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest">{t.clientPortal.companyProfile.location}</span>
                        <p className="text-xs text-white/80">
                          Headquarters: 450 Tech Plaza, London, EC2V 6AA, United Kingdom
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t.clientPortal.help.liveChat}</h4>
                    <p className="text-xs text-slate-400">{t.clientPortal.help.waitTime}</p>
                  </div>
                  <button className="ml-auto px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg">{t.clientPortal.help.startChat}</button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'messages':
        return <MessagingSystem currentUser={user} role="client" allUsers={engineers} />;
      case 'quotations':
        return <QuotationPortal role="client" userEmail={user?.email} userName={user?.displayName || user?.name || user?.fullName} />;
      default:
        return null;
    }
  };

  const navigation = [
    { 
      id: 'home',
      name: t.clientPortal.nav.home, 
      icon: Home, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.cards.awaitingAction.name, icon: AlertCircle },
        { name: t.clientPortal.cards.updates.name, icon: Bell },
        { name: t.clientPortal.cards.accountStatus.name, icon: Shield },
      ]
    },
    { id: 'log-ticket', name: t.clientPortal.nav.logTicket, icon: Plus, isAction: true },
    { 
      id: 'my-tickets',
      name: t.clientPortal.nav.myTickets, 
      icon: CheckCircle, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.subItems.myTickets.list, icon: List },
        { name: t.clientPortal.subItems.myTickets.engineer, icon: Settings },
        { name: t.clientPortal.subItems.myTickets.comments, icon: MessageSquare },
        { name: t.clientPortal.subItems.myTickets.completion, icon: CheckCircle },
      ]
    },
    { 
      id: 'services',
      name: t.clientPortal.nav.services, 
      icon: Layers, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.subItems.services.catalog, icon: Monitor },
        { name: t.clientPortal.subItems.services.models, icon: Users },
        { name: t.clientPortal.subItems.services.coverage, icon: Globe },
      ]
    },
    { 
      id: 'opportunities',
      name: 'Opportunities', 
      icon: Briefcase, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.subItems.opportunities.dispatch, icon: Truck },
        { name: t.clientPortal.subItems.opportunities.project, icon: Layers },
        { name: t.clientPortal.subItems.opportunities.contract, icon: FileText },
        { name: t.clientPortal.subItems.opportunities.fte, icon: UserPlus },
        { name: t.clientPortal.subItems.opportunities.msp, icon: Shield },
      ]
    },
    { 
      id: 'billing',
      name: t.clientPortal.nav.billing, 
      icon: CreditCard, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.subItems.billing.advice, icon: FileText },
        { name: t.clientPortal.subItems.billing.approval, icon: CheckCircle },
        { name: t.clientPortal.subItems.billing.invoices, icon: DollarSign },
        { name: t.clientPortal.subItems.billing.history, icon: History },
      ]
    },
    { 
      id: 'quotations',
      name: 'Quotations', 
      icon: FileText, 
      badge: quotations.filter(q => q.status === 'Sent').length
    },
    { 
      id: 'user-management',
      name: t.clientPortal.nav.userManagement, 
      icon: Users, 
    },
    { 
      id: 'company-profile',
      name: t.clientPortal.nav.companyProfile, 
      icon: Building2, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.subItems.companyProfile.details, icon: Home },
        { name: t.clientPortal.subItems.companyProfile.location, icon: MapPin },
        { name: t.clientPortal.subItems.companyProfile.billing, icon: CreditCard },
        { name: t.clientPortal.subItems.companyProfile.operating, icon: Globe },
        { name: t.clientPortal.subItems.companyProfile.industry, icon: Layers },
      ]
    },
    { 
      id: 'help',
      name: t.clientPortal.nav.help, 
      icon: HelpCircle, 
      hasChevron: true,
      subItems: [
        { name: t.clientPortal.subItems.help.howItWorks, icon: BookOpen },
        { name: t.clientPortal.subItems.help.faqs, icon: HelpCircle },
        { name: t.clientPortal.subItems.help.contact, icon: Headphones },
        { name: t.clientPortal.subItems.help.guidelines, icon: FileText },
      ]
    },
    { id: 'messages', name: t.clientPortal.nav.messages, icon: MessageSquare, badge: unreadMessagesCount },
  ];

  const activeTicketsCount = tickets.filter(t => t.status !== 'Completed' && t.status !== 'Resolved').length;

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        (t.subject?.toLowerCase() || '').includes(ticketSearch.toLowerCase()) ||
        (t.id?.toLowerCase() || '').includes(ticketSearch.toLowerCase()) ||
        (t.description?.toLowerCase() || '').includes(ticketSearch.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tickets, ticketSearch, statusFilter, priorityFilter, categoryFilter]);

  const portalCards = [
    { 
      id: 'awaiting-action',
      name: t.clientPortal.cards.awaitingAction.name, 
      desc: t.clientPortal.cards.awaitingAction.desc, 
      icon: AlertCircle, 
      color: 'text-orange-500', 
      bgColor: 'bg-orange-50',
      badge: tickets.filter(t => t.status === 'Awaiting Action').length 
    },
    { 
      id: 'updates',
      name: t.clientPortal.cards.updates.name, 
      desc: t.clientPortal.cards.updates.desc, 
      icon: Bell, 
      color: 'text-cyan-500', 
      bgColor: 'bg-cyan-50',
      badge: 0 
    },
    { 
      id: 'account-status',
      name: t.clientPortal.cards.accountStatus.name, 
      desc: t.clientPortal.cards.accountStatus.desc, 
      icon: Shield, 
      color: 'text-slate-500', 
      bgColor: 'bg-slate-50',
      badge: 0
    },
  ];

  const logoutT = t.portal.logoutConfirm || {
    title: "Confirm Logout",
    message: "Are you sure you want to log out of your account?",
    confirm: "Logout",
    cancel: "Cancel"
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 sticky top-0 h-screen flex flex-col z-50 shadow-2xl">
        <div className="p-8">
          <Logo />
        </div>
        <div className="flex-1 px-3 space-y-1 mt-2">
          {navigation.map((item) => (
            <div 
              key={item.id}
              className="relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                onClick={() => {
                  setActiveTab(item.id);
                  setActiveSubTab(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group relative ${
                  activeTab === item.id 
                    ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-6 bg-brand-teal rounded-r-full"
                  />
                )}
                {item.isAction ? (
                  <Plus className="w-4 h-4 shrink-0" />
                ) : (
                  <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                )}
                <span>{item.name}</span>
                {item.id === 'messages' && unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-brand-teal text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-brand-teal/20">
                    {unreadMessagesCount}
                  </span>
                )}
                {item.id !== 'messages' && item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20">
                    {item.badge}
                  </span>
                )}
                {item.hasChevron && activeTab !== item.id && (
                  <ChevronRight className="ml-auto w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500" />
                )}
                {activeTab === item.id && (
                  <ChevronRight className="ml-auto w-3.5 h-3.5 text-white/70" />
                )}
              </button>

              {/* Hover Submenu */}
              <AnimatePresence>
                {hoveredItem === item.id && item.subItems && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full top-0 ml-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[60]"
                  >
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">
                      {item.name}
                    </div>
                    <div className="space-y-0.5">
                      {item.subItems.map((sub) => {
                        const isSubActive = activeTab === item.id && activeSubTab === sub.name;
                        return (
                          <button 
                            key={sub.name} 
                            onClick={() => {
                              if (sub.name === t.clientPortal.nav.logTicket) {
                                setActiveTab('log-ticket');
                                setActiveSubTab(null);
                              } else if (sub.name === t.clientPortal.nav.messages) {
                                setActiveTab('messages');
                                setActiveSubTab(null);
                              } else if (item.id === 'home') {
                                // Specific logic for home sub-items to navigate to relevant tabs
                                if (sub.name === t.clientPortal.cards.startOpportunity.name) {
                                  setActiveTab('log-ticket');
                                  setActiveSubTab(null);
                                } else if (sub.name === t.clientPortal.cards.awaitingAction.name) {
                                  setActiveTab('my-tickets');
                                  setActiveSubTab(null);
                                } else if (sub.name === t.clientPortal.cards.updates.name) {
                                  setActiveTab('messages');
                                  setActiveSubTab(null);
                                } else if (sub.name === t.clientPortal.cards.accountStatus.name) {
                                  setActiveTab('company-profile');
                                  setActiveSubTab(null);
                                } else {
                                  setActiveTab(item.id);
                                  setActiveSubTab(sub.name);
                                }
                              } else {
                                setActiveTab(item.id);
                                setActiveSubTab(sub.name);
                              }
                              setHoveredItem(null);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all group/sub relative ${
                              isSubActive 
                                ? 'text-brand-teal' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            {isSubActive && (
                              <motion.div 
                                layoutId="client-sub-active-bg"
                                className="absolute inset-0 bg-brand-teal/5 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                              />
                            )}
                            <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isSubActive 
                                ? 'bg-brand-teal/10 text-brand-teal' 
                                : 'bg-slate-50 text-slate-400 group-hover/sub:text-slate-600 group-hover/sub:bg-slate-100'
                            }`}>
                              <sub.icon className="w-4.5 h-4.5" />
                            </div>
                            <span className="relative z-10 text-left leading-tight">{sub.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/5">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{t.clientPortal.nav.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Breadcrumbs */}
        <div className="flex items-center justify-between px-6 md:px-12 py-6 md:py-8 z-40 gap-4 bg-white/50 backdrop-blur-sm sticky top-0 border-b border-slate-50/50">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-black leading-none mb-1">
              {activeSubTab || (navigation.find(n => n.id === activeTab)?.name + (activeTab === 'messages' && unreadMessagesCount > 0 ? ` (${unreadMessagesCount})` : '')) || activeTab}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <button 
                onClick={() => { setActiveTab('home'); setActiveSubTab(null); }}
                className="hover:text-brand-teal transition-colors"
              >
                Client Portal
              </button>
              <ChevronRight className="w-2.5 h-2.5" />
              <button 
                onClick={() => setActiveSubTab(null)}
                className={`transition-colors ${!activeSubTab ? 'text-brand-teal' : 'hover:text-brand-teal'}`}
              >
                {navigation.find(n => n.id === activeTab)?.name || activeTab}
              </button>
              {activeSubTab && (
                <>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span className="text-brand-teal">{activeSubTab}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Network Live</span>
            </div>
            <div className="relative">
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:border-brand-teal/30 transition-all shadow-sm"
            >
              <Globe className="w-4 h-4 text-brand-teal" />
              <span>{language === 'en' ? 'English' : language === 'ru' ? 'Русский' : 'O\'zbekcha'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLangMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 overflow-hidden"
                >
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'ru', label: 'Русский' },
                    { code: 'uz', label: 'O\'zbekcha' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                        language === lang.code 
                          ? 'bg-brand-teal/10 text-brand-teal' 
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <NotificationDropdown />

            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shrink-0 shadow-sm"
              title={t.clientPortal.nav.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

        <main className={`flex-1 flex flex-col min-w-0 ${activeTab === 'messages' ? 'h-screen overflow-hidden' : 'overflow-y-auto'}`}>
          <div className={activeTab === 'messages' ? 'w-full flex-1' : 'p-6 md:p-12 pt-4 md:pt-6 max-w-[1400px] mx-auto w-full'}>
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
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
                  <h3 className="text-xl font-bold text-black">Service Feedback</h3>
                  <button onClick={() => setShowFeedbackModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setFeedback({ ...feedback, rating: star })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          feedback.rating >= star ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 text-slate-300'
                        }`}
                      >
                        <Zap className={`w-5 h-5 ${feedback.rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comments</label>
                    <textarea 
                      rows={4}
                      value={feedback.comment}
                      onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all"
                      placeholder="Tell us about your experience..."
                    />
                  </div>
                  <button 
                    onClick={() => {
                      addNotification({
                        type: 'success',
                        title: 'Feedback Received',
                        message: 'Thank you for your feedback!'
                      });
                      setShowFeedbackModal(false);
                    }}
                    className="w-full py-4 bg-[#009688] text-white font-semibold rounded-xl hover:bg-[#00796B] transition-all shadow-lg shadow-[#009688]/20"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Opportunity Modal */}
      <AnimatePresence>
      </AnimatePresence>

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
                  <h3 className="text-xl font-bold text-black">{t.clientPortal.addUser.title}</h3>
                  <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form className="space-y-6" onSubmit={handleAddUser}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.addUser.username}</label>
                    <input 
                      type="text" 
                      name="username"
                      value={newUser.username}
                      onChange={handleNewUserInputChange}
                      placeholder={t.clientPortal.addUser.usernamePlaceholder} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.addUser.email}</label>
                    <input 
                      type="email" 
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder={t.clientPortal.addUser.emailPlaceholder} 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.clientPortal.addUser.role}</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#009688] outline-none transition-all"
                    >
                      <option value="Admin">{t.clientPortal.addUser.roles.admin}</option>
                      <option value="Manager">{t.clientPortal.addUser.roles.manager}</option>
                      <option value="Viewer">{t.clientPortal.addUser.roles.viewer}</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-4 bg-[#009688] text-white font-semibold rounded-xl hover:bg-[#00796B] transition-all shadow-lg shadow-[#009688]/20">
                    {t.clientPortal.addUser.submit}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LogoutConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onLogout}
        title={logoutT.title}
        message={logoutT.message}
        confirmLabel={logoutT.confirm}
        cancelLabel={logoutT.cancel}
      />

      {/* Ticket Review Modal */}
      <AnimatePresence>
        {showTicketReview && selectedTicket && (
          <div className="fixed inset-0 z-[110] bg-slate-50 flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full h-full bg-slate-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <button onClick={() => setShowTicketReview(false)} className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors">
                      <HiArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h3 className="text-xl font-bold text-black">Ticket Details</h3>
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold ml-10">Review your service request</p>
                </div>
                <button onClick={() => setShowTicketReview(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
                <TicketDetailView ticket={selectedTicket} t={t} language={language} />
                
                <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-brand-teal" /> 
                    Send Update
                  </h4>
                  <div className="flex gap-3">
                    <textarea 
                      value={newUpdateText}
                      onChange={(e) => setNewUpdateText(e.target.value)}
                      placeholder="Type an update for the support team..."
                      className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-brand-teal/50 transition-all resize-none"
                      rows={2}
                    />
                    <button 
                      onClick={() => handleAddUpdate(selectedTicket.id)}
                      disabled={isAddingUpdate || !newUpdateText.trim()}
                      className="px-6 bg-brand-teal text-slate-900 rounded-2xl font-bold text-sm hover:bg-teal-300 transition-all disabled:opacity-50 shrink-0"
                    >
                      {isAddingUpdate ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {(selectedTicket.status === 'Quoted' || selectedTicket.status === 'Waiting for client approval') && selectedTicket.quote && (
                  <div className="mt-8 flex gap-4 justify-end pt-8 border-t border-slate-100">
                    <button 
                      onClick={() => handleDeclineQuote(selectedTicket.id)}
                      className="px-8 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all"
                    >
                      {t.clientPortal.quotations.reject}
                    </button>
                    <button 
                      onClick={() => handleAcceptQuote(selectedTicket.id)}
                      className="px-8 py-3 bg-brand-teal text-slate-900 font-bold rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-brand-teal/20"
                    >
                      {t.clientPortal.quotations.approve}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Detailed professional information</p>
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
    </div>
  );
};

export default ClientPortal;
