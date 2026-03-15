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
          push_credits: boolean
          push_enabled: boolean
          push_feedback: boolean
          push_jobs: boolean
          push_versions: boolean
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_credits?: boolean
          email_digest?: string
          email_feedback?: boolean
          email_jobs?: boolean
          id?: string
          push_credits?: boolean
          push_enabled?: boolean
          push_feedback?: boolean
          push_jobs?: boolean
          push_versions?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_credits?: boolean
          email_digest?: string
          email_feedback?: boolean
          email_jobs?: boolean
          id?: string
          push_credits?: boolean
          push_enabled?: boolean
          push_feedback?: boolean
          push_jobs?: boolean
          push_versions?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id?: string
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
    }
    Functions: {
      add_credits: {
        Args: {
          _amount: number
          _description: string
          _type?: string
          _user_id: string
        }
        Returns: boolean
      }
      apply_abuse_ladder: { Args: { _user_id: string }; Returns: string }
      check_access: {
        Args: { _service_key: string; _user_id: string }
        Returns: Json
      }
      check_access_logged: {
        Args: { _ip_hint?: string; _service_key: string; _user_id: string }
        Returns: Json
      }
      compute_idearank: { Args: never; Returns: undefined }
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
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
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
      neuron_lifecycle: [
        "ingested",
        "structured",
        "active",
        "capitalized",
        "compounded",
      ],
      service_class: ["A", "B", "C"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
