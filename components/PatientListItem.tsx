import React, { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Patient } from '../types';

interface PatientListItemProps {
  patient: Patient;
  onClick: (id: string) => void;
}

const PatientListItem: React.FC<PatientListItemProps> = memo(({ patient, onClick }) => {
  return (
    <div
      onClick={() => onClick(patient.id)}
      className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-100 shadow-sm">
          <img src={patient.photoUrl} alt={patient.name} loading="lazy" className="w-full h-full object-cover" />
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
  );
});

export default PatientListItem;
