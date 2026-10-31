/**
 * Content of the profile page (`src/pages/profile.astro`).
 * Timeline, projects and certificates are MDX content collections in `src/content/`.
 */

export interface ProfileListItem {
  title: string;
  text: string;
}

export const currentFocus: ProfileListItem[] = [
  {
    title: 'Plugin Development',
    text: 'C# Plugins für Dataverse mit Best Practices und Performance-Optimierung',
  },
  {
    title: 'Script Development',
    text: 'Verwendung von TypeScript um PCFs und Formular-Logik anzupassen',
  },
  {
    title: 'CI/CD Optimization',
    text: 'Azure DevOps Pipelines, Quality Gates und Deployment-Automatisierung',
  },
  {
    title: 'Technical Consulting',
    text: 'Requirements Engineering, User Stories und Prozessanalyse für Dynamics 365',
  },
  {
    title: 'Configuration & Customization',
    text: 'Anpassung und Konfiguration von Dynamics 365 Komponenten',
  },
];

export const recentHighlights: ProfileListItem[] = [
  {
    title: 'Generischer Import',
    text: 'Komplettlösung für Massenimport von Daten in Dynamics 365',
  },
  {
    title: 'Code Quality & Security',
    text: 'Automatisierte Qualitäts- und Security-Gates in Azure DevOps',
  },
  {
    title: 'CRM PCF Komponenten',
    text: 'Benutzerzentrierte Controls für Dynamics 365 Service in React & TypeScript',
  },
  {
    title: 'Azure Integration',
    text: 'Serverless Datenflüsse, Service Bus Routing und Observability',
  },
  {
    title: 'DevOps Automation',
    text: 'Vollautomatische Release-Orchestrierung mit Monitoring und Backup',
  },
];
