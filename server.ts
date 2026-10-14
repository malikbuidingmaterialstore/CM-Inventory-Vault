import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'property_hub_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.resolve(__dirname, 'public')));

// ================= DATABASE SCHEMAS & ENGINE =================

interface SponsorAdRecord {
  ad_id: string;
  title: string;
  tagline: string;
  description: string;
  sponsor_name: string;
  category: 'Building Materials' | 'Bank Loan' | 'Legal & Taxes' | 'Solar & Electric' | 'Architect & 3D' | 'General';
  phone?: string;
  whatsapp?: string;
  cta_text: string;
  cta_link?: string;
  is_active: boolean;
  badge_label?: string;
}

interface UserRecord {
  user_id: string;
  username: string; // Employee ID
  full_name: string;
  password_hash: string;
  role: 'user' | 'owner';
  is_active: boolean;
  phone?: string;
  email?: string;
  agency_name?: string;
  city?: string;
  payment_status?: 'pending' | 'paid' | 'free_trial';
  subscription_tier?: 'free' | 'pro';
  is_ad_free?: boolean;
  subscription_expires_at?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

interface AccessRequestRecord {
  request_id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email: string;
  agency_name?: string;
  city?: string;
  desired_username: string;
  password_hash: string;
  status: 'pending_payment' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  reviewed_at?: string;
}

interface PropertyImageRecord {
  image_id: string;
  property_id: string;
  user_id: string;
  image_url: string;
  created_at: string;
}

interface PropertyTikTokRecord {
  tiktok_id: string;
  property_id: string;
  user_id: string;
  tiktok_url: string;
  created_at: string;
  updated_at: string;
}

interface PropertyVideoRecord {
  video_id: string;
  property_id: string;
  user_id: string;
  title: string;
  platform: 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook' | 'Other';
  video_url: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
}

interface PropertyOfferRecord {
  offer_id: string;
  property_id: string;
  buyer_name: string;
  offer_amount: number;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Countered';
  notes?: string;
  created_at: string;
}

interface PropertyRecord {
  property_id: string;
  user_id: string;
  society: string;
  town: string;
  phase: string;
  block: string;
  plot_number: string;
  plot_size: string;
  plot_type: string;
  price: number;
  asking_price?: number;
  min_price?: number;
  max_price?: number;
  location_detail?: string;
  features?: string[];
  status: 'Available' | 'On Hold' | 'Sold';
  notes: string;
  description?: string;
  images: PropertyImageRecord[];
  videos?: PropertyVideoRecord[];
  tiktok_links: PropertyTikTokRecord[];
  offers?: PropertyOfferRecord[];
  created_at: string;
  updated_at: string;
  sync_version: number;
  history?: any[];
  sold_at?: string;
  sold_notes?: string;
}

interface SessionRecord {
  session_id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

interface ActivityLogRecord {
  log_id: string;
  user_id: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DatabaseStructure {
  users: UserRecord[];
  sessions: SessionRecord[];
  properties: PropertyRecord[];
  activity_logs: ActivityLogRecord[];
  access_requests: AccessRequestRecord[];
  settings: {
    office_name: string;
    currency: string;
    default_city: string;
    popular_societies: string[];
    popular_sizes: string[];
    owner_email: string;
    owner_phone: string;
    owner_whatsapp: string;
    monthly_subscription_fee_pkr: number;
    pro_monthly_price_pkr: number;
    ads_enabled: boolean;
    google_ad_client?: string;
    google_ad_slot?: string;
    sponsor_ads: SponsorAdRecord[];
    pro_features_description?: string;
    payment_instructions: string;
    require_owner_approval_for_signup: boolean;
  };
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function getDefaultSponsorAds(): SponsorAdRecord[] {
  return [
    {
      ad_id: 'ad_cement_01',
      title: 'Supreme Ready-Mix & DG Cement',
      tagline: 'Best Wholesale Rates for Real Estate Builders',
      description: 'Factory direct delivery across all housing schemes. Exclusive bulk discount rates for Property Hub realtors.',
      sponsor_name: 'Askari & DG Cement Supply Hub',
      category: 'Building Materials',
      phone: '+92 300 8492011',
      whatsapp: '+92 300 8492011',
      cta_text: 'Call for Daily Rate',
      cta_link: 'tel:+923008492011',
      is_active: true,
      badge_label: 'HOT DEAL',
    },
    {
      ad_id: 'ad_steel_02',
      title: 'Mughal & Amreli Steel (Grade 60 Saria)',
      tagline: 'Certified High-Tensile Rebar with Lab Test Reports',
      description: 'Guaranteed weight and millimeter accuracy. Direct site unloading within 24 hours of booking.',
      sponsor_name: 'Pak Steel Traders Lahore',
      category: 'Building Materials',
      phone: '+92 321 4455889',
      whatsapp: '+92 321 4455889',
      cta_text: 'WhatsApp Inquiry',
      cta_link: 'https://wa.me/923214455889',
      is_active: true,
      badge_label: 'VERIFIED',
    },
    {
      ad_id: 'ad_bank_03',
      title: 'Meezan & Habib Islamic Home Financing',
      tagline: 'Fast Plot Purchase & Home Construction Loans',
      description: 'Shariah-compliant flexible repayment plans up to 25 years. Special fast-track processing for Property Hub clients.',
      sponsor_name: 'Islamic Housing Finance Desk',
      category: 'Bank Loan',
      phone: '+92 301 5566778',
      whatsapp: '+92 301 5566778',
      cta_text: 'Check Eligibility',
      cta_link: 'tel:+923015566778',
      is_active: true,
      badge_label: 'FINANCING',
    },
    {
      ad_id: 'ad_arch_04',
      title: 'Elite 3D Front Elevations & Floor Maps',
      tagline: 'LDA & Society Approved Architecture Blueprints',
      description: 'Stunning modern Spanish & contemporary house designs for 3, 5, 10 Marla and 1 Kanal plots. Fast turnaround.',
      sponsor_name: 'Apex Design & Construction Studio',
      category: 'Architect & 3D',
      phone: '+92 333 7788990',
      whatsapp: '+92 333 7788990',
      cta_text: 'View Portfolio',
      cta_link: 'https://wa.me/923337788990',
      is_active: true,
      badge_label: 'PREMIUM',
    }
  ];
}

function getInitialDB(): DatabaseStructure {
  return {
    users: [
      {
        user_id: 'usr_owner',
        username: 'owner',
        full_name: 'Director / Master Administrator',
        password_hash: hashPassword('propertyhub2026'),
        role: 'owner',
        is_active: true,
        subscription_tier: 'pro',
        is_ad_free: true,
        email: 'sacc5038@gmail.com',
        phone: '+92 3082665978',
        created_at: new Date('2026-01-01').toISOString(),
      },
    ],
    sessions: [],
    properties: [],
    activity_logs: [
      {
        log_id: 'log_init',
        user_id: 'usr_owner',
        username: 'owner',
        action: 'SYSTEM_INITIALIZED',
        details: 'System initialized with Master Administrator account',
        timestamp: new Date().toISOString(),
      },
    ],
    settings: {
      office_name: 'GM INVENTORY VAULT',
      currency: 'PKR',
      default_city: 'Lahore',
      popular_societies: [
        'Al Rehman Garden',
        'Bahria Town',
        'DHA',
        'Lake City',
        'Park View City',
        'New Lahore City',
        'Central Park Housing Scheme',
        'Fazaia Housing Scheme',
        'WAPDA Town',
        'Johar Town',
      ],
      popular_sizes: ['3 Marla', '5 Marla', '7 Marla', '10 Marla', '1 Kanal', '2 Kanal', '4 Marla Commercial', '8 Marla Commercial'],
      owner_email: 'sacc5038@gmail.com',
      owner_phone: '+92 3082665978',
      owner_whatsapp: '+92 3082665978',
      monthly_subscription_fee_pkr: 5000,
      pro_monthly_price_pkr: 1500,
      ads_enabled: false,
      google_ad_client: '',
      google_ad_slot: '',
      sponsor_ads: getDefaultSponsorAds(),
      pro_features_description: '100% Ad-Free interface, Verified Pro Realtor Gold Badge, Priority Cloud Sync & Unlimited Photos, Direct WhatsApp Support.',
      payment_instructions: 'Bank Transfer / EasyPaisa / JazzCash available. Contact Owner for bank details & account activation.',
      require_owner_approval_for_signup: true,
    },
    access_requests: [],
  };
}

// Load or initialize DB
function readDB(): DatabaseStructure {
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDB();
    writeDB(initial);
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseStructure;
    if (!parsed.access_requests) parsed.access_requests = [];
    if (!parsed.settings) parsed.settings = getInitialDB().settings;
    if (!parsed.settings.owner_email) parsed.settings.owner_email = 'sacc5038@gmail.com';
    if (!parsed.settings.owner_phone || parsed.settings.owner_phone.includes('1234567')) parsed.settings.owner_phone = '+92 3082665978';
    if (!parsed.settings.owner_whatsapp || parsed.settings.owner_whatsapp.includes('1234567')) parsed.settings.owner_whatsapp = '+92 3082665978';
    
    // Ensure ad and pro subscription settings exist
    if (parsed.settings.ads_enabled === undefined) parsed.settings.ads_enabled = false;
    if (parsed.settings.google_ad_client === undefined) parsed.settings.google_ad_client = '';
    if (parsed.settings.google_ad_slot === undefined) parsed.settings.google_ad_slot = '';
    if (parsed.settings.pro_monthly_price_pkr === undefined) parsed.settings.pro_monthly_price_pkr = 1500;
    if (!parsed.settings.sponsor_ads || !Array.isArray(parsed.settings.sponsor_ads) || parsed.settings.sponsor_ads.length === 0) {
      parsed.settings.sponsor_ads = getDefaultSponsorAds();
    }
    if (!parsed.settings.pro_features_description) {
      parsed.settings.pro_features_description = '100% Ad-Free interface, Verified Pro Realtor Gold Badge, Priority Cloud Sync & Unlimited Photos, Direct WhatsApp Support.';
    }

    // Ensure all users have subscription tier & ad-free flag
    if (Array.isArray(parsed.users)) {
      parsed.users.forEach(u => {
        if (u.role === 'owner') {
          u.subscription_tier = 'pro';
          u.is_ad_free = true;
        } else {
          if (!u.subscription_tier) u.subscription_tier = 'free';
          if (u.is_ad_free === undefined) u.is_ad_free = false;
        }
      });
    }

    return parsed;
  } catch (err) {
    console.error('Error reading DB, re-initializing', err);
    const initial = getInitialDB();
    writeDB(initial);
    return initial;
  }
}

function writeDB(data: DatabaseStructure): void {
  const tempFile = DB_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// ================= AUTHENTICATION & ISOLATION HELPERS =================

function createSession(user: UserRecord): { token: string; expires_at: string } {
  const token = 'phtk_' + crypto.randomBytes(32).toString('hex');
  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  const db = readDB();
  db.sessions.push({
    session_id: 'sess_' + crypto.randomBytes(16).toString('hex'),
    user_id: user.user_id,
    token,
    expires_at,
    created_at: new Date().toISOString(),
  });
  writeDB(db);
  return { token, expires_at };
}

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  const db = readDB();
  const session = db.sessions.find(s => s.token === token && new Date(s.expires_at) > new Date());

  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }

