import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Activity, AlertCircle, Search, Plus, X, Loader2 } from 'lucide-react';
import { Patient, User } from '../types';
import { useNavigate } from 'react-router-dom';
import PatientFormModal from './PatientFormModal';
import StatCard from './StatCard';
import PatientListItem from './PatientListItem';
import { getUserPatients, createPatient, getLesionsForPatients } from '../services/firestoreService';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const userPatients = await getUserPatients(user.id);
        setPatients(userPatients);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [user.id]);

  const handleAddPatient = async (newPatient: Patient) => {
    try {
      // Create patient in Firestore
      const createdPatient = await createPatient(user.id, newPatient);
      setPatients([...patients, createdPatient]);
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Erro ao criar paciente. Verifique as permissões.');
    }
  };

  const handlePatientClick = useCallback((patientId: string) => {
    navigate(`/patients/${patientId}`);
  }, [navigate]);

  // Stats Logic
  const totalPatients = patients.length;
  const [totalLesions, setTotalLesions] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (patients.length === 0) {
        setTotalLesions(0);
        setActiveAlerts(0);
        return;
      }

      const patientIds = patients.map(p => p.id);
      const lesions = await getLesionsForPatients(patientIds);

      setTotalLesions(lesions.length);

      const alerts = lesions.filter(lesion => {
        // Check latest assessment for alerts
        // Priority: Denormalized latestAssessment > Last item in assessments array > null
        const latestAssessment = lesion.latestAssessment ||
          (lesion.assessments && lesion.assessments.length > 0 ? lesion.assessments[lesion.assessments.length - 1] : null);

        if (!latestAssessment) return false;

        // Alert conditions: Pain >= 8 OR Infection signs present
        const hasHighPain = latestAssessment.painLevel >= 8;
        const hasInfection = latestAssessment.infectionSigns && latestAssessment.infectionSigns.length > 0;

        return hasHighPain || hasInfection;
      }).length;

      setActiveAlerts(alerts);
    };

    fetchStats();
  }, [patients]);

  // Search Logic
  const filteredPatients = useMemo(() => patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.includes(searchTerm)
  ), [patients, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

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
          Icon={Users}
          color="bg-blue-50"
          subtext="+2 essa semana"
        />
        <StatCard 
          title="Lesões Ativas" 
          value={totalLesions} 
          Icon={Activity}
          color="bg-emerald-50"
          subtext="85% cicatrizando"
        />
        <StatCard 
          title="Casos Críticos" 
          value={activeAlerts} 
          Icon={AlertCircle}
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
              <PatientListItem
                key={patient.id}
                patient={patient}
                onClick={handlePatientClick}
              />
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
        onSave={handleAddPatient}
        userId={user.id}
      />
    </div>
  );
};

export default Dashboard;
