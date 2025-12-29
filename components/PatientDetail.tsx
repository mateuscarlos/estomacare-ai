
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Brain, Calendar, Activity, 
  Save, Camera, X, CheckSquare, AlertTriangle, Droplet,
  ClipboardList, Maximize2, Sparkles, Loader2, MapPin, Edit2, FileText
} from 'lucide-react';
import { 
  Patient, Lesion, Assessment, ExudateLevel, ExudateType, 
  TissuePercentage, LesionType
} from '../types';
import { getTreatmentSuggestion, analyzeWoundImage } from '../services/firebaseGeminiService';
import { analyticsService } from '../services/analyticsService';
import { generateLesionPDF } from '../services/pdfService';
import { getPatientLesions, createLesion, updateLesion, deleteLesion } from '../services/firestoreService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PatientFormModal from './PatientFormModal';

interface PatientDetailProps {
  patients: Patient[];
  onUpdatePatient: (updatedPatient: Patient) => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patients, onUpdatePatient }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const patient = patients.find(p => p.id === id);

  // State for lesions from separate collection
  const [lesions, setLesions] = useState<Lesion[]>([]);
  const [loadingLesions, setLoadingLesions] = useState(true);
  
  const [activeLesionId, setActiveLesionId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // State for new assessment form
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  
  // State for viewing history details modal
  const [viewingAssessment, setViewingAssessment] = useState<Assessment | null>(null);

  // State for Edit Patient Modal
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);

  // State for Add Lesion Modal
  const [showAddLesionModal, setShowAddLesionModal] = useState(false);
  const [newLesionData, setNewLesionData] = useState<{
      type: LesionType;
      location: string;
      startDate: string;
      previousTreatments: string;
  }>({
      type: LesionType.PRESSURE_ULCER,
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      previousTreatments: ''
  });
  
  // Default Initial State based on complex object
  const initialAssessmentState: Partial<Assessment> = {
    widthMm: 0,
    heightMm: 0,
    depthMm: 0,
    tunnelingMm: 0,
    painLevel: 0,
    exudate: ExudateLevel.LOW,
    exudateType: ExudateType.SEROUS,
    tissueTypes: { necrotic: 0, slough: 0, granulation: 100, epithelialization: 0 },
    infectionSigns: [],
    woundEdges: [],
    periwoundSkin: [],
    notes: '',
    imageUrl: undefined
  };

  const [newAssessment, setNewAssessment] = useState<Partial<Assessment>>(initialAssessmentState);

  // Load lesions from Firestore when patient changes
  useEffect(() => {
    if (patient) {
      loadLesions();
    }
  }, [patient?.id]);

  const loadLesions = async () => {
    if (!patient) return;
    
    try {
      setLoadingLesions(true);
      const patientLesions = await getPatientLesions(patient.id);
      setLesions(patientLesions);
      
      // Set active lesion to first one if none selected
      if (!activeLesionId && patientLesions.length > 0) {
        setActiveLesionId(patientLesions[0].id);
      }
    } catch (error) {
      console.error('Error loading lesions:', error);
      alert('Erro ao carregar lesões');
    } finally {
      setLoadingLesions(false);
    }
  };

  if (!patient) return <div>Paciente não encontrado</div>;

  const activeLesion = lesions.find(l => l.id === activeLesionId);

  // Filter assessments that have AI suggestions for the consolidated history view
  const assessmentsWithSuggestions = activeLesion 
    ? [...activeLesion.assessments].filter(a => a.aiSuggestion).reverse()
    : [];

  const handleAIAnalysis = async (lesion: Lesion) => {
    const lastAssessment = lesion.assessments[lesion.assessments.length - 1];
    if (!lastAssessment) return;

    setIsAnalyzing(true);
    analyticsService.logAISuggestionRequest();
    try {
      // Build a richer context string including allergies and history
      const patientContext = `
        Paciente: ${patient.name} (${patient.age} anos, Gênero: ${patient.gender})
        Nutrição: ${patient.nutritionalStatus || 'N/A'}
        Mobilidade: ${patient.mobility || 'N/A'}
        Comorbidades: ${patient.comorbidities.join(', ') || 'Nenhuma'}
        Alergias Conhecidas: ${patient.allergies?.join(', ') || 'Nenhuma relatada'}
        Tratamentos Anteriores nesta lesão: ${lesion.previousTreatments?.join(', ') || 'Não informado'}
      `;
      
      const suggestion = await getTreatmentSuggestion(lesion, lastAssessment, patientContext);
      
      const updatedAssessments = [...lesion.assessments];
      updatedAssessments[updatedAssessments.length - 1] = {
        ...lastAssessment,
        aiSuggestion: suggestion
      };

      // Update lesion in Firestore
      await updateLesion(lesion.id, {
        assessments: updatedAssessments
      });
      
      // Update local state
      setLesions(lesions.map(l => l.id === lesion.id ? {...l, assessments: updatedAssessments} : l));
      
      // Log success
      analyticsService.logAISuggestionSuccess(lesion.type);
    } catch (error: any) {
      console.error(error);
      analyticsService.logAISuggestionError(error.message || 'Erro desconhecido');
      alert(error.message || "Erro ao conectar com a IA. Por favor, tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAssessment(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!newAssessment.imageUrl) return;

    setIsAnalyzingImage(true);
    analyticsService.logImageAnalysis();
    try {
      const analysis = await analyzeWoundImage(newAssessment.imageUrl);
      
      setNewAssessment(prev => ({
        ...prev,
        ...analysis,
        // Preserve dimensions and pain as they are hard to guess from image alone, but overwrite clinical observations
        notes: (prev.notes ? prev.notes + '\n' : '') + '[IA Visual]: ' + (analysis.notes || '')
      }));
      
      analyticsService.logImageAnalysisSuccess();
    } catch (e: any) {
      console.error(e);
      analyticsService.logImageAnalysisError(e.message || 'Erro desconhecido');
      alert("Não foi possível analisar a imagem. Tente novamente.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const removeImage = () => {
    setNewAssessment(prev => ({ ...prev, imageUrl: undefined }));
  };

  const toggleArrayItem = (field: 'infectionSigns' | 'woundEdges' | 'periwoundSkin', value: string) => {
    setNewAssessment(prev => {
      const currentArray = prev[field] || [];
      if (currentArray.includes(value)) {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...currentArray, value] };
      }
    });
  };

  const handleTissueChange = (key: keyof TissuePercentage, value: number) => {
    setNewAssessment(prev => ({
        ...prev,
        tissueTypes: {
            ...prev.tissueTypes!,
            [key]: value
        }
    }));
  };

  const handleAddAssessment = async () => {
    if (!activeLesion) return;

    const assessment: Assessment = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        widthMm: newAssessment.widthMm || 0,
        heightMm: newAssessment.heightMm || 0,
        depthMm: newAssessment.depthMm || 0,
        tunnelingMm: newAssessment.tunnelingMm || 0,
        exudate: newAssessment.exudate || ExudateLevel.NONE,
        exudateType: newAssessment.exudateType,
        tissueTypes: newAssessment.tissueTypes || { necrotic: 0, slough: 0, granulation: 0, epithelialization: 0},
        infectionSigns: newAssessment.infectionSigns || [],
        woundEdges: newAssessment.woundEdges || [],
        periwoundSkin: newAssessment.periwoundSkin || [],
        painLevel: newAssessment.painLevel || 0,
        notes: newAssessment.notes || '',
        imageUrl: newAssessment.imageUrl
    };

    const updatedAssessments = [...activeLesion.assessments, assessment];

    try {
      // Update lesion in Firestore
      await updateLesion(activeLesion.id, {
        assessments: updatedAssessments
      });
      
      // Update local state
      setLesions(lesions.map(l => l.id === activeLesion.id ? {...l, assessments: updatedAssessments} : l));
      
      setShowForm(false);
      setNewAssessment(initialAssessmentState);
    } catch (error) {
      console.error('Error adding assessment:', error);
      alert('Erro ao adicionar avaliação');
    }
  };

  const handleSaveNewLesion = async () => {
      if (!newLesionData.location) {
          alert("Por favor, informe a localização da lesão.");
          return;
      }

      const treatmentsArray = newLesionData.previousTreatments
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);

      try {
        // Create lesion in Firestore
        const createdLesion = await createLesion(patient.id, {
          type: newLesionData.type,
          location: newLesionData.location,
          startDate: newLesionData.startDate,
          previousTreatments: treatmentsArray,
          assessments: []
        });
        
        // Update local state
        setLesions([...lesions, createdLesion]);
        setActiveLesionId(createdLesion.id);
        setShowAddLesionModal(false);
        setNewLesionData({
            type: LesionType.PRESSURE_ULCER,
            location: '',
            startDate: new Date().toISOString().split('T')[0],
            previousTreatments: ''
        });
      } catch (error) {
        console.error('Error creating lesion:', error);
        alert('Erro ao criar lesão: ' + (error as Error).message);
      }
  };

  const handleExportPDF = () => {
      if (activeLesion && patient) {
          generateLesionPDF(patient, activeLesion);
      }
  };

  const chartData = activeLesion?.assessments && activeLesion.assessments.length > 0
    ? activeLesion.assessments.map(a => ({
        date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        area: parseFloat((a.widthMm * a.heightMm).toFixed(1))
      }))
    : [];

  // Options lists based on PDF
  const infectionOptions = ['Calor local', 'Odor fétido', 'Edema', 'Eritema', 'Febre', 'Pus/Abscesso', 'Celulite'];
  const edgeOptions = ['Maceração', 'Desidratação', 'Deslocamento', 'Epíbole (Enrolada)'];
  const skinOptions = ['Maceração', 'Escoriação', 'Xerose (Seca)', 'Hiperqueratose', 'Calo', 'Eczema'];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div className="flex items-center space-x-4 flex-1">
            <img src={patient.photoUrl} alt={patient.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                    <button 
                        onClick={() => setShowEditPatientModal(true)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Editar Paciente"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
                    <span>{patient.age} anos</span>
                    <span>•</span>
                    <span>{patient.gender}</span>
                    {patient.address && (
                        <>
                           <span>•</span>
                           <span className="flex items-center"><MapPin size={12} className="mr-0.5"/> {patient.address}</span>
                        </>
                    )}
                </div>
                {patient.allergies && patient.allergies.length > 0 && (
                   <div className="flex items-center mt-1 space-x-1">
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center">
                        <AlertTriangle size={10} className="mr-1"/> Alergia: {patient.allergies.join(', ')}
                      </span>
                   </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Lesion List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Lesões</h3>
            <button 
                onClick={() => setShowAddLesionModal(true)}
                className="text-primary-600 hover:bg-primary-50 p-1 rounded transition-colors"
                title="Nova Lesão"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="space-y-2">
            {loadingLesions ? (
              <div className="text-center py-4 text-gray-500">
                <Loader2 className="animate-spin mx-auto" size={24} />
                <p className="text-sm mt-2">Carregando lesões...</p>
              </div>
            ) : lesions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma lesão cadastrada</p>
            ) : (
              lesions.map(lesion => (
                <button
                  key={lesion.id}
                  onClick={() => setActiveLesionId(lesion.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    activeLesionId === lesion.id 
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{lesion.type}</p>
                  <p className="text-xs text-gray-500 truncate">{lesion.location}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Active Lesion Detail */}
        <div className="lg:col-span-3 space-y-6">
          {activeLesion ? (
            <>
              {/* Actions Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <div>
                    <h2 className="text-lg font-bold text-gray-900">{activeLesion.type}</h2>
                    <p className="text-gray-500 text-sm">{activeLesion.location}</p>
                 </div>
                 <div className="flex space-x-3">
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm border border-gray-200"
                        title="Baixar Relatório em PDF"
                    >
                        <FileText size={18} />
                        <span className="hidden sm:inline">Exportar PDF</span>
                    </button>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                    >
                        {showForm ? 'Cancelar' : 'Nova Avaliação'}
                    </button>
                    <button 
                        onClick={() => handleAIAnalysis(activeLesion)}
                        disabled={isAnalyzing}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-sm disabled:opacity-70"
                    >
                        <Brain size={18} />
                        <span>{isAnalyzing ? 'Analisando...' : 'IA Sugerir Tratamento'}</span>
                    </button>
                 </div>
              </div>

              {/* New Assessment Form - RESTRUCTURED BASED ON PDF */}
              {showForm && (
                  <div className="bg-white rounded-xl border border-primary-100 shadow-lg ring-1 ring-black/5 overflow-hidden">
                      <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex justify-between items-center">
                          <h3 className="font-bold text-primary-900 flex items-center">
                              <Activity className="mr-2" size={20}/> 
                              Nova Avaliação Clínica
                          </h3>
                          <span className="text-xs text-primary-600 bg-white px-2 py-1 rounded border border-primary-200">
                             {new Date().toLocaleDateString()}
                          </span>
                      </div>

                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Left Column */}
                          <div className="space-y-6">
                              {/* 1. Fotografia */}
                              <section>
                                  <label className="block text-sm font-bold text-gray-900 mb-2">1. Fotografia e Dor</label>
                                  <div className="flex flex-col gap-3">
                                      <div className="flex gap-4">
                                          <div className="flex-1">
                                            {!newAssessment.imageUrl ? (
                                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                  <Camera className="w-8 h-8 text-gray-400 mb-1" />
                                                  <span className="text-xs text-gray-500">Adicionar Foto</span>
                                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                              </label>
                                            ) : (
                                              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden group border border-gray-200">
                                                  <img src={newAssessment.imageUrl} className="w-full h-full object-contain" />
                                                  <button onClick={removeImage} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1">
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Nível de Dor (0-10)</label>
                                              <input 
                                                  type="number" min="0" max="10"
                                                  className="w-full border border-gray-300 rounded-lg p-2 text-center text-lg font-bold"
                                                  value={newAssessment.painLevel}
                                                  onChange={e => setNewAssessment({...newAssessment, painLevel: Number(e.target.value)})}
                                              />
                                          </div>
                                      </div>
                                      
                                      {/* AI Analysis Button */}
                                      {newAssessment.imageUrl && (
                                        <button 
                                          type="button"
                                          onClick={handleAnalyzeImage}
                                          disabled={isAnalyzingImage}
                                          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-70"
                                        >
                                          {isAnalyzingImage ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                          <span>{isAnalyzingImage ? 'Analisando Imagem...' : 'Preencher Formulário com IA'}</span>
                                        </button>
                                      )}
                                  </div>
                              </section>

                              {/* 2. Dimensões */}
                              <section>
                                  <label className="block text-sm font-bold text-gray-900 mb-2">2. Dimensões (mm)</label>
                                  <div className="grid grid-cols-3 gap-2">
                                      <div>
                                          <span className="text-xs text-gray-500">Comprimento</span>
                                          <input type="number" className="w-full border border-gray-300 rounded p-1.5" placeholder="C" 
                                              value={newAssessment.heightMm || ''} onChange={e => setNewAssessment({...newAssessment, heightMm: Number(e.target.value)})} />
                                      </div>
                                      <div>
                                          <span className="text-xs text-gray-500">Largura</span>
                                          <input type="number" className="w-full border border-gray-300 rounded p-1.5" placeholder="L"
                                              value={newAssessment.widthMm || ''} onChange={e => setNewAssessment({...newAssessment, widthMm: Number(e.target.value)})} />
                                      </div>
                                      <div>
                                          <span className="text-xs text-gray-500">Profund.</span>
                                          <input type="number" className="w-full border border-gray-300 rounded p-1.5" placeholder="P"
                                              value={newAssessment.depthMm || ''} onChange={e => setNewAssessment({...newAssessment, depthMm: Number(e.target.value)})} />
                                      </div>
                                  </div>
                              </section>

                              {/* 3. Leito da Ferida (TIME - T) */}
                              <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <label className="block text-sm font-bold text-gray-900 mb-2">3. Leito da Ferida (%)</label>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <span className="text-xs font-medium text-gray-700">Necrose (Preto)</span>
                                          <div className="flex items-center">
                                              <input type="number" className="w-16 border-gray-300 rounded p-1 text-sm" 
                                                  value={newAssessment.tissueTypes?.necrotic} onChange={e => handleTissueChange('necrotic', Number(e.target.value))} />
                                              <span className="ml-1 text-xs">%</span>
                                          </div>
                                      </div>
                                      <div>
                                          <span className="text-xs font-medium text-gray-700">Esfacelo (Amarelo)</span>
                                          <div className="flex items-center">
                                              <input type="number" className="w-16 border-gray-300 rounded p-1 text-sm" 
                                                  value={newAssessment.tissueTypes?.slough} onChange={e => handleTissueChange('slough', Number(e.target.value))} />
                                              <span className="ml-1 text-xs">%</span>
                                          </div>
                                      </div>
                                      <div>
                                          <span className="text-xs font-medium text-gray-700">Granulação (Vermelho)</span>
                                          <div className="flex items-center">
                                              <input type="number" className="w-16 border-gray-300 rounded p-1 text-sm" 
                                                  value={newAssessment.tissueTypes?.granulation} onChange={e => handleTissueChange('granulation', Number(e.target.value))} />
                                              <span className="ml-1 text-xs">%</span>
                                          </div>
                                      </div>
                                      <div>
                                          <span className="text-xs font-medium text-gray-700">Epitelização (Rosa)</span>
                                          <div className="flex items-center">
                                              <input type="number" className="w-16 border-gray-300 rounded p-1 text-sm" 
                                                  value={newAssessment.tissueTypes?.epithelialization} onChange={e => handleTissueChange('epithelialization', Number(e.target.value))} />
                                              <span className="ml-1 text-xs">%</span>
                                          </div>
                                      </div>
                                  </div>
                              </section>
                          </div>

                          {/* Right Column */}
                          <div className="space-y-6">
                              
                              {/* 4. Exsudato e Infecção (TIME - I/M) */}
                              <section>
                                  <label className="block text-sm font-bold text-gray-900 mb-2">4. Exsudato & Infecção</label>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div>
                                          <span className="text-xs text-gray-500">Volume</span>
                                          <select className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                              value={newAssessment.exudate} onChange={e => setNewAssessment({...newAssessment, exudate: e.target.value as ExudateLevel})}>
                                              {Object.values(ExudateLevel).map(v => <option key={v} value={v}>{v}</option>)}
                                          </select>
                                      </div>
                                      <div>
                                          <span className="text-xs text-gray-500">Aspecto</span>
                                          <select className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                              value={newAssessment.exudateType} onChange={e => setNewAssessment({...newAssessment, exudateType: e.target.value as ExudateType})}>
                                              {Object.values(ExudateType).map(v => <option key={v} value={v}>{v}</option>)}
                                          </select>
                                      </div>
                                  </div>
                                  <div>
                                      <span className="text-xs font-semibold text-gray-700 block mb-1">Sinais de Infecção:</span>
                                      <div className="flex flex-wrap gap-2">
                                          {infectionOptions.map(opt => (
                                              <button key={opt} onClick={() => toggleArrayItem('infectionSigns', opt)}
                                                  className={`px-2 py-1 text-xs rounded border ${newAssessment.infectionSigns?.includes(opt) ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-200 text-gray-600'}`}>
                                                  {opt}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              </section>

                              {/* 5. Bordas e Pele Perilesão (TIME - E) */}
                              <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <label className="block text-sm font-bold text-gray-900 mb-2">5. Bordas & Pele</label>
                                  
                                  <div className="mb-3">
                                      <span className="text-xs font-semibold text-gray-700 block mb-1">Bordas da Ferida:</span>
                                      <div className="flex flex-wrap gap-2">
                                          {edgeOptions.map(opt => (
                                              <button key={opt} onClick={() => toggleArrayItem('woundEdges', opt)}
                                                  className={`px-2 py-1 text-xs rounded border ${newAssessment.woundEdges?.includes(opt) ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-white border-gray-200 text-gray-600'}`}>
                                                  {opt}
                                              </button>
                                          ))}
                                      </div>
                                  </div>

                                  <div>
                                      <span className="text-xs font-semibold text-gray-700 block mb-1">Pele Perilesão:</span>
                                      <div className="flex flex-wrap gap-2">
                                          {skinOptions.map(opt => (
                                              <button key={opt} onClick={() => toggleArrayItem('periwoundSkin', opt)}
                                                  className={`px-2 py-1 text-xs rounded border ${newAssessment.periwoundSkin?.includes(opt) ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-white border-gray-200 text-gray-600'}`}>
                                                  {opt}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              </section>

                              <section>
                                  <label className="block text-sm font-bold text-gray-900 mb-1">Notas Gerais</label>
                                  <textarea className="w-full border border-gray-300 rounded-lg p-2 text-sm" rows={2}
                                      value={newAssessment.notes} onChange={e => setNewAssessment({...newAssessment, notes: e.target.value})} />
                              </section>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                          <button onClick={handleAddAssessment} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium flex items-center shadow-sm">
                              <Save size={18} className="mr-2"/> Salvar Avaliação
                          </button>
                      </div>
                  </div>
              )}

              {/* Progress Chart */}
              {activeLesion && chartData && chartData.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Evolução da Área (mm²)</h3>
                  <div style={{ width: '100%', height: 256, minHeight: 256, minWidth: 300, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={256} minWidth={300} minHeight={256}>
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Line type="monotone" dataKey="area" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* AI Suggestion Display */}
              {activeLesion.assessments[activeLesion.assessments.length - 1]?.aiSuggestion && (
                  <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Brain size={100} className="text-indigo-600" />
                      </div>
                      <h3 className="text-indigo-900 font-bold text-lg mb-4 flex items-center">
                          <Brain className="mr-2" size={24}/> Sugestão do Assistente IA (Atual)
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-6 relative z-10">
                          <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Limpeza</p>
                              <p className="text-gray-800">{activeLesion.assessments[activeLesion.assessments.length - 1].aiSuggestion?.cleaning}</p>
                          </div>
                          <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Cobertura Primária</p>
                              <p className="text-gray-800">{activeLesion.assessments[activeLesion.assessments.length - 1].aiSuggestion?.primaryDressing}</p>
                          </div>
                           <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Cobertura Secundária</p>
                              <p className="text-gray-800">{activeLesion.assessments[activeLesion.assessments.length - 1].aiSuggestion?.secondaryDressing}</p>
                          </div>
                           <div className="bg-white/60 p-4 rounded-lg backdrop-blur-sm">
                              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Frequência</p>
                              <p className="text-gray-800">{activeLesion.assessments[activeLesion.assessments.length - 1].aiSuggestion?.frequency}</p>
                          </div>
                      </div>
                      <div className="mt-4 bg-white/60 p-4 rounded-lg backdrop-blur-sm relative z-10">
                          <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Racional Clínico</p>
                          <p className="text-gray-700 italic">"{activeLesion.assessments[activeLesion.assessments.length - 1].aiSuggestion?.rationale}"</p>
                      </div>
                  </div>
              )}

              {/* History Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">Histórico de Avaliações</h3>
                    <p className="text-xs text-gray-500 mt-1">Clique em uma avaliação para ver detalhes.</p>
                </div>
                <div className="divide-y divide-gray-100">
                    {[...activeLesion.assessments].reverse().map((assessment, idx) => (
                        <div 
                            key={assessment.id} 
                            onClick={() => setViewingAssessment(assessment)}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100 group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center text-sm font-medium text-gray-900">
                                    <Calendar size={16} className="mr-2 text-gray-400 group-hover:text-primary-500" />
                                    {new Date(assessment.date).toLocaleDateString()} 
                                    <span className="text-gray-400 mx-2">•</span>
                                    {new Date(assessment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                {idx === 0 && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Atual</span>}
                                <Maximize2 size={16} className="text-gray-300 group-hover:text-gray-500" />
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                        <div>
                                            <span className="block text-gray-400">Dimensões</span>
                                            <span className="font-medium text-gray-800">{assessment.widthMm}x{assessment.heightMm}x{assessment.depthMm} mm</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400">Exsudato</span>
                                            <span className="font-medium text-gray-800">{assessment.exudate} ({assessment.exudateType || '-'})</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400">Tecido (%)</span>
                                            <div className="flex space-x-1">
                                                {assessment.tissueTypes.necrotic > 0 && <span className="w-2 h-2 rounded-full bg-black" title={`Necrose ${assessment.tissueTypes.necrotic}%`}></span>}
                                                {assessment.tissueTypes.slough > 0 && <span className="w-2 h-2 rounded-full bg-yellow-400" title={`Esfacelo ${assessment.tissueTypes.slough}%`}></span>}
                                                {assessment.tissueTypes.granulation > 0 && <span className="w-2 h-2 rounded-full bg-red-500" title={`Granulação ${assessment.tissueTypes.granulation}%`}></span>}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-gray-400">Dor</span>
                                            <span className="font-medium text-gray-800">{assessment.painLevel}/10</span>
                                        </div>
                                    </div>
                                    {/* Detailed Tags */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {assessment.infectionSigns?.map(s => <span key={s} className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] rounded border border-red-100">{s}</span>)}
                                        {assessment.woundEdges?.map(s => <span key={s} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded border border-orange-100">{s}</span>)}
                                    </div>
                                </div>
                                
                                {assessment.imageUrl && (
                                  <div className="flex-shrink-0">
                                    <img src={assessment.imageUrl} alt="Foto da lesão" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                  </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              </div>

              {/* Assessment Details Modal */}
              {viewingAssessment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingAssessment(null)}>
                  <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Detalhes da Avaliação</h2>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                          <Calendar size={14} />
                          <span>{new Date(viewingAssessment.date).toLocaleDateString()} às {new Date(viewingAssessment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                      <button onClick={() => setViewingAssessment(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Image */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 flex items-center"><Camera size={18} className="mr-2"/> Fotografia da Lesão</h3>
                        <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center min-h-[300px]">
                           {viewingAssessment.imageUrl ? (
                             <img src={viewingAssessment.imageUrl} className="w-full h-auto object-contain max-h-[500px]" alt="Foto da avaliação" />
                           ) : (
                             <div className="text-gray-400 flex flex-col items-center">
                               <Camera size={48} className="mb-2 opacity-20"/>
                               <span>Sem imagem registrada</span>
                             </div>
                           )}
                        </div>
                        {viewingAssessment.notes && (
                           <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                             <h4 className="text-xs font-bold text-yellow-800 uppercase mb-2">Notas da Enfermagem</h4>
                             <p className="text-sm text-gray-800 italic">"{viewingAssessment.notes}"</p>
                           </div>
                        )}
                      </div>

                      {/* Right: Data */}
                      <div className="space-y-6">
                         {/* Dimensions */}
                         <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Dimensões & Dor</h3>
                            <div className="grid grid-cols-4 gap-4 text-center">
                               <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                                  <span className="block text-xs text-gray-400 uppercase">Comp.</span>
                                  <span className="font-bold text-lg text-gray-900">{viewingAssessment.widthMm}mm</span>
                               </div>
                               <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                                  <span className="block text-xs text-gray-400 uppercase">Larg.</span>
                                  <span className="font-bold text-lg text-gray-900">{viewingAssessment.heightMm}mm</span>
                               </div>
                               <div className="bg-white p-2 rounded shadow-sm border border-gray-100">
                                  <span className="block text-xs text-gray-400 uppercase">Prof.</span>
                                  <span className="font-bold text-lg text-gray-900">{viewingAssessment.depthMm}mm</span>
                               </div>
                               <div className="bg-white p-2 rounded shadow-sm border border-gray-100 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg bg-red-500"></div>
                                  <span className="block text-xs text-gray-400 uppercase">Dor</span>
                                  <span className="font-bold text-lg text-red-600">{viewingAssessment.painLevel}/10</span>
                               </div>
                            </div>
                         </div>

                         {/* Tissue Chart */}
                         <div>
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Características do Leito (TIME)</h3>
                            <div className="flex h-6 rounded-full overflow-hidden w-full text-xs font-bold text-white shadow-sm">
                               {viewingAssessment.tissueTypes.necrotic > 0 && (
                                 <div style={{width: `${viewingAssessment.tissueTypes.necrotic}%`}} className="bg-gray-900 flex items-center justify-center" title="Necrose">N</div>
                               )}
                               {viewingAssessment.tissueTypes.slough > 0 && (
                                 <div style={{width: `${viewingAssessment.tissueTypes.slough}%`}} className="bg-yellow-400 flex items-center justify-center text-yellow-900" title="Esfacelo">E</div>
                               )}
                               {viewingAssessment.tissueTypes.granulation > 0 && (
                                 <div style={{width: `${viewingAssessment.tissueTypes.granulation}%`}} className="bg-red-500 flex items-center justify-center" title="Granulação">G</div>
                               )}
                               {viewingAssessment.tissueTypes.epithelialization > 0 && (
                                 <div style={{width: `${viewingAssessment.tissueTypes.epithelialization}%`}} className="bg-pink-300 flex items-center justify-center text-pink-900" title="Epitelização">Ep</div>
                               )}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                               <span>Necrose: {viewingAssessment.tissueTypes.necrotic}%</span>
                               <span>Esfacelo: {viewingAssessment.tissueTypes.slough}%</span>
                               <span>Granulação: {viewingAssessment.tissueTypes.granulation}%</span>
                               <span>Epitelização: {viewingAssessment.tissueTypes.epithelialization}%</span>
                            </div>
                         </div>

                         {/* Lists */}
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <h3 className="font-semibold text-gray-900 mb-2 text-sm">Exsudato & Infecção</h3>
                               <p className="text-sm text-gray-700 mb-2">Nível: <strong>{viewingAssessment.exudate}</strong></p>
                               <p className="text-sm text-gray-700 mb-2">Tipo: <strong>{viewingAssessment.exudateType || '-'}</strong></p>
                               <div className="flex flex-wrap gap-1">
                                  {viewingAssessment.infectionSigns.length > 0 ? (
                                    viewingAssessment.infectionSigns.map(s => <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100">{s}</span>)
                                  ) : <span className="text-xs text-gray-400">Sem sinais de infecção</span>}
                               </div>
                            </div>
                            <div>
                               <h3 className="font-semibold text-gray-900 mb-2 text-sm">Bordas & Pele</h3>
                               <div className="space-y-2">
                                  <div>
                                    <span className="text-xs text-gray-500 block">Bordas:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {viewingAssessment.woundEdges.length > 0 ? viewingAssessment.woundEdges.map(s => <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">{s}</span>) : '-'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-gray-500 block">Pele Perilesão:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {viewingAssessment.periwoundSkin.length > 0 ? viewingAssessment.periwoundSkin.map(s => <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">{s}</span>) : '-'}
                                    </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestion History */}
              {assessmentsWithSuggestions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                    <div className="p-4 border-b border-gray-100 bg-indigo-50 flex items-center justify-between">
                        <div className="flex items-center">
                            <ClipboardList className="text-indigo-600 mr-2" size={20} />
                            <h3 className="font-semibold text-indigo-900">Histórico de Tratamentos Sugeridos</h3>
                        </div>
                        <span className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">{assessmentsWithSuggestions.length} registros</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {assessmentsWithSuggestions.map(assessment => (
                            <div key={`sugg-${assessment.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                    <Calendar size={14} className="mr-1.5 text-gray-500"/>
                                    {new Date(assessment.date).toLocaleDateString()}
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="text-gray-500 font-normal">Baseado na avaliação do dia {new Date(assessment.date).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                                    {/* Cleaning */}
                                    <div className="flex items-start">
                                        <div className="bg-blue-100 p-1.5 rounded mr-3 mt-0.5">
                                            <Droplet size={14} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Limpeza</span>
                                            <span className="text-gray-900">{assessment.aiSuggestion?.cleaning}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Frequency */}
                                    <div className="flex items-start">
                                        <div className="bg-purple-100 p-1.5 rounded mr-3 mt-0.5">
                                            <Calendar size={14} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Frequência</span>
                                            <span className="text-gray-900">{assessment.aiSuggestion?.frequency}</span>
                                        </div>
                                    </div>

                                    {/* Primary */}
                                    <div className="flex items-start">
                                        <div className="bg-emerald-100 p-1.5 rounded mr-3 mt-0.5">
                                            <Activity size={14} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Cobertura Primária</span>
                                            <span className="text-gray-900">{assessment.aiSuggestion?.primaryDressing}</span>
                                        </div>
                                    </div>

                                    {/* Secondary */}
                                    <div className="flex items-start">
                                        <div className="bg-gray-100 p-1.5 rounded mr-3 mt-0.5">
                                            <Activity size={14} className="text-gray-600" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Cobertura Secundária</span>
                                            <span className="text-gray-900">{assessment.aiSuggestion?.secondaryDressing}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Rationale */}
                                <div className="mt-5 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex items-start">
                                    <Brain size={16} className="text-indigo-600 mr-3 mt-1 flex-shrink-0"/>
                                    <div>
                                        <span className="block text-xs font-bold text-indigo-700 mb-1">Racional Clínico</span>
                                        <p className="text-gray-700 text-sm italic leading-relaxed">"{assessment.aiSuggestion?.rationale}"</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Selecione uma lesão ao lado ou adicione uma nova.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Lesion Modal */}
      {showAddLesionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddLesionModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Nova Lesão</h3>
                    <button onClick={() => setShowAddLesionModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Lesão</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            value={newLesionData.type}
                            onChange={(e) => setNewLesionData({...newLesionData, type: e.target.value as LesionType})}
                        >
                            {Object.values(LesionType).map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                className="w-full pl-9 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                placeholder="Ex: Região Sacral, Maleolo Medial..."
                                value={newLesionData.location}
                                onChange={(e) => setNewLesionData({...newLesionData, location: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                        <input 
                            type="date"
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            value={newLesionData.startDate}
                            onChange={(e) => setNewLesionData({...newLesionData, startDate: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tratamentos Anteriores (Opcional)</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            rows={3}
                            placeholder="Liste tratamentos já realizados separados por vírgula..."
                            value={newLesionData.previousTreatments}
                            onChange={(e) => setNewLesionData({...newLesionData, previousTreatments: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button 
                        onClick={() => setShowAddLesionModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSaveNewLesion}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm"
                    >
                        Cadastrar Lesão
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      <PatientFormModal 
        isOpen={showEditPatientModal} 
        onClose={() => setShowEditPatientModal(false)} 
        onSave={onUpdatePatient}
        initialData={patient}
      />
    </div>
  );
};

export default PatientDetail;