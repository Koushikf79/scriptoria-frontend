import { AnalysisResult, StoryboardVariation } from './types';

export const MOCK_ANALYSIS: AnalysisResult = {
  scenes: [
    { scene_number: 1, location: "Royal Palace - Throne Room", time_of_day: "DAY", characters: ["King Arjun", "Minister Vikram"], action_intensity: 3, emotional_intensity: 5, production_complexity: 8, description: "King Arjun sits on the golden throne, contemplating war. Minister Vikram enters with urgent news from the frontier." },
    { scene_number: 2, location: "Village Market", time_of_day: "DAY", characters: ["Priya", "Old Merchant"], action_intensity: 2, emotional_intensity: 4, production_complexity: 6, description: "Priya disguised as a commoner navigates through the bustling market, gathering intelligence about the enemy's movements." },
    { scene_number: 3, location: "Dark Forest", time_of_day: "NIGHT", characters: ["King Arjun", "Commander Ravi", "Soldiers"], action_intensity: 8, emotional_intensity: 7, production_complexity: 9, description: "Ambush in the forest. King Arjun's convoy is attacked by rebel forces. Intense sword combat under moonlight." },
    { scene_number: 4, location: "Mountain Temple", time_of_day: "DAWN", characters: ["Priya", "Sage"], action_intensity: 1, emotional_intensity: 9, production_complexity: 7, description: "Priya seeks counsel from the ancient sage. An emotional revelation about her true identity unfolds." },
    { scene_number: 5, location: "Battlefield - Open Plains", time_of_day: "DAY", characters: ["King Arjun", "Commander Ravi", "Enemy General", "Armies"], action_intensity: 10, emotional_intensity: 8, production_complexity: 10, description: "The climactic battle. Thousands clash on the open plains. King Arjun faces the Enemy General in single combat." },
    { scene_number: 6, location: "Royal Palace - Balcony", time_of_day: "SUNSET", characters: ["King Arjun", "Priya"], action_intensity: 1, emotional_intensity: 10, production_complexity: 5, description: "After the war, Arjun and Priya reunite on the palace balcony overlooking the kingdom. A moment of peace and love." },
  ],
  emotions: [
    { scene_number: 1, joy: 2, sadness: 3, anger: 1, fear: 4, surprise: 2, tension: 6, overall_intensity: 5 },
    { scene_number: 2, joy: 4, sadness: 1, anger: 1, fear: 3, surprise: 3, tension: 4, overall_intensity: 4 },
    { scene_number: 3, joy: 1, sadness: 3, anger: 7, fear: 8, surprise: 6, tension: 9, overall_intensity: 7 },
    { scene_number: 4, joy: 3, sadness: 8, anger: 1, fear: 2, surprise: 9, tension: 5, overall_intensity: 9 },
    { scene_number: 5, joy: 2, sadness: 5, anger: 9, fear: 7, surprise: 4, tension: 10, overall_intensity: 8 },
    { scene_number: 6, joy: 10, sadness: 3, anger: 0, fear: 0, surprise: 2, tension: 1, overall_intensity: 10 },
  ],
  budget: {
    market: 'telugu',
    currency: 'INR',
    total_low: 150000000,
    total_mid: 350000000,
    total_high: 800000000,
    breakdown: [
      { category: 'Cast & Talent', low: 40000000, mid: 120000000, high: 350000000 },
      { category: 'Locations & Sets', low: 30000000, mid: 60000000, high: 120000000 },
      { category: 'VFX & Post', low: 35000000, mid: 80000000, high: 180000000 },
      { category: 'Crew & Equipment', low: 25000000, mid: 50000000, high: 80000000 },
      { category: 'Music & Sound', low: 10000000, mid: 20000000, high: 40000000 },
      { category: 'Marketing', low: 10000000, mid: 20000000, high: 30000000 },
    ],
    cost_drivers: [
      '2 night scenes requiring extensive lighting rigs',
      'Large-scale battle sequence with crowd VFX',
      'Multiple ornate set constructions (palace, temple)',
      'High action intensity requiring stunt coordination',
    ],
  },
  summary: {
    total_scenes: 6,
    total_characters: 7,
    avg_action_intensity: 4.2,
    avg_emotional_intensity: 7.2,
    avg_production_complexity: 7.5,
    unique_locations: 5,
    night_scenes: 1,
  },
};

