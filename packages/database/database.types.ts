export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      agreements: {
        Row: {
          agreement_type: string
          counterparty: string
          created_at: string
          id: string
          key_terms: string
          notes: string
          project_id: string
          status: string
          status_date: string | null
          user_id: string
        }
        Insert: {
          agreement_type: string
          counterparty?: string
          created_at?: string
          id?: string
          key_terms?: string
          notes?: string
          project_id: string
          status?: string
          status_date?: string | null
          user_id?: string
        }
        Update: {
          agreement_type?: string
          counterparty?: string
          created_at?: string
          id?: string
          key_terms?: string
          notes?: string
          project_id?: string
          status?: string
          status_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bourne_agent_messages: {
        Row: {
          message: string
          message_id: string
          message_type: string
          metadata: Json
          session_id: string
          timestamp: string
          turn_id: string
        }
        Insert: {
          message?: string
          message_id: string
          message_type: string
          metadata?: Json
          session_id: string
          timestamp?: string
          turn_id: string
        }
        Update: {
          message?: string
          message_id?: string
          message_type?: string
          metadata?: Json
          session_id?: string
          timestamp?: string
          turn_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bourne_agent_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "bourne_agent_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bourne_agent_sessions: {
        Row: {
          agent_name: string
          build_id: string
          created_at: string
          id: string
          organization_id: string | null
          runtime: string
          runtime_resume_token: string | null
          runtime_session_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name: string
          build_id: string
          created_at?: string
          id: string
          organization_id?: string | null
          runtime: string
          runtime_resume_token?: string | null
          runtime_session_id?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_name?: string
          build_id?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          runtime?: string
          runtime_resume_token?: string | null
          runtime_session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bourne_artifact_revisions: {
        Row: {
          artifact_id: string
          content: string | null
          created_at: string
          function_name: string
          id: string
          mime_type: string
          name: string
          run_id: string
          size_bytes: number
        }
        Insert: {
          artifact_id: string
          content?: string | null
          created_at?: string
          function_name: string
          id: string
          mime_type: string
          name: string
          run_id: string
          size_bytes: number
        }
        Update: {
          artifact_id?: string
          content?: string | null
          created_at?: string
          function_name?: string
          id?: string
          mime_type?: string
          name?: string
          run_id?: string
          size_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "bourne_artifact_revisions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "bourne_artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      bourne_artifacts: {
        Row: {
          created_at: string
          description: string
          id: string
          organization_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          organization_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          organization_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bourne_uploads: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          name: string
          organization_id: string | null
          size_bytes: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          mime_type: string
          name: string
          organization_id?: string | null
          size_bytes: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          name?: string
          organization_id?: string | null
          size_bytes?: number
          user_id?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          area: string
          body: string
          channel: string
          contact_id: string | null
          created_at: string
          direction: string
          follow_up_date: string | null
          id: string
          occurred_at: string | null
          project_id: string
          response_summary: string
          status: string
          subject: string
          to_address: string
          user_id: string
        }
        Insert: {
          area?: string
          body?: string
          channel?: string
          contact_id?: string | null
          created_at?: string
          direction?: string
          follow_up_date?: string | null
          id?: string
          occurred_at?: string | null
          project_id: string
          response_summary?: string
          status?: string
          subject?: string
          to_address?: string
          user_id?: string
        }
        Update: {
          area?: string
          body?: string
          channel?: string
          contact_id?: string | null
          created_at?: string
          direction?: string
          follow_up_date?: string | null
          id?: string
          occurred_at?: string | null
          project_id?: string
          response_summary?: string
          status?: string
          subject?: string
          to_address?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          lab_id: string | null
          name: string
          notes: string
          organization: string
          phone: string
          project_id: string | null
          role: string
          source_url: string
          technology_id: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          lab_id?: string | null
          name: string
          notes?: string
          organization?: string
          phone?: string
          project_id?: string | null
          role?: string
          source_url?: string
          technology_id?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          lab_id?: string | null
          name?: string
          notes?: string
          organization?: string
          phone?: string
          project_id?: string | null
          role?: string
          source_url?: string
          technology_id?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_workspaces: {
        Row: {
          created_at: string
          lab_id: string
          opportunity_ids: string[]
          project_id: string
          proposal_id: string
          technology_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          lab_id: string
          opportunity_ids: string[]
          project_id: string
          proposal_id: string
          technology_ids: string[]
          user_id?: string
        }
        Update: {
          created_at?: string
          lab_id?: string
          opportunity_ids?: string[]
          project_id?: string
          proposal_id?: string
          technology_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          body: string
          created_at: string
          id: string
          is_ai_generated: boolean
          kind: string
          opportunity_id: string | null
          project_id: string | null
          proposal_section_id: string | null
          source_url: string
          technology_id: string | null
          title: string
          updated_at: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          kind?: string
          opportunity_id?: string | null
          project_id?: string | null
          proposal_section_id?: string | null
          source_url?: string
          technology_id?: string | null
          title: string
          updated_at?: string
          upload_id?: string | null
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          kind?: string
          opportunity_id?: string | null
          project_id?: string | null
          proposal_section_id?: string | null
          source_url?: string
          technology_id?: string | null
          title?: string
          updated_at?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_proposal_section_id_fkey"
            columns: ["proposal_section_id"]
            isOneToOne: false
            referencedRelation: "proposal_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          assumptions: string
          id: string
          missing_info: string
          scores: Json
          technology_id: string
          updated_at: string
          user_id: string
          weights: Json
        }
        Insert: {
          assumptions?: string
          id?: string
          missing_info?: string
          scores?: Json
          technology_id: string
          updated_at?: string
          user_id?: string
          weights?: Json
        }
        Update: {
          assumptions?: string
          id?: string
          missing_info?: string
          scores?: Json
          technology_id?: string
          updated_at?: string
          user_id?: string
          weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: true
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          created_at: string
          current_solution: string
          id: string
          interview_date: string | null
          interviewee: string
          key_quotes: string
          next_step: string
          notes: string
          organization: string
          pilot_interest: boolean
          problem_confirmed: string
          project_id: string
          role: string
          segment: string
          user_id: string
          willingness_to_pay: string
        }
        Insert: {
          created_at?: string
          current_solution?: string
          id?: string
          interview_date?: string | null
          interviewee: string
          key_quotes?: string
          next_step?: string
          notes?: string
          organization?: string
          pilot_interest?: boolean
          problem_confirmed?: string
          project_id: string
          role?: string
          segment?: string
          user_id?: string
          willingness_to_pay?: string
        }
        Update: {
          created_at?: string
          current_solution?: string
          id?: string
          interview_date?: string | null
          interviewee?: string
          key_quotes?: string
          next_step?: string
          notes?: string
          organization?: string
          pilot_interest?: boolean
          problem_confirmed?: string
          project_id?: string
          role?: string
          segment?: string
          user_id?: string
          willingness_to_pay?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      labs: {
        Row: {
          agency: string
          agreement_types_offered: string
          created_at: string
          id: string
          name: string
          notes: string
          source_url: string
          tto_email: string
          tto_name: string
          tto_phone: string
          tto_url: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          agency?: string
          agreement_types_offered?: string
          created_at?: string
          id?: string
          name: string
          notes?: string
          source_url?: string
          tto_email?: string
          tto_name?: string
          tto_phone?: string
          tto_url?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Update: {
          agency?: string
          agreement_types_offered?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string
          source_url?: string
          tto_email?: string
          tto_name?: string
          tto_phone?: string
          tto_url?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      licensing_items: {
        Row: {
          confidence: string
          explainer: string
          finding: string
          id: string
          project_id: string
          question: string
          sort: number
          source_url: string
          status: string
          topic: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          confidence?: string
          explainer?: string
          finding?: string
          id?: string
          project_id: string
          question: string
          sort?: number
          source_url?: string
          status?: string
          topic: string
          user_id?: string
          verified_at?: string | null
        }
        Update: {
          confidence?: string
          explainer?: string
          finding?: string
          id?: string
          project_id?: string
          question?: string
          sort?: number
          source_url?: string
          status?: string
          topic?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licensing_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          agency: string
          award_amount: string
          award_type: string
          branch: string
          close_date: string | null
          created_at: string
          deadline_checked_at: string | null
          deadline_source_url: string
          deadline_verified: boolean
          duration: string
          eligibility: string
          fit_notes: string
          id: string
          is_sample: boolean
          last_checked_at: string | null
          open_date: string | null
          phase: string
          program: string
          relevance: string
          required_documents: string
          required_work: string
          research_institution_reqs: string
          restrictions: string
          small_business_reqs: string
          solicitation_number: string
          solicitation_title: string
          source_text: string
          source_url: string
          submission_system: string
          technical_objective: string
          topic_number: string
          topic_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency?: string
          award_amount?: string
          award_type?: string
          branch?: string
          close_date?: string | null
          created_at?: string
          deadline_checked_at?: string | null
          deadline_source_url?: string
          deadline_verified?: boolean
          duration?: string
          eligibility?: string
          fit_notes?: string
          id?: string
          is_sample?: boolean
          last_checked_at?: string | null
          open_date?: string | null
          phase?: string
          program?: string
          relevance?: string
          required_documents?: string
          required_work?: string
          research_institution_reqs?: string
          restrictions?: string
          small_business_reqs?: string
          solicitation_number?: string
          solicitation_title?: string
          source_text?: string
          source_url?: string
          submission_system?: string
          technical_objective?: string
          topic_number?: string
          topic_title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          agency?: string
          award_amount?: string
          award_type?: string
          branch?: string
          close_date?: string | null
          created_at?: string
          deadline_checked_at?: string | null
          deadline_source_url?: string
          deadline_verified?: boolean
          duration?: string
          eligibility?: string
          fit_notes?: string
          id?: string
          is_sample?: boolean
          last_checked_at?: string | null
          open_date?: string | null
          phase?: string
          program?: string
          relevance?: string
          required_documents?: string
          required_work?: string
          research_institution_reqs?: string
          restrictions?: string
          small_business_reqs?: string
          solicitation_number?: string
          solicitation_title?: string
          source_text?: string
          source_url?: string
          submission_system?: string
          technical_objective?: string
          topic_number?: string
          topic_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_tracking: {
        Row: {
          created_at: string
          id: string
          notes: string
          program_id: string
          project_id: string | null
          status: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          program_id: string
          project_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          program_id?: string
          project_id?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_tracking_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_tracking_task_fk"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_opportunities: {
        Row: {
          created_at: string
          id: string
          notes: string
          opportunity_id: string
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          opportunity_id: string
          project_id: string
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          opportunity_id?: string
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_opportunities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          application_summary: string
          archived: boolean
          business_thesis: string
          created_at: string
          id: string
          lab_id: string | null
          licensing_pathway: string
          licensing_pathway_notes: string
          licensing_status: string
          name: string
          problem: string
          risks: string
          status: string
          target_customer: string
          technology_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_summary?: string
          archived?: boolean
          business_thesis?: string
          created_at?: string
          id?: string
          lab_id?: string | null
          licensing_pathway?: string
          licensing_pathway_notes?: string
          licensing_status?: string
          name: string
          problem?: string
          risks?: string
          status?: string
          target_customer?: string
          technology_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_summary?: string
          archived?: boolean
          business_thesis?: string
          created_at?: string
          id?: string
          lab_id?: string | null
          licensing_pathway?: string
          licensing_pathway_notes?: string
          licensing_status?: string
          name?: string
          problem?: string
          risks?: string
          status?: string
          target_customer?: string
          technology_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_sections: {
        Row: {
          created_at: string
          draft: string
          draft_is_ai_generated: boolean
          evidence_needed: string
          guidance: string
          id: string
          kind: string
          proposal_id: string
          required_status: string
          solicitation_reference: string
          sort: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft?: string
          draft_is_ai_generated?: boolean
          evidence_needed?: string
          guidance?: string
          id?: string
          kind?: string
          proposal_id: string
          required_status?: string
          solicitation_reference?: string
          sort?: number
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          draft?: string
          draft_is_ai_generated?: boolean
          evidence_needed?: string
          guidance?: string
          id?: string
          kind?: string
          proposal_id?: string
          required_status?: string
          solicitation_reference?: string
          sort?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_sections_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          id: string
          notes: string
          opportunity_id: string
          project_id: string
          status: string
          submission_reference: string
          submitted_confirmed_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string
          opportunity_id: string
          project_id: string
          status?: string
          submission_reference?: string
          submitted_confirmed_at?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string
          opportunity_id?: string
          project_id?: string
          status?: string
          submission_reference?: string
          submitted_confirmed_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string
          answer_source_url: string
          answered_at: string | null
          area: string
          blocking: boolean
          created_at: string
          id: string
          kind: string
          opportunity_id: string | null
          project_id: string | null
          status: string
          technology_id: string | null
          text: string
          user_id: string
        }
        Insert: {
          answer?: string
          answer_source_url?: string
          answered_at?: string | null
          area?: string
          blocking?: boolean
          created_at?: string
          id?: string
          kind?: string
          opportunity_id?: string | null
          project_id?: string | null
          status?: string
          technology_id?: string | null
          text: string
          user_id?: string
        }
        Update: {
          answer?: string
          answer_source_url?: string
          answered_at?: string | null
          area?: string
          blocking?: boolean
          created_at?: string
          id?: string
          kind?: string
          opportunity_id?: string | null
          project_id?: string | null
          status?: string
          technology_id?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          checked_at: string
          claim: string
          created_at: string
          evidence_level: string
          excerpt: string
          field: string
          id: string
          opportunity_id: string | null
          project_id: string | null
          technology_id: string | null
          url: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          claim: string
          created_at?: string
          evidence_level?: string
          excerpt?: string
          field?: string
          id?: string
          opportunity_id?: string | null
          project_id?: string | null
          technology_id?: string | null
          url?: string
          user_id?: string
        }
        Update: {
          checked_at?: string
          claim?: string
          created_at?: string
          evidence_level?: string
          excerpt?: string
          field?: string
          id?: string
          opportunity_id?: string | null
          project_id?: string | null
          technology_id?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sources_technology_id_fkey"
            columns: ["technology_id"]
            isOneToOne: false
            referencedRelation: "technologies"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          project_id: string
          reason: string
          to_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          project_id: string
          reason?: string
          to_status: string
          user_id?: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          project_id?: string
          reason?: string
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          area: string
          blocker: string
          completed_at: string | null
          created_at: string
          created_by: string
          depends_on: string | null
          description: string
          due_date: string | null
          evidence: string
          id: string
          kind: string
          opportunity_id: string | null
          priority: number
          project_id: string
          proposal_id: string | null
          roadmap_category: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          area?: string
          blocker?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          depends_on?: string | null
          description?: string
          due_date?: string | null
          evidence?: string
          id?: string
          kind?: string
          opportunity_id?: string | null
          priority?: number
          project_id: string
          proposal_id?: string | null
          roadmap_category?: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          area?: string
          blocker?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          depends_on?: string | null
          description?: string
          due_date?: string | null
          evidence?: string
          id?: string
          kind?: string
          opportunity_id?: string | null
          priority?: number
          project_id?: string
          proposal_id?: string | null
          roadmap_category?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_depends_on_fkey"
            columns: ["depends_on"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      technologies: {
        Row: {
          agency: string
          applications: string
          archived: boolean
          category: string
          competitors: string
          created_at: string
          customers: string
          description: string
          id: string
          inventors: string
          ip_info: string
          is_sample: boolean
          lab_id: string | null
          lab_name: string
          last_reviewed_at: string | null
          licensing_status: string
          licensing_status_source: string
          maturity: string
          name: string
          open_questions: string
          patent_numbers: string
          sbir_relevance: string
          shortlisted: boolean
          source_fetched_at: string | null
          source_name: string
          source_text: string
          source_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency?: string
          applications?: string
          archived?: boolean
          category?: string
          competitors?: string
          created_at?: string
          customers?: string
          description?: string
          id?: string
          inventors?: string
          ip_info?: string
          is_sample?: boolean
          lab_id?: string | null
          lab_name?: string
          last_reviewed_at?: string | null
          licensing_status?: string
          licensing_status_source?: string
          maturity?: string
          name: string
          open_questions?: string
          patent_numbers?: string
          sbir_relevance?: string
          shortlisted?: boolean
          source_fetched_at?: string | null
          source_name?: string
          source_text?: string
          source_url?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          agency?: string
          applications?: string
          archived?: boolean
          category?: string
          competitors?: string
          created_at?: string
          customers?: string
          description?: string
          id?: string
          inventors?: string
          ip_info?: string
          is_sample?: boolean
          lab_id?: string | null
          lab_name?: string
          last_reviewed_at?: string | null
          licensing_status?: string
          licensing_status_source?: string
          maturity?: string
          name?: string
          open_questions?: string
          patent_numbers?: string
          sbir_relevance?: string
          shortlisted?: boolean
          source_fetched_at?: string | null
          source_name?: string
          source_text?: string
          source_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technologies_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          help_profile: Json
          profile: string
          updated_at: string
          user_id: string
          weights: Json
        }
        Insert: {
          help_profile?: Json
          profile?: string
          updated_at?: string
          user_id?: string
          weights?: Json
        }
        Update: {
          help_profile?: Json
          profile?: string
          updated_at?: string
          user_id?: string
          weights?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_user_id: { Args: never; Returns: string }
      manage_demo: { Args: { operation?: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
