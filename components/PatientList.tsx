
import React, { useState } from 'react';
import { Search, Plus, ChevronRight, X } from 'lucide-react';
import { Patient } from '../types';
import { useNavigate } from 'react-router-dom';

interface PatientListProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, onAddPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
        <button 
          onClick={() => {
            // Simple mock add for demo purposes
            const newId = (patients.length + 1).toString();
            onAddPatient({
              id: newId,
              name: "Novo Paciente",
              age: 65,
              gender: "Outro",
              nutritionalStatus: 'Bom',
              mobility: 'Boa',
              comorbidities: [],
              photoUrl: `https://picsum.photos/id/${Number(newId) + 50}/200/200`
            });
          }}
          className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Novo Paciente</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome ou ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
        />
        {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Limpar busca"
            >
                <X size={18} />
            </button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredPatients.map(patient => (
          <div 
            key={patient.id}
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                  <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {patient.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-xs">ID: {patient.id}</span>
                    <span>•</span>
                    <span>{patient.age} anos</span>
                    <span>•</span>
                    <span>{patient.gender}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-primary-500" size={20} />
            </div>
            {patient.comorbidities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {patient.comorbidities.map(c => (
                  <span key={c} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum paciente encontrado com o termo "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