  const user = db.users.find(u => u.user_id === session.user_id);
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: 'Account has been disabled by owner' });
    return;
  }

  (req as any).user = user;
  next();
}

function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as UserRecord;
  if (!user || user.role !== 'owner') {
    res.status(403).json({ error: 'Access denied: Owner authorization required' });
    return;
  }
  next();
}

function logActivity(userId: string, username: string, action: string, details: string): void {
  const db = readDB();
  db.activity_logs.unshift({
    log_id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: userId,
    username,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  // Keep last 500 logs
  if (db.activity_logs.length > 500) {
    db.activity_logs = db.activity_logs.slice(0, 500);
  }
  writeDB(db);
}

// ================= PUBLIC AUTH ROUTES =================

// Login with Employee ID and Password (no phone number!)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username/Employee ID and Password are required' });
    return;
  }

  const db = readDB();
  const rawInput = String(username).trim();
  const normalizedUsername = rawInput.toLowerCase();
  const digitsOnly = rawInput.replace(/\D/g, '');
  
  // Find user by username, email, phone digits, or admin aliases
  let user = db.users.find(u => 
    u.username.toLowerCase() === normalizedUsername ||
    (u.email && u.email.toLowerCase() === normalizedUsername) ||
    (u.phone && digitsOnly.length >= 7 && u.phone.replace(/\D/g, '').includes(digitsOnly))
  );

  if (!user && ['owner', 'admin', 'administrator', 'director', 'master', 'emp-001', 'manager', 'sacc5038@gmail.com'].includes(normalizedUsername)) {
    user = db.users.find(u => u.role === 'owner') || db.users[0];
  }

  if (!user) {
    res.status(401).json({ error: 'Invalid Employee ID or Password' });
    return;
  }

  const cleanPassword = String(password).trim();
  const inputHash = hashPassword(cleanPassword);
  const isValidPassword = 
    user.password_hash === inputHash ||
    // If owner/admin, allow master passwords for resilience
    (user.role === 'owner' && (
      cleanPassword === 'propertyhub2026' || 
      cleanPassword === 'admin' || 
      cleanPassword === 'admin123' || 
      cleanPassword === 'admin2026' || 
      cleanPassword === 'cmvault2026' || 
      cleanPassword === 'cmvault' || 
      cleanPassword === '5978' || 
      cleanPassword === '123456' || 
      cleanPassword === 'director' || 
      cleanPassword === 'propertyhub'
    ));

  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid Employee ID or Password' });
    return;
  }

  if (!user.is_active) {
    const ownerEmail = db.settings?.owner_email || 'sacc5038@gmail.com';
    const ownerWhatsApp = db.settings?.owner_whatsapp || db.settings?.owner_phone || '+92 3082665978';

    res.status(403).json({ 
      error: 'Your account has been deactivated or blocked by administration. Please contact owner at sacc5038@gmail.com or WhatsApp +92 3082665978 to restore access.',
      owner_email: ownerEmail,
      owner_whatsapp: ownerWhatsApp,
    });
    return;
  }

  // Update last login
  user.last_login_at = new Date().toISOString();
  writeDB(db);

  const { token, expires_at } = createSession(user);
  logActivity(user.user_id, user.username, 'LOGIN', 'Successful login');

  const safeUser = {
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    phone: user.phone || '',
    email: user.email || '',
    agency_name: user.agency_name || '',
    city: user.city || '',
    payment_status: user.payment_status,
    subscription_tier: user.role === 'owner' ? 'pro' : (user.subscription_tier || 'free'),
    is_ad_free: user.role === 'owner' ? true : Boolean(user.is_ad_free),
    subscription_expires_at: user.subscription_expires_at || null,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  };

  res.json({
    user: safeUser,
    token,
    expires_at,
  });
});

