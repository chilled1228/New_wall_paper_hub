export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wallpapers: {
        Row: {
          id: string
          title: string
          description: string | null
          tags: string[] | null
          category: string
          image_url: string
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          tags?: string[] | null
          category: string
          image_url: string
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          tags?: string[] | null
          category?: string
          image_url?: string
          created_at?: string | null
        }
        Relationships: []
      }
      public_wallpapers: {
        Row: {
          id: string | null
          title: string | null
          description: string | null
          tags: string[] | null
          category: string | null
          image_url: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null
          title?: string | null
          description?: string | null
          tags?: string[] | null
          category?: string | null
          image_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string | null
          title?: string | null
          description?: string | null
          tags?: string[] | null
          category?: string | null
          image_url?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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

// Extended wallpaper type that includes computed fields for UI
export interface WallpaperWithStats extends Wallpaper {
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
