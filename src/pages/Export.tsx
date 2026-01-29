import React, { useState, useEffect } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FamilyMember, VitalReading, MedicalReport, DoctorNote, Medication, Symptom } from '@/types/health';
import { storage } from '@/lib/storage';

interface ExportOptions {
  includeVitals: boolean;
  includeReports: boolean;
  includeNotes: boolean;
  includeMedications: boolean;
  includeSymptoms: boolean;
  includeEmergencyContacts: boolean;
  includeAllergies: boolean;
  includeChronicConditions: boolean;
}

const Export: React.FC = () => {
  const { familyMembers } = useFamily();
  const [vitals, setVitals] = useState<VitalReading[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeVitals: true,
    includeReports: true,
    includeNotes: true,
    includeMedications: true,
    includeSymptoms: true,
    includeEmergencyContacts: true,
    includeAllergies: true,
    includeChronicConditions: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Load data from storage
  useEffect(() => {
    const data = storage.getData();
    setVitals(data.vitals || []);
    setReports(data.reports || []);
    setDoctorNotes(data.doctorNotes || []);
    setMedications(data.medications || []);
    setSymptoms(data.symptoms || []);
  }, []);

  const handleExportOptionChange = (option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Health Hub Connect - Medical Export', margin, yPosition);
      yPosition += 15;

      // Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 20;

      // Get members to export
      const membersToExport = selectedMemberId === 'all'
        ? familyMembers
        : familyMembers.filter(member => member.id === selectedMemberId);

      for (const member of membersToExport) {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        // Member Header
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Patient: ${member.name}`, margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Date of Birth: ${new Date(member.dateOfBirth).toLocaleDateString()}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Gender: ${member.gender}`, margin, yPosition);
        yPosition += 6;
        pdf.text(`Blood Group: ${member.bloodGroup}`, margin, yPosition);
        yPosition += 15;

        // Emergency Contacts
        if (exportOptions.includeEmergencyContacts && member.emergencyContacts.length > 0) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Emergency Contacts:', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          member.emergencyContacts.forEach(contact => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(`${contact.name} (${contact.relationship}): ${contact.phone}`, margin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }

        // Allergies
        if (exportOptions.includeAllergies && member.allergies.length > 0) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Allergies:', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          member.allergies.forEach(allergy => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(`• ${allergy}`, margin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }

        // Chronic Conditions
        if (exportOptions.includeChronicConditions && member.chronicConditions.length > 0) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Chronic Conditions:', margin, yPosition);
          yPosition += 8;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          member.chronicConditions.forEach(condition => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(`• ${condition}`, margin + 5, yPosition);
            yPosition += 6;
          });
          yPosition += 10;
        }

        // Vitals
        if (exportOptions.includeVitals) {
          const memberVitals = (vitals || []).filter(vital => vital.memberId === member.id);
          if (memberVitals.length > 0) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Vital Signs:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            memberVitals.slice(-10).forEach(vital => { // Last 10 readings
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              const value = vital.secondaryValue
                ? `${vital.value}/${vital.secondaryValue} ${vital.unit}`
                : `${vital.value} ${vital.unit}`;
              pdf.text(`${vital.type.replace('_', ' ').toUpperCase()}: ${value} (${new Date(vital.recordedAt).toLocaleDateString()})`, margin + 5, yPosition);
              yPosition += 6;
            });
            yPosition += 5;
          }
        }

        // Medical Reports
        if (exportOptions.includeReports) {
          const memberReports = (reports || []).filter(report => report.memberId === member.id);
          if (memberReports.length > 0) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Medical Reports:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            memberReports.forEach(report => {
              if (yPosition > pageHeight - 25) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(`${report.title} (${report.type}) - ${new Date(report.date).toLocaleDateString()}`, margin + 5, yPosition);
              yPosition += 6;
              if (report.notes) {
                pdf.text(`Notes: ${report.notes}`, margin + 10, yPosition);
                yPosition += 6;
              }
              if (report.tags.length > 0) {
                pdf.text(`Tags: ${report.tags.join(', ')}`, margin + 10, yPosition);
                yPosition += 6;
              }
              yPosition += 3;
            });
            yPosition += 5;
          }
        }

        // Doctor Notes
        if (exportOptions.includeNotes) {
          const memberNotes = (doctorNotes || []).filter(note => note.memberId === member.id);
          if (memberNotes.length > 0) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Doctor Notes:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            memberNotes.forEach(note => {
              if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(`Dr. ${note.doctorName} (${note.specialty || 'General'}) - ${new Date(note.date).toLocaleDateString()}`, margin + 5, yPosition);
              yPosition += 6;
              pdf.text(`Content: ${note.content}`, margin + 10, yPosition);
              yPosition += 6;
              if (note.prescriptions && note.prescriptions.length > 0) {
                pdf.text(`Prescriptions: ${note.prescriptions.join(', ')}`, margin + 10, yPosition);
                yPosition += 6;
              }
              if (note.followUpDate) {
                pdf.text(`Follow-up: ${new Date(note.followUpDate).toLocaleDateString()}`, margin + 10, yPosition);
                yPosition += 6;
              }
              yPosition += 5;
            });
            yPosition += 5;
          }
        }

        // Medications
        if (exportOptions.includeMedications) {
          const memberMedications = (medications || []).filter(med => med.memberId === member.id);
          if (memberMedications.length > 0) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Medications:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            memberMedications.forEach(med => {
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(`${med.name} - ${med.dosage} (${med.frequency})`, margin + 5, yPosition);
              yPosition += 6;
              pdf.text(`Times: ${med.times.join(', ')} | Started: ${new Date(med.startDate).toLocaleDateString()}`, margin + 10, yPosition);
              yPosition += 6;
              if (med.endDate) {
                pdf.text(`End Date: ${new Date(med.endDate).toLocaleDateString()}`, margin + 10, yPosition);
                yPosition += 6;
              }
              if (med.notes) {
                pdf.text(`Notes: ${med.notes}`, margin + 10, yPosition);
                yPosition += 6;
              }
              yPosition += 3;
            });
            yPosition += 5;
          }
        }

        // Symptoms
        if (exportOptions.includeSymptoms) {
          const memberSymptoms = (symptoms || []).filter(symptom => symptom.memberId === member.id);
          if (memberSymptoms.length > 0) {
            if (yPosition > pageHeight - 30) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Symptoms:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            memberSymptoms.slice(-20).forEach(symptom => { // Last 20 symptoms
              if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(`${symptom.name} (Severity: ${symptom.severity}/5) - ${new Date(symptom.recordedAt).toLocaleDateString()}`, margin + 5, yPosition);
              yPosition += 6;
              if (symptom.notes) {
                pdf.text(`Notes: ${symptom.notes}`, margin + 10, yPosition);
                yPosition += 6;
              }
              yPosition += 3;
            });
            yPosition += 10;
          }
        }

        // Add separator between members
        if (membersToExport.indexOf(member) < membersToExport.length - 1) {
          pdf.addPage();
          yPosition = 20;
        }
      }

      // Save the PDF
      const fileName = selectedMemberId === 'all'
        ? `health-export-all-${new Date().toISOString().split('T')[0]}.pdf`
        : `health-export-${familyMembers.find(m => m.id === selectedMemberId)?.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

      pdf.save(fileName);
      toast.success('Export completed successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedMember = selectedMemberId === 'all' ? null : familyMembers.find(m => m.id === selectedMemberId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Export Medical Data</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>
            Select which family member and data types to include in the PDF export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Family Member</label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a family member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Family Members</SelectItem>
                {familyMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data to Include</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vitals"
                  checked={exportOptions.includeVitals}
                  onCheckedChange={() => handleExportOptionChange('includeVitals')}
                />
                <label htmlFor="vitals" className="text-sm font-medium">
                  Vital Signs
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reports"
                  checked={exportOptions.includeReports}
                  onCheckedChange={() => handleExportOptionChange('includeReports')}
                />
                <label htmlFor="reports" className="text-sm font-medium">
                  Medical Reports
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notes"
                  checked={exportOptions.includeNotes}
                  onCheckedChange={() => handleExportOptionChange('includeNotes')}
                />
                <label htmlFor="notes" className="text-sm font-medium">
                  Doctor Notes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="medications"
                  checked={exportOptions.includeMedications}
                  onCheckedChange={() => handleExportOptionChange('includeMedications')}
                />
                <label htmlFor="medications" className="text-sm font-medium">
                  Medications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="symptoms"
                  checked={exportOptions.includeSymptoms}
                  onCheckedChange={() => handleExportOptionChange('includeSymptoms')}
                />
                <label htmlFor="symptoms" className="text-sm font-medium">
                  Symptoms
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emergency"
                  checked={exportOptions.includeEmergencyContacts}
                  onCheckedChange={() => handleExportOptionChange('includeEmergencyContacts')}
                />
                <label htmlFor="emergency" className="text-sm font-medium">
                  Emergency Contacts
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allergies"
                  checked={exportOptions.includeAllergies}
                  onCheckedChange={() => handleExportOptionChange('includeAllergies')}
                />
                <label htmlFor="allergies" className="text-sm font-medium">
                  Allergies
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conditions"
                  checked={exportOptions.includeChronicConditions}
                  onCheckedChange={() => handleExportOptionChange('includeChronicConditions')}
                />
                <label htmlFor="conditions" className="text-sm font-medium">
                  Chronic Conditions
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Summary */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Export Summary</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {selectedMemberId === 'all' ? familyMembers.length : 1} Member(s)
              </Badge>
              {exportOptions.includeVitals && (
                <Badge variant="outline">
                  {selectedMemberId === 'all'
                    ? (vitals?.length || 0)
                    : (vitals?.filter(v => v.memberId === selectedMemberId).length || 0)} Vitals
                </Badge>
              )}
              {exportOptions.includeReports && (
                <Badge variant="outline">
                  {selectedMemberId === 'all'
                    ? (reports?.length || 0)
                    : (reports?.filter(r => r.memberId === selectedMemberId).length || 0)} Reports
                </Badge>
              )}
              {exportOptions.includeNotes && (
                <Badge variant="outline">
                  {selectedMemberId === 'all'
                    ? (doctorNotes?.length || 0)
                    : (doctorNotes?.filter(n => n.memberId === selectedMemberId).length || 0)} Notes
                </Badge>
              )}
              {exportOptions.includeMedications && (
                <Badge variant="outline">
                  {selectedMemberId === 'all'
                    ? (medications?.length || 0)
                    : (medications?.filter(m => m.memberId === selectedMemberId).length || 0)} Medications
                </Badge>
              )}
              {exportOptions.includeSymptoms && (
                <Badge variant="outline">
                  {selectedMemberId === 'all'
                    ? (symptoms?.length || 0)
                    : (symptoms?.filter(s => s.memberId === selectedMemberId).length || 0)} Symptoms
                </Badge>
              )}
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={generatePDF}
            disabled={isExporting || familyMembers.length === 0}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to PDF
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Export;