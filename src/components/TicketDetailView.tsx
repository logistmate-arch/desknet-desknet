import React from 'react';
import { 
  HiMapPin as MapPin, 
  HiClock as Clock, 
  HiCurrencyDollar as DollarSign, 
  HiEnvelope as Mail, 
  HiPhone as Phone,
  HiDocumentText as FileText,
  HiCalendar as Calendar,
  HiTag as Tag,
  HiUser as User,
  HiCheckCircle as CheckCircle,
  HiBell as Bell,
  HiPaperAirplane as Send,
  HiMagnifyingGlass as Search
} from 'react-icons/hi2';
import { db, auth, doc, updateDoc } from '../firebase';

interface TicketDetailViewProps {
  ticket: any;
  t: any;
  language: string;
}

const TicketDetailView: React.FC<TicketDetailViewProps> = ({ ticket, t, language }) => {
  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return 'N/A';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical (SLA)': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'High': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Medium': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Waiting for client approval': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Approved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'Rejected': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'Assigned': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'Quote Accepted': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'On Site': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'Completed': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* On Site Status Banner */}
      {ticket.isOnSite && (
        <div className="bg-emerald-500 text-white px-6 py-4 rounded-3xl flex items-center justify-between shadow-lg shadow-emerald-500/20 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black uppercase tracking-widest text-[10px] opacity-80">Current Status</p>
              <p className="text-lg font-bold">Engineer is On Site</p>
            </div>
          </div>
          <CheckCircle className="w-8 h-8 opacity-50" />
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">TK-{ticket.id?.slice(0, 8).toUpperCase()}</h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(ticket.status)}`}>
                {ticket.status}
              </span>
            </div>
            <p className={`text-sm transition-all duration-500 ${ticket.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
              {ticket.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Service Details */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4" /> Service Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Service Type</p>
                <p className="font-semibold text-slate-900">{ticket.serviceType}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Duration</p>
                <p className="font-semibold text-slate-900">{ticket.estimatedDuration}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Attachments</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {ticket.attachments.map((file: any, idx: number) => (
                      <div key={idx} className="group relative aspect-square bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-brand-teal/30 transition-all">
                        {file.type?.startsWith('image/') ? (
                          <img src={file.data} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <FileText className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a 
                            href={file.data} 
                            download={file.name}
                            className="p-2 bg-white rounded-lg text-slate-900 hover:bg-brand-teal transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Search className="w-4 h-4" />
                          </a>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5">
                          <p className="text-[8px] font-bold text-white truncate">{file.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location & Time */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location & Schedule
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Country & City</p>
                <p className="font-semibold text-slate-900">{ticket.country}, {ticket.city}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Scheduled Date/Time</p>
                <p className="font-semibold text-slate-900">{formatDateTime(ticket.dateTime)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exact Location</p>
                <p className="font-semibold text-slate-900">{ticket.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Quote Info (if any) */}
          {ticket.quote && (
            <div className={`p-8 rounded-3xl border space-y-6 ${
              ticket.quote.status === 'Accepted' || ticket.status === 'Approved' ? 'bg-emerald-50 border-emerald-100' :
              ticket.quote.status === 'Declined' || ticket.status === 'Rejected' ? 'bg-rose-50 border-rose-100' :
              'bg-blue-50 border-blue-100'
            }`}>
              <h4 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
                ticket.quote.status === 'Accepted' || ticket.status === 'Approved' ? 'text-emerald-600' :
                ticket.quote.status === 'Declined' || ticket.status === 'Rejected' ? 'text-rose-600' :
                'text-blue-600'
              }`}>
                <DollarSign className="w-4 h-4" /> Service Quotation
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-2xl font-black text-slate-900">
                    {ticket.quote.currency === 'EUR' ? '€' : '$'}
                    {parseFloat(ticket.quote.amount).toLocaleString()}
                  </p>
                </div>
                {ticket.quote.description && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{ticket.quote.description}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                    ticket.quote.status === 'Accepted' || ticket.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                    ticket.quote.status === 'Declined' || ticket.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {ticket.quote.status}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {ticket.quote.createdAt ? new Date(ticket.quote.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Client Information
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold">
                  {ticket.clientName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {ticket.clientName && ticket.clientName !== 'Unknown Client' 
                      ? ticket.clientName 
                      : (ticket.clientEmail || 'Unknown Client')}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">Ticket ID: TK-{ticket.ticketNumber}</p>
                    {ticket.clientEmail && ticket.clientEmail !== ticket.clientName && (
                      <>
                        <span className="text-slate-300">•</span>
                        <p className="text-xs text-slate-500">{ticket.clientEmail}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 space-y-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{ticket.contactEmail}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{ticket.contactPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Engineer Info */}
          {ticket.engineerName && (
            <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 space-y-6">
              <h4 className="text-sm font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Assigned Engineer
              </h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-400 font-bold shadow-sm">
                    {ticket.engineerName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{ticket.engineerName}</p>
                    <p className="text-xs text-slate-500">{ticket.engineerEmail}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-emerald-200/50">
                  {ticket.engineerPhone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>{ticket.engineerPhone}</span>
                    </div>
                  )}
                  {ticket.engineerLocationFrom && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>Traveling from: {ticket.engineerLocationFrom}</span>
                    </div>
                  )}
                </div>

                {ticket.engineerAttachments && ticket.engineerAttachments.length > 0 && (
                  <div className="pt-4 border-t border-emerald-200/50 space-y-3">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Attachments</p>
                    <div className="flex flex-wrap gap-3">
                      {ticket.engineerAttachments.map((file: any, idx: number) => (
                        <a 
                          key={idx} 
                          href={file.data} 
                          download={file.name}
                          className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 transition-all group"
                        >
                          {file.type.startsWith('image/') ? (
                            <img src={file.data} className="w-8 h-8 object-cover rounded-lg" />
                          ) : (
                            <FileText className="w-8 h-8 text-emerald-300" />
                          )}
                          <div className="max-w-[100px]">
                            <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-black">Download</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ticket Updates Feed */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Bell className="w-4 h-4" /> Ticket Updates
            </h4>
            <div className="space-y-6">
              {ticket.updates && ticket.updates.length > 0 ? (
                ticket.updates.slice().reverse().map((update: any, idx: number) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-slate-100 pb-2 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-[#009688]" />
                    <p className="text-sm text-slate-700 leading-relaxed mb-1">{update.text}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-brand-teal uppercase tracking-widest">{update.author || 'System'}</span>
                      <span className="text-slate-300">•</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {update.timestamp ? (
                          typeof update.timestamp === 'string' 
                            ? new Date(update.timestamp).toLocaleString() 
                            : update.timestamp.seconds 
                              ? new Date(update.timestamp.seconds * 1000).toLocaleString() 
                              : 'N/A'
                        ) : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-400 italic text-sm">
                  No updates sent yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailView;
