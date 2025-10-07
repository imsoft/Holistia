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

        // Obtener usuarios desde professional_applications y datos comparativos
        const [
          { data: professionalUsers, error: professionalError },
          { data: lastMonthUsers }
        ] = await Promise.all([
          supabase
            .from('professional_applications')
            .select('user_id, first_name, last_name, email, phone, status, submitted_at, reviewed_at, profile_photo'),
          supabase
            .from('professional_applications')
            .select('user_id, first_name, last_name, email, phone, status, submitted_at, reviewed_at, profile_photo')
            .gte('submitted_at', lastMonthStart.toISOString())
            .lte('submitted_at', lastMonthEnd.toISOString())
        ]);

        if (professionalError) {
          console.error('Error fetching professional users:', professionalError);
          setUsers([]);
          return;
        }

        // Transformar usuarios a nuestro formato
        const transformedUsers: User[] = await Promise.all(
          (professionalUsers || []).map(async (prof) => {
            // Obtener número de citas del usuario
            const { count: appointmentsCount } = await supabase
              .from('appointments')
              .select('*', { count: 'exact', head: true })
              .eq('patient_id', prof.user_id);

            // Usar la foto de perfil de la solicitud profesional
            const avatarUrl = prof.profile_photo;

            // Determinar el estado basado en el status de la aplicación
            let status: 'active' | 'inactive' | 'suspended' = 'active';
            if (prof.status === 'rejected') {
              status = 'inactive';
            }

            // Determinar el tipo de usuario
            let userType: 'user' | 'professional' | 'admin' | 'patient' = 'patient';
            if (prof.status === 'approved') {
              userType = 'professional';
            }

            return {
              id: prof.user_id,
              name: `${prof.first_name} ${prof.last_name}`,
              email: prof.email,
              phone: prof.phone,
              location: 'Ciudad de México',
              status,
              type: userType,
              joinDate: prof.submitted_at,
              lastLogin: prof.reviewed_at || prof.submitted_at,
              appointments: appointmentsCount || 0,
              avatar: avatarUrl,
            };
          })
        );

        setUsers(transformedUsers);

        // Calcular estadísticas para el dashboard
        const thisMonthUsers = professionalUsers?.filter(user => {
          const submittedAt = new Date(user.submitted_at);
          return submittedAt >= currentMonthStart;
        }).length || 0;

        const totalAppointments = transformedUsers.reduce((acc, user) => acc + (user.appointments || 0), 0);

        setStatsData({
          totalThisMonth: thisMonthUsers,
          lastMonth: lastMonthUsers?.length || 0,
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
        user.phone || 'N/A',
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
      
      // Aquí actualizarías el estado del usuario en la base de datos
      // Por ahora solo actualizamos el estado local
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
    } finally {
      setActionLoading(null);
    }
  };

  // Función para reactivar un usuario
  const handleReactivateUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      
      // Aquí actualizarías el estado del usuario en la base de datos
      // Por ahora solo actualizamos el estado local
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="px-6 py-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Image
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                      width={60}
                      height={60}
                      className="h-15 w-15 aspect-square rounded-full object-cover border-2 border-border"
                    />
                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background ${
                      user.status === "active" ? "bg-green-500" : 
                      user.status === "inactive" ? "bg-red-500" : "bg-yellow-500"
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
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

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{user.appointments} citas</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-4">
                  <p>Último acceso: {new Date(user.lastLogin).toLocaleDateString('es-ES')}</p>
                  <p>Registrado: {new Date(user.joinDate).toLocaleDateString('es-ES')}</p>
                </div>

                <div className="flex items-center gap-2">
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
                <h3 className="text-lg font-semibold mb-3">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Nombre:</span>
                    <span>{selectedUser.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Tipo:</span>
                    <Badge className={getTypeColor(selectedUser.type)}>
                      {getTypeText(selectedUser.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Estado:</span>
                    <Badge className={getStatusColor(selectedUser.status)}>
                      {getStatusText(selectedUser.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Citas:</span>
                    <span>{selectedUser.appointments}</span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{selectedUser.phone || 'No disponible'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Ubicación:</span>
                    <span>{selectedUser.location || 'No especificada'}</span>
                  </div>
                </div>
              </div>

              {/* Información de actividad */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Información de Actividad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Fecha de registro:</span>
                    <span>{new Date(selectedUser.joinDate).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Último acceso:</span>
                    <span>{new Date(selectedUser.lastLogin).toLocaleDateString('es-ES')}</span>
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
