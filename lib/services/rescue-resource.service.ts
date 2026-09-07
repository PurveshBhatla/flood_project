export interface RescueResourceItem {
  id: string;
  type: 'AMBULANCE' | 'RESCUE_TEAM' | 'SHELTER' | 'RESCUE_BOAT' | 'HOSPITAL' | 'RELIEF_SUPPLY';
  name: string;
  category: string;
  iconName: string;
  count: number;
  status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE';
  color: 'GREEN' | 'YELLOW' | 'RED';
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  locationName: string;
  contactPhone?: string;
  capacityDetails?: string;
  totalCapacity?: number;
}

export interface RescueResourceSummary {
  mode: 'live' | 'demo';
  updatedAt: string;
  summary: {
    ambulances: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    rescueTeams: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    shelters: { count: number; totalCapacity: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    rescueBoats: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    hospitals: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
    supplyKits: { count: number; status: 'AVAILABLE' | 'LIMITED' | 'UNAVAILABLE'; label: string };
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

    const sampleResources: RescueResourceItem[] = [
      {
        id: 'res-sh-1',
        type: 'SHELTER',
        name: 'Community Relief & Evacuation Center',
        category: 'Relief Shelter',
        iconName: '⛺',
        count: 350,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.012,
        longitude: lng - 0.008,
        city: 'Local Region',
        state: 'State Command',
        locationName: 'North Civil Lines, District Hub',
        contactPhone: '022-2640-1080',
        capacityDetails: '350 Available / 500 Total Beds, Food Kits, First-Aid Standby',
        totalCapacity: 500,
      },
      {
        id: 'res-sh-2',
        type: 'SHELTER',
        name: 'Government Model High School Evacuation Camp',
        category: 'Relief Shelter',
        iconName: '⛺',
        count: 180,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat + 0.024,
        longitude: lng + 0.015,
        city: 'Local Region',
        state: 'State Command',
        locationName: 'Central Sector 4, Educational Zone',
        contactPhone: '022-2652-4411',
        capacityDetails: '180 Available / 300 Capacity, Emergency Power Backups',
        totalCapacity: 300,
      },
      {
        id: 'res-sh-3',
        type: 'SHELTER',
        name: 'District Indoor Sports Stadium Relief Complex',
        category: 'Relief Shelter',
        iconName: '⛺',
        count: 620,
        status: 'AVAILABLE',
        color: 'GREEN',
        latitude: lat - 0.018,
        longitude: lng - 0.022,
        city: 'Local Region',
        state: 'State Command',
        locationName: 'Stadium Road Complex',
        contactPhone: '022-2845-9922',
        capacityDetails: '620 Available / 1000 Total Capacity, Medical Bay',
        totalCapacity: 1000,
      },
      {
        id: 'res-sh-4',
        type: 'SHELTER',
        name: 'St. Jude Emergency Flood Refuge Center',
        category: 'Relief Shelter',
        iconName: '⛺',
        count: 25,
        status: 'LIMITED',
        color: 'YELLOW',
        latitude: lat + 0.035,
        longitude: lng - 0.018,
        city: 'Local Region',
        state: 'State Command',
        locationName: 'East Hill Campus',
        contactPhone: '022-2433-1100',
        capacityDetails: '25 Available / 250 Total Capacity (Near Full)',
        totalCapacity: 250,
      },
      {
        id: 'res-sh-5',
        type: 'SHELTER',
        name: 'Civic Community Auditorium Shelter',
        category: 'Relief Shelter',
        iconName: '⛺',
        count: 0,
        status: 'UNAVAILABLE',
        color: 'RED',
        latitude: lat - 0.028,
        longitude: lng + 0.032,
        city: 'Local Region',
        state: 'State Command',
        locationName: 'Old Market Square',
        contactPhone: '022-2510-7744',
        capacityDetails: 'FULL (0 Spaces Available / 400 Occupied)',
        totalCapacity: 400,
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
