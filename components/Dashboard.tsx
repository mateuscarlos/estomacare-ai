
import React, { useState } from 'react';
import { Users, Activity, AlertCircle, Search, Plus, X, ChevronRight } from 'lucide-react';
import { Patient, LesionType } from '../types';
import { useNavigate } from 'react-router-dom';
import PatientFormModal from './PatientFormModal';

interface DashboardProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ patients, onAddPatient }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Stats Logic
  const totalPatients = patients.length;
  // TODO: Implement totalLesions and activeAlerts by querying lesions collection
  const totalLesions = 0; // Will be implemented with separate query
  const activeAlerts = 0; // Will be implemented with separate query

  // Search Logic
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  const StatCard = ({ title, value, icon, color, subtext }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-').replace('50', '600') })}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500 mt-1">Bem-vindo de volta, Doutor. Aqui está o resumo de hoje.</p>
        </div>
        <button 
          onClick={() => setShowNewPatientModal(true)}
          className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all font-medium"
        >
          <Plus size={20} />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total de Pacientes" 
          value={totalPatients} 
          icon={<Users size={24} />} 
          color="bg-blue-50"
          subtext="+2 essa semana"
        />
        <StatCard 
          title="Lesões Ativas" 
          value={totalLesions} 
          icon={<Activity size={24} />} 
          color="bg-emerald-50"
          subtext="85% cicatrizando"
        />
        <StatCard 
          title="Casos Críticos" 
          value={activeAlerts} 
          icon={<AlertCircle size={24} />} 
          color="bg-red-50"
          subtext="Requerem atenção"
        />
      </div>

      {/* Patient List Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            Pacientes
            <span className="ml-2 bg-gray-200 text-gray-600 text-xs py-0.5 px-2 rounded-full">{filteredPatients.length}</span>
          </h2>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                    <X size={14} />
                </button>
            )}
          </div>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-1 divide-y divide-gray-100">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <div 
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-100 shadow-sm">
                    <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base group-hover:text-primary-600 transition-colors">
                      {patient.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-0.5">
                      <span className="bg-gray-100 px-1.5 rounded text-xs font-medium text-gray-600">ID: {patient.id}</span>
                      <span>{patient.age} anos</span>
                      <span>•</span>
                      <span className="text-gray-600">
                        {patient.age} anos • {patient.gender}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-16 sm:pl-0">
                   {/* Mini Summary of Comorbidities */}
                   <div className="hidden md:flex gap-1">
                      {patient.comorbidities.slice(0, 2).map(c => (
                        <span key={c} className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">
                          {c}
                        </span>
                      ))}
                      {patient.comorbidities.length > 2 && (
                         <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded-md border border-gray-100">+{patient.comorbidities.length - 2}</span>
                      )}
                   </div>
                   
                   <ChevronRight className="text-gray-300 group-hover:text-primary-500 transition-colors" size={20} />
                </div>
              </div>
            ))
          ) : (
             <div className="p-12 text-center">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                   <Search size={24} />
                </div>
                <h3 className="text-gray-900 font-medium">Nenhum paciente encontrado</h3>
                <p className="text-gray-500 text-sm mt-1">Tente buscar por outro nome ou ID.</p>
             </div>
          )}
        </div>
      </div>

      <PatientFormModal 
        isOpen={showNewPatientModal} 
        onClose={() => setShowNewPatientModal(false)} 
        onSave={onAddPatient}
      />
    </div>
  );
};

export default Dashboard;
