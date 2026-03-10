# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full technical audit documentation (PRD, Tech Spec, Security Audit, Route Tree, DB Schema)
- Bug Registry and Task Registry with prioritized findings
- Execution prompts for all priority tasks

## [1.0.0] — 2026-03-10

### Added
- Knowledge Graph with IdeaRank engine (5-component PVS, emergence detection)
- Neuron Editor with 15+ block types, slash commands, templates, AI tools
- 3-axis AI extraction pipeline (Internal, Narrative, Commercial)
- 11 AI services (Class A/B/C) with job tracking
- NEURONS credit economy with Stripe integration (Root2 pricing)
- Guest profile pages with AI-generated bios and expertise areas
- Public entity pages (insights, patterns, formulas, contradictions, applications, profiles)
- Topic taxonomy with hierarchical clustering
- Intelligence Dashboard with graph visualization and analytics
- Push notification system (Web Push via VAPID)
- Feedback system with admin response workflow
- Changelog system with AI-generated release notes
- i18n infrastructure (English canonical, extensible)
- Row-Level Security on all 28+ tables
- Role-based access control (admin, moderator, user)
- CI/CD pipelines (build, lint, test, security scan)
- Dependabot with grouped updates
- Enterprise-grade GitHub governance (templates, policies, workflows)

### Security
- RLS policies on all database tables
- `has_role()` SECURITY DEFINER function for admin checks
- Stripe secret key isolated to edge functions
- Private storage bucket for episode files
- Email verification required for all signups