export const MOCK_STORYBOARD: StoryboardVariation[] = [
  { angle: "Wide Shot", prompt: "Epic wide establishing shot of a dark forest at night, moonlight filtering through ancient trees, army convoy with torches moving through a narrow path, volumetric fog, cinematic atmosphere", camera: "Steadicam tracking", lens: "24mm Wide", lighting: "Moonlight with torch practicals", mood: "Ominous, anticipatory", composition: "Rule of thirds, convoy in lower third with canopy framing" },
  { angle: "Close-up", prompt: "Extreme close-up of the king's face illuminated by flickering torchlight, sweat beads on forehead, eyes scanning the darkness, shallow depth of field, dramatic chiaroscuro lighting", camera: "Static with slight handheld drift", lens: "85mm Prime", lighting: "Single torch key light, deep shadows", mood: "Tense, determined", composition: "Eyes at power point, negative space in shadow direction" },
  { angle: "Low Angle", prompt: "Low angle hero shot of the king drawing his sword, camera tilted upward from ground level, moonlit silhouette against stormy sky, cape flowing in wind, powerful stance", camera: "Low dolly, slight push-in", lens: "35mm", lighting: "Backlit moonlight rim, blue fill", mood: "Heroic, commanding", composition: "Central subject, sky as backdrop, sword catching light" },
  { angle: "Top Angle", prompt: "Overhead bird's eye view of the forest ambush unfolding, soldiers scattering in all directions, choreographed combat patterns visible from above, fires starting among trees", camera: "Crane/Drone descending", lens: "16mm Ultra-wide", lighting: "Fire and moonlight from above", mood: "Chaotic, grand scale", composition: "Radial patterns of movement from center of attack" },
  { angle: "Day Lighting", prompt: "Same forest scene reimagined in golden hour daylight, sunbeams piercing through tree canopy creating god rays, dappled light on soldiers' armor, warm amber tones throughout", camera: "Steadicam weaving through trees", lens: "50mm Standard", lighting: "Golden hour backlight with bounce", mood: "Warm, ethereal", composition: "Light shafts as leading lines, depth layers" },
  { angle: "Night Lighting", prompt: "Ultra-dark noir treatment of the forest ambush, only slivers of blue moonlight and orange torch flickers, faces emerging from absolute darkness, high contrast", camera: "Handheld, urgent movement", lens: "50mm T1.4 wide open", lighting: "Minimal practicals, deep noir shadows", mood: "Terrifying, claustrophobic", composition: "Faces in pools of light surrounded by void" },
];

export const SAMPLE_SCREENPLAY = `FADE IN:

INT. ROYAL PALACE - THRONE ROOM - DAY

A vast golden throne room. Sunlight streams through stained glass windows, casting colored shadows across marble floors.

KING ARJUN (40s, battle-scarred, regal) sits on the throne, staring at a war map spread across a table. His expression is troubled.

MINISTER VIKRAM (60s, silver-haired, shrewd) enters hurriedly, scrolls in hand.

VIKRAM
Your Majesty, the frontier reports are dire. The rebels have taken the northern pass.

ARJUN
(standing slowly)
How many did we lose?

VIKRAM
Three hundred soldiers. Commander Ravi holds the line, but he requests reinforcements.

Arjun walks to the window, looking out at his kingdom.

ARJUN
Prepare the war council. We ride at dawn.

EXT. VILLAGE MARKET - DAY

A bustling, colorful market. Vendors shout, children run between stalls.

PRIYA (30s, beautiful, sharp-eyed) moves through the crowd in common clothes, her royal bearing hidden beneath a worn shawl.

She stops at an OLD MERCHANT's spice stall, pretending to browse.

PRIYA
(whispering)
What news from the north?

OLD MERCHANT
(barely moving his lips)
They say an army gathers beyond the mountains. Ten thousand strong.

Priya's eyes widen. She drops a coin and disappears into the crowd.

EXT. DARK FOREST - NIGHT

Moonlight filters through twisted trees. An eerie silence.

KING ARJUN rides at the head of a convoy of fifty soldiers. COMMANDER RAVI (30s, fierce, loyal) rides beside him.

RAVI
The scouts say this path is clear, my lord.

Suddenly — ARROWS rain from the darkness. Soldiers fall.

ARJUN
(drawing sword)
AMBUSH! Form defensive positions!

Chaos erupts. Rebel fighters emerge from the shadows. Intense SWORD COMBAT under moonlight. Arjun fights with devastating skill.

EXT. MOUNTAIN TEMPLE - DAWN

A ancient temple perched on a misty mountaintop. Prayer bells ring softly.

PRIYA kneels before an elderly SAGE in saffron robes.

SAGE
You have come seeking answers, child. But the truth you find may shatter everything you believe.

PRIYA
(tears forming)
Tell me. Who am I really?

SAGE
You are not merely a spy for the crown. You are the last heir of the fallen dynasty. The throne... is rightfully yours.

Priya stares in shock. The weight of destiny crashes upon her.

EXT. BATTLEFIELD - OPEN PLAINS - DAY

EPIC WIDE SHOT. Two massive armies face each other across an open plain. War drums thunder. Flags snap in the wind.

KING ARJUN, in full battle armor, rides before his troops.

ARJUN
(to his army)
Today we fight not for glory, but for our children's future! FOR THE KINGDOM!

The armies CHARGE. The battle is MASSIVE — horses, elephants, swords, arrows. Dust clouds rise.

Arjun cuts through enemy soldiers until he faces the ENEMY GENERAL (50s, monstrous, armored).

They engage in brutal single combat. The fate of the kingdom hangs in the balance.

EXT. ROYAL PALACE - BALCONY - SUNSET

Golden sunset bathes the kingdom. The war is over.

ARJUN stands on the balcony, wounds bandaged, armor removed. He looks exhausted but peaceful.

PRIYA approaches from behind. He turns.

ARJUN
(softly)
I know the truth now. About who you are.

PRIYA
(voice breaking)
And yet you still stand beside me?

ARJUN
(taking her hand)
Always.

They stand together, watching the sun set over their kingdom. A new era begins.

FADE OUT.`;
