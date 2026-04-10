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
      admin_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          description: string | null
          error_signal: string | null
          first_seen: string
          id: string
          impact_scope: string | null
          last_seen: string
          metadata: Json | null
          occurrences: number | null
          provider_key: string | null
          recommended_action: string | null
          resolved_at: string | null
          service_key: string | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          error_signal?: string | null
          first_seen?: string
          id?: string
          impact_scope?: string | null
          last_seen?: string
          metadata?: Json | null
          occurrences?: number | null
          provider_key?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          service_key?: string | null
          severity?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          error_signal?: string | null
          first_seen?: string
          id?: string
          impact_scope?: string | null
          last_seen?: string
          metadata?: Json | null
          occurrences?: number | null
          provider_key?: string | null
          recommended_action?: string | null
          resolved_at?: string | null
          service_key?: string | null
          severity?: string
          title?: string
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
      agent_action_history: {
        Row: {
          completed_steps: number
          created_at: string
          duration_seconds: number | null
          id: string
          intent_key: string
          plan_template_id: string | null
          success: boolean
          total_credits: number
          total_steps: number
          user_id: string
        }
        Insert: {
          completed_steps?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          intent_key: string
          plan_template_id?: string | null
          success?: boolean
          total_credits?: number
          total_steps?: number
          user_id: string
        }
        Update: {
          completed_steps?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          intent_key?: string
          plan_template_id?: string | null
          success?: boolean
          total_credits?: number
          total_steps?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_action_history_plan_template_id_fkey"
            columns: ["plan_template_id"]
            isOneToOne: false
            referencedRelation: "agent_plan_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_actions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          input_summary: string | null
          intent_confidence: number
          intent_key: string
          metadata: Json | null
          plan_template_id: string | null
          result_summary: string | null
          session_id: string
          status: string
          total_credits_estimated: number
          total_credits_spent: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input_summary?: string | null
          intent_confidence?: number
          intent_key?: string
          metadata?: Json | null
          plan_template_id?: string | null
          result_summary?: string | null
          session_id?: string
          status?: string
          total_credits_estimated?: number
          total_credits_spent?: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          input_summary?: string | null
          intent_confidence?: number
          intent_key?: string
          metadata?: Json | null
          plan_template_id?: string | null
          result_summary?: string | null
          session_id?: string
          status?: string
          total_credits_estimated?: number
          total_credits_spent?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_plan_template_id_fkey"
            columns: ["plan_template_id"]
            isOneToOne: false
            referencedRelation: "agent_plan_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_actions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_intents: {
        Row: {
          confidence_threshold: number
          created_at: string
          default_plan_id: string | null
          description: string
          id: string
          intent_key: string
          is_active: boolean
          keywords: string[]
          label: string
        }
        Insert: {
          confidence_threshold?: number
          created_at?: string
          default_plan_id?: string | null
          description?: string
          id?: string
          intent_key: string
          is_active?: boolean
          keywords?: string[]
          label: string
        }
        Update: {
          confidence_threshold?: number
          created_at?: string
          default_plan_id?: string | null
          description?: string
          id?: string
          intent_key?: string
          is_active?: boolean
          keywords?: string[]
          label?: string
        }
        Relationships: []
      }
      agent_plan_templates: {
        Row: {
          created_at: string
          description: string
          estimated_credits: number
          estimated_duration_seconds: number
          failure_count: number
          id: string
          intent_key: string
          is_default: boolean
          name: string
          steps: Json
          success_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          estimated_credits?: number
          estimated_duration_seconds?: number
          failure_count?: number
          id?: string
          intent_key: string
          is_default?: boolean
          name: string
          steps?: Json
          success_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_credits?: number
          estimated_duration_seconds?: number
          failure_count?: number
          id?: string
          intent_key?: string
          is_default?: boolean
          name?: string
          steps?: Json
          success_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_steps: {
        Row: {
          action_id: string
          artifact_id: string | null
          completed_at: string | null
          created_at: string
          credits_cost: number
          duration_ms: number | null
          error_message: string | null
          id: string
          input_params: Json | null
          job_id: string | null
          label: string
          output_data: Json | null
          started_at: string | null
          status: string
          step_order: number
          tool_name: string
        }
        Insert: {
          action_id: string
          artifact_id?: string | null
          completed_at?: string | null
          created_at?: string
          credits_cost?: number
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          job_id?: string | null
          label?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          step_order?: number
          tool_name: string
        }
        Update: {
          action_id?: string
          artifact_id?: string | null
          completed_at?: string | null
          created_at?: string
          credits_cost?: number
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          job_id?: string | null
          label?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          step_order?: number
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_steps_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "agent_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tools: {
        Row: {
          avg_credits_cost: number | null
          avg_latency_ms: number | null
          category: string
          created_at: string
          description: string
          id: string
          input_schema: Json
          is_active: boolean
          name: string
          output_schema: Json | null
          requires_confirmation: boolean
          service_key: string | null
          tool_key: string
        }
        Insert: {
          avg_credits_cost?: number | null
          avg_latency_ms?: number | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          input_schema?: Json
          is_active?: boolean
          name: string
          output_schema?: Json | null
          requires_confirmation?: boolean
          service_key?: string | null
          tool_key: string
        }
        Update: {
          avg_credits_cost?: number | null
          avg_latency_ms?: number | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          input_schema?: Json
          is_active?: boolean
          name?: string
          output_schema?: Json | null
          requires_confirmation?: boolean
          service_key?: string | null
          tool_key?: string
        }
        Relationships: []
      }
      ai_twin_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          feedback_score: number | null
          id: string
          messages_count: number | null
          session_context: Json | null
          started_at: string
          twin_config_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          feedback_score?: number | null
          id?: string
          messages_count?: number | null
          session_context?: Json | null
          started_at?: string
          twin_config_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          feedback_score?: number | null
          id?: string
          messages_count?: number | null
          session_context?: Json | null
          started_at?: string
          twin_config_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_twin_sessions_twin_config_id_fkey"
            columns: ["twin_config_id"]
            isOneToOne: false
            referencedRelation: "personal_os_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      aias_agent_profiles: {
        Row: {
          agent_key: string
          artifact_model: Json | null
          avg_quality_score: number | null
          canonical_schema: Json
          certification_level: number
          certified_at: string | null
          compliance_score: number | null
          created_at: string
          display_name: string
          id: string
          input_contract: Json
          is_certified: boolean | null
          job_lifecycle: string[] | null
          last_audit_at: string | null
          output_contract: Json
          scoring_dimensions: Json | null
          service_unit_id: string | null
          status: string
          success_rate: number | null
          total_executions: number | null
          updated_at: string
        }
        Insert: {
          agent_key: string
          artifact_model?: Json | null
          avg_quality_score?: number | null
          canonical_schema?: Json
          certification_level?: number
          certified_at?: string | null
          compliance_score?: number | null
          created_at?: string
          display_name: string
          id?: string
          input_contract?: Json
          is_certified?: boolean | null
          job_lifecycle?: string[] | null
          last_audit_at?: string | null
          output_contract?: Json
          scoring_dimensions?: Json | null
          service_unit_id?: string | null
          status?: string
          success_rate?: number | null
          total_executions?: number | null
          updated_at?: string
        }
        Update: {
          agent_key?: string
          artifact_model?: Json | null
          avg_quality_score?: number | null
          canonical_schema?: Json
          certification_level?: number
          certified_at?: string | null
          compliance_score?: number | null
          created_at?: string
          display_name?: string
          id?: string
          input_contract?: Json
          is_certified?: boolean | null
          job_lifecycle?: string[] | null
          last_audit_at?: string | null
          output_contract?: Json
          scoring_dimensions?: Json | null
          service_unit_id?: string | null
          status?: string
          success_rate?: number | null
          total_executions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aias_agent_profiles_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aias_agent_profiles_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units_public"
            referencedColumns: ["id"]
          },
        ]
      }
      aias_output_contracts: {
        Row: {
          agent_profile_id: string | null
          auto_library: boolean | null
          context_schema: Json
          created_at: string
          execution_schema: Json
          export_formats: string[] | null
          id: string
          quality_gate: Json | null
          verdict_schema: Json
        }
        Insert: {
          agent_profile_id?: string | null
          auto_library?: boolean | null
          context_schema?: Json
          created_at?: string
          execution_schema?: Json
          export_formats?: string[] | null
          id?: string
          quality_gate?: Json | null
          verdict_schema?: Json
        }
        Update: {
          agent_profile_id?: string | null
          auto_library?: boolean | null
          context_schema?: Json
          created_at?: string
          execution_schema?: Json
          export_formats?: string[] | null
          id?: string
          quality_gate?: Json | null
          verdict_schema?: Json
        }
        Relationships: [
          {
            foreignKeyName: "aias_output_contracts_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "aias_agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aias_routing_metadata: {
        Row: {
          agent_profile_id: string | null
          block_reason: string | null
          blocked: boolean | null
          certification_check: boolean | null
          created_at: string
          id: string
          metadata: Json | null
          request_intent: string | null
          routing_confidence: number | null
          schema_valid: boolean | null
          score_check_passed: boolean | null
          service_unit_id: string | null
          user_id: string
        }
        Insert: {
          agent_profile_id?: string | null
          block_reason?: string | null
          blocked?: boolean | null
          certification_check?: boolean | null
          created_at?: string
          id?: string
          metadata?: Json | null
          request_intent?: string | null
          routing_confidence?: number | null
          schema_valid?: boolean | null
          score_check_passed?: boolean | null
          service_unit_id?: string | null
          user_id: string
        }
        Update: {
          agent_profile_id?: string | null
          block_reason?: string | null
          blocked?: boolean | null
          certification_check?: boolean | null
          created_at?: string
          id?: string
          metadata?: Json | null
          request_intent?: string | null
          routing_confidence?: number | null
          schema_valid?: boolean | null
          score_check_passed?: boolean | null
          service_unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aias_routing_metadata_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "aias_agent_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          execution_id: string | null
          format: string
          id: string
          is_locked: boolean | null
          job_id: string | null
          metadata: Json | null
          preview_content: string | null
          service_key: string | null
          size_bytes: number | null
          status: string
          stored_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          artifact_type?: string
          author_id: string
          content?: string
          created_at?: string
          execution_id?: string | null
          format?: string
          id?: string
          is_locked?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          preview_content?: string | null
          service_key?: string | null
          size_bytes?: number | null
          status?: string
          stored_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          artifact_type?: string
          author_id?: string
          content?: string
          created_at?: string
          execution_id?: string | null
          format?: string
          id?: string
          is_locked?: boolean | null
          job_id?: string | null
          metadata?: Json | null
          preview_content?: string | null
          service_key?: string | null
          size_bytes?: number | null
          status?: string
          stored_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "service_executions"
            referencedColumns: ["id"]
          },
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
      asset_tokens: {
        Row: {
          asset_id: string
          created_at: string | null
          creator_id: string
          id: string
          price_per_unit: number
          revenue_share_pct: number | null
          status: string | null
          total_revenue: number | null
          total_units: number
          units_sold: number | null
          updated_at: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          creator_id: string
          id?: string
          price_per_unit?: number
          revenue_share_pct?: number | null
          status?: string | null
          total_revenue?: number | null
          total_units?: number
          units_sold?: number | null
          updated_at?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          creator_id?: string
          id?: string
          price_per_unit?: number
          revenue_share_pct?: number | null
          status?: string | null
          total_revenue?: number | null
          total_units?: number
          units_sold?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_tokens_asset_id_fkey"
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
      automation_jobs: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          job_type: string
          last_run_at: string | null
          max_runs: number | null
          name: string
          next_run_at: string | null
          schedule_cron: string | null
          service_unit_id: string | null
          total_runs: number
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          job_type?: string
          last_run_at?: string | null
          max_runs?: number | null
          name: string
          next_run_at?: string | null
          schedule_cron?: string | null
          service_unit_id?: string | null
          total_runs?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          job_type?: string
          last_run_at?: string | null
          max_runs?: number | null
          name?: string
          next_run_at?: string | null
          schedule_cron?: string | null
          service_unit_id?: string | null
          total_runs?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_jobs_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units_public"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          condition: Json
          created_at: string
          description: string | null
          fire_count: number
          id: string
          is_active: boolean
          last_fired_at: string | null
          name: string
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          action_type?: string
          condition?: Json
          created_at?: string
          description?: string | null
          fire_count?: number
          id?: string
          is_active?: boolean
          last_fired_at?: string | null
          name?: string
          trigger_event?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          condition?: Json
          created_at?: string
          description?: string | null
          fire_count?: number
          id?: string
          is_active?: boolean
          last_fired_at?: string | null
          name?: string
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          artifact_ids: string[] | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_id: string
          metadata: Json | null
          neurons_spent: number
          result_summary: string | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          artifact_ids?: string[] | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id: string
          metadata?: Json | null
          neurons_spent?: number
          result_summary?: string | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          artifact_ids?: string[] | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          metadata?: Json | null
          neurons_spent?: number
          result_summary?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_triggers: {
        Row: {
          created_at: string
          fire_count: number
          id: string
          is_active: boolean
          job_id: string
          last_fired_at: string | null
          trigger_config: Json
          trigger_type: string
        }
        Insert: {
          created_at?: string
          fire_count?: number
          id?: string
          is_active?: boolean
          job_id: string
          last_fired_at?: string | null
          trigger_config?: Json
          trigger_type?: string
        }
        Update: {
          created_at?: string
          fire_count?: number
          id?: string
          is_active?: boolean
          job_id?: string
          last_fired_at?: string | null
          trigger_config?: Json
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_triggers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "automation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      axis_extraction_results: {
        Row: {
          axis: string
          confidence: number | null
          created_at: string
          extraction: Json
          id: string
          model_version: string | null
          neuron_id: number
          user_id: string
        }
        Insert: {
          axis: string
          confidence?: number | null
          created_at?: string
          extraction?: Json
          id?: string
          model_version?: string | null
          neuron_id: number
          user_id: string
        }
        Update: {
          axis?: string
          confidence?: number | null
          created_at?: string
          extraction?: Json
          id?: string
          model_version?: string | null
          neuron_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "axis_extraction_results_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "axis_extraction_results_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      blog_posts: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          inline_images: Json | null
          metadata: Json | null
          pipeline_scores: Json | null
          pipeline_stage: string | null
          published_at: string | null
          reading_time_min: number | null
          related_post_ids: string[] | null
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          inline_images?: Json | null
          metadata?: Json | null
          pipeline_scores?: Json | null
          pipeline_stage?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          related_post_ids?: string[] | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          inline_images?: Json | null
          metadata?: Json | null
          pipeline_scores?: Json | null
          pipeline_stage?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          related_post_ids?: string[] | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      blog_topics: {
        Row: {
          category: string
          created_at: string
          difficulty: string | null
          generated_post_id: string | null
          id: string
          metadata: Json | null
          priority: number | null
          search_intent: string | null
          slug: string
          status: string
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          difficulty?: string | null
          generated_post_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          search_intent?: string | null
          slug: string
          status?: string
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string | null
          generated_post_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          search_intent?: string | null
          slug?: string
          status?: string
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_topics_generated_post_id_fkey"
            columns: ["generated_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_state: {
        Row: {
          avg_job_latency_ms: number
          consumed_neurons: number
          current_multiplier: number
          id: number
          kill_switch: boolean
          kill_switch_activated_at: string | null
          kill_switch_activated_by: string | null
          kill_switch_reason: string | null
          llm_cost_per_credit: number
          margin_target: number
          monthly_capacity: number
          premium_only_mode: boolean
          queue_depth: number
          reset_at: string
          updated_at: string
          utilization: number | null
        }
        Insert: {
          avg_job_latency_ms?: number
          consumed_neurons?: number
          current_multiplier?: number
          id?: number
          kill_switch?: boolean
          kill_switch_activated_at?: string | null
          kill_switch_activated_by?: string | null
          kill_switch_reason?: string | null
          llm_cost_per_credit?: number
          margin_target?: number
          monthly_capacity?: number
          premium_only_mode?: boolean
          queue_depth?: number
          reset_at?: string
          updated_at?: string
          utilization?: number | null
        }
        Update: {
          avg_job_latency_ms?: number
          consumed_neurons?: number
          current_multiplier?: number
          id?: number
          kill_switch?: boolean
          kill_switch_activated_at?: string | null
          kill_switch_activated_by?: string | null
          kill_switch_reason?: string | null
          llm_cost_per_credit?: number
          margin_target?: number
          monthly_capacity?: number
          premium_only_mode?: boolean
          queue_depth?: number
          reset_at?: string
          updated_at?: string
          utilization?: number | null
        }
        Relationships: []
      }
      certifications: {
        Row: {
          badge_icon: string | null
          cert_key: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          level: string | null
          name: string
          requirements: Json | null
        }
        Insert: {
          badge_icon?: string | null
          cert_key: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          name: string
          requirements?: Json | null
        }
        Update: {
          badge_icon?: string | null
          cert_key?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          name?: string
          requirements?: Json | null
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
      classification_results: {
        Row: {
          classified_by: string
          created_at: string
          dimension: string
          id: string
          label: string
          model_version: string | null
          neuron_id: number
          score: number
          sub_labels: Json | null
        }
        Insert: {
          classified_by: string
          created_at?: string
          dimension: string
          id?: string
          label: string
          model_version?: string | null
          neuron_id: number
          score?: number
          sub_labels?: Json | null
        }
        Update: {
          classified_by?: string
          created_at?: string
          dimension?: string
          id?: string
          label?: string
          model_version?: string | null
          neuron_id?: number
          score?: number
          sub_labels?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "classification_results_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "classification_results_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
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
      cognitive_chain_nodes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          depth_score: number | null
          id: string
          layer: number
          layer_label: string
          neuron_id: number | null
          parent_node_id: string | null
          pattern_id: string | null
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by: string
          depth_score?: number | null
          id?: string
          layer: number
          layer_label: string
          neuron_id?: number | null
          parent_node_id?: string | null
          pattern_id?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          depth_score?: number | null
          id?: string
          layer?: number
          layer_label?: string
          neuron_id?: number | null
          parent_node_id?: string | null
          pattern_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_chain_nodes_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "cognitive_chain_nodes_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cognitive_chain_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "cognitive_chain_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cognitive_chain_nodes_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "extracted_patterns"
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
      command_decisions: {
        Row: {
          agent_sequences: Json | null
          command_type: string
          created_at: string
          executed_at: string | null
          id: string
          next_actions: Json | null
          pipeline_result: Json | null
          priority_score: number | null
          priority_tasks: Json | null
          session_id: string | null
          status: string
          system_state: Json | null
          user_goal: string
          user_id: string
          warnings: Json | null
        }
        Insert: {
          agent_sequences?: Json | null
          command_type?: string
          created_at?: string
          executed_at?: string | null
          id?: string
          next_actions?: Json | null
          pipeline_result?: Json | null
          priority_score?: number | null
          priority_tasks?: Json | null
          session_id?: string | null
          status?: string
          system_state?: Json | null
          user_goal: string
          user_id: string
          warnings?: Json | null
        }
        Update: {
          agent_sequences?: Json | null
          command_type?: string
          created_at?: string
          executed_at?: string | null
          id?: string
          next_actions?: Json | null
          pipeline_result?: Json | null
          priority_score?: number | null
          priority_tasks?: Json | null
          session_id?: string | null
          status?: string
          system_state?: Json | null
          user_goal?: string
          user_id?: string
          warnings?: Json | null
        }
        Relationships: []
      }
      command_types: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          is_active: boolean
          label: string
          type_key: string
          weight_effort: number
          weight_impact: number
          weight_revenue: number
          weight_urgency: number
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          is_active?: boolean
          label: string
          type_key: string
          weight_effort?: number
          weight_impact?: number
          weight_revenue?: number
          weight_urgency?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          is_active?: boolean
          label?: string
          type_key?: string
          weight_effort?: number
          weight_impact?: number
          weight_revenue?: number
          weight_urgency?: number
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
      consent_preferences: {
        Row: {
          ads: boolean
          analytics: boolean
          consent_version: string
          consented_at: string
          data_sharing: boolean
          id: string
          personalization: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ads?: boolean
          analytics?: boolean
          consent_version?: string
          consented_at?: string
          data_sharing?: boolean
          id?: string
          personalization?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ads?: boolean
          analytics?: boolean
          consent_version?: string
          consented_at?: string
          data_sharing?: boolean
          id?: string
          personalization?: boolean
          updated_at?: string
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
      contradiction_pairs: {
        Row: {
          ai_analysis: string | null
          created_at: string | null
          description: string
          entity_a_id: string | null
          entity_b_id: string | null
          id: string
          resolved_at: string | null
          severity: string
          status: string
          workspace_id: string | null
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string | null
          description?: string
          entity_a_id?: string | null
          entity_b_id?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          workspace_id?: string | null
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string | null
          description?: string
          entity_a_id?: string | null
          entity_b_id?: string | null
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contradiction_pairs_entity_a_id_fkey"
            columns: ["entity_a_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradiction_pairs_entity_b_id_fkey"
            columns: ["entity_b_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contradiction_pairs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      creator_rankings: {
        Row: {
          avg_asset_rating: number | null
          creator_rank: number | null
          creator_tier: string | null
          portfolio_value: number | null
          reputation_score: number | null
          total_assets_sold: number | null
          total_revenue_neurons: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_asset_rating?: number | null
          creator_rank?: number | null
          creator_tier?: string | null
          portfolio_value?: number | null
          reputation_score?: number | null
          total_assets_sold?: number | null
          total_revenue_neurons?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_asset_rating?: number | null
          creator_rank?: number | null
          creator_tier?: string | null
          portfolio_value?: number | null
          reputation_score?: number | null
          total_assets_sold?: number | null
          total_revenue_neurons?: number | null
          updated_at?: string | null
          user_id?: string
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
          service_key: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          service_key?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          job_id?: string | null
          service_key?: string | null
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
      cusnir_os_ledger: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          immutable_hash: string | null
          payload: Json
          severity: string | null
          target_id: string | null
          target_resource: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          immutable_hash?: string | null
          payload?: Json
          severity?: string | null
          target_id?: string | null
          target_resource?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          immutable_hash?: string | null
          payload?: Json
          severity?: string | null
          target_id?: string | null
          target_resource?: string | null
        }
        Relationships: []
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
      data_products: {
        Row: {
          data_snapshot: Json | null
          description: string | null
          expires_at: string | null
          generated_at: string | null
          id: string
          is_published: boolean | null
          price_neurons: number | null
          product_type: string | null
          title: string
          total_sales: number | null
        }
        Insert: {
          data_snapshot?: Json | null
          description?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_published?: boolean | null
          price_neurons?: number | null
          product_type?: string | null
          title: string
          total_sales?: number | null
        }
        Update: {
          data_snapshot?: Json | null
          description?: string | null
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          is_published?: boolean | null
          price_neurons?: number | null
          product_type?: string | null
          title?: string
          total_sales?: number | null
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
      decision_pipeline_stages: {
        Row: {
          created_at: string
          decision_id: string
          duration_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          stage_name: string
          stage_order: number
          status: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          duration_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          stage_name: string
          stage_order: number
          status?: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          duration_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          stage_name?: string
          stage_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_pipeline_stages_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "command_decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      dedup_cluster_members: {
        Row: {
          cluster_id: string
          created_at: string
          entity_id: string | null
          id: string
          neuron_id: number | null
          similarity_score: number
        }
        Insert: {
          cluster_id: string
          created_at?: string
          entity_id?: string | null
          id?: string
          neuron_id?: number | null
          similarity_score?: number
        }
        Update: {
          cluster_id?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          neuron_id?: number | null
          similarity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "dedup_cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "dedup_clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dedup_cluster_members_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dedup_cluster_members_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "dedup_cluster_members_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      dedup_clusters: {
        Row: {
          avg_similarity: number
          canonical_content: string | null
          canonical_title: string
          cluster_type: string
          created_at: string
          frequency_score: number
          id: string
          member_count: number
          refinement_level: number
          updated_at: string
        }
        Insert: {
          avg_similarity?: number
          canonical_content?: string | null
          canonical_title?: string
          cluster_type?: string
          created_at?: string
          frequency_score?: number
          id?: string
          member_count?: number
          refinement_level?: number
          updated_at?: string
        }
        Update: {
          avg_similarity?: number
          canonical_content?: string | null
          canonical_title?: string
          cluster_type?: string
          created_at?: string
          frequency_score?: number
          id?: string
          member_count?: number
          refinement_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      deliverable_contracts: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string
          exportability: string[]
          id: string
          ownership: string
          primary_assets: Json
          reuse_value: Database["public"]["Enums"]["reuse_value"]
          secondary_assets: Json
          service_unit_id: string
          storage_target: string
          updated_at: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          exportability?: string[]
          id?: string
          ownership?: string
          primary_assets?: Json
          reuse_value?: Database["public"]["Enums"]["reuse_value"]
          secondary_assets?: Json
          service_unit_id: string
          storage_target?: string
          updated_at?: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string
          exportability?: string[]
          id?: string
          ownership?: string
          primary_assets?: Json
          reuse_value?: Database["public"]["Enums"]["reuse_value"]
          secondary_assets?: Json
          service_unit_id?: string
          storage_target?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverable_contracts_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverable_contracts_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units_public"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_channels: {
        Row: {
          channel_name: string
          channel_type: string
          config: Json
          created_at: string
          id: string
          is_active: boolean
          last_used_at: string | null
          total_sends: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_name: string
          channel_type: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          total_sends?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_name?: string
          channel_type?: string
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          total_sends?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      distribution_events: {
        Row: {
          action: string
          asset_id: string | null
          channel: string
          clicks: number | null
          conversions: number | null
          created_at: string
          id: string
          metadata: Json | null
          reach_estimate: number | null
        }
        Insert: {
          action?: string
          asset_id?: string | null
          channel: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reach_estimate?: number | null
        }
        Update: {
          action?: string
          asset_id?: string | null
          channel?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reach_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "knowledge_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_sends: {
        Row: {
          artifact_id: string | null
          automation_run_id: string | null
          channel_id: string
          content_preview: string | null
          created_at: string
          delivery_metadata: Json | null
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          artifact_id?: string | null
          automation_run_id?: string | null
          channel_id: string
          content_preview?: string | null
          created_at?: string
          delivery_metadata?: Json | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          artifact_id?: string | null
          automation_run_id?: string | null
          channel_id?: string
          content_preview?: string | null
          created_at?: string
          delivery_metadata?: Json | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_sends_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_sends_automation_run_id_fkey"
            columns: ["automation_run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_sends_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "distribution_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      domination_metrics: {
        Row: {
          action_taken: string | null
          conversions: number
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metric_date: string
          quality_score: number
          revenue: number
          usage_count: number
        }
        Insert: {
          action_taken?: string | null
          conversions?: number
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metric_date?: string
          quality_score?: number
          revenue?: number
          usage_count?: number
        }
        Update: {
          action_taken?: string | null
          conversions?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metric_date?: string
          quality_score?: number
          revenue?: number
          usage_count?: number
        }
        Relationships: []
      }
      dynamic_pricing_log: {
        Row: {
          base_price: number
          created_at: string
          final_price: number
          id: string
          job_id: string | null
          multiplier: number
          queue_depth_at_time: number
          tier_discount: number
          user_id: string | null
          utilization_at_time: number
        }
        Insert: {
          base_price?: number
          created_at?: string
          final_price?: number
          id?: string
          job_id?: string | null
          multiplier?: number
          queue_depth_at_time?: number
          tier_discount?: number
          user_id?: string | null
          utilization_at_time?: number
        }
        Update: {
          base_price?: number
          created_at?: string
          final_price?: number
          id?: string
          job_id?: string | null
          multiplier?: number
          queue_depth_at_time?: number
          tier_discount?: number
          user_id?: string | null
          utilization_at_time?: number
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
      entitlements: {
        Row: {
          access_flags: Json
          computed_level: string
          created_at: string
          cusnir_os_access: boolean | null
          feature_gates: Json
          last_computed_at: string | null
          neurons_burned: number | null
          nota2_balance: number | null
          reputation_score: number | null
          tenure_months: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_flags?: Json
          computed_level?: string
          created_at?: string
          cusnir_os_access?: boolean | null
          feature_gates?: Json
          last_computed_at?: string | null
          neurons_burned?: number | null
          nota2_balance?: number | null
          reputation_score?: number | null
          tenure_months?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_flags?: Json
          computed_level?: string
          created_at?: string
          cusnir_os_access?: boolean | null
          feature_gates?: Json
          last_computed_at?: string | null
          neurons_burned?: number | null
          nota2_balance?: number | null
          reputation_score?: number | null
          tenure_months?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      entity_graph: {
        Row: {
          created_at: string | null
          id: string
          page_id: string | null
          relation_type: string | null
          source_entity: string
          strength: number | null
          target_entity: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id?: string | null
          relation_type?: string | null
          source_entity: string
          strength?: number | null
          target_entity: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string | null
          relation_type?: string | null
          source_entity?: string
          strength?: number | null
          target_entity?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_graph_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
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
          confidence: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          relation_type: string
          source_entity_id: string
          target_entity_id: string
          temporal_order: string | null
          weight: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relation_type: string
          source_entity_id: string
          target_entity_id: string
          temporal_order?: string | null
          weight?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          relation_type?: string
          source_entity_id?: string
          target_entity_id?: string
          temporal_order?: string | null
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
      execution_prompts: {
        Row: {
          created_at: string
          execution_type: string
          id: string
          internal_name: string
          linked_service_id: string | null
          linked_service_level: string | null
          prompt_text: string
          prompt_version: number
          quality_rules: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          execution_type?: string
          id?: string
          internal_name: string
          linked_service_id?: string | null
          linked_service_level?: string | null
          prompt_text: string
          prompt_version?: number
          quality_rules?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          execution_type?: string
          id?: string
          internal_name?: string
          linked_service_id?: string | null
          linked_service_level?: string | null
          prompt_text?: string
          prompt_version?: number
          quality_rules?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      extracted_patterns: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string
          description: string
          evidence: Json | null
          frequency: number | null
          id: string
          pattern_type: string
          source_neuron_ids: number[]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by: string
          description?: string
          evidence?: Json | null
          frequency?: number | null
          id?: string
          pattern_type: string
          source_neuron_ids?: number[]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string
          description?: string
          evidence?: Json | null
          frequency?: number | null
          id?: string
          pattern_type?: string
          source_neuron_ids?: number[]
          tags?: string[] | null
          title?: string
          updated_at?: string
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
      formation_frameworks: {
        Row: {
          adaptation_rules: Json | null
          assembly_rules: Json | null
          created_at: string
          framework_logic: string
          id: string
          internal_name: string
          linked_service_id: string | null
          linked_service_level: string | null
          updated_at: string
        }
        Insert: {
          adaptation_rules?: Json | null
          assembly_rules?: Json | null
          created_at?: string
          framework_logic: string
          id?: string
          internal_name: string
          linked_service_id?: string | null
          linked_service_level?: string | null
          updated_at?: string
        }
        Update: {
          adaptation_rules?: Json | null
          assembly_rules?: Json | null
          created_at?: string
          framework_logic?: string
          id?: string
          internal_name?: string
          linked_service_id?: string | null
          linked_service_level?: string | null
          updated_at?: string
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
      future_services: {
        Row: {
          availability_timeframe: string | null
          category: string
          created_at: string
          description: string
          estimated_credits: number
          id: string
          service_key: string
          status: string
          title: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          availability_timeframe?: string | null
          category?: string
          created_at?: string
          description?: string
          estimated_credits?: number
          id?: string
          service_key: string
          status?: string
          title: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          availability_timeframe?: string | null
          category?: string
          created_at?: string
          description?: string
          estimated_credits?: number
          id?: string
          service_key?: string
          status?: string
          title?: string
          updated_at?: string
          vote_count?: number
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
      identity_dimensions: {
        Row: {
          confidence: number | null
          created_at: string
          dimension_key: string
          dimension_label: string
          extraction: Json
          id: string
          model_version: string | null
          source_neuron_ids: number[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          dimension_key: string
          dimension_label: string
          extraction?: Json
          id?: string
          model_version?: string | null
          source_neuron_ids?: number[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          dimension_key?: string
          dimension_label?: string
          extraction?: Json
          id?: string
          model_version?: string | null
          source_neuron_ids?: number[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      incoming_webhooks: {
        Row: {
          accepted_content_types: string[]
          auto_extract: boolean
          calls_count: number
          created_at: string
          id: string
          is_active: boolean
          last_called_at: string | null
          name: string
          target_workspace_id: string | null
          user_id: string
          webhook_key: string
        }
        Insert: {
          accepted_content_types?: string[]
          auto_extract?: boolean
          calls_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_called_at?: string | null
          name?: string
          target_workspace_id?: string | null
          user_id: string
          webhook_key?: string
        }
        Update: {
          accepted_content_types?: string[]
          auto_extract?: boolean
          calls_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          last_called_at?: string | null
          name?: string
          target_workspace_id?: string | null
          user_id?: string
          webhook_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "incoming_webhooks_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      integration_connectors: {
        Row: {
          auth_type: string
          config_schema: Json | null
          created_at: string
          description: string
          display_name: string
          icon: string
          id: string
          is_active: boolean
          provider: string
          rate_limit_per_hour: number
          sync_mode: string
        }
        Insert: {
          auth_type?: string
          config_schema?: Json | null
          created_at?: string
          description?: string
          display_name: string
          icon?: string
          id?: string
          is_active?: boolean
          provider: string
          rate_limit_per_hour?: number
          sync_mode?: string
        }
        Update: {
          auth_type?: string
          config_schema?: Json | null
          created_at?: string
          description?: string
          display_name?: string
          icon?: string
          id?: string
          is_active?: boolean
          provider?: string
          rate_limit_per_hour?: number
          sync_mode?: string
        }
        Relationships: []
      }
      intel_persons: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          entity_type: string
          external_ref: string | null
          id: string
          metadata: Json | null
          name: string
          normalized_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          entity_type?: string
          external_ref?: string | null
          id?: string
          metadata?: Json | null
          name: string
          normalized_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          entity_type?: string
          external_ref?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          normalized_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intel_statements: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          id: string
          intensity_score: number | null
          job_id: string | null
          person_id: string | null
          position_end: number | null
          position_start: number | null
          source_weight: number | null
          transcript_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          id?: string
          intensity_score?: number | null
          job_id?: string | null
          person_id?: string | null
          position_end?: number | null
          position_start?: number | null
          source_weight?: number | null
          transcript_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          id?: string
          intensity_score?: number | null
          job_id?: string | null
          person_id?: string | null
          position_end?: number | null
          position_start?: number | null
          source_weight?: number | null
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intel_statements_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intel_statements_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "intel_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      intel_transcripts: {
        Row: {
          content: string
          created_at: string
          episode_id: string | null
          id: string
          job_id: string | null
          language: string | null
          person_id: string | null
          source_type: string
          word_count: number
        }
        Insert: {
          content?: string
          created_at?: string
          episode_id?: string | null
          id?: string
          job_id?: string | null
          language?: string | null
          person_id?: string | null
          source_type?: string
          word_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          episode_id?: string | null
          id?: string
          job_id?: string | null
          language?: string | null
          person_id?: string | null
          source_type?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "intel_transcripts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_profile_consent: {
        Row: {
          consent_status: string
          created_at: string
          doc_ref: string | null
          granted_at: string | null
          id: string
          profile_id: string
          revoked_at: string | null
          user_id: string | null
        }
        Insert: {
          consent_status: string
          created_at?: string
          doc_ref?: string | null
          granted_at?: string | null
          id?: string
          profile_id: string
          revoked_at?: string | null
          user_id?: string | null
        }
        Update: {
          consent_status?: string
          created_at?: string
          doc_ref?: string | null
          granted_at?: string | null
          id?: string
          profile_id?: string
          revoked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_profile_consent_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_profile_public: {
        Row: {
          created_at: string
          id: string
          json_ld: Json | null
          meta_description: string | null
          meta_title: string | null
          profile_id: string
          public_indicators: Json
          public_patterns: Json
          public_summary: string | null
          published_at: string | null
          seo_queries: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          json_ld?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          profile_id: string
          public_indicators?: Json
          public_patterns?: Json
          public_summary?: string | null
          published_at?: string | null
          seo_queries?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          json_ld?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          profile_id?: string
          public_indicators?: Json
          public_patterns?: Json
          public_summary?: string | null
          published_at?: string | null
          seo_queries?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_profile_public_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_profile_state_transitions: {
        Row: {
          decided_at: string
          decided_by: string | null
          from_status:
            | Database["public"]["Enums"]["profile_visibility_status"]
            | null
          guardrail_results: Json | null
          id: string
          profile_id: string
          reason_code: string | null
          to_status: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Insert: {
          decided_at?: string
          decided_by?: string | null
          from_status?:
            | Database["public"]["Enums"]["profile_visibility_status"]
            | null
          guardrail_results?: Json | null
          id?: string
          profile_id: string
          reason_code?: string | null
          to_status: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Update: {
          decided_at?: string
          decided_by?: string | null
          from_status?:
            | Database["public"]["Enums"]["profile_visibility_status"]
            | null
          guardrail_results?: Json | null
          id?: string
          profile_id?: string
          reason_code?: string | null
          to_status?: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_profile_state_transitions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_profiles: {
        Row: {
          cognitive_patterns: Json
          consent_required: boolean
          created_at: string
          created_by: string | null
          extracted_indicators: Json
          id: string
          person_name: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          public_slug: string
          risk_flag: Database["public"]["Enums"]["profile_risk_flag"]
          same_as_urls: string[] | null
          source_date: string | null
          source_duration_minutes: number | null
          source_ref: string
          source_type: Database["public"]["Enums"]["profile_source_type"]
          synthesis_text: string
          transcript_ref: string | null
          updated_at: string
          version: number
          visibility_status: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Insert: {
          cognitive_patterns?: Json
          consent_required?: boolean
          created_at?: string
          created_by?: string | null
          extracted_indicators?: Json
          id?: string
          person_name?: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          public_slug: string
          risk_flag?: Database["public"]["Enums"]["profile_risk_flag"]
          same_as_urls?: string[] | null
          source_date?: string | null
          source_duration_minutes?: number | null
          source_ref: string
          source_type: Database["public"]["Enums"]["profile_source_type"]
          synthesis_text?: string
          transcript_ref?: string | null
          updated_at?: string
          version?: number
          visibility_status?: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Update: {
          cognitive_patterns?: Json
          consent_required?: boolean
          created_at?: string
          created_by?: string | null
          extracted_indicators?: Json
          id?: string
          person_name?: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          public_slug?: string
          risk_flag?: Database["public"]["Enums"]["profile_risk_flag"]
          same_as_urls?: string[] | null
          source_date?: string | null
          source_duration_minutes?: number | null
          source_ref?: string
          source_type?: Database["public"]["Enums"]["profile_source_type"]
          synthesis_text?: string
          transcript_ref?: string | null
          updated_at?: string
          version?: number
          visibility_status?: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Relationships: []
      }
      intelligence_reports: {
        Row: {
          author_id: string
          cost_neurons: number | null
          created_at: string | null
          full_report: string | null
          id: string
          input_summary: string | null
          job_id: string | null
          positioning: Json | null
          report_type: string | null
          strategies: Json | null
          title: string
          weaknesses: Json | null
        }
        Insert: {
          author_id: string
          cost_neurons?: number | null
          created_at?: string | null
          full_report?: string | null
          id?: string
          input_summary?: string | null
          job_id?: string | null
          positioning?: Json | null
          report_type?: string | null
          strategies?: Json | null
          title: string
          weaknesses?: Json | null
        }
        Update: {
          author_id?: string
          cost_neurons?: number | null
          created_at?: string | null
          full_report?: string | null
          id?: string
          input_summary?: string | null
          job_id?: string | null
          positioning?: Json | null
          report_type?: string | null
          strategies?: Json | null
          title?: string
          weaknesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "neuron_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      intent_map: {
        Row: {
          created_at: string
          description: string
          description_ro: string
          domain_filter: string[]
          intent_key: string
          is_active: boolean
          label: string
          label_ro: string
          min_tier: string
          required_roles: string[]
        }
        Insert: {
          created_at?: string
          description?: string
          description_ro?: string
          domain_filter?: string[]
          intent_key: string
          is_active?: boolean
          label: string
          label_ro?: string
          min_tier?: string
          required_roles?: string[]
        }
        Update: {
          created_at?: string
          description?: string
          description_ro?: string
          domain_filter?: string[]
          intent_key?: string
          is_active?: boolean
          label?: string
          label_ro?: string
          min_tier?: string
          required_roles?: string[]
        }
        Relationships: []
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
      kill_switch_log: {
        Row: {
          action: string
          activated_by: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          action?: string
          activated_by: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          activated_by?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      knowledge_assets: {
        Row: {
          artifact_ids: string[] | null
          asset_type: string
          author_id: string
          commercialization_status: string
          conflict_details: Json | null
          conflict_score: number | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          license_type: string
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
          commercialization_status?: string
          conflict_details?: Json | null
          conflict_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          license_type?: string
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
          commercialization_status?: string
          conflict_details?: Json | null
          conflict_score?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          license_type?: string
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
      knowledge_gaps: {
        Row: {
          confidence: number | null
          created_at: string | null
          description: string
          gap_type: string
          id: string
          resolved_at: string | null
          status: string
          suggested_sources: string[] | null
          topic: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          description?: string
          gap_type?: string
          id?: string
          resolved_at?: string | null
          status?: string
          suggested_sources?: string[] | null
          topic: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          description?: string
          gap_type?: string
          id?: string
          resolved_at?: string | null
          status?: string
          suggested_sources?: string[] | null
          topic?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_gaps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_cache: {
        Row: {
          cache_key: string
          entity_count: number | null
          expires_at: string | null
          generated_at: string | null
          graph_data: Json
          id: string
        }
        Insert: {
          cache_key?: string
          entity_count?: number | null
          expires_at?: string | null
          generated_at?: string | null
          graph_data?: Json
          id?: string
        }
        Update: {
          cache_key?: string
          entity_count?: number | null
          expires_at?: string | null
          generated_at?: string | null
          graph_data?: Json
          id?: string
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
      knowledge_surface_pages: {
        Row: {
          content_md: string | null
          created_at: string
          entity_ids: string[] | null
          id: string
          llm_citation_count: number | null
          meta_description: string | null
          neuron_ids: number[] | null
          page_type: string
          published_at: string | null
          quality_score: number | null
          schema_json: Json | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          content_md?: string | null
          created_at?: string
          entity_ids?: string[] | null
          id?: string
          llm_citation_count?: number | null
          meta_description?: string | null
          neuron_ids?: number[] | null
          page_type?: string
          published_at?: string | null
          quality_score?: number | null
          schema_json?: Json | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          content_md?: string | null
          created_at?: string
          entity_ids?: string[] | null
          id?: string
          llm_citation_count?: number | null
          meta_description?: string | null
          neuron_ids?: number[] | null
          page_type?: string
          published_at?: string | null
          quality_score?: number | null
          schema_json?: Json | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
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
          difficulty: string
          estimated_minutes: number
          id: string
          is_active: boolean
          slug: string
          steps: Json
          title: string
          updated_at: string
        }
        Insert: {
          category_order?: string[]
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          estimated_minutes?: number
          id?: string
          is_active?: boolean
          slug: string
          steps?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category_order?: string[]
          created_at?: string
          created_by?: string | null
          description?: string
          difficulty?: string
          estimated_minutes?: number
          id?: string
          is_active?: boolean
          slug?: string
          steps?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      llm_citations: {
        Row: {
          citation_text: string | null
          citation_url: string | null
          confidence: number | null
          detected_at: string | null
          id: string
          query_context: string | null
          referenced_page_id: string | null
          source_platform: string
        }
        Insert: {
          citation_text?: string | null
          citation_url?: string | null
          confidence?: number | null
          detected_at?: string | null
          id?: string
          query_context?: string | null
          referenced_page_id?: string | null
          source_platform: string
        }
        Update: {
          citation_text?: string | null
          citation_url?: string | null
          confidence?: number | null
          detected_at?: string | null
          id?: string
          query_context?: string | null
          referenced_page_id?: string | null
          source_platform?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_citations_referenced_page_id_fkey"
            columns: ["referenced_page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_crawl_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          page_path: string
          priority: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          page_path: string
          priority?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          page_path?: string
          priority?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      llm_entities: {
        Row: {
          confidence: number | null
          created_at: string
          description: string | null
          entity_name: string
          entity_type: string
          id: string
          page_id: string
          schema_org_type: string | null
          source_context: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          entity_name: string
          entity_type?: string
          id?: string
          page_id: string
          schema_org_type?: string | null
          source_context?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string | null
          entity_name?: string
          entity_type?: string
          id?: string
          page_id?: string
          schema_org_type?: string | null
          source_context?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_entities_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "llm_page_index"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_fix_suggestions: {
        Row: {
          ai_reasoning: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          current_value: string | null
          id: string
          issue_type: string
          page_id: string | null
          severity: string | null
          status: string | null
          suggested_value: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          current_value?: string | null
          id?: string
          issue_type: string
          page_id?: string | null
          severity?: string | null
          status?: string | null
          suggested_value?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          current_value?: string | null
          id?: string
          issue_type?: string
          page_id?: string | null
          severity?: string | null
          status?: string | null
          suggested_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_fix_suggestions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "llm_page_index"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_issues: {
        Row: {
          auto_fix_available: boolean | null
          description: string | null
          detected_at: string | null
          fix_applied: boolean | null
          id: string
          issue_type: string
          page_id: string | null
          resolved_at: string | null
          severity: string | null
          suggested_fix: string | null
        }
        Insert: {
          auto_fix_available?: boolean | null
          description?: string | null
          detected_at?: string | null
          fix_applied?: boolean | null
          id?: string
          issue_type: string
          page_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          suggested_fix?: string | null
        }
        Update: {
          auto_fix_available?: boolean | null
          description?: string | null
          detected_at?: string | null
          fix_applied?: boolean | null
          id?: string
          issue_type?: string
          page_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          suggested_fix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_issues_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_page_index: {
        Row: {
          created_at: string | null
          entity_count: number | null
          entity_density_score: number | null
          external_links_count: number | null
          id: string
          internal_links_count: number | null
          issues: Json | null
          last_crawled_at: string | null
          last_fixed_at: string | null
          overall_score: number | null
          page_path: string
          page_title: string | null
          page_type: string | null
          schema_types: string[] | null
          semantic_links_score: number | null
          topic_clarity_score: number | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          created_at?: string | null
          entity_count?: number | null
          entity_density_score?: number | null
          external_links_count?: number | null
          id?: string
          internal_links_count?: number | null
          issues?: Json | null
          last_crawled_at?: string | null
          last_fixed_at?: string | null
          overall_score?: number | null
          page_path: string
          page_title?: string | null
          page_type?: string | null
          schema_types?: string[] | null
          semantic_links_score?: number | null
          topic_clarity_score?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          created_at?: string | null
          entity_count?: number | null
          entity_density_score?: number | null
          external_links_count?: number | null
          id?: string
          internal_links_count?: number | null
          issues?: Json | null
          last_crawled_at?: string | null
          last_fixed_at?: string | null
          overall_score?: number | null
          page_path?: string
          page_title?: string | null
          page_type?: string | null
          schema_types?: string[] | null
          semantic_links_score?: number | null
          topic_clarity_score?: number | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      llm_referrer_log: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          page_path: string
          referrer_source: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          page_path: string
          referrer_source: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          page_path?: string
          referrer_source?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      llm_scores: {
        Row: {
          citation_probability: number | null
          computed_at: string | null
          embedding_quality: number | null
          entity_density: number | null
          id: string
          internal_link_score: number | null
          llm_visibility_score: number | null
          page_id: string | null
          schema_coverage: number | null
        }
        Insert: {
          citation_probability?: number | null
          computed_at?: string | null
          embedding_quality?: number | null
          entity_density?: number | null
          id?: string
          internal_link_score?: number | null
          llm_visibility_score?: number | null
          page_id?: string | null
          schema_coverage?: number | null
        }
        Update: {
          citation_probability?: number | null
          computed_at?: string | null
          embedding_quality?: number | null
          entity_density?: number | null
          id?: string
          internal_link_score?: number | null
          llm_visibility_score?: number | null
          page_id?: string | null
          schema_coverage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_scores_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_visibility_scores: {
        Row: {
          citation_count: number | null
          content_depth_score: number | null
          created_at: string
          entity_coverage_score: number | null
          id: string
          page_id: string | null
          referral_count: number | null
          schema_score: number | null
          score_date: string
          surface_page_id: string | null
          visibility_score: number | null
        }
        Insert: {
          citation_count?: number | null
          content_depth_score?: number | null
          created_at?: string
          entity_coverage_score?: number | null
          id?: string
          page_id?: string | null
          referral_count?: number | null
          schema_score?: number | null
          score_date?: string
          surface_page_id?: string | null
          visibility_score?: number | null
        }
        Update: {
          citation_count?: number | null
          content_depth_score?: number | null
          created_at?: string
          entity_coverage_score?: number | null
          id?: string
          page_id?: string | null
          referral_count?: number | null
          schema_score?: number | null
          score_date?: string
          surface_page_id?: string | null
          visibility_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_visibility_scores_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "llm_page_index"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_visibility_scores_surface_page_id_fkey"
            columns: ["surface_page_id"]
            isOneToOne: false
            referencedRelation: "knowledge_surface_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          email: string
          failure_reason: string | null
          id: string
          ip_hint: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          email: string
          failure_reason?: string | null
          id?: string
          ip_hint?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          failure_reason?: string | null
          id?: string
          ip_hint?: string | null
          success?: boolean
        }
        Relationships: []
      }
      mms_edges: {
        Row: {
          created_at: string
          edge_type: string
          from_node: string
          id: string
          metadata: Json | null
          mms_id: string
          to_node: string
        }
        Insert: {
          created_at?: string
          edge_type?: string
          from_node: string
          id?: string
          metadata?: Json | null
          mms_id: string
          to_node: string
        }
        Update: {
          created_at?: string
          edge_type?: string
          from_node?: string
          id?: string
          metadata?: Json | null
          mms_id?: string
          to_node?: string
        }
        Relationships: [
          {
            foreignKeyName: "mms_edges_from_node_fkey"
            columns: ["from_node"]
            isOneToOne: false
            referencedRelation: "mms_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mms_edges_mms_id_fkey"
            columns: ["mms_id"]
            isOneToOne: false
            referencedRelation: "os_mms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mms_edges_to_node_fkey"
            columns: ["to_node"]
            isOneToOne: false
            referencedRelation: "mms_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mms_nodes: {
        Row: {
          config: Json | null
          created_at: string
          depends_on: string[] | null
          id: string
          label: string
          mms_id: string
          otos_id: string | null
          role: string
          service_unit_id: string | null
          step_order: number
        }
        Insert: {
          config?: Json | null
          created_at?: string
          depends_on?: string[] | null
          id?: string
          label?: string
          mms_id: string
          otos_id?: string | null
          role?: string
          service_unit_id?: string | null
          step_order?: number
        }
        Update: {
          config?: Json | null
          created_at?: string
          depends_on?: string[] | null
          id?: string
          label?: string
          mms_id?: string
          otos_id?: string | null
          role?: string
          service_unit_id?: string | null
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "mms_nodes_mms_id_fkey"
            columns: ["mms_id"]
            isOneToOne: false
            referencedRelation: "os_mms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mms_nodes_otos_id_fkey"
            columns: ["otos_id"]
            isOneToOne: false
            referencedRelation: "os_otos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mms_nodes_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mms_nodes_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units_public"
            referencedColumns: ["id"]
          },
        ]
      }
      mpi_scores: {
        Row: {
          applicability_score: number
          clarity_score: number
          computed_at: string
          differentiation_score: number
          entity_id: string | null
          id: string
          mpi_score: number
          neuron_id: number | null
          rarity_score: number
          recurrence_score: number
        }
        Insert: {
          applicability_score?: number
          clarity_score?: number
          computed_at?: string
          differentiation_score?: number
          entity_id?: string | null
          id?: string
          mpi_score?: number
          neuron_id?: number | null
          rarity_score?: number
          recurrence_score?: number
        }
        Update: {
          applicability_score?: number
          clarity_score?: number
          computed_at?: string
          differentiation_score?: number
          entity_id?: string | null
          id?: string
          mpi_score?: number
          neuron_id?: number | null
          rarity_score?: number
          recurrence_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "mpi_scores_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpi_scores_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "mpi_scores_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
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
          cancel_reason: string | null
          completed_at: string | null
          created_at: string
          current_step: string | null
          dead_letter: boolean
          error_message: string | null
          estimated_remaining_seconds: number | null
          id: string
          input: Json | null
          max_retries: number
          neuron_id: number
          priority: number
          progress: number
          queue_position: number | null
          result: Json | null
          retry_count: number
          scheduled_at: string | null
          status: string
          total_steps: number
          worker_type: string
          workspace_id: string | null
        }
        Insert: {
          author_id?: string | null
          block_id?: string | null
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          dead_letter?: boolean
          error_message?: string | null
          estimated_remaining_seconds?: number | null
          id?: string
          input?: Json | null
          max_retries?: number
          neuron_id: number
          priority?: number
          progress?: number
          queue_position?: number | null
          result?: Json | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          total_steps?: number
          worker_type: string
          workspace_id?: string | null
        }
        Update: {
          author_id?: string | null
          block_id?: string | null
          cancel_reason?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          dead_letter?: boolean
          error_message?: string | null
          estimated_remaining_seconds?: number | null
          id?: string
          input?: Json | null
          max_retries?: number
          neuron_id?: number
          priority?: number
          progress?: number
          queue_position?: number | null
          result?: Json | null
          retry_count?: number
          scheduled_at?: string | null
          status?: string
          total_steps?: number
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
      notebook_artifacts: {
        Row: {
          artifact_type: string
          content: string | null
          created_at: string
          id: string
          metadata: Json | null
          notebook_id: string
          title: string
        }
        Insert: {
          artifact_type?: string
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notebook_id: string
          title?: string
        }
        Update: {
          artifact_type?: string
          content?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          notebook_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_artifacts_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_chat_sessions: {
        Row: {
          created_at: string
          id: string
          notebook_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notebook_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notebook_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_chat_sessions_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          notebook_id: string
          role: string
          session_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notebook_id: string
          role?: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notebook_id?: string
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notebook_messages_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notebook_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "notebook_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_sources: {
        Row: {
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          is_selected: boolean
          metadata: Json | null
          notebook_id: string
          source_type: string
          summary: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_selected?: boolean
          metadata?: Json | null
          notebook_id: string
          source_type?: string
          summary?: string | null
          title?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          is_selected?: boolean
          metadata?: Json | null
          notebook_id?: string
          source_type?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebook_sources_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_id: string
          source_count: number
          title: string
          updated_at: string
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          source_count?: number
          title?: string
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          source_count?: number
          title?: string
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notebooks_workspace_id_fkey"
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
      onboarding_progress: {
        Row: {
          checklist_completed: boolean
          checklist_dismissed: boolean
          completed_at: string | null
          completion_bonus_received: boolean
          created_at: string
          email_verified: boolean
          first_service_executed: boolean
          profile_completed: boolean
          tos_accepted_at: string | null
          tutorial_completed: boolean
          tutorial_modules_completed: Json
          tutorial_skipped: boolean
          tutorial_started: boolean
          user_id: string
          welcome_bonus_received: boolean
          welcome_seen: boolean
        }
        Insert: {
          checklist_completed?: boolean
          checklist_dismissed?: boolean
          completed_at?: string | null
          completion_bonus_received?: boolean
          created_at?: string
          email_verified?: boolean
          first_service_executed?: boolean
          profile_completed?: boolean
          tos_accepted_at?: string | null
          tutorial_completed?: boolean
          tutorial_modules_completed?: Json
          tutorial_skipped?: boolean
          tutorial_started?: boolean
          user_id: string
          welcome_bonus_received?: boolean
          welcome_seen?: boolean
        }
        Update: {
          checklist_completed?: boolean
          checklist_dismissed?: boolean
          completed_at?: string | null
          completion_bonus_received?: boolean
          created_at?: string
          email_verified?: boolean
          first_service_executed?: boolean
          profile_completed?: boolean
          tos_accepted_at?: string | null
          tutorial_completed?: boolean
          tutorial_modules_completed?: Json
          tutorial_skipped?: boolean
          tutorial_started?: boolean
          user_id?: string
          welcome_bonus_received?: boolean
          welcome_seen?: boolean
        }
        Relationships: []
      }
      os_agents: {
        Row: {
          agent_type: string
          assigned_to: string | null
          capabilities: string[] | null
          created_at: string
          id: string
          last_active_at: string | null
          metadata: Json | null
          performance_score: number | null
          role: string
          status: string
        }
        Insert: {
          agent_type?: string
          assigned_to?: string | null
          capabilities?: string[] | null
          created_at?: string
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          performance_score?: number | null
          role: string
          status?: string
        }
        Update: {
          agent_type?: string
          assigned_to?: string | null
          capabilities?: string[] | null
          created_at?: string
          id?: string
          last_active_at?: string | null
          metadata?: Json | null
          performance_score?: number | null
          role?: string
          status?: string
        }
        Relationships: []
      }
      os_executions: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          created_at: string
          credits_cost: number | null
          duration_ms: number | null
          id: string
          input: Json | null
          lcss_id: string | null
          mms_id: string | null
          otos_id: string | null
          output: Json | null
          performance: Json | null
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          credits_cost?: number | null
          duration_ms?: number | null
          id?: string
          input?: Json | null
          lcss_id?: string | null
          mms_id?: string | null
          otos_id?: string | null
          output?: Json | null
          performance?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          credits_cost?: number | null
          duration_ms?: number | null
          id?: string
          input?: Json | null
          lcss_id?: string | null
          mms_id?: string | null
          otos_id?: string | null
          output?: Json | null
          performance?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "os_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_executions_lcss_id_fkey"
            columns: ["lcss_id"]
            isOneToOne: false
            referencedRelation: "os_lcss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_executions_mms_id_fkey"
            columns: ["mms_id"]
            isOneToOne: false
            referencedRelation: "os_mms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_executions_otos_id_fkey"
            columns: ["otos_id"]
            isOneToOne: false
            referencedRelation: "os_otos"
            referencedColumns: ["id"]
          },
        ]
      }
      os_lcss: {
        Row: {
          created_at: string
          description: string | null
          id: string
          macro_intent: string
          metadata: Json | null
          mms_ids: string[] | null
          name: string
          owner_id: string | null
          status: string
          strategic_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          macro_intent?: string
          metadata?: Json | null
          mms_ids?: string[] | null
          name: string
          owner_id?: string | null
          status?: string
          strategic_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          macro_intent?: string
          metadata?: Json | null
          mms_ids?: string[] | null
          name?: string
          owner_id?: string | null
          status?: string
          strategic_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      os_memory_patterns: {
        Row: {
          category: string
          created_at: string
          effectiveness_score: number | null
          frequency: number
          id: string
          last_used_at: string | null
          pattern_data: Json
          pattern_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          effectiveness_score?: number | null
          frequency?: number
          id?: string
          last_used_at?: string | null
          pattern_data?: Json
          pattern_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          effectiveness_score?: number | null
          frequency?: number
          id?: string
          last_used_at?: string | null
          pattern_data?: Json
          pattern_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      os_mms: {
        Row: {
          bundle_discount_pct: number | null
          bundle_price_neurons: number | null
          complexity_level: number
          created_at: string
          description: string | null
          id: string
          intent: string
          is_featured: boolean | null
          metadata: Json | null
          name: string
          otos_ids: string[] | null
          owner_id: string | null
          score_c: number | null
          score_p: number | null
          score_s: number | null
          score_total: number | null
          status: string
          updated_at: string
        }
        Insert: {
          bundle_discount_pct?: number | null
          bundle_price_neurons?: number | null
          complexity_level?: number
          created_at?: string
          description?: string | null
          id?: string
          intent?: string
          is_featured?: boolean | null
          metadata?: Json | null
          name: string
          otos_ids?: string[] | null
          owner_id?: string | null
          score_c?: number | null
          score_p?: number | null
          score_s?: number | null
          score_total?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          bundle_discount_pct?: number | null
          bundle_price_neurons?: number | null
          complexity_level?: number
          created_at?: string
          description?: string | null
          id?: string
          intent?: string
          is_featured?: boolean | null
          metadata?: Json | null
          name?: string
          otos_ids?: string[] | null
          owner_id?: string | null
          score_c?: number | null
          score_p?: number | null
          score_s?: number | null
          score_total?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      os_modules: {
        Row: {
          avg_latency_ms: number | null
          created_at: string
          description: string | null
          error_rate: number | null
          health_status: string
          id: string
          last_health_check: string | null
          module_key: string
          module_name: string
          module_type: string
          owner: string
          risk_level: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          avg_latency_ms?: number | null
          created_at?: string
          description?: string | null
          error_rate?: number | null
          health_status?: string
          id?: string
          last_health_check?: string | null
          module_key: string
          module_name: string
          module_type?: string
          owner?: string
          risk_level?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          avg_latency_ms?: number | null
          created_at?: string
          description?: string | null
          error_rate?: number | null
          health_status?: string
          id?: string
          last_health_check?: string | null
          module_key?: string
          module_name?: string
          module_type?: string
          owner?: string
          risk_level?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      os_otos: {
        Row: {
          complexity: string | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          impact_band: string | null
          index_code: string | null
          intent: string | null
          mechanism: string
          metadata: Json | null
          name: string
          neurons_cost: number | null
          output_type: string
          owner_id: string | null
          score_complexity: number | null
          score_conversion_power: number | null
          score_frequency: number | null
          score_leverage: number | null
          score_perceived_value: number | null
          score_tier: string | null
          score_total: number | null
          status: string
          updated_at: string
        }
        Insert: {
          complexity?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          impact_band?: string | null
          index_code?: string | null
          intent?: string | null
          mechanism?: string
          metadata?: Json | null
          name: string
          neurons_cost?: number | null
          output_type?: string
          owner_id?: string | null
          score_complexity?: number | null
          score_conversion_power?: number | null
          score_frequency?: number | null
          score_leverage?: number | null
          score_perceived_value?: number | null
          score_tier?: string | null
          score_total?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          complexity?: string | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          impact_band?: string | null
          index_code?: string | null
          intent?: string | null
          mechanism?: string
          metadata?: Json | null
          name?: string
          neurons_cost?: number | null
          output_type?: string
          owner_id?: string | null
          score_complexity?: number | null
          score_conversion_power?: number | null
          score_frequency?: number | null
          score_leverage?: number | null
          score_perceived_value?: number | null
          score_tier?: string | null
          score_total?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      os_power_unlocks: {
        Row: {
          capability_key: string
          capability_name: string
          id: string
          metadata: Json | null
          tier: string
          unlocked_at: string
          user_id: string
          xp_cost: number
        }
        Insert: {
          capability_key: string
          capability_name: string
          id?: string
          metadata?: Json | null
          tier?: string
          unlocked_at?: string
          user_id: string
          xp_cost?: number
        }
        Update: {
          capability_key?: string
          capability_name?: string
          id?: string
          metadata?: Json | null
          tier?: string
          unlocked_at?: string
          user_id?: string
          xp_cost?: number
        }
        Relationships: []
      }
      parsed_content: {
        Row: {
          content: string
          created_at: string | null
          heading: string | null
          id: string
          page_id: string
          position: number | null
          section_type: string | null
          word_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          heading?: string | null
          id?: string
          page_id: string
          position?: number | null
          section_type?: string | null
          word_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          heading?: string | null
          id?: string
          page_id?: string
          position?: number | null
          section_type?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parsed_content_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_listings: {
        Row: {
          asset_id: string | null
          conversion_rate: number | null
          created_at: string | null
          creator_id: string
          id: string
          performance_type: string | null
          price_neurons: number | null
          proof_data: Json | null
          revenue_generated: number | null
          status: string | null
          title: string
          total_sales: number | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          asset_id?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          creator_id: string
          id?: string
          performance_type?: string | null
          price_neurons?: number | null
          proof_data?: Json | null
          revenue_generated?: number | null
          status?: string | null
          title: string
          total_sales?: number | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          asset_id?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          creator_id?: string
          id?: string
          performance_type?: string | null
          price_neurons?: number | null
          proof_data?: Json | null
          revenue_generated?: number | null
          status?: string | null
          title?: string
          total_sales?: number | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_listings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "knowledge_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      person_dimension_scores: {
        Row: {
          dimension_id: string
          last_updated: string
          person_id: string
          score: number
        }
        Insert: {
          dimension_id: string
          last_updated?: string
          person_id: string
          score?: number
        }
        Update: {
          dimension_id?: string
          last_updated?: string
          person_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "person_dimension_scores_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "personality_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_dimension_scores_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      person_profiles: {
        Row: {
          communication_style: Json | null
          confidence_score: number | null
          created_at: string
          id: string
          job_id: string | null
          person_id: string | null
          profile_version: string
          risks: Json | null
          strategic_profile: Json | null
          strengths: Json | null
          summary: string | null
        }
        Insert: {
          communication_style?: Json | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          job_id?: string | null
          person_id?: string | null
          profile_version?: string
          risks?: Json | null
          strategic_profile?: Json | null
          strengths?: Json | null
          summary?: string | null
        }
        Update: {
          communication_style?: Json | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          job_id?: string | null
          person_id?: string | null
          profile_version?: string
          risks?: Json | null
          strategic_profile?: Json | null
          strengths?: Json | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      person_snapshots: {
        Row: {
          confidence_score: number | null
          created_at: string
          dimension_distribution: Json | null
          id: string
          person_id: string | null
          snapshot_date: string
          trait_distribution: Json | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          dimension_distribution?: Json | null
          id?: string
          person_id?: string | null
          snapshot_date?: string
          trait_distribution?: Json | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          dimension_distribution?: Json | null
          id?: string
          person_id?: string | null
          snapshot_date?: string
          trait_distribution?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "person_snapshots_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
        ]
      }
      person_traits: {
        Row: {
          last_updated: string
          person_id: string
          score: number
          signal_count: number
          trait_id: string
        }
        Insert: {
          last_updated?: string
          person_id: string
          score?: number
          signal_count?: number
          trait_id: string
        }
        Update: {
          last_updated?: string
          person_id?: string
          score?: number
          signal_count?: number
          trait_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_traits_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_traits_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "trait_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_os_configs: {
        Row: {
          adaptation_layer: Json | null
          created_at: string
          execution_layer: Json | null
          id: string
          identity_layer: Json | null
          is_active: boolean | null
          knowledge_layer: Json | null
          monetization_layer: Json | null
          os_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adaptation_layer?: Json | null
          created_at?: string
          execution_layer?: Json | null
          id?: string
          identity_layer?: Json | null
          is_active?: boolean | null
          knowledge_layer?: Json | null
          monetization_layer?: Json | null
          os_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adaptation_layer?: Json | null
          created_at?: string
          execution_layer?: Json | null
          id?: string
          identity_layer?: Json | null
          is_active?: boolean | null
          knowledge_layer?: Json | null
          monetization_layer?: Json | null
          os_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_os_layers: {
        Row: {
          completeness_pct: number | null
          created_at: string
          gap_details: Json | null
          id: string
          layer_data: Json
          layer_key: string
          layer_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completeness_pct?: number | null
          created_at?: string
          gap_details?: Json | null
          id?: string
          layer_data?: Json
          layer_key: string
          layer_label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completeness_pct?: number | null
          created_at?: string
          gap_details?: Json | null
          id?: string
          layer_data?: Json
          layer_key?: string
          layer_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personality_dimensions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pipeline_phase_log: {
        Row: {
          action_type: string | null
          created_at: string
          from_phase: string
          id: string
          metadata: Json | null
          session_id: string
          to_phase: string
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          created_at?: string
          from_phase: string
          id?: string
          metadata?: Json | null
          session_id: string
          to_phase: string
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          created_at?: string
          from_phase?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          to_phase?: string
          user_id?: string | null
        }
        Relationships: []
      }
      platform_cost_ledger: {
        Row: {
          amount_credits: number | null
          amount_usd: number
          cost_category: string
          cost_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          provider_key: string | null
          service_key: string | null
          tier: string | null
          user_id: string | null
        }
        Insert: {
          amount_credits?: number | null
          amount_usd?: number
          cost_category?: string
          cost_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          provider_key?: string | null
          service_key?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          amount_credits?: number | null
          amount_usd?: number
          cost_category?: string
          cost_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          provider_key?: string | null
          service_key?: string | null
          tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_metrics: {
        Row: {
          active_users_7d: number | null
          assets_per_execution: number | null
          avg_lock_in_score: number | null
          created_at: string | null
          id: string
          marketplace_velocity: number | null
          metric_date: string
          reuse_rate: number | null
          revenue_per_user: number | null
          total_assets: number | null
          total_executions: number | null
          total_revenue_neurons: number | null
          total_users: number | null
        }
        Insert: {
          active_users_7d?: number | null
          assets_per_execution?: number | null
          avg_lock_in_score?: number | null
          created_at?: string | null
          id?: string
          marketplace_velocity?: number | null
          metric_date?: string
          reuse_rate?: number | null
          revenue_per_user?: number | null
          total_assets?: number | null
          total_executions?: number | null
          total_revenue_neurons?: number | null
          total_users?: number | null
        }
        Update: {
          active_users_7d?: number | null
          assets_per_execution?: number | null
          avg_lock_in_score?: number | null
          created_at?: string | null
          id?: string
          marketplace_velocity?: number | null
          metric_date?: string
          reuse_rate?: number | null
          revenue_per_user?: number | null
          total_assets?: number | null
          total_executions?: number | null
          total_revenue_neurons?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      product_surface_pages: {
        Row: {
          created_at: string
          description_md: string | null
          features: Json | null
          id: string
          og_image_url: string | null
          product_key: string
          published_at: string | null
          schema_json: Json | null
          slug: string
          status: string
          tagline: string | null
          title: string
          updated_at: string
          use_cases: Json | null
          view_count: number | null
        }
        Insert: {
          created_at?: string
          description_md?: string | null
          features?: Json | null
          id?: string
          og_image_url?: string | null
          product_key: string
          published_at?: string | null
          schema_json?: Json | null
          slug: string
          status?: string
          tagline?: string | null
          title: string
          updated_at?: string
          use_cases?: Json | null
          view_count?: number | null
        }
        Update: {
          created_at?: string
          description_md?: string | null
          features?: Json | null
          id?: string
          og_image_url?: string | null
          product_key?: string
          published_at?: string | null
          schema_json?: Json | null
          slug?: string
          status?: string
          tagline?: string | null
          title?: string
          updated_at?: string
          use_cases?: Json | null
          view_count?: number | null
        }
        Relationships: []
      }
      profile_artifacts: {
        Row: {
          artifact_type: string
          content: Json
          created_at: string
          created_by: string | null
          format: string | null
          id: string
          job_id: string | null
          profile_id: string
          title: string | null
        }
        Insert: {
          artifact_type?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          format?: string | null
          id?: string
          job_id?: string | null
          profile_id: string
          title?: string | null
        }
        Update: {
          artifact_type?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          format?: string | null
          id?: string
          job_id?: string | null
          profile_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "profile_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_artifacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_audit_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: Json | null
          id: string
          profile_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          profile_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_gap_detections: {
        Row: {
          created_at: string
          dimension_key: string
          gap_severity: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          suggested_service_slug: string | null
          suggestion_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dimension_key: string
          gap_severity?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          suggested_service_slug?: string | null
          suggestion_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dimension_key?: string
          gap_severity?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          suggested_service_slug?: string | null
          suggestion_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          credits_cost: number | null
          error_message: string | null
          id: string
          input_params: Json | null
          job_type: string
          max_retries: number | null
          output_data: Json | null
          profile_id: string | null
          retry_count: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credits_cost?: number | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          job_type?: string
          max_retries?: number | null
          output_data?: Json | null
          profile_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credits_cost?: number | null
          error_message?: string | null
          id?: string
          input_params?: Json | null
          job_type?: string
          max_retries?: number | null
          output_data?: Json | null
          profile_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_scores: {
        Row: {
          certainty: number | null
          consistency: number | null
          data_volume: number | null
          overall: number | null
          prediction_accuracy: number | null
          profile_id: string
          updated_at: string
          validation_score: number | null
        }
        Insert: {
          certainty?: number | null
          consistency?: number | null
          data_volume?: number | null
          overall?: number | null
          prediction_accuracy?: number | null
          profile_id: string
          updated_at?: string
          validation_score?: number | null
        }
        Update: {
          certainty?: number | null
          consistency?: number | null
          data_volume?: number | null
          overall?: number | null
          prediction_accuracy?: number | null
          profile_id?: string
          updated_at?: string
          validation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_signals: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          neuron_id: number | null
          profile_id: string
          signal_key: string
          signal_type: string
          signal_value: string | null
          source_ref: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          neuron_id?: number | null
          profile_id: string
          signal_key: string
          signal_type?: string
          signal_value?: string | null
          source_ref?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          neuron_id?: number | null
          profile_id?: string
          signal_key?: string
          signal_type?: string
          signal_value?: string | null
          source_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_signals_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "profile_signals_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_signals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          created_by: string | null
          data_snapshot: Json
          id: string
          profile_id: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          data_snapshot?: Json
          id?: string
          profile_id: string
          version?: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          created_by?: string | null
          data_snapshot?: Json
          id?: string
          profile_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_versions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "intelligence_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_suspended: boolean
          onboarding_completed: boolean | null
          preferred_language: string | null
          public_bio: string | null
          public_links: Json | null
          public_profile_enabled: boolean
          seller_verified: boolean
          suspended_at: string | null
          suspended_by: string | null
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
          is_suspended?: boolean
          onboarding_completed?: boolean | null
          preferred_language?: string | null
          public_bio?: string | null
          public_links?: Json | null
          public_profile_enabled?: boolean
          seller_verified?: boolean
          suspended_at?: string | null
          suspended_by?: string | null
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
          is_suspended?: boolean
          onboarding_completed?: boolean | null
          preferred_language?: string | null
          public_bio?: string | null
          public_links?: Json | null
          public_profile_enabled?: boolean
          seller_verified?: boolean
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      prompt_history: {
        Row: {
          chain_parent_id: string | null
          chain_step: number | null
          context: string
          created_at: string
          credits_spent: number
          details: string | null
          feedback: string | null
          goal: string
          id: string
          is_favorite: boolean
          rating: number | null
          result: string
          template_id: string | null
          user_id: string
          variant_index: number | null
        }
        Insert: {
          chain_parent_id?: string | null
          chain_step?: number | null
          context: string
          created_at?: string
          credits_spent?: number
          details?: string | null
          feedback?: string | null
          goal: string
          id?: string
          is_favorite?: boolean
          rating?: number | null
          result?: string
          template_id?: string | null
          user_id: string
          variant_index?: number | null
        }
        Update: {
          chain_parent_id?: string | null
          chain_step?: number | null
          context?: string
          created_at?: string
          credits_spent?: number
          details?: string | null
          feedback?: string | null
          goal?: string
          id?: string
          is_favorite?: boolean
          rating?: number | null
          result?: string
          template_id?: string | null
          user_id?: string
          variant_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_history_chain_parent_id_fkey"
            columns: ["chain_parent_id"]
            isOneToOne: false
            referencedRelation: "prompt_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
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
      prompt_template_purchases: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          price_neurons: number | null
          template_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          price_neurons?: number | null
          template_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          price_neurons?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_template_purchases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          author_id: string | null
          avg_rating: number | null
          category: string
          context_template: string
          created_at: string
          description: string
          details_template: string
          goal: string
          icon: string
          id: string
          is_marketplace: boolean | null
          is_public: boolean
          is_system: boolean
          price_neurons: number | null
          sales_count: number | null
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          author_id?: string | null
          avg_rating?: number | null
          category?: string
          context_template?: string
          created_at?: string
          description?: string
          details_template?: string
          goal: string
          icon?: string
          id?: string
          is_marketplace?: boolean | null
          is_public?: boolean
          is_system?: boolean
          price_neurons?: number | null
          sales_count?: number | null
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          author_id?: string | null
          avg_rating?: number | null
          category?: string
          context_template?: string
          created_at?: string
          description?: string
          details_template?: string
          goal?: string
          icon?: string
          id?: string
          is_marketplace?: boolean | null
          is_public?: boolean
          is_system?: boolean
          price_neurons?: number | null
          sales_count?: number | null
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      prompt_vault: {
        Row: {
          access_scope: string
          created_at: string
          hash: string | null
          id: string
          input_schema: Json
          is_active: boolean
          output_schema: Json
          purpose: string
          quality_gate: Json
          rules: Json
          service_unit_id: string
          system_role: string
          updated_at: string
          version: number
        }
        Insert: {
          access_scope?: string
          created_at?: string
          hash?: string | null
          id?: string
          input_schema?: Json
          is_active?: boolean
          output_schema?: Json
          purpose: string
          quality_gate?: Json
          rules?: Json
          service_unit_id: string
          system_role?: string
          updated_at?: string
          version?: number
        }
        Update: {
          access_scope?: string
          created_at?: string
          hash?: string | null
          id?: string
          input_schema?: Json
          is_active?: boolean
          output_schema?: Json
          purpose?: string
          quality_gate?: Json
          rules?: Json
          service_unit_id?: string
          system_role?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_vault_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_vault_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units_public"
            referencedColumns: ["id"]
          },
        ]
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
      provider_health_checks: {
        Row: {
          alert_level: string | null
          auth_status: string
          avg_latency_1h: number | null
          avg_latency_24h: number | null
          balance_remaining: number | null
          checked_at: string
          created_at: string
          error_signatures: Json | null
          failure_rate_1h: number | null
          failure_rate_24h: number | null
          id: string
          last_failed_call: string | null
          last_successful_call: string | null
          metadata: Json | null
          monthly_spend: number | null
          provider_key: string
          quota_limit: number | null
          quota_remaining: number | null
          quota_status: string
          retry_rate: number | null
          spend_status: string
          status: string
        }
        Insert: {
          alert_level?: string | null
          auth_status?: string
          avg_latency_1h?: number | null
          avg_latency_24h?: number | null
          balance_remaining?: number | null
          checked_at?: string
          created_at?: string
          error_signatures?: Json | null
          failure_rate_1h?: number | null
          failure_rate_24h?: number | null
          id?: string
          last_failed_call?: string | null
          last_successful_call?: string | null
          metadata?: Json | null
          monthly_spend?: number | null
          provider_key: string
          quota_limit?: number | null
          quota_remaining?: number | null
          quota_status?: string
          retry_rate?: number | null
          spend_status?: string
          status?: string
        }
        Update: {
          alert_level?: string | null
          auth_status?: string
          avg_latency_1h?: number | null
          avg_latency_24h?: number | null
          balance_remaining?: number | null
          checked_at?: string
          created_at?: string
          error_signatures?: Json | null
          failure_rate_1h?: number | null
          failure_rate_24h?: number | null
          id?: string
          last_failed_call?: string | null
          last_successful_call?: string | null
          metadata?: Json | null
          monthly_spend?: number | null
          provider_key?: string
          quota_limit?: number | null
          quota_remaining?: number | null
          quota_status?: string
          retry_rate?: number | null
          spend_status?: string
          status?: string
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
      public_analyses: {
        Row: {
          analysis_type: string
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          slug: string
          source_artifact_id: string | null
          summary: string
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          analysis_type?: string
          author_id: string
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          slug: string
          source_artifact_id?: string | null
          summary?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          analysis_type?: string
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          slug?: string
          source_artifact_id?: string | null
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_analyses_source_artifact_id_fkey"
            columns: ["source_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      public_figure_seo: {
        Row: {
          canonical_url: string | null
          content_score: Json | null
          created_at: string
          hreflang: Json | null
          id: string
          internal_links: Json | null
          json_ld: Json | null
          keyword_clusters: Json | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          content_score?: Json | null
          created_at?: string
          hreflang?: Json | null
          id?: string
          internal_links?: Json | null
          json_ld?: Json | null
          keyword_clusters?: Json | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          content_score?: Json | null
          created_at?: string
          hreflang?: Json | null
          id?: string
          internal_links?: Json | null
          json_ld?: Json | null
          keyword_clusters?: Json | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          profile_id?: string
          updated_at?: string
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
      rate_limit_entries: {
        Row: {
          id: string
          request_count: number
          updated_at: string
          window_seconds: number
          window_start: string
        }
        Insert: {
          id: string
          request_count?: number
          updated_at?: string
          window_seconds?: number
          window_start?: string
        }
        Update: {
          id?: string
          request_count?: number
          updated_at?: string
          window_seconds?: number
          window_start?: string
        }
        Relationships: []
      }
      rbac_permissions: {
        Row: {
          created_at: string
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      risk_signals: {
        Row: {
          created_at: string
          id: string
          person_id: string | null
          risk_type: string
          severity: number
          statement_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          person_id?: string | null
          risk_type: string
          severity?: number
          statement_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          person_id?: string | null
          risk_type?: string
          severity?: number
          statement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_signals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_signals_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "intel_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      rso_versions: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string
          id: string
          model_used: string | null
          neuron_id: number
          raw_output: Json
          source_context: string | null
          token_count: number | null
          version: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by: string
          id?: string
          model_used?: string | null
          neuron_id: number
          raw_output?: Json
          source_context?: string | null
          token_count?: number | null
          version?: number
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string
          id?: string
          model_used?: string | null
          neuron_id?: number
          raw_output?: Json
          source_context?: string | null
          token_count?: number | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "rso_versions_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "rso_versions_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
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
      scoring_results: {
        Row: {
          axis: string
          created_at: string
          id: string
          neuron_id: number
          rationale: string | null
          score: number
          scored_by: string
        }
        Insert: {
          axis: string
          created_at?: string
          id?: string
          neuron_id: number
          rationale?: string | null
          score?: number
          scored_by: string
        }
        Update: {
          axis?: string
          created_at?: string
          id?: string
          neuron_id?: number
          rationale?: string | null
          score?: number
          scored_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_results_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "scoring_results_neuron_id_fkey"
            columns: ["neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_hint: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_hint?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      semantic_links: {
        Row: {
          context: string | null
          created_at: string
          created_by: string
          id: string
          relation_type: string
          source_neuron_id: number
          strength: number
          target_neuron_id: number
        }
        Insert: {
          context?: string | null
          created_at?: string
          created_by: string
          id?: string
          relation_type: string
          source_neuron_id: number
          strength?: number
          target_neuron_id: number
        }
        Update: {
          context?: string | null
          created_at?: string
          created_by?: string
          id?: string
          relation_type?: string
          source_neuron_id?: number
          strength?: number
          target_neuron_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "semantic_links_source_neuron_id_fkey"
            columns: ["source_neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "semantic_links_source_neuron_id_fkey"
            columns: ["source_neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "semantic_links_target_neuron_id_fkey"
            columns: ["target_neuron_id"]
            isOneToOne: false
            referencedRelation: "neuron_lifecycle_pricing"
            referencedColumns: ["neuron_id"]
          },
          {
            foreignKeyName: "semantic_links_target_neuron_id_fkey"
            columns: ["target_neuron_id"]
            isOneToOne: false
            referencedRelation: "neurons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_access_rules: {
        Row: {
          cooldown_seconds: number
          created_at: string
          geo_restrictions: Json | null
          id: string
          max_daily_uses: number
          min_tier: string
          required_certifications: string[] | null
          requires_kyc: boolean
          service_key: string
          updated_at: string
        }
        Insert: {
          cooldown_seconds?: number
          created_at?: string
          geo_restrictions?: Json | null
          id?: string
          max_daily_uses?: number
          min_tier?: string
          required_certifications?: string[] | null
          requires_kyc?: boolean
          service_key: string
          updated_at?: string
        }
        Update: {
          cooldown_seconds?: number
          created_at?: string
          geo_restrictions?: Json | null
          id?: string
          max_daily_uses?: number
          min_tier?: string
          required_certifications?: string[] | null
          requires_kyc?: boolean
          service_key?: string
          updated_at?: string
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
      service_deliverables: {
        Row: {
          classification_tags: string[] | null
          content: string | null
          created_at: string
          deliverable_name: string
          deliverable_type: string
          file_storage_key: string | null
          format: string
          generated_at: string | null
          id: string
          metadata: Json | null
          purchase_id: string
          quality_score: number | null
          service_id: string
          service_level: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          classification_tags?: string[] | null
          content?: string | null
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          file_storage_key?: string | null
          format?: string
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          purchase_id: string
          quality_score?: number | null
          service_id: string
          service_level: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          classification_tags?: string[] | null
          content?: string | null
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          file_storage_key?: string | null
          format?: string
          generated_at?: string | null
          id?: string
          metadata?: Json | null
          purchase_id?: string
          quality_score?: number | null
          service_id?: string
          service_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_deliverables_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "service_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      service_economic_contracts: {
        Row: {
          base_neurons: number
          created_at: string
          currency_model: string
          id: string
          margin_target: number
          notes: string | null
          refund_policy: string
          revenue_split_pct: number
          service_key: string
          tier_multipliers: Json
          updated_at: string
        }
        Insert: {
          base_neurons?: number
          created_at?: string
          currency_model?: string
          id?: string
          margin_target?: number
          notes?: string | null
          refund_policy?: string
          revenue_split_pct?: number
          service_key: string
          tier_multipliers?: Json
          updated_at?: string
        }
        Update: {
          base_neurons?: number
          created_at?: string
          currency_model?: string
          id?: string
          margin_target?: number
          notes?: string | null
          refund_policy?: string
          revenue_split_pct?: number
          service_key?: string
          tier_multipliers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      service_executions: {
        Row: {
          artifacts_count: number | null
          completed_at: string | null
          cost_actual: number | null
          cost_estimated: number | null
          created_at: string
          current_step: number | null
          error_message: string | null
          id: string
          input: Json
          manifest_id: string | null
          service_id: string
          started_at: string | null
          status: string
          total_steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artifacts_count?: number | null
          completed_at?: string | null
          cost_actual?: number | null
          cost_estimated?: number | null
          created_at?: string
          current_step?: number | null
          error_message?: string | null
          id?: string
          input?: Json
          manifest_id?: string | null
          service_id: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artifacts_count?: number | null
          completed_at?: string | null
          cost_actual?: number | null
          cost_estimated?: number | null
          created_at?: string
          current_step?: number | null
          error_message?: string | null
          id?: string
          input?: Json
          manifest_id?: string | null
          service_id?: string
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_executions_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "service_manifests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_executions_manifest_id_fkey"
            columns: ["manifest_id"]
            isOneToOne: false
            referencedRelation: "service_manifests_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_manifests: {
        Row: {
          access_requirements: Json | null
          base_neurons: number | null
          confidence_threshold: number | null
          cost_multiplier: number | null
          created_at: string | null
          dependencies: string[] | null
          estimated_duration_seconds: number | null
          id: string
          input_schema: Json | null
          is_validated: boolean | null
          output_schema: Json | null
          pipeline_class: string
          pipeline_steps: Json | null
          preview_enabled: boolean | null
          preview_limit_pct: number | null
          retry_attempts: number | null
          service_key: string
          updated_at: string | null
        }
        Insert: {
          access_requirements?: Json | null
          base_neurons?: number | null
          confidence_threshold?: number | null
          cost_multiplier?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          estimated_duration_seconds?: number | null
          id?: string
          input_schema?: Json | null
          is_validated?: boolean | null
          output_schema?: Json | null
          pipeline_class?: string
          pipeline_steps?: Json | null
          preview_enabled?: boolean | null
          preview_limit_pct?: number | null
          retry_attempts?: number | null
          service_key: string
          updated_at?: string | null
        }
        Update: {
          access_requirements?: Json | null
          base_neurons?: number | null
          confidence_threshold?: number | null
          cost_multiplier?: number | null
          created_at?: string | null
          dependencies?: string[] | null
          estimated_duration_seconds?: number | null
          id?: string
          input_schema?: Json | null
          is_validated?: boolean | null
          output_schema?: Json | null
          pipeline_class?: string
          pipeline_steps?: Json | null
          preview_enabled?: boolean | null
          preview_limit_pct?: number | null
          retry_attempts?: number | null
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
      service_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          service_keys: string[]
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          service_keys?: string[]
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          service_keys?: string[]
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      service_purchases: {
        Row: {
          created_at: string
          execution_completed_at: string | null
          execution_started_at: string | null
          execution_status: string
          id: string
          metadata: Json | null
          neuroni_cost_snapshot: number
          payment_method: string
          payment_status: string
          price_usd_snapshot: number
          service_id: string
          service_level: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          execution_completed_at?: string | null
          execution_started_at?: string | null
          execution_status?: string
          id?: string
          metadata?: Json | null
          neuroni_cost_snapshot?: number
          payment_method?: string
          payment_status?: string
          price_usd_snapshot?: number
          service_id: string
          service_level: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          execution_completed_at?: string | null
          execution_started_at?: string | null
          execution_status?: string
          id?: string
          metadata?: Json | null
          neuroni_cost_snapshot?: number
          payment_method?: string
          payment_status?: string
          price_usd_snapshot?: number
          service_id?: string
          service_level?: string
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_qa_configs: {
        Row: {
          auto_regenerate_on_fail: boolean
          created_at: string
          id: string
          max_regenerations: number
          min_word_count: number
          plagiarism_check: boolean
          qa_checks: Json
          required_sections: string[] | null
          service_key: string
          tone_check: boolean
          updated_at: string
        }
        Insert: {
          auto_regenerate_on_fail?: boolean
          created_at?: string
          id?: string
          max_regenerations?: number
          min_word_count?: number
          plagiarism_check?: boolean
          qa_checks?: Json
          required_sections?: string[] | null
          service_key: string
          tone_check?: boolean
          updated_at?: string
        }
        Update: {
          auto_regenerate_on_fail?: boolean
          created_at?: string
          id?: string
          max_regenerations?: number
          min_word_count?: number
          plagiarism_check?: boolean
          qa_checks?: Json
          required_sections?: string[] | null
          service_key?: string
          tone_check?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      service_registry: {
        Row: {
          category: string | null
          complexity: string | null
          composition: Json | null
          created_at: string | null
          description: string | null
          domain: string | null
          id: string
          intent: string | null
          is_active: boolean | null
          metadata: Json | null
          monetization: Json | null
          name: string
          neurons_cost_max: number | null
          neurons_cost_min: number | null
          output_type: string | null
          outputs: Json | null
          position: number | null
          score_tier: string | null
          scoring: Json | null
          service_level: string
          transformation: Json | null
        }
        Insert: {
          category?: string | null
          complexity?: string | null
          composition?: Json | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          id: string
          intent?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          monetization?: Json | null
          name: string
          neurons_cost_max?: number | null
          neurons_cost_min?: number | null
          output_type?: string | null
          outputs?: Json | null
          position?: number | null
          score_tier?: string | null
          scoring?: Json | null
          service_level?: string
          transformation?: Json | null
        }
        Update: {
          category?: string | null
          complexity?: string | null
          composition?: Json | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          intent?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          monetization?: Json | null
          name?: string
          neurons_cost_max?: number | null
          neurons_cost_min?: number | null
          output_type?: string | null
          outputs?: Json | null
          position?: number | null
          score_tier?: string | null
          scoring?: Json | null
          service_level?: string
          transformation?: Json | null
        }
        Relationships: []
      }
      service_release_log: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          atomicity_check: boolean
          created_at: string
          duplication_check: boolean
          id: string
          monetization_check: boolean
          review_notes: string | null
          reviewed_by: string | null
          root2_check: boolean
          schema_check: boolean
          service_unit_id: string
          total_score: number | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          atomicity_check?: boolean
          created_at?: string
          duplication_check?: boolean
          id?: string
          monetization_check?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          root2_check?: boolean
          schema_check?: boolean
          service_unit_id: string
          total_score?: number | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          atomicity_check?: boolean
          created_at?: string
          duplication_check?: boolean
          id?: string
          monetization_check?: boolean
          review_notes?: string | null
          reviewed_by?: string | null
          root2_check?: boolean
          schema_check?: boolean
          service_unit_id?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_release_log_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_release_log_service_unit_id_fkey"
            columns: ["service_unit_id"]
            isOneToOne: false
            referencedRelation: "service_units_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_retry_configs: {
        Row: {
          circuit_breaker_threshold: number
          created_at: string
          fallback_model: string | null
          fallback_service_key: string | null
          id: string
          max_retries: number
          retry_delay_ms: number
          service_key: string
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          circuit_breaker_threshold?: number
          created_at?: string
          fallback_model?: string | null
          fallback_service_key?: string | null
          id?: string
          max_retries?: number
          retry_delay_ms?: number
          service_key: string
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          circuit_breaker_threshold?: number
          created_at?: string
          fallback_model?: string | null
          fallback_service_key?: string | null
          id?: string
          max_retries?: number
          retry_delay_ms?: number
          service_key?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_run_history: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_at: string | null
          credits_cost: number | null
          duration_ms: number | null
          id: string
          inputs: Json | null
          job_id: string | null
          neuron_id: number | null
          result_preview: string | null
          service_key: string
          service_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_cost?: number | null
          duration_ms?: number | null
          id?: string
          inputs?: Json | null
          job_id?: string | null
          neuron_id?: number | null
          result_preview?: string | null
          service_key: string
          service_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_cost?: number | null
          duration_ms?: number | null
          id?: string
          inputs?: Json | null
          job_id?: string | null
          neuron_id?: number | null
          result_preview?: string | null
          service_key?: string
          service_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_security_policies: {
        Row: {
          audit_log_required: boolean
          created_at: string
          id: string
          input_sanitization_level: string
          output_filtering: boolean
          pii_detection: boolean
          prompt_injection_guard: boolean
          rate_limit_override: Json | null
          service_key: string
          updated_at: string
        }
        Insert: {
          audit_log_required?: boolean
          created_at?: string
          id?: string
          input_sanitization_level?: string
          output_filtering?: boolean
          pii_detection?: boolean
          prompt_injection_guard?: boolean
          rate_limit_override?: Json | null
          service_key: string
          updated_at?: string
        }
        Update: {
          audit_log_required?: boolean
          created_at?: string
          id?: string
          input_sanitization_level?: string
          output_filtering?: boolean
          pii_detection?: boolean
          prompt_injection_guard?: boolean
          rate_limit_override?: Json | null
          service_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_template_compliance: {
        Row: {
          compliance_score: number
          created_at: string
          id: string
          issues: Json | null
          last_validated_at: string | null
          sections_completed: Json
          service_key: string
          updated_at: string
          validator_version: string | null
        }
        Insert: {
          compliance_score?: number
          created_at?: string
          id?: string
          issues?: Json | null
          last_validated_at?: string | null
          sections_completed?: Json
          service_key: string
          updated_at?: string
          validator_version?: string | null
        }
        Update: {
          compliance_score?: number
          created_at?: string
          id?: string
          issues?: Json | null
          last_validated_at?: string | null
          sections_completed?: Json
          service_key?: string
          updated_at?: string
          validator_version?: string | null
        }
        Relationships: []
      }
      service_units: {
        Row: {
          cost_json: Json
          created_at: string
          deliverable_id: string | null
          domain: string
          id: string
          intent: string
          lcss_id: string | null
          level: Database["public"]["Enums"]["service_level"]
          mechanism: string
          mms_id: string | null
          name: string
          otos_id: string | null
          pricing_json: Json
          prompt_id: string | null
          role: string
          score_json: Json
          single_decision: string
          single_function: string
          single_output: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          cost_json?: Json
          created_at?: string
          deliverable_id?: string | null
          domain?: string
          id?: string
          intent?: string
          lcss_id?: string | null
          level?: Database["public"]["Enums"]["service_level"]
          mechanism: string
          mms_id?: string | null
          name: string
          otos_id?: string | null
          pricing_json?: Json
          prompt_id?: string | null
          role: string
          score_json?: Json
          single_decision: string
          single_function: string
          single_output: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          cost_json?: Json
          created_at?: string
          deliverable_id?: string | null
          domain?: string
          id?: string
          intent?: string
          lcss_id?: string | null
          level?: Database["public"]["Enums"]["service_level"]
          mechanism?: string
          mms_id?: string | null
          name?: string
          otos_id?: string | null
          pricing_json?: Json
          prompt_id?: string | null
          role?: string
          score_json?: Json
          single_decision?: string
          single_function?: string
          single_output?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_deliverable"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverable_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prompt"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompt_vault"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_units_lcss_id_fkey"
            columns: ["lcss_id"]
            isOneToOne: false
            referencedRelation: "os_lcss"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_units_mms_id_fkey"
            columns: ["mms_id"]
            isOneToOne: false
            referencedRelation: "os_mms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_units_otos_id_fkey"
            columns: ["otos_id"]
            isOneToOne: false
            referencedRelation: "os_otos"
            referencedColumns: ["id"]
          },
        ]
      }
      service_verdict_configs: {
        Row: {
          auto_approve_threshold: number
          created_at: string
          human_review_required: boolean
          id: string
          minimum_pass_score: number
          scoring_dimensions: Json
          service_key: string
          updated_at: string
          verdict_schema: Json | null
        }
        Insert: {
          auto_approve_threshold?: number
          created_at?: string
          human_review_required?: boolean
          id?: string
          minimum_pass_score?: number
          scoring_dimensions?: Json
          service_key: string
          updated_at?: string
          verdict_schema?: Json | null
        }
        Update: {
          auto_approve_threshold?: number
          created_at?: string
          human_review_required?: boolean
          id?: string
          minimum_pass_score?: number
          scoring_dimensions?: Json
          service_key?: string
          updated_at?: string
          verdict_schema?: Json | null
        }
        Relationships: []
      }
      service_votes: {
        Row: {
          future_service_id: string
          id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          future_service_id: string
          id?: string
          user_id: string
          voted_at?: string
        }
        Update: {
          future_service_id?: string
          id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_votes_future_service_id_fkey"
            columns: ["future_service_id"]
            isOneToOne: false
            referencedRelation: "future_services"
            referencedColumns: ["id"]
          },
        ]
      }
      services_level_1: {
        Row: {
          category: string
          component_l2_ids: string[] | null
          component_l3_ids_optional: string[] | null
          created_at: string
          deliverable_name: string
          deliverable_type: string
          description_internal: string | null
          description_public: string
          estimated_delivery_seconds: number
          execution_prompt_id: string | null
          final_delivery_assembly_logic: Json | null
          formation_framework_id: string | null
          id: string
          internal_credit_cost: number
          master_deliverables: Json | null
          output_types: string[] | null
          price_usd: number
          production_cost_usd: number
          service_name: string
          service_slug: string
          status: string
          subcategory: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          category?: string
          component_l2_ids?: string[] | null
          component_l3_ids_optional?: string[] | null
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          description_internal?: string | null
          description_public?: string
          estimated_delivery_seconds?: number
          execution_prompt_id?: string | null
          final_delivery_assembly_logic?: Json | null
          formation_framework_id?: string | null
          id?: string
          internal_credit_cost?: number
          master_deliverables?: Json | null
          output_types?: string[] | null
          price_usd?: number
          production_cost_usd?: number
          service_name: string
          service_slug: string
          status?: string
          subcategory?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          component_l2_ids?: string[] | null
          component_l3_ids_optional?: string[] | null
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          description_internal?: string | null
          description_public?: string
          estimated_delivery_seconds?: number
          execution_prompt_id?: string | null
          final_delivery_assembly_logic?: Json | null
          formation_framework_id?: string | null
          id?: string
          internal_credit_cost?: number
          master_deliverables?: Json | null
          output_types?: string[] | null
          price_usd?: number
          production_cost_usd?: number
          service_name?: string
          service_slug?: string
          status?: string
          subcategory?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_level_1_execution_prompt_id_fkey"
            columns: ["execution_prompt_id"]
            isOneToOne: false
            referencedRelation: "execution_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_level_1_formation_framework_id_fkey"
            columns: ["formation_framework_id"]
            isOneToOne: false
            referencedRelation: "formation_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      services_level_2: {
        Row: {
          category: string
          component_execution_order: Json | null
          component_l3_ids: string[] | null
          component_selection_logic: Json | null
          created_at: string
          deliverable_name: string
          deliverable_type: string
          description_internal: string | null
          description_public: string
          estimated_delivery_seconds: number
          execution_prompt_id: string | null
          formation_framework_id: string | null
          id: string
          internal_credit_cost: number
          price_usd: number
          production_cost_usd: number
          service_name: string
          service_slug: string
          status: string
          subcategory: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          category?: string
          component_execution_order?: Json | null
          component_l3_ids?: string[] | null
          component_selection_logic?: Json | null
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          description_internal?: string | null
          description_public?: string
          estimated_delivery_seconds?: number
          execution_prompt_id?: string | null
          formation_framework_id?: string | null
          id?: string
          internal_credit_cost?: number
          price_usd?: number
          production_cost_usd?: number
          service_name: string
          service_slug: string
          status?: string
          subcategory?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          component_execution_order?: Json | null
          component_l3_ids?: string[] | null
          component_selection_logic?: Json | null
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          description_internal?: string | null
          description_public?: string
          estimated_delivery_seconds?: number
          execution_prompt_id?: string | null
          formation_framework_id?: string | null
          id?: string
          internal_credit_cost?: number
          price_usd?: number
          production_cost_usd?: number
          service_name?: string
          service_slug?: string
          status?: string
          subcategory?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_level_2_execution_prompt_id_fkey"
            columns: ["execution_prompt_id"]
            isOneToOne: false
            referencedRelation: "execution_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_level_2_formation_framework_id_fkey"
            columns: ["formation_framework_id"]
            isOneToOne: false
            referencedRelation: "formation_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      services_level_3: {
        Row: {
          category: string
          created_at: string
          deliverable_name: string
          deliverable_type: string
          description_internal: string | null
          description_public: string
          estimated_delivery_seconds: number
          execution_prompt_id: string | null
          formation_framework_id: string | null
          id: string
          internal_credit_cost: number
          price_usd: number
          production_cost_usd: number
          service_name: string
          service_slug: string
          status: string
          subcategory: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          category?: string
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          description_internal?: string | null
          description_public?: string
          estimated_delivery_seconds?: number
          execution_prompt_id?: string | null
          formation_framework_id?: string | null
          id?: string
          internal_credit_cost?: number
          price_usd?: number
          production_cost_usd?: number
          service_name: string
          service_slug: string
          status?: string
          subcategory?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          created_at?: string
          deliverable_name?: string
          deliverable_type?: string
          description_internal?: string | null
          description_public?: string
          estimated_delivery_seconds?: number
          execution_prompt_id?: string | null
          formation_framework_id?: string | null
          id?: string
          internal_credit_cost?: number
          price_usd?: number
          production_cost_usd?: number
          service_name?: string
          service_slug?: string
          status?: string
          subcategory?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_level_3_execution_prompt_id_fkey"
            columns: ["execution_prompt_id"]
            isOneToOne: false
            referencedRelation: "execution_prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_level_3_formation_framework_id_fkey"
            columns: ["formation_framework_id"]
            isOneToOne: false
            referencedRelation: "formation_frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      share_events: {
        Row: {
          clicked_back: boolean
          content_category: string
          content_type: string
          created_at: string
          has_cta: boolean
          id: string
          platform: string
          service_key: string | null
          share_text_preview: string | null
          user_id: string
        }
        Insert: {
          clicked_back?: boolean
          content_category?: string
          content_type?: string
          created_at?: string
          has_cta?: boolean
          id?: string
          platform: string
          service_key?: string | null
          share_text_preview?: string | null
          user_id: string
        }
        Update: {
          clicked_back?: boolean
          content_category?: string
          content_type?: string
          created_at?: string
          has_cta?: boolean
          id?: string
          platform?: string
          service_key?: string | null
          share_text_preview?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          body: string
          content_key: string
          created_at: string
          id: string
          is_published: boolean
          locale: string
          metadata: Json | null
          section: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          content_key: string
          created_at?: string
          id?: string
          is_published?: boolean
          locale?: string
          metadata?: Json | null
          section?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          content_key?: string
          created_at?: string
          id?: string
          is_published?: boolean
          locale?: string
          metadata?: Json | null
          section?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          canonical_url: string | null
          content_hash: string | null
          created_at: string | null
          embedding_score: number | null
          entity_count: number | null
          external_link_count: number | null
          first_discovered: string | null
          heading_count: number | null
          id: string
          internal_link_count: number | null
          language: string | null
          last_scan: string | null
          last_schema_update: string | null
          llm_visibility_score: number | null
          meta_description: string | null
          page_type: string | null
          schema_present: boolean | null
          schema_types: string[] | null
          status_code: number | null
          title: string | null
          updated_at: string | null
          url: string
          word_count: number | null
        }
        Insert: {
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedding_score?: number | null
          entity_count?: number | null
          external_link_count?: number | null
          first_discovered?: string | null
          heading_count?: number | null
          id?: string
          internal_link_count?: number | null
          language?: string | null
          last_scan?: string | null
          last_schema_update?: string | null
          llm_visibility_score?: number | null
          meta_description?: string | null
          page_type?: string | null
          schema_present?: boolean | null
          schema_types?: string[] | null
          status_code?: number | null
          title?: string | null
          updated_at?: string | null
          url: string
          word_count?: number | null
        }
        Update: {
          canonical_url?: string | null
          content_hash?: string | null
          created_at?: string | null
          embedding_score?: number | null
          entity_count?: number | null
          external_link_count?: number | null
          first_discovered?: string | null
          heading_count?: number | null
          id?: string
          internal_link_count?: number | null
          language?: string | null
          last_scan?: string | null
          last_schema_update?: string | null
          llm_visibility_score?: number | null
          meta_description?: string | null
          page_type?: string | null
          schema_present?: boolean | null
          schema_types?: string[] | null
          status_code?: number | null
          title?: string | null
          updated_at?: string | null
          url?: string
          word_count?: number | null
        }
        Relationships: []
      }
      source_documents: {
        Row: {
          content_hash: string | null
          content_type: string
          created_at: string
          episode_id: string | null
          error_message: string | null
          external_id: string | null
          external_url: string | null
          id: string
          integration_id: string | null
          metadata: Json | null
          neurons_extracted: number
          raw_content: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_hash?: string | null
          content_type?: string
          created_at?: string
          episode_id?: string | null
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          neurons_extracted?: number
          raw_content?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_hash?: string | null
          content_type?: string
          created_at?: string
          episode_id?: string | null
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          neurons_extracted?: number
          raw_content?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_billing_log: {
        Row: {
          artifact_count: number | null
          billable_bytes: number | null
          billing_date: string
          created_at: string | null
          details: Json | null
          id: string
          neurons_charged: number | null
          total_bytes: number | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          artifact_count?: number | null
          billable_bytes?: number | null
          billing_date?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          neurons_charged?: number | null
          total_bytes?: number | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          artifact_count?: number | null
          billable_bytes?: number | null
          billing_date?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          neurons_charged?: number | null
          total_bytes?: number | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_billing_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_limits: {
        Row: {
          description: string | null
          max_bytes: number
          max_files: number
          tier: string
        }
        Insert: {
          description?: string | null
          max_bytes: number
          max_files?: number
          tier: string
        }
        Update: {
          description?: string | null
          max_bytes?: number
          max_files?: number
          tier?: string
        }
        Relationships: []
      }
      stripe_processed_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
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
      sync_history: {
        Row: {
          completed_at: string | null
          documents_found: number
          documents_new: number
          documents_skipped: number
          documents_updated: number
          duration_ms: number | null
          error_log: Json | null
          id: string
          integration_id: string
          neurons_generated: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          documents_found?: number
          documents_new?: number
          documents_skipped?: number
          documents_updated?: number
          duration_ms?: number | null
          error_log?: Json | null
          id?: string
          integration_id: string
          neurons_generated?: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          documents_found?: number
          documents_new?: number
          documents_skipped?: number
          documents_updated?: number
          duration_ms?: number | null
          error_log?: Json | null
          id?: string
          integration_id?: string
          neurons_generated?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_history_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_history_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "user_integrations_safe"
            referencedColumns: ["id"]
          },
        ]
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
      system_modules: {
        Row: {
          access_requirements: Json | null
          component_path: string | null
          created_at: string
          dependencies: string[] | null
          description: string | null
          edge_function_key: string | null
          id: string
          min_tier: string | null
          module_key: string
          module_type: string
          monetization_link: string | null
          name: string
          status: string
          updated_at: string
          version: string | null
        }
        Insert: {
          access_requirements?: Json | null
          component_path?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          edge_function_key?: string | null
          id?: string
          min_tier?: string | null
          module_key: string
          module_type: string
          monetization_link?: string | null
          name: string
          status?: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          access_requirements?: Json | null
          component_path?: string | null
          created_at?: string
          dependencies?: string[] | null
          description?: string | null
          edge_function_key?: string | null
          id?: string
          min_tier?: string | null
          module_key?: string
          module_type?: string
          monetization_link?: string | null
          name?: string
          status?: string
          updated_at?: string
          version?: string | null
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
      tier_progression_rules: {
        Row: {
          assets_created_threshold: number | null
          created_at: string
          description: string | null
          feature_unlocks: string[] | null
          id: string
          label: string
          neurons_spent_threshold: number | null
          revenue_generated_threshold: number | null
          streak_days_threshold: number | null
          tier_level: string
          unlock_effects: Json | null
        }
        Insert: {
          assets_created_threshold?: number | null
          created_at?: string
          description?: string | null
          feature_unlocks?: string[] | null
          id?: string
          label: string
          neurons_spent_threshold?: number | null
          revenue_generated_threshold?: number | null
          streak_days_threshold?: number | null
          tier_level: string
          unlock_effects?: Json | null
        }
        Update: {
          assets_created_threshold?: number | null
          created_at?: string
          description?: string | null
          feature_unlocks?: string[] | null
          id?: string
          label?: string
          neurons_spent_threshold?: number | null
          revenue_generated_threshold?: number | null
          streak_days_threshold?: number | null
          tier_level?: string
          unlock_effects?: Json | null
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
      token_holdings: {
        Row: {
          holder_id: string
          id: string
          purchase_price: number
          purchased_at: string | null
          token_id: string
          units: number
        }
        Insert: {
          holder_id: string
          id?: string
          purchase_price?: number
          purchased_at?: string | null
          token_id: string
          units?: number
        }
        Update: {
          holder_id?: string
          id?: string
          purchase_price?: number
          purchased_at?: string | null
          token_id?: string
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "token_holdings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "asset_tokens"
            referencedColumns: ["id"]
          },
        ]
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
      trait_definitions: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          polarity: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          polarity?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          polarity?: string
        }
        Relationships: []
      }
      trait_dimension_map: {
        Row: {
          dimension_id: string
          trait_id: string
          weight: number
        }
        Insert: {
          dimension_id: string
          trait_id: string
          weight?: number
        }
        Update: {
          dimension_id?: string
          trait_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "trait_dimension_map_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "personality_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trait_dimension_map_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "trait_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      trait_signals: {
        Row: {
          created_at: string
          detection_method: string
          id: string
          job_id: string | null
          person_id: string | null
          signal_strength: number
          statement_id: string | null
          trait_id: string | null
        }
        Insert: {
          created_at?: string
          detection_method?: string
          id?: string
          job_id?: string | null
          person_id?: string | null
          signal_strength?: number
          statement_id?: string | null
          trait_id?: string | null
        }
        Update: {
          created_at?: string
          detection_method?: string
          id?: string
          job_id?: string | null
          person_id?: string | null
          signal_strength?: number
          statement_id?: string | null
          trait_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trait_signals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "intel_persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trait_signals_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "intel_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trait_signals_trait_id_fkey"
            columns: ["trait_id"]
            isOneToOne: false
            referencedRelation: "trait_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_auto_translated: boolean
          language: string
          semantic_hash: string | null
          source_language: string | null
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          entity_id: string
          entity_type?: string
          id?: string
          is_auto_translated?: boolean
          language: string
          semantic_hash?: string | null
          source_language?: string | null
          title?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_auto_translated?: boolean
          language?: string
          semantic_hash?: string | null
          source_language?: string | null
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
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
      unit_economics_daily: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_key: string
          metric_value: number
          segment: string | null
          service_key: string | null
          snapshot_date: string
          tier: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_key: string
          metric_value?: number
          segment?: string | null
          service_key?: string | null
          snapshot_date?: string
          tier?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_key?: string
          metric_value?: number
          segment?: string | null
          service_key?: string | null
          snapshot_date?: string
          tier?: string | null
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
      user_adaptation_log: {
        Row: {
          adaptation_type: string
          applied: boolean | null
          applied_at: string | null
          confidence: number | null
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string
        }
        Insert: {
          adaptation_type: string
          applied?: boolean | null
          applied_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
        }
        Update: {
          adaptation_type?: string
          applied?: boolean | null
          applied_at?: string | null
          confidence?: number | null
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          awarded_at: string | null
          cert_id: string
          expires_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          cert_id: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          cert_id?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_cert_id_fkey"
            columns: ["cert_id"]
            isOneToOne: false
            referencedRelation: "certifications"
            referencedColumns: ["id"]
          },
        ]
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
      user_identity_profiles: {
        Row: {
          cognitive_logic: Json | null
          completeness_score: number | null
          created_at: string
          dark_patterns: Json | null
          extraction_status: string
          id: string
          identity_layers: Json | null
          knowledge_signature: Json | null
          last_extracted_at: string | null
          operational_identity: Json | null
          problem_solving_model: Json | null
          source_neuron_ids: number[] | null
          tone_of_voice: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cognitive_logic?: Json | null
          completeness_score?: number | null
          created_at?: string
          dark_patterns?: Json | null
          extraction_status?: string
          id?: string
          identity_layers?: Json | null
          knowledge_signature?: Json | null
          last_extracted_at?: string | null
          operational_identity?: Json | null
          problem_solving_model?: Json | null
          source_neuron_ids?: number[] | null
          tone_of_voice?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cognitive_logic?: Json | null
          completeness_score?: number | null
          created_at?: string
          dark_patterns?: Json | null
          extraction_status?: string
          id?: string
          identity_layers?: Json | null
          knowledge_signature?: Json | null
          last_extracted_at?: string | null
          operational_identity?: Json | null
          problem_solving_model?: Json | null
          source_neuron_ids?: number[] | null
          tone_of_voice?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          auth_tokens: Json | null
          connector_id: string
          created_at: string
          documents_imported: number
          error_message: string | null
          id: string
          last_sync_at: string | null
          neurons_generated: number
          next_sync_at: string | null
          settings: Json | null
          status: string
          sync_interval_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_tokens?: Json | null
          connector_id: string
          created_at?: string
          documents_imported?: number
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          neurons_generated?: number
          next_sync_at?: string | null
          settings?: Json | null
          status?: string
          sync_interval_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_tokens?: Json | null
          connector_id?: string
          created_at?: string
          documents_imported?: number
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          neurons_generated?: number
          next_sync_at?: string | null
          settings?: Json | null
          status?: string
          sync_interval_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "integration_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_intelligence_profiles: {
        Row: {
          behavior_tags: string[] | null
          compounding_level: number
          content_style: string | null
          created_at: string
          interests: string[] | null
          last_computed_at: string | null
          lockin_score: number
          preferred_services: string[] | null
          spending_pattern: string | null
          top_topics: string[] | null
          total_neurons: number
          total_outputs: number
          total_shares: number
          updated_at: string
          user_id: string
        }
        Insert: {
          behavior_tags?: string[] | null
          compounding_level?: number
          content_style?: string | null
          created_at?: string
          interests?: string[] | null
          last_computed_at?: string | null
          lockin_score?: number
          preferred_services?: string[] | null
          spending_pattern?: string | null
          top_topics?: string[] | null
          total_neurons?: number
          total_outputs?: number
          total_shares?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          behavior_tags?: string[] | null
          compounding_level?: number
          content_style?: string | null
          created_at?: string
          interests?: string[] | null
          last_computed_at?: string | null
          lockin_score?: number
          preferred_services?: string[] | null
          spending_pattern?: string | null
          top_topics?: string[] | null
          total_neurons?: number
          total_outputs?: number
          total_shares?: number
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
      user_learning_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json
          created_at: string
          current_step: number
          id: string
          path_id: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          path_id: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json
          created_at?: string
          current_step?: number
          id?: string
          path_id?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_learning_progress_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
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
      user_lock_in: {
        Row: {
          asset_dependency: number | null
          assets_count: number | null
          executions_count: number | null
          identity_dependency: number | null
          marketplace_revenue: number | null
          revenue_dependency: number | null
          tier: string | null
          total_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_dependency?: number | null
          assets_count?: number | null
          executions_count?: number | null
          identity_dependency?: number | null
          marketplace_revenue?: number | null
          revenue_dependency?: number | null
          tier?: string | null
          total_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_dependency?: number | null
          assets_count?: number | null
          executions_count?: number | null
          identity_dependency?: number | null
          marketplace_revenue?: number | null
          revenue_dependency?: number | null
          tier?: string | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          last_reused_at: string | null
          memory_type: string
          metadata: Json | null
          reuse_count: number
          source_id: string | null
          source_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          last_reused_at?: string | null
          memory_type?: string
          metadata?: Json | null
          reuse_count?: number
          source_id?: string | null
          source_type?: string | null
          title?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          last_reused_at?: string | null
          memory_type?: string
          metadata?: Json | null
          reuse_count?: number
          source_id?: string | null
          source_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_memory_entries: {
        Row: {
          access_count: number | null
          category: string
          content: string
          created_at: string
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          memory_type: string
          metadata: Json | null
          relevance_score: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          category?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          memory_type?: string
          metadata?: Json | null
          relevance_score?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          category?: string
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          memory_type?: string
          metadata?: Json | null
          relevance_score?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_personalization: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          pref_key: string
          pref_value: Json
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          pref_key: string
          pref_value?: Json
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          pref_key?: string
          pref_value?: Json
          source?: string
          updated_at?: string
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
          grace_expires_at: string | null
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
          grace_expires_at?: string | null
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
          grace_expires_at?: string | null
          grace_period_used?: boolean
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tier_progress: {
        Row: {
          assets_created_total: number | null
          created_at: string
          current_level: string
          current_streak_days: number | null
          last_activity_at: string | null
          level_achieved_at: string | null
          longest_streak_days: number | null
          neurons_spent_total: number | null
          revenue_generated_total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assets_created_total?: number | null
          created_at?: string
          current_level?: string
          current_streak_days?: number | null
          last_activity_at?: string | null
          level_achieved_at?: string | null
          longest_streak_days?: number | null
          neurons_spent_total?: number | null
          revenue_generated_total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assets_created_total?: number | null
          created_at?: string
          current_level?: string
          current_streak_days?: number | null
          last_activity_at?: string | null
          level_achieved_at?: string | null
          longest_streak_days?: number | null
          neurons_spent_total?: number | null
          revenue_generated_total?: number | null
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
          quality_multiplier: number
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
          quality_multiplier?: number
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
          quality_multiplier?: number
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
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints_safe"
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
      capacity_state_public: {
        Row: {
          id: number | null
          premium_only_mode: boolean | null
          queue_depth: number | null
          updated_at: string | null
          utilization: number | null
        }
        Insert: {
          id?: number | null
          premium_only_mode?: boolean | null
          queue_depth?: number | null
          updated_at?: string | null
          utilization?: number | null
        }
        Update: {
          id?: number | null
          premium_only_mode?: boolean | null
          queue_depth?: number | null
          updated_at?: string | null
          utilization?: number | null
        }
        Relationships: []
      }
      leaderboard_karma: {
        Row: {
          karma: number | null
          user_id: string | null
        }
        Insert: {
          karma?: number | null
          user_id?: string | null
        }
        Update: {
          karma?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      leaderboard_streaks: {
        Row: {
          current_streak: number | null
          longest_streak: number | null
          user_id: string | null
        }
        Insert: {
          current_streak?: number | null
          longest_streak?: number | null
          user_id?: string | null
        }
        Update: {
          current_streak?: number | null
          longest_streak?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      leaderboard_xp: {
        Row: {
          level: number | null
          rank_name: string | null
          total_xp: number | null
          user_id: string | null
        }
        Insert: {
          level?: number | null
          rank_name?: string | null
          total_xp?: number | null
          user_id?: string | null
        }
        Update: {
          level?: number | null
          rank_name?: string | null
          total_xp?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
          username?: string | null
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      service_manifests_public: {
        Row: {
          base_neurons: number | null
          created_at: string | null
          id: string | null
          is_validated: boolean | null
          pipeline_class: string | null
          preview_enabled: boolean | null
          service_key: string | null
        }
        Insert: {
          base_neurons?: number | null
          created_at?: string | null
          id?: string | null
          is_validated?: boolean | null
          pipeline_class?: string | null
          preview_enabled?: boolean | null
          service_key?: string | null
        }
        Update: {
          base_neurons?: number | null
          created_at?: string | null
          id?: string | null
          is_validated?: boolean | null
          pipeline_class?: string | null
          preview_enabled?: boolean | null
          service_key?: string | null
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
      service_units_public: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string | null
          intent: string | null
          level: Database["public"]["Enums"]["service_level"] | null
          mechanism: string | null
          name: string | null
          role: string | null
          single_decision: string | null
          single_function: string | null
          single_output: string | null
          status: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string | null
          intent?: string | null
          level?: Database["public"]["Enums"]["service_level"] | null
          mechanism?: string | null
          name?: string | null
          role?: string | null
          single_decision?: string | null
          single_function?: string | null
          single_output?: string | null
          status?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string | null
          intent?: string | null
          level?: Database["public"]["Enums"]["service_level"] | null
          mechanism?: string | null
          name?: string | null
          role?: string | null
          single_decision?: string | null
          single_function?: string | null
          single_output?: string | null
          status?: string | null
          version?: number | null
        }
        Relationships: []
      }
      user_integrations_safe: {
        Row: {
          connector_id: string | null
          created_at: string | null
          documents_imported: number | null
          error_message: string | null
          id: string | null
          last_sync_at: string | null
          neurons_generated: number | null
          next_sync_at: string | null
          settings: Json | null
          status: string | null
          sync_interval_hours: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          connector_id?: string | null
          created_at?: string | null
          documents_imported?: number | null
          error_message?: string | null
          id?: string | null
          last_sync_at?: string | null
          neurons_generated?: number | null
          next_sync_at?: string | null
          settings?: Json | null
          status?: string | null
          sync_interval_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          connector_id?: string | null
          created_at?: string | null
          documents_imported?: number | null
          error_message?: string | null
          id?: string | null
          last_sync_at?: string | null
          neurons_generated?: number | null
          next_sync_at?: string | null
          settings?: Json | null
          status?: string | null
          sync_interval_hours?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_integrations_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "integration_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints_safe: {
        Row: {
          created_at: string | null
          description: string | null
          events: string[] | null
          failure_count: number | null
          id: string | null
          is_active: boolean | null
          last_triggered_at: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          events?: string[] | null
          failure_count?: number | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          events?: string[] | null
          failure_count?: number | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_emergency: {
        Args: { _control_type: string; _reason: string; _scope?: string }
        Returns: string
      }
      activate_power_unlock: {
        Args: {
          _capability_key: string
          _capability_name: string
          _tier: string
          _user_id: string
          _xp_cost: number
        }
        Returns: Json
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
      approve_profile: {
        Args: { _profile_id: string; _user_id: string }
        Returns: Json
      }
      award_xp: {
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
      calculate_storage_cost: {
        Args: { p_user_id: string }
        Returns: {
          artifact_count: number
          billable_bytes: number
          cost_neurons: number
          free_bytes: number
          total_bytes: number
        }[]
      }
      capacity_dashboard_stats: { Args: never; Returns: Json }
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
      check_cusnir_os_eligibility: { Args: { _user_id: string }; Returns: Json }
      check_i18n_coverage: { Args: { p_service_key: string }; Returns: Json }
      check_kill_switch: { Args: never; Returns: boolean }
      check_login_attempts: {
        Args: {
          p_email: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_profile_eligibility: {
        Args: { _episode_id?: string; _user_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      check_vip_access: {
        Args: { _unlock_key: string; _user_id: string }
        Returns: boolean
      }
      check_wallet_freshness: {
        Args: { _max_age_seconds?: number; _user_id: string }
        Returns: Json
      }
      claim_vip_reward: {
        Args: { _milestone_id: string; _user_id: string }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      collection_pipeline_stats: { Args: { _user_id: string }; Returns: Json }
      complete_agent_execution: {
        Args: {
          _execution_id: string
          _output?: Json
          _performance?: Json
          _success?: boolean
        }
        Returns: Json
      }
      complete_onboarding_tutorial: {
        Args: { _user_id: string }
        Returns: Json
      }
      compute_content_hash: { Args: { _content: string }; Returns: string }
      compute_dynamic_price: {
        Args: { _base_price: number; _user_id: string }
        Returns: Json
      }
      compute_entitlements: { Args: { _user_id: string }; Returns: Json }
      compute_idearank: { Args: never; Returns: undefined }
      compute_person_confidence: {
        Args: { _person_id: string }
        Returns: number
      }
      compute_person_dimensions: {
        Args: { _person_id: string }
        Returns: undefined
      }
      compute_person_traits: {
        Args: { _person_id: string }
        Returns: undefined
      }
      compute_profile_trust: { Args: { _profile_id: string }; Returns: Json }
      compute_user_intelligence: { Args: { _user_id: string }; Returns: Json }
      data_pipeline_stats: { Args: never; Returns: Json }
      deactivate_emergency: { Args: { _control_id: string }; Returns: boolean }
      deduct_neurons: {
        Args: { _amount: number; _service_id?: string; _user_id: string }
        Returns: number
      }
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
      evaluate_tier_progression: { Args: { _user_id: string }; Returns: Json }
      finops_dashboard_stats: { Args: never; Returns: Json }
      forum_mark_solution: {
        Args: { _post_id: string; _thread_id: string }
        Returns: Json
      }
      forum_vote: {
        Args: { _target_id: string; _target_type: string; _vote_value: number }
        Returns: Json
      }
      generate_daily_challenges: { Args: never; Returns: undefined }
      get_active_services: {
        Args: never
        Returns: {
          base_neurons: number
          id: string
          pipeline_class: string
          preview_enabled: boolean
          service_key: string
        }[]
      }
      get_capacity_status: {
        Args: never
        Returns: {
          premium_only_mode: boolean
          queue_depth: number
          utilization: number
        }[]
      }
      get_leaderboard_karma: {
        Args: { lim?: number }
        Returns: {
          karma: number
          user_id: string
        }[]
      }
      get_leaderboard_streaks: {
        Args: { lim?: number }
        Returns: {
          current_streak: number
          longest_streak: number
          user_id: string
        }[]
      }
      get_leaderboard_xp: {
        Args: { lim?: number }
        Returns: {
          level: number
          rank_name: string
          total_xp: number
          user_id: string
        }[]
      }
      get_public_profile:
        | { Args: { _username: string }; Returns: Json }
        | {
            Args: { p_user_id: string }
            Returns: {
              avatar_url: string
              bio: string
              created_at: string
              display_name: string
              id: string
              user_id: string
              username: string
            }[]
          }
      get_public_profiles: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
          username: string
        }[]
      }
      get_tier_xp_multiplier: { Args: { _user_id: string }; Returns: number }
      get_user_storage_usage: {
        Args: { p_user_id: string }
        Returns: {
          bucket_id: string
          file_count: number
          total_bytes: number
        }[]
      }
      has_admin_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_permission: {
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
      hybrid_search_neurons: {
        Args: {
          _date_from?: string
          _date_to?: string
          _entity_type?: string
          _match_count?: number
          _min_confidence?: number
          _query: string
          _query_embedding: string
          _rrf_k?: number
          _user_id: string
        }
        Returns: {
          content_category: string
          created_at: string
          keyword_rank: number
          lifecycle: string
          neuron_id: number
          rrf_score: number
          score: number
          title: string
          vector_rank: number
        }[]
      }
      i18n_coverage_report: { Args: never; Returns: Json }
      increment_analysis_views: { Args: { _slug: string }; Returns: undefined }
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
      log_password_change: { Args: { p_user_id: string }; Returns: undefined }
      log_security_event: {
        Args: {
          p_event_type: string
          p_metadata?: Json
          p_severity?: string
          p_user_id: string
        }
        Returns: undefined
      }
      maintain_streak: { Args: { _user_id: string }; Returns: Json }
      mark_units_llm_ready: {
        Args: { _category_id: string; _min_quality?: number }
        Returns: number
      }
      match_neurons: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          neuron_id: number
          similarity: number
        }[]
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
      os_system_stats: { Args: never; Returns: Json }
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
      reject_profile: {
        Args: { _profile_id: string; _reason?: string; _user_id: string }
        Returns: Json
      }
      release_neurons: {
        Args: {
          _amount: number
          _description?: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
      }
      reprocess_profile: {
        Args: { _profile_id: string; _user_id: string }
        Returns: Json
      }
      reserve_credits: {
        Args: { _amount: number; _job_id: string; _user_id: string }
        Returns: boolean
      }
      reserve_neurons: {
        Args: {
          _amount: number
          _description?: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
      }
      reset_api_key_counters: { Args: never; Returns: undefined }
      retry_failed_job: { Args: { _job_id: string }; Returns: boolean }
      revoke_power_unlock: {
        Args: { _capability_key: string; _user_id: string }
        Returns: Json
      }
      rollback_profile: {
        Args: { _profile_id: string; _target_version: number; _user_id: string }
        Returns: Json
      }
      root2_nearest: { Args: { _price: number }; Returns: number }
      root2_validate: { Args: { _price: number }; Returns: boolean }
      run_intelligence_pipeline: { Args: { _person_id: string }; Returns: Json }
      runtime_system_stats: { Args: never; Returns: Json }
      score_contribution: {
        Args: { _contribution_id: string }
        Returns: number
      }
      search_neurons_hybrid: {
        Args: {
          _match_count?: number
          _query: string
          _query_embedding?: string
          _user_id?: string
        }
        Returns: {
          content_category: string
          keyword_rank: number
          neuron_id: number
          number: number
          rrf_score: number
          score: number
          semantic_rank: number
          status: string
          title: string
        }[]
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
      search_public_profiles: {
        Args: { lim?: number; query: string }
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
      settle_credits: {
        Args: { _amount: number; _job_id: string; _user_id: string }
        Returns: boolean
      }
      settle_neurons: {
        Args: {
          _amount: number
          _description?: string
          _job_id?: string
          _user_id: string
        }
        Returns: Json
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
      start_agent_execution: {
        Args: {
          _agent_id: string
          _estimated_credits?: number
          _input?: Json
          _user_id: string
        }
        Returns: Json
      }
      transition_profile_status: {
        Args: {
          _profile_id: string
          _reason_code?: string
          _to_status: Database["public"]["Enums"]["profile_visibility_status"]
        }
        Returns: Json
      }
      trunc_minute: { Args: { ts: string }; Returns: string }
      update_user_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      validate_profile_guardrails: {
        Args: { _profile_id: string }
        Returns: Json
      }
      validate_service_release: {
        Args: { p_service_unit_id: string }
        Returns: Json
      }
      vip_advance_month: { Args: { _user_id: string }; Returns: Json }
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
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "finops"
        | "support"
        | "reader"
        | "security"
      approval_status: "pending" | "approved" | "rejected" | "revision_needed"
      asset_type: "atomic_asset" | "compound_asset" | "system_asset"
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
      profile_risk_flag: "low" | "medium" | "high"
      profile_source_type: "podcast" | "interview" | "conversation"
      profile_type: "public_figure" | "local_figure" | "anonymized_client"
      profile_visibility_status: "draft" | "review" | "published" | "blocked"
      reuse_value: "low" | "medium" | "high"
      risk_level: "low" | "medium" | "high" | "critical"
      service_class: "A" | "B" | "C"
      service_level: "otos" | "mms" | "lcss"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "finops",
        "support",
        "reader",
        "security",
      ],
      approval_status: ["pending", "approved", "rejected", "revision_needed"],
      asset_type: ["atomic_asset", "compound_asset", "system_asset"],
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
      profile_risk_flag: ["low", "medium", "high"],
      profile_source_type: ["podcast", "interview", "conversation"],
      profile_type: ["public_figure", "local_figure", "anonymized_client"],
      profile_visibility_status: ["draft", "review", "published", "blocked"],
      reuse_value: ["low", "medium", "high"],
      risk_level: ["low", "medium", "high", "critical"],
      service_class: ["A", "B", "C"],
      service_level: ["otos", "mms", "lcss"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
