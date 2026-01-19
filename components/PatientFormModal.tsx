
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, User, MapPin, Activity, Pill, Cigarette, Wine } from 'lucide-react';
import { Patient } from '../types';
import { analyticsService } from '../services/analyticsService';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  initialData?: Patient | null;
}

const PatientFormModal: React.FC<PatientFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    name: '',
    age: 0,
    gender: 'Outro',
    weightKg: 0,
    address: '',
    photoUrl: '',
    nutritionalStatus: 'Bom',
    mobility: 'Boa',
    smoker: false,
    smokerAmount: '',
    alcohol: false,
    alcoholAmount: '',
    comorbidities: [],
    allergies: [],
    medications: ''
  });

  // Helper strings for array inputs
  const [comorbiditiesStr, setComorbiditiesStr] = useState('');
  const [allergiesStr, setAllergiesStr] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setComorbiditiesStr(initialData.comorbidities.join(', '));
      setAllergiesStr(initialData.allergies?.join(', ') || '');
    } else {
      // Reset for new patient
      setFormData({
        name: '',
        age: 0,
        gender: 'Outro',
        weightKg: 0,
        address: '',
        photoUrl: '',
        nutritionalStatus: 'Bom',
        mobility: 'Boa',
        smoker: false,
        smokerAmount: '',
        alcohol: false,
        alcoholAmount: '',
        comorbidities: [],
        allergies: [],
        medications: ''
      });
      setComorbiditiesStr('');
      setAllergiesStr('');
    }
  }, [initialData, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process arrays
    const processedComorbidities = comorbiditiesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const processedAllergies = allergiesStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const patientToSave: Patient = {
      id: initialData?.id || Date.now().toString(),
      userId: initialData?.userId || '', // Set userId from initialData for edits, or empty for new (handled by parent)
      name: formData.name || 'Sem Nome',
      age: formData.age || 0,
      gender: formData.gender as 'M' | 'F' | 'Outro',
      weightKg: formData.weightKg,
      address: formData.address,
      nutritionalStatus: formData.nutritionalStatus as 'Bom' | 'Ruim',
      mobility: formData.mobility as 'Boa' | 'Baixa',
      smoker: formData.smoker,
      smokerAmount: formData.smokerAmount,
      alcohol: formData.alcohol,
      alcoholAmount: formData.alcoholAmount,
      comorbidities: processedComorbidities,
      allergies: processedAllergies,
      medications: formData.medications,
      photoUrl: formData.photoUrl || `https://ui-avatars.com/api/?name=${formData.name}&background=random`
    };

    // Log analytics
    if (initialData) {
      analyticsService.logPatientUpdated();
    } else {
      analyticsService.logPatientCreated();
    }

    onSave(patientToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Editar Paciente' : 'Novo Paciente'}</h2>
            <p className="text-sm text-gray-500">Preencha os dados completos do formulário de admissão.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {/* Section 1: Basic Info & Photo */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group w-32 h-32">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-md bg-gray-50 flex items-center justify-center">
                   {formData.photoUrl ? (
                     <img src={formData.photoUrl} className="w-full h-full object-cover" alt="Foto do Paciente" />
                   ) : (
                     <User size={48} className="text-gray-300" />
                   )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 shadow-sm transition-transform hover:scale-105">
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              <span className="text-xs text-gray-500 font-medium">Foto do Paciente</span>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Maria Silva" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                <div className="relative">
                   <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                   <input type="text" className="w-full border border-gray-300 rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" 
                     value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Rua, Número, Bairro, Cidade" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" 
                  value={formData.age || ''} onChange={e => setFormData({...formData, age: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none" 
                  value={formData.weightKg || ''} onChange={e => setFormData({...formData, weightKg: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Clinical Data */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Activity className="mr-2 text-primary-600" size={20} /> Dados Clínicos e Hábitos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado Nutricional</label>
                      <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        value={formData.nutritionalStatus} onChange={e => setFormData({...formData, nutritionalStatus: e.target.value as any})}>
                        <option value="Bom">Boa Nutrição</option>
                        <option value="Ruim">Nutrição Ruim</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobilidade</label>
                      <select className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                        value={formData.mobility} onChange={e => setFormData({...formData, mobility: e.target.value as any})}>
                        <option value="Boa">Boa Mobilidade</option>
                        <option value="Baixa">Baixa Mobilidade</option>
                      </select>
                    </div>
                 </div>

                 <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex items-start justify-between">
                       <div className="flex items-center">
                          <Cigarette size={18} className="text-gray-500 mr-2" />
                          <label className="text-sm font-medium text-gray-700">Fumante?</label>
                       </div>
                       <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" 
                          checked={formData.smoker} onChange={e => setFormData({...formData, smoker: e.target.checked})} />
                    </div>
                    {formData.smoker && (
                       <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm" 
                         placeholder="Quantos por dia?" value={formData.smokerAmount} onChange={e => setFormData({...formData, smokerAmount: e.target.value})} />
                    )}

                    <div className="flex items-start justify-between pt-2 border-t border-gray-200">
                       <div className="flex items-center">
                          <Wine size={18} className="text-gray-500 mr-2" />
                          <label className="text-sm font-medium text-gray-700">Consome Álcool?</label>
                       </div>
                       <input type="checkbox" className="w-5 h-5 text-primary-600 rounded" 
                          checked={formData.alcohol} onChange={e => setFormData({...formData, alcohol: e.target.checked})} />
                    </div>
                    {formData.alcohol && (
                       <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm" 
                         placeholder="Unidades por semana?" value={formData.alcoholAmount} onChange={e => setFormData({...formData, alcoholAmount: e.target.value})} />
                    )}
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comorbidades (separar por vírgula)</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" rows={2}
                      placeholder="Diabetes, Hipertensão..." value={comorbiditiesStr} onChange={e => setComorbiditiesStr(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alergias (separar por vírgula)</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" rows={2}
                      placeholder="Látex, Iodo, Prata..." value={allergiesStr} onChange={e => setAllergiesStr(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><Pill size={14} className="mr-1"/> Medicações em Uso</label>
                    <textarea className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" rows={2}
                      placeholder="Lista de medicamentos..." value={formData.medications} onChange={e => setFormData({...formData, medications: e.target.value})} />
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 rounded-b-2xl">
            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm flex items-center">
              <Save size={18} className="mr-2" /> {initialData ? 'Salvar Alterações' : 'Cadastrar Paciente'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PatientFormModal;
