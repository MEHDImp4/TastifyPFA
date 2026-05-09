import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Users, Calendar, Briefcase } from 'lucide-react';
import hrService from './hrService';
import { Employe, EmployeFormData } from './types';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import { Pagination } from '../../components/ui/Pagination';
import { ShiftPlanning } from './components/ShiftPlanning';
import { RecruitmentModule } from './components/RecruitmentModule';

type HrTab = 'EMPLOYEES' | 'PLANNING' | 'RECRUITMENT';

const HrPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employe | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<HrTab>('EMPLOYEES');
  const pageSize = 8;

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await hrService.getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSave = async (formData: EmployeFormData) => {
    if (editingEmployee) {
      await hrService.updateEmployee(editingEmployee.id, formData);
    } else {
      await hrService.createEmployee(formData);
    }
    fetchEmployees();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver cet employé ? Son compte utilisateur sera révoqué.')) {
      try {
        await hrService.deleteEmployee(id);
        fetchEmployees();
      } catch (error) {
        console.error('Failed to delete employee', error);
      }
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.user_details.first_name} ${emp.user_details.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      fullName.includes(search) ||
      emp.poste.toLowerCase().includes(search) ||
      emp.cin.toLowerCase().includes(search) ||
      emp.user_details.username.toLowerCase().includes(search)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Ressources Humaines</h1>
          <p className="mt-1 text-sm font-medium text-foreground-muted">Gérez vos équipes, les accès et les plannings.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'EMPLOYEES' && (
            <>
              <button className="flex h-11 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 text-sm font-bold text-foreground-muted transition-all hover:bg-white/10 hover:text-white">
                <Download size={16} />
                Exporter
              </button>
              <button 
                onClick={() => {
                  setEditingEmployee(null);
                  setIsModalOpen(true);
                }}
                className="flex h-11 items-center gap-2 rounded-xl bg-teal px-6 text-sm font-black text-surface shadow-lg shadow-teal/20 transition-all hover:bg-teal-light active:scale-95"
              >
                <Plus size={18} />
                Nouvel Employé
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-px">
        {[
          { id: 'EMPLOYEES', label: 'Effectif', icon: Users },
          { id: 'PLANNING', label: 'Planning', icon: Calendar },
          { id: 'RECRUITMENT', label: 'Recrutement', icon: Briefcase },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as HrTab)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-teal text-teal bg-teal/5' 
                : 'border-transparent text-foreground-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-6">
          {/* Stats Quick View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Effectif Total', value: employees.length, sub: 'Employés actifs', color: 'teal' },
              { label: 'Masse Salariale', value: `${employees.reduce((acc, curr) => acc + parseFloat(curr.salaire), 0).toLocaleString()} MAD`, sub: 'Mensuel estimé', color: 'blue' },
              { label: 'Postes Ouverts', value: '0', sub: 'Recrutement en pause', color: 'amber' },
            ].map((stat, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:border-white/10 hover:bg-white/[0.07]">
                <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-${stat.color}/5 blur-2xl transition-all group-hover:bg-${stat.color}/10`} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">{stat.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{stat.value}</p>
                <p className="mt-1 text-[11px] font-bold text-foreground-muted/60">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" size={18} />
              <input
                type="text"
                placeholder="Rechercher par nom, poste, CIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-2xl border border-white/5 bg-white/5 pl-12 pr-4 text-sm text-white placeholder-white/20 transition-all focus:border-teal/50 focus:bg-white/10 outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-white/5 bg-white/5">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal/20 border-t-teal"></div>
                <p className="text-sm font-bold text-foreground-muted">Chargement des données...</p>
              </div>
            </div>
          ) : (
            <>
              <EmployeeTable 
                employees={paginatedEmployees} 
                onEdit={(emp) => {
                  setEditingEmployee(emp);
                  setIsModalOpen(true);
                }}
                onDelete={handleDelete}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredEmployees.length}
                itemLabel="employes"
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      )}

      {activeTab === 'PLANNING' && <ShiftPlanning />}
      
      {activeTab === 'RECRUITMENT' && <RecruitmentModule />}

      {/* Modal Form */}
      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        initialData={editingEmployee}
      />
    </div>
  );
};

export default HrPage;
