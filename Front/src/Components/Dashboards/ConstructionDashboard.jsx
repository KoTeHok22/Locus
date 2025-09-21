import { useState, useEffect } from 'react';
import authService from '../../authService.js';
import '../../index.css';
import { Building2, AlertTriangle, Clock, CheckCircle, Filter, Bell, ChevronRight, Plus, Minus, Maximize2, Calendar, Truck, User, HardHat, Shield } from 'lucide-react';

// Mock data - in a real app this would come from an API
const mockObjects = [
  {
    id: '1',
    name: 'ЖК "Северный квартал"',
    address: 'ул. Ленина, 15',
    status: 'critical',
    healthIndex: 45,
    x: 25,
    y: 30,
    contractor: 'СтройТех',
    healthSegments: { success: 20, warning: 30, critical: 50 },
    issues: [
      { 
        icon: 'calendar', 
        text: 'Прогноз срыва срока:', 
        value: '+5 дней', 
        status: 'critical' 
      },
      { 
        icon: 'truck', 
        text: 'Обеспеченность материалами:', 
        value: '40%', 
        status: 'warning' 
      },
      { 
        icon: 'alert', 
        text: 'Открытых нарушений:', 
        value: '3 (1 просрочено)', 
        status: 'critical' 
      }
    ]
  },
  {
    id: '2',
    name: 'Офисный центр "Альфа"',
    address: 'пр. Мира, 42',
    status: 'warning',
    healthIndex: 72,
    x: 60,
    y: 45,
    contractor: 'МегаСтрой',
    healthSegments: { success: 50, warning: 40, critical: 10 },
    issues: [
      { 
        icon: 'calendar', 
        text: 'Отставание от плана:', 
        value: '2 дня', 
        status: 'warning' 
      },
      { 
        icon: 'truck', 
        text: 'Обеспеченность материалами:', 
        value: '75%', 
        status: 'warning' 
      }
    ]
  },
  {
    id: '3',
    name: 'Торговый комплекс "Центр"',
    address: 'ул. Советская, 28',
    status: 'critical',
    healthIndex: 35,
    x: 40,
    y: 70,
    contractor: 'ПремиумБилд',
    healthSegments: { success: 15, warning: 25, critical: 60 },
    issues: [
      { 
        icon: 'calendar', 
        text: 'Критическая задержка:', 
        value: '+12 дней', 
        status: 'critical' 
      },
      { 
        icon: 'alert', 
        text: 'Открытых нарушений:', 
        value: '7 (4 просрочено)', 
        status: 'critical' 
      }
    ]
  },
  {
    id: '4',
    name: 'Склад "Логистика+"',
    address: 'пер. Индустриальный, 5',
    status: 'warning',
    healthIndex: 68,
    x: 75,
    y: 25,
    contractor: 'УральСтройПроект',
    healthSegments: { success: 45, warning: 45, critical: 10 },
    issues: [
      { 
        icon: 'truck', 
        text: 'Обеспеченность материалами:', 
        value: '55%', 
        status: 'warning' 
      }
    ]
  },
  {
    id: '5',
    name: 'Коттеджный поселок "Заречье"',
    address: 'ул. Заречная, 101',
    status: 'success',
    healthIndex: 92,
    x: 20,
    y: 60,
    contractor: 'СтройТех',
    healthSegments: { success: 85, warning: 15, critical: 0 },
    issues: []
  },
  {
    id: '6',
    name: 'Спорткомплекс "Арена"',
    address: 'ул. Спортивная, 12',
    status: 'success',
    healthIndex: 88,
    x: 80,
    y: 55,
    contractor: 'МегаСтрой',
    healthSegments: { success: 80, warning: 20, critical: 0 },
    issues: []
  }
];

// Mock data for foreman dashboard
const mockTasks = [
  {
    id: '1',
    title: 'Заливка фундамента, сектор А',
    description: 'Подготовка опалубки и заливка бетона в секторе А здания',
    priority: 'high',
    status: 'pending',
    deadline: 'до 16:00'
  },
  {
    id: '2',
    title: 'Приемка арматуры',
    description: 'Проверка качества и соответствия арматуры проекту',
    priority: 'high',
    status: 'pending',
    deadline: 'до 14:00'
  },
  {
    id: '3',
    title: 'Установка ограждения',
    description: 'Монтаж временного ограждения на участке работ',
    priority: 'medium',
    status: 'completed',
    deadline: 'до 12:00'
  },
  {
    id: '4',
    title: 'Подготовка участка под фундамент',
    description: 'Выравнивание и уплотнение грунта',
    priority: 'medium',
    status: 'blocked',
    deadline: 'до 10:00'
  }
];

const mockBlockers = [
  {
    id: '1',
    type: 'inspection',
    title: 'Замечание от Инспектора #102',
    description: 'Неправильное хранение материалов. Требуется переместить арматуру в крытый склад.',
    severity: 'critical',
    deadline: 'сегодня до 18:00',
    source: 'Госстройнадзор',
    actionRequired: 'photo'
  },
  {
    id: '2',
    type: 'client',
    title: 'Отклонение отчета по задаче #88',
    description: 'Заказчик требует дополнительные фотографии выполненных работ по гидроизоляции.',
    severity: 'warning',
    deadline: 'завтра до 12:00',
    source: 'ООО "СтройИнвест"',
    actionRequired: 'photo'
  },
  {
    id: '3',
    type: 'safety',
    title: 'Нарушение техники безопасности',
    description: 'Рабочий без каски в опасной зоне. Требуется провести инструктаж.',
    severity: 'critical',
    deadline: 'срочно',
    source: 'Служба безопасности',
    actionRequired: 'document'
  }
];

const mockDeliveries = [
  {
    id: '1',
    material: 'Цементовоз (М400)',
    supplier: 'БетонСервис',
    status: 'arriving-today',
    estimatedTime: '14:00',
    quantity: '25 тонн',
    priority: 'high',
    trackingInfo: 'TR-4521'
  },
  {
    id: '2',
    material: 'Кабель ВВГ 3x2.5',
    supplier: 'ЭлектроПоставка',
    status: 'in-transit',
    estimatedTime: 'завтра утром',
    quantity: '500 метров',
    priority: 'medium',
    trackingInfo: 'EL-8901'
  },
  {
    id: '3',
    material: 'Арматура А500С',
    supplier: 'МеталлТорг',
    status: 'delayed',
    estimatedTime: 'послезавтра',
    quantity: '2 тонны',
    priority: 'low'
  },
  {
    id: '4',
    material: 'Песок строительный',
    supplier: 'СтройМатериалы',
    status: 'delivered',
    actualTime: '09:30',
    quantity: '10 кубов',
    priority: 'medium',
    trackingInfo: 'SM-3456'
  }
];

