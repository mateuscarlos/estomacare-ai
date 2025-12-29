
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Patient, Lesion, Assessment } from "../types";

export const generateLesionPDF = (patient: Patient, lesion: Lesion) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const contentWidth = pageWidth - (2 * margin);

  // --- HEADER ---
  doc.setFillColor(16, 185, 129); // Primary-500 color
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("EstomaCare AI - Relatório Clínico", margin, 13);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString('pt-BR');
  doc.text(`Gerado em: ${dateStr}`, pageWidth - margin, 13, { align: 'right' });

  // --- PACIENTE ---
  let yPos = 35;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Dados do Paciente", margin, yPos);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Nome: ${patient.name}`, margin, yPos);
  doc.text(`ID: ${patient.id}`, 100, yPos);
  
  yPos += 6;
  doc.text(`Idade: ${patient.age} anos`, margin, yPos);
  doc.text(`Gênero: ${patient.gender}`, 100, yPos);

  if (patient.comorbidities.length > 0) {
    yPos += 6;
    const comorbText = `Comorbidades: ${patient.comorbidities.join(', ')}`;
    const splitComorb = doc.splitTextToSize(comorbText, contentWidth);
    doc.text(splitComorb, margin, yPos);
    yPos += (splitComorb.length - 1) * 5;
  }
  
  if (patient.allergies && patient.allergies.length > 0) {
    yPos += 6;
    doc.setTextColor(220, 38, 38); // Red
    const allergyText = `Alergias: ${patient.allergies.join(', ')}`;
    const splitAllergy = doc.splitTextToSize(allergyText, contentWidth);
    doc.text(splitAllergy, margin, yPos);
    yPos += (splitAllergy.length - 1) * 5;
    doc.setTextColor(0, 0, 0);
  }

  // --- LESÃO ---
  yPos += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detalhes da Lesão", margin, yPos);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Tipo: ${lesion.type}`, margin, yPos);
  doc.text(`Localização: ${lesion.location}`, margin, yPos + 6);
  doc.text(`Início do Tratamento: ${new Date(lesion.startDate).toLocaleDateString('pt-BR')}`, margin, yPos + 12);
  
  if (lesion.previousTreatments && lesion.previousTreatments.length > 0) {
     const treatmentText = `Tratamentos Anteriores: ${lesion.previousTreatments.join(', ')}`;
     const splitTreatment = doc.splitTextToSize(treatmentText, contentWidth);
     doc.text(splitTreatment, margin, yPos + 18);
     yPos += 6 + (splitTreatment.length - 1) * 5;
  }

  // --- HISTÓRICO (TABELA) ---
  yPos += 25;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Histórico de Avaliações", margin, yPos);

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
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: margin, right: margin },
  });

  // --- NOTAS DA ÚLTIMA AVALIAÇÃO ---
  const lastAssessment = lesion.assessments[lesion.assessments.length - 1];
  if (lastAssessment) {
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Check page break
      if (finalY > pageHeight - 60) {
          doc.addPage();
          finalY = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Última Avaliação - Notas Clínicas", margin, finalY);
      doc.line(margin, finalY + 2, pageWidth - margin, finalY + 2);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const splitNotes = doc.splitTextToSize(lastAssessment.notes || "Sem notas registradas.", contentWidth);
      doc.text(splitNotes, margin, finalY + 8);
      
      const notesHeight = splitNotes.length * 4;
      finalY += 8 + notesHeight;
      
      // AI Suggestion if available
      if (lastAssessment.aiSuggestion) {
          finalY += 10;
          
          // Calculate required height for AI suggestion box
          const aiTexts = [
            `Limpeza: ${lastAssessment.aiSuggestion.cleaning}`,
            `Cobertura Primária: ${lastAssessment.aiSuggestion.primaryDressing}`,
            `Frequência: ${lastAssessment.aiSuggestion.frequency}`
          ];
          
          const splitAiTexts = aiTexts.map(text => doc.splitTextToSize(text, contentWidth - 12));
          const aiBoxHeight = 10 + splitAiTexts.reduce((sum, lines) => sum + (lines.length * 5), 0) + 10;
          
          // Check if need new page for AI suggestion
          if (finalY + aiBoxHeight > pageHeight - 20) {
              doc.addPage();
              finalY = 20;
          }

          doc.setFillColor(243, 244, 246);
          doc.rect(margin, finalY, contentWidth, aiBoxHeight, 'F');
          
          doc.setTextColor(75, 85, 99);
          doc.setFont("helvetica", "bold");
          doc.text("Sugestão de Tratamento (IA)", margin + 6, finalY + 8);
          
          doc.setFont("helvetica", "normal");
          let aiYPos = finalY + 14;
          
          splitAiTexts.forEach(lines => {
            doc.text(lines, margin + 6, aiYPos);
            aiYPos += lines.length * 5;
          });
      }
  }

  doc.save(`Relatorio_${patient.name.replace(/\s+/g, '_')}_${lesion.type}.pdf`);
};
