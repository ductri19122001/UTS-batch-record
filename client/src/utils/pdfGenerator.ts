import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface BatchRecordData {
  id: string;
  batchNumber: string;
  productId: string;
  formulationId: string;
  plannedQuantity: number;
  actualQuantity?: number | null;
  unit: string;
  status: string;
  manufacturingDate: string;
  expiryDate: string;
  productionUnit: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
  productName?: string; // Add this for compatibility
  product?: {
    name: string;
    description?: string;
  };
  formulation?: {
    version: string;
  };
  sections?: Record<string, any>; // All section data
  sectionsMetadata?: Record<string, any>; // Section metadata
  materialIssuances?: any[];
  packagingIssuances?: any[];
  equipmentChecks?: any[];
  processSteps?: any[];
  qualityChecks?: any[];
  samples?: any[];
  envReadings?: any[];
  yieldCalc?: any;
  deviations?: any[];
  attachments?: any[];
  auditLogs?: any[];
}

interface TemplateData {
  id: string;
  title: string;
  sections: Array<{
    id: string;
    title: string;
    fields?: any[];
    subsections?: any[];
  }>;
}

interface ExportOptions {
  sections: string[];
}

export const generateBatchRecordPDF = async (
  batchData: BatchRecordData,
  templateData: TemplateData,
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, y);
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, pageWidth - 20, y + 2);
    return y + 10;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RELEASED': return [0, 128, 0]; // Green
      case 'APPROVED': return [0, 0, 255]; // Blue
      case 'PENDING': return [255, 165, 0]; // Orange
      case 'REJECTED': return [255, 0, 0]; // Red
      case 'IN_PROGRESS': return [128, 0, 128]; // Purple
      case 'COMPLETED': return [0, 128, 0]; // Green
      case 'CANCELLED': return [128, 128, 128]; // Gray
      default: return [128, 128, 128]; // Gray
    }
  };

  // 1. Document Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BATCH MANUFACTURING RECORD', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(templateData.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // 2. Batch Information Summary
  yPosition = addSectionHeader('BATCH INFORMATION', yPosition);
  checkPageBreak(40);

  const batchInfo = [
    ['Batch Number:', batchData.batchNumber || 'N/A'],
    ['Product Name:', batchData.productName || batchData.product?.name || 'N/A'],
    ['Formulation Version:', batchData.formulation?.version || 'N/A'],
    ['Planned Quantity:', `${batchData.plannedQuantity || 'N/A'} ${batchData.unit || ''}`],
    ['Actual Quantity:', `${batchData.actualQuantity || 'N/A'} ${batchData.unit || ''}`],
    ['Manufacturing Date:', formatDate(batchData.manufacturingDate)],
    ['Expiry Date:', formatDate(batchData.expiryDate)],
    ['Production Unit:', batchData.productionUnit || 'N/A'],
    ['Created By:', batchData.createdBy || 'N/A'],
    ['Approved By:', batchData.approvedBy || 'N/A'],
    ['Approved At:', formatDate(batchData.approvedAt || '')],
    ['Released At:', formatDate(batchData.releasedAt || '')],
  ];

  // Add status with color
  const statusColor = getStatusColor(batchData.status);
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.rect(20, yPosition, 60, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${batchData.status}`, 25, yPosition + 5);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // Add batch info table
  batchInfo.forEach(([label, value]) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    yPosition += 8;
  });

  yPosition += 10;

  // 3. Render all template sections with actual data
  const renderSection = (
    section: any,
    sectionData: any,
    level: number = 0
  ): void => {
    if (!section || !sectionData) return;

    // Render section header
    yPosition = addSectionHeader(
      section.title || section.id.toUpperCase(),
      yPosition
    );
    checkPageBreak(30);

    // Render fields if they exist
    if (section.fields && Array.isArray(section.fields) && section.fields.length > 0) {
      const fieldRows: any[][] = [];
      
      section.fields.forEach((field: any) => {
        const value = sectionData[field.name];
        
        if (value !== undefined && value !== null && value !== '') {
          let displayValue: string = 'N/A';
          
          if (field.type === 'table' && value.rows && Array.isArray(value.rows)) {
            // Handle table fields - render as nested table
            if (value.rows.length > 0) {
              const tableHeaders = field.columns 
                ? field.columns.map((col: any) => col.label || col.name)
                : Object.keys(value.rows[0] || {});
              
              const tableBody = value.rows.map((row: any) =>
                tableHeaders.map((header: string) => {
                  const key = field.columns?.find((col: any) => col.label === header || col.name === header)?.name || header;
                  const cellValue = row[key];
                  return cellValue !== undefined && cellValue !== null ? String(cellValue) : 'N/A';
                })
              );

              autoTable(doc, {
                startY: yPosition,
                head: [tableHeaders],
                body: tableBody,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] },
                margin: { left: 20, right: 20 }
              });

              yPosition = (doc as any).lastAutoTable.finalY + 10;
              return; // Skip adding to field rows
            }
          } else if (field.type === 'date' && value) {
            displayValue = formatDate(value);
          } else if (Array.isArray(value)) {
            // Handle arrays - check if it contains objects
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
              // Array of objects - render as a table
              const firstObj = value[0];
              const keys = Object.keys(firstObj);
              
              if (keys.length > 0) {
                const tableHeaders = keys.map(key => {
                  // Try to find a label for this key in field definition
                  const fieldDef = field.columns?.find((col: any) => col.name === key);
                  return fieldDef?.label || key;
                });
                
                const tableBody = value.map((obj: any) =>
                  keys.map(key => {
                    const val = obj[key];
                    if (val === null || val === undefined) return 'N/A';
                    if (typeof val === 'object') return JSON.stringify(val);
                    return String(val);
                  })
                );

                autoTable(doc, {
                  startY: yPosition,
                  head: [tableHeaders],
                  body: tableBody,
                  styles: { fontSize: 8 },
                  headStyles: { fillColor: [200, 200, 200] },
                  margin: { left: 20, right: 20 }
                });

                yPosition = (doc as any).lastAutoTable.finalY + 10;
                return; // Skip adding to field rows
              } else {
                // Empty object or no keys - format as JSON
                displayValue = value.map((obj: any) => JSON.stringify(obj, null, 2)).join('\n\n');
              }
            } else {
              // Array of primitives
              displayValue = value.map((v: any) => {
                if (v === null || v === undefined) return 'N/A';
                return String(v);
              }).join(', ');
            }
          } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
            // Single object - format as key-value pairs or JSON
            if (Object.keys(value).length <= 5) {
              // Small object - format as readable key-value pairs
              displayValue = Object.entries(value)
                .map(([key, val]) => {
                  const valStr = val === null || val === undefined ? 'N/A' : String(val);
                  return `${key}: ${valStr}`;
                })
                .join('; ');
            } else {
              // Larger object - format as JSON
              displayValue = JSON.stringify(value, null, 2);
            }
          } else {
            displayValue = String(value);
          }

          fieldRows.push([
            field.label || field.name || 'N/A',
            displayValue
          ]);
        }
      });

      // Render fields as a simple table
      if (fieldRows.length > 0) {
        autoTable(doc, {
          startY: yPosition,
          head: [['Field', 'Value']],
          body: fieldRows,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [200, 200, 200] },
          margin: { left: 20, right: 20 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    // Render subsections recursively
    if (section.subsections && Array.isArray(section.subsections)) {
      section.subsections.forEach((subsection: any) => {
        const subsectionData = sectionData[subsection.id];
        if (subsectionData) {
          renderSection(subsection, subsectionData, level + 1);
        }
      });
    }

    yPosition += 5;
  };

  // Render all template sections
  if (templateData.sections && Array.isArray(templateData.sections)) {
    const sectionsData = batchData.sections || {};
    
    templateData.sections.forEach((section: any) => {
      const sectionData = sectionsData[section.id];
      if (sectionData) {
        renderSection(section, sectionData);
      }
    });
  }

  // 4. Legacy sections (Material Issuances, etc.) - keep for backward compatibility
  // Material Issuances
  if (batchData.materialIssuances && batchData.materialIssuances.length > 0) {
    yPosition = addSectionHeader('MATERIAL ISSUANCES', yPosition);
    checkPageBreak(30);

    const materialData = batchData.materialIssuances.map(issuance => [
      issuance.id || 'N/A',
      issuance.materialName || 'N/A',
      issuance.supplier || 'N/A',
      issuance.lotNumber || 'N/A',
      issuance.quantity || 'N/A',
      issuance.unit || 'N/A',
      formatDate(issuance.issuedAt || ''),
      issuance.issuedBy || 'N/A',
      formatDate(issuance.expiryDate || '')
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Material Name', 'Supplier', 'Lot Number', 'Quantity', 'Unit', 'Issued At', 'Issued By', 'Expiry Date']],
      body: materialData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Equipment Checks
  if (batchData.equipmentChecks && batchData.equipmentChecks.length > 0) {
    yPosition = addSectionHeader('EQUIPMENT CHECKS', yPosition);
    checkPageBreak(30);

    const equipmentData = batchData.equipmentChecks.map(check => [
      check.equipmentId || 'N/A',
      check.checkType || 'N/A',
      check.checkResult || 'N/A',
      formatDate(check.performedAt || ''),
      check.performedBy || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Equipment ID', 'Check Type', 'Result', 'Performed At', 'Performed By']],
      body: equipmentData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. Process Steps
  if (batchData.processSteps && batchData.processSteps.length > 0) {
    yPosition = addSectionHeader('PROCESS STEPS', yPosition);
    checkPageBreak(30);

    const processData = batchData.processSteps.map(step => [
      step.id || 'N/A',
      step.stepName || 'N/A',
      step.temperature || 'N/A',
      step.pH || 'N/A',
      step.status || 'N/A',
      formatDate(step.startTime || ''),
      formatDate(step.endTime || ''),
      step.operator || 'N/A',
      step.notes || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Step Name', 'Temperature', 'pH', 'Status', 'Start Time', 'End Time', 'Operator', 'Notes']],
      body: processData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 7. Quality Checks
  if (batchData.qualityChecks && batchData.qualityChecks.length > 0) {
    yPosition = addSectionHeader('QUALITY CHECKS', yPosition);
    checkPageBreak(30);

    const qualityData = batchData.qualityChecks.map(check => [
      check.id || 'N/A',
      check.testName || 'N/A',
      check.method || 'N/A',
      check.specification || 'N/A',
      check.result || 'N/A',
      check.unit || 'N/A',
      check.status || 'N/A',
      formatDate(check.testedAt || ''),
      check.testedBy || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Test Name', 'Method', 'Specification', 'Result', 'Unit', 'Status', 'Tested At', 'Tested By']],
      body: qualityData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 8. Samples
  if (batchData.samples && batchData.samples.length > 0) {
    yPosition = addSectionHeader('SAMPLES', yPosition);
    checkPageBreak(30);

    const sampleData = batchData.samples.map(sample => [
      sample.id || 'N/A',
      sample.sampleType || 'N/A',
      sample.volume || sample.quantity || 'N/A',
      sample.unit || 'N/A',
      formatDate(sample.collectionTime || ''),
      sample.collectedBy || 'N/A',
      sample.location || 'N/A',
      sample.storageCondition || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Sample Type', 'Volume/Quantity', 'Unit', 'Collection Time', 'Collected By', 'Location', 'Storage Condition']],
      body: sampleData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 9. Environmental Readings
  if (batchData.envReadings && batchData.envReadings.length > 0) {
    yPosition = addSectionHeader('ENVIRONMENTAL READINGS', yPosition);
    checkPageBreak(30);

    const envData = batchData.envReadings.map(reading => [
      reading.id || 'N/A',
      reading.parameter || 'N/A',
      reading.value || 'N/A',
      reading.unit || 'N/A',
      reading.location || 'N/A',
      formatDate(reading.recordedAt || ''),
      reading.recordedBy || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Parameter', 'Value', 'Unit', 'Location', 'Recorded At', 'Recorded By']],
      body: envData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 10. Yield Calculations
  if (batchData.yieldCalc) {
    yPosition = addSectionHeader('YIELD CALCULATIONS', yPosition);
    checkPageBreak(30);

    const yieldInfo = [
      ['Theoretical Yield:', `${batchData.yieldCalc.theoreticalYield || 'N/A'} ${batchData.yieldCalc.unit || ''}`],
      ['Actual Yield:', `${batchData.yieldCalc.actualYield || 'N/A'} ${batchData.yieldCalc.unit || ''}`],
      ['Efficiency:', `${batchData.yieldCalc.efficiency || 'N/A'} %`],
      ['Loss Reason:', batchData.yieldCalc.lossReason || 'N/A'],
    ];

    yieldInfo.forEach(([label, value]) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPosition);
      yPosition += 8;
    });

    yPosition += 10;
  }

  // 11. Deviations
  if (batchData.deviations && batchData.deviations.length > 0) {
    yPosition = addSectionHeader('DEVIATIONS', yPosition);
    checkPageBreak(30);

    const deviationData = batchData.deviations.map(deviation => [
      deviation.id || 'N/A',
      deviation.description || 'N/A',
      deviation.severity || 'N/A',
      deviation.status || 'N/A',
      formatDate(deviation.reportedAt || ''),
      deviation.reportedBy || 'N/A',
      deviation.actionTaken || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Description', 'Severity', 'Status', 'Reported At', 'Reported By', 'Action Taken']],
      body: deviationData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 12. Audit Trail
  if (batchData.auditLogs && batchData.auditLogs.length > 0) {
    yPosition = addSectionHeader('AUDIT TRAIL', yPosition);
    checkPageBreak(30);

    const auditData = batchData.auditLogs.map(log => [
      log.id || 'N/A',
      formatDate(log.performedAt || ''),
      log.performedBy || 'N/A',
      log.action || 'N/A',
      log.details || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'Performed At', 'Performed By', 'Action', 'Details']],
      body: auditData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 13. Attachments
  if (batchData.attachments && batchData.attachments.length > 0) {
    yPosition = addSectionHeader('ATTACHMENTS', yPosition);
    checkPageBreak(30);

    const attachmentData = batchData.attachments.map(attachment => [
      attachment.id || 'N/A',
      attachment.fileName || 'N/A',
      attachment.fileType || 'N/A',
      attachment.description || 'N/A',
      formatDate(attachment.uploadedAt || ''),
      attachment.uploadedBy || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['ID', 'File Name', 'File Type', 'Description', 'Uploaded At', 'Uploaded By']],
      body: attachmentData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // 14. Document Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Add page number
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);

    // Add generation timestamp
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10);

    // Add company info
    doc.text('NepBio Batch Records Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save the PDF
  const fileName = `BatchRecord_${batchData.batchNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateBatchRecordExcel = async (
  _batchData: BatchRecordData,
  _templateData: TemplateData,
  _exportOptions: ExportOptions
): Promise<void> => {
  // Excel generation would be implemented here using a library like xlsx
  console.log('Excel export not implemented yet');
};

export const generateBatchRecordCSV = async (
  _batchData: BatchRecordData,
  _templateData: TemplateData,
  _exportOptions: ExportOptions
): Promise<void> => {
  // CSV generation would be implemented here
  console.log('CSV export not implemented yet');
};
