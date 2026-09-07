export interface RescueResourceItem {
  id: string;
  type: 'AMBULANCE' | 'RESCUE_TEAM' | 'SHELTER' | 'RESCUE_BOAT' | 'HOSPITAL' | 'RELIEF_SUPPLY';
  name: string;
  category: string;
  iconName: string;
  count: number;
  availableSpaces?: number;
  capacity?: number;
  status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  color: 'GREEN' | 'YELLOW' | 'RED';
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  locationName: string;
  address?: string;
  contactPhone?: string;
  capacityDetails?: string;
  totalCapacity?: number;
  dataMode?: 'DEMO' | 'LIVE';
}

export interface RescueResourceSummary {
  mode: 'live' | 'demo';
  updatedAt: string;
  summary: {
    ambulances: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    rescueTeams: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    shelters: { count: number; totalCapacity: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    rescueBoats: { count: number; status: 'LIMITED', label: string };
    hospitals: { count: number; status: 'AVAILABLE'; label: string };
    supplyKits: { count: number; status: 'AVAILABLE'; label: string };
  };
  resources: RescueResourceItem[];
}

export interface RescueResourceProvider {
  getResources(lat?: number, lng?: number): Promise<RescueResourceSummary>;
}

export class LiveRescueResourceProvider implements RescueResourceProvider {
  private apiEndpoint = process.env.RESCUE_RESOURCES_API_URL;

  async getResources(lat?: number, lng?: number): Promise<RescueResourceSummary> {
    if (!this.apiEndpoint) {
      throw new Error('No live rescue resource API endpoint configured');
    }

    const res = await fetch(`${this.apiEndpoint}?lat=${lat || 19.076}&lng=${lng || 72.8777}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Live rescue resource API returned status ${res.status}`);
    }

    const data = await res.json();
    return {
      mode: 'live',
      updatedAt: new Date().toISOString(),
      summary: data.summary,
      resources: data.resources,
    };
  }
}

