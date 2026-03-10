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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      block_type_registry: {
        Row: {
          category: string
          config_schema: Json | null
          created_at: string
          default_execution_mode: string
          description: string
          icon: string
          is_executable: boolean
          is_system: boolean
          label: string
          short_label: string
          type_key: string
        }
        Insert: {
          category?: string
          config_schema?: Json | null
          created_at?: string
          default_execution_mode?: string
          description?: string
          icon?: string
          is_executable?: boolean
          is_system?: boolean
          label: string
          short_label: string
          type_key: string
        }
        Update: {
          category?: string
          config_schema?: Json | null
          created_at?: string
          default_execution_mode?: string
          description?: string
          icon?: string
          is_executable?: boolean
          is_system?: boolean
          label?: string
          short_label?: string
          type_key?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          job_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "neuron_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          author_id: string
          created_at: string
          duration_seconds: number | null
          file_path: string | null
          id: string
          language: string | null
          metadata: Json | null
          source_type: string
          source_url: string | null
          status: string
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          id?: string
          language?: string | null
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      neuron_address_aliases: {
        Row: {
          alias: string
          created_at: string
          id: string
          target_path: string
        }
        Insert: {
          alias: string
          created_at?: string
          id?: string
          target_path: string
        }
        Update: {
          alias?: string
          created_at?: string
          id?: string
          target_path?: string
        }
        Relationships: []
      }
      neuron_addresses: {
        Row: {
          created_at: string
          depth: number
          domain: string
          id: string
          level_1: string | null
          level_2: string | null
          level_3: string | null
          level_4: string | null
          neuron_id: number
          path: string
        }
        Insert: {
          created_at?: string
          depth?: number
          domain: string
          id?: string
          level_1?: string | null
          level_2?: string | null
          level_3?: string | null
          level_4?: string | null
          neuron_id: number
          path: string
        }
        Update: {
          created_at?: string
          depth?: number
          domain?: string
          id?: string
          level_1?: string | null
          level_2?: string | null
          level_3?: string | null
          level_4?: string | null
          neuron_id?: number
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "neuron_addresses_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      neuron_blocks: {
        Row: {
          checked: boolean | null
          content: string
          created_at: string
          execution_mode: string
          id: string
          language: string | null
          metadata: Json | null
          neuron_id: number
          position: number
          type: string
          updated_at: string
        }
        Insert: {
          checked?: boolean | null
          content?: string
          created_at?: string
          execution_mode?: string
          id?: string
          language?: string | null
          metadata?: Json | null
          neuron_id: number
          position?: number
          type?: string
          updated_at?: string
        }
        Update: {
          checked?: boolean | null
          content?: string
          created_at?: string
          execution_mode?: string
          id?: string
          language?: string | null
          metadata?: Json | null
          neuron_id?: number
          position?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neuron_blocks_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      neuron_clones: {
        Row: {
          clone_type: string
          cloned_by: string | null
          cloned_neuron_id: number
          created_at: string
          id: string
          source_neuron_id: number
        }
        Insert: {
          clone_type?: string
          cloned_by?: string | null
          cloned_neuron_id: number
          created_at?: string
          id?: string
          source_neuron_id: number
        }
        Update: {
          clone_type?: string
          cloned_by?: string | null
          cloned_neuron_id?: number
          created_at?: string
          id?: string
          source_neuron_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "neuron_clones_cloned_neuron_id_fkey"
            columns: ["cloned_neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neuron_clones_source_neuron_id_fkey"
            columns: ["source_neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      neuron_jobs: {
        Row: {
          author_id: string | null
          block_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          input: Json | null
          neuron_id: number
          result: Json | null
          status: string
          worker_type: string
        }
        Insert: {
          author_id?: string | null
          block_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          neuron_id: number
          result?: Json | null
          status?: string
          worker_type: string
        }
        Update: {
          author_id?: string | null
          block_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          input?: Json | null
          neuron_id?: number
          result?: Json | null
          status?: string
          worker_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "neuron_jobs_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "neuron_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neuron_jobs_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      neuron_links: {
        Row: {
          created_at: string
          id: string
          relation_type: string
          source_neuron_id: number
          target_neuron_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          relation_type: string
          source_neuron_id: number
          target_neuron_id: number
        }
        Update: {
          created_at?: string
          id?: string
          relation_type?: string
          source_neuron_id?: number
          target_neuron_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "neuron_links_source_neuron_id_fkey"
            columns: ["source_neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neuron_links_target_neuron_id_fkey"
            columns: ["target_neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      neuron_number_ranges: {
        Row: {
          created_at: string
          current_pointer: number
          id: string
          range_end: number
          range_start: number
          worker_id: string
        }
        Insert: {
          created_at?: string
          current_pointer: number
          id?: string
          range_end: number
          range_start: number
          worker_id: string
        }
        Update: {
          created_at?: string
          current_pointer?: number
          id?: string
          range_end?: number
          range_start?: number
          worker_id?: string
        }
        Relationships: []
      }
      neuron_templates: {
        Row: {
          author_id: string | null
          blocks_template: Json
          category: string
          created_at: string
          default_tags: string[] | null
          description: string
          id: string
          is_public: boolean
          name: string
          usage_count: number
        }
        Insert: {
          author_id?: string | null
          blocks_template?: Json
          category?: string
          created_at?: string
          default_tags?: string[] | null
          description?: string
          id?: string
          is_public?: boolean
          name: string
          usage_count?: number
        }
        Update: {
          author_id?: string | null
          blocks_template?: Json
          category?: string
          created_at?: string
          default_tags?: string[] | null
          description?: string
          id?: string
          is_public?: boolean
          name?: string
          usage_count?: number
        }
        Relationships: []
      }
      neuron_versions: {
        Row: {
          author_id: string | null
          blocks_snapshot: Json
          change_summary: string | null
          created_at: string
          diff: Json | null
          id: string
          neuron_id: number
          parent_version_id: string | null
          title: string
          version: number
        }
        Insert: {
          author_id?: string | null
          blocks_snapshot?: Json
          change_summary?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          neuron_id: number
          parent_version_id?: string | null
          title: string
          version?: number
        }
        Update: {
          author_id?: string | null
          blocks_snapshot?: Json
          change_summary?: string | null
          created_at?: string
          diff?: Json | null
          id?: string
          neuron_id?: number
          parent_version_id?: string | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "neuron_versions_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neuron_versions_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "neuron_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      neurons: {
        Row: {
          author_id: string | null
          content_category: string | null
          created_at: string
          credits_cost: number
          episode_id: string | null
          id: number
          lifecycle: string
          number: number
          score: number
          status: string
          title: string
          updated_at: string
          uuid: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          content_category?: string | null
          created_at?: string
          credits_cost?: number
          episode_id?: string | null
          id?: never
          lifecycle?: string
          number?: number
          score?: number
          status?: string
          title?: string
          updated_at?: string
          uuid?: string
          visibility?: string
        }
        Update: {
          author_id?: string | null
          content_category?: string | null
          created_at?: string
          credits_cost?: number
          episode_id?: string | null
          id?: never
          lifecycle?: string
          number?: number
          score?: number
          status?: string
          title?: string
          updated_at?: string
          uuid?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "neurons_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          meta: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          meta?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          meta?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          category: string
          created_at: string
          credits_cost: number
          deliverables_schema: Json | null
          description: string
          icon: string | null
          id: string
          input_schema: Json | null
          is_active: boolean
          name: string
          service_class: string
          service_key: string
        }
        Insert: {
          category?: string
          created_at?: string
          credits_cost?: number
          deliverables_schema?: Json | null
          description?: string
          icon?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean
          name: string
          service_class?: string
          service_key: string
        }
        Update: {
          category?: string
          created_at?: string
          credits_cost?: number
          deliverables_schema?: Json | null
          description?: string
          icon?: string | null
          id?: string
          input_schema?: Json | null
          is_active?: boolean
          name?: string
          service_class?: string
          service_key?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_links: {
        Row: {
          created_at: string | null
          description: string | null
          href: string
          icon: string | null
          id: string
          position: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          href: string
          icon?: string | null
          id?: string
          position?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          href?: string
          icon?: string | null
          id?: string
          position?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      neuron_stats: {
        Row: {
          author_id: string | null
          avg_score: number | null
          drafts: number | null
          last_active: string | null
          published: number | null
          total_neurons: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_category:
        | "transcript"
        | "insight"
        | "framework"
        | "strategy"
        | "formula"
        | "pattern"
        | "avatar"
        | "argument_map"
        | "narrative"
        | "psychological"
        | "commercial"
      neuron_lifecycle:
        | "ingested"
        | "structured"
        | "active"
        | "capitalized"
        | "compounded"
      service_class: "A" | "B" | "C"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      content_category: [
        "transcript",
        "insight",
        "framework",
        "strategy",
        "formula",
        "pattern",
        "avatar",
        "argument_map",
        "narrative",
        "psychological",
        "commercial",
      ],
      neuron_lifecycle: [
        "ingested",
        "structured",
        "active",
        "capitalized",
        "compounded",
      ],
      service_class: ["A", "B", "C"],
    },
  },
} as const
