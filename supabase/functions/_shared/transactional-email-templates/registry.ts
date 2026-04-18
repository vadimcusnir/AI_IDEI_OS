/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcomeEmail } from './welcome-email.tsx'
import { template as paymentConfirmation } from './payment-confirmation.tsx'
import { template as creditsAdded } from './credits-added.tsx'
import { template as criticalAlert } from './critical-alert.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome-email': welcomeEmail,
  'payment-confirmation': paymentConfirmation,
  'credits-added': creditsAdded,
  'critical-alert': criticalAlert,
}
