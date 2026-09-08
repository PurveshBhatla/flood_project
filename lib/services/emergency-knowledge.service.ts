export interface EmergencyKnowledgeTopic {
  id: string;
  keywords: string[];
  title: string;
  category: 'HOME_FLOOD' | 'VEHICLE' | 'OUTSIDE_WALKING' | 'ELECTRICAL' | 'SHELTER' | 'EVACUATION' | 'GENERAL';
  actionableSteps: string[];
  warnings: string[];
  recommendedContacts: string[];
}

export interface EmergencyAIResponse {
  answer: string;
  category: string;
  actionableSteps: string[];
  warnings: string[];
  emergencyContacts: Array<{ label: string; number: string }>;
  suggestedFollowUps: string[];
  disclaimer: string;
}

export class EmergencyKnowledgeService {
  private static knowledgeBase: EmergencyKnowledgeTopic[] = [
    {
      id: 'water-entering-house',
      keywords: ['entering', 'house', 'home', 'room', 'inside', 'ground floor', 'water coming', 'flooding inside'],
      title: 'Water Entering Your House',
      category: 'HOME_FLOOD',
      actionableSteps: [
        'Move immediately to the top floor, attic, or roof with your family and emergency supplies.',
        'Disconnect or switch OFF the main electrical circuit breaker ONLY if you can reach it safely from a completely dry area.',
        'Gather essential items: phone, power bank, medicine, flashlight, clean drinking water, and ID documents.',
        'Do NOT enter basement or ground floor rooms if water is above ankle level.',
        'If trapped inside a rising room, signal for help from an open upper window using a flashlight or bright cloth.'
      ],
      warnings: [
        '⚡ NEVER touch electrical sockets, wires, or breakers while standing in water or wet surfaces.',
        '🌊 Do NOT attempt to wade through indoor water if electrical appliances are plugged in.'
      ],
      recommendedContacts: ['National Emergency: 112', 'Disaster Relief / NDRF: 1070', 'Medical Ambulance: 108']
    },
    {
      id: 'going-outside-safe',
      keywords: ['outside', 'safe to go', 'leave house', 'walk outside', 'street safe', 'can i go out'],
      title: 'Outdoor Safety & Floodwater Navigation',
      category: 'OUTSIDE_WALKING',
      actionableSteps: [
        'STAY INDOORS unless your building is structurally compromised or official authorities issue an evacuation order.',
        'If forced to move outside, use a long stick to probe the ground ahead to detect open manholes, storm drains, or sudden drops.',
        'Wear sturdy closed shoes to protect feet from submerged glass, sharp debris, and sewage contamination.',
        'Stick strictly to elevated concrete walkways or embankments away from riverbeds and drainage culverts.'
      ],
      warnings: [
        '🚫 Just 6 inches (15 cm) of fast-moving floodwater can knock down an adult.',
        '⚡ Watch out for submerged electrical cables and fallen utility poles.'
      ],
      recommendedContacts: ['Emergency Services: 112', 'NDRF Flood Helpline: 1070']
    },
    {
      id: 'car-vehicle-stuck',
      keywords: ['car', 'vehicle', 'stuck', 'driving', 'road', 'automobile', 'flooded road', 'water in car'],
      title: 'Vehicle Stuck in Flood Water',
      category: 'VEHICLE',
      actionableSteps: [
        'Abandon the vehicle IMMEDIATELY if floodwater reaches the bumper or engine stalls.',
        'Unbuckle seatbelts, open windows, and exit the vehicle right away before electric locks short-circuit.',
        'If door resistance is too high due to water pressure, roll down or break a side window to escape.',
        'Climb onto the roof of the vehicle if water around the car is deep and fast-moving, and call for rescue.'
      ],
      warnings: [
        '🚗 12 to 24 inches (30–60 cm) of moving water can float or sweep away cars, SUVs, and trucks.',
        '🚫 NEVER attempt to drive through submerged underpasses, flooded roads, or water-covered bridges.'
      ],
      recommendedContacts: ['Traffic Emergency: 112', 'Disaster Ambulance: 108']
    },
    {
      id: 'electricity-power-on',
      keywords: ['electricity', 'power', 'electric', 'shock', 'switch', 'wires', 'breaker', 'sparking'],
      title: 'Electrical Safety During Flooding',
      category: 'ELECTRICAL',
      actionableSteps: [
        'Turn OFF the main power breaker ONLY if standing on a completely dry wooden or rubber surface.',
        'If the main breaker is submerged or in a wet area, DO NOT touch it. Wait for electrical utility teams.',
        'Unplug sensitive electronic devices before water reaches outlets if safe to do so.',
        'Assume all downed wires and submerged electrical poles are LIVE and lethal.'
      ],
      warnings: [
        '⚡ Electrocution risk is severe in flooded buildings. Water conducts electricity.',
        '🚫 Do NOT use corded electrical appliances or touch metal fixtures if you feel a tingling sensation.'
      ],
      recommendedContacts: ['Electricity Helpline / Disaster Cell: 112', 'Fire & Rescue: 101']
    },
    {
      id: 'nearest-shelter-safe-place',
      keywords: ['shelter', 'safe place', 'where to go', 'refuge', 'evacuation center', 'camp', 'relief center'],
      title: 'Reaching a Safe Relief Shelter',
      category: 'SHELTER',
      actionableSteps: [
        'Check the Nearest Safe Shelters map layer on FloodVision to find verified open relief centers.',
        'Head toward designated community halls, indoor sports stadiums, high-school campuses, or government relief hubs.',
        'Travel along elevated ridge lines and avoid riverbank lowlands.',
        'Bring your emergency survival bag: ID, medicine, water bottles, mobile power bank, and warm clothing.'
      ],
      warnings: [
        '⚠️ Verify that your route to the shelter avoids low-lying flooded streets or surcharged drains.',
        '🔴 Do NOT seek refuge under isolated trees or unstable temporary sheds during heavy storms.'
      ],
      recommendedContacts: ['Local Shelter Command: 1070', 'Emergency Ambulance: 108']
    },
    {
      id: 'elderly-children-evacuation',
      keywords: ['elderly', 'children', 'kids', 'senior', 'family', 'baby', 'disabled', 'handicapped'],
      title: 'Evacuating Children, Seniors & Vulnerable Relatives',
      category: 'EVACUATION',
      actionableSteps: [
        'Prioritize evacuating children, elderly family members, and individuals with mobility constraints first.',
        'Pack essential medication, prescription records, infant formula, diapers, and warm blankets in waterproof bags.',
        'Attach a waterproof ID card with contact details and medical notes to children and elderly relatives.',
        'Request priority NDRF/SDRF rescue boat assistance immediately via the FloodVision SOS button if stairs or exits are submerged.'
      ],
      warnings: [
        '⚠️ Never leave vulnerable family members alone in low-lying ground floor rooms.',
        '🚫 Do NOT carry heavy luggage when evacuating with small children or seniors.'
      ],
      recommendedContacts: ['NDRF Rescue Request: 1070', 'Medical Response: 108']
    }
  ];

