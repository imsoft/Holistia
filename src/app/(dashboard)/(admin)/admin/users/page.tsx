"use client";

import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";
import {
  Users,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { formatPhone } from "@/utils/phone-utils";

// Interfaces para los datos dinámicos
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  status: 'active' | 'inactive' | 'suspended';
  type: 'user' | 'professional' | 'admin' | 'patient';
  joinDate: string;
  lastLogin: string;
  appointments: number;
  avatar?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statsData, setStatsData] = useState({
    totalThisMonth: 0,
    lastMonth: 0,
    totalAppointments: 0
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  // Obtener usuarios de la base de datos
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Fechas para comparaciones
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Obtener TODOS los usuarios desde la tabla profiles
        const [
          { data: allProfiles, error: profilesError },
          { data: lastMonthProfiles }
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, first_name, last_name, email, phone, avatar_url, type, created_at, updated_at, account_status'),
          supabase
            .from('profiles')
            .select('id')
            .gte('created_at', lastMonthStart.toISOString())
            .lte('created_at', lastMonthEnd.toISOString())
        ]);

        if (profilesError) {
          console.error('Error fetching users:', profilesError);
          setUsers([]);
          return;
        }

        if (!allProfiles || allProfiles.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
        const userIds = allProfiles.map(p => p.id);
        
        // Obtener todos los datos en batch (solo 3 queries en total en lugar de 3 * N)
        const [
          allProfessionalAppsResult,
          allPatientAppointmentsResult,
          allProfessionalAppointmentsResult
        ] = await Promise.allSettled([
          // Todas las solicitudes profesionales de todos los usuarios
          supabase
            .from('professional_applications')
            .select('user_id, city, state, status, submitted_at')
            .in('user_id', userIds),
          // Todos los appointments como paciente
          supabase
            .from('appointments')
            .select('patient_id')
            .in('patient_id', userIds),
          // Todos los appointments como profesional
          supabase
            .from('appointments')
            .select('professional_id')
            .in('professional_id', userIds)
        ]);

        // Procesar resultados de batch queries
        const allProfessionalApps = allProfessionalAppsResult.status === 'fulfilled' ? (allProfessionalAppsResult.value.data || []) : [];
        const allPatientAppointments = allPatientAppointmentsResult.status === 'fulfilled' ? (allPatientAppointmentsResult.value.data || []) : [];
        const allProfessionalAppointments = allProfessionalAppointmentsResult.status === 'fulfilled' ? (allProfessionalAppointmentsResult.value.data || []) : [];

        // Crear maps para acceso rápido O(1)
        const professionalAppsMap = new Map<string, any>();
        const patientAppointmentsMap = new Map<string, number>();
        const professionalAppointmentsMap = new Map<string, number>();

        // Agrupar professional_applications por user_id (puede haber solo una por usuario)
        allProfessionalApps.forEach((app: any) => {
          professionalAppsMap.set(app.user_id, app);
        });

        // Contar appointments como paciente por patient_id
        allPatientAppointments.forEach((apt: any) => {
          const patientId = apt.patient_id;
          patientAppointmentsMap.set(patientId, (patientAppointmentsMap.get(patientId) || 0) + 1);
        });

        // Contar appointments como profesional por professional_id
        allProfessionalAppointments.forEach((apt: any) => {
          const professionalId = apt.professional_id;
          professionalAppointmentsMap.set(professionalId, (professionalAppointmentsMap.get(professionalId) || 0) + 1);
        });

        // Transformar usuarios a nuestro formato (ya no necesitamos Promise.all, todo está en memoria)
        const transformedUsers: User[] = (allProfiles || []).map((profile) => {
          // Obtener solicitud profesional desde el map
          const professionalApp = professionalAppsMap.get(profile.id);

          // Obtener conteo de appointments desde los maps
          const patientAppointmentsCount = patientAppointmentsMap.get(profile.id) || 0;
          const professionalAppointmentsCount = professionalAppointmentsMap.get(profile.id) || 0;
          const appointmentsCount = patientAppointmentsCount + professionalAppointmentsCount;

          // Determinar el estado del usuario
          let status: 'active' | 'inactive' | 'suspended' = 'active';
          if (profile.account_status) {
            status = profile.account_status as 'active' | 'inactive' | 'suspended';
          }

          // Determinar el tipo de usuario
          let userType: 'user' | 'professional' | 'admin' | 'patient' = profile.type || 'patient';
          if (professionalApp && professionalApp.status === 'approved') {
            userType = 'professional';
          }

          // Construir ubicación desde professional_applications si existe
          let location = 'No especificada';
          if (professionalApp) {
            if (professionalApp.city && professionalApp.state) {
              location = `${professionalApp.city}, ${professionalApp.state}`;
            } else if (professionalApp.city) {
              location = professionalApp.city;
            } else if (professionalApp.state) {
              location = professionalApp.state;
            }
          }

          return {
            id: profile.id,
            name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sin nombre',
            email: profile.email,
            phone: profile.phone || '',
            location,
            status,
            type: userType,
            joinDate: profile.created_at,
            lastLogin: profile.updated_at || profile.created_at,
            appointments: appointmentsCount,
            avatar: profile.avatar_url || '',
          };
        });

        setUsers(transformedUsers);

        // Calcular estadísticas para el dashboard
        const thisMonthUsers = allProfiles?.filter(user => {
          const createdAt = new Date(user.created_at);
          return createdAt >= currentMonthStart;
        }).length || 0;

        const totalAppointments = transformedUsers.reduce((acc, user) => acc + (user.appointments || 0), 0);

        setStatsData({
          totalThisMonth: thisMonthUsers,
          lastMonth: lastMonthProfiles?.length || 0,
          totalAppointments
        });

      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "suspended":
        return "Suspendido";
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "user":
      case "patient":
        return "bg-blue-100 text-blue-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "user":
      case "patient":
        return "Usuario";
      case "professional":
        return "Profesional";
      case "admin":
        return "Administrador";
      default:
        return type;
    }
  };

  // Función para exportar la lista de usuarios
  const handleExportUsers = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Tipo', 'Estado', 'Fecha de Registro', 'Último Login', 'Citas'],
      ...filteredUsers.map(user => [
        user.name,
        user.email,
        user.phone ? formatPhone(user.phone) : 'N/A',
        getTypeText(user.type),
        getStatusText(user.status),
        new Date(user.joinDate).toLocaleDateString('es-ES'),
        new Date(user.lastLogin).toLocaleDateString('es-ES'),
        user.appointments.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para ver el perfil del usuario
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  // Función para suspender un usuario
  const handleSuspendUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      
      const response = await fetch('/api/admin/update-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status: 'suspended'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al suspender usuario');
      }

      // Actualizar el estado local
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, status: 'suspended' as const }
            : user
        )
      );
      
      console.log('Usuario suspendido:', userId);
    } catch (error) {
      console.error('Error al suspender usuario:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setActionLoading(null);
    }
  };

  // Función para reactivar un usuario
  const handleReactivateUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      
      const response = await fetch('/api/admin/update-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          status: 'active'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al reactivar usuario');
      }

      // Actualizar el estado local
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, status: 'active' as const }
            : user
        )
      );
      
      console.log('Usuario reactivado:', userId);
    } catch (error) {
      console.error('Error al reactivar usuario:', error);
      // Aquí podrías mostrar un toast de error
    } finally {
      setActionLoading(null);
    }
  };

  // Función para calcular porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      user.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesType = typeFilter === "all" || user.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Usuarios</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona todos los usuarios de la plataforma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline"
              size="sm"
              className="sm:size-default w-full sm:w-auto"
              onClick={handleExportUsers}
            >
              <Shield className="h-4 w-4 mr-2" />
              <span>Exportar Lista</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usuarios
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculatePercentageChange(statsData.totalThisMonth, statsData.lastMonth)} vs mes anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {users.length > 0 ? Math.round((users.filter(u => u.status === "active").length / users.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactivos
              </CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === "inactive").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {users.length > 0 ? Math.round((users.filter(u => u.status === "inactive").length / users.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suspendidos
              </CardTitle>
              <Shield className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {users.filter(u => u.status === "suspended").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {users.length > 0 ? Math.round((users.filter(u => u.status === "suspended").length / users.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Citas
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {statsData.totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">En toda la plataforma</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="patient">Usuario</SelectItem>
                  <SelectItem value="professional">Profesional</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportUsers}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
              <CardContent className="px-6 py-6 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                      width={60}
                      height={60}
                      className="h-15 w-15 aspect-square rounded-full object-cover border-2 border-border"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground line-clamp-1">
                        {user.name}
                      </h3>
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusText(user.status)}
                      </Badge>
                    </div>
                    <Badge className={getTypeColor(user.type)}>
                      {getTypeText(user.type)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formatPhone(user.phone || '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{user.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{user.appointments} citas</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-4 space-y-1">
                  <p className="truncate">Último acceso: {new Date(user.lastLogin).toLocaleDateString('es-ES')}</p>
                  <p className="truncate">Registrado: {new Date(user.joinDate).toLocaleDateString('es-ES')}</p>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(user)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                  {user.status === "suspended" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReactivateUser(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {actionLoading === user.id ? 'Reactivando...' : 'Reactivar'}
                    </Button>
                  )}
                  {user.status === "active" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSuspendUser(user.id)}
                      disabled={actionLoading === user.id}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      {actionLoading === user.id ? 'Suspendiendo...' : 'Suspender'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="px-8 py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron usuarios
              </h3>
              <p className="text-muted-foreground">
                No hay usuarios que coincidan con los filtros seleccionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para ver perfil del usuario */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Perfil del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Información personal */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Nombre</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedUser.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Tipo</span>
                      <Badge className={getTypeColor(selectedUser.type)}>
                        {getTypeText(selectedUser.type)}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Estado</span>
                      <Badge className={getStatusColor(selectedUser.status)}>
                        {getStatusText(selectedUser.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Citas</span>
                    <span className="text-base font-medium">{selectedUser.appointments}</span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <span className="text-base font-medium pl-6 break-all">{selectedUser.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Teléfono</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedUser.phone ? formatPhone(selectedUser.phone) : 'No disponible'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Ubicación</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedUser.location || 'No especificada'}</span>
                  </div>
                </div>
              </div>

              {/* Información de actividad */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información de Actividad</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha de registro</span>
                    </div>
                    <span className="text-base font-medium pl-6">{new Date(selectedUser.joinDate).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Último acceso</span>
                    </div>
                    <span className="text-base font-medium pl-6">{new Date(selectedUser.lastLogin).toLocaleDateString('es-ES')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
