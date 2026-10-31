/**
 * Content of the services page (`src/pages/services.astro`).
 * The three engagement models come from `engagement-models.ts`.
 */

export const servicesHero = {
  eyebrow: 'Leistungen',
  title: 'Senior-Know-how für Dynamics 365, genau da, wo es fehlt.',
  text: 'Ich verstärke Dynamics-365-Teams als Developer und Technical Consultant: Plugins, PCF, Power Automate, Azure-Integrationen, ALM und Tests. Drei Modelle, je nachdem, wo ihr gerade steht.',
};

export interface ServiceItem {
  title: string;
  description: string;
  /** Optional link label (default "Mehr erfahren") — only rendered with `href` */
  cta?: string;
  href?: string;
  /** Anchor id, also used for the structured-data URL (`/services/#id`) */
  id?: string;
}

export const coreServices: ServiceItem[] = [
  {
    title: 'Dynamics 365 Prozess- & App-Design',
    description:
      'Workshops, User Journeys sowie modellgetriebene Apps, Canvas Apps und Custom Pages für optimierte Service-Prozesse.',
    id: 'prozessdesign',
  },
  {
    title: 'Power Platform Automation & Plugins',
    description:
      'C# Plugins, Power Automate Flows, PCF Controls und Dataverse-Logik für saubere Automatisierung und erweiterte Business-Regeln.',
    id: 'automation',
  },
  {
    title: 'Azure Integration & Automatisierung',
    description:
      'Azure Functions, Service Bus, Logic Apps und Event Driven Architecture verbinden Dynamics 365 mit CRM, ERP und Datenplattformen.',
    id: 'integration',
  },
  {
    title: 'UI Test Automation & Quality Gates',
    description:
      'Playwright-basierte Test-Frameworks für Business-kritische CRM-Workflows mit robusten Retry-Strategien und Quality Gates für sichere Deployments.',
    id: 'quality',
  },
  {
    title: 'DevOps, Qualität & Enablement',
    description:
      'CI/CD, ALM, Code-Quality-Gates und Team-Coaching sorgen für nachhaltige Delivery und dokumentierte Übergaben.',
    id: 'enablement',
  },
];

export const collaborationFormats = [
  {
    title: 'Team Augmentation',
    description:
      'Senior Dynamics Developer/Consultant, der dein Team verstärkt, in Sprints liefert und Wissen dokumentiert weitergibt.',
  },
  {
    title: 'Technical Spike',
    description:
      'Zwei Wochen Fokus: Prozessanalyse, technisches Konzept, Prototyping und priorisierte Umsetzungsempfehlungen.',
  },
  {
    title: 'Review & Coaching',
    description:
      'Health Check für bestehende Lösungen inklusive Code-Reviews, Pairing Sessions und Enablement der internen Entwickler:innen.',
  },
];
