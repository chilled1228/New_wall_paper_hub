export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          session_id: string
          user_ip: unknown | null
          wallpaper_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          session_id: string
          user_ip?: unknown | null
          wallpaper_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          session_id?: string
          user_ip?: unknown | null
          wallpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "public_wallpapers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: false
            referencedRelation: "wallpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallpaper_stats: {
        Row: {
          created_at: string | null
          downloads: number | null
          id: string
          likes: number | null
          updated_at: string | null
          views: number | null
          wallpaper_id: string
        }
        Insert: {
          created_at?: string | null
          downloads?: number | null
          id?: string
          likes?: number | null
          updated_at?: string | null
          views?: number | null
          wallpaper_id: string
        }
        Update: {
          created_at?: string | null
          downloads?: number | null
          id?: string
          likes?: number | null
          updated_at?: string | null
          views?: number | null
          wallpaper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallpaper_stats_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: true
            referencedRelation: "public_wallpapers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallpaper_stats_wallpaper_id_fkey"
            columns: ["wallpaper_id"]
            isOneToOne: true
            referencedRelation: "wallpapers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallpapers: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          large_url: string | null
          medium_url: string | null
          original_url: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          large_url?: string | null
          medium_url?: string | null
          original_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          large_url?: string | null
          medium_url?: string | null
          original_url?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_wallpapers: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          tags: string[] | null
          title: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          tags?: string[] | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Wallpaper = Database['public']['Tables']['wallpapers']['Row']
export type WallpaperInsert = Database['public']['Tables']['wallpapers']['Insert']
export type WallpaperUpdate = Database['public']['Tables']['wallpapers']['Update']

export type WallpaperStats = Database['public']['Tables']['wallpaper_stats']['Row']
export type WallpaperStatsInsert = Database['public']['Tables']['wallpaper_stats']['Insert']
export type WallpaperStatsUpdate = Database['public']['Tables']['wallpaper_stats']['Update']

export type UserInteraction = Database['public']['Tables']['user_interactions']['Row']
export type UserInteractionInsert = Database['public']['Tables']['user_interactions']['Insert']
export type UserInteractionUpdate = Database['public']['Tables']['user_interactions']['Update']

// Extended wallpaper type that includes real stats from database
export interface WallpaperWithStats extends Wallpaper {
  stats?: WallpaperStats
  downloads?: string
  likes?: string
  views?: string
  featured?: boolean
  resolutions?: Array<{
    label: string
    width: number
    height: number
    size: string
  }>
  colors?: string[]
  uploadDate?: string
  author?: string
}