// Mock data for inspector dashboard
const mockInspections = [
  {
    id: '1',
    objectName: 'ЖК "Северный квартал"',
    address: 'ул. Ленина, 15',
    date: '2024-09-20',
    time: '09:00',
    type: 'planned',
    status: 'scheduled',
    purpose: 'Плановая проверка соблюдения техники безопасности',
    contractor: 'СтройТех'
  },
  {
    id: '2',
    objectName: 'Торговый комплекс "Центр"',
    address: 'ул. Советская, 28',
    date: '2024-09-20',
    time: '14:00',
    type: 'followup',
    status: 'scheduled',
    purpose: 'Контроль исправления нарушений №102, №105',
    contractor: 'ПремиумБилд'
  },
  {
    id: '3',
    objectName: 'Офисный центр "Альфа"',
    address: 'пр. Мира, 42',
    date: '2024-09-19',
    time: '11:00',
    type: 'urgent',
    status: 'overdue',
    purpose: 'Внеплановая проверка по жалобе',
    contractor: 'МегаСтрой'
  }
];

const mockVerifications = [
  {
    id: '1',
    violationId: '102',
    objectName: 'ЖК "Северный квартал"',
    contractorName: 'СтройТех',
    foremanName: 'Петр Петров',
    violationType: 'Неправильное хранение материалов',
    description: 'Арматура хранится под открытым небом без защиты от коррозии',
    reportedDate: '2024-09-15',
    deadlineDate: '2024-09-20',
    fixedDate: '2024-09-19',
    priority: 'high',
    evidenceType: 'photo',
    status: 'pending'
  },
  {
    id: '2',
    violationId: '88',
    objectName: 'Торговый комплекс "Центр"',
    contractorName: 'ПремиумБилд',
    foremanName: 'Иван Иванов',
    violationType: 'Нарушение гидроизоляции',
    description: 'Некачественная гидроизоляция фундамента',
    reportedDate: '2024-09-12',
    deadlineDate: '2024-09-22',
    fixedDate: '2024-09-18',
    priority: 'medium',
    evidenceType: 'photo',
    status: 'pending'
  },
  {
    id: '3',
    violationId: '95',
    objectName: 'Офисный центр "Альфа"',
    contractorName: 'МегаСтрой',
    foremanName: 'Сергей Сидоров',
    violationType: 'Отсутствие средств защиты',
    description: 'Рабочие без касок в опасной зоне',
    reportedDate: '2024-09-10',
    deadlineDate: '2024-09-18',
    fixedDate: '2024-09-17',
    priority: 'high',
    evidenceType: 'document',
    status: 'pending'
  }
];

const mockContractors = [
  {
    id: '1',
    name: 'ПремиумБилд',
    totalViolations: 48,
    overdueFixings: 8,
    averageFixTime: 4.2,
    mostCommonViolation: {
      type: 'Неправильное складирование материалов',
      count: 12,
      objectsAffected: 5
    },
    riskScore: 85,
    trend: 'worsening',
    activeObjects: 3,
    violationsPerObject: 16.0
  },
  {
    id: '2',
    name: 'СтройТех',
    totalViolations: 23,
    overdueFixings: 3,
    averageFixTime: 2.8,
    mostCommonViolation: {
      type: 'Нарушения техники безопасности',
      count: 8,
      objectsAffected: 4
    },
    riskScore: 45,
    trend: 'improving',
    activeObjects: 4,
    violationsPerObject: 5.8
  },
  {
    id: '3',
    name: 'МегаСтрой',
    totalViolations: 31,
    overdueFixings: 5,
    averageFixTime: 3.5,
    mostCommonViolation: {
      type: 'Качество выполнения работ',
      count: 10,
      objectsAffected: 3
    },
    riskScore: 62,
    trend: 'stable',
    activeObjects: 2,
    violationsPerObject: 15.5
  }
];

const mockRedZoneObjects = [
  {
    id: '1',
    name: 'Торговый комплекс "Центр"',
    address: 'ул. Советская, 28',
    contractor: 'ПремиумБилд',
    riskScore: 89,
    totalViolations: 7,
    overdueViolations: 4,
    averageFixDelay: 3.2,
    suspiciousActivity: [
      {
        type: 'pattern_violations',
        description: 'Повторяющиеся нарушения складирования материалов',
        severity: 'high'
      },
      {
        type: 'delayed_fixes',
        description: 'Систематические задержки исправления нарушений',
        severity: 'high'
      }
    ],
    lastInspectionDate: '2024-09-10',
    nextInspectionDate: '2024-09-25',
    priority: 'urgent'
  },
  {
    id: '2',
    name: 'ЖК "Северный квартал"',
    address: 'ул. Ленина, 15',
    contractor: 'СтройТех',
    riskScore: 72,
    totalViolations: 3,
    overdueViolations: 1,
    averageFixDelay: 1.5,
    suspiciousActivity: [
      {
        type: 'rapid_reports',
        description: 'Слишком быстрое сообщение об исправлении (10 отчетов за 1 час)',
        severity: 'medium'
      }
    ],
    lastInspectionDate: '2024-09-08',
    nextInspectionDate: '2024-09-20',
    priority: 'high'
  }
];

