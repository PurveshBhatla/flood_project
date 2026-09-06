import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FloodVision database seed...');

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.floodAlert.deleteMany({});
  await prisma.floodRisk.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.monitoringStation.deleteMany({});
  await prisma.floodEvent.deleteMany({});
  await prisma.weatherData.deleteMany({});
  await prisma.contactMessage.deleteMany({});

  // 1. Create Users
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

  console.log('✅ Created users: admin@floodvision.org, user@floodvision.org');

  // 2. Create Monitored Locations for Demo User
  const MumbaiLocation = await prisma.location.create({
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

  const KeralaLocation = await prisma.location.create({
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

  const AssamLocation = await prisma.location.create({
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

  console.log('✅ Created monitored locations for demo user');

  // 3. Seed Monitoring Stations
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
      {
        name: 'Houston Bayou Gauge 12 (Buffalo Bayou)',
        latitude: 29.7604,
        longitude: -95.3698,
        waterLevel: 2.1,
        warningLevel: 3.8,
        criticalLevel: 5.2,
        status: 'OPERATIONAL',
      },
      {
        name: 'Thames Barrier Telemetry Stn',
        latitude: 51.4975,
        longitude: 0.0369,
        waterLevel: 1.8,
        warningLevel: 3.0,
        criticalLevel: 4.5,
        status: 'OPERATIONAL',
      },
    ],
  });

  console.log('✅ Created monitoring stations');

  // 4. Seed Flood Alerts
  const alert1 = await prisma.floodAlert.create({
    data: {
      title: 'CRITICAL: Severe Flood Warning for Brahmaputra Basin',
      description:
        'Continuous torrential heavy rainfall (140mm in 24h) has elevated river gauge levels near Pandu Ghat above danger marks. Immediate evacuation recommended for riverside settlements.',
      severity: 'CRITICAL',
      latitude: 26.1445,
      longitude: 91.7362,
      radiusKm: 25.0,
      affectedArea: 'Kamrup Metropolitan, Assam',
      expiresAt: new Date(Date.now() + 86400000 * 3), // +3 days
    },
  });

  const alert2 = await prisma.floodAlert.create({
    data: {
      title: 'WARNING: Rising Water Levels in Periyar River',
      description:
        'Sluice gates opened at Idamalayar and Idukki dams due to catchment inflow. Low-lying areas in Aluva and Kalamassery advised to remain vigilant.',
      severity: 'WARNING',
      latitude: 10.1076,
      longitude: 76.3516,
      radiusKm: 15.0,
      affectedArea: 'Ernakulam District, Kerala',
      expiresAt: new Date(Date.now() + 86400000 * 2), // +2 days
    },
  });

  const alert3 = await prisma.floodAlert.create({
    data: {
      title: 'MODERATE: Urban Flash Flood Watch for Central Mumbai',
      description:
        'High tide coinciding with intense rainfall spalls may cause waterlogging in Kurla, Sion, and Dadar. Drainage pumps activated.',
      severity: 'WARNING',
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 12.0,
      affectedArea: 'Mumbai Suburban District',
      expiresAt: new Date(Date.now() + 86400000 * 1), // +1 day
    },
  });

  console.log('✅ Created active flood alerts');

  // 5. User Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        alertId: alert3.id,
        read: false,
      },
      {
        userId: demoUser.id,
        alertId: alert2.id,
        read: true,
      },
    ],
  });

  // 6. Seed Historical Flood Events
  await prisma.floodEvent.createMany({
    data: [
      {
        location: 'Assam Brahmaputra Inundation 2024',
        latitude: 26.1445,
        longitude: 91.7362,
        severity: 'CRITICAL',
        description: 'Widespread monsoon deluge affecting 2.4 million residents across 28 districts.',
        impact: '350,000 hectares of cropland damaged, 120 emergency shelters established.',
        date: new Date('2024-07-12'),
      },
      {
        location: 'Great Kerala Deluge 2018',
        latitude: 10.1076,
        longitude: 76.3516,
        severity: 'CRITICAL',
        description: 'Worst flood in Kerala in a century following abnormally high monsoon rainfall.',
        impact: 'Severe infrastructure disruption, major reservoir gate discharges.',
        date: new Date('2018-08-16'),
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
      {
        location: 'Hurricane Harvey Houston Inundation 2017',
        latitude: 29.7604,
        longitude: -95.3698,
        severity: 'CRITICAL',
        description: 'Category 4 storm lingering over Harris county producing 1,000+ mm precipitation.',
        impact: '30,000 displacement events, historic bayou peak levels.',
        date: new Date('2017-08-27'),
      },
    ],
  });

  console.log('✅ Created historical flood records');

  // 7. Seed Initial Flood Risks for User Locations
  await prisma.floodRisk.createMany({
    data: [
      {
        locationId: MumbaiLocation.id,
        latitude: 19.076,
        longitude: 72.8777,
        riskScore: 62.4,
        probability: 0.62,
        riskLevel: 'HIGH',
        confidence: 0.91,
        rainfall: 82.5,
        waterLevel: 4.85,
        temperature: 28.2,
        humidity: 88.0,
        soilMoisture: 78.5,
      },
      {
        locationId: KeralaLocation.id,
        latitude: 10.1076,
        longitude: 76.3516,
        riskScore: 48.0,
        probability: 0.48,
        riskLevel: 'MODERATE',
        confidence: 0.89,
        rainfall: 42.0,
        waterLevel: 7.2,
        temperature: 26.5,
        humidity: 82.0,
        soilMoisture: 65.0,
      },
      {
        locationId: AssamLocation.id,
        latitude: 26.1445,
        longitude: 91.7362,
        riskScore: 88.2,
        probability: 0.88,
        riskLevel: 'CRITICAL',
        confidence: 0.95,
        rainfall: 145.0,
        waterLevel: 49.8,
        temperature: 25.0,
        humidity: 94.0,
        soilMoisture: 92.0,
      },
    ],
  });

  console.log('✅ Seeded initial flood risks');
  console.log('🎉 FloodVision Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