export class DemoRescueResourceProvider implements RescueResourceProvider {
  async getResources(lat: number = 19.076, lng: number = 72.8777): Promise<RescueResourceSummary> {
    const nowIso = new Date().toISOString();

    // Deterministic demo shelters
    const sampleResources: RescueResourceItem[] = [
      {
        id: 'sh-demo-1',
        type: 'SHELTER',
        name: 'Community Relief Center',
        category: 'Relief Shelter',
        iconName: '🏠',
        count: 120,
        availableSpaces: 120,
        capacity: 250,
        totalCapacity: 250,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.012,
        longitude: lng - 0.008,
        city: 'Demo Region',
        state: 'State Disaster Mgmt',
        locationName: 'Civil Lines Relief Hub, Sector 2',
        address: '12 Emergency Sector Road, District Center',
        contactPhone: '022-2640-1080',
        capacityDetails: '120 Spaces Available / 250 Total Beds',
        dataMode: 'DEMO',
      },
      {
        id: 'sh-demo-2',
        type: 'SHELTER',
        name: 'Government Relief Camp',
        category: 'Relief Shelter',
        iconName: '🏠',
        count: 75,
        availableSpaces: 75,
        capacity: 300,
        totalCapacity: 300,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.024,
        longitude: lng + 0.015,
        city: 'Demo Region',
        state: 'State Disaster Mgmt',
        locationName: 'Central Model School, Station Road',
        address: '45 Station Road, Model Town',
        contactPhone: '022-2652-4411',
        capacityDetails: '75 Spaces Available / 300 Capacity',
        dataMode: 'DEMO',
      },
      {
        id: 'sh-demo-3',
        type: 'SHELTER',
        name: 'Relief School (Flood Relief Center)',
        category: 'Relief Shelter',
        iconName: '🏠',
        count: 15,
        availableSpaces: 15,
        capacity: 200,
        totalCapacity: 200,
        status: 'LIMITED',
        color: 'YELLOW',
        latitude: lat + 0.035,
        longitude: lng - 0.018,
        city: 'Demo Region',
        state: 'State Disaster Mgmt',
        locationName: 'St. Mary Educational Campus',
        address: '88 East Hill Highway',
        contactPhone: '022-2433-1100',
        capacityDetails: '15 Spaces Available / 200 Capacity (LIMITED CAPACITY)',
        dataMode: 'DEMO',
      },
      {
        id: 'sh-demo-4',
        type: 'SHELTER',
        name: 'District Sports Complex Emergency Shelter',
        category: 'Relief Shelter',
        iconName: '🏠',
        count: 450,
        availableSpaces: 450,
        capacity: 1000,
        totalCapacity: 1000,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat - 0.018,
        longitude: lng - 0.022,
        city: 'Demo Region',
        state: 'State Disaster Mgmt',
        locationName: 'Stadium Road Complex',
        address: '100 Sports Complex Drive',
        contactPhone: '022-2845-9922',
        capacityDetails: '450 Spaces Available / 1000 Total Capacity',
        dataMode: 'DEMO',
      },
      {
        id: 'sh-demo-5',
        type: 'SHELTER',
        name: 'Civic Community Auditorium Shelter',
        category: 'Relief Shelter',
        iconName: '🏠',
        count: 0,
        availableSpaces: 0,
        capacity: 150,
        totalCapacity: 150,
        status: 'UNAVAILABLE',
        color: 'RED',
        latitude: lat - 0.028,
        longitude: lng + 0.032,
        city: 'Demo Region',
        state: 'State Disaster Mgmt',
        locationName: 'Old Market Square',
        address: '5 Market Square Lane',
        contactPhone: '022-2510-7744',
        capacityDetails: 'FULL (0 Spaces Available / 150 Capacity)',
        dataMode: 'DEMO',
      },
      {
        id: 'res-sh-6',
        type: 'SHELTER',
        name: 'Lowland Primary School Emergency Station',
        category: 'Relief Shelter',
        iconName: '⛺',
        count: 120,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.005,
        longitude: lng + 0.006,
        city: 'Local Region',
        state: 'State Command',
        locationName: 'Riverbank Lowland Sector',
        contactPhone: '022-2300-8811',
        capacityDetails: '120 Available / 200 Capacity (Lowland Flood Warning Zone)',
        totalCapacity: 200,
      },
      {
        id: 'res-amb-1',
        type: 'AMBULANCE',
        name: '108 Disaster Response ALS Ambulance Fleet',
        category: 'Ambulances',
        iconName: '🚑',
        count: 12,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat - 0.01,
        longitude: lng + 0.005,
        city: 'Mumbai',
        state: 'Maharashtra',
        locationName: 'BKC Emergency Dispatch Base',
        contactPhone: '108 / 022-2659-0000',
        capacityDetails: '12 Advanced Life Support Units Ready',
      },
      {
        id: 'res-tm-1',
        type: 'RESCUE_TEAM',
        name: '5th Battalion NDRF Flood Rescue Unit',
        category: 'Rescue Teams',
        iconName: '🚒',
        count: 6,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.008,
        longitude: lng - 0.02,
        city: 'Mumbai',
        state: 'Maharashtra',
        locationName: 'SANTACRUZ NDRF Forward Post',
        contactPhone: '022-2615-1100',
        capacityDetails: '6 Teams (90 Deployed Rescuers)',
      },
      {
        id: 'res-bt-1',
        type: 'RESCUE_BOAT',
        name: 'SDRF Inflatable Motorized Rescue Boats',
        category: 'Rescue Boats',
        iconName: '🚤',
        count: 4,
        status: 'LIMITED',
        color: 'YELLOW',
        latitude: lat - 0.018,
        longitude: lng - 0.015,
        city: 'Mumbai',
        state: 'Maharashtra',
        locationName: 'Mithi River Outfall Station',
        contactPhone: '022-2430-8800',
        capacityDetails: '4 Heavy Duty OBM Boats Staged',
      },
      {
        id: 'res-hosp-1',
        type: 'HOSPITAL',
        name: 'KEM Hospital Emergency Trauma Ward',
        category: 'Medical Facilities',
        iconName: '🏥',
        count: 10,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat - 0.025,
        longitude: lng + 0.01,
        city: 'Mumbai',
        state: 'Maharashtra',
        locationName: 'Parel, Mumbai',
        contactPhone: '022-2410-7000',
        capacityDetails: '150 Intensive Care Beds Reserved',
      },
      {
        id: 'res-sup-1',
        type: 'RELIEF_SUPPLY',
        name: 'District Flood Supply Depot',
        category: 'Relief Supplies',
        iconName: '📦',
        count: 250,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.03,
        longitude: lng - 0.005,
        city: 'Mumbai',
        state: 'Maharashtra',
        locationName: 'Andheri Logistics Hub',
        contactPhone: '022-2820-3300',
        capacityDetails: '250 Dry Ration & Clean Water Kits',
      },
    ];

    return {
      mode: 'demo',
      updatedAt: nowIso,
      summary: {
        ambulances: { count: 12, status: 'AVAILABLE', label: 'Emergency Ambulances' },
        rescueTeams: { count: 6, status: 'AVAILABLE', label: 'NDRF / SDRF Rescue Teams' },
        shelters: { count: 8, totalCapacity: 2400, status: 'AVAILABLE', label: 'Relief Shelters' },
        rescueBoats: { count: 4, status: 'LIMITED', label: 'Motorised Rescue Boats' },
        hospitals: { count: 10, status: 'AVAILABLE', label: 'Trauma & Medical Units' },
        supplyKits: { count: 250, status: 'AVAILABLE', label: 'Relief Supply Kits' },
      },
      resources: sampleResources,
    };
  }
}

export class RescueResourceService {
  private static liveProvider: RescueResourceProvider = new LiveRescueResourceProvider();
  private static demoProvider: RescueResourceProvider = new DemoRescueResourceProvider();

  static async getResources(lat?: number, lng?: number): Promise<RescueResourceSummary> {
    try {
      return await this.liveProvider.getResources(lat, lng);
    } catch (err) {
      return await this.demoProvider.getResources(lat, lng);
    }
  }
}
