import React, { useState, useEffect } from 'react';
import { User, Property, ActivityLog, AccessRequest, SponsorAd } from '../types';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Key, 
  UserPlus, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  AlertCircle,
  ArrowLeft,
  Search,
  Activity,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  CreditCard,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Ban,
  UserCheck,
  ShieldAlert,
  LogOut,
  Crown,
  Sparkles,
  Plus,
  RefreshCw,
  Zap,
  Building,
  Landmark,
  Radio,
  EyeOff
} from 'lucide-react';
import { formatPKR } from '../utils/formatters';

interface OwnerControlViewProps {
  currentUser: User;
  onExit: () => void;
  onRefreshData: () => void;
  onRefreshSettings?: () => void;
  onLogout?: () => void;
}

export const OwnerControlView: React.FC<OwnerControlViewProps> = ({
  currentUser: _currentUser,
  onExit,
  onRefreshData,
  onRefreshSettings,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'properties' | 'ads' | 'system' | 'logs'>('users');
  const [overview, setOverview] = useState<any>(null);
  const [allProperties, setAllProperties] = useState<(Property & { employee_username: string; employee_name: string })[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // User search & status filter
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  // Settings form state
  const [ownerEmail, setOwnerEmail] = useState('sacc5038@gmail.com');
  const [ownerPhone, setOwnerPhone] = useState('+92 3082665978');
  const [ownerWhatsApp, setOwnerWhatsApp] = useState('+92 3082665978');
  const [monthlyFee, setMonthlyFee] = useState('5000');
  const [paymentInstructions, setPaymentInstructions] = useState('Bank Transfer / EasyPaisa / JazzCash available. Contact Owner for bank details.');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Advertisements & Paid Membership state
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [googleAdClient, setGoogleAdClient] = useState('');
  const [googleAdSlot, setGoogleAdSlot] = useState('');
  const [proMonthlyPrice, setProMonthlyPrice] = useState('1500');
  const [proFeaturesDesc, setProFeaturesDesc] = useState('');
  const [sponsorAdsList, setSponsorAdsList] = useState<SponsorAd[]>([]);
  const [isTogglingAds, setIsTogglingAds] = useState(false);
  const [isSavingMonetization, setIsSavingMonetization] = useState(false);

  // New Sponsor Ad Modal State
  const [showNewAdModal, setShowNewAdModal] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdTagline, setNewAdTagline] = useState('');
  const [newAdDescription, setNewAdDescription] = useState('');
  const [newAdSponsorName, setNewAdSponsorName] = useState('');
  const [newAdCategory, setNewAdCategory] = useState<'Building Materials' | 'Bank Loan' | 'Legal & Taxes' | 'Solar & Electric' | 'Architect & 3D' | 'General'>('Building Materials');
  const [newAdPhone, setNewAdPhone] = useState('');
  const [newAdWhatsapp, setNewAdWhatsapp] = useState('');
  const [newAdCtaText, setNewAdCtaText] = useState('Contact Sponsor');
  const [newAdBadge, setNewAdBadge] = useState('HOT DEAL');

  // User form modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'owner'>('user');

  // Password reset modal state
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Property search inside owner console
  const [propertySearch, setPropertySearch] = useState('');

  // Backup restore file state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const loadOwnerData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, propData, requestsData] = await Promise.all([
        api.getOwnerOverview(),
        api.getOwnerProperties(),
        api.getOwnerAccessRequests(),
      ]);
      setOverview(overviewData);
      setAllProperties(propData.properties);
      setAccessRequests(requestsData.requests || []);

      if (overviewData.settings) {
        if (overviewData.settings.owner_email) setOwnerEmail(overviewData.settings.owner_email);
        if (overviewData.settings.owner_phone) setOwnerPhone(overviewData.settings.owner_phone);
        if (overviewData.settings.owner_whatsapp) setOwnerWhatsApp(overviewData.settings.owner_whatsapp);
        if (overviewData.settings.monthly_subscription_fee_pkr) setMonthlyFee(String(overviewData.settings.monthly_subscription_fee_pkr));
        if (overviewData.settings.payment_instructions) setPaymentInstructions(overviewData.settings.payment_instructions);
        if (overviewData.settings.ads_enabled !== undefined) setAdsEnabled(overviewData.settings.ads_enabled);
        if (overviewData.settings.google_ad_client) setGoogleAdClient(overviewData.settings.google_ad_client);
        if (overviewData.settings.google_ad_slot) setGoogleAdSlot(overviewData.settings.google_ad_slot);
        if (overviewData.settings.pro_monthly_price_pkr) setProMonthlyPrice(String(overviewData.settings.pro_monthly_price_pkr));
        if (overviewData.settings.pro_features_description) setProFeaturesDesc(overviewData.settings.pro_features_description || '');
        if (overviewData.settings.sponsor_ads) setSponsorAdsList(overviewData.settings.sponsor_ads);
      }
    } catch (err: any) {
      console.error('Owner data load failed', err);
      setStatusMsg({ text: err.message || 'Failed to load owner overview.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, []);

  // Ads & Paid Membership actions
  const handleToggleGlobalAds = async () => {
    setIsTogglingAds(true);
    try {
      const res = await api.toggleAds(!adsEnabled);
      if (res.success) {
        setAdsEnabled(res.ads_enabled);
        setStatusMsg({
          text: res.ads_enabled
            ? 'Advertisements are now ACTIVE across the app'
            : 'Advertisements are now PAUSED globally',
        });
        if (onRefreshSettings) onRefreshSettings();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to toggle ads.', isError: true });
    } finally {
      setIsTogglingAds(false);
    }
  };

  const handleSaveMonetizationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMonetization(true);
    try {
      const res = await api.updateOwnerSettings({
        pro_monthly_price_pkr: Number(proMonthlyPrice) || 1500,
        pro_features_description: proFeaturesDesc,
        payment_instructions: paymentInstructions,
        owner_whatsapp: ownerWhatsApp,
        google_ad_client: googleAdClient.trim(),
        google_ad_slot: googleAdSlot.trim(),
      });
      if (res.settings) {
        setStatusMsg({ text: 'Paid Pro Membership settings saved successfully!' });
        if (onRefreshSettings) onRefreshSettings();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to save settings.', isError: true });
    } finally {
      setIsSavingMonetization(false);
    }
  };

  const handleUpdateUserTier = async (userId: string, tier: 'free' | 'pro', days: number = 30) => {
    try {
      const res = await api.updateUserSubscription(userId, tier, tier === 'pro', days);
      if (res.success) {
        setStatusMsg({
          text: tier === 'pro'
            ? `User upgraded to PRO Ad-Free tier for ${days} days!`
            : `User moved to Free (Ad-Supported) tier.`
        });
        await loadOwnerData();
        if (onRefreshSettings) onRefreshSettings();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update subscription', isError: true });
    }
  };

  const handleCreateSponsorAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle || !newAdDescription || !newAdSponsorName) {
      setStatusMsg({ text: 'Title, description and sponsor name are required', isError: true });
      return;
    }
    try {
      const res = await api.createSponsorAd({
        title: newAdTitle,
        tagline: newAdTagline,
        description: newAdDescription,
        sponsor_name: newAdSponsorName,
        category: newAdCategory,
        phone: newAdPhone,
        whatsapp: newAdWhatsapp,
        cta_text: newAdCtaText || 'Contact Sponsor',
        badge_label: newAdBadge || 'HOT DEAL',
      });
      if (res.success) {
        setSponsorAdsList(res.sponsor_ads);
        setShowNewAdModal(false);
        setNewAdTitle('');
        setNewAdTagline('');
        setNewAdDescription('');
        setNewAdSponsorName('');
        setNewAdPhone('');
        setNewAdWhatsapp('');
        setStatusMsg({ text: 'New sponsor ad published successfully!' });
        if (onRefreshSettings) onRefreshSettings();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to create sponsor ad', isError: true });
    }
  };

  const handleToggleAdStatus = async (ad: SponsorAd) => {
    try {
      const res = await api.updateSponsorAd(ad.ad_id, { is_active: !ad.is_active });
      if (res.success) {
        setSponsorAdsList(res.sponsor_ads);
        setStatusMsg({ text: `Ad "${ad.title}" status changed to ${!ad.is_active ? 'Active' : 'Inactive'}` });
        if (onRefreshSettings) onRefreshSettings();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update ad', isError: true });
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm('Are you sure you want to remove this sponsor ad?')) return;
    try {
      const res = await api.deleteSponsorAd(adId);
      if (res.success) {
        setSponsorAdsList(res.sponsor_ads);
        setStatusMsg({ text: 'Sponsor ad removed.' });
        if (onRefreshSettings) onRefreshSettings();
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to delete ad', isError: true });
    }
  };

  // Access Requests actions
  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await api.approveOwnerAccessRequest(requestId);
      setStatusMsg({ text: res.message || 'Access approved successfully! User is now active.' });
      await loadOwnerData();
      onRefreshData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to approve access request', isError: true });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = window.prompt('Enter reason for rejection (optional):', 'Payment not received');
    try {
      const res = await api.rejectOwnerAccessRequest(requestId, reason || undefined);
      setStatusMsg({ text: res.message || 'Request rejected.' });
      await loadOwnerData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to reject request', isError: true });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this access request record?')) return;
    try {
      await api.deleteOwnerAccessRequest(requestId);
      setStatusMsg({ text: 'Access request deleted.' });
      await loadOwnerData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to delete request', isError: true });
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateOwnerSettings({
        owner_email: ownerEmail.trim(),
        owner_phone: ownerPhone.trim(),
        owner_whatsapp: ownerWhatsApp.trim(),
        monthly_subscription_fee_pkr: Number(monthlyFee) || 0,
        payment_instructions: paymentInstructions.trim(),
        require_owner_approval_for_signup: true,
      });
      setStatusMsg({ text: 'Owner payment and contact settings saved successfully!' });
      await loadOwnerData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to save settings', isError: true });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // User management actions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) {
      setStatusMsg({ text: 'All fields are required to register an employee.', isError: true });
      return;
    }

    try {
      await api.createOwnerUser({
        username: newUsername.trim(),
        full_name: newFullName.trim(),
        password: newPassword.trim(),
        role: newRole,
      });
      setStatusMsg({ text: `Employee ${newUsername} created successfully!` });
      setShowCreateUserModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      await loadOwnerData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to create user', isError: true });
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    if (user.role === 'owner') {
      setStatusMsg({ text: 'The Owner Director account cannot be blocked or deactivated.', isError: true });
      return;
    }
    const willBlock = user.is_active;
    const confirmMsg = willBlock
      ? `Are you sure you want to BLOCK this user account?\n\n👤 Full Name: ${user.full_name}\n🆔 Username: ${user.username}\n📱 Phone: ${user.phone || 'N/A'}\n\n⚠️ Blocking will immediately terminate all active sessions and prevent this user from logging in.`
      : `Are you sure you want to UNBLOCK and restore portal access for ${user.full_name} (${user.username})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.updateOwnerUserStatus(user.user_id, !user.is_active);
      setStatusMsg({
        text: `Account for ${user.full_name} (@${user.username}) has been ${willBlock ? 'BLOCKED ⛔' : 'UNBLOCKED & ACTIVATED ✅'}.`,
      });
      await loadOwnerData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to update user status', isError: true });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !resetNewPassword.trim() || resetNewPassword.length < 4) {
      setStatusMsg({ text: 'Password must be at least 4 characters.', isError: true });
      return;
    }

    try {
      await api.resetOwnerUserPassword(resettingUser.user_id, resetNewPassword.trim());
      setStatusMsg({ text: `Password for ${resettingUser.username} updated.` });
      setResettingUser(null);
      setResetNewPassword('');
      await loadOwnerData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to reset password', isError: true });
    }
  };

  const handleDeleteUser = async (user: User) => {
    const confirmDelete = window.confirm(
      `DELETE ACCOUNT CONFIRMATION:\n\nAre you sure you want to permanently delete user account "${user.full_name}" (@${user.username})?\n\n⚠️ This will permanently remove their access and all property listings associated with this account.\n\nClick OK to permanently delete or Cancel to keep.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteOwnerUser(user.user_id);
      setStatusMsg({ text: `Account for @${user.username} (${user.full_name}) has been permanently deleted.` });
      await loadOwnerData();
      onRefreshData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to delete user', isError: true });
    }
  };

  // Property actions
  const handleDeleteProperty = async (propId: string, plotNum: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Plot #${plotNum}?`)) {
      return;
    }

    try {
      await api.deleteOwnerProperty(propId);
      setStatusMsg({ text: `Property Plot #${plotNum} permanently deleted by Owner.` });
      await loadOwnerData();
      onRefreshData();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to delete property', isError: true });
    }
  };

  // Backup & Restore
  const handleDownloadBackup = async () => {
    try {
      const backup = await api.getOwnerBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property_hub_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatusMsg({ text: 'Company database backup downloaded successfully.' });
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to download backup', isError: true });
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      setStatusMsg({ text: 'Please select a backup JSON file first.', isError: true });
      return;
    }

    if (!window.confirm('Warning: Restoring will overwrite existing company property records with the backup. Continue?')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const payload = json.database || json;
        const res = await api.restoreOwnerBackup(payload);
        setStatusMsg({ text: `Backup restored! ${res.restored_properties_count} property records restored.` });
        setRestoreFile(null);
        await loadOwnerData();
        onRefreshData();
      } catch (err: any) {
        setStatusMsg({ text: 'Invalid JSON backup format: ' + err.message, isError: true });
      }
    };
    reader.readAsText(restoreFile);
  };

  const filteredProperties = allProperties.filter((p) => {
    if (!propertySearch.trim()) return true;
    const q = propertySearch.toLowerCase().trim();
    return (
      p.society.toLowerCase().includes(q) ||
      p.plot_number.toLowerCase().includes(q) ||
      p.block.toLowerCase().includes(q) ||
      p.employee_username.toLowerCase().includes(q) ||
      p.employee_name.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'pending_payment').length;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-28 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b theme-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold theme-text-main font-brand">
                Owner Executive Backend
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold">
                DIRECTOR CONTROL
              </span>
            </div>
            <p className="text-xs theme-text-tertiary mt-0.5">
              License management, payment approvals, employee accounts, and company backups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold transition border border-rose-200 dark:border-rose-900/60 min-h-[40px]"
              title="Sign Out of Administrator Account"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl theme-bg-card hover:theme-bg-subtle text-xs font-semibold theme-text-secondary transition border theme-border theme-shadow min-h-[40px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>View Properties</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
            statusMsg.isError
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {statusMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <Check className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b theme-border pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'theme-bg-subtle theme-text-secondary hover:theme-text-main border theme-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Control ({overview?.users?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'properties'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'theme-bg-subtle theme-text-secondary hover:theme-text-main border theme-border'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Properties ({allProperties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'theme-bg-subtle theme-text-secondary hover:theme-text-main border theme-border'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Signup & Access Log ({accessRequests.length})</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ads'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'theme-bg-subtle theme-text-secondary hover:theme-text-main border theme-border'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>Ads & Paid Membership</span>
          {adsEnabled ? (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-600 text-white font-bold">
              ADS ON
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-500 text-white font-bold">
              PAUSED
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'theme-bg-subtle theme-text-secondary hover:theme-text-main border theme-border'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Backup</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'theme-bg-subtle theme-text-secondary hover:theme-text-main border theme-border'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Audit Logs</span>
        </button>
      </div>

      {/* TAB: ACCESS & PAYMENT REQUESTS (NEW!) */}
      {activeTab === 'requests' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold theme-text-main mt-1 font-brand">
                {pendingRequestsCount}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">Awaiting fee confirmation from owner</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>Approved Active Users</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold theme-text-main mt-1 font-brand">
                {accessRequests.filter(r => r.status === 'approved').length}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">Granted full access to the portal</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>Owner Notification Email</span>
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold font-mono theme-text-main mt-1 truncate">
                {ownerEmail}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">Receives applicant registration alerts</p>
            </div>
          </div>

          {/* Owner Payment & Notification Setup Form */}
          <div className="theme-bg-card border theme-border rounded-2xl p-4 sm:p-6 theme-shadow">
            <div className="flex items-center justify-between pb-3 mb-4 border-b theme-border">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-sm font-bold theme-text-main font-brand uppercase tracking-wider">
                  Administration Contact & Subscription Settings
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                Direct Applicant Inquiries
              </span>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Administrative Notification Email (Receives Access Alerts)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 theme-text-tertiary" />
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="sacc5038@gmail.com"
                      required
                      className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Administration WhatsApp / Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 theme-text-tertiary" />
                    <input
                      type="text"
                      value={ownerWhatsApp}
                      onChange={(e) => setOwnerWhatsApp(e.target.value)}
                      placeholder="+92 3082665978"
                      required
                      className="w-full pl-9 pr-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Monthly Portal License Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Payment Receiving Account Details (Bank / EasyPaisa / JazzCash)
                  </label>
                  <input
                    type="text"
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Meezan Bank A/C: 1234... or EasyPaisa: 0300..."
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Saving Settings...' : 'Save Settings'}</span>
              </button>
            </form>
          </div>

          {/* Access Requests List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold theme-text-main font-brand uppercase tracking-wider">
                License & Subscription Requests ({accessRequests.length})
              </h3>
              <span className="text-xs theme-text-tertiary">
                Talk to applicants directly & grant access after receiving payment
              </span>
            </div>

            {accessRequests.length === 0 ? (
              <div className="text-center py-12 theme-bg-card rounded-2xl border theme-border p-6 theme-shadow">
                <Mail className="w-10 h-10 theme-text-tertiary mx-auto mb-2 opacity-40" />
                <h4 className="text-sm font-bold theme-text-main font-brand">No pending access requests</h4>
                <p className="text-xs theme-text-secondary mt-1 max-w-sm mx-auto">
                  When new users sign up on the portal, their requests and contact details will appear here for payment settlement.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {accessRequests.map((req) => {
                  const isPending = req.status === 'pending_payment';
                  const isApproved = req.status === 'approved';
                  const cleanPhone = req.phone.replace(/[^0-9]/g, '');
                  const waText = encodeURIComponent(
                    `Hello ${req.full_name}! I am the Administration of CM INVENTORY WALLET. I received your account access request for username "${req.desired_username}". Let's finalize your activation.`
                  );
                  const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;

                  return (
                    <div
                      key={req.request_id}
                      className={`p-4 rounded-2xl border transition theme-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isPending
                          ? 'theme-bg-card border-amber-300 dark:border-amber-700/60'
                          : isApproved
                          ? 'theme-bg-card border-emerald-300 dark:border-emerald-800/60'
                          : 'theme-bg-subtle theme-border opacity-75'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold theme-text-main font-brand">
                            {req.full_name}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Username: {req.desired_username}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {isPending ? 'Pending Payment & Approval ⏳' : isApproved ? 'Approved & Active ✅' : 'Rejected ❌'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs theme-text-secondary">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                            title="Chat on WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{req.phone}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>

                          <a
                            href={`mailto:${req.email}?subject=${encodeURIComponent('CM INVENTORY WALLET Portal Access - Activation Details')}`}
                            className="flex items-center gap-1 hover:underline truncate"
                          >
                            <Mail className="w-3.5 h-3.5 theme-text-tertiary" />
                            <span>{req.email}</span>
                          </a>

                          {req.agency_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 theme-text-tertiary" />
                              <span>{req.agency_name} {req.city ? `(${req.city})` : ''}</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] theme-text-tertiary font-mono">
                          Requested at: {new Date(req.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Action Buttons for Owner */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* 1. Chat on WhatsApp to discuss activation */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
                          title="Open WhatsApp to contact applicant"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Contact on WhatsApp</span>
                        </a>

                        {/* 2. Approve & Grant Access */}
                        {isPending && (
                          <button
                            onClick={() => handleApproveRequest(req.request_id)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
                            title="Activate applicant portal access"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Approve & Grant Access</span>
                          </button>
                        )}

                        {/* 3. Reject */}
                        {isPending && (
                          <button
                            onClick={() => handleRejectRequest(req.request_id)}
                            className="p-2 rounded-xl theme-bg-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 border theme-border transition text-xs font-semibold"
                            title="Reject request"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* 4. Delete */}
                        <button
                          onClick={() => handleDeleteRequest(req.request_id)}
                          className="p-2 rounded-xl theme-bg-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600 border theme-border transition"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: USERS MANAGEMENT & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top User Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="theme-bg-card border theme-border rounded-2xl p-3.5 theme-shadow">
              <div className="text-[11px] font-semibold theme-text-secondary flex items-center justify-between">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold theme-text-main mt-1 font-brand">
                {overview?.users?.length || 0}
              </div>
              <p className="text-[10px] theme-text-tertiary mt-0.5">All registered accounts</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-3.5 theme-shadow">
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>Active Accounts</span>
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-bold theme-text-main mt-1 font-brand">
                {(overview?.users || []).filter((u: any) => u.is_active).length}
              </div>
              <p className="text-[10px] theme-text-tertiary mt-0.5">Allowed portal access</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-3.5 theme-shadow">
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>Blocked Accounts</span>
                <Ban className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-bold theme-text-main mt-1 font-brand">
                {(overview?.users || []).filter((u: any) => !u.is_active).length}
              </div>
              <p className="text-[10px] theme-text-tertiary mt-0.5">Suspended by administration</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-3.5 theme-shadow">
              <div className="text-[11px] font-semibold theme-text-secondary flex items-center justify-between">
                <span>Total Listings</span>
                <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold theme-text-main mt-1 font-brand">
                {allProperties.length}
              </div>
              <p className="text-[10px] theme-text-tertiary mt-0.5">Across all accounts</p>
            </div>
          </div>

          {/* User Controls Bar: Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 theme-text-tertiary" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search user, phone, email, agency, city..."
                  className="w-full pl-9 pr-3 py-2 theme-bg-card border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl border theme-border theme-bg-subtle text-xs">
                <button
                  onClick={() => setUserStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    userStatusFilter === 'all'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'theme-text-secondary hover:theme-text-main'
                  }`}
                >
                  All ({(overview?.users || []).length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    userStatusFilter === 'active'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'theme-text-secondary hover:theme-text-main'
                  }`}
                >
                  Active ({(overview?.users || []).filter((u: any) => u.is_active).length})
                </button>
                <button
                  onClick={() => setUserStatusFilter('blocked')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    userStatusFilter === 'blocked'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'theme-text-secondary hover:theme-text-main'
                  }`}
                >
                  Blocked ({(overview?.users || []).filter((u: any) => !u.is_active).length})
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shadow-sm shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account Manually</span>
            </button>
          </div>

          {/* User Cards (Visible on Mobile & Tablet) */}
          {(() => {
            const filtered = (overview?.users || []).filter((u: any) => {
              if (userStatusFilter === 'active' && !u.is_active) return false;
              if (userStatusFilter === 'blocked' && u.is_active) return false;
              if (!userSearch.trim()) return true;
              const q = userSearch.toLowerCase().trim();
              return (
                (u.full_name || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.phone || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.agency_name || '').toLowerCase().includes(q) ||
                (u.city || '').toLowerCase().includes(q)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-12 theme-bg-card rounded-2xl border theme-border p-6 theme-shadow">
                  <Users className="w-10 h-10 theme-text-tertiary mx-auto mb-2 opacity-40" />
                  <h4 className="text-sm font-bold theme-text-main font-brand">No users match your criteria</h4>
                  <p className="text-xs theme-text-secondary mt-1">
                    Try changing your search keywords or filter settings.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {/* Mobile Cards View */}
                <div className="grid grid-cols-1 md:hidden gap-3">
                  {filtered.map((user: any) => {
                    const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
                    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

                    return (
                      <div
                        key={user.user_id}
                        className={`p-4 rounded-2xl border theme-bg-card transition theme-shadow space-y-3 ${
                          user.is_active
                            ? 'border-stone-200 dark:border-stone-800'
                            : 'border-rose-400 dark:border-rose-800/80 bg-rose-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold theme-text-main font-brand">
                                {user.full_name}
                              </h3>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/20">
                                @{user.username}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                                  user.role === 'owner'
                                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-black/5 dark:bg-white/10 theme-text-secondary'
                                }`}
                              >
                                {user.role.toUpperCase()}
                              </span>
                              <span
                                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                  user.role === 'owner' || user.is_ad_free
                                    ? 'bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <Crown className="w-3 h-3 text-amber-600 inline" />
                                <span>{user.role === 'owner' ? 'OWNER' : user.is_ad_free ? 'PRO (NO ADS)' : 'FREE (ADS)'}</span>
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  user.is_active
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {user.is_active ? '✅ ACTIVE' : '⛔ BLOCKED'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                              {user.properties_count || 0}
                            </span>
                            <span className="text-[10px] theme-text-tertiary block">plots</span>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="grid grid-cols-1 gap-1.5 text-xs pt-1 border-t theme-border theme-text-secondary">
                          {user.phone && (
                            <div className="flex items-center justify-between">
                              <span className="theme-text-tertiary flex items-center gap-1 text-[11px]">
                                <Phone className="w-3.5 h-3.5" />
                                <span>Phone:</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${user.phone}`}
                                  className="font-mono font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                                >
                                  {user.phone}
                                </a>
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {user.email && (
                            <div className="flex items-center justify-between">
                              <span className="theme-text-tertiary flex items-center gap-1 text-[11px]">
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email:</span>
                              </span>
                              <a
                                href={`mailto:${user.email}`}
                                className="font-mono text-sky-700 dark:text-sky-400 hover:underline truncate max-w-[200px]"
                              >
                                {user.email}
                              </a>
                            </div>
                          )}

                          {(user.agency_name || user.city) && (
                            <div className="flex items-center justify-between">
                              <span className="theme-text-tertiary flex items-center gap-1 text-[11px]">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Agency / City:</span>
                              </span>
                              <span className="font-medium theme-text-main">
                                {user.agency_name || 'Individual'} {user.city ? `(${user.city})` : ''}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] theme-text-tertiary pt-1">
                            <span>Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                            <span>Last Login: {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>

                        {/* Direct Block/Unblock & Manage Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t theme-border">
                          {user.role !== 'owner' && (
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                                user.is_active
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {user.is_active ? (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Block Account</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Unblock Account</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setResettingUser(user);
                              setResetNewPassword('');
                            }}
                            className="p-2 rounded-xl theme-bg-subtle hover:theme-bg-card border theme-border text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-1"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Reset Pass</span>
                          </button>

                          {user.role !== 'owner' && (
                            <button
                              onClick={() => handleUpdateUserTier(user.user_id, user.is_ad_free ? 'free' : 'pro', 30)}
                              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                                user.is_ad_free
                                  ? 'bg-amber-500/15 border-amber-400/50 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                                  : 'theme-bg-subtle theme-border hover:theme-bg-card text-sky-700 dark:text-sky-400'
                              }`}
                              title={user.is_ad_free ? 'Downgrade to Free (Ad-Supported)' : 'Upgrade to Ad-Free PRO for 30 Days'}
                            >
                              <Crown className="w-3.5 h-3.5 text-amber-600" />
                              <span>{user.is_ad_free ? 'PRO Active' : 'Make PRO'}</span>
                            </button>
                          )}

                          {user.role !== 'owner' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 rounded-xl theme-bg-subtle hover:bg-rose-50 dark:hover:bg-rose-950/40 border theme-border text-rose-600 text-xs transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Full Table View */}
                <div className="hidden md:block theme-bg-card border theme-border rounded-2xl overflow-hidden theme-shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b theme-border theme-bg-subtle theme-text-secondary font-semibold">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Phone / WhatsApp</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Agency / City</th>
                          <th className="py-3 px-4">Properties</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Plan (Ads)</th>
                          <th className="py-3 px-4">Last Login</th>
                          <th className="py-3 px-4 text-right">Account Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y theme-border theme-text-main">
                        {filtered.map((user: any) => {
                          const cleanPhone = (user.phone || '').replace(/[^0-9]/g, '');
                          const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

                          return (
                            <tr key={user.user_id} className={`hover:theme-bg-subtle transition ${!user.is_active ? 'bg-rose-500/5' : ''}`}>
                              <td className="py-3 px-4">
                                <div className="font-bold theme-text-main">{user.full_name}</div>
                                <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                                  @{user.username}
                                </div>
                                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                                  user.role === 'owner' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold' : 'bg-black/5 dark:bg-white/10 theme-text-secondary'
                                }`}>
                                  {user.role.toUpperCase()}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                {user.phone ? (
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <a href={`tel:${user.phone}`} className="text-sky-700 dark:text-sky-400 hover:underline">
                                      {user.phone}
                                    </a>
                                    {waUrl && (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                                        title="WhatsApp Chat"
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="theme-text-tertiary">N/A</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                {user.email ? (
                                  <a href={`mailto:${user.email}`} className="text-sky-700 dark:text-sky-400 hover:underline truncate max-w-[140px] block">
                                    {user.email}
                                  </a>
                                ) : (
                                  <span className="theme-text-tertiary">N/A</span>
                                )}
                              </td>

                              <td className="py-3 px-4">
                                <div className="font-medium">{user.agency_name || 'Individual'}</div>
                                {user.city && <div className="text-[11px] theme-text-tertiary">{user.city}</div>}
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2 text-[11px] font-mono">
                                  <span className="font-bold">{user.properties_count || 0}</span>
                                  <span className="text-emerald-700 dark:text-emerald-400">({user.available_count || 0} avail)</span>
                                  <span className="text-rose-700 dark:text-rose-400">({user.sold_count || 0} sold)</span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                                    user.is_active
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  }`}
                                >
                                  {user.is_active ? 'ACTIVE' : 'BLOCKED'}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                                      user.role === 'owner' || user.is_ad_free
                                        ? 'bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <Crown className="w-3 h-3 text-amber-600 inline" />
                                    <span>{user.role === 'owner' ? 'OWNER' : user.is_ad_free ? 'PRO' : 'FREE'}</span>
                                  </span>
                                  {user.role !== 'owner' && (
                                    <button
                                      onClick={() => handleUpdateUserTier(user.user_id, user.is_ad_free ? 'free' : 'pro', 30)}
                                      className="text-[10px] font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                                      title={user.is_ad_free ? 'Switch to Free Tier' : 'Grant 30-Day Pro'}
                                    >
                                      {user.is_ad_free ? 'Free' : 'Pro'}
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                                {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {user.role !== 'owner' && (
                                    <button
                                      onClick={() => handleToggleUserStatus(user)}
                                      className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                                        user.is_active
                                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                      }`}
                                      title={user.is_active ? 'Block Account' : 'Unblock Account'}
                                    >
                                      {user.is_active ? (
                                        <>
                                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                                          <span>Block</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Unblock</span>
                                        </>
                                      )}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setResettingUser(user);
                                      setResetNewPassword('');
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-amber-700 dark:text-amber-400 transition"
                                    title="Reset Password"
                                  >
                                    <Key className="w-4 h-4" />
                                  </button>

                                  {user.role !== 'owner' && (
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 transition"
                                      title="Delete Employee & Records"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: COMPANY PROPERTIES INSPECTION */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold theme-text-secondary uppercase tracking-wider font-brand">
              All Properties ({allProperties.length})
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 theme-text-tertiary" />
              <input
                type="text"
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Filter by plot #, society, or employee..."
                className="w-full pl-9 pr-3 py-1.5 theme-bg-card border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="theme-bg-card border theme-border rounded-2xl overflow-hidden theme-shadow">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b theme-border theme-bg-subtle theme-text-secondary font-semibold">
                    <th className="py-3 px-4">Plot / Society</th>
                    <th className="py-3 px-4">Size & Type</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Media</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border theme-text-main">
                  {filteredProperties.map((prop) => {
                    const priceInfo = formatPKR(prop.price);
                    return (
                      <tr key={prop.property_id} className="hover:theme-bg-subtle transition">
                        <td className="py-3 px-4">
                          <div className="font-bold theme-text-main">
                            Plot #{prop.plot_number} · {prop.block || 'Main'}
                          </div>
                          <div className="text-[11px] theme-text-tertiary">
                            {prop.society}, {prop.town}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <div>{prop.plot_size}</div>
                          <div className="text-[10px] theme-text-tertiary">{prop.plot_type}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">
                            {prop.employee_username}
                          </span>
                          <span className="block text-[10px] theme-text-tertiary">{prop.employee_name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold font-brand">{priceInfo.short}</div>
                          <div className="text-[10px] theme-text-tertiary font-mono">{priceInfo.full}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                              prop.status === 'Available'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : prop.status === 'On Hold'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {prop.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] theme-text-secondary">
                          {prop.images?.length || 0} pics
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteProperty(prop.property_id, prop.plot_number)}
                            className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 transition"
                            title="Delete Property (Director Authority)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ADVERTISEMENTS & PAID MEMBERSHIP MANAGEMENT */}
      {activeTab === 'ads' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold theme-text-secondary flex items-center justify-between">
                <span>Total Registered Users</span>
                <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="text-2xl font-bold theme-text-main mt-1 font-brand">
                {overview?.users?.length || 0}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">Accounts on this portal</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>Paid PRO (Ad-Free)</span>
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1 font-brand">
                {(overview?.users || []).filter((u: any) => u.is_ad_free || u.role === 'owner').length}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">100% Ad-Free active</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Free Users (With Ads)</span>
                <Sparkles className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold theme-text-main mt-1 font-brand">
                {(overview?.users || []).filter((u: any) => !u.is_ad_free && u.role !== 'owner').length}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">Sponsored ads enabled</p>
            </div>

            <div className="theme-bg-card border theme-border rounded-2xl p-4 theme-shadow">
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>Active Sponsor Ads</span>
                <Building className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 font-brand">
                {sponsorAdsList.filter(a => a.is_active).length}
              </div>
              <p className="text-[11px] theme-text-tertiary mt-0.5">Commercial ads in rotation</p>
            </div>
          </div>

          {/* Master Global Advertisements Switch Card */}
          <div className="p-5 sm:p-6 rounded-2xl border theme-border theme-bg-card theme-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono tracking-wider ${
                    adsEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {adsEnabled ? '● ADS ACTIVE' : '○ ADS PAUSED'}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold theme-text-main font-brand">
                  Global Advertisements Master Switch
                </h3>
                <p className="text-xs theme-text-secondary max-w-2xl leading-relaxed">
                  When enabled, all Free tier users will see partner and sponsor advertisements throughout the application. Paid Pro users and the system owner will never see ads. You can pause or resume all ads globally at any time with a single click.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleGlobalAds}
                  disabled={isTogglingAds}
                  className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md active:scale-95 disabled:opacity-50 ${
                    adsEnabled
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {isTogglingAds ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Switch...</span>
                    </>
                  ) : adsEnabled ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Turn Ads OFF</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-4 h-4" />
                      <span>Turn Ads ON</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Paid Pro (Ad-Free) Subscription Plan Settings Form */}
          <div className="p-5 sm:p-6 rounded-2xl border theme-border theme-bg-card theme-shadow space-y-4">
            <div className="flex items-center justify-between pb-3 border-b theme-border">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm sm:text-base font-bold theme-text-main font-brand">
                  Paid Version (Ad-Free PRO) Pricing & Instructions
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded">
                PKR {Number(proMonthlyPrice || 0).toLocaleString()} / Month
              </span>
            </div>

            <form onSubmit={handleSaveMonetizationSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Monthly Fee for Ad-Free Paid Version (PKR)
                  </label>
                  <input
                    type="number"
                    value={proMonthlyPrice}
                    onChange={(e) => setProMonthlyPrice(e.target.value)}
                    placeholder="1500"
                    required
                    className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] theme-text-tertiary mt-1 block">
                    This price is shown to free users inside the "Upgrade to Pro" modal.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Direct Owner WhatsApp for Payment Proof
                  </label>
                  <input
                    type="text"
                    value={ownerWhatsApp}
                    onChange={(e) => setOwnerWhatsApp(e.target.value)}
                    placeholder="+92 3082665978"
                    required
                    className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] theme-text-tertiary mt-1 block">
                    Clients send payment screenshot here to activate Ad-Free version.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Payment Accounts (EasyPaisa / JazzCash / Bank Transfer Details)
                </label>
                <textarea
                  rows={2}
                  value={paymentInstructions}
                  onChange={(e) => setPaymentInstructions(e.target.value)}
                  placeholder="EasyPaisa: 0308-2665978 (Malik Abbas) / JazzCash: 0308-2665978 / Meezan Bank A/C: 1234..."
                  className="w-full px-3.5 py-2.5 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Google AdSense / AdMob Configuration */}
              <div className="p-4 rounded-xl border border-sky-300/60 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-300">
                    Google Ads / AdMob Publisher Settings
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-200/60 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300">
                    OPTIONAL
                  </span>
                </div>
                <p className="text-[11px] theme-text-secondary leading-relaxed">
                  When you are ready to display Google Ads across the app, enter your Google AdSense Publisher ID (e.g. <span className="font-mono text-sky-700 dark:text-sky-400">ca-pub-XXXXXXXXXXXXXXXX</span>) and Ad Unit Slot ID below, then toggle the Master Ad Switch ON.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
                      Google AdSense Publisher Client ID
                    </label>
                    <input
                      type="text"
                      value={googleAdClient}
                      onChange={(e) => setGoogleAdClient(e.target.value)}
                      placeholder="ca-pub-1234567890123456"
                      className="w-full px-3 py-2 theme-bg-card border theme-border rounded-xl text-xs theme-text-main font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold theme-text-secondary mb-1">
                      Ad Unit Slot ID (AdMob / AdSense)
                    </label>
                    <input
                      type="text"
                      value={googleAdSlot}
                      onChange={(e) => setGoogleAdSlot(e.target.value)}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 theme-bg-card border theme-border rounded-xl text-xs theme-text-main font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSavingMonetization}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingMonetization ? 'Saving Settings...' : 'Save Monetization Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* User Subscription Tiers Management Table */}
          <div className="p-5 sm:p-6 rounded-2xl border theme-border theme-bg-card theme-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b theme-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold theme-text-main font-brand flex items-center gap-2">
                  <span>User Memberships & Ad-Free Permissions</span>
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  Easily switch any user between Free (Ad-Supported) and Paid (Ad-Free) tiers with one click.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border theme-border rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b theme-border theme-bg-subtle theme-text-secondary font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Current Plan</th>
                    <th className="py-3 px-4">Ad-Free Expiry</th>
                    <th className="py-3 px-4 text-right">Quick Tier Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border theme-text-main">
                  {(overview?.users || []).map((u: any) => {
                    const isPro = u.role === 'owner' || u.is_ad_free || u.subscription_tier === 'pro';

                    return (
                      <tr key={u.user_id} className="hover:theme-bg-subtle transition">
                        <td className="py-3 px-4">
                          <div className="font-bold theme-text-main">{u.full_name}</div>
                          <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                            @{u.username}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] theme-text-secondary">
                          {u.phone || u.email || 'N/A'}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-max ${
                            isPro
                              ? 'bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}>
                            <Crown className="w-3 h-3 text-amber-600 inline" />
                            <span>{u.role === 'owner' ? 'OWNER (100% NO ADS)' : u.is_ad_free ? 'PAID PRO (NO ADS)' : 'FREE (ADS ACTIVE)'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] theme-text-tertiary">
                          {u.role === 'owner' ? 'Lifetime (Permanent)' : u.subscription_expires_at ? new Date(u.subscription_expires_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {u.role !== 'owner' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {!u.is_ad_free ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateUserTier(u.user_id, 'pro', 30)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 transition"
                                    title="Grant 30 Days Ad-Free Pro"
                                  >
                                    <Crown className="w-3 h-3" />
                                    <span>Grant 30 Days Pro</span>
                                  </button>
                                  <button
                                    onClick={() => handleUpdateUserTier(u.user_id, 'pro', 365)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs active:scale-95 transition"
                                    title="Grant 1 Year Pro"
                                  >
                                    <span>1 Year</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleUpdateUserTier(u.user_id, 'free', 0)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition"
                                  title="Revert user to Free Ad-Supported tier"
                                >
                                  <span>Move to Free (With Ads)</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                              System Owner
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sponsor Ads Management */}
          <div className="p-5 sm:p-6 rounded-2xl border theme-border theme-bg-card theme-shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b theme-border">
              <div>
                <h3 className="text-sm sm:text-base font-bold theme-text-main font-brand flex items-center gap-2">
                  <span>Sponsored Real Estate Partners & Ads ({sponsorAdsList.length})</span>
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  These advertisements are visible only to users on the Free Tier.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAdModal(true)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Sponsor Ad</span>
              </button>
            </div>

            {/* Ads Grid */}
            {sponsorAdsList.length === 0 ? (
              <div className="text-center py-10 theme-bg-subtle rounded-xl border theme-border p-6">
                <Building className="w-10 h-10 theme-text-tertiary mx-auto mb-2 opacity-40" />
                <h4 className="text-sm font-bold theme-text-main">No Sponsor Ads in Rotation</h4>
                <p className="text-xs theme-text-secondary mt-1">
                  Add local builder materials, bank financing desks, or 3D architect advertisements.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsorAdsList.map((ad) => (
                  <div
                    key={ad.ad_id}
                    className={`p-4 rounded-2xl border transition theme-shadow space-y-2.5 ${
                      ad.is_active
                        ? 'theme-bg-card border-sky-300/80 dark:border-sky-800'
                        : 'theme-bg-subtle border-stone-300 dark:border-stone-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200">
                          {ad.category}
                        </span>
                        {ad.badge_label && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono">
                            {ad.badge_label}
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ad.is_active
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {ad.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold theme-text-main font-brand">{ad.title}</h4>
                      <p className="text-xs text-sky-800 dark:text-sky-300 font-semibold">{ad.sponsor_name} — {ad.tagline}</p>
                      <p className="text-xs theme-text-secondary mt-1 line-clamp-2 leading-relaxed">{ad.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t theme-border text-xs">
                      <div className="flex items-center gap-2 font-mono text-[11px] theme-text-secondary">
                        {ad.phone && <span>📞 {ad.phone}</span>}
                        {ad.whatsapp && <span>💬 {ad.whatsapp}</span>}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleAdStatus(ad)}
                          className="px-2.5 py-1 rounded-lg theme-bg-subtle hover:theme-bg-card border theme-border text-[11px] font-semibold transition"
                        >
                          {ad.is_active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAd(ad.ad_id)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE & BACKUP */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b theme-border">
              <Download className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
                Export Complete Company Backup
              </h2>
            </div>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Download a complete JSON snapshot containing all employee user accounts, property records, high-resolution photo archives, and activity history.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Company Database JSON</span>
            </button>
          </div>

          <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b theme-border">
              <Upload className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h2 className="text-sm font-bold theme-text-main uppercase tracking-wider font-brand">
                Restore Database From JSON
              </h2>
            </div>
            <p className="text-xs theme-text-secondary leading-relaxed">
              Upload a previously exported backup file to restore property records.
            </p>
            <div className="space-y-3">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs theme-text-main file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:theme-border file:text-xs file:font-semibold file:bg-amber-500/10 file:text-amber-800 dark:file:text-amber-300"
              />
              <button
                onClick={handleRestoreBackup}
                disabled={!restoreFile}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50 transition shadow-sm active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Restore Backup (Overwrites Current DB)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT ACTIVITY LOGS */}
      {activeTab === 'logs' && (
        <div className="theme-bg-card border theme-border rounded-2xl p-5 sm:p-6 theme-shadow space-y-4">
          <h2 className="text-sm font-bold theme-text-secondary uppercase tracking-wider font-brand">
            Real-Time Company Activity Audit Log
          </h2>

          <div className="space-y-2">
            {overview?.activity_logs?.map((log: ActivityLog) => (
              <div
                key={log.log_id}
                className="p-3 rounded-xl theme-bg-subtle border theme-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold uppercase">
                    {log.action}
                  </span>
                  <div>
                    <span className="font-semibold theme-text-main">{log.username}: </span>
                    <span className="theme-text-secondary">{log.details}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono theme-text-tertiary whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl theme-bg-card border theme-border p-6 shadow-2xl theme-text-main">
            <h3 className="text-base font-bold text-amber-700 dark:text-amber-400 font-brand">
              Create New Employee Account
            </h3>
            <p className="text-xs theme-text-tertiary mt-1">
              Add a new office employee with strictly isolated property records.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Employee ID / Username (e.g. EMP-104)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="EMP-104"
                  required
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Bilal Farooq"
                  required
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="user">Office Employee (Normal User)</option>
                  <option value="owner">Executive Owner</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 py-2 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-secondary hover:theme-bg-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Sponsor Ad Modal */}
      {showNewAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl theme-bg-card border theme-border p-6 shadow-2xl theme-text-main max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b theme-border mb-4">
              <div>
                <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 font-brand">
                  Create New Sponsor Advertisement
                </h3>
                <p className="text-xs theme-text-secondary mt-0.5">
                  This advertisement will be displayed to Free Tier users across the app.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewAdModal(false)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-stone-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSponsorAd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Ad Title *
                </label>
                <input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="e.g. Supreme Ready-Mix & DG Cement"
                  required
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Sponsor / Company Name *
                  </label>
                  <input
                    type="text"
                    value={newAdSponsorName}
                    onChange={(e) => setNewAdSponsorName(e.target.value)}
                    placeholder="e.g. Askari & DG Cement Hub"
                    required
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={newAdCategory}
                    onChange={(e) => setNewAdCategory(e.target.value as any)}
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-sky-500"
                  >
                    <option value="Building Materials">Building Materials (Cement, Steel, Sand)</option>
                    <option value="Bank Loan">Bank Housing Finance</option>
                    <option value="Solar & Electric">Solar & Energy Systems</option>
                    <option value="Architect & 3D">Architect & 3D Floor Maps</option>
                    <option value="Legal & Taxes">Legal Advisory & Registration</option>
                    <option value="General">General Services</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={newAdTagline}
                  onChange={(e) => setNewAdTagline(e.target.value)}
                  placeholder="e.g. Best Wholesale Rates for Real Estate Builders"
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold theme-text-secondary mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={newAdDescription}
                  onChange={(e) => setNewAdDescription(e.target.value)}
                  placeholder="e.g. Factory direct delivery across all housing schemes. Exclusive bulk discount rates."
                  required
                  className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newAdPhone}
                    onChange={(e) => setNewAdPhone(e.target.value)}
                    placeholder="+92 300 8492011"
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={newAdWhatsapp}
                    onChange={(e) => setNewAdWhatsapp(e.target.value)}
                    placeholder="+92 300 8492011"
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={newAdCtaText}
                    onChange={(e) => setNewAdCtaText(e.target.value)}
                    placeholder="Call for Daily Rate"
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-secondary mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={newAdBadge}
                    onChange={(e) => setNewAdBadge(e.target.value)}
                    placeholder="HOT DEAL / VERIFIED"
                    className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t theme-border">
                <button
                  type="button"
                  onClick={() => setShowNewAdModal(false)}
                  className="flex-1 py-2.5 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-secondary hover:theme-bg-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Publish Sponsor Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl theme-bg-card border theme-border p-6 shadow-2xl theme-text-main">
            <h3 className="text-base font-bold text-amber-700 dark:text-amber-400 font-brand">
              Reset Password for {resettingUser.username}
            </h3>
            <p className="text-xs theme-text-tertiary mt-1">
              Enter a new secure password for {resettingUser.full_name}.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 mt-4">
              <input
                type="password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                placeholder="New password (min 4 chars)"
                required
                className="w-full px-3 py-2 theme-bg-subtle border theme-border rounded-xl text-xs theme-text-main focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="flex-1 py-2 rounded-xl theme-bg-subtle text-xs font-semibold theme-text-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
