export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  project: string;
  price: number;
  status: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  projects: Array<{
    project: string;
    price: number;
    status: string;
  }>;
  totalValue: number;
}

export interface DashboardStats {
  totalEmployees: number;
  totalProjects: number;
  totalAssignments: number;
  totalValue: number;
  statusCounts: {
    ongoing: number;
    completed: number;
    proposal: number;
  };
}

export interface DashboardApiResponse {
  success: boolean;
  source: 'google_sheets' | 'local_file';
  activeSheetUrl?: string;
  lastUpdated: string;
  errorMessage?: string | null;
  rawRows: ProjectItem[];
  employees: Employee[];
  stats: DashboardStats;
}