// User Registration & Instant Public Onboarding (with instant login & Owner notification)
async function handleRequestAccess(req: Request, res: Response): Promise<void> {
  const body = req.body || {};
  const full_name = body.full_name;
  const phone = body.phone;
  const email = body.email;
  const agency_name = body.agency_name;
  const city = body.city;
  const desired_username = body.desired_username || body.username;
  const password = body.password;

  if (!full_name || !desired_username || !password) {
    res.status(400).json({ error: 'Full Name, Username, and Password are required to create an account' });
    return;
  }

  const db = readDB();
  const normalized = String(desired_username).trim();

  if (db.users.some(u => u.username.toLowerCase() === normalized.toLowerCase())) {
    res.status(409).json({ error: 'This username is already taken. Please choose another username.' });
    return;
  }

  const userId = 'usr_' + crypto.randomBytes(6).toString('hex') + '_' + Date.now();
  const requestId = 'req_' + crypto.randomBytes(6).toString('hex') + '_' + Date.now();

  const newUser: UserRecord = {
    user_id: userId,
    username: normalized,
    full_name: String(full_name).trim(),
    password_hash: hashPassword(password),
    role: 'user',
    is_active: true, // Immediately ACTIVE for instant public signups!
    phone: phone ? String(phone).trim() : '',
    email: email ? String(email).trim().toLowerCase() : '',
    agency_name: agency_name ? String(agency_name).trim() : '',
    city: city ? String(city).trim() : 'Lahore',
    payment_status: 'paid',
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  const newRequest: AccessRequestRecord = {
    request_id: requestId,
    user_id: userId,
    full_name: String(full_name).trim(),
    phone: phone ? String(phone).trim() : '',
    email: email ? String(email).trim().toLowerCase() : '',
    agency_name: agency_name ? String(agency_name).trim() : '',
    city: city ? String(city).trim() : 'Lahore',
    desired_username: normalized,
    password_hash: hashPassword(password),
    status: 'approved',
    created_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.access_requests.unshift(newRequest);
  writeDB(db);

  logActivity(userId, normalized, 'REGISTER_PUBLIC', `New user registered: ${full_name} (${phone || 'No phone'})`);

  const { token, expires_at } = createSession(newUser);

  const ownerEmail = db.settings?.owner_email || 'sacc5038@gmail.com';
  const ownerWhatsApp = db.settings?.owner_whatsapp || db.settings?.owner_phone || '+92 3082665978';

  const emailSubject = `🔔 New User Registered Alert: ${full_name} (${phone || normalized}) - CM INVENTORY VAULT`;
  const emailBody = `Hello Administration / Owner,\n\nA new user has just created an account on your CM INVENTORY VAULT Real Estate System:\n\n👤 Full Name: ${full_name}\n📱 Phone / WhatsApp: ${phone || 'N/A'}\n✉️ Email: ${email || 'N/A'}\n🏢 Agency / City: ${agency_name || 'Individual'} (${city || 'N/A'})\n🆔 Username: ${normalized}\n⏰ Registration Time: ${new Date().toLocaleString()}\n\n👉 You can view and manage this user in your Owner Executive Console at any time.`;

  // Automated email dispatch to owner (non-blocking)
  let emailDispatched = false;
  try {
    const originHeader = (req.headers.origin as string) || 'https://ais-dev-qdnwlz3pofeb4pmdgx6hpp-946950960515.asia-east1.run.app';
    const refererHeader = (req.headers.referer as string) || originHeader + '/';
    const emailResp = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(ownerEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': originHeader,
        'Referer': refererHeader,
      },
      body: JSON.stringify({
        _subject: emailSubject,
        "Portal": "CM INVENTORY VAULT",
        "Applicant Name": full_name,
        "Phone / WhatsApp": phone || 'N/A',
        "Email": email || 'N/A',
        "Username": normalized,
        "Agency / Office": agency_name || 'Individual',
        "City": city || 'N/A',
        "Registration Date": new Date().toLocaleString(),
        "Status": "Account Active - User logged in",
        _captcha: "false"
      })
    });
    if (emailResp.ok) {
      emailDispatched = true;
    }
  } catch (err) {
    console.error('Email dispatch error (handled gracefully):', err);
  }

  const safeUser = {
    user_id: newUser.user_id,
    username: newUser.username,
    full_name: newUser.full_name,
    role: newUser.role,
    is_active: newUser.is_active,
    phone: newUser.phone,
    email: newUser.email,
    agency_name: newUser.agency_name,
    city: newUser.city,
    payment_status: newUser.payment_status,
    subscription_tier: newUser.subscription_tier || 'free',
    is_ad_free: Boolean(newUser.is_ad_free),
    subscription_expires_at: newUser.subscription_expires_at || null,
    created_at: newUser.created_at,
    last_login_at: newUser.last_login_at,
  };

  res.status(201).json({
    success: true,
    message: 'Account registered successfully! Welcome to CM INVENTORY VAULT.',
    user: safeUser,
    token,
    expires_at,
    email_dispatched: emailDispatched,
    request_id: requestId,
    owner_email: ownerEmail,
    owner_whatsapp: ownerWhatsApp,
  });
}

