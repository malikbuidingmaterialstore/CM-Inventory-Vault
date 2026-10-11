export type PlotType = 
  | 'Residential'
  | 'Commercial'
  | 'Semi-Commercial'
  | 'Industrial'
  | 'Agricultural'
  | 'Farmhouse';

export type PropertyStatus = 'Available' | 'On Hold' | 'Sold';

export type VideoPlatform = 'TikTok' | 'Instagram' | 'YouTube' | 'Facebook' | 'Other';

export interface PropertyVideo {
  video_id: string;
  property_id: string;
  user_id: string;
  title: string;
  platform: VideoPlatform;
  video_url: string;
  description?: string;
  thumbnail_url?: string;
  category?: string; // 'Walkthrough' | 'Drone Tour' | 'Society Overview' | 'Plot Inspection' | 'Elevation' | 'Other'
  created_at: string;
  updated_at?: string;
}

export interface PropertyOffer {
  offer_id: string;
  property_id: string;
  buyer_name: string;
  offer_amount: number;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Countered';
  notes?: string;
  created_at: string;
}

export interface PropertyHistoryItem {
  history_id: string;
  action: 'Created' | 'Marked as Sold' | 'Marked as Available' | 'Marked as On Hold' | 'Edited' | 'Offer Received' | 'Video Added' | 'Video Removed';
  timestamp: string;
  note?: string;
  user_id?: string;
  username?: string;
}

export interface AccessRequest {
  request_id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email: string;
  agency_name?: string;
  city?: string;
  desired_username: string;
  status: 'pending_payment' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface SponsorAd {
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

export interface User {
  user_id: string;
  username: string; // Employee ID (e.g., EMP-101)
  full_name: string;
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

export interface PropertyImage {
  image_id: string;
  property_id: string;
  user_id: string;
  image_url: string; // data URL or relative URL
  created_at: string;
  is_local_only?: boolean;
}

export interface PropertyTikTokLink {
  tiktok_id: string;
  property_id: string;
  user_id: string;
  tiktok_url: string;
  created_at: string;
  updated_at: string;
}

export type PropertyListingType = 'Sale' | 'Rent';

export interface Property {
  property_id: string;
  user_id: string;
  listing_type?: PropertyListingType; // 'Sale' or 'Rent'
  society: string;
  town: string;
  phase: string;
  block: string;
  plot_number: string;
  plot_size: string;
  marla_count?: number; // Total marlas (e.g. 5, 10, 20)
  price_per_marla?: number; // Rate per marla in PKR
  pricing_mode?: 'total' | 'per_marla'; // Whether user entered total or per-marla
  rent_duration?: 'Monthly' | 'Yearly'; // Rent payment cycle
  plot_type: PlotType;
  price: number; // Total Asking price or Monthly Rent in PKR
  asking_price?: number;
  min_price?: number;
  max_price?: number;
  location_detail?: string;
  features?: string[];
  status: PropertyStatus;
  notes: string;
  description?: string;
  images: PropertyImage[];
  videos?: PropertyVideo[];
  tiktok_links: PropertyTikTokLink[];
  offers?: PropertyOffer[];
  created_at: string;
  updated_at: string;
  sync_version: number;
  is_local_only?: boolean;
  history?: PropertyHistoryItem[];
  sold_at?: string;
  sold_notes?: string;
}

export interface SyncQueueItem {
  queue_id: string;
  user_id: string;
  entity_type: 'property' | 'image' | 'tiktok' | 'video';
  action: 'create' | 'update' | 'delete';
  entity_id: string;
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  created_at: string;
  error_message?: string;
}

export interface ActivityLog {
  log_id: string;
  user_id: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  office_name: string;
  currency: string;
  default_city: string;
  popular_societies: string[];
  popular_sizes: string[];
  owner_email?: string;
  owner_phone?: string;
  owner_whatsapp?: string;
  monthly_subscription_fee_pkr?: number;
  pro_monthly_price_pkr?: number;
  ads_enabled?: boolean;
  google_ad_client?: string;
  google_ad_slot?: string;
  sponsor_ads?: SponsorAd[];
  pro_features_description?: string;
  payment_instructions?: string;
  require_owner_approval_for_signup?: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
  expires_at: string;
}

export type ViewMode = 
  | 'dashboard'
  | 'search'
  | 'add_property'
  | 'edit_property'
  | 'my_properties'
  | 'property_details'
  | 'image_gallery'
  | 'videos'
  | 'tiktok_videos'
  | 'offline_data'
  | 'sync_status'
  | 'my_account'
  | 'owner_control';
