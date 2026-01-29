import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFamily } from '@/contexts/FamilyContext';
import type { MedicalReport } from '@/types/health';
import { Plus, FileText, Download, Eye, Trash2, Upload, Calendar, Tag } from 'lucide-react';
import { formatDate, storage } from '@/lib/storage';

export default function Reports() {
  const { activeMember } = useFamily();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'lab' as MedicalReport['type'],
    date: '',
    notes: '',
    tags: '',
  });

  const allReports = storage.getData().reports;
  const memberReports = activeMember ? allReports.filter(r => r.memberId === activeMember.id) : [];

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'lab',
      date: '',
      notes: '',
      tags: '',
    });
  };

  const handleAddReport = () => {
    if (!activeMember || !formData.title || !formData.date) return;

    const newReport: MedicalReport = {
      id: crypto.randomUUID(),
      memberId: activeMember.id,
      title: formData.title,
      type: formData.type,
      date: formData.date,
      fileUrl: '', // In a real app, this would be uploaded
      fileType: 'pdf', // Default
      notes: formData.notes,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      createdAt: new Date().toISOString(),
    };

    const data = storage.getData();
    data.reports.push(newReport);
    storage.setData(data);

    storage.logActivity({
      action: 'create',
      entityType: 'report',
      entityId: newReport.id,
      description: `Added medical report: ${newReport.title}`,
    });

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      const data = storage.getData();
      data.reports = data.reports.filter(r => r.id !== reportId);
      storage.setData(data);

      storage.logActivity({
        action: 'delete',
        entityType: 'report',
        entityId: reportId,
        description: 'Deleted medical report',
      });
    }
  };

  const getTypeColor = (type: MedicalReport['type']) => {
    switch (type) {
      case 'lab': return 'bg-blue-100 text-blue-800';
      case 'imaging': return 'bg-green-100 text-green-800';
      case 'prescription': return 'bg-purple-100 text-purple-800';
      case 'discharge': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their medical reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Medical Reports</h1>
          <p className="text-muted-foreground">
            Manage medical reports and documents for {activeMember.name}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Medical Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Blood Test Results"
                />
              </div>

              <div>
                <Label htmlFor="type">Report Type</Label>
                <Select value={formData.type} onValueChange={(value: MedicalReport['type']) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lab">Lab Results</SelectItem>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="discharge">Discharge Summary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Report Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this report"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., annual checkup, cardiology"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddReport} disabled={!formData.title || !formData.date}>
                  Add Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports List */}
      {memberReports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Medical Reports</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload medical reports and documents to keep track of {activeMember.name}'s health records.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Add First Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {memberReports
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <Badge className={getTypeColor(report.type)}>
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(report.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {report.tags.length} tags
                        </span>
                      </div>
                      {report.notes && (
                        <p className="text-sm text-muted-foreground mb-3">{report.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {report.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}