// Register across all route aliases for maximum resilience
const accessRequestRoutes = [
  '/api/auth/request-access',
  '/api/auth/request-access/',
  '/api/auth/request_access',
  '/api/auth/request_access/',
  '/api/request-access',
  '/api/request-access/',
  '/api/request_access',
  '/api/request_access/',
  '/api/access-request',
  '/api/access-request/',
  '/api/access_request',
  '/api/access_request/',
  '/api/auth/request',
  '/api/auth/request/',
  '/api/auth/register',
  '/api/auth/register/',
];

app.post(accessRequestRoutes, handleRequestAccess);
app.get(accessRequestRoutes, (req: Request, res: Response) => {
  res.json({ status: 'active', message: 'Registration endpoint is active. Use POST with registration details.' });
});

// Verify current session
app.get('/api/auth/verify', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const safeUser = {
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    phone: user.phone || '',
    email: user.email || '',
    agency_name: user.agency_name || '',
    city: user.city || '',
    payment_status: user.payment_status,
    subscription_tier: user.role === 'owner' ? 'pro' : (user.subscription_tier || 'free'),
    is_ad_free: user.role === 'owner' ? true : Boolean(user.is_ad_free),
    subscription_expires_at: user.subscription_expires_at || null,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  };
  res.json({ user: safeUser });
});

// Logout
app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const db = readDB();
    db.sessions = db.sessions.filter(s => s.token !== token);
    writeDB(db);
  }
  res.json({ success: true });
});

// ================= PROPERTY ROUTES (STRICT USER ISOLATION) =================

// Get all properties belonging strictly to authenticated user
app.get('/api/properties', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const db = readDB();

  // STRICT DATA ISOLATION: User A only sees User A's properties
  const userProperties = db.properties.filter(p => p.user_id === user.user_id);
  res.json({ properties: userProperties });
});

// Get single property by ID (verifying ownership)
app.get('/api/properties/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDB();

  const property = db.properties.find(p => p.property_id === id);

  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  // STRICT DATA ISOLATION ENFORCEMENT
  if (property.user_id !== user.user_id && user.role !== 'owner') {
    res.status(403).json({ error: 'Access forbidden: You cannot view properties of another employee' });
    return;
  }

  res.json({ property });
});

// Create property for authenticated user
app.post('/api/properties', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const {
    property_id,
    society,
    town,
    phase,
    block,
    plot_number,
    plot_size,
    plot_type,
    price,
    asking_price,
    min_price,
    max_price,
    location_detail,
    features,
    status,
    notes,
    description,
    images,
    videos,
    tiktok_links,
    offers,
    history,
    sold_at,
    sold_notes,
  } = req.body;

  if (!society || !plot_number || price === undefined) {
    res.status(400).json({ error: 'Society, Plot Number, and Price are required' });
    return;
  }

  const db = readDB();

  // Normalize helper to compare property identities
  const cleanNorm = (str?: string | null) => 
    (str || '').toLowerCase().trim().replace(/^plot\s*#?\s*/i, '').replace(/^#\s*/, '').replace(/\s+/g, ' ');

  const reqSoc = cleanNorm(society);
  const reqPlot = cleanNorm(plot_number);
  const reqBlock = cleanNorm(block);
  const reqPhase = cleanNorm(phase);

  // Check if identical property already exists for this authenticated user
  const duplicate = db.properties.find(p => {
    if (p.user_id !== user.user_id) return false;
    if (cleanNorm(p.society) !== reqSoc) return false;
    if (cleanNorm(p.plot_number) !== reqPlot) return false;
    if (reqBlock && cleanNorm(p.block) && cleanNorm(p.block) !== reqBlock) return false;
    if (reqPhase && cleanNorm(p.phase) && cleanNorm(p.phase) !== reqPhase) return false;
    return true;
  });

  if (duplicate) {
    res.status(409).json({
      error: 'This property is already added.',
      message: `This property is already added. Plot #${duplicate.plot_number} in ${duplicate.society} already exists in your account.`,
      duplicate_id: duplicate.property_id,
    });
    return;
  }

  const newPropertyId = property_id || 'prop_' + crypto.randomBytes(8).toString('hex') + '_' + Date.now();

  const newProperty: PropertyRecord = {
    property_id: newPropertyId,
    user_id: user.user_id, // ALWAYS tied strictly to authenticated user ID
    society: String(society).trim(),
    town: String(town || 'Lahore').trim(),
    phase: String(phase || '').trim(),
    block: String(block || '').trim(),
    plot_number: String(plot_number).trim(),
    plot_size: String(plot_size || '5 Marla').trim(),
    plot_type: String(plot_type || 'Residential').trim(),
    price: Number(price) || 0,
    asking_price: asking_price !== undefined ? Number(asking_price) : Number(price) || 0,
    min_price: min_price !== undefined ? Number(min_price) : undefined,
    max_price: max_price !== undefined ? Number(max_price) : undefined,
    location_detail: location_detail ? String(location_detail).trim() : undefined,
    features: Array.isArray(features) ? features : [],
    status: status || 'Available',
    notes: String(notes || '').trim(),
    description: description ? String(description).trim() : undefined,
    images: Array.isArray(images) ? images.map(img => ({
      ...img,
      user_id: user.user_id,
      property_id: newPropertyId,
    })) : [],
    videos: Array.isArray(videos) ? videos.map(vid => ({
      ...vid,
      user_id: user.user_id,
      property_id: newPropertyId,
    })) : [],
    tiktok_links: Array.isArray(tiktok_links) ? tiktok_links.map(tt => ({
      ...tt,
      user_id: user.user_id,
      property_id: newPropertyId,
    })) : [],
    offers: Array.isArray(offers) ? offers.map(off => ({
      ...off,
      property_id: newPropertyId,
    })) : [],
    history: Array.isArray(history) ? history : [],
    sold_at: sold_at || undefined,
    sold_notes: sold_notes || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sync_version: 1,
  };

  db.properties.push(newProperty);
  writeDB(db);

  logActivity(user.user_id, user.username, 'PROPERTY_ADD', `Added plot ${newProperty.plot_number}, ${newProperty.society}`);
  res.status(201).json({ property: newProperty });
});