  static queryEmergencyAI(userQuery: string, locationName?: string): EmergencyAIResponse {
    const queryLower = userQuery.toLowerCase().trim();

    // Match best knowledge topic
    let bestMatch: EmergencyKnowledgeTopic | null = null;
    let maxScore = 0;

    for (const topic of this.knowledgeBase) {
      let score = 0;
      for (const kw of topic.keywords) {
        if (queryLower.includes(kw)) {
          score += 2;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = topic;
      }
    }

    // Default fallback topic if no specific keyword matched
    if (!bestMatch || maxScore === 0) {
      bestMatch = {
        id: 'general-flood-safety',
        keywords: [],
        title: 'General Flood Emergency Protocol',
        category: 'GENERAL',
        actionableSteps: [
          'Move immediately to higher ground or upper floors away from rising floodwaters.',
          'Keep your mobile phone charged and monitor official flood alerts on FloodVision.',
          'Shut off main gas and electrical utilities ONLY if you can safely reach them from dry ground.',
          'If in immediate physical danger, trigger the persistent FloodVision SOS button or dial 112.'
        ],
        warnings: [
          '🚫 Never walk or drive through moving floodwater.',
          '⚡ Avoid submerged electrical appliances, wires, and power lines.'
        ],
        recommendedContacts: ['National Emergency Hotline: 112', 'NDRF Flood Helpline: 1070', 'Medical Response: 108']
      };
    }

    const locationPrefix = locationName ? `[Location Context: ${locationName}] ` : '';

    return {
      answer: `${locationPrefix}**${bestMatch.title}**: Follow these immediate safety-first steps:`,
      category: bestMatch.category,
      actionableSteps: bestMatch.actionableSteps,
      warnings: bestMatch.warnings,
      emergencyContacts: [
        { label: 'National Emergency', number: '112' },
        { label: 'NDRF Control Room', number: '1070' },
        { label: 'Disaster Ambulance', number: '108' }
      ],
      suggestedFollowUps: [
        'Water is entering my house. What should I do?',
        'Where is the nearest safe shelter?',
        'What should I do if electricity is still on?',
        'My car is stuck in flood water.'
      ],
      disclaimer: '⚠️ FloodVision Emergency AI provides automated safety guidance based on disaster protocols. For life-threatening emergencies, immediately call 112 or use the SOS button below.'
    };
  }
}
