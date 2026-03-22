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
      abuse_events: {
        Row: {
          abuse_type: string
          action_taken: string | null
          created_at: string
          details: Json | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string
        }
        Insert: {
          abuse_type: string
          action_taken?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          abuse_type?: string
          action_taken?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      access_simulation_log: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          service_key: string
          simulated_user_id: string | null
          verdict: Json
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          service_key: string
          simulated_user_id?: string | null
          verdict?: Json
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          service_key?: string
          simulated_user_id?: string | null
          verdict?: Json
        }
        Relationships: []
      }
      access_window_state: {
        Row: {
          created_at: string
          entitlement_lock: boolean
          last_verified_at: string | null
          policy_version: string
          tier: string
          updated_at: string
          user_id: string
          window_status: string
        }
        Insert: {
          created_at?: string
          entitlement_lock?: boolean
          last_verified_at?: string | null
          policy_version?: string
          tier?: string
          updated_at?: string
          user_id: string
          window_status?: string
        }
        Update: {
          created_at?: string
          entitlement_lock?: boolean
          last_verified_at?: string | null
          policy_version?: string
          tier?: string
          updated_at?: string
          user_id?: string
          window_status?: string
        }
        Relationships: []
      }
      achievements_registry: {
        Row: {
          category: string
          created_at: string
          description: string
          description_ro: string
          hidden: boolean
          icon: string
          id: string
          name: string
          name_ro: string
          requirements: Json
          tier: string
          xp_reward: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          description_ro?: string
          hidden?: boolean
          icon?: string
          id: string
          name: string
          name_ro?: string
          requirements?: Json
          tier?: string
          xp_reward?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          description_ro?: string
          hidden?: boolean
          icon?: string
          id?: string
          name?: string
          name_ro?: string
          requirements?: Json
          tier?: string
          xp_reward?: number
        }
        Relationships: []
      }
      admin_approval_requests: {
        Row: {
          action_type: string
          approval_level: number
          approved_by: string | null
          created_at: string
          id: string
          payload: Json | null
          requested_by: string
          required_level: number
          resolution_note: string | null
          resolved_at: string | null
          status: string
          target_id: string | null
          target_resource: string | null
          timelock_until: string | null
        }
        Insert: {
          action_type: string
          approval_level?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          requested_by: string
          required_level?: number
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          target_id?: string | null
          target_resource?: string | null
          timelock_until?: string | null
        }
        Update: {
          action_type?: string
          approval_level?: number
          approved_by?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          requested_by?: string
          required_level?: number
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          target_id?: string | null
          target_resource?: string | null
          timelock_until?: string | null
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          permission_key: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          permission_key: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          permission_key?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          action_count: number
          admin_id: string
          id: string
          ip_hint: string | null
          last_action_at: string
          metadata: Json | null
          started_at: string
          user_agent: string | null
        }
        Insert: {
          action_count?: number
          admin_id: string
          id?: string
          ip_hint?: string | null
          last_action_at?: string
          metadata?: Json | null
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          action_count?: number
          admin_id?: string
          id?: string
          ip_hint?: string | null
          last_action_at?: string
          metadata?: Json | null
          started_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_params: Json | null
          id: string
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          event_params?: Json | null
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          event_params?: Json | null
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      anomaly_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          current_value: number
          deviation_pct: number | null
          id: string
          metadata: Json | null
          metric_name: string
          severity: string
          threshold_value: number
          user_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          current_value: number
          deviation_pct?: number | null
          id?: string
          metadata?: Json | null
          metric_name: string
          severity?: string
          threshold_value: number
          user_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          current_value?: number
          deviation_pct?: number | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          severity?: string
          threshold_value?: number
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          daily_limit: number
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          requests_today: number
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          requests_today?: number
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          requests_today?: number
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      artifact_neurons: {
        Row: {
          artifact_id: string
          created_at: string
          id: string
          neuron_id: number
          relation_type: string
        }
        Insert: {
          artifact_id: string
          created_at?: string
          id?: string
          neuron_id: number
          relation_type?: string
        }
        Update: {
          artifact_id?: string
          created_at?: string
          id?: string
          neuron_id?: number
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_neurons_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_neurons_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "artifact_neurons_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          artifact_type: string
          author_id: string
          content: string
          created_at: string
          format: string
          id: string
          job_id: string | null
          metadata: Json | null
          service_key: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          artifact_type?: string
          author_id: string
          content?: string
          created_at?: string
          format?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          service_key?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          artifact_type?: string
          author_id?: string
          content?: string
          created_at?: string
          format?: string
          id?: string
          job_id?: string | null
          metadata?: Json | null
          service_key?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "neuron_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_licenses: {
        Row: {
          asset_id: string
          buyer_id: string
          creator_revenue: number
          expires_at: string | null
          id: string
          is_transferable: boolean
          issued_at: string
          license_type: string
          metadata: Json | null
          platform_fee_pct: number
          platform_revenue: number
          price_neurons: number
          price_usd: number | null
          revoked_at: string | null
          seller_id: string
          transferred_from: string | null
        }
        Insert: {
          asset_id: string
          buyer_id: string
          creator_revenue?: number
          expires_at?: string | null
          id?: string
          is_transferable?: boolean
          issued_at?: string
          license_type?: string
          metadata?: Json | null
          platform_fee_pct?: number
          platform_revenue?: number
          price_neurons?: number
          price_usd?: number | null
          revoked_at?: string | null
          seller_id: string
          transferred_from?: string | null
        }
        Update: {
          asset_id?: string
          buyer_id?: string
          creator_revenue?: number
          expires_at?: string | null
          id?: string
          is_transferable?: boolean
          issued_at?: string
          license_type?: string
          metadata?: Json | null
          platform_fee_pct?: number
          platform_revenue?: number
          price_neurons?: number
          price_usd?: number | null
          revoked_at?: string | null
          seller_id?: string
          transferred_from?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_licenses_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "knowledge_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_licenses_transferred_from_fkey"
            columns: ["transferred_from"]
            isOneToOne: false
            referencedRelation: "asset_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_reviews: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_reviews_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "knowledge_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transactions: {
        Row: {
          amount_neurons: number
          amount_usd: number | null
          asset_id: string | null
          buyer_id: string
          created_at: string
          id: string
          seller_id: string
          status: string
        }
        Insert: {
          amount_neurons?: number
          amount_usd?: number | null
          asset_id?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          seller_id: string
          status?: string
        }
        Update: {
          amount_neurons?: number
          amount_usd?: number | null
          asset_id?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "knowledge_assets"
            referencedColumns: ["id"]
          },
        ]
      }
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
      challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          example: string | null
          id: string
          position: number
          release_date: string | null
          status: string
          title: string
          updated_at: string
          user_benefit: string | null
          version: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          example?: string | null
          id?: string
          position?: number
          release_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_benefit?: string | null
          version?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          example?: string | null
          id?: string
          position?: number
          release_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_benefit?: string | null
          version?: string
        }
        Relationships: []
      }
      changes_raw: {
        Row: {
          component: string | null
          created_at: string
          created_by: string | null
          diff_summary: string | null
          file_path: string | null
          id: string
          impact_level: string
          metadata: Json | null
          processed_at: string | null
          source: string
          source_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          created_by?: string | null
          diff_summary?: string | null
          file_path?: string | null
          id?: string
          impact_level?: string
          metadata?: Json | null
          processed_at?: string | null
          source?: string
          source_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          created_by?: string | null
          diff_summary?: string | null
          file_path?: string | null
          id?: string
          impact_level?: string
          metadata?: Json | null
          processed_at?: string | null
          source?: string
          source_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      cognitive_categories: {
        Row: {
          created_at: string
          depth: number
          description: string
          icon: string
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          depth?: number
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          depth?: number
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cognitive_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_units: {
        Row: {
          author_id: string
          category_id: string
          confidence: number
          content: string
          created_at: string
          episode_id: string | null
          id: string
          is_validated: boolean
          llm_ready: boolean
          metadata: Json | null
          neuron_id: number | null
          quality_score: number
          source_context: string | null
          tags: string[] | null
          title: string
          unit_type: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          author_id: string
          category_id: string
          confidence?: number
          content?: string
          created_at?: string
          episode_id?: string | null
          id?: string
          is_validated?: boolean
          llm_ready?: boolean
          metadata?: Json | null
          neuron_id?: number | null
          quality_score?: number
          source_context?: string | null
          tags?: string[] | null
          title: string
          unit_type?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          author_id?: string
          category_id?: string
          confidence?: number
          content?: string
          created_at?: string
          episode_id?: string | null
          id?: string
          is_validated?: boolean
          llm_ready?: boolean
          metadata?: Json | null
          neuron_id?: number | null
          quality_score?: number
          source_context?: string | null
          tags?: string[] | null
          title?: string
          unit_type?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_units_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cognitive_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string
          started_at: string
          status: string
          units_extracted: number
          units_validated: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string
          started_at?: string
          status?: string
          units_extracted?: number
          units_validated?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string
          started_at?: string
          status?: string
          units_extracted?: number
          units_validated?: number
          user_id?: string
        }
        Relationships: []
      }
      compliance_log: {
        Row: {
          action_type: string
          actor_id: string
          created_at: string
          description: string
          id: string
          ip_hint: string | null
          metadata: Json | null
          severity: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action_type: string
          actor_id: string
          created_at?: string
          description?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_type?: string
        }
        Update: {
          action_type?: string
          actor_id?: string
          created_at?: string
          description?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json | null
          severity?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      content_contributions: {
        Row: {
          author_id: string
          content: string
          contribution_type: string
          created_at: string
          id: string
          neurons_awarded: number
          quality_score: number | null
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          author_id: string
          content?: string
          contribution_type?: string
          created_at?: string
          id?: string
          neurons_awarded?: number
          quality_score?: number | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          contribution_type?: string
          created_at?: string
          id?: string
          neurons_awarded?: number
          quality_score?: number | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: []
      }
      control_change_log: {
        Row: {
          change_reason: string | null
          change_type: string
          changed_by: string | null
          created_at: string
          edit_mode: Database["public"]["Enums"]["edit_mode"]
          id: string
          item_id: string
          new_value: Json | null
          old_value: Json | null
          registry_type: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          rolled_back: boolean | null
          rolled_back_at: string | null
        }
        Insert: {
          change_reason?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string
          edit_mode?: Database["public"]["Enums"]["edit_mode"]
          id?: string
          item_id: string
          new_value?: Json | null
          old_value?: Json | null
          registry_type: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          rolled_back?: boolean | null
          rolled_back_at?: string | null
        }
        Update: {
          change_reason?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string
          edit_mode?: Database["public"]["Enums"]["edit_mode"]
          id?: string
          item_id?: string
          new_value?: Json | null
          old_value?: Json | null
          registry_type?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          rolled_back?: boolean | null
          rolled_back_at?: string | null
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
      daily_challenges: {
        Row: {
          active_date: string
          challenge_type: string
          created_at: string
          description: string
          goal_metric: string
          goal_value: number
          id: string
          is_active: boolean
          title: string
          xp_reward: number
        }
        Insert: {
          active_date?: string
          challenge_type?: string
          created_at?: string
          description?: string
          goal_metric: string
          goal_value?: number
          id?: string
          is_active?: boolean
          title: string
          xp_reward?: number
        }
        Update: {
          active_date?: string
          challenge_type?: string
          created_at?: string
          description?: string
          goal_metric?: string
          goal_value?: number
          id?: string
          is_active?: boolean
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      decision_ledger: {
        Row: {
          actor_id: string | null
          created_at: string
          entry_hash: string | null
          event_type: string
          id: string
          ip_hint: string | null
          metadata: Json | null
          prev_hash: string | null
          reason: string | null
          target_resource: string | null
          verdict: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entry_hash?: string | null
          event_type?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json | null
          prev_hash?: string | null
          reason?: string | null
          target_resource?: string | null
          verdict?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entry_hash?: string | null
          event_type?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json | null
          prev_hash?: string | null
          reason?: string | null
          target_resource?: string | null
          verdict?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      emergency_controls: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          affected_scope: string
          control_type: string
          created_at: string
          deactivated_at: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          reason: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          affected_scope?: string
          control_type: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          reason?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          affected_scope?: string
          control_type?: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          canonical_url: string | null
          citation_sources: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          entity_type: string
          evidence_count: number | null
          id: string
          idea_rank: number | null
          importance_score: number | null
          insight_family: string | null
          is_published: boolean | null
          json_ld: Json | null
          meta_description: string | null
          neuron_id: number | null
          reuse_count: number | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          citation_sources?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          entity_type: string
          evidence_count?: number | null
          id?: string
          idea_rank?: number | null
          importance_score?: number | null
          insight_family?: string | null
          is_published?: boolean | null
          json_ld?: Json | null
          meta_description?: string | null
          neuron_id?: number | null
          reuse_count?: number | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          citation_sources?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          entity_type?: string
          evidence_count?: number | null
          id?: string
          idea_rank?: number | null
          importance_score?: number | null
          insight_family?: string | null
          is_published?: boolean | null
          json_ld?: Json | null
          meta_description?: string | null
          neuron_id?: number | null
          reuse_count?: number | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "entities_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_content: {
        Row: {
          content: string | null
          created_at: string | null
          entity_id: string
          id: string
          language: string
          meta_description: string | null
          slug: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          entity_id: string
          id?: string
          language?: string
          meta_description?: string | null
          slug?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          entity_id?: string
          id?: string
          language?: string
          meta_description?: string | null
          slug?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_content_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_labels: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string
          id: string
          language: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id: string
          id?: string
          language?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string
          id?: string
          language?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_labels_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_relations: {
        Row: {
          created_at: string | null
          id: string
          relation_type: string
          source_entity_id: string
          target_entity_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relation_type: string
          source_entity_id: string
          target_entity_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relation_type?: string
          source_entity_id?: string
          target_entity_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_relations_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_relations_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_topics: {
        Row: {
          entity_id: string
          relevance_score: number | null
          topic_id: string
        }
        Insert: {
          entity_id: string
          relevance_score?: number | null
          topic_id: string
        }
        Update: {
          entity_id?: string
          relevance_score?: number | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_topics_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
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
          file_size: number | null
          id: string
          language: string | null
          metadata: Json | null
          source_type: string
          source_url: string | null
          status: string
          title: string
          transcript: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          author_id: string
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          language?: string | null
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string
          transcript?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          author_id?: string
          created_at?: string
          duration_seconds?: number | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          language?: string | null
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          title?: string
          transcript?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_regime_config: {
        Row: {
          cost_cap_action: string | null
          created_at: string
          dry_run: boolean | null
          editable: boolean
          fallback_regime:
            | Database["public"]["Enums"]["execution_regime"]
            | null
          id: string
          is_active: boolean
          last_modified_by: string | null
          max_cost_credits: number | null
          max_retries: number | null
          metadata: Json | null
          output_marked: boolean | null
          regime: Database["public"]["Enums"]["execution_regime"]
          risk_level: Database["public"]["Enums"]["risk_level"]
          scope: Database["public"]["Enums"]["control_scope"]
          service_key: string
          timeout_seconds: number | null
          updated_at: string
          validation_required: boolean | null
          version: number
        }
        Insert: {
          cost_cap_action?: string | null
          created_at?: string
          dry_run?: boolean | null
          editable?: boolean
          fallback_regime?:
            | Database["public"]["Enums"]["execution_regime"]
            | null
          id?: string
          is_active?: boolean
          last_modified_by?: string | null
          max_cost_credits?: number | null
          max_retries?: number | null
          metadata?: Json | null
          output_marked?: boolean | null
          regime?: Database["public"]["Enums"]["execution_regime"]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          scope?: Database["public"]["Enums"]["control_scope"]
          service_key: string
          timeout_seconds?: number | null
          updated_at?: string
          validation_required?: boolean | null
          version?: number
        }
        Update: {
          cost_cap_action?: string | null
          created_at?: string
          dry_run?: boolean | null
          editable?: boolean
          fallback_regime?:
            | Database["public"]["Enums"]["execution_regime"]
            | null
          id?: string
          is_active?: boolean
          last_modified_by?: string | null
          max_cost_credits?: number | null
          max_retries?: number | null
          metadata?: Json | null
          output_marked?: boolean | null
          regime?: Database["public"]["Enums"]["execution_regime"]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          scope?: Database["public"]["Enums"]["control_scope"]
          service_key?: string
          timeout_seconds?: number | null
          updated_at?: string
          validation_required?: boolean | null
          version?: number
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          allowed_roles: string[] | null
          created_at: string
          description: string
          enabled: boolean
          key: string
          metadata: Json | null
          rollout_percentage: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          created_at?: string
          description?: string
          enabled?: boolean
          key: string
          metadata?: Json | null
          rollout_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          created_at?: string
          description?: string
          enabled?: boolean
          key?: string
          metadata?: Json | null
          rollout_percentage?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_responded_at: string | null
          admin_response: string | null
          context_page: string | null
          created_at: string
          id: string
          is_public: boolean
          message: string
          rating: number | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_responded_at?: string | null
          admin_response?: string | null
          context_page?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          message: string
          rating?: number | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_responded_at?: string | null
          admin_response?: string | null
          context_page?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          message?: string
          rating?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          post_count: number
          slug: string
          thread_count: number
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          post_count?: number
          slug: string
          thread_count?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          post_count?: number
          slug?: string
          thread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_flags: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_solution: boolean
          reply_to_id: string | null
          thread_id: string
          updated_at: string
          vote_score: number
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          reply_to_id?: string | null
          thread_id: string
          updated_at?: string
          vote_score?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_solution?: boolean
          reply_to_id?: string | null
          thread_id?: string
          updated_at?: string
          vote_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          category_id: string
          content: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          is_solved: boolean
          last_activity_at: string
          reply_count: number
          slug: string
          solved_post_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
          vote_score: number
        }
        Insert: {
          author_id: string
          category_id: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          is_solved?: boolean
          last_activity_at?: string
          reply_count?: number
          slug: string
          solved_post_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
          vote_score?: number
        }
        Update: {
          author_id?: string
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          is_solved?: boolean
          last_activity_at?: string
          reply_count?: number
          slug?: string
          solved_post_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
          vote_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          vote_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          vote_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          vote_value?: number
        }
        Relationships: []
      }
      guest_profile_edits: {
        Row: {
          created_at: string | null
          editor_id: string
          field_name: string
          guest_profile_id: string
          id: string
          new_value: string
          old_value: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          editor_id: string
          field_name: string
          guest_profile_id: string
          id?: string
          new_value: string
          old_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          editor_id?: string
          field_name?: string
          guest_profile_id?: string
          id?: string
          new_value?: string
          old_value?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      guest_profile_suggestions: {
        Row: {
          created_at: string | null
          id: string
          resolved_at: string | null
          resolved_by: string | null
          similarity_score: number | null
          source_profile_id: string
          status: string | null
          suggested_by: string | null
          target_profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number | null
          source_profile_id: string
          status?: string | null
          suggested_by?: string | null
          target_profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          similarity_score?: number | null
          source_profile_id?: string
          status?: string | null
          suggested_by?: string | null
          target_profile_id?: string
        }
        Relationships: []
      }
      guest_profiles: {
        Row: {
          author_id: string
          bio: string | null
          created_at: string
          episode_ids: string[] | null
          expertise_areas: string[] | null
          frameworks_mentioned: string[] | null
          full_name: string
          id: string
          is_public: boolean | null
          key_quotes: string[] | null
          metadata: Json | null
          neuron_ids: number[] | null
          psychological_traits: string[] | null
          role: string
          slug: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          author_id: string
          bio?: string | null
          created_at?: string
          episode_ids?: string[] | null
          expertise_areas?: string[] | null
          frameworks_mentioned?: string[] | null
          full_name: string
          id?: string
          is_public?: boolean | null
          key_quotes?: string[] | null
          metadata?: Json | null
          neuron_ids?: number[] | null
          psychological_traits?: string[] | null
          role?: string
          slug: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          author_id?: string
          bio?: string | null
          created_at?: string
          episode_ids?: string[] | null
          expertise_areas?: string[] | null
          frameworks_mentioned?: string[] | null
          full_name?: string
          id?: string
          is_public?: boolean | null
          key_quotes?: string[] | null
          metadata?: Json | null
          neuron_ids?: number[] | null
          psychological_traits?: string[] | null
          role?: string
          slug?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_metrics: {
        Row: {
          acceleration_score: number
          activation_score: number
          amplification_probability: number
          authority_score: number
          betweenness_score: number
          centrality_delta: number
          computed_at: string
          connectivity_growth: number
          decay_risk_score: number
          economic_conversion_score: number
          emergence_score: number
          growth_score: number
          is_emerging: boolean
          model_version: string
          multi_hop_influence: number
          node_id: string
          novelty_score: number
          pagerank_score: number
          previous_activation: number
          previous_degree: number
          previous_pagerank: number
          propagation_value_score: number
          structural_rarity: number
        }
        Insert: {
          acceleration_score?: number
          activation_score?: number
          amplification_probability?: number
          authority_score?: number
          betweenness_score?: number
          centrality_delta?: number
          computed_at?: string
          connectivity_growth?: number
          decay_risk_score?: number
          economic_conversion_score?: number
          emergence_score?: number
          growth_score?: number
          is_emerging?: boolean
          model_version?: string
          multi_hop_influence?: number
          node_id: string
          novelty_score?: number
          pagerank_score?: number
          previous_activation?: number
          previous_degree?: number
          previous_pagerank?: number
          propagation_value_score?: number
          structural_rarity?: number
        }
        Update: {
          acceleration_score?: number
          activation_score?: number
          amplification_probability?: number
          authority_score?: number
          betweenness_score?: number
          centrality_delta?: number
          computed_at?: string
          connectivity_growth?: number
          decay_risk_score?: number
          economic_conversion_score?: number
          emergence_score?: number
          growth_score?: number
          is_emerging?: boolean
          model_version?: string
          multi_hop_influence?: number
          node_id?: string
          novelty_score?: number
          pagerank_score?: number
          previous_activation?: number
          previous_degree?: number
          previous_pagerank?: number
          propagation_value_score?: number
          structural_rarity?: number
        }
        Relationships: [
          {
            foreignKeyName: "idea_metrics_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: true
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_rank_experiments: {
        Row: {
          config: Json
          created_at: string
          experiment_id: string
          metrics: Json
          model_version: string
          test_range: unknown
          train_range: unknown
          validate_range: unknown
        }
        Insert: {
          config?: Json
          created_at?: string
          experiment_id?: string
          metrics?: Json
          model_version: string
          test_range: unknown
          train_range: unknown
          validate_range: unknown
        }
        Update: {
          config?: Json
          created_at?: string
          experiment_id?: string
          metrics?: Json
          model_version?: string
          test_range?: unknown
          train_range?: unknown
          validate_range?: unknown
        }
        Relationships: []
      }
      idea_rank_predictions: {
        Row: {
          experiment_id: string
          node_id: string
          predicted_economic_use: number | null
          predicted_growth: number | null
          predicted_rank: number | null
          predicted_score: number
          snapshot_at: string
        }
        Insert: {
          experiment_id: string
          node_id: string
          predicted_economic_use?: number | null
          predicted_growth?: number | null
          predicted_rank?: number | null
          predicted_score?: number
          snapshot_at: string
        }
        Update: {
          experiment_id?: string
          node_id?: string
          predicted_economic_use?: number | null
          predicted_growth?: number | null
          predicted_rank?: number | null
          predicted_score?: number
          snapshot_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_rank_predictions_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "idea_rank_experiments"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "idea_rank_predictions_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      imf_pipeline_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          pipeline_id: string
          result: Json | null
          started_at: string
          status: string
          steps_completed: number
          total_steps: number
          trigger_data: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          pipeline_id: string
          result?: Json | null
          started_at?: string
          status?: string
          steps_completed?: number
          total_steps?: number
          trigger_data?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          pipeline_id?: string
          result?: Json | null
          started_at?: string
          status?: string
          steps_completed?: number
          total_steps?: number
          trigger_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imf_pipeline_runs_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "imf_pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      imf_pipelines: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          steps: Json
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          steps?: Json
          trigger_event: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          related_job_id: string | null
          related_user_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          related_job_id?: string | null
          related_user_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          related_job_id?: string | null
          related_user_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      insight_scores: {
        Row: {
          composite_score: number
          computed_at: string
          demand: number
          extraction_level: string | null
          id: string
          information_density: number
          model_version: string
          neuron_id: number
          novelty: number
          tier: string
          utility: number
        }
        Insert: {
          composite_score?: number
          computed_at?: string
          demand?: number
          extraction_level?: string | null
          id?: string
          information_density?: number
          model_version?: string
          neuron_id: number
          novelty?: number
          tier?: string
          utility?: number
        }
        Update: {
          composite_score?: number
          computed_at?: string
          demand?: number
          extraction_level?: string | null
          id?: string
          information_density?: number
          model_version?: string
          neuron_id?: number
          novelty?: number
          tier?: string
          utility?: number
        }
        Relationships: [
          {
            foreignKeyName: "insight_scores_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: true
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "insight_scores_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: true
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_analytics: {
        Row: {
          article_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_analytics_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_assets: {
        Row: {
          artifact_ids: string[] | null
          asset_type: string
          author_id: string
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          metadata: Json | null
          neuron_ids: number[] | null
          preview_content: string | null
          price_neurons: number | null
          price_usd: number | null
          rating_avg: number | null
          rating_count: number | null
          sales_count: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          artifact_ids?: string[] | null
          asset_type?: string
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          neuron_ids?: number[] | null
          preview_content?: string | null
          price_neurons?: number | null
          price_usd?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          sales_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          artifact_ids?: string[] | null
          asset_type?: string
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          metadata?: Json | null
          neuron_ids?: number[] | null
          preview_content?: string | null
          price_neurons?: number | null
          price_usd?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          sales_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          content: string
          created_at: string
          created_by: string
          excerpt: string | null
          id: string
          is_public: boolean
          last_viewed_at: string | null
          reading_time: number
          slug: string
          status: string
          subcategory: string | null
          tags: string[]
          title: string
          updated_at: string
          view_count: number
          workspace_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          content?: string
          created_at?: string
          created_by: string
          excerpt?: string | null
          id?: string
          is_public?: boolean
          last_viewed_at?: string | null
          reading_time?: number
          slug: string
          status?: string
          subcategory?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
          workspace_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          excerpt?: string | null
          id?: string
          is_public?: boolean
          last_viewed_at?: string | null
          reading_time?: number
          slug?: string
          status?: string
          subcategory?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_progress: {
        Row: {
          completed_at: string | null
          completed_items: string[]
          created_at: string
          current_item_id: string | null
          id: string
          path_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_items?: string[]
          created_at?: string
          current_item_id?: string | null
          id?: string
          path_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_items?: string[]
          created_at?: string
          current_item_id?: string | null
          id?: string
          path_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_progress_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          category_order: string[]
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category_order?: string[]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category_order?: string[]
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          slug?: string
          title?: string
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
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
      neuron_duplicates: {
        Row: {
          created_at: string
          id: string
          neuron_a: number
          neuron_b: number
          resolved_at: string | null
          resolved_by: string | null
          similarity: number
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          neuron_a: number
          neuron_b: number
          resolved_at?: string | null
          resolved_by?: string | null
          similarity?: number
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          neuron_a?: number
          neuron_b?: number
          resolved_at?: string | null
          resolved_by?: string | null
          similarity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "neuron_duplicates_neuron_a_fkey"
            columns: ["neuron_a"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "neuron_duplicates_neuron_a_fkey"
            columns: ["neuron_a"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neuron_duplicates_neuron_b_fkey"
            columns: ["neuron_b"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "neuron_duplicates_neuron_b_fkey"
            columns: ["neuron_b"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      neuron_embeddings: {
        Row: {
          content_hash: string | null
          created_at: string
          embedding: string | null
          id: string
          model: string
          neuron_id: number
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
          neuron_id: number
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          model?: string
          neuron_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "neuron_embeddings_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "neuron_embeddings_neuron_id_fkey"
            columns: ["neuron_id"]
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
          dead_letter: boolean
          error_message: string | null
          id: string
          input: Json | null
          max_retries: number
          neuron_id: number
          priority: number
          result: Json | null
          retry_count: number
          scheduled_at: string | null
          status: string
          worker_type: string
          workspace_id: string | null
        }
        Insert: {
          author_id?: string | null
          block_id?: string | null
          completed_at?: string | null
          created_at?: string
          dead_letter?: boolean
          error_message?: string | null
          id?: string
          input?: Json | null
          max_retries?: number
          neuron_id: number
          priority?: number
          result?: Json | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          worker_type: string
          workspace_id?: string | null
        }
        Update: {
          author_id?: string | null
          block_id?: string | null
          completed_at?: string | null
          created_at?: string
          dead_letter?: boolean
          error_message?: string | null
          id?: string
          input?: Json | null
          max_retries?: number
          neuron_id?: number
          priority?: number
          result?: Json | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          worker_type?: string
          workspace_id?: string | null
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "neuron_jobs_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neuron_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
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
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
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
          workspace_id: string | null
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
          workspace_id?: string | null
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
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neurons_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neurons_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_credits: boolean
          email_digest: string
          email_feedback: boolean
          email_jobs: boolean
          id: string
          monthly_digest: boolean
          push_credits: boolean
          push_enabled: boolean
          push_feedback: boolean
          push_jobs: boolean
          push_versions: boolean
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          created_at?: string
          email_credits?: boolean
          email_digest?: string
          email_feedback?: boolean
          email_jobs?: boolean
          id?: string
          monthly_digest?: boolean
          push_credits?: boolean
          push_enabled?: boolean
          push_feedback?: boolean
          push_jobs?: boolean
          push_versions?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          created_at?: string
          email_credits?: boolean
          email_digest?: string
          email_feedback?: boolean
          email_jobs?: boolean
          id?: string
          monthly_digest?: boolean
          push_credits?: boolean
          push_enabled?: boolean
          push_feedback?: boolean
          push_jobs?: boolean
          push_versions?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
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
      prompt_registry: {
        Row: {
          category: string
          core_prompt: string
          cost_profile: Json | null
          created_at: string
          editable: boolean
          execution_mode: Database["public"]["Enums"]["execution_regime"]
          id: string
          input_schema: Json | null
          is_active: boolean
          last_modified_by: string | null
          metadata: Json | null
          modifiers: Json | null
          output_schema: Json | null
          purpose: string
          risk_level: Database["public"]["Enums"]["risk_level"]
          rollback_version: number | null
          scope: Database["public"]["Enums"]["control_scope"]
          updated_at: string
          version: number
        }
        Insert: {
          category?: string
          core_prompt: string
          cost_profile?: Json | null
          created_at?: string
          editable?: boolean
          execution_mode?: Database["public"]["Enums"]["execution_regime"]
          id: string
          input_schema?: Json | null
          is_active?: boolean
          last_modified_by?: string | null
          metadata?: Json | null
          modifiers?: Json | null
          output_schema?: Json | null
          purpose?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          rollback_version?: number | null
          scope?: Database["public"]["Enums"]["control_scope"]
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          core_prompt?: string
          cost_profile?: Json | null
          created_at?: string
          editable?: boolean
          execution_mode?: Database["public"]["Enums"]["execution_regime"]
          id?: string
          input_schema?: Json | null
          is_active?: boolean
          last_modified_by?: string | null
          metadata?: Json | null
          modifiers?: Json | null
          output_schema?: Json | null
          purpose?: string
          risk_level?: Database["public"]["Enums"]["risk_level"]
          rollback_version?: number | null
          scope?: Database["public"]["Enums"]["control_scope"]
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      prompt_versions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          core_prompt: string
          cost_profile: Json | null
          created_at: string
          execution_mode: Database["public"]["Enums"]["execution_regime"]
          id: string
          modifiers: Json | null
          prompt_id: string
          version: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          core_prompt: string
          cost_profile?: Json | null
          created_at?: string
          execution_mode?: Database["public"]["Enums"]["execution_regime"]
          id?: string
          modifiers?: Json | null
          prompt_id: string
          version: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          core_prompt?: string
          cost_profile?: Json | null
          created_at?: string
          execution_mode?: Database["public"]["Enums"]["execution_regime"]
          id?: string
          modifiers?: Json | null
          prompt_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_profiles: {
        Row: {
          agreeableness: number | null
          analysis_metadata: Json | null
          analytical_thinking: number | null
          authenticity: number | null
          author_id: string
          clout: number | null
          cognitive_complexity: number | null
          communication_style: string | null
          confidence_level: number | null
          conscientiousness: number | null
          created_at: string | null
          decision_style: string | null
          dominance: number | null
          emotional_tone: number | null
          empathy: number | null
          extraversion: number | null
          guest_profile_id: string
          id: string
          leadership_style: string | null
          lexical_features: Json | null
          model_version: string | null
          neuroticism: number | null
          openness: number | null
          persuasion_approach: string | null
          risk_tolerance: string | null
          updated_at: string | null
        }
        Insert: {
          agreeableness?: number | null
          analysis_metadata?: Json | null
          analytical_thinking?: number | null
          authenticity?: number | null
          author_id: string
          clout?: number | null
          cognitive_complexity?: number | null
          communication_style?: string | null
          confidence_level?: number | null
          conscientiousness?: number | null
          created_at?: string | null
          decision_style?: string | null
          dominance?: number | null
          emotional_tone?: number | null
          empathy?: number | null
          extraversion?: number | null
          guest_profile_id: string
          id?: string
          leadership_style?: string | null
          lexical_features?: Json | null
          model_version?: string | null
          neuroticism?: number | null
          openness?: number | null
          persuasion_approach?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
        }
        Update: {
          agreeableness?: number | null
          analysis_metadata?: Json | null
          analytical_thinking?: number | null
          authenticity?: number | null
          author_id?: string
          clout?: number | null
          cognitive_complexity?: number | null
          communication_style?: string | null
          confidence_level?: number | null
          conscientiousness?: number | null
          created_at?: string | null
          decision_style?: string | null
          dominance?: number | null
          emotional_tone?: number | null
          empathy?: number | null
          extraversion?: number | null
          guest_profile_id?: string
          id?: string
          leadership_style?: string | null
          lexical_features?: Json | null
          model_version?: string | null
          neuroticism?: number | null
          openness?: number | null
          persuasion_approach?: string | null
          risk_tolerance?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psychological_profiles_guest_profile_id_fkey"
            columns: ["guest_profile_id"]
            isOneToOne: true
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_config: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      runtime_health: {
        Row: {
          avg_latency_ms: number
          circuit_opened_at: string | null
          circuit_state: string
          consecutive_failures: number
          cooldown_until: string | null
          error_rate_1h: number
          last_check_at: string
          metadata: Json | null
          service_key: string
          status: string
          updated_at: string
        }
        Insert: {
          avg_latency_ms?: number
          circuit_opened_at?: string | null
          circuit_state?: string
          consecutive_failures?: number
          cooldown_until?: string | null
          error_rate_1h?: number
          last_check_at?: string
          metadata?: Json | null
          service_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          avg_latency_ms?: number
          circuit_opened_at?: string | null
          circuit_state?: string
          consecutive_failures?: number
          cooldown_until?: string | null
          error_rate_1h?: number
          last_check_at?: string
          metadata?: Json | null
          service_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      runtime_validations: {
        Row: {
          created_at: string
          id: string
          latency_ms: number | null
          metadata: Json | null
          reason: string | null
          service_key: string
          user_id: string | null
          validation_type: string
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          reason?: string | null
          service_key: string
          user_id?: string | null
          validation_type?: string
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          reason?: string | null
          service_key?: string
          user_id?: string | null
          validation_type?: string
          verdict?: string
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          access_tier: string
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
          access_tier?: string
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
          access_tier?: string
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
      service_manifests: {
        Row: {
          access_requirements: Json | null
          created_at: string | null
          dependencies: string[] | null
          estimated_duration_seconds: number | null
          id: string
          input_schema: Json | null
          is_validated: boolean | null
          output_schema: Json | null
          pipeline_class: string
          pipeline_steps: Json | null
          service_key: string
          updated_at: string | null
        }
        Insert: {
          access_requirements?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          estimated_duration_seconds?: number | null
          id?: string
          input_schema?: Json | null
          is_validated?: boolean | null
          output_schema?: Json | null
          pipeline_class?: string
          pipeline_steps?: Json | null
          service_key: string
          updated_at?: string | null
        }
        Update: {
          access_requirements?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          estimated_duration_seconds?: number | null
          id?: string
          input_schema?: Json | null
          is_validated?: boolean | null
          output_schema?: Json | null
          pipeline_class?: string
          pipeline_steps?: Json | null
          service_key?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_manifests_service_key_fkey"
            columns: ["service_key"]
            isOneToOne: true
            referencedRelation: "service_catalog"
            referencedColumns: ["service_key"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          name: string
          neurons_monthly: number
          plan_key: string
          position: number
          price_usd: number
          token_requirement: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          neurons_monthly?: number
          plan_key: string
          position?: number
          price_usd?: number
          token_requirement?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          neurons_monthly?: number
          plan_key?: string
          position?: number
          price_usd?: number
          token_requirement?: number
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          category: string
          created_at: string
          description: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      team_challenge_contributions: {
        Row: {
          amount: number
          challenge_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          challenge_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          challenge_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenge_contributions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "team_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      team_challenges: {
        Row: {
          created_at: string
          current_value: number
          description: string
          ends_at: string
          goal_metric: string
          goal_value: number
          id: string
          is_active: boolean
          neurons_reward: number
          starts_at: string
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          current_value?: number
          description?: string
          ends_at?: string
          goal_metric: string
          goal_value?: number
          id?: string
          is_active?: boolean
          neurons_reward?: number
          starts_at?: string
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          current_value?: number
          description?: string
          ends_at?: string
          goal_metric?: string
          goal_value?: number
          id?: string
          is_active?: boolean
          neurons_reward?: number
          starts_at?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      token_balances: {
        Row: {
          access_tier: string
          balance: number
          id: string
          staked: number
          tier_expires_at: string | null
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          access_tier?: string
          balance?: number
          id?: string
          staked?: number
          tier_expires_at?: string | null
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          access_tier?: string
          balance?: number
          id?: string
          staked?: number
          tier_expires_at?: string | null
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_labels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          language: string
          slug: string | null
          title: string
          topic_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          slug?: string | null
          title: string
          topic_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          slug?: string | null
          title?: string
          topic_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_labels_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          description: string | null
          entity_count: number | null
          id: string
          parent_topic_id: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_count?: number | null
          id?: string
          parent_topic_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_count?: number | null
          id?: string
          parent_topic_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      training_datasets: {
        Row: {
          created_at: string
          created_by: string | null
          dataset_type: string
          description: string
          export_format: string
          id: string
          last_exported_at: string | null
          metadata: Json | null
          name: string
          quality_threshold: number
          status: string
          total_samples: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dataset_type?: string
          description?: string
          export_format?: string
          id?: string
          last_exported_at?: string | null
          metadata?: Json | null
          name: string
          quality_threshold?: number
          status?: string
          total_samples?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dataset_type?: string
          description?: string
          export_format?: string
          id?: string
          last_exported_at?: string | null
          metadata?: Json | null
          name?: string
          quality_threshold?: number
          status?: string
          total_samples?: number
          updated_at?: string
        }
        Relationships: []
      }
      training_samples: {
        Row: {
          cognitive_unit_id: string | null
          created_at: string
          dataset_id: string
          id: string
          input_text: string
          is_approved: boolean
          metadata: Json | null
          output_text: string
          quality_score: number
          reviewer_notes: string | null
          system_prompt: string | null
        }
        Insert: {
          cognitive_unit_id?: string | null
          created_at?: string
          dataset_id: string
          id?: string
          input_text: string
          is_approved?: boolean
          metadata?: Json | null
          output_text: string
          quality_score?: number
          reviewer_notes?: string | null
          system_prompt?: string | null
        }
        Update: {
          cognitive_unit_id?: string | null
          created_at?: string
          dataset_id?: string
          id?: string
          input_text?: string
          is_approved?: boolean
          metadata?: Json | null
          output_text?: string
          quality_score?: number
          reviewer_notes?: string | null
          system_prompt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_samples_cognitive_unit_id_fkey"
            columns: ["cognitive_unit_id"]
            isOneToOne: false
            referencedRelation: "cognitive_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_samples_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "training_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_control_registry: {
        Row: {
          action: string | null
          created_at: string
          description: string | null
          editable: boolean
          element_type: string
          enabled: boolean
          id: string
          label: string
          last_modified_by: string | null
          metadata: Json | null
          permissions: string[] | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          scope: Database["public"]["Enums"]["control_scope"]
          sort_order: number | null
          state_overrides: Json | null
          updated_at: string
          version: number
          visible: boolean
        }
        Insert: {
          action?: string | null
          created_at?: string
          description?: string | null
          editable?: boolean
          element_type?: string
          enabled?: boolean
          id: string
          label?: string
          last_modified_by?: string | null
          metadata?: Json | null
          permissions?: string[] | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          scope?: Database["public"]["Enums"]["control_scope"]
          sort_order?: number | null
          state_overrides?: Json | null
          updated_at?: string
          version?: number
          visible?: boolean
        }
        Update: {
          action?: string | null
          created_at?: string
          description?: string | null
          editable?: boolean
          element_type?: string
          enabled?: boolean
          id?: string
          label?: string
          last_modified_by?: string | null
          metadata?: Json | null
          permissions?: string[] | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          scope?: Database["public"]["Enums"]["control_scope"]
          sort_order?: number | null
          state_overrides?: Json | null
          updated_at?: string
          version?: number
          visible?: boolean
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          description: string | null
          icon: string | null
          id: string
          title: string
          unlocked_at: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          achievement_key: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          unlocked_at?: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          achievement_key?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          unlocked_at?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          daily_spend_cap: number
          daily_spent: number
          daily_spent_date: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          daily_spend_cap?: number
          daily_spent?: number
          daily_spent_date?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          daily_spend_cap?: number
          daily_spent?: number
          daily_spent_date?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_karma: {
        Row: {
          downvotes_received: number
          karma: number
          posts_created: number
          solutions_given: number
          threads_created: number
          updated_at: string
          upvotes_received: number
          user_id: string
        }
        Insert: {
          downvotes_received?: number
          karma?: number
          posts_created?: number
          solutions_given?: number
          threads_created?: number
          updated_at?: string
          upvotes_received?: number
          user_id: string
        }
        Update: {
          downvotes_received?: number
          karma?: number
          posts_created?: number
          solutions_given?: number
          threads_created?: number
          updated_at?: string
          upvotes_received?: number
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
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          freeze_tokens: number
          freeze_tokens_reset_at: string
          grace_period_used: boolean
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          freeze_tokens?: number
          freeze_tokens_reset_at?: string
          grace_period_used?: boolean
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          freeze_tokens?: number
          freeze_tokens_reset_at?: string
          grace_period_used?: boolean
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          created_at: string
          daily_xp_date: string
          daily_xp_earned: number
          level: number
          rank_name: string
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_xp_date?: string
          daily_xp_earned?: number
          level?: number
          rank_name?: string
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_xp_date?: string
          daily_xp_earned?: number
          level?: number
          rank_name?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_milestone_progress: {
        Row: {
          claimed_reward: boolean
          created_at: string
          id: string
          milestone_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          claimed_reward?: boolean
          created_at?: string
          id?: string
          milestone_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          claimed_reward?: boolean
          created_at?: string
          id?: string
          milestone_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_milestone_progress_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "vip_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_milestones: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          month_number: number
          position: number
          reward_neurons: number
          title: string
          unlock_key: string
          unlock_type: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          month_number: number
          position?: number
          reward_neurons?: number
          title: string
          unlock_key: string
          unlock_type?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          month_number?: number
          position?: number
          reward_neurons?: number
          title?: string
          unlock_key?: string
          unlock_type?: string
        }
        Relationships: []
      }
      vip_subscriptions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_month: number
          id: string
          is_active: boolean
          metadata: Json | null
          paused_at: string | null
          started_at: string
          tier_override: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_month?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          paused_at?: string | null
          started_at?: string
          tier_override?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_month?: number
          id?: string
          is_active?: boolean
          metadata?: Json | null
          paused_at?: string | null
          started_at?: string
          tier_override?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_war_room_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          user_id: string
          war_room_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          user_id: string
          war_room_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
          war_room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_war_room_members_war_room_id_fkey"
            columns: ["war_room_id"]
            isOneToOne: false
            referencedRelation: "vip_war_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_war_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean
          max_members: number
          metadata: Json | null
          min_month: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          max_members?: number
          metadata?: Json | null
          min_month?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          max_members?: number
          metadata?: Json | null
          min_month?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_state: {
        Row: {
          available: number
          chain_metadata: Json | null
          created_at: string
          locked: number
          snapshot_ts: string
          staked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: number
          chain_metadata?: Json | null
          created_at?: string
          locked?: number
          snapshot_ts?: string
          staked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: number
          chain_metadata?: Json | null
          created_at?: string
          locked?: number
          snapshot_ts?: string
          staked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt: number
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          status: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          description: string
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_triggered_at: string | null
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          metadata: Json | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      neuron_lifecycle_pricing: {
        Row: {
          adjusted_cost: number | null
          base_cost: number | null
          lifecycle: string | null
          lifecycle_multiplier: number | null
          neuron_id: number | null
        }
        Insert: {
          adjusted_cost?: never
          base_cost?: number | null
          lifecycle?: string | null
          lifecycle_multiplier?: never
          neuron_id?: number | null
        }
        Update: {
          adjusted_cost?: never
          base_cost?: number | null
          lifecycle?: string | null
          lifecycle_multiplier?: never
          neuron_id?: number | null
        }
        Relationships: []
      }
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
      public_contributions: {
        Row: {
          content: string | null
          contribution_type: string | null
          created_at: string | null
          id: string | null
          neurons_awarded: number | null
          status: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          content?: string | null
          contribution_type?: string | null
          created_at?: string | null
          id?: string | null
          neurons_awarded?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          content?: string | null
          contribution_type?: string | null
          created_at?: string | null
          id?: string | null
          neurons_awarded?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_emergency: {
        Args: { _control_type: string; _reason: string; _scope?: string }
        Returns: string
      }
      add_credits: {
        Args: {
          _amount: number
          _description: string
          _type?: string
          _user_id: string
        }
        Returns: boolean
      }
      advance_vip_month: { Args: { _user_id: string }; Returns: Json }
      analytics_summary: { Args: { _days?: number }; Returns: Json }
      apply_abuse_ladder: { Args: { _user_id: string }; Returns: string }
      award_xp:
        | {
            Args: {
              _amount: number
              _source?: string
              _source_id?: string
              _user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              _amount: number
              _bypass_cap?: boolean
              _description?: string
              _source: string
              _user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              _amount: number
              _bypass_cap?: boolean
              _description?: string
              _quality_multiplier?: number
              _source: string
              _user_id: string
            }
            Returns: Json
          }
      check_access: {
        Args: { _service_key: string; _user_id: string }
        Returns: Json
      }
      check_access_logged: {
        Args: { _ip_hint?: string; _service_key: string; _user_id: string }
        Returns: Json
      }
      check_access_safe: {
        Args: { _ip_hint?: string; _service_key: string; _user_id: string }
        Returns: Json
      }
      check_vip_access: {
        Args: { _unlock_key: string; _user_id: string }
        Returns: boolean
      }
      check_wallet_freshness: {
        Args: { _max_age_seconds?: number; _user_id: string }
        Returns: Json
      }
      collection_pipeline_stats: { Args: { _user_id: string }; Returns: Json }
      compute_idearank: { Args: never; Returns: undefined }
      data_pipeline_stats: { Args: never; Returns: Json }
      deactivate_emergency: { Args: { _control_id: string }; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      detect_export_farming: { Args: { _user_id: string }; Returns: boolean }
      detect_prompt_probing: { Args: { _user_id: string }; Returns: boolean }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      forum_mark_solution: {
        Args: { _post_id: string; _thread_id: string }
        Returns: Json
      }
      forum_vote: {
        Args: { _target_id: string; _target_type: string; _vote_value: number }
        Returns: Json
      }
      get_public_profile: { Args: { _username: string }; Returns: Json }
      has_admin_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_workspace_role: {
        Args: {
          _role: Database["public"]["Enums"]["workspace_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_feature_enabled: {
        Args: { _key: string; _user_id?: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      kb_dashboard_stats: { Args: { _user_id: string }; Returns: Json }
      kb_track_view: {
        Args: { _article_id: string; _user_id: string }
        Returns: undefined
      }
      log_compliance: {
        Args: {
          _action: string
          _actor_id: string
          _description?: string
          _severity?: string
          _target_id?: string
          _target_type: string
        }
        Returns: string
      }
      maintain_streak: { Args: { _user_id: string }; Returns: Json }
      mark_units_llm_ready: {
        Args: { _category_id: string; _min_quality?: number }
        Returns: number
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      purchase_marketplace_asset: {
        Args: { _asset_id: string; _buyer_id: string }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      record_daily_activity: { Args: { _user_id: string }; Returns: Json }
      refund_credits: {
        Args: { _amount: number; _job_id: string; _user_id: string }
        Returns: boolean
      }
      reserve_credits: {
        Args: { _amount: number; _job_id: string; _user_id: string }
        Returns: boolean
      }
      reset_api_key_counters: { Args: never; Returns: undefined }
      retry_failed_job: { Args: { _job_id: string }; Returns: boolean }
      root2_nearest: { Args: { _price: number }; Returns: number }
      root2_validate: { Args: { _price: number }; Returns: boolean }
      runtime_system_stats: { Args: never; Returns: Json }
      score_contribution: {
        Args: { _contribution_id: string }
        Returns: number
      }
      search_neurons_semantic: {
        Args: {
          _user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          neuron_id: number
          similarity: number
          title: string
        }[]
      }
      settle_credits: {
        Args: { _amount: number; _job_id: string; _user_id: string }
        Returns: boolean
      }
      spend_credits: {
        Args: {
          _amount: number
          _description: string
          _job_id?: string
          _user_id: string
        }
        Returns: boolean
      }
      spend_credits_capped: {
        Args: {
          _amount: number
          _description: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
      }
      wallet_add: {
        Args: { _amount: number; _description?: string; _user_id: string }
        Returns: Json
      }
      wallet_history: {
        Args: { _limit?: number; _user_id: string }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          job_id: string
          type: string
        }[]
      }
      wallet_refund: {
        Args: {
          _amount: number
          _description?: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
      }
      wallet_reserve: {
        Args: {
          _amount: number
          _description?: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
      }
      wallet_settle: {
        Args: {
          _amount: number
          _description?: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
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
      control_scope: "global" | "app" | "service" | "user"
      edit_mode: "safe" | "strict" | "experimental" | "locked"
      execution_regime:
        | "fast"
        | "balanced"
        | "strict"
        | "simulation"
        | "emergency"
      neuron_lifecycle:
        | "ingested"
        | "structured"
        | "active"
        | "capitalized"
        | "compounded"
      risk_level: "low" | "medium" | "high" | "critical"
      service_class: "A" | "B" | "C"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
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
      control_scope: ["global", "app", "service", "user"],
      edit_mode: ["safe", "strict", "experimental", "locked"],
      execution_regime: [
        "fast",
        "balanced",
        "strict",
        "simulation",
        "emergency",
      ],
      neuron_lifecycle: [
        "ingested",
        "structured",
        "active",
        "capitalized",
        "compounded",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      service_class: ["A", "B", "C"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