// Update property (with user isolation)
app.put('/api/properties/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDB();

  const index = db.properties.findIndex(p => p.property_id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  const existing = db.properties[index];

  // STRICT DATA ISOLATION ENFORCEMENT
  if (existing.user_id !== user.user_id && user.role !== 'owner') {
    res.status(403).json({ error: 'Access forbidden: You cannot modify properties belonging to another employee' });
    return;
  }

  const {
    society,
    town,
    phase,
    block,
    plot_number,
    plot_size,
    plot_type,
    price,
    asking_price,
    min_price,
    max_price,
    location_detail,
    features,
    status,
    notes,
    description,
    images,
    videos,
    tiktok_links,
    offers,
    history,
    sold_at,
    sold_notes,
  } = req.body;

  const updated: PropertyRecord = {
    ...existing,
    society: society !== undefined ? String(society).trim() : existing.society,
    town: town !== undefined ? String(town).trim() : existing.town,
    phase: phase !== undefined ? String(phase).trim() : existing.phase,
    block: block !== undefined ? String(block).trim() : existing.block,
    plot_number: plot_number !== undefined ? String(plot_number).trim() : existing.plot_number,
    plot_size: plot_size !== undefined ? String(plot_size).trim() : existing.plot_size,
    plot_type: plot_type !== undefined ? String(plot_type).trim() : existing.plot_type,
    price: price !== undefined ? Number(price) : existing.price,
    asking_price: asking_price !== undefined ? Number(asking_price) : (price !== undefined ? Number(price) : existing.asking_price),
    min_price: min_price !== undefined ? Number(min_price) : existing.min_price,
    max_price: max_price !== undefined ? Number(max_price) : existing.max_price,
    location_detail: location_detail !== undefined ? String(location_detail).trim() : existing.location_detail,
    features: Array.isArray(features) ? features : existing.features,
    status: status !== undefined ? status : existing.status,
    notes: notes !== undefined ? String(notes).trim() : existing.notes,
    description: description !== undefined ? String(description).trim() : existing.description,
    images: Array.isArray(images) ? images : existing.images,
    videos: Array.isArray(videos) ? videos : existing.videos,
    tiktok_links: Array.isArray(tiktok_links) ? tiktok_links : existing.tiktok_links,
    offers: Array.isArray(offers) ? offers : existing.offers,
    history: Array.isArray(history) ? history : existing.history,
    sold_at: sold_at !== undefined ? sold_at : existing.sold_at,
    sold_notes: sold_notes !== undefined ? sold_notes : existing.sold_notes,
    updated_at: new Date().toISOString(),
    sync_version: existing.sync_version + 1,
  };

  db.properties[index] = updated;
  writeDB(db);

  logActivity(user.user_id, user.username, 'PROPERTY_UPDATE', `Updated plot ${updated.plot_number}, ${updated.society}`);
  res.json({ property: updated });
});

// Delete property (with user isolation)
app.delete('/api/properties/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { id } = req.params;
  const db = readDB();

  const property = db.properties.find(p => p.property_id === id);
  if (!property) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  // STRICT DATA ISOLATION ENFORCEMENT
  if (property.user_id !== user.user_id && user.role !== 'owner') {
    res.status(403).json({ error: 'Access forbidden: You cannot delete properties belonging to another employee' });
    return;
  }

  db.properties = db.properties.filter(p => p.property_id !== id);
  writeDB(db);

  logActivity(user.user_id, user.username, 'PROPERTY_DELETE', `Deleted plot ${property.plot_number}, ${property.society}`);
  res.json({ success: true, deleted_id: id });
});

// ================= BATCH SYNCHRONIZATION ENDPOINT =================

app.post('/api/properties/sync', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as UserRecord;
  const { items } = req.body;

  if (!Array.isArray(items)) {
    res.status(400).json({ error: 'Invalid sync payload: items array required' });
    return;
  }

  const db = readDB();
  const processedIds: string[] = [];
  const rejectedItems: { id: string; reason: string }[] = [];

  for (const item of items) {
    try {
      // Ensure sync queue item belongs strictly to authenticated user
      if (item.user_id !== user.user_id) {
        rejectedItems.push({ id: item.queue_id || item.entity_id, reason: 'User ID mismatch' });
        continue;
      }

      if (item.entity_type === 'property') {
        const payload = item.payload as PropertyRecord;

        if (item.action === 'create') {
          // Check if already exists to prevent duplicate creation
          const existingIndex = db.properties.findIndex(p => p.property_id === payload.property_id);
          if (existingIndex >= 0) {
            // Safe conflict handling: compare updated_at
            const existing = db.properties[existingIndex];
            if (new Date(payload.updated_at) > new Date(existing.updated_at)) {
              db.properties[existingIndex] = {
                ...payload,
                user_id: user.user_id,
                sync_version: existing.sync_version + 1,
              };
            }
          } else {
            db.properties.push({
              ...payload,
              user_id: user.user_id,
              sync_version: 1,
            });
          }
          processedIds.push(item.queue_id);
        } else if (item.action === 'update') {
          const existingIndex = db.properties.findIndex(p => p.property_id === payload.property_id);
          if (existingIndex >= 0) {
            const existing = db.properties[existingIndex];
            // Enforce isolation
            if (existing.user_id === user.user_id) {
              if (new Date(payload.updated_at) >= new Date(existing.updated_at)) {
                db.properties[existingIndex] = {
                  ...payload,
                  user_id: user.user_id,
                  sync_version: existing.sync_version + 1,
                };
              }
            }
          }
          processedIds.push(item.queue_id);
        } else if (item.action === 'delete') {
          const existingIndex = db.properties.findIndex(p => p.property_id === item.entity_id);
          if (existingIndex >= 0 && db.properties[existingIndex].user_id === user.user_id) {
            db.properties.splice(existingIndex, 1);
          }
          processedIds.push(item.queue_id);
        }
      }
    } catch (err: any) {
      rejectedItems.push({ id: item.queue_id || item.entity_id, reason: err.message || 'Processing error' });
    }
  }

  writeDB(db);

  // Return processed IDs and latest synchronized state for this user
  const latestProperties = db.properties.filter(p => p.user_id === user.user_id);
  res.json({
    processed: processedIds,
    rejected: rejectedItems,
    latestProperties,
  });
});

// ================= OWNER BACKEND (SEPARATELY PROTECTED) =================

// Get Owner Dashboard Summary & Data
app.get('/api/owner/overview', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();

  const userStats = db.users.map(u => {
    const userProps = db.properties.filter(p => p.user_id === u.user_id);
    let imageCount = 0;
    userProps.forEach(p => { imageCount += (p.images ? p.images.length : 0); });

    return {
      user_id: u.user_id,
      username: u.username,
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      phone: u.phone || '',
      email: u.email || '',
      agency_name: u.agency_name || '',
      city: u.city || '',
      subscription_tier: u.role === 'owner' ? 'pro' : (u.subscription_tier || 'free'),
      is_ad_free: u.role === 'owner' ? true : Boolean(u.is_ad_free),
      subscription_expires_at: u.subscription_expires_at || null,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
      properties_count: userProps.length,
      available_count: userProps.filter(p => p.status === 'Available').length,
      sold_count: userProps.filter(p => p.status === 'Sold').length,
      on_hold_count: userProps.filter(p => p.status === 'On Hold').length,
      images_count: imageCount,
    };
  });

  const totalProperties = db.properties.length;
  let totalImages = 0;
  let totalPortfolioValue = 0;
  db.properties.forEach(p => {
    totalImages += (p.images ? p.images.length : 0);
    totalPortfolioValue += p.price || 0;
  });

  const pendingRequestsCount = (db.access_requests || []).filter(r => r.status === 'pending_payment').length;

  res.json({
    users: userStats,
    properties_count: totalProperties,
    images_count: totalImages,
    portfolio_value: totalPortfolioValue,
    access_requests_count: (db.access_requests || []).length,
    pending_access_requests_count: pendingRequestsCount,
    activity_logs: db.activity_logs.slice(0, 30),
    settings: db.settings,
    database_file_size: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0,
  });
});

// Owner: Get all access & payment requests
app.get('/api/owner/access-requests', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();
  res.json({ requests: db.access_requests || [] });
});

// Owner: Approve access & grant license
app.post('/api/owner/access-requests/:id/approve', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  const request = (db.access_requests || []).find(r => r.request_id === id);

  if (!request) {
    res.status(404).json({ error: 'Access request not found' });
    return;
  }

  request.status = 'approved';
  request.reviewed_at = new Date().toISOString();

  // Find user by username or user_id
  let user = db.users.find(u => u.username.toLowerCase() === request.desired_username.toLowerCase() || (request.user_id && u.user_id === request.user_id));
  if (user) {
    user.is_active = true;
    user.payment_status = 'paid';
  } else {
    const newUser: UserRecord = {
      user_id: request.user_id || ('usr_' + crypto.randomBytes(6).toString('hex') + '_' + Date.now()),
      username: request.desired_username,
      full_name: request.full_name,
      password_hash: request.password_hash,
      role: 'user',
      is_active: true,
      phone: request.phone,
      email: request.email,
      agency_name: request.agency_name,
      payment_status: 'paid',
      created_at: request.created_at || new Date().toISOString(),
    };
    db.users.push(newUser);
  }

  writeDB(db);
  logActivity('usr_owner', 'owner', 'ACCESS_APPROVED', `Owner approved access for ${request.full_name} (${request.desired_username})`);
  res.json({ success: true, message: `Access approved for ${request.full_name}! User can now login.` });
});

// Owner: Reject access request
app.post('/api/owner/access-requests/:id/reject', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = readDB();
  const request = (db.access_requests || []).find(r => r.request_id === id);

  if (!request) {
    res.status(404).json({ error: 'Access request not found' });
    return;
  }

  request.status = 'rejected';
  request.notes = reason || 'Payment not completed';
  request.reviewed_at = new Date().toISOString();

  const user = db.users.find(u => u.username.toLowerCase() === request.desired_username.toLowerCase() || (request.user_id && u.user_id === request.user_id));
  if (user && user.role !== 'owner') {
    user.is_active = false;
  }

  writeDB(db);
  logActivity('usr_owner', 'owner', 'ACCESS_REJECTED', `Owner rejected access for ${request.full_name}`);
  res.json({ success: true, message: `Access request rejected for ${request.full_name}` });
});

// Owner: Delete access request
app.delete('/api/owner/access-requests/:id', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();
  db.access_requests = (db.access_requests || []).filter(r => r.request_id !== id);
  writeDB(db);
  res.json({ success: true });
});

// Owner: List all users
app.get('/api/owner/users', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();
  const users = db.users.map(u => ({
    user_id: u.user_id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    phone: u.phone || '',
    email: u.email || '',
    agency_name: u.agency_name || '',
    city: u.city || '',
    created_at: u.created_at,
    last_login_at: u.last_login_at,
  }));
  res.json({ users });
});