function ConstructionDashboard({ onSwitchToLogin }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('manager'); // Default role
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedContractor, setSelectedContractor] = useState('Все подрядчики');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mobileActiveTab, setMobileActiveTab] = useState('list');
  const [hoveredObject, setHoveredObject] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = authService.getToken();
        if (!token) {
          onSwitchToLogin();
          return;
        }
        
        const profile = await authService.getProfile(token);
        setUser(profile.user);
        
        // Set user role from API response
        if (profile.user && profile.user.role) {
          setUserRole(profile.user.role);
        }
      } catch {
        setError('Ошибка загрузки профиля');
        onSwitchToLogin();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [onSwitchToLogin]);

  const getFilteredObjects = () => {
    return mockObjects.filter(obj => {
      const matchesSearch = obj.name.toLowerCase().includes(searchValue.toLowerCase()) || 
                           obj.address.toLowerCase().includes(searchValue.toLowerCase());
      
      const matchesContractor = selectedContractor === 'Все подрядчики' || 
                               obj.contractor === selectedContractor;
      
      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'critical' ? obj.status === 'critical' :
        statusFilter === 'risk' ? obj.status === 'warning' :
        statusFilter === 'normal' ? obj.status === 'success' :
        true;

      return matchesSearch && matchesContractor && matchesStatus;
    });
  };

  const filteredObjects = getFilteredObjects();

  // Calculate stats
  const successCount = mockObjects.filter(obj => obj.status === 'success').length;
  const warningCount = mockObjects.filter(obj => obj.status === 'warning').length;
  const criticalCount = mockObjects.filter(obj => obj.status === 'critical').length;

  const handleObjectDetails = (id) => {
    console.log('Opening details for object:', id);
  };

  const handleLogout = () => {
    authService.logout();
    onSwitchToLogin();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'success': return '#10B981';
      default: return '#64748B';
    }
  };

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'critical':
        return <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Критично</span>;
      case 'warning':
        return <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">Риск</span>;
      case 'success':
        return <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Норма</span>;
      default:
        return <span className="border border-gray-300 text-gray-500 text-xs px-2 py-1 rounded-full">Неизвестно</span>;
    }
  };

  const getIcon = (iconType) => {
    switch (iconType) {
      case 'calendar': return <Calendar size={16} />;
      case 'truck': return <Truck size={16} />;
      case 'alert': return <AlertTriangle size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  const getIssueColor = (status) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'success': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getDefaultSegments = (object) => {
    // Generate default segments based on object status
    switch (object.status) {
      case 'critical':
        return { success: 20, warning: 30, critical: 50 };
      case 'warning':
        return { success: 40, warning: 50, critical: 10 };
      case 'success':
        return { success: 85, warning: 15, critical: 0 };
      default:
        return { success: 50, warning: 30, critical: 20 };
    }
  };

  const extractNumbers = (text) => {
    // Extract numbers from text and make them bold
    return text.replace(/(\d+)/g, '<span class="font-semibold">$1</span>');
  };

  // Filter and sort objects - show only critical and warning, sorted by priority
  const priorityObjects = mockObjects
    .filter(obj => obj.status === 'critical' || obj.status === 'warning')
    .sort((a, b) => {
      if (a.status === 'critical' && b.status === 'warning') return -1;
      if (a.status === 'warning' && b.status === 'critical') return 1;
      return 0;
    });

  const getRoleTitle = () => {
    switch (userRole) {
      case 'manager': return 'Контроль строительства';
      case 'foreman': return 'Боевой пост';
      case 'inspector': return 'Карта нарушений';
      default: return 'Контроль строительства';
    }
  };

  const getRoleSubtitle = () => {
    switch (userRole) {
      case 'manager': return 'Система управления объектами';
      case 'foreman': return 'Управление объектом';
      case 'inspector': return 'Контроль соответствия нормам';
      default: return 'Система управления объектами';
    }
  };

  const getUserInfo = () => {
    switch (userRole) {
      case 'manager': return { initials: 'ИИ', name: user?.email || 'Иван Иванов', position: 'Руководитель' };
      case 'foreman': return { initials: 'ПП', name: user?.email || 'Петр Петров', position: 'Прораб' };
      case 'inspector': return { initials: 'СС', name: user?.email || 'Сергей Сергеев', position: 'Инспектор' };
      default: return { initials: 'ИИ', name: user?.email || 'Иван Иванов', position: 'Руководитель' };
    }
  };

  const userInfo = getUserInfo();

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleTaskComplete = (taskId) => {
    console.log('Task completed:', taskId);
  };

  const handleTaskProblem = (taskId) => {
    console.log('Task has problem:', taskId);
  };

  const handleTakeAction = (blockerId, action) => {
    console.log('Taking action on blocker:', blockerId, action);
  };

  const handleTakePhoto = () => {
    console.log('Taking photo');
  };

  const handleUploadReport = () => {
    console.log('Uploading report');
  };

  const handleReportProblem = () => {
    console.log('Reporting problem');
  };

  const handleViewInspectionDetails = (id) => {
    console.log('Viewing inspection details:', id);
  };

  const handleMarkInspectionCompleted = (id) => {
    console.log('Marking inspection completed:', id);
  };

  const handleApproveVerification = (id) => {
    console.log('Approving verification:', id);
  };

  const handleRejectVerification = (id) => {
    console.log('Rejecting verification:', id);
  };

  const handleViewEvidence = (id) => {
    console.log('Viewing evidence:', id);
  };

  const handleScheduleInspection = (id) => {
    console.log('Scheduling inspection for object:', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">СК</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  {getRoleTitle()}
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  {getRoleSubtitle()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-gray-100">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">{userInfo.initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {userInfo.name}
                </p>
                <p className="text-xs text-gray-500">
                  {userInfo.position}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="ml-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-sm transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex flex-col h-full">
            {/* Header for mobile */}
            <div className="lg:hidden p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">СК</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Меню</h2>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Дашборд', icon: Home },
                  { id: 'objects', label: 'Список объектов', icon: ListIcon },
                  { id: 'map', label: 'Карта', icon: MapIcon },
                  { id: 'reports', label: 'Отчеты', icon: FileText },
                  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
                  { id: 'settings', label: 'Настройки', icon: Settings }
                ].map((item) => {
                  const Icon = item.icon || Home;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200">
              <div className="text-xs text-gray-500">
                © 2024 Система контроля
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Desktop Layout */}
          <div className="hidden lg:block h-full">
            {activeSection === 'dashboard' && userRole === 'manager' && (
              <div className="flex flex-col h-full">
                {/* KPI Cards */}
                <div className="flex-shrink-0 p-6 pb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 mb-1 text-sm">Всего объектов</p>
                          <p className="font-bold text-gray-700 text-3xl mb-2">{mockObjects.length}</p>
                        </div>
                        <div className="rounded-lg bg-gray-100 p-3">
                          <Building2 size={24} className="text-gray-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 mb-1 text-sm">В графике</p>
                          <p className="font-bold text-green-600 text-3xl mb-2">{successCount}</p>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium text-green-600 bg-green-50 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                              <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                            <span>+2</span>
                            <span className="text-gray-500 font-normal">за неделю</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-green-100 p-3">
                          <CheckCircle size={24} className="text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 mb-1 text-sm">В зоне риска</p>
                          <p className="font-bold text-amber-600 text-3xl mb-2">{warningCount}</p>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium text-green-600 bg-green-50 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                              <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                            <span>-1</span>
                            <span className="text-gray-500 font-normal">за неделю</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-amber-100 p-3">
                          <Clock size={24} className="text-amber-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 mb-1 text-sm">Критично</p>
                          <p className="font-bold text-red-600 text-3xl mb-2">{criticalCount}</p>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md font-medium text-red-600 bg-red-50 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                              <polyline points="16 17 22 17 22 11"></polyline>
                            </svg>
                            <span>+1</span>
                            <span className="text-gray-500 font-normal">за неделю</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-red-100 p-3">
                          <AlertTriangle size={24} className="text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 p-6 pt-0 min-h-0">
                  <div className="grid grid-cols-3 gap-6 h-full">
                    {/* Map - 2 columns */}
                    <div className="col-span-2 min-h-0">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                        {/* Map Header */}
                        <div className="border-b border-slate-200 px-4 py-3 flex-shrink-0">
                          <h3 className="font-semibold text-gray-900">Карта объектов</h3>
                        </div>

                        {/* Map Container */}
                        <div className="relative flex-1 bg-slate-50 min-h-0">
                          {/* Map Background Pattern */}
                          <div 
                            className="absolute inset-0 opacity-20"
                            style={{
                              backgroundImage: `
                                linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                              `,
                              backgroundSize: '40px 40px'
                            }}
                          />

                          {/* Streets/Roads overlay */}
                          <svg className="absolute inset-0 w-full h-full">
                            <defs>
                              <pattern id="roads" patternUnits="userSpaceOnUse" width="160" height="160">
                                <path d="M0,80 L160,80" stroke="#CBD5E1" strokeWidth="2" opacity="0.6"/>
                                <path d="M80,0 L80,160" stroke="#CBD5E1" strokeWidth="2" opacity="0.6"/>
                                <path d="M40,40 L120,120" stroke="#E2E8F0" strokeWidth="1" opacity="0.4"/>
                                <path d="M120,40 L40,120" stroke="#E2E8F0" strokeWidth="1" opacity="0.4"/>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#roads)" />
                          </svg>

                          {/* Map Objects */}
                          <div 
                            className="absolute inset-0 p-4"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoveredObject(null)}
                          >
                            {filteredObjects.map((object) => (
                              <div
                                key={object.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10"
                                style={{
                                  left: `${object.x}%`,
                                  top: `${object.y}%`,
                                }}
                                onMouseEnter={() => setHoveredObject(object)}
                                onClick={() => handleObjectDetails(object.id)}
                              >
                                <div
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg relative"
                                  style={{ backgroundColor: getStatusColor(object.status) }}
                                >
                                  {/* Inner dot for better visibility */}
                                  <div 
                                    className="absolute inset-1 rounded-full bg-white opacity-30"
                                  />
                                </div>
                                
                                {/* Pulse animation for critical status */}
                                {object.status === 'critical' && (
                                  <div
                                    className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-75"
                                    style={{ backgroundColor: getStatusColor(object.status) }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Tooltip */}
                          {hoveredObject && (
                            <div
                              className="fixed z-50 bg-white border border-slate-200 rounded-lg p-3 shadow-lg pointer-events-none max-w-xs"
                              style={{
                                left: mousePosition.x + 10,
                                top: mousePosition.y - 10,
                              }}
                            >
                              <div className="font-semibold text-gray-900 text-sm mb-1">
                                {hoveredObject.name}
                              </div>
                              <div 
                                className="text-xs font-medium"
                                style={{ color: getStatusColor(hoveredObject.status) }}
                              >
                                Индекс здоровья: {hoveredObject.healthIndex}%
                              </div>
                            </div>
                          )}

                          {/* Map Controls */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <button className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md flex items-center justify-center hover:bg-gray-50">
                              <Plus size={16} />
                            </button>
                            <button className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md flex items-center justify-center hover:bg-gray-50">
                              <Minus size={16} />
                            </button>
                            <button className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md flex items-center justify-center hover:bg-gray-50">
                              <Maximize2 size={16} />
                            </button>
                          </div>

                          {/* Legend */}
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                            <div className="text-xs font-medium text-gray-700 mb-2">Статус объектов</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-xs text-gray-600">В графике</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="text-xs text-gray-600">В зоне риска</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-xs text-gray-600">Критично</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Priority Objects List - 1 column */}
                    <div className="col-span-1 min-h-0">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        {/* Header */}
                        <div className="border-b border-slate-200 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Приоритетные объекты</h3>
                            <span className="border border-gray-300 text-gray-500 text-xs px-2 py-1 rounded-full">
                              {priorityObjects.length}
                            </span>
                          </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {priorityObjects.length > 0 ? (
                            <div className="space-y-3">
                              {priorityObjects.map((object) => (
                                <div
                                  key={object.id}
                                  className={`border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md ${getStatusColorClass(object.status)}`}
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-3 flex-col sm:flex-row gap-2 sm:gap-0">
                                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                                      <div className="flex items-start justify-between sm:justify-start gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                                          {object.name}
                                        </h4>
                                        {getStatusBadge(object.status, object.healthIndex)}
                                      </div>
                                      <p className="text-xs text-gray-500 mb-3">{object.address}</p>
                                      
                                      {/* Multi-segment Health Indicator */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 hidden sm:inline">Статус задач:</span>
                                        <span className="text-xs text-gray-600 sm:hidden">Статус:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24 overflow-hidden">
                                          {(() => {
                                            // Generate segments based on object status and issues
                                            const segments = object.healthSegments || getDefaultSegments(object);
                                            return (
                                              <div className="flex h-full">
                                                {segments.success > 0 && (
                                                  <div 
                                                    className="bg-green-500 h-full"
                                                    style={{ width: `${segments.success}%` }}
                                                  />
                                                )}
                                                {segments.warning > 0 && (
                                                  <div 
                                                    className="bg-amber-500 h-full"
                                                    style={{ width: `${segments.warning}%` }}
                                                  />
                                                )}
                                                {segments.critical > 0 && (
                                                  <div 
                                                    className="bg-red-500 h-full"
                                                    style={{ width: `${segments.critical}%` }}
                                                  />
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Issues */}
                                  {object.issues.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      {object.issues.map((issue, index) => (
                                        <div key={index} className="flex items-start gap-2 text-xs">
                                          <div className="text-gray-500 mt-0.5 flex-shrink-0">
                                            {getIcon(issue.icon)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <span className="text-gray-700">{issue.text}</span>
                                            <span 
                                              className={`ml-1 ${getIssueColor(issue.status)}`}
                                              dangerouslySetInnerHTML={{ __html: extractNumbers(issue.value) }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Action Button */}
                                  <div className="flex justify-end">
                                    <button
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs flex items-center"
                                    >
                                      <span>Подробнее</span>
                                      <ChevronRight size={12} className="ml-1" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                              <p className="text-gray-600 font-medium">Все объекты в норме</p>
                              <p className="text-gray-500 text-sm">Нет критических проблем</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'dashboard' && userRole === 'foreman' && (
              <div className="p-6 h-full">
                <div className="h-full overflow-hidden">
                  {/* Desktop layout - optimized grid */}
                  <div className="grid grid-cols-3 gap-6 h-full">
                    {/* Left Column - Tasks (biggest) */}
                    <div className="col-span-2 min-h-0">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Задачи на сегодня</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-3">
                            {mockTasks.map((task) => (
                              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                                  {task.priority === 'high' && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Высокий</span>
                                  )}
                                  {task.priority === 'medium' && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Средний</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">Дедлайн: {task.deadline}</span>
                                  <div className="flex gap-2">
                                    {task.status === 'pending' && (
                                      <button
                                        onClick={() => handleTaskComplete(task.id)}
                                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                      >
                                        Выполнено
                                      </button>
                                    )}
                                    {task.status === 'pending' && (
                                      <button
                                        onClick={() => handleTaskProblem(task.id)}
                                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                      >
                                        Проблема
                                      </button>
                                    )}
                                    {task.status === 'completed' && (
                                      <span className="text-xs text-green-600 font-medium">Выполнено</span>
                                    )}
                                    {task.status === 'blocked' && (
                                      <span className="text-xs text-red-600 font-medium">Заблокировано</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Other components */}
                    <div className="col-span-1 flex flex-col gap-6 min-h-0 overflow-y-auto">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Блокеры</h3>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            {mockBlockers.map((blocker) => (
                              <div key={blocker.id} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm">{blocker.title}</h4>
                                  {blocker.severity === 'critical' && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Критично</span>
                                  )}
                                  {blocker.severity === 'warning' && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Важно</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{blocker.description}</p>
                                <p className="text-xs text-gray-500 mb-3">Источник: {blocker.source}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">Дедлайн: {blocker.deadline}</span>
                                  <button
                                    onClick={() => handleTakeAction(blocker.id, blocker.actionRequired)}
                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                  >
                                    {blocker.actionRequired === 'photo' ? 'Добавить фото' : 'Загрузить документ'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Поставки</h3>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            {mockDeliveries.map((delivery) => (
                              <div key={delivery.id} className="border border-gray-200 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{delivery.material}</h4>
                                  {delivery.status === 'arriving-today' && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Сегодня</span>
                                  )}
                                  {delivery.status === 'in-transit' && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">В пути</span>
                                  )}
                                  {delivery.status === 'delayed' && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Задержка</span>
                                  )}
                                  {delivery.status === 'delivered' && (
                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Доставлено</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mb-2">Поставщик: {delivery.supplier}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {delivery.status === 'delivered' 
                                      ? `Доставлено: ${delivery.actualTime}` 
                                      : `Ожидается: ${delivery.estimatedTime}`}
                                  </span>
                                  <span className="text-xs text-gray-500">{delivery.quantity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Действия</h3>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={handleTakePhoto}
                              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-1">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                <circle cx="9" cy="9" r="2"></circle>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                              </svg>
                              <span className="text-xs text-gray-700">Фото</span>
                            </button>
                            <button
                              onClick={handleUploadReport}
                              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-1">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" x2="12" y1="3" y2="15"></line>
                              </svg>
                              <span className="text-xs text-gray-700">Отчет</span>
                            </button>
                            <button
                              onClick={handleReportProblem}
                              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 col-span-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-1">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" x2="12" y1="8" y2="12"></line>
                                <line x1="12" x2="12.01" y1="16" y2="16"></line>
                              </svg>
                              <span className="text-xs text-gray-700">Сообщить о проблеме</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'dashboard' && userRole === 'inspector' && (
              <div className="p-6 h-full">
                <div className="h-full overflow-hidden">
                  {/* Desktop layout - optimized 2x2 grid */}
                  <div className="grid grid-cols-2 gap-6 h-full">
                    {/* Top Left - Inspections */}
                    <div className="min-h-0 overflow-y-auto">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Проверки</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-3">
                            {mockInspections.map((inspection) => (
                              <div key={inspection.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{inspection.objectName}</h4>
                                  {inspection.type === 'planned' && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Плановая</span>
                                  )}
                                  {inspection.type === 'followup' && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Контроль</span>
                                  )}
                                  {inspection.type === 'urgent' && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Срочная</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{inspection.address}</p>
                                <p className="text-xs text-gray-500 mb-3">{inspection.purpose}</p>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-gray-500">{inspection.date} в {inspection.time}</p>
                                    <p className="text-xs text-gray-500">Подрядчик: {inspection.contractor}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleViewInspectionDetails(inspection.id)}
                                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                    >
                                      Подробнее
                                    </button>
                                    {inspection.status === 'scheduled' && (
                                      <button
                                        onClick={() => handleMarkInspectionCompleted(inspection.id)}
                                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                      >
                                        Завершить
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Right - Verifications */}
                    <div className="min-h-0 overflow-y-auto">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Верификации</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-3">
                            {mockVerifications.map((verification) => (
                              <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    Нарушение #{verification.violationId}
                                  </h4>
                                  {verification.priority === 'high' && (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Высокий</span>
                                  )}
                                  {verification.priority === 'medium' && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Средний</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mb-1">{verification.violationType}</p>
                                <p className="text-xs text-gray-500 mb-2">Объект: {verification.objectName}</p>
                                <p className="text-xs text-gray-500 mb-3">Подрядчик: {verification.contractorName}</p>
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => handleViewEvidence(verification.id)}
                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                  >
                                    {verification.evidenceType === 'photo' ? 'Просмотр фото' : 'Просмотр документа'}
                                  </button>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleApproveVerification(verification.id)}
                                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    >
                                      Одобрить
                                    </button>
                                    <button
                                      onClick={() => handleRejectVerification(verification.id)}
                                      className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    >
                                      Отклонить
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Left - Contractor Analysis */}
                    <div className="min-h-0 overflow-y-auto">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Анализ подрядчиков</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-3">
                            {mockContractors.map((contractor) => (
                              <div key={contractor.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{contractor.name}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    contractor.riskScore > 70 ? 'bg-red-100 text-red-800' :
                                    contractor.riskScore > 50 ? 'bg-amber-100 text-amber-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    Риск: {contractor.riskScore}%
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div>
                                    <p className="text-xs text-gray-500">Нарушений: {contractor.totalViolations}</p>
                                    <p className="text-xs text-gray-500">Просрочено: {contractor.overdueFixings}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Ср. время испр.: {contractor.averageFixTime} дн.</p>
                                    <p className="text-xs text-gray-500">Объектов: {contractor.activeObjects}</p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">
                                  Частое нарушение: {contractor.mostCommonViolation.type}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {contractor.trend === 'worsening' && 'Ухудшение'}
                                    {contractor.trend === 'improving' && 'Улучшение'}
                                    {contractor.trend === 'stable' && 'Стабильно'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {contractor.violationsPerObject} нарушений/объект
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Right - Red Zone Objects */}
                    <div className="min-h-0 overflow-y-auto">
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        <div className="border-b border-slate-200 px-4 py-3">
                          <h3 className="font-semibold text-gray-900">Объекты в зоне риска</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="space-y-3">
                            {mockRedZoneObjects.map((object) => (
                              <div key={object.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-gray-900">{object.name}</h4>
                                  {object.priority === 'urgent' && (
                                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">Срочно</span>
                                  )}
                                  {object.priority === 'high' && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Высокий</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{object.address}</p>
                                <p className="text-xs text-gray-500 mb-3">Подрядчик: {object.contractor}</p>
                                
                                <div className="mb-3">
                                  <p className="text-xs text-gray-600 mb-1">Подозрительная активность:</p>
                                  <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                                    {object.suspiciousActivity.map((activity, index) => (
                                      <li key={index}>{activity.description}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-gray-500">Нарушений: {object.totalViolations}</p>
                                    <p className="text-xs text-gray-500">Просрочено: {object.overdueViolations}</p>
                                  </div>
                                  <button
                                    onClick={() => handleScheduleInspection(object.id)}
                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                  >
                                    Назначить проверку
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection !== 'dashboard' && (
              <div className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    {activeSection === 'objects' && 'Список объектов'}
                    {activeSection === 'map' && 'Карта'}
                    {activeSection === 'reports' && 'Отчеты'}
                    {activeSection === 'analytics' && 'Аналитика'}
                    {activeSection === 'settings' && 'Настройки'}
                  </h2>
                  <p className="text-gray-600">Раздел в разработке</p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden h-full flex flex-col">
            {userRole === 'manager' && (
              <>
                {/* Mobile KPI Cards - более компактные */}
                <div className="flex-shrink-0 px-4 py-3">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                      <p className="font-medium text-gray-700 mb-1 text-xs">Всего объектов</p>
                      <p className="font-bold text-gray-700 text-xl mb-1">{mockObjects.length}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                      <p className="font-medium text-gray-700 mb-1 text-xs">В графике</p>
                      <p className="font-bold text-green-600 text-xl mb-1">{successCount}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                      <p className="font-medium text-gray-700 mb-1 text-xs">В зоне риска</p>
                      <p className="font-bold text-amber-600 text-xl mb-1">{warningCount}</p>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                      <p className="font-medium text-gray-700 mb-1 text-xs">Критично</p>
                      <p className="font-bold text-red-600 text-xl mb-1">{criticalCount}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Content - с правильным overflow и учетом bottom nav */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="h-full px-4 pb-20 overflow-auto">
                    {mobileActiveTab === 'list' && (
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                        {/* Header */}
                        <div className="border-b border-slate-200 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Приоритетные объекты</h3>
                            <span className="border border-gray-300 text-gray-500 text-xs px-2 py-1 rounded-full">
                              {priorityObjects.length}
                            </span>
                          </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {priorityObjects.length > 0 ? (
                            <div className="space-y-3">
                              {priorityObjects.map((object) => (
                                <div
                                  key={object.id}
                                  className={`border rounded-lg p-3 sm:p-4 transition-all hover:shadow-md ${getStatusColorClass(object.status)}`}
                                >
                                  {/* Header */}
                                  <div className="flex items-start justify-between mb-3 flex-col sm:flex-row gap-2 sm:gap-0">
                                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                                      <div className="flex items-start justify-between sm:justify-start gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1">
                                          {object.name}
                                        </h4>
                                        {getStatusBadge(object.status, object.healthIndex)}
                                      </div>
                                      <p className="text-xs text-gray-500 mb-3">{object.address}</p>
                                      
                                      {/* Multi-segment Health Indicator */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-600 sm:hidden">Статус:</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24 overflow-hidden">
                                          {(() => {
                                            // Generate segments based on object status and issues
                                            const segments = object.healthSegments || getDefaultSegments(object);
                                            return (
                                              <div className="flex h-full">
                                                {segments.success > 0 && (
                                                  <div 
                                                    className="bg-green-500 h-full"
                                                    style={{ width: `${segments.success}%` }}
                                                  />
                                                )}
                                                {segments.warning > 0 && (
                                                  <div 
                                                    className="bg-amber-500 h-full"
                                                    style={{ width: `${segments.warning}%` }}
                                                  />
                                                )}
                                                {segments.critical > 0 && (
                                                  <div 
                                                    className="bg-red-500 h-full"
                                                    style={{ width: `${segments.critical}%` }}
                                                  />
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Issues */}
                                  {object.issues.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      {object.issues.map((issue, index) => (
                                        <div key={index} className="flex items-start gap-2 text-xs">
                                          <div className="text-gray-500 mt-0.5 flex-shrink-0">
                                            {getIcon(issue.icon)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <span className="text-gray-700">{issue.text}</span>
                                            <span 
                                              className={`ml-1 ${getIssueColor(issue.status)}`}
                                              dangerouslySetInnerHTML={{ __html: extractNumbers(issue.value) }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Action Button */}
                                  <div className="flex justify-end">
                                    <button
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 text-xs flex items-center"
                                    >
                                      <span>Подробнее</span>
                                      <ChevronRight size={12} className="ml-1" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                              <p className="text-gray-600 font-medium">Все объекты в норме</p>
                              <p className="text-gray-500 text-sm">Нет критических проблем</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {mobileActiveTab === 'map' && (
                      <div className="h-full">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                          {/* Map Header */}
                          <div className="border-b border-slate-200 px-4 py-3 flex-shrink-0">
                            <h3 className="font-semibold text-gray-900">Карта объектов</h3>
                          </div>

                          {/* Map Container */}
                          <div className="relative flex-1 bg-slate-50 min-h-0">
                            {/* Map Background Pattern */}
                            <div 
                              className="absolute inset-0 opacity-20"
                              style={{
                                backgroundImage: `
                                  linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '40px 40px'
                              }}
                            />

                            {/* Streets/Roads overlay */}
                            <svg className="absolute inset-0 w-full h-full">
                              <defs>
                                <pattern id="roads-mobile" patternUnits="userSpaceOnUse" width="160" height="160">
                                  <path d="M0,80 L160,80" stroke="#CBD5E1" strokeWidth="2" opacity="0.6"/>
                                  <path d="M80,0 L80,160" stroke="#CBD5E1" strokeWidth="2" opacity="0.6"/>
                                  <path d="M40,40 L120,120" stroke="#E2E8F0" strokeWidth="1" opacity="0.4"/>
                                  <path d="M120,40 L40,120" stroke="#E2E8F0" strokeWidth="1" opacity="0.4"/>
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#roads-mobile)" />
                            </svg>

                            {/* Map Objects */}
                            <div 
                              className="absolute inset-0 p-4"
                              onMouseMove={handleMouseMove}
                              onMouseLeave={() => setHoveredObject(null)}
                            >
                              {filteredObjects.map((object) => (
                                <div
                                  key={object.id}
                                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 hover:z-10"
                                  style={{
                                    left: `${object.x}%`,
                                    top: `${object.y}%`,
                                  }}
                                  onMouseEnter={() => setHoveredObject(object)}
                                  onClick={() => handleObjectDetails(object.id)}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg relative"
                                    style={{ backgroundColor: getStatusColor(object.status) }}
                                  >
                                    {/* Inner dot for better visibility */}
                                    <div 
                                      className="absolute inset-1 rounded-full bg-white opacity-30"
                                    />
                                  </div>
                                  
                                  {/* Pulse animation for critical status */}
                                  {object.status === 'critical' && (
                                    <div
                                      className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-75"
                                      style={{ backgroundColor: getStatusColor(object.status) }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Tooltip */}
                            {hoveredObject && (
                              <div
                                className="fixed z-50 bg-white border border-slate-200 rounded-lg p-3 shadow-lg pointer-events-none max-w-xs"
                                style={{
                                  left: mousePosition.x + 10,
                                  top: mousePosition.y - 10,
                                }}
                              >
                                <div className="font-semibold text-gray-900 text-sm mb-1">
                                  {hoveredObject.name}
                                </div>
                                <div 
                                  className="text-xs font-medium"
                                  style={{ color: getStatusColor(hoveredObject.status) }}
                                >
                                  Индекс здоровья: {hoveredObject.healthIndex}%
                                </div>
                              </div>
                            )}

                            {/* Map Controls */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                              <button className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md flex items-center justify-center hover:bg-gray-50">
                                <Plus size={16} />
                              </button>
                              <button className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md flex items-center justify-center hover:bg-gray-50">
                                <Minus size={16} />
                              </button>
                              <button className="w-10 h-10 p-0 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md flex items-center justify-center hover:bg-gray-50">
                                <Maximize2 size={16} />
                              </button>
                            </div>

                            {/* Legend */}
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-medium text-gray-700 mb-2">Статус объектов</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  <span className="text-xs text-gray-600">В графике</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                  <span className="text-xs text-gray-600">В зоне риска</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span className="text-xs text-gray-600">Критично</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {mobileActiveTab === 'filters' && (
                      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Фильтры</h3>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
                          <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Поиск по названию или адресу"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Подрядчик</label>
                          <select
                            value={selectedContractor}
                            onChange={(e) => setSelectedContractor(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Все подрядчики">Все подрядчики</option>
                            <option value="СтройТех">СтройТех</option>
                            <option value="МегаСтрой">МегаСтрой</option>
                            <option value="ПремиумБилд">ПремиумБилд</option>
                            <option value="УральСтройПроект">УральСтройПроект</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setStatusFilter('all')}
                              className={`px-3 py-2 text-sm rounded-md ${
                                statusFilter === 'all' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Все
                            </button>
                            <button
                              onClick={() => setStatusFilter('critical')}
                              className={`px-3 py-2 text-sm rounded-md ${
                                statusFilter === 'critical' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Критично
                            </button>
                            <button
                              onClick={() => setStatusFilter('risk')}
                              className={`px-3 py-2 text-sm rounded-md ${
                                statusFilter === 'risk' 
                                  ? 'bg-amber-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Риск
                            </button>
                            <button
                              onClick={() => setStatusFilter('normal')}
                              className={`px-3 py-2 text-sm rounded-md ${
                                statusFilter === 'normal' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Норма
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {userRole === 'foreman' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full px-4 py-4 overflow-auto">
                  <div className="space-y-4">
                    {/* Mobile layout - stack all components vertically */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Задачи на сегодня</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {mockTasks.map((task) => (
                            <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                {task.priority === 'high' && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Высокий</span>
                                )}
                                {task.priority === 'medium' && (
                                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Средний</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Дедлайн: {task.deadline}</span>
                                <div className="flex gap-2">
                                  {task.status === 'pending' && (
                                    <button
                                      onClick={() => handleTaskComplete(task.id)}
                                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    >
                                      Выполнено
                                    </button>
                                  )}
                                  {task.status === 'pending' && (
                                    <button
                                      onClick={() => handleTaskProblem(task.id)}
                                      className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                    >
                                      Проблема
                                    </button>
                                  )}
                                  {task.status === 'completed' && (
                                    <span className="text-xs text-green-600 font-medium">Выполнено</span>
                                  )}
                                  {task.status === 'blocked' && (
                                    <span className="text-xs text-red-600 font-medium">Заблокировано</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Блокеры</h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {mockBlockers.map((blocker) => (
                            <div key={blocker.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">{blocker.title}</h4>
                                {blocker.severity === 'critical' && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Критично</span>
                                )}
                                {blocker.severity === 'warning' && (
                                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Важно</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{blocker.description}</p>
                              <p className="text-xs text-gray-500 mb-3">Источник: {blocker.source}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Дедлайн: {blocker.deadline}</span>
                                <button
                                  onClick={() => handleTakeAction(blocker.id, blocker.actionRequired)}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  {blocker.actionRequired === 'photo' ? 'Добавить фото' : 'Загрузить документ'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Поставки</h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {mockDeliveries.map((delivery) => (
                            <div key={delivery.id} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-medium text-gray-900 text-sm">{delivery.material}</h4>
                                {delivery.status === 'arriving-today' && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Сегодня</span>
                                )}
                                {delivery.status === 'in-transit' && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">В пути</span>
                                )}
                                {delivery.status === 'delayed' && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Задержка</span>
                                )}
                                {delivery.status === 'delivered' && (
                                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Доставлено</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">Поставщик: {delivery.supplier}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {delivery.status === 'delivered' 
                                    ? `Доставлено: ${delivery.actualTime}` 
                                    : `Ожидается: ${delivery.estimatedTime}`}
                                </span>
                                <span className="text-xs text-gray-500">{delivery.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Действия</h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={handleTakePhoto}
                            className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-1">
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                              <circle cx="9" cy="9" r="2"></circle>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                            </svg>
                            <span className="text-xs text-gray-700">Фото</span>
                          </button>
                          <button
                            onClick={handleUploadReport}
                            className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-1">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" x2="12" y1="3" y2="15"></line>
                            </svg>
                            <span className="text-xs text-gray-700">Отчет</span>
                          </button>
                          <button
                            onClick={handleReportProblem}
                            className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 col-span-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-1">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" x2="12" y1="8" y2="12"></line>
                              <line x1="12" x2="12.01" y1="16" y2="16"></line>
                            </svg>
                            <span className="text-xs text-gray-700">Сообщить о проблеме</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {userRole === 'inspector' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full px-4 py-4 overflow-auto">
                  <div className="space-y-4">
                    {/* Mobile layout - stack all components vertically */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Проверки</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {mockInspections.map((inspection) => (
                            <div key={inspection.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{inspection.objectName}</h4>
                                {inspection.type === 'planned' && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Плановая</span>
                                )}
                                {inspection.type === 'followup' && (
                                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Контроль</span>
                                )}
                                {inspection.type === 'urgent' && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Срочная</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{inspection.address}</p>
                              <p className="text-xs text-gray-500 mb-3">{inspection.purpose}</p>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500">{inspection.date} в {inspection.time}</p>
                                  <p className="text-xs text-gray-500">Подрядчик: {inspection.contractor}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleViewInspectionDetails(inspection.id)}
                                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                  >
                                    Подробнее
                                  </button>
                                  {inspection.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleMarkInspectionCompleted(inspection.id)}
                                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    >
                                      Завершить
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Верификации</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {mockVerifications.map((verification) => (
                            <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  Нарушение #{verification.violationId}
                                </h4>
                                {verification.priority === 'high' && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Высокий</span>
                                )}
                                {verification.priority === 'medium' && (
                                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Средний</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mb-1">{verification.violationType}</p>
                              <p className="text-xs text-gray-500 mb-2">Объект: {verification.objectName}</p>
                              <p className="text-xs text-gray-500 mb-3">Подрядчик: {verification.contractorName}</p>
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => handleViewEvidence(verification.id)}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                >
                                  {verification.evidenceType === 'photo' ? 'Просмотр фото' : 'Просмотр документа'}
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveVerification(verification.id)}
                                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                  >
                                    Одобрить
                                  </button>
                                  <button
                                    onClick={() => handleRejectVerification(verification.id)}
                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                  >
                                    Отклонить
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Анализ подрядчиков</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {mockContractors.map((contractor) => (
                            <div key={contractor.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{contractor.name}</h4>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  contractor.riskScore > 70 ? 'bg-red-100 text-red-800' :
                                  contractor.riskScore > 50 ? 'bg-amber-100 text-amber-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  Риск: {contractor.riskScore}%
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                  <p className="text-xs text-gray-500">Нарушений: {contractor.totalViolations}</p>
                                  <p className="text-xs text-gray-500">Просрочено: {contractor.overdueFixings}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Ср. время испр.: {contractor.averageFixTime} дн.</p>
                                  <p className="text-xs text-gray-500">Объектов: {contractor.activeObjects}</p>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                Частое нарушение: {contractor.mostCommonViolation.type}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {contractor.trend === 'worsening' && 'Ухудшение'}
                                  {contractor.trend === 'improving' && 'Улучшение'}
                                  {contractor.trend === 'stable' && 'Стабильно'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {contractor.violationsPerObject} нарушений/объект
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full flex flex-col">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Объекты в зоне риска</h3>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-3">
                          {mockRedZoneObjects.map((object) => (
                            <div key={object.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{object.name}</h4>
                                {object.priority === 'urgent' && (
                                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">Срочно</span>
                                )}
                                {object.priority === 'high' && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Высокий</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">{object.address}</p>
                              <p className="text-xs text-gray-500 mb-3">Подрядчик: {object.contractor}</p>
                              
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 mb-1">Подозрительная активность:</p>
                                <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                                  {object.suspiciousActivity.map((activity, index) => (
                                    <li key={index}>{activity.description}</li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500">Нарушений: {object.totalViolations}</p>
                                  <p className="text-xs text-gray-500">Просрочено: {object.overdueViolations}</p>
                                </div>
                                <button
                                  onClick={() => handleScheduleInspection(object.id)}
                                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                >
                                  Назначить проверку
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {userRole === 'manager' && (
          <div className="bg-white border-t border-slate-200 shadow-lg">
            <div className="flex">
              <button
                onClick={() => setMobileActiveTab('list')}
                className={`flex-1 flex flex-col items-center py-3 px-2 relative transition-colors min-h-[60px] touch-manipulation ${
                  mobileActiveTab === 'list'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <div className="relative">
                  <ListIcon size={22} className="mb-1" />
                  {criticalCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {criticalCount}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium leading-tight">Список</span>
              </button>
              
              <button
                onClick={() => setMobileActiveTab('map')}
                className={`flex-1 flex flex-col items-center py-3 px-2 relative transition-colors min-h-[60px] touch-manipulation ${
                  mobileActiveTab === 'map'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <MapIcon size={22} className="mb-1" />
                <span className="text-xs font-medium leading-tight">Карта</span>
              </button>
              
              <button
                onClick={() => setMobileActiveTab('filters')}
                className={`flex-1 flex flex-col items-center py-3 px-2 relative transition-colors min-h-[60px] touch-manipulation ${
                  mobileActiveTab === 'filters'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <Filter size={22} className="mb-1" />
                <span className="text-xs font-medium leading-tight">Фильтры</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple icon components for navigation
function Home({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}

function ListIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}

function MapIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon>
      <line x1="9" y1="3" x2="9" y2="18"></line>
      <line x1="15" y1="3" x2="15" y2="18"></line>
    </svg>
  );
}

function FileText({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" x2="8" y1="13" y2="13"></line>
      <line x1="16" x2="8" y1="17" y2="17"></line>
      <line x1="10" x2="8" y1="9" y2="9"></line>
    </svg>
  );
}

function BarChart3({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"></path>
      <path d="M18 17V9"></path>
      <path d="M13 17V5"></path>
      <path d="M8 17v-3"></path>
    </svg>
  );
}

function Settings({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

export { ConstructionDashboard };