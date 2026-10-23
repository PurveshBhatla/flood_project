import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SIH26085 FloodVision Master Database Seed...');

  // Clean existing tables
  await prisma.incidentAction.deleteMany({});
  await prisma.waterloggingReport.deleteMany({});
  await prisma.hotspot.deleteMany({});
  await prisma.floodPredictionRecord.deleteMany({});
  await prisma.roadSegment.deleteMany({});
  await prisma.road.deleteMany({});
  await prisma.drainEdge.deleteMany({});
  await prisma.drainNode.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.floodAlert.deleteMany({});
  await prisma.floodRisk.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.monitoringStation.deleteMany({});
  await prisma.floodEvent.deleteMany({});
  await prisma.weatherData.deleteMany({});
  await prisma.contactMessage.deleteMany({});

  // 1. Users
  const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
  const userPasswordHash = await bcrypt.hash('User@123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@floodvision.org',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@floodvision.org',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  });

  console.log('✅ Created users');

  // 2. Monitored User Locations
  const mumbaiLoc = await prisma.location.create({
    data: {
      userId: demoUser.id,
      name: 'Mithi River Basin, Mumbai',
      latitude: 19.076,
      longitude: 72.8777,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      isHome: true,
    },
  });

  const keralaLoc = await prisma.location.create({
    data: {
      userId: demoUser.id,
      name: 'Periyar River Basin, Aluva',
      latitude: 10.1076,
      longitude: 76.3516,
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      isHome: false,
    },
  });

  const assamLoc = await prisma.location.create({
    data: {
      userId: demoUser.id,
      name: 'Brahmaputra Valley, Guwahati',
      latitude: 26.1445,
      longitude: 91.7362,
      city: 'Guwahati',
      state: 'Assam',
      country: 'India',
      isHome: false,
    },
  });

  // 3. Roads & Road Segments (GIS Topology)
  const ringRoad = await prisma.road.create({
    data: {
      name: 'Central Ring Road & BKC Junction',
      category: 'ARTERIAL',
      geometryJson: JSON.stringify([
        [72.865, 19.065],
        [72.872, 19.072],
        [72.8777, 19.076],
        [72.885, 19.082],
      ]),
      elevation: 6.2, // Low lying basin
      slope: 0.8,
    },
  });

  const lbsMarg = await prisma.road.create({
    data: {
      name: 'LBS Marg Corridor',
      category: 'HIGHWAY',
      geometryJson: JSON.stringify([
        [72.88, 19.07],
        [72.885, 19.078],
        [72.89, 19.085],
      ]),
      elevation: 7.5,
      slope: 1.2,
    },
  });

  const marineDrive = await prisma.road.create({
    data: {
      name: 'Marine Coastal Expressway',
      category: 'HIGHWAY',
      geometryJson: JSON.stringify([
        [72.82, 18.94],
        [72.825, 18.95],
        [72.83, 18.96],
      ]),
      elevation: 14.5, // High coastal ridge
      slope: 3.5,
    },
  });

  const seg1 = await prisma.roadSegment.create({
    data: {
      roadId: ringRoad.id,
      startLat: 19.065,
      startLng: 72.865,
      endLat: 19.076,
      endLng: 72.8777,
      lengthMeters: 1450,
      surfaceType: 'ROAD',
    },
  });

  const seg2 = await prisma.roadSegment.create({
    data: {
      roadId: lbsMarg.id,
      startLat: 19.07,
      startLng: 72.88,
      endLat: 19.085,
      endLng: 72.89,
      lengthMeters: 2100,
      surfaceType: 'CONCRETE',
    },
  });

  console.log('✅ Created GIS roads & segments');

  // 4. Drainage Network Graph
  const nodeA = await prisma.drainNode.create({
    data: {
      name: 'BKC Manhole Inlet 01',
      type: 'INLET',
      latitude: 19.068,
      longitude: 72.869,
      elevation: 6.5,
      capacityM3s: 12.5,
    },
  });

  const nodeB = await prisma.drainNode.create({
    data: {
      name: 'Mithi River Outfall Canal',
      type: 'OUTFALL',
      latitude: 19.076,
      longitude: 72.8777,
      elevation: 5.2,
      capacityM3s: 25.0,
    },
  });

  await prisma.drainEdge.create({
    data: {
      fromNodeId: nodeA.id,
      toNodeId: nodeB.id,
      diameterM: 1.5,
      lengthM: 850,
      capacityM3s: 14.2,
      roughnessN: 0.013,
    },
  });

  console.log('✅ Created drainage network graph');

  // 5. Monitoring Stations
  await prisma.monitoringStation.createMany({
    data: [
      {
        name: 'Mithi River Station 01 (BKC Bridge)',
        latitude: 19.065,
        longitude: 72.868,
        waterLevel: 4.85,
        warningLevel: 3.5,
        criticalLevel: 5.0,
        status: 'WARNING',
      },
      {
        name: 'Periyar Hydro Station, Aluva',
        latitude: 10.112,
        longitude: 76.358,
        waterLevel: 7.2,
        warningLevel: 6.0,
        criticalLevel: 8.5,
        status: 'WARNING',
      },
      {
        name: 'Brahmaputra Gauge 04, Pandu Ghat',
        latitude: 26.155,
        longitude: 91.702,
        waterLevel: 49.8,
        warningLevel: 48.0,
        criticalLevel: 50.5,
        status: 'CRITICAL',
      },
    ],
  });

  // 6. Flood Alerts
  const alert1 = await prisma.floodAlert.create({
    data: {
      title: 'CRITICAL: Severe Flood Warning for Brahmaputra Basin',
      description:
        'Torrential rainfall nowcast (72mm/h) combined with surcharged drainage has elevated river levels above danger marks. Immediate evacuation recommended.',
      severity: 'CRITICAL',
      latitude: 26.1445,
      longitude: 91.7362,
      radiusKm: 25.0,
      affectedArea: 'Kamrup Metropolitan, Assam',
      expiresAt: new Date(Date.now() + 86400000 * 3),
    },
  });

  await prisma.notification.create({
    data: {
      userId: demoUser.id,
      alertId: alert1.id,
      read: false,
    },
  });

  // 7. Historical Events
  await prisma.floodEvent.createMany({
    data: [
      {
        location: 'Assam Brahmaputra Inundation 2024',
        latitude: 26.1445,
        longitude: 91.7362,
        severity: 'CRITICAL',
        description: 'Widespread monsoon deluge affecting 2.4 million residents across 28 districts.',
        impact: '350,000 hectares of cropland damaged.',
        date: new Date('2024-07-12'),
      },
      {
        location: 'Mumbai Deluge July 2005',
        latitude: 19.076,
        longitude: 72.8777,
        severity: 'CRITICAL',
        description: 'Record 944mm rainfall within 24 hours overflowing Mithi river.',
        impact: 'Complete financial capital shutdown, citywide emergency response.',
        date: new Date('2005-07-26'),
      },
    ],
  });

  // 8. FloodWatch Community Waterlogging Demonstration Data
  console.log('🌊 Seeding FloodWatch demonstration waterlogging reports...');

  const hotspotKurla = await prisma.hotspot.create({
    data: {
      title: 'Potential Hotspot: LBS Marg / Phoenix Junction Corridor (2 reports)',
      centerLat: 19.0829,
      centerLng: 72.8873,
      radiusMeters: 300,
      reportCount: 2,
      maxDepthCategory: 'WAIST',
      maxDepthCm: 70.0,
      priorityScore: 80.0,
      status: 'ACTIVE',
    },
  });

  const rep1 = await prisma.waterloggingReport.create({
    data: {
      latitude: 19.0657,
      longitude: 72.8784,
      streetName: 'Kurla West Station Subway Underpass',
      landmark: 'Near Platform 1 Exit, Kurla West',
      city: 'Mumbai',
      depthCategory: 'SUBMERGED',
      depthCm: 110.0,
      waterLevelTrend: 'RISING',
      roadCondition: 'BLOCKED',
      hazardTags: JSON.stringify(['STALLED_VEHICLE', 'OPEN_MANHOLE', 'FAST_CURRENT']),
      description: 'Underpass completely flooded beyond vehicular clearance. 2 auto-rickshaws stalled. Water rising rapidly with tidal backflow.',
      upvotes: 14,
      status: 'VERIFIED',
      priorityScore: 95.0,
      isDuplicate: false,
      reportedBy: 'Aakash Verma (Citizen Reporter)',
      verifiedAt: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      actions: {
        create: [
          {
            actionType: 'REPORT_CREATED',
            actorName: 'Aakash Verma (Citizen Reporter)',
            notes: 'Initial report submitted via GPS location.',
            createdAt: new Date(Date.now() - 45 * 60 * 1000),
          },
          {
            actionType: 'VERIFY',
            actorName: 'Municipal Disaster Desk (Ward L)',
            notes: 'Field officer verified: subway blocked, police barricades placed.',
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
          },
        ],
      },
    },
  });

  const rep2 = await prisma.waterloggingReport.create({
    data: {
      latitude: 19.0825,
      longitude: 72.8870,
      streetName: 'LBS Marg near Phoenix Mall Junction',
      landmark: 'Opposite Main Entrance Gate',
      city: 'Mumbai',
      depthCategory: 'WAIST',
      depthCm: 70.0,
      waterLevelTrend: 'RISING',
      roadCondition: 'BLOCKED',
      hazardTags: JSON.stringify(['DRAIN_OVERFLOW', 'HEAVY_TRAFFIC']),
      description: 'Storm drain regurgitating onto arterial road. Water level reaching car bonnets, traffic at a standstill.',
      upvotes: 8,
      status: 'UNVERIFIED',
      priorityScore: 82.0,
      isDuplicate: false,
      hotspotId: hotspotKurla.id,
      reportedBy: 'Pooja Iyer (Commuter)',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      actions: {
        create: [
          {
            actionType: 'REPORT_CREATED',
            actorName: 'Pooja Iyer (Commuter)',
            notes: 'Citizen submitted report with rising water level trend.',
            createdAt: new Date(Date.now() - 25 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Duplicate report candidate (~110m away from rep2, demonstrating 150m duplicate detection)
  const rep3 = await prisma.waterloggingReport.create({
    data: {
      latitude: 19.0833,
      longitude: 72.8876,
      streetName: 'LBS Marg Bus Depot Entrance (Near Phoenix)',
      landmark: 'BEST Bus Stop Shed',
      city: 'Mumbai',
      depthCategory: 'WAIST',
      depthCm: 65.0,
      waterLevelTrend: 'RISING',
      roadCondition: 'DIFFICULT',
      hazardTags: JSON.stringify(['DRAIN_OVERFLOW']),
      description: 'Severe waterlogging outside depot entrance. Buses moving on high curbs.',
      upvotes: 4,
      status: 'UNVERIFIED',
      priorityScore: 78.0,
      isDuplicate: true,
      parentReportId: rep2.id,
      hotspotId: hotspotKurla.id,
      reportedBy: 'Kishore Patil (Bus Driver)',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      actions: {
        create: [
          {
            actionType: 'MERGE_DUPLICATE_CANDIDATE',
            actorName: 'FloodWatch Spatial Engine',
            notes: `Flagged as potential duplicate (approx 110m from report #${rep2.id}).`,
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
          },
        ],
      },
    },
  });

  const rep4 = await prisma.waterloggingReport.create({
    data: {
      latitude: 19.0182,
      longitude: 72.8441,
      streetName: 'Hindmata Cinema Flyover Underpass, Dadar',
      landmark: 'Near Dr. Babasaheb Ambedkar Road junction',
      city: 'Mumbai',
      depthCategory: 'KNEE',
      depthCm: 40.0,
      waterLevelTrend: 'STABLE',
      roadCondition: 'DIFFICULT',
      hazardTags: JSON.stringify(['STAGNANT_WATER', 'HEAVY_SLUDGE']),
      description: 'Knee-deep water on southbound carriageway. Heavy vehicles passing slowly, two-wheelers slipping.',
      upvotes: 6,
      status: 'VERIFIED',
      priorityScore: 52.0,
      isDuplicate: false,
      reportedBy: 'Rohit Kadam (Local Resident)',
      verifiedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actions: {
        create: [
          {
            actionType: 'REPORT_CREATED',
            actorName: 'Rohit Kadam',
            notes: 'Citizen report logged with knee-deep water rating.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            actionType: 'VERIFY',
            actorName: 'Traffic Police Patrol #12',
            notes: 'Confirmed slow traffic, advisory broadcasted.',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Stale report (>6 hours old, demonstrates staleness flagging)
  const rep5 = await prisma.waterloggingReport.create({
    data: {
      latitude: 19.0863,
      longitude: 72.8415,
      streetName: 'Milan Subway, Santacruz West',
      landmark: 'Pedestrian Footpath Corridor',
      city: 'Mumbai',
      depthCategory: 'ANKLE',
      depthCm: 15.0,
      waterLevelTrend: 'UNKNOWN',
      roadCondition: 'PASSABLE',
      hazardTags: JSON.stringify(['PUDDLES']),
      description: 'Minor water accumulation along sidewalk. Subway motor pumps active.',
      upvotes: 2,
      status: 'STALE',
      isStale: true,
      priorityScore: 18.0,
      isDuplicate: false,
      reportedBy: 'Sneha Rao',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      actions: {
        create: [
          {
            actionType: 'REPORT_CREATED',
            actorName: 'Sneha Rao',
            notes: 'Report logged 8 hours ago.',
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          },
          {
            actionType: 'FLAG_STALE',
            actorName: 'FloodWatch Engine',
            notes: 'Report has exceeded 6 hours without corroboration or updates. Flagged as stale.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Resolved report
  const rep6 = await prisma.waterloggingReport.create({
    data: {
      latitude: 19.0298,
      longitude: 72.8572,
      streetName: 'Gandhi Market, King\'s Circle, Matunga',
      landmark: 'Near Post Office',
      city: 'Mumbai',
      depthCategory: 'KNEE',
      depthCm: 35.0,
      waterLevelTrend: 'FALLING',
      roadCondition: 'PASSABLE',
      hazardTags: JSON.stringify(['WATER_RECEDING']),
      description: 'Dewatering pumps successfully cleared lane. Road now fully passable for all vehicular traffic.',
      upvotes: 11,
      status: 'RESOLVED',
      priorityScore: 24.0,
      isDuplicate: false,
      reportedBy: 'Kunal Deshmukh (Shop Owner)',
      resolvedAt: new Date(Date.now() - 15 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      actions: {
        create: [
          {
            actionType: 'RESOLVE',
            actorName: 'BMC Ward F/North Operations',
            notes: 'High-capacity 300 HP submersible pump drained water. Situation normalized.',
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log('✅ Seeded FloodWatch waterlogging reports and hotspots');
  console.log('🎉 FloodWatch Master Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