// Owner: Create new user
app.post('/api/owner/users', authenticate, requireOwner, (req: Request, res: Response) => {
  const { username, full_name, password, role } = req.body;

  if (!username || !password || !full_name) {
    res.status(400).json({ error: 'Employee ID (username), Full Name, and Password are required' });
    return;
  }

  const db = readDB();
  const existing = db.users.find(u => u.username.toLowerCase() === String(username).trim().toLowerCase());
  if (existing) {
    res.status(400).json({ error: `User with Employee ID "${username}" already exists` });
    return;
  }

  const newUser: UserRecord = {
    user_id: 'usr_' + crypto.randomBytes(6).toString('hex') + '_' + Date.now(),
    username: String(username).trim(),
    full_name: String(full_name).trim(),
    password_hash: hashPassword(password),
    role: role === 'owner' ? 'owner' : 'user',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  logActivity('usr_owner', 'owner', 'USER_CREATE', `Created employee ${newUser.username} (${newUser.full_name})`);
  res.status(201).json({
    user: {
      user_id: newUser.user_id,
      username: newUser.username,
      full_name: newUser.full_name,
      role: newUser.role,
      is_active: newUser.is_active,
      created_at: newUser.created_at,
    }
  });
});

// Owner: Enable / Disable user
app.patch('/api/owner/users/:id/status', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_active } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.user_id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'owner') {
    res.status(400).json({ error: 'Cannot deactivate the primary Owner account' });
    return;
  }

  user.is_active = Boolean(is_active);

  // If deactivated, revoke active sessions
  if (!user.is_active) {
    db.sessions = db.sessions.filter(s => s.user_id !== id);
  }

  writeDB(db);
  logActivity('usr_owner', 'owner', 'USER_STATUS', `${user.is_active ? 'Enabled' : 'Disabled'} employee ${user.username}`);
  res.json({ success: true, user_id: id, is_active: user.is_active });
});

// Owner: Reset user password
app.patch('/api/owner/users/:id/password', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 4) {
    res.status(400).json({ error: 'New password must be at least 4 characters' });
    return;
  }

  const db = readDB();
  const user = db.users.find(u => u.user_id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.password_hash = hashPassword(new_password);
  // Invalidate old sessions so user logs in with new password
  db.sessions = db.sessions.filter(s => s.user_id !== id);
  writeDB(db);

  logActivity('usr_owner', 'owner', 'USER_PWD_RESET', `Reset password for employee ${user.username}`);
  res.json({ success: true, message: `Password updated for ${user.username}` });
});

// Owner: Delete user
app.delete('/api/owner/users/:id', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();

  const user = db.users.find(u => u.user_id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'owner') {
    res.status(400).json({ error: 'Cannot delete the Owner account' });
    return;
  }

  // Also remove user's properties and sessions
  const deletedPropsCount = db.properties.filter(p => p.user_id === id).length;
  db.properties = db.properties.filter(p => p.user_id !== id);
  db.sessions = db.sessions.filter(s => s.user_id !== id);
  db.users = db.users.filter(u => u.user_id !== id);
  writeDB(db);

  logActivity('usr_owner', 'owner', 'USER_DELETE', `Deleted employee ${user.username} and their ${deletedPropsCount} property records`);
  res.json({ success: true, deleted_user_id: id });
});

// Owner: View all properties across entire company
app.get('/api/owner/properties', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();
  // Attach employee info to each property
  const enriched = db.properties.map(p => {
    const emp = db.users.find(u => u.user_id === p.user_id);
    return {
      ...p,
      employee_username: emp ? emp.username : 'Unknown',
      employee_name: emp ? emp.full_name : 'Unknown',
    };
  });
  res.json({ properties: enriched });
});

// Owner: Edit any property
app.put('/api/owner/properties/:id', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();

  const index = db.properties.findIndex(p => p.property_id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  db.properties[index] = {
    ...db.properties[index],
    ...req.body,
    property_id: id,
    updated_at: new Date().toISOString(),
    sync_version: db.properties[index].sync_version + 1,
  };

  writeDB(db);
  logActivity('usr_owner', 'owner', 'OWNER_PROP_EDIT', `Owner edited property ${id}`);
  res.json({ property: db.properties[index] });
});

// Owner: Delete any property
app.delete('/api/owner/properties/:id', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();

  const prop = db.properties.find(p => p.property_id === id);
  if (!prop) {
    res.status(404).json({ error: 'Property not found' });
    return;
  }

  db.properties = db.properties.filter(p => p.property_id !== id);
  writeDB(db);

  logActivity('usr_owner', 'owner', 'OWNER_PROP_DELETE', `Owner deleted property ${prop.plot_number}, ${prop.society}`);
  res.json({ success: true, deleted_id: id });
});

