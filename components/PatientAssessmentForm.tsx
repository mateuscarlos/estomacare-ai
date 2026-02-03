import React, { useState } from 'react';
import {
  Camera, Save, X, Activity, Sparkles, Loader2
} from 'lucide-react';
import {
  Assessment, ExudateLevel, ExudateType, TissuePercentage
} from '../types';
import { analyzeWoundImage } from '../services/firebaseGeminiService';
import { analyticsService } from '../services/analyticsService';

interface PatientAssessmentFormProps {
  onSave: (assessment: Partial<Assessment>) => Promise<void>;
  onCancel: () => void;
}

const PatientAssessmentForm: React.FC<PatientAssessmentFormProps> = ({ onSave, onCancel }) => {
  // Default Initial State
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
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // Options lists based on PDF
  const infectionOptions = ['Calor local', 'Odor fétido', 'Edema', 'Eritema', 'Febre', 'Pus/Abscesso', 'Celulite'];
  const edgeOptions = ['Maceração', 'Desidratação', 'Deslocamento', 'Epíbole (Enrolada)'];
  const skinOptions = ['Maceração', 'Escoriação', 'Xerose (Seca)', 'Hiperqueratose', 'Calo', 'Eczema'];

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
        // Preserve dimensions and pain as they are hard to guess from image alone
        // Notes already comes with [IA Visual]: prefix from the backend
        notes: analysis.notes ? (prev.notes ? prev.notes + '\n\n' + analysis.notes : analysis.notes) : prev.notes
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

  const handleSubmit = async () => {
    try {
      await onSave(newAssessment);
      setNewAssessment(initialAssessmentState);
    } catch (error) {
      console.error('Error saving assessment form:', error);
      // Parent handles alert
    }
  };

  return (
      <div className="bg-white rounded-xl border border-primary-100 shadow-lg ring-1 ring-black/5 overflow-hidden">
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100 flex justify-between items-center">
              <h3 className="font-bold text-primary-900 flex items-center">
                  <Activity className="mr-2" size={20}/>
                  Nova Avaliação Clínica
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-primary-600 bg-white px-2 py-1 rounded border border-primary-200">
                  {new Date().toLocaleDateString()}
                </span>
                <button
                  onClick={onCancel}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
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
                                      <img src={newAssessment.imageUrl} alt="Pré-visualização da lesão" className="w-full h-full object-contain" />
                                      <button onClick={removeImage} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X size={12}/></button>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                  <label htmlFor="painLevel" className="block text-xs font-medium text-gray-700 mb-1">Nível de Dor (0-10)</label>
                                  <input
                                      id="painLevel"
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
              <button onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium flex items-center shadow-sm">
                  <Save size={18} className="mr-2"/> Salvar Avaliação
              </button>
          </div>
      </div>
  );
};

export default PatientAssessmentForm;
