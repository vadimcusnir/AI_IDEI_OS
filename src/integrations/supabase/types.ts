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
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "neuron_jobs"
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
            referencedRelation: "neurons"
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
        }
        Relationships: []
      }
      idea_metrics: {
        Row: {
          acceleration_score: number
          activation_score: number
          amplification_probability: number
          authority_score: number
          betweenness_score: number
          computed_at: string
          decay_risk_score: number
          economic_conversion_score: number
          growth_score: number
          model_version: string
          multi_hop_influence: number
          node_id: string
          novelty_score: number
          pagerank_score: number
          propagation_value_score: number
        }
        Insert: {
          acceleration_score?: number
          activation_score?: number
          amplification_probability?: number
          authority_score?: number
          betweenness_score?: number
          computed_at?: string
          decay_risk_score?: number
          economic_conversion_score?: number
          growth_score?: number
          model_version?: string
          multi_hop_influence?: number
          node_id: string
          novelty_score?: number
          pagerank_score?: number
          propagation_value_score?: number
        }
        Update: {
          acceleration_score?: number
          activation_score?: number
          amplification_probability?: number
          authority_score?: number
          betweenness_score?: number
          computed_at?: string
          decay_risk_score?: number
          economic_conversion_score?: number
          growth_score?: number
          model_version?: string
          multi_hop_influence?: number
          node_id?: string
          novelty_score?: number
          pagerank_score?: number
          propagation_value_score?: number
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
      compute_idearank: { Args: never; Returns: undefined }
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