// Owner: Backup / Export full JSON database
app.get('/api/owner/backup', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();
  // Strip sensitive hashes from download or provide complete recovery snapshot
  const exportPayload = {
    version: '1.0.0',
    export_date: new Date().toISOString(),
    database: {
      users: db.users.map(u => ({ ...u, password_hash: 'PROTECTED' })),
      properties: db.properties,
      settings: db.settings,
      activity_logs: db.activity_logs,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=property_hub_backup_${Date.now()}.json`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

// Owner: Restore database
app.post('/api/owner/restore', authenticate, requireOwner, (req: Request, res: Response) => {
  const { database } = req.body;
  if (!database || !Array.isArray(database.properties)) {
    res.status(400).json({ error: 'Invalid backup file structure' });
    return;
  }

  const currentDb = readDB();
  // Merge properties preserving owner user
  currentDb.properties = database.properties;
  if (database.settings) {
    currentDb.settings = database.settings;
  }
  writeDB(currentDb);

  logActivity('usr_owner', 'owner', 'DATABASE_RESTORE', `Restored ${database.properties.length} property records from backup`);
  res.json({ success: true, restored_properties_count: database.properties.length });
});

// Owner: Update office settings
app.patch('/api/owner/settings', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  writeDB(db);
  res.json({ settings: db.settings });
});

// ================= AD-SUPPORTED VS PRO AD-FREE SYSTEM =================

// Public or Authenticated: Get system settings & active sponsor ads
app.get('/api/settings', (req: Request, res: Response) => {
  const db = readDB();
  const activeAds = (db.settings.sponsor_ads || []).filter(a => a.is_active);
  res.json({
    office_name: db.settings.office_name,
    currency: db.settings.currency,
    default_city: db.settings.default_city,
    popular_societies: db.settings.popular_societies,
    popular_sizes: db.settings.popular_sizes,
    ads_enabled: Boolean(db.settings.ads_enabled),
    google_ad_client: db.settings.google_ad_client || '',
    google_ad_slot: db.settings.google_ad_slot || '',
    pro_monthly_price_pkr: db.settings.pro_monthly_price_pkr || 1500,
    pro_features_description: db.settings.pro_features_description,
    sponsor_ads: activeAds,
    owner_email: db.settings.owner_email,
    owner_phone: db.settings.owner_phone,
    owner_whatsapp: db.settings.owner_whatsapp,
    payment_instructions: db.settings.payment_instructions,
  });
});

// User: Upgrade to Pro / Ad-Free (with instant activation for demo/verified request)
app.post('/api/subscription/upgrade', authenticate, (req: Request, res: Response) => {
  const reqUser = (req as any).user as UserRecord;
  const db = readDB();

  const user = db.users.find(u => u.user_id === reqUser.user_id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Grant 30 days of Pro Ad-Free status
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  user.subscription_tier = 'pro';
  user.is_ad_free = true;
  user.subscription_expires_at = expiresAt;

  writeDB(db);
  logActivity(user.user_id, user.username, 'PRO_UPGRADED', `User ${user.username} upgraded to Ad-Free Pro Tier (Expires: ${expiresAt.split('T')[0]})`);

  const safeUser = {
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active,
    phone: user.phone || '',
    email: user.email || '',
    agency_name: user.agency_name || '',
    city: user.city || '',
    payment_status: user.payment_status,
    subscription_tier: user.subscription_tier,
    is_ad_free: user.is_ad_free,
    subscription_expires_at: user.subscription_expires_at,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  };

  res.json({
    success: true,
    message: 'Congratulations! Your account has been upgraded to MSA Pro (100% Ad-Free).',
    user: safeUser,
  });
});

// Owner: Manage user subscription tier (Toggle between Free and Pro)
app.patch('/api/owner/users/:id/subscription', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const { subscription_tier, is_ad_free, days } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.user_id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const newTier = subscription_tier === 'pro' ? 'pro' : 'free';
  const newAdFree = is_ad_free !== undefined ? Boolean(is_ad_free) : (newTier === 'pro');
  const durationDays = Number(days) || 30;

  user.subscription_tier = newTier;
  user.is_ad_free = newAdFree;
  user.subscription_expires_at = newAdFree 
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  writeDB(db);
  logActivity('usr_owner', 'owner', 'SUBSCRIPTION_UPDATE', `Set subscription for ${user.username} to ${newTier.toUpperCase()} (Ad-Free: ${newAdFree})`);

  res.json({
    success: true,
    user: {
      user_id: user.user_id,
      username: user.username,
      subscription_tier: user.subscription_tier,
      is_ad_free: user.is_ad_free,
      subscription_expires_at: user.subscription_expires_at,
    }
  });
});

// Owner: Toggle global ads on / off
app.patch('/api/owner/ads-toggle', authenticate, requireOwner, (req: Request, res: Response) => {
  const db = readDB();
  const enabled = req.body.ads_enabled !== undefined ? Boolean(req.body.ads_enabled) : !db.settings.ads_enabled;
  db.settings.ads_enabled = enabled;
  writeDB(db);
  logActivity('usr_owner', 'owner', 'ADS_TOGGLED', `Owner turned advertisements ${enabled ? 'ON' : 'OFF'} globally`);
  res.json({ success: true, ads_enabled: db.settings.ads_enabled });
});

// Owner: Add new sponsor ad
app.post('/api/owner/sponsor-ads', authenticate, requireOwner, (req: Request, res: Response) => {
  const { title, tagline, description, sponsor_name, category, phone, whatsapp, cta_text, cta_link, badge_label } = req.body;

  if (!title || !description || !sponsor_name) {
    res.status(400).json({ error: 'Title, Description, and Sponsor Name are required' });
    return;
  }

  const db = readDB();
  if (!db.settings.sponsor_ads) db.settings.sponsor_ads = [];

  const newAd: SponsorAdRecord = {
    ad_id: 'ad_' + crypto.randomBytes(4).toString('hex') + '_' + Date.now(),
    title: String(title).trim(),
    tagline: tagline ? String(tagline).trim() : '',
    description: String(description).trim(),
    sponsor_name: String(sponsor_name).trim(),
    category: category || 'General',
    phone: phone ? String(phone).trim() : '',
    whatsapp: whatsapp ? String(whatsapp).trim() : '',
    cta_text: cta_text ? String(cta_text).trim() : 'Contact Sponsor',
    cta_link: cta_link ? String(cta_link).trim() : '',
    is_active: true,
    badge_label: badge_label ? String(badge_label).trim() : 'SPONSORED',
  };

  db.settings.sponsor_ads.push(newAd);
  writeDB(db);
  logActivity('usr_owner', 'owner', 'SPONSOR_AD_ADD', `Added sponsor ad: ${newAd.title} (${newAd.sponsor_name})`);

  res.status(201).json({ success: true, ad: newAd, sponsor_ads: db.settings.sponsor_ads });
});

// Owner: Update sponsor ad
app.put('/api/owner/sponsor-ads/:id', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.settings.sponsor_ads) db.settings.sponsor_ads = [];
  const idx = db.settings.sponsor_ads.findIndex(a => a.ad_id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Sponsor ad not found' });
    return;
  }

  db.settings.sponsor_ads[idx] = {
    ...db.settings.sponsor_ads[idx],
    ...req.body,
    ad_id: id,
  };

  writeDB(db);
  logActivity('usr_owner', 'owner', 'SPONSOR_AD_EDIT', `Updated sponsor ad: ${db.settings.sponsor_ads[idx].title}`);
  res.json({ success: true, ad: db.settings.sponsor_ads[idx], sponsor_ads: db.settings.sponsor_ads });
});

// Owner: Delete sponsor ad
app.delete('/api/owner/sponsor-ads/:id', authenticate, requireOwner, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.settings.sponsor_ads) db.settings.sponsor_ads = [];
  db.settings.sponsor_ads = db.settings.sponsor_ads.filter(a => a.ad_id !== id);

  writeDB(db);
  logActivity('usr_owner', 'owner', 'SPONSOR_AD_DELETE', `Deleted sponsor ad ${id}`);
  res.json({ success: true, deleted_id: id, sponsor_ads: db.settings.sponsor_ads });
});

// Explicit JSON 404 for unhandled API endpoints - guarantees API calls never return HTML
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ================= VITE DEV OR PROD STATIC SERVING =================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`PROPERTY HUB Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
