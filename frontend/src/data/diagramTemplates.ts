import type { Edge, Node } from 'reactflow';
import type { DiagramType } from '../types';

export interface DiagramTemplate {
  nodes: Node[];
  edges: Edge[];
}

const node = (id: string, type: string, x: number, y: number, label: string, extra: Record<string, unknown> = {}): Node => ({
  id,
  type: 'diagramNode',
  position: { x, y },
  width: Number(extra.width ?? 160),
  height: Number(extra.height ?? 80),
  data: { label, shape: type, fill: '#ffffff', borderColor: '#2563eb', ...extra },
});

const edge = (id: string, source: string, target: string, label = '', edgeType = 'association'): Edge => ({
  id,
  source,
  target,
  type: 'diagramEdge',
  label,
  data: { edgeType, label },
});

export const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
  FLOWCHART: 'Flowchart',
  PROCESS: 'Processus',
  DECISION: 'Decision',
  UML: 'UML',
  BPMN: 'BPMN',
  ERD: 'ERD',
  NETWORK: 'Reseau',
  MINDMAP: 'Mindmap',
  USE_CASE: 'Use Case',
  CLASS: 'Classe',
  SEQUENCE: 'Sequence',
  ACTIVITY: 'Activite',
  COMPONENT: 'Composant',
  DEPLOYMENT: 'Deploiement',
  CUSTOM: 'Libre',
};

export const EDITOR_DIAGRAM_TYPES: DiagramType[] = [
  'USE_CASE',
  'CLASS',
  'SEQUENCE',
  'ACTIVITY',
  'COMPONENT',
  'DEPLOYMENT',
];

export const diagramTemplates: Partial<Record<DiagramType, DiagramTemplate>> = {
  USE_CASE: {
    nodes: [
      node('actor-user', 'actor', 20, 100, 'Utilisateur', { width: 90, height: 120 }),
      node('actor-admin', 'actor', 20, 280, 'Admin', { width: 90, height: 120 }),
      node('boundary', 'systemBoundary', 190, 40, 'AgileFlow', { width: 560, height: 420, borderColor: '#64748b' }),
      node('login', 'useCase', 300, 100, 'Se connecter', { width: 170, height: 80 }),
      node('register', 'useCase', 510, 100, 'Creer un compte', { width: 170, height: 80 }),
      node('dashboard', 'useCase', 300, 250, 'Voir dashboard', { width: 170, height: 80 }),
      node('manage-users', 'useCase', 510, 250, 'Gerer utilisateurs', { width: 190, height: 80 }),
      node('auth', 'useCase', 405, 365, 'Authentifier', { stereotype: 'include', width: 170, height: 80 }),
    ],
    edges: [
      edge('e-user-login', 'actor-user', 'login'),
      edge('e-user-register', 'actor-user', 'register'),
      edge('e-user-dashboard', 'actor-user', 'dashboard'),
      edge('e-admin-manage', 'actor-admin', 'manage-users'),
      edge('e-login-auth', 'login', 'auth', 'include', 'dependency'),
    ],
  },
  CLASS: {
    nodes: [
      node('class-user', 'class', 60, 80, 'User', { attributes: ['- id: Long', '- username: String', '- email: String'], methods: ['+ login(): boolean', '+ getOrders(): List'] }),
      node('class-order', 'class', 360, 90, 'Order', { attributes: ['- id: Long', '- total: BigDecimal'], methods: ['+ calculateTotal(): BigDecimal'] }),
      node('class-product', 'class', 660, 100, 'Product', { attributes: ['- id: Long', '- name: String', '- price: BigDecimal'], methods: ['+ isAvailable(): boolean'] }),
    ],
    edges: [
      edge('e-user-order', 'class-user', 'class-order', '1..*', 'association'),
      edge('e-order-product', 'class-order', 'class-product', '*..*', 'composition'),
    ],
  },
  SEQUENCE: {
    nodes: [
      node('life-user', 'lifeline', 80, 40, 'Utilisateur', { height: 420 }),
      node('life-front', 'lifeline', 360, 40, 'Frontend', { height: 420 }),
      node('life-back', 'lifeline', 640, 40, 'Backend', { height: 420 }),
    ],
    edges: [
      edge('e-login', 'life-user', 'life-front', 'login(credentials)', 'message'),
      edge('e-validate', 'life-front', 'life-back', 'validate()', 'message'),
      edge('e-token', 'life-back', 'life-front', 'JWT token', 'return'),
      edge('e-redirect', 'life-front', 'life-user', 'redirect', 'return'),
    ],
  },
  ACTIVITY: {
    nodes: [
      node('start', 'start', 120, 160, ''),
      node('fill', 'activity', 260, 140, 'Remplir formulaire'),
      node('validate', 'activity', 500, 140, 'Valider'),
      node('valid', 'decision', 740, 130, 'Valide ?'),
      node('save', 'activity', 970, 80, 'Enregistrer utilisateur'),
      node('error', 'activity', 970, 220, 'Afficher erreur'),
      node('end', 'end', 1220, 100, ''),
    ],
    edges: [
      edge('e1', 'start', 'fill'),
      edge('e2', 'fill', 'validate'),
      edge('e3', 'validate', 'valid'),
      edge('e4', 'valid', 'save', 'Oui'),
      edge('e5', 'valid', 'error', 'Non'),
      edge('e6', 'save', 'end'),
      edge('e7', 'error', 'fill'),
    ],
  },
  COMPONENT: {
    nodes: [
      node('frontend', 'component', 120, 120, 'Frontend React'),
      node('api', 'component', 440, 120, 'Backend API'),
      node('db', 'component', 760, 120, 'Base MySQL'),
    ],
    edges: [
      edge('e-front-api', 'frontend', 'api', 'REST/STOMP', 'dependency'),
      edge('e-api-db', 'api', 'db', 'JPA', 'dependency'),
    ],
  },
  DEPLOYMENT: {
    nodes: [
      node('client', 'nodeBox', 80, 120, 'Navigateur client', { stereotype: 'device' }),
      node('web', 'nodeBox', 420, 120, 'Serveur Web', { stereotype: 'node' }),
      node('database', 'nodeBox', 760, 120, 'Serveur Database', { stereotype: 'node' }),
      node('jar', 'artifact', 460, 260, 'agileflow.jar'),
    ],
    edges: [
      edge('e-client-web', 'client', 'web', 'HTTPS', 'communication'),
      edge('e-web-db', 'web', 'database', 'JDBC', 'communication'),
    ],
  },
};

export const getTemplate = (type: DiagramType): DiagramTemplate => {
  const template = diagramTemplates[type] ?? { nodes: [node('start-node', 'rectangle', 160, 120, 'Nouveau diagramme')], edges: [] };
  return {
    nodes: template.nodes.map((item) => ({ ...item, data: { ...item.data } })),
    edges: template.edges.map((item) => ({ ...item, data: { ...item.data } })),
  };
};
