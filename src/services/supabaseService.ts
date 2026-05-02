
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { API_KEYS } from '../constants';
import { UserProfile, QueryRecord, DeviceCategory, DiagnosisResult } from '../types';

let supabase: SupabaseClient | null = null;
try {
  supabase = createClient(API_KEYS.SUPABASE_URL, API_KEYS.SUPABASE_ANON);
} catch {
  console.error("CRITICAL: Supabase Node Offline.");
}

const LOCAL_LOGS_KEY = 'titan_local_logs';

function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export const supabaseService = {
  get client() { return supabase; },

  async signIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  },

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    // Don't reload, just clear auth state locally
  },

  async getProfile(): Promise<UserProfile | null> {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) return null;

    if (!data) {
      const newProfile = {
        id: user.id,
        email: user.email,
        query_count: 0,
        onboarding_accepted: false,
        permissions: { camera: 'prompt', location: 'prompt' }
      };
      await supabase.from('profiles').upsert(newProfile);
      return newProfile as UserProfile;
    }
    return data;
  },

  async updateProfile(updates: Partial<UserProfile>) {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update(updates).eq('id', user.id);
  },

  async uploadPhotos(photos: string[]): Promise<string[]> {
    if (!supabase) return photos;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return photos;

    const urls: string[] = [];
    for (const base64 of photos) {
      if (!base64.startsWith('data:')) {
        urls.push(base64);
        continue;
      }
      
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const blob = base64ToBlob(base64);
      
      const { data, error } = await supabase.storage
        .from('device-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
      
      if (error) {
        console.error("STORAGE_UPLOAD_ERROR:", error);
        urls.push(base64); // Fallback to base64 if upload fails
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('device-photos')
          .getPublicUrl(data.path);
        urls.push(publicUrl);
      }
    }
    return urls;
  },

  async saveLog(category: DeviceCategory, desc: string, photos: string[], result: DiagnosisResult): Promise<QueryRecord> {
    const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    const user = authData?.user;
    
    // UPLOAD SHIELD: Migrate local photos to cloud storage if authenticated
    const photo_urls = user ? await this.uploadPhotos(photos) : photos;

    const newRecord: Partial<QueryRecord> = {
      id: Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString(),
      category,
      description: desc,
      photo_urls: photos,
      ai_response: result
    };

    if (supabase && user) {
      const { data, error } = await supabase.from('queries').insert({
        user_id: user.id,
        category,
        description: desc,
        photo_urls,
        ai_response: result
      }).select().single();

      if (error) throw error;
      
      const profile = await this.getProfile();
      if (profile) {
        await this.updateProfile({ query_count: profile.query_count + 1 });
      }
      return data;
    } else {
      // Guest local save
      const localLogs = JSON.parse(localStorage.getItem(LOCAL_LOGS_KEY) || '[]');
      const record = newRecord as QueryRecord;
      localLogs.unshift(record);
      
      try {
        localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(localLogs));
      } catch (e: unknown) {
        const err = e as { name?: string; code?: number };
        // STORAGE QUOTA EXCEEDED: Auto-Pruning Protocol
        if (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014) {
             console.warn("TITAN_LOGS: Quota exceeded. Pruning old logs...");
             let saved = false;
             let attempts = 0;
             // Keep removing oldest 5 logs until it fits or we run out
             while (!saved && localLogs.length > 0 && attempts < 50) {
                 localLogs.splice(-5); // Bulk prune oldest 5
                 try {
                     localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(localLogs));
                     saved = true;
                     console.warn(`TITAN_LOGS: Pruning successful. Remaining logs: ${localLogs.length}`);
                 } catch {
                     attempts++;
                 }
             }
        } else {
             console.error("TITAN_LOGS: Critical storage failure", e);
        }
      }
      
      // Update guest profile query count in local storage
      const guestStored = localStorage.getItem('titan_guest_profile');
      if (guestStored) {
          try {
            const profile = JSON.parse(guestStored);
            profile.query_count += 1;
            localStorage.setItem('titan_guest_profile', JSON.stringify(profile));
          } catch(e) {
             console.warn("Could not start query count", e);
          }
      }
      
      return record;
    }
  },

  async getLogs(): Promise<QueryRecord[]> {
    const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    const user = authData?.user;

    const localLogs = JSON.parse(localStorage.getItem(LOCAL_LOGS_KEY) || '[]');

    if (supabase && user) {
      const { data, error } = await supabase.from('queries').select('*').order('created_at', { ascending: false });
      return error ? localLogs : [...(data || []), ...localLogs];
    }
    
    return localLogs;
  },

  /**
   * HYBRID BRAIN: Fetches verify specs from the database.
   * Returns null if no match found (triggering AI fallback).
   */
  async getDeviceSpecs(brand: string, model: string): Promise<Record<string, unknown> | null> {
    if (!supabase) return null;

    // 1. Try exact match first (Cleanest)
    const { data } = await supabase
      .from('device_specs')
      .select('*')
      .ilike('brand_name', `%${brand}%`) // Flexible brand match
      .ilike('model_name', model)         // Strict model match first
      .limit(1)
      .maybeSingle();

    if (data) return data;

    // 2. Try Fuzzy match if exact failed (e.g. "iPhone 13" vs "Apple iPhone 13")
    const { data: fuzzyData } = await supabase
      .from('device_specs')
      .select('*')
      .ilike('model_name', `%${model}%`) 
      .limit(1)
      .maybeSingle();

    return fuzzyData || null; 
  }
};
