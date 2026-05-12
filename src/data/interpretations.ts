// Static ACG line interpretations — planet_angle macros + four angle macros
// Derived from Starchart macro content export.
// Fields: triggerKey, title, category, body

export interface Interpretation {
  triggerKey: string;
  title: string;
  category: 'planet_angle' | 'angle';
  body: string;
}

export const interpretations: Interpretation[] = [
  // ── Angle macros ──────────────────────────────────────────────────────────
  {
    triggerKey: 'asc',
    title: 'Ascendant (AC) Line',
    category: 'angle',
    body: 'The Ascendant line marks places where your chart\'s rising degree sits on the eastern horizon. Here you are seen — your physical appearance, first impressions, and the mask you wear for the world are amplified. People notice you more easily; you project the qualities of your rising sign with unusual intensity. AC lines are good for visibility, personal reinvention, and putting yourself forward.',
  },
  {
    triggerKey: 'mc',
    title: 'Midheaven (MC) Line',
    category: 'angle',
    body: 'The Midheaven line marks places where your chart\'s highest point is directly overhead. Career, reputation, and public standing come into sharp focus here. You are more likely to be recognised for your work, to step into positions of authority, or to feel the weight of social expectation. MC lines suit ambition, professional achievement, and building a lasting legacy.',
  },
  {
    triggerKey: 'ic',
    title: 'Imum Coeli (IC) Line',
    category: 'angle',
    body: 'The IC line marks places where the lowest point of the sky touches the horizon — home, roots, and the private self. Living near an IC line often feels deeply restorative, like returning to something ancestral. Family dynamics intensify; the past surfaces for reckoning or healing. IC lines are good for inner work, building a home base, and connecting to lineage.',
  },
  {
    triggerKey: 'dsc',
    title: 'Descendant (DC) Line',
    category: 'angle',
    body: 'The Descendant line marks the western horizon — the angle of relationship, partnership, and the projected Other. Near a DC line you encounter people who mirror qualities you have exiled or idealised. Significant one-to-one relationships form easily here, sometimes intensely or fated-feeling. DC lines suit partnership work, collaboration, and learning through contrast with others.',
  },

  // ── Sun ───────────────────────────────────────────────────────────────────
  {
    triggerKey: 'sun-ac',
    title: 'Sun AC',
    category: 'planet_angle',
    body: 'Where the Sun sits on the Ascendant, you radiate confidence and self-assurance almost effortlessly. Your vitality is visible; others look to you as a natural authority or focal point. This is a place where you can step into your fullest self, build a strong identity, and be genuinely seen. Creative projects and leadership roles are favoured, though the spotlight can also attract envy or high expectations.',
  },
  {
    triggerKey: 'sun-mc',
    title: 'Sun MC',
    category: 'planet_angle',
    body: 'The Sun on the Midheaven places your ambitions and public identity squarely in view. Career success and recognition come more naturally here — your work aligns with who you fundamentally are. This is a powerful line for building a public profile, achieving professional goals, or stepping into a calling. Guard against over-identification with status or achievement at the expense of private life.',
  },
  {
    triggerKey: 'sun-ic',
    title: 'Sun IC',
    category: 'planet_angle',
    body: 'The Sun below the horizon, at the IC, turns your solar energy inward and homeward. This place can feel deeply familiar and nourishing — a sense of being home in your bones. Your vitality is invested in family, roots, and private life rather than outward achievement. Ideal for raising children, caring for a home, or doing the slow inner work of becoming yourself.',
  },
  {
    triggerKey: 'sun-dc',
    title: 'Sun DC',
    category: 'planet_angle',
    body: 'With the Sun on the Descendant, your identity is shaped through relationship. Significant partners — romantic or professional — tend to be strong, solar types who reflect your own unlived radiance back to you. You may find yourself seeking recognition through others rather than independently. Over time, this line teaches the balance between self and other, between shining alone and shining together.',
  },

  // ── Moon ─────────────────────────────────────────────────────────────────
  {
    triggerKey: 'moon-ac',
    title: 'Moon AC',
    category: 'planet_angle',
    body: 'The Moon on the Ascendant makes your emotional life visible — people sense your moods, empathise easily, and feel drawn to nurture or be nurtured by you. Your face is expressive; your presence feels soft or fluctuating. This is a place where emotional sensitivity is a social gift, though it can also mean absorbing the emotional weather of every room you enter. Good for caregiving roles and community belonging.',
  },
  {
    triggerKey: 'moon-mc',
    title: 'Moon MC',
    category: 'planet_angle',
    body: 'The Moon at the Midheaven links your public life to cycles of feeling, memory, and the collective. You may work in fields that serve the public directly — health, food, education, care. Your reputation waxes and wanes like the moon; popularity can fluctuate. The public senses your authenticity and responds to emotional honesty. This is a powerful line for work that matters to many people.',
  },
  {
    triggerKey: 'moon-ic',
    title: 'Moon IC',
    category: 'planet_angle',
    body: 'Moon at the IC deepens the already Lunar quality of the lowest angle. This place feels like ancestral ground — you may encounter family patterns or past-life echoes with unusual clarity. Home life is nurturing and rich, but also emotionally demanding. Excellent for deep rest, healing old wounds, and putting down roots. Be mindful of becoming too insular or clinging to the past.',
  },
  {
    triggerKey: 'moon-dc',
    title: 'Moon DC',
    category: 'planet_angle',
    body: 'With the Moon on the Descendant, your emotional needs are projected onto partners and close companions. You may attract nurturing or needy types, or find yourself in caretaker roles within relationships. There is great warmth and intimacy available here, but also risk of emotional codependency. This line asks you to learn what you need, rather than expecting a partner to intuitively provide it.',
  },

  // ── Mercury ───────────────────────────────────────────────────────────────
  {
    triggerKey: 'mercury-ac',
    title: 'Mercury AC',
    category: 'planet_angle',
    body: 'Mercury on the Ascendant sharpens wit and verbal agility. You think quickly here, speak before you fully process, and are perceived as curious, talkative, or intellectually lively. Ideas come freely; connections and collaborations form through conversation. This is a good line for writing, teaching, or any work that requires mental flexibility. Watch a tendency toward nervous energy or scattered focus.',
  },
  {
    triggerKey: 'mercury-mc',
    title: 'Mercury MC',
    category: 'planet_angle',
    body: 'Mercury at the Midheaven suits careers built on words, analysis, and the exchange of information. Writing, journalism, academia, consulting, and communications all fare well here. Your reputation rests on your intelligence and your ability to articulate ideas clearly. This is a good place to build an intellectual body of work or establish yourself as a voice worth listening to.',
  },
  {
    triggerKey: 'mercury-ic',
    title: 'Mercury IC',
    category: 'planet_angle',
    body: 'Mercury at the IC brings a lively, mentally active quality to home and private life. The household may be full of books, debate, and ongoing projects. You process emotions through thinking and talking rather than feeling through them quietly. Good for working from home, studying, or building a space that doubles as an intellectual workshop. Family communication patterns — helpful and otherwise — surface clearly here.',
  },
  {
    triggerKey: 'mercury-dc',
    title: 'Mercury DC',
    category: 'planet_angle',
    body: 'Mercury on the Descendant draws communicative, mentally stimulating partners. Relationships here are built on exchange of ideas — you need someone who can keep up intellectually and who challenges your thinking. Contracts and agreements require careful attention; misunderstandings arise easily but resolve through honest talk. Good for partnerships in writing, business, or teaching.',
  },

  // ── Venus ─────────────────────────────────────────────────────────────────
  {
    triggerKey: 'venus-ac',
    title: 'Venus AC',
    category: 'planet_angle',
    body: 'Venus rising brings beauty, charm, and social ease. You appear attractive, approachable, and stylish here — people want to be near you. Art, aesthetics, and pleasurable pursuits flourish. Romance comes easily, though it can remain at the level of surface charm rather than deep connection. A wonderful line for creative work, social networking, and cultivating the good life in the most sensory sense.',
  },
  {
    triggerKey: 'venus-mc',
    title: 'Venus MC',
    category: 'planet_angle',
    body: 'Venus at the Midheaven gives career a distinctly aesthetic or relational flavour. Design, fashion, diplomacy, the arts, or beauty industries are all well-starred. You are liked at work and may achieve success through charm and collaboration as much as raw talent. Public reputation is gracious and pleasing. Watch for a tendency to avoid necessary conflict in pursuit of universal approval.',
  },
  {
    triggerKey: 'venus-ic',
    title: 'Venus IC',
    category: 'planet_angle',
    body: 'Venus at the IC makes the home a place of beauty, comfort, and sensory pleasure. You invest deeply in creating an aesthetically refined private world. Family relationships tend toward warmth and affection. This is a good line for artistic work done in private, for deepening self-love, and for building a home environment that genuinely restores you.',
  },
  {
    triggerKey: 'venus-dc',
    title: 'Venus DC',
    category: 'planet_angle',
    body: 'Venus on the Descendant is classically associated with romantic fortune. Partners here tend to be attractive, artistic, or socially gifted — and relationships themselves take on a Venusian quality of beauty, pleasure, and mutual appreciation. This is one of the more celebrated ACG lines for love and partnership. Be careful not to prioritise surface harmony over genuine depth.',
  },

  // ── Mars ──────────────────────────────────────────────────────────────────
  {
    triggerKey: 'mars-ac',
    title: 'Mars AC',
    category: 'planet_angle',
    body: 'Mars rising gives you physical presence, directness, and drive. You come across as bold, assertive, sometimes aggressive — people either respond with admiration or challenge you. Energy levels are high; action comes naturally. This is a good line for physical training, entrepreneurship, or any situation requiring courage. Watch for impulsive decisions, accidents, or interpersonal friction driven by an excess of forward energy.',
  },
  {
    triggerKey: 'mars-mc',
    title: 'Mars MC',
    category: 'planet_angle',
    body: 'Mars at the Midheaven drives career with ambition, competitiveness, and a will to win. You pursue professional goals with unusual determination and are seen as someone who gets things done — sometimes at the cost of diplomacy. Well-suited to entrepreneurship, athletics, the military, surgery, or any field that rewards decisive action. Conflicts with authority figures are possible; choose your battles carefully.',
  },
  {
    triggerKey: 'mars-ic',
    title: 'Mars IC',
    category: 'planet_angle',
    body: 'Mars at the IC can create friction in the domestic sphere — arguments at home, restlessness, or a sense that private life cannot contain your energy. On the positive side, you may be highly motivated to renovate, build, or physically transform your living space. Ancestral patterns of conflict or assertion surface for examination. Channelling this energy into physical activity or home projects helps prevent tension from spilling into family relationships.',
  },
  {
    triggerKey: 'mars-dc',
    title: 'Mars DC',
    category: 'planet_angle',
    body: 'Mars on the Descendant attracts partners with strong, assertive, sometimes combative energy. Relationships here are passionate and dynamic but can tip into power struggles. You may project your own drive onto others, seeing them as aggressive when the aggression is partly your own. This line challenges you to own your assertiveness directly rather than living it out through relationships. The passion here, when conscious, is genuinely exciting.',
  },

  // ── Jupiter ───────────────────────────────────────────────────────────────
  {
    triggerKey: 'jupiter-ac',
    title: 'Jupiter AC',
    category: 'planet_angle',
    body: 'Jupiter on the Ascendant expands your presence and optimism. You project generosity, enthusiasm, and philosophical breadth — people find you inspiring and larger-than-life. Opportunities seem to find you without much effort. This is a classic line for expansion, travel, teaching, and cross-cultural connection. The main risk is overextension: too many projects, too much comfort, or a tendency to promise more than you can deliver.',
  },
  {
    triggerKey: 'jupiter-mc',
    title: 'Jupiter MC',
    category: 'planet_angle',
    body: 'Jupiter at the Midheaven is traditionally one of the most auspicious career lines. Success, recognition, and advancement come with unusual ease. You may rise quickly in your field or attract powerful mentors and sponsors. This line favours academia, publishing, law, travel, and any work with an international or philosophical dimension. Maintain humility: Jupiter\'s gifts can cultivate complacency.',
  },
  {
    triggerKey: 'jupiter-ic',
    title: 'Jupiter IC',
    category: 'planet_angle',
    body: 'Jupiter at the IC brings abundance and expansion to home and family. The place may feel fortunate — good things seem to happen there. Family life is warm, generous, and philosophically open. You may inherit property or cultural richness here, or simply feel that the place itself enlarges your sense of what is possible. A good line for raising a family in an atmosphere of learning and freedom.',
  },
  {
    triggerKey: 'jupiter-dc',
    title: 'Jupiter DC',
    category: 'planet_angle',
    body: 'Jupiter on the Descendant brings luck and largesse to partnership. Partners here tend to be generous, broad-minded, and philosophically aligned with your growth. Relationships are expansive and educational — you genuinely develop through being with this person. Cross-cultural relationships or partnerships with people from different backgrounds are common. Guard against idealising partners or avoiding the hard work that real intimacy requires.',
  },

  // ── Saturn ────────────────────────────────────────────────────────────────
  {
    triggerKey: 'saturn-ac',
    title: 'Saturn AC',
    category: 'planet_angle',
    body: 'Saturn on the Ascendant adds weight and seriousness to your presence. You appear older, more austere, or more authoritative than usual — people take you seriously but may find you hard to approach. Discipline and self-mastery deepen here, often through difficulty. This is an excellent line for building something that lasts, but it demands patience. Early experience in this place may feel limiting; the rewards compound over time.',
  },
  {
    triggerKey: 'saturn-mc',
    title: 'Saturn MC',
    category: 'planet_angle',
    body: 'Saturn at the Midheaven is the line of the long-game careerist. Success here is hard-won and arrives late, but it is durable. You are tested professionally; authority figures may be critical or demanding. This line builds genuine mastery through difficulty and is associated with lasting achievement, institutional power, and leadership earned through perseverance. It suits any field where reputation is built over decades.',
  },
  {
    triggerKey: 'saturn-ic',
    title: 'Saturn IC',
    category: 'planet_angle',
    body: 'Saturn at the IC brings a weighty, often melancholic quality to home and private life. Old wounds, familial obligations, or ancestral patterns of hardship surface here. There can be a sense of being confined or burdened by domestic responsibilities. On the positive side, this line supports deep psychological work, building an enduring home, and facing the past with courage and clarity. It is not an easy line, but it is a maturing one.',
  },
  {
    triggerKey: 'saturn-dc',
    title: 'Saturn DC',
    category: 'planet_angle',
    body: 'Saturn on the Descendant attracts serious, older, or cautious partners. Relationships feel significant and weighty — commitments made here tend to be real and lasting. There may be age gaps, differences in authority, or a sense of obligation within partnerships. The line can also reflect difficulty in forming close relationships: reserve, fear of rejection, or attracting unavailable people. With time, it teaches what genuine commitment looks like.',
  },

  // ── Uranus ────────────────────────────────────────────────────────────────
  {
    triggerKey: 'uranus-ac',
    title: 'Uranus AC',
    category: 'planet_angle',
    body: 'Uranus on the Ascendant marks you as unusual, original, and disruptive to whatever norm is in play. You may arrive in this place and find yourself suddenly breaking patterns — lifestyle, identity, social affiliations all shift. Others find you electric or erratic. This is a line for experimentation, innovation, and liberation from old constraints. Stability is hard to maintain; expect the unexpected.',
  },
  {
    triggerKey: 'uranus-mc',
    title: 'Uranus MC',
    category: 'planet_angle',
    body: 'Uranus at the Midheaven disrupts conventional career paths and invites unconventional routes to recognition. You may build a reputation for being ahead of your time, for innovation, or for refusing to follow established hierarchies. Periods of sudden advancement alternate with unexpected reversals. Best suited to technology, activism, invention, or any field that prizes originality over conformity.',
  },
  {
    triggerKey: 'uranus-ic',
    title: 'Uranus IC',
    category: 'planet_angle',
    body: 'Uranus at the IC disrupts domestic stability. Home life here is unconventional, changeable, or fragmented — frequent moves, unusual living situations, or family structures that deviate from the norm. There is freedom and excitement in this, but also a difficulty in truly settling. This line asks you to build a sense of home that can travel with you, rather than anchoring it to any physical place.',
  },
  {
    triggerKey: 'uranus-dc',
    title: 'Uranus DC',
    category: 'planet_angle',
    body: 'Uranus on the Descendant brings electric, unpredictable partnerships. Relationships here begin suddenly and may end just as abruptly. Partners are original, freedom-loving, and resistant to conventional commitment. If you crave stability, this line may prove frustrating; if you want to be genuinely surprised by another person, it delivers. The deeper invitation is to examine your own relationship to freedom versus closeness.',
  },

  // ── Neptune ───────────────────────────────────────────────────────────────
  {
    triggerKey: 'neptune-ac',
    title: 'Neptune AC',
    category: 'planet_angle',
    body: 'Neptune on the Ascendant softens and dissolves edges — yours and others\'. You appear mysterious, otherworldly, or hard to pin down. People project qualities onto you that may have little to do with who you actually are. Creativity, spirituality, and sensitivity are heightened, but so is the risk of confusion about identity, escapism, or being taken advantage of. Best for artists, healers, and those doing intentional inner work.',
  },
  {
    triggerKey: 'neptune-mc',
    title: 'Neptune MC',
    category: 'planet_angle',
    body: 'Neptune at the Midheaven blurs the line between career and calling. Work here tends to be idealistic, artistic, spiritual, or service-oriented. You may attract a following drawn to your vision or inspiration. The risks include professional disillusionment, working without proper boundaries, or building a public image that cannot be sustained. Best for creative, healing, or devotional paths rather than conventional corporate structures.',
  },
  {
    triggerKey: 'neptune-ic',
    title: 'Neptune IC',
    category: 'planet_angle',
    body: 'Neptune at the IC dissolves the boundaries of the private self and home. There can be a dreamy, almost surreal quality to domestic life here — a sense of living slightly outside ordinary reality. Spiritual practice deepens at home; the place may feel sacred or liminal. Be watchful of illusion in family matters, unclear boundaries with housemates, or a tendency to escape into fantasy rather than addressing practical concerns.',
  },
  {
    triggerKey: 'neptune-dc',
    title: 'Neptune DC',
    category: 'planet_angle',
    body: 'Neptune on the Descendant casts a glamour over partnership. You idealise or are idealised by partners, which can be transcendent or devastating depending on how grounded you are. Relationships here have a spiritual or illusory quality; it can be hard to see a partner clearly. This line asks for radical honesty about what you actually want versus what you imagine. At its best, it brings soulmate-quality connection and compassionate love.',
  },

  // ── Pluto ─────────────────────────────────────────────────────────────────
  {
    triggerKey: 'pluto-ac',
    title: 'Pluto AC',
    category: 'planet_angle',
    body: 'Pluto on the Ascendant gives your presence a magnetic, intense quality. You project power — sometimes threatening, sometimes compelling — and tend to have a transformative effect on those around you. This place strips away the inauthentic; you cannot hide here. Profound personal metamorphosis is available, often through confronting fears, shadow material, or encounters with power and control. Not an easy line, but a deeply transformative one.',
  },
  {
    triggerKey: 'pluto-mc',
    title: 'Pluto MC',
    category: 'planet_angle',
    body: 'Pluto at the Midheaven draws you toward careers involving power, depth, and transformation — psychology, research, surgery, occult practices, investigative journalism, or positions of significant institutional authority. Your professional path involves periodic death-and-rebirth cycles. Recognition may come through work that exposes hidden truths or facilitates collective transformation. Power dynamics at work are intense and worth examining carefully.',
  },
  {
    triggerKey: 'pluto-ic',
    title: 'Pluto IC',
    category: 'planet_angle',
    body: 'Pluto at the IC reaches into the unconscious roots of family and ancestral inheritance. Deep psychological material surfaces here — generational trauma, power dynamics within the family of origin, buried secrets. This is a line for serious shadow work and depth therapy. The place itself may feel fated or intense. Transformation of the foundational self is possible, though it proceeds through excavation rather than ease.',
  },
  {
    triggerKey: 'pluto-dc',
    title: 'Pluto DC',
    category: 'planet_angle',
    body: 'Pluto on the Descendant brings intensity, power struggles, and deep transformation through relationship. Partners here have Plutonic qualities — magnetic, controlling, or transformative — and relationships involve significant confrontations with power, jealousy, or shadow material. These encounters are rarely comfortable, but they tend to forge character. This line asks you to examine what you are projecting onto others and to reclaim your own power directly.',
  },

  // ── Chiron ────────────────────────────────────────────────────────────────
  {
    triggerKey: 'chiron-ac',
    title: 'Chiron AC',
    category: 'planet_angle',
    body: 'Chiron on the Ascendant surfaces your core wound in the arena of identity and presentation. You may feel acutely exposed or "different" here in ways that mirror old injuries around not belonging or not being enough. At the same time, your wound becomes your gift: you see and hold space for others\' pain with unusual precision. This line is powerful for healing work, mentorship, and the slow building of authentic self-acceptance.',
  },
  {
    triggerKey: 'chiron-mc',
    title: 'Chiron MC',
    category: 'planet_angle',
    body: 'Chiron at the Midheaven connects your career to your deepest wound — and to your unique gift for helping others navigate similar terrain. Work here often has a healing or mentoring dimension. You may feel exposed or underqualified professionally, even when you are not. Over time, the wound becomes the work: what has hurt you most is precisely what makes you most effective as a guide, healer, or teacher.',
  },
  {
    triggerKey: 'chiron-ic',
    title: 'Chiron IC',
    category: 'planet_angle',
    body: 'Chiron at the IC reaches into the wound at the root — family of origin, ancestral patterns, the earliest experiences that shaped your sense of self. This line opens old hurts around belonging, home, and being loved unconditionally. It is a difficult but fertile place for deep inner healing, particularly work focused on childhood, lineage, and the body. What is healed here tends to ripple outward through time.',
  },
  {
    triggerKey: 'chiron-dc',
    title: 'Chiron DC',
    category: 'planet_angle',
    body: 'Chiron on the Descendant surfaces the wound through relationship. Partners here mirror your deepest injuries; you may attract people who are wounded in complementary ways, or find yourself repeatedly cast as healer or the one who needs healing. This line asks for rigorous honesty about patterns in relationship — what you keep recreating and why. Conscious engagement transforms it into a line of profound relational healing and mutual growth.',
  },

  // ── North Node ────────────────────────────────────────────────────────────
  {
    triggerKey: 'north_node-ac',
    title: 'North Node AC',
    category: 'planet_angle',
    body: 'The North Node on the Ascendant points toward a place of karmic growth and soul direction. Living or spending significant time here feels purposeful — as if you are moving toward who you are becoming rather than repeating who you have been. New qualities, identities, and ways of presenting yourself open up. This is a line of dharmic development: challenging, but unmistakably aligned with your deeper trajectory.',
  },
  {
    triggerKey: 'north_node-mc',
    title: 'North Node MC',
    category: 'planet_angle',
    body: 'The North Node at the Midheaven aligns career with soul evolution. Work here feels fated or deeply purposeful — as if your professional path is part of a larger calling. You may encounter opportunities that seem to arrive from nowhere and push you toward your growth edge. This line favours careers that are genuinely new territory for you, rather than repetitions of established patterns.',
  },
  {
    triggerKey: 'north_node-ic',
    title: 'North Node IC',
    category: 'planet_angle',
    body: 'The North Node at the IC draws the soul toward home, rootedness, and private depth. This may be a place of ancestral healing or of building the foundation your soul requires in this lifetime. Domestic life feels purposeful and important. The invitation is to invest in the inner life, family, and private world as a genuine act of soul development — not as retreat from the world, but as necessary nourishment for everything else.',
  },
  {
    triggerKey: 'north_node-dc',
    title: 'North Node DC',
    category: 'planet_angle',
    body: 'The North Node on the Descendant points to partnership as the primary vehicle for soul growth. Significant relationships here feel fated or karmic — the people you meet push you precisely where you need to develop. This line asks you to move toward genuine interdependence rather than self-sufficiency, and to practice the vulnerability that real partnership requires.',
  },
];

// Convenience lookup by triggerKey
export const interpretationsByKey = Object.fromEntries(
  interpretations.map((i) => [i.triggerKey, i])
) as Record<string, Interpretation>;

// All planet_angle interpretations grouped by planet
export const PLANETS_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'chiron', 'north_node',
] as const;

export const ANGLES_ORDER = ['ac', 'mc', 'ic', 'dc'] as const;
