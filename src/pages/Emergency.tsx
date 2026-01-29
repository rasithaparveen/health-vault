import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFamily } from '@/contexts/FamilyContext';
import { AlertTriangle, Phone, MapPin, Droplet, Heart, Activity, Thermometer, User, Shield } from 'lucide-react';

export default function Emergency() {
  const { activeMember, familyMembers } = useFamily();

  if (!activeMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-2">No Family Member Selected</h1>
        <p className="text-muted-foreground">Please select a family member to view their emergency information.</p>
      </div>
    );
  }

  const emergencyContacts = activeMember.emergencyContacts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Emergency Information</h1>
          <p className="text-muted-foreground">
            Critical health information and emergency contacts for {activeMember.name}
          </p>
        </div>
        <Button 
          variant="destructive" 
          size="lg" 
          className="gap-2"
          onClick={() => window.location.href = 'tel:911'}
        >
          <AlertTriangle className="h-5 w-5" />
          Call Emergency Services
        </Button>
      </div>

      {/* Emergency Contacts */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Phone className="h-5 w-5" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyContacts.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No emergency contacts configured.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add emergency contacts in the Profile section.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{contact.name}</h3>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => window.location.href = `tel:${contact.phone}`}
                  >
                    <Phone className="h-4 w-4" />
                    Call {contact.phone}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Critical Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Name:</span>
                <span>{activeMember.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Blood Type:</span>
                <Badge variant="outline">{activeMember.bloodGroup || 'Not specified'}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date of Birth:</span>
                <span>{new Date(activeMember.dateOfBirth).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Gender:</span>
                <span className="capitalize">{activeMember.gender}</span>
              </div>
            </div>
          </div>

          {/* Allergies */}
          {activeMember.allergies.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Allergies
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeMember.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="text-sm">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chronic Conditions */}
          {activeMember.chronicConditions.length > 0 && (
            <div>
              <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Chronic Conditions
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeMember.chronicConditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-sm border-orange-200 text-orange-700">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Services */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <AlertTriangle className="h-5 w-5" />
            Emergency Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-red-200 hover:bg-red-50"
              onClick={() => window.location.href = 'tel:911'}
            >
              <div className="text-2xl font-bold text-red-600">911</div>
              <div className="text-sm">Emergency Services</div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-blue-200 hover:bg-blue-50"
              onClick={() => window.location.href = 'tel:1-800-222-1222'}
            >
              <div className="text-2xl font-bold text-blue-600">Poison</div>
              <div className="text-sm">Control Center</div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col gap-2 border-green-200 hover:bg-green-50"
              onClick={() => window.location.href = 'tel:911'}
            >
              <div className="text-2xl font-bold text-green-600">Local</div>
              <div className="text-sm">Hospital</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex flex-col gap-1"
              onClick={() => window.open('https://www.google.com/maps/search/hospitals+near+me', '_blank')}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-xs">Find Hospital</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col gap-1"
              onClick={() => window.location.href = 'tel:911'}
            >
              <Phone className="h-5 w-5" />
              <span className="text-xs">Call Ambulance</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col gap-1"
              onClick={() => alert('Medical ID: This would show a digital medical ID with critical information')}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs">Medical ID</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex flex-col gap-1"
              onClick={() => alert('Insurance Info: This would show insurance details and emergency contacts')}
            >
              <Shield className="h-5 w-5" />
              <span className="text-xs">Insurance Info</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}