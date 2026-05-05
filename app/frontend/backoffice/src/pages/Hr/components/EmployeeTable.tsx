import React from 'react';
import { Employe } from '../types';
import { User, Briefcase, Mail, Phone, CreditCard, Trash2, Edit } from 'lucide-react';

interface EmployeeTableProps {
  employees: Employe[];
  onEdit: (employee: Employe) => void;
  onDelete: (id: number) => void;
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-foreground-muted">
            <th className="px-6 py-4">Employé</th>
            <th className="px-6 py-4">Poste / Rôle</th>
            <th className="px-6 py-4">Salaire</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">CIN</th>
            <th className="px-6 py-4">Embauche</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {employees.map((emp) => (
            <tr key={emp.id} className="group transition-colors hover:bg-white/[0.02]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/10 border border-teal/20">
                    <User size={16} className="text-teal" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {emp.user_details.first_name} {emp.user_details.last_name}
                    </p>
                    <p className="text-[10px] text-foreground-muted">@{emp.user_details.username}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Briefcase size={12} className="text-foreground-muted" />
                  <div>
                    <p className="text-sm text-white">{emp.poste}</p>
                    <p className="text-[10px] font-black uppercase tracking-wider text-teal/80">
                      {emp.user_details.role}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-white">{parseFloat(emp.salaire).toLocaleString()} MAD</p>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                    <Mail size={10} />
                    <span>{emp.user_details.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                    <Phone size={10} />
                    <span>{emp.telephone || '-'}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-white">
                  <CreditCard size={12} className="text-foreground-muted" />
                  {emp.cin}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-foreground-muted">
                {new Date(emp.date_embauche).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onEdit(emp)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-foreground-muted transition-all hover:bg-teal/10 hover:text-teal"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(emp.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-foreground-muted transition-all hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center">
                <p className="text-sm text-foreground-muted font-medium italic">Aucun employé actif trouvé.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
