
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Patient, Lesion, Assessment } from "../types";

export const generateLesionPDF = (patient: Patient, lesion: Lesion) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- HEADER ---
  doc.setFillColor(16, 185, 129); // Primary-500 color
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EstomaCare AI - Relatório Clínico", 14, 13);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em: ${dateStr}`, pageWidth - 14, 13, { align: 'right' });

  // --- PACIENTE ---
  let yPos = 35;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Paciente", 14, yPos);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Nome: ${patient.name}`, 14, yPos);
  doc.text(`ID: ${patient.id}`, 100, yPos);
  
  yPos += 6;
  doc.text(`Idade: ${patient.age} anos`, 14, yPos);
  doc.text(`Gênero: ${patient.gender}`, 100, yPos);

  if (patient.comorbidities.length > 0) {
    yPos += 6;
    doc.text(`Comorbidades: ${patient.comorbidities.join(', ')}`, 14, yPos);
  }
  
  if (patient.allergies && patient.allergies.length > 0) {
    yPos += 6;
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Alergias: ${patient.allergies.join(', ')}`, 14, yPos);
    doc.setTextColor(0, 0, 0);
  }

  // --- LESÃO ---
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes da Lesão", 14, yPos);
  doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Tipo: ${lesion.type}`, 14, yPos);
  doc.text(`Localização: ${lesion.location}`, 14, yPos + 6);
  doc.text(`Início do Tratamento: ${new Date(lesion.startDate).toLocaleDateString('pt-BR')}`, 14, yPos + 12);
  
  if (lesion.previousTreatments && lesion.previousTreatments.length > 0) {
     doc.text(`Tratamentos Anteriores: ${lesion.previousTreatments.join(', ')}`, 14, yPos + 18);
     yPos += 6;
  }

  // --- HISTÓRICO (TABELA) ---
  yPos += 25;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Histórico de Avaliações", 14, yPos);

  const tableData = lesion.assessments.map((a) => [
    new Date(a.date).toLocaleDateString('pt-BR'),
    `${a.widthMm}x${a.heightMm}x${a.depthMm}`,
    `N:${a.tissueTypes.necrotic}% E:${a.tissueTypes.slough}% G:${a.tissueTypes.granulation}%`,
    `${a.exudate} (${a.exudateType || '-'})`,
    a.infectionSigns.length > 0 ? 'Sim' : 'Não',
    `${a.painLevel}/10`
  ]);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Data', 'Dimensões (mm)', 'Tecido (TIME)', 'Exsudato', 'Infecção', 'Dor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Primary color
    styles: { fontSize: 8 },
  });

  // --- NOTAS DA ÚLTIMA AVALIAÇÃO ---
  const lastAssessment = lesion.assessments[lesion.assessments.length - 1];
  if (lastAssessment) {
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Check page break
      if (finalY > doc.internal.pageSize.height - 40) {
          doc.addPage();
          finalY = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Última Avaliação - Notas Clínicas", 14, finalY);
      doc.line(14, finalY + 2, pageWidth - 14, finalY + 2);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const splitNotes = doc.splitTextToSize(lastAssessment.notes || "Sem notas registradas.", pageWidth - 28);
      doc.text(splitNotes, 14, finalY + 8);
      
      // AI Suggestion if available
      if (lastAssessment.aiSuggestion) {
          finalY += 20 + (splitNotes.length * 4);
          if (finalY > doc.internal.pageSize.height - 40) {
              doc.addPage();
              finalY = 20;
          }

          doc.setFillColor(243, 244, 246);
          doc.rect(14, finalY, pageWidth - 28, 40, 'F');
          
          doc.setTextColor(75, 85, 99);
          doc.setFont("helvetica", "bold");
          doc.text("Sugestão de Tratamento (IA)", 20, finalY + 8);
          
          doc.setFont("helvetica", "normal");
          doc.text(`Limpeza: ${lastAssessment.aiSuggestion.cleaning}`, 20, finalY + 14);
          doc.text(`Cobertura Primária: ${lastAssessment.aiSuggestion.primaryDressing}`, 20, finalY + 20);
          doc.text(`Frequência: ${lastAssessment.aiSuggestion.frequency}`, 20, finalY + 26);
      }
  }

  doc.save(`Relatorio_${patient.name.replace(/\s+/g, '_')}_${lesion.type}.pdf`);
};
