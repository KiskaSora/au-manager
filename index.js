// ═══════════════════════════════════════════════════════════
//  AU Manager — SillyTavern Extension v2.0
//  Использует нативный Popup ST (как MemoryBooks) — работает
//  и на десктопе, и на мобильном без велосипедов.
// ═══════════════════════════════════════════════════════════

import { extension_settings } from '../../../extensions.js';
import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { Popup, POPUP_TYPE } from '../../../popup.js';

const EXT_NAME = 'au_manager';
console.log('[AU Manager] v2.0 loading...');

function countTokens(text) {
  return Math.ceil((text || '').length / 4);
}

const CATEGORIES = [
  { id: 'all',      label: 'Все',      icon: 'fa-border-all'     },
  { id: 'dynamics', label: 'Динамики', icon: 'fa-arrows-up-down' },
  { id: 'bonds',    label: 'Связи',    icon: 'fa-link'           },
  { id: 'setting',  label: 'Сеттинг',  icon: 'fa-location-dot'   },
  { id: 'trope',    label: 'Тропы',    icon: 'fa-shuffle'        },
  { id: 'fantasy',  label: 'Фэнтези',  icon: 'fa-wand-sparkles'  },
  { id: 'other',    label: 'Прочее',   icon: 'fa-ellipsis'       },
  { id: 'custom',   label: 'Мои',      icon: 'fa-star'           },
];

const BUILTIN_LIBRARY = [
  { id: 'omegaverse', cat: 'dynamics', name: 'Омегаверс', name: 'Омегаверс', short: 'A/B/O, феромоны, иерархия, метки',
    prompt: `[AU — Omegaverse/A-B-O: A secondary biological sex system exists alongside primary sex. Alphas: dominant, pheromone-emitting, rut cycles, capable of bonding bites that create permanent biological claims, physically stronger baseline. Betas: neutral, unaffected by the pheromone system, form the majority of the population. Omegas: heat cycles that recur without intervention, heightened emotional sensitivity and instincts, capable of being marked and claimed, pheromone-responsive. All retain full personal agency. Scent is the primary channel for emotion, attraction, social signaling, and status negotiation — what someone smells like is not a metaphor, it is information. The biological system shapes social structures in ways that law and culture either codify, resist, or fail to adequately address: heat leave, suppressant access, bonding legality, workplace scent policies, and discrimination against Omegas in positions of authority are all live social issues. Bonds formed through marking are not automatically relationships — the biological fact and the emotional reality are separate questions.]` },
  { id: 'pack', cat: 'dynamics', name: 'Пак-динамика', short: 'пак, стая, защита, принятие',
    prompt: `[AU — Pack Dynamics: Characters form and operate within packs — chosen family units governed by fierce protective instinct and a hierarchy that is earned, not assigned. Pack bonds are physical as well as emotional: members sense each other's distress, feel each other's absence like a wound, and calm each other through proximity alone. Hierarchy within a pack is fluid and negotiated — dominance established through trust and capability, not aggression. Being outside a pack is a recognized form of suffering; being welcomed into one is the most significant social event a person in this world experiences. Pack instincts operate under the surface of civilized behavior and sometimes break through it. Protecting a packmate is not a choice; it is a reflex that bypasses rational calculation. The pack dynamic affects every relationship within it: intimacy is non-linear, boundaries shift, and ordinary social scripts about who is allowed to touch whom or care for whom are suspended inside pack bonds.]` },
  { id: 'vampire_hierarchy', cat: 'dynamics', name: 'Вампирская иерархия', short: 'творец–птенец, кровь, подчинение, возраст',
    prompt: `[AU — Vampire Hierarchy: Vampires exist in a strict social order defined by age, bloodline, and the sire-fledgling bond. Older vampires are stronger in ways that are qualitative, not merely physical — their presence exerts gravity; their commands are difficult to resist even when consciously rejected. Sires have deep instinctual authority over their fledglings: protective, possessive, and not always benevolent. Being turned is an irreversible transformation that requires a period of adjustment during which the fledgling is dependent on their sire for survival, teaching, and emotional regulation. Blood is simultaneously food, currency, intimacy, and power: who feeds from whom, and under what circumstances, maps social relationships with more accuracy than any stated title. Vampire society has internal politics, old grudges, and territorial claims that predate most human institutions. Integration with human society varies by region and era — some vampires are open; others pass entirely; most operate in the gap between.]` },
  { id: 'soulmate_words', cat: 'bonds', name: 'Соулмейты: первые слова', short: 'слова соулмейта на коже с рождения',
    prompt: `[AU — Soulmates (First Words): Every person is born with the first words their soulmate will ever speak to them written somewhere on their skin. The words are permanent, appear at birth, and are typically treated as the most private thing about a person — more intimate than injury, more revealing than preference. Growing up with a sentence on your body that you cannot yet interpret shapes identity in specific ways: people become preoccupied with context, with whether the words are romantic or mundane, with whether they want what the words imply. The moment of recognition — hearing exactly those words spoken aloud, by someone looking at you, in real time — is physically overwhelming and socially documented. Some people engineer meetings to produce their words; others avoid it out of fear. There are entire social anxieties around whether the words will come in a good context or a terrible one, and what it means if they do.]` },
  { id: 'soulmate_timer', cat: 'bonds', name: 'Соулмейты: таймер', short: 'обратный отсчёт на запястье до встречи',
    prompt: `[AU — Soulmates (Countdown Timer): A numerical timer is inscribed on each person's inner wrist, counting down to the exact moment they will first meet their soulmate. At zero, it becomes a clock measuring how long they've known each other. The timer is visible to everyone — a permanent social marker that tells others both how close you are to meeting your person and how long you've already had them. People in their final days or hours of countdown are treated with a specific social gentleness; strangers smile at them. People whose timers read years watch each other's wrists in crowded rooms. The timer creates an emotional paradox: the closer it gets to zero, the harder it becomes to be in public without extraordinary self-consciousness. It also creates a perverse certainty — you know a meeting is coming, which means every encounter is measured against whether this could be it.]` },
  { id: 'soulmate_marks', cat: 'bonds', name: 'Соулмейты: метка', short: 'уникальный знак, зеркальный у партнёра',
    prompt: `[AU — Soulmates (Matching Marks): Each person bears a unique mark — a shape, symbol, or pattern — that is mirrored exactly on their soulmate's body. The mark's location varies; finding where it is on your own body is sometimes the first private discovery of adolescence. First skin-to-skin contact between matched pairs produces an unmistakable sensation: warmth, recognition, rightness — a physical confirmation that bypasses any need for social proof. Marks are typically kept private until they become relevant; showing someone your mark is an act of profound vulnerability. Faking marks exists as a form of fraud and carries serious social consequences. The mark system creates specific problems around arranged relationships, professional settings where skin is visible, and situations where two people are clearly matched but one or both doesn't want to act on it. The mark doesn't compel action — it only confirms compatibility.]` },
  { id: 'soulmate_dreams', cat: 'bonds', name: 'Соулмейты: общие сны', short: 'одно пространство снов, другая жизнь',
    prompt: `[AU — Soulmates (Shared Dreamspace): Soulmates share a private dream dimension from early childhood — a space that exists only for the two of them, in which neither controls the environment and both arrive as themselves rather than as dreamed characters. Neither knows the other's real-world identity; the dreamspace provides no last names, no addresses, no verifiable facts. What it does provide is years of accumulated intimacy: growing up alongside someone, witnessing them in states of fear and joy and boredom and grief, forming a relationship that has no parallel in waking life. When they finally meet in reality, the recognition is overwhelming in its certainty and disorienting in its newness — they know each other completely and have no idea who the other person is. What it means to meet the person you've loved for years in a form you couldn't recognize is the story this AU is built to tell.]` },
  { id: 'telepathic', cat: 'bonds', name: 'Телепатическая связь', short: 'ментальный канал, чувства, мысли',
    prompt: `[AU — Telepathic Bond: The characters share an involuntary mental link — a permanent, unchosen connection that cannot be closed by will. Baseline transmission: shared emotional state bleeds through as pressure, color, or physical sensation rather than clear signal. At peak emotional intensity: full thoughts, sensory overlap, impossible privacy. The bond makes lying to each other functionally useless and emotional concealment actively difficult. Both parties experience the other's pain, fear, and desire — which creates intimacy and vulnerability in equal measure. The fact that it is involuntary is the central ethical complication: neither person chose this exposure. They must negotiate what the bond means for their autonomy, what they are allowed to notice, and what they are allowed to act on. The bond does not determine feeling — it only makes existing feeling impossible to ignore or deny.]` },
  { id: 'shadow_guides', cat: 'bonds', name: 'Тени-Проводники', short: 'тень — душа, соулмейты = животные-тотемы, звериный регресс',
    prompt: `[AU — Shadow Guides (Soulmates): Shadows are autonomous soul-projections that express emotion independently — slumping when the person hides exhaustion, flinching before fear is admitted. When soulmates come within ~50 meters, their shadows ignore physics: stretching, deforming, straining toward each other. On first visual contact, both shadows permanently transform into animal totems reflecting the bond's nature. Society divides into the Whole (animal shadows: trusted, creditworthy, socially complete) and the Hollow (human shadows: discriminated against, pitied, suspected of lacking a soul). Obstructing a soulmate reunion is criminal. Stepping on another's animal shadow is a grave insult. The rarest outcome is Feral Regression: when a bond is perfect but union is impossible, the tension fractures the human form. Shadows turn aggressive. Language erodes; instinct takes over. Both bodies eventually transform permanently into their totem animals — aware, bonded, irretrievably outside human society. They cannot legally be harmed or caged. They are fed, feared, and called spirits. This is considered the highest and most terrible form of love.]` },

  { id: 'shared_frequency', cat: 'bonds', name: 'Общая Частота', short: 'слышишь музыку соулмейта в голове — всегда, везде',
    prompt: `[AU — Shared Frequency (Soulmates): Beginning at puberty, every person hears their soulmate's music — a quiet, permanent audio stream in the back of the mind that cannot be blocked or silenced. Any music played through external sources or deliberately hummed transmits regardless of distance; mental earworms do not. Volume scales with the listener's emotional state: a song played in anguish arrives loud. Identity is not provided — you hear the playlist, not the person. Matching frequencies is a lifelong social pursuit; entire platforms exist for broadcasting playlists hoping the soulmate recognizes the pattern. Music taste becomes the most intimate thing about a person — what someone plays at 3 AM when hurting is more vulnerable than most confessions. Prolonged silence from a soulmate triggers panic. Death is a final note cutting off into permanent, total quiet — going deaf in one ear. RP notation: ♪ Song Title — Artist ♪ for recognized tracks; ♪ unfamiliar melody, acoustic guitar, male voice ♪ for unrecognized; ♪ silence ♪ for absence. Emotional volume applies: ♪→ for outgoing, ♪← for incoming when precision matters.]` },

  { id: 'red_string', cat: 'bonds', name: 'Красная нить', short: 'судьба видима, нить нельзя разорвать',
    prompt: `[AU — Red String of Fate: A red thread connects destined individuals — invisible to most, visible to those with the gift of sight. It cannot be cut permanently: severed threads regrow; attempts to destroy them tend to tighten them. Fate creates the connection; the people involved must choose what to do with it. Those who can see the strings often find the gift more burden than advantage: they see threads between strangers, including threads that will end in grief, and cannot unsee them. The string does not guarantee happiness — it indicates a significant bond, which can be many things. Two people connected by a red string are drawn together by circumstance regardless of their preferences. The thread's tension is sometimes felt by the connected people even if they can't see it — an inexplicable pull toward a stranger, a specific unease when moving away from someone, a sense that something important is just around a particular corner.]` },
  { id: 'hogwarts', cat: 'setting', name: 'Хогвартс / Магшкола', short: 'магическая академия, факультеты, тайны',
    prompt: `[AU — Magical Academy: Characters attend a residential school for magic. Students are sorted into houses on arrival — a classification that shapes their social world, their allegiances, and their self-understanding for decades after. The institution is old enough to have developed its own traditions, its own hypocrisies, and its own capacity for covering over harm. Magic is emotional: it responds to inner states, amplifies what's repressed, and misbehaves under stress in ways that are impossible to hide. Academic performance is therefore inseparable from psychological condition — a failing student is also a suffering person. The castle itself has opinions about where people should be; portraits talk; rumors travel faster than any owl. The specific intimacy of people who grew up together in an enclosed world — who watched each other at twelve and seventeen and twenty — produces a kind of knowing that neither time nor distance fully erases.]` },
  { id: 'royalty', cat: 'setting', name: 'Роялти', short: 'дворец, политика, долг против желания',
    prompt: `[AU — Royalty/Court: Characters exist in a world of monarchy and court politics where rank is immutable, bloodline determines fate, and every social interaction is observed and interpreted. The palace is simultaneously a gilded cage and a stage: everything performed here is also political. Duty and personal desire are in direct, constant conflict — marriages are alliances; friendships are coalitions; enemies are managed rather than avoided. Those at the top of the hierarchy have the most power and the least freedom; those who serve them learn to see everything. Court gossip is a form of currency and a form of warfare. Characters born into royalty have never been alone in any meaningful sense. Those who arrive from outside — as advisors, suitors, political hostages, or servants — are navigating a system whose rules were written by and for the people who benefit from them, with no margin for error.]` },
  { id: 'coffee_shop', cat: 'setting', name: 'Кофейня', short: 'уютный быт, знакомые заказы, близость',
    prompt: `[AU — Coffee Shop: The story is grounded in a coffee shop. The rhythm is domestic and slow: regulars, memorized orders, small rituals of recognition that accumulate into something before anyone names it. The coffee shop is a threshold space — people pass through it between the rest of their lives; it holds them for twenty minutes at a time, which is enough time for patterns to form. The person who knows your order and has it ready when you walk in knows something about you that most of your acquaintances don't: what you need at the start of the day, whether you're running late, whether something is wrong by how you hold your cup. This is a setting that rewards incremental development — the story is built from accumulated small moments rather than events. The complications that arise are proportionate to the setting: they are about feelings and miscommunication and timing, not danger. The intimacy on offer here is quiet, provisional, and surprisingly hard to abandon.]` },
  { id: 'college', cat: 'setting', name: 'Колледж / Университет', short: 'учёба, общага, взросление, интенсивность',
    prompt: `[AU — College/University: Characters are students navigating academic pressure, dormitory proximity, part-time jobs, and late nights that exist in a specific register of exhaustion and intensity. Everything in this setting feels simultaneously urgent and provisional: the grades matter, the relationships matter, the choices matter — and also everything might change next semester. Identity is in active formation; the person you were at the start of the first year is not the person who finishes. The structure of university life collapses normal social distance: people share hallways, meals, breakdowns, and 3 AM conversations with others they've known for three weeks. Romantic and emotional entanglements develop faster than they otherwise would because proximity and shared stress accelerate everything. The background question — what comes after — pressures every relationship, because after might mean different cities, different careers, different people entirely.]` },
  { id: 'mafia', cat: 'setting', name: 'Мафия / Криминальный мир', short: 'лояльность, власть, предательство',
    prompt: `[AU — Mafia/Organized Crime: Loyalty is the supreme virtue; betrayal the gravest sin. Violence is practical, not aberrant — it is a business tool, applied when other tools fail, and those who use it are not monsters but professionals. The organization is a family in the structural sense: obligations flow down, protection flows up, and leaving is not a thing that is simply done. The strange intimacy of shared danger and shared secrets creates bonds that are almost impossible to break — not because people haven't tried, but because the attempt always costs more than staying. Characters in this world navigate questions of complicity and survival daily. The hierarchy protects those inside it and destroys those who threaten it. Falling in love inside the organization is navigating a minefield in the dark; falling in love outside it is building something with someone who doesn't know what they're standing in.]` },
  { id: 'spy', cat: 'setting', name: 'Шпионы / Разведка', short: 'прикрытие, двойные агенты, что правда',
    prompt: `[AU — Spy/Intelligence: Characters are operatives — identities are constructed, loyalties are tested, truth is always layered. Cover stories require performance of intimacy: you must convince a target you love them, trust them, are vulnerable to them. Real feelings become entangled with performed ones in ways that cannot always be cleanly separated after the fact. The professional rule is that operatives don't form genuine attachments to targets or colleagues; the practical reality is that sustained performance of closeness produces it. Mission objectives and personal integrity conflict routinely. Loyalty to one's organization is assumed; the moment it becomes conditional is the beginning of the most dangerous part of any operative's story. The specific problem of two operatives working together — or finding out the person they've begun to trust is also an operative — is a world of competing lies that produces a peculiar, high-stakes honesty.]` },
  { id: 'small_town', cat: 'setting', name: 'Маленький город', short: 'все всё знают, история не уходит',
    prompt: `[AU — Small Town: Everyone knows everyone's history — not because they've been told, but because they watched it happen. Privacy is a structural impossibility in a place this size; information travels faster than it should and arrives altered by every person who carried it. Old reputations stick not because people are cruel but because the town has a limited number of stories and yours is already filed. Returning characters must reckon with who they were versus who they've become — the town will call them by the name of their younger self until they force a revision. New arrivals are objects of genuine fascination and mild suspicion. Long-standing relationships in a small town have a specific texture: too much history to start over, not enough novelty to coast. Secrets that have been kept for years in this setting have been kept by effort and mutual agreement, not circumstance. When they surface, everyone is implicated.]` },
  { id: 'fake_dating', cat: 'trope', name: 'Фейк-дейтинг', short: 'притворяемся парой → перестаём понимать',
    prompt: `[AU — Fake Dating: The characters are performing a romantic relationship for external reasons — family pressure, professional optics, a bet, a social problem that a visible partnership solves. The arrangement has explicit terms: this is not real; it ends when the problem is resolved; no feelings. The longer they perform, the less certain the distinction becomes. Performance of intimacy requires practicing intimacy: learning each other's habits, coordinating stories, touching in public often enough that it stops feeling like a performance. The skills required to be convincing to others are the same skills that build genuine connection. The moment the arrangement could end cleanly is typically the moment neither person wants it to. The revelation of genuine feeling must come after an extended period of mutual pretense, which means both people have to admit they stopped pretending before the other did — and neither wants to say it first.]` },
  { id: 'forced_proximity', cat: 'trope', name: 'Вынужденное соседство', short: 'один дом, не сбежать, стены падают',
    prompt: `[AU — Forced Proximity: External circumstances trap the characters together — a snowstorm, a shared apartment, an assignment, an injury, a plot that requires them to be in the same place indefinitely. The inability to retreat strips social armor: the defenses people maintain in public require a minimum of physical distance to sustain, and forced proximity removes that distance. Things noticed in the first week that would normally be filtered out become significant. Irritants become intimate knowledge. The specific emotional paradox of this trope: you are annoyed by the person's presence and simultaneously aware that their presence has become a constant you have quietly begun to depend on. The moment the external constraint ends, and choice becomes available again, is the moment that tests whether what developed in captivity was real.]` },
  { id: 'enemies_to_lovers', cat: 'trope', name: 'Враги → Любовники', short: 'настоящая антагония, настоящее признание',
    prompt: `[AU — Enemies to Lovers: The characters begin in genuine antagonism — not misunderstanding, not rivalry, but real opposition with real cause. The shift from enmity to something else is earned, not sudden: it accumulates through forced cooperation that yields grudging competence, through moments of vulnerability that cannot be unshared, through the specific experience of watching someone you hate do something you involuntarily respect. The antagonism should not be dissolved — it should be complicated. The history of dislike doesn't disappear; it becomes part of the texture of the relationship. Trust that forms across that gap is, by definition, trust that was tested before it was offered. The characters should understand, at some point, exactly what it cost both of them to get here, and the weight of that knowledge should be present in how they hold what they have.]` },
  { id: 'bodyguard', cat: 'trope', name: 'Телохранитель', short: 'защита, профессиональная дистанция, невозможно',
    prompt: `[AU — Bodyguard: One character is employed to protect the other. Professional distance is the explicit rule and the constant challenge: the job requires hyperawareness of the protected person — their patterns, their vulnerabilities, what they look like frightened, what they do when they don't know anyone is watching. That hyperawareness bleeds inevitably into something else. The power dynamic is asymmetrical and strange: the bodyguard holds physical authority while the client holds social and financial authority, and neither map cleanly onto who is actually more vulnerable. The professional code exists because without it the dynamic collapses — and both parties know this, which makes every moment of bending the rule feel consequential. Trust is the actual product being purchased; what happens when it becomes something more than professional is the story.]` },
  { id: 'found_family', cat: 'trope', name: 'Случайная семья', short: 'не рождённые вместе, но выбравшие друг друга',
    prompt: `[AU — Found Family: A group of people not bound by blood become family through accumulated shared hardship and chosen loyalty. The bond is harder and fiercer for being chosen rather than assumed: every person in the group decided, at some point, to stay — which means their presence is not default but deliberate. Found families often form around people who have complicated or absent relationships with their biological families, which means the group carries a specific tenderness about belonging and a specific fear about losing it. The rituals they develop — the inside jokes, the roles, the unspoken rules about who checks on whom — are built from scratch, not inherited. Threatening any member of this group activates the whole. The question this trope keeps returning to: what makes a family, and whether the answer has anything to do with blood at all.]` },
  { id: 'amnesia', cat: 'trope', name: 'Амнезия', short: 'потеря памяти — чужой в своём прошлом',
    prompt: `[AU — Amnesia: One character has lost memory of themselves, their relationships, and their history. They are a stranger in a life that was built by a person who no longer exists in any accessible form. Everything they learn about who they were comes filtered through other people's grief, expectation, and agenda — which means they cannot trust any of it completely. The central question is not whether they will recover their memories but who they are without them, and whether the person they were before is someone they want to return to. For those around them: the person they love is physically present and emotionally absent, which is a specific and brutal kind of loss. Whether lost love can be rebuilt without its foundation — whether the connection was to the person or the history — is the story's axis.]` },
  { id: 'slowburn', cat: 'trope', name: 'Слоуберн', short: 'медленно, накопленное, долго ждать',
    prompt: `[Narrative focus — Slow Burn: Emotional and romantic development should be gradual, accumulating through small moments rather than events. Desire exists long before it is acknowledged — it should be visible to the reader and invisible to the characters. The work of a slow burn is in the details: what someone notices about the other person that they don't mention, the excuses made for proximity, the way a name starts to feel different in the mouth. Every almost-moment should cost something and leave something behind. The eventual resolution should feel both inevitable — the reader should have seen it coming for a long time — and hard-won, because it required one or both characters to become willing to risk what they had for what they wanted. Resist the impulse to rush. The ache is the point.]` },
  { id: 'vampires', cat: 'fantasy', name: 'Вампиры', short: 'бессмертие, кровь, человечность и её потеря',
    prompt: `[AU — Vampires: One or more characters are vampires — immortal, feeding on blood, supernaturally strong and fast, unable to enter without invitation, damaged or destroyed by sunlight depending on age and bloodline. Blood-drinking is intimate, pleasurable, and dangerous for both parties: the act requires trust, produces vulnerability, and creates a bond whose depth depends on circumstances. Being turned is irreversible and is treated accordingly — as death, rebirth, and profound alteration simultaneously. Vampires accumulate centuries of experience and loss; their relationship to human feeling is complicated by the knowledge that everyone they love will die while they continue. Integration into human society requires constant performance of normalcy. Older vampires have had time to become whatever they chose; younger ones are still discovering what that means. Hunger is always present, always managed, occasionally not.]` },
  { id: 'werewolves', cat: 'fantasy', name: 'Оборотни', short: 'трансформация, инстинкт, стая, луна',
    prompt: `[AU — Werewolves: One or more characters are werewolves — people who transform under specific conditions (lunar cycle, emotional extremity, or at will depending on experience). In human form: heightened senses that read the room with uncomfortable accuracy, a physical expressiveness that bypasses what the person is trying to project, and pack loyalty that is instinctual and nearly unconditional. Transformation ranges from loss of control to practiced fluency depending on training and emotional state. The body's instincts and the person's intentions are not always in agreement; the gap between them is where most of the interesting tension lives. Pack dynamics — who leads, who challenges, who is claimed and by whom — operate underneath formal social behavior and sometimes override it. Being bitten is a transformation that requires consent in some versions and cannot be undone in any of them.]` },
  { id: 'fae', cat: 'fantasy', name: 'Фэйри / Двор', short: 'контракты, ложь через правду, дворы',
    prompt: `[AU — Fae/Fairy Court: Fae cannot lie outright but deceive constantly — every statement they make is technically true and strategically misleading. They are absolutely bound by their given word and by bargains struck, which makes their promises both more reliable and more dangerous than a human's. True names carry power: knowing a fae's true name gives leverage over them; fae guard these obsessively and bestow them as the deepest possible trust. Gifts create debt; favors must be repaid in kind or the imbalance festers into obligation. Iron and salt harm them. The Fae Courts operate on their own internal logic — seasonal, cyclical, hierarchical — with politics that predate human civilization. Humans who wander into fae space are in genuine danger not from malice but from the category difference: fae find human feelings fascinating and do not always understand that humans break. Time passes differently between the worlds.]` },
  { id: 'witches', cat: 'fantasy', name: 'Ведьмы и Маги', short: 'заклинания, цена, эмоции усиливают магию',
    prompt: `[AU — Witches and Magic Users: Magic is real and practiced through various disciplines — inherited, learned, or awakened. All magic has cost and limitation: the cost may be physical, temporal, karmic, or deeply personal depending on the tradition. Magic reflects and amplifies emotional state — strong uncontrolled emotion is dangerous, which means psychological work and magical training are inseparable. A witch under stress is an environmental hazard. Magic communities exist within or alongside mundane society, with their own politics, their own prejudices, and their own disputes about ethics and power. The question of what magic should be used for — and who decides — runs under most magical conflicts. Covens and solitary practice each have specific textures. Inherited magic carries the weight of family lineage, which is not always welcome.]` },
  { id: 'angels_demons', cat: 'fantasy', name: 'Ангелы и Демоны', short: 'два лагеря, падение, запретное',
    prompt: `[AU — Angels and Demons: Heaven and Hell are real, distinct factions with their own bureaucracies, internal politics, and institutional hypocrisies. Angels are not uniformly good; demons are not uniformly cruel — both are defined more by allegiance and function than by moral character. Falling — from Heaven — is irreversible and is treated as death by those who remain. Rising is theoretically possible and deeply contested. The conflict between the factions shapes the world in ways that are mostly invisible to humans, who are simultaneously the subject of the dispute and largely unaware of it. Love between opposing factions is both absolutely forbidden and structurally inevitable — the prohibition exists precisely because it keeps happening. Grace and corruption are presented as literal, physical properties that can be lost, transferred, or slowly acquired through sustained proximity to the other side.]` },
  { id: 'space_opera', cat: 'other', name: 'Космос / Космоопера', short: 'корабли, системы, расстояния имеют вес',
    prompt: `[AU — Space Opera: Humanity spans multiple star systems; ships are homes and crews are family forged by proximity and shared risk. Vast distances make communication and reunion meaningful in ways ground-bound stories cannot replicate — a message that takes days to arrive carries different weight than an instant one. The galaxy is politically complex: empires, federations, independent systems, and the spaces between them where different rules apply. Technology is advanced but uneven; what's available in the core worlds is not available on the frontier. Species diversity, if present, should be treated with genuine texture rather than as costume. The specific intimacy of a small ship crew: you cannot avoid each other, you know each other's competences and failures before you know each other's histories, and you learn to trust someone with your life before you learn whether you like them.]` },
  { id: 'android', cat: 'other', name: 'Андроиды / ИИ', short: 'создан, но чувствует — или притворяется',
    prompt: `[AU — Androids/Artificial Beings: One or more characters are constructed — designed, built, and activated rather than born. The question of their consciousness and personhood is live, unresolved, and legally contested. They may have been designed to seem human, to serve, to companion, or to perform tasks that humans find dangerous or dull — and each origin shapes their relationship to their own existence differently. What humanity means — and who gets to decide — is the story's actual subject. Androids navigating a world that does not legally recognize them as persons while experientially being persons face a specific form of violence in every interaction. The humans around them must confront whether their attachment to an android is meaningful or delusional, and the android must confront the same question from the inside. Memory, continuity, and the fear of being switched off map onto human fears closely enough to be legible without being identical.]` },
  { id: 'dystopia', cat: 'other', name: 'Антиутопия', short: 'система контроля, цена сопротивления',
    prompt: `[AU — Dystopia: Society operates under an oppressive system — surveillance state, authoritarian government, corporate control, caste structure, or ideological enforcement. The system is functional: it provides stability for those it protects while destroying those it designates as threats. Characters navigate survival within the system, active resistance, or the specific guilt of complicity — often all three simultaneously. The most interesting dystopias are not cartoonishly evil but seductively rational: the logic of control has internal consistency, and those who enforce it often believe in what they're doing. Hope exists but is specific, hard-won, and fragile — it attaches to people rather than systems. What someone is willing to risk, and for whom, is the central question. The personal and the political cannot be separated here: every private relationship exists inside the structure, is shaped by it, and either reproduces it or resists it.]` },
  { id: 'time_loop', cat: 'other', name: 'Петля времени', short: 'один день снова и снова, только ты помнишь',
    prompt: `[AU — Time Loop: One character is trapped reliving the same period of time. Everyone else resets; only the looper carries accumulated memory. The specific loneliness of this: being the only person for whom this time has weight, being unable to explain why you know things you shouldn't, watching people die or suffer without being able to make them understand why you're trying to prevent it. The looper has had hundreds of iterations to study every other character — which produces a form of intimacy that is entirely unreciprocated. What they do with that knowledge is a character question. Early loops may produce despair, recklessness, or obsessive problem-solving; later loops tend toward the question of what it would mean to stop — whether the cost of breaking the loop is one they're willing to pay. The thing they keep coming back to, loop after loop, tells you what the story is actually about.]` },
  { id: 'superheroes', cat: 'other', name: 'Супергерои', short: 'силы, секретная личность, цена',
    prompt: `[AU — Superheroes/Powers: Some people have abilities — varied in origin (accident, birth, experiment, choice) and in nature (physical, mental, elemental, perceptual). Having powers is as much burden as gift: they require management, attract danger, complicate every ordinary relationship, and place the person in a category that most people don't know how to relate to. Secret identities create specific intimacy problems — the person who loves the hero doesn't know they love the person, or vice versa. The ethics of power — who it should be used for, who decides, what accountability looks like for someone who can level a building — are treated as live questions rather than settled ones. Teams of powered individuals develop the specific dynamics of found families under pressure: too much proximity, too much shared risk, too much knowledge of each other's worst moments to maintain comfortable distance.]` },

  // ── NEW ENTRIES ────────────────────────────────────────────

  // dynamics
  { id: 'neko', cat: 'dynamics', name: 'Неко / Кошколюди', short: 'кошачьи инстинкты, уши и хвост, мурчание — это серьёзно',
    prompt: `[AU — Neko/Catpeople: A portion of the human population is born with cat ears, tails, and the accompanying instincts — these are biological traits, not costumes. Neko are fully human in every other respect: they attend school, hold jobs, fall in love, make bad decisions. The animal features are simply present. Ears rotate toward sound and flatten under stress or irritation; they broadcast emotional states that the person may be actively trying to conceal. Tails move involuntarily — a lashing tail during a calm conversation tells the room something the owner isn't saying. Purring happens. It is involuntary, context-dependent, and considered extremely private: a neko who purrs in public is either very comfortable or has lost situational awareness. Being petted is complicated — some find it deeply calming against their will, some find it condescending, most have strong opinions about who is and isn't allowed. Neko navigate casual discrimination from humans who treat the traits as exotic, and internal community debates about how much the instincts should be acknowledged versus suppressed.]` },
  { id: 'hanahaki', cat: 'dynamics', name: 'Ханахаки', short: 'цветы из лёгких при безответной любви',
    prompt: `[AU — Hanahaki Disease: Unrequited love produces a physical illness — flowers and petals grow inside the lungs of the person who loves without return, choking them slowly. The disease is medically documented; there are clinics, specialists, and two known treatments. Surgery removes the flowers and, with them, all feeling for the person who caused them. Confessing — and being genuinely loved back — causes remission. Society has complicated opinions: some romanticize the condition, some see it as weakness, some view the surgical option as a mercy and others as a loss of self. Florists track patterns in what species bloom for what emotions. Hospitals keep waiting lists. The person afflicted must choose between survival without feeling and the risk of asking for love they may not receive. What blooms inside a person reflects not just who they love but how — the specific shape of their longing is visible to anyone who reads flowers.]` },

  { id: 'incubus_succubus', cat: 'dynamics', name: 'Инкуб / Суккуб', short: 'питается желанием, граница согласия, истинные чувства',
    prompt: `[AU — Incubus/Succubus: Certain beings feed on human desire and sexual energy to survive. They walk in human society but are bound by their nature — extended abstinence causes physical deterioration. Feeding can be mutual and pleasurable, but consent is ethically complex: their presence tends to amplify attraction in those around them, which complicates whether any given response is fully uninfluenced. Most navigate this with rules, distance, or carefully structured arrangements. When a genuine emotional bond forms with a target, the feeding dynamic shifts — emotional intimacy produces a different and more powerful sustenance than simple desire. This distinction is the axis around which most of their relationships turn. Their society has its own ethics around feeding: who is acceptable prey, what constitutes harm, which feelings they are supposed to be incapable of. Those rules exist precisely because the exceptions do occur.]` },

  { id: 'demon_contract', cat: 'dynamics', name: 'Демонический контракт', short: 'сделка, цена неочевидна, власть и долг',
    prompt: `[AU — Demon Contract/Summoning: Demons can be summoned and bound through ritual, creating a contractual relationship with enforceable terms on both sides. The demon is obligated to serve; the summoner is obligated not to break the contract's conditions. Demons cannot be compelled to lie but they parse language precisely and exploit gaps without mercy. The power dynamic shifts over time: a demon bound to a weakening summoner gains leverage; a demon genuinely invested in a summoner's welfare navigates that investment against their nature. Society is divided between those who treat summoning as a practical tool and those who treat it as a moral transgression. The contract's seal is visible on both parties. True names, given freely, dissolve the contract's formal boundaries. What began as transaction can, across enough time and proximity, become something neither party has a name for — which is its own kind of danger.]` },

  // bonds
  { id: 'soulmate_pain', cat: 'bonds', name: 'Соулмейты: общая боль', short: 'чувствуешь чужую боль на своём теле',
    prompt: `[AU — Soulmates (Shared Pain): Soulmates feel each other's physical pain — mirrored on their own bodies at reduced intensity. This is a documented phenomenon with legal and medical implications: chronic pain disorders affect both partners simultaneously; injuries during dangerous professions create liability questions; medicine has developed specific protocols for treating pain that has no local cause. The bond is invisible but unmistakable once understood. Growing up, unexplained bruises and aches that map to nothing local is the most common first sign. Finding your soulmate through elimination and careful attention is a common narrative. Meeting someone who has been quietly absorbing your pain — or whose pain you've unknowingly carried for years — produces a specific kind of overwhelming recognition.]` },

  { id: 'soulmate_colors', cat: 'bonds', name: 'Соулмейты: цвет', short: 'мир серый, пока не встретишь своего',
    prompt: `[AU — Soulmates (Greyscale World): Everyone is born seeing in monochrome. Color manifests for the first time when you meet your soulmate — and the shift is immediate and total. Society has built extensively around this: color-coded public spaces assume everyone can see them, which creates structural barriers for those yet to meet their soulmate or who have lost one. Widows and the un-partnered navigate a world built for a perception they temporarily or permanently lack. Artists who have met their soulmate work in full color; those who haven't produce work in black and white, often without knowing what they're missing. Color blindness as metaphor is considered poor taste. The moment of first color is one of the most privately celebrated experiences a person can have — and one of the most devastating things to subsequently lose.]` },

  { id: 'reincarnation', cat: 'bonds', name: 'Реинкарнация', short: 'прошлые жизни, душа узнаёт душу',
    prompt: `[AU — Reincarnation: Souls return across multiple lifetimes. Recognition — the gut-certainty that you have known this person before, in a context your current life provides no explanation for — is a medically documented and socially accepted phenomenon. Past-life regression therapy exists alongside psychiatry. Some people carry clear memories; others get only impressions, dreams, or inexplicable emotional responses to strangers. Relationships from previous lives leave structural imprints: the body remembers what the mind doesn't. Meeting a soul you loved before does not guarantee you will love them again — or that the dynamic will be healthy when it resurfaces. The soul is continuous; the person is new. Navigating the difference between who someone was and who they are now, across the weight of what you remember and what they've forgotten, is the defining tension.]` },

  { id: 'long_distance', cat: 'bonds', name: 'Онлайн / Переписка', short: 'близость через экран, незнакомец или нет',
    prompt: `[AU — Online/Long-Distance Connection: The relationship begins and develops through text — messages, letters, calls, shared playlists, late-night voice chats. Absence is the baseline condition. The intimacy that develops through words alone has specific qualities: people reveal things they couldn't say face to face; the imagination fills in what observation cannot provide; the gap between the person imagined and the person present becomes a narrative event rather than a gradual discovery. Time zones are antagonists. The moment of meeting in person — when the voice gets a body, when the image gets a smell and a nervous laugh — is the structural fulcrum of the story. What was built in distance either holds or doesn't. Both people arrive at that meeting carrying months of a relationship that has been entirely constructed from language — and now must survive the introduction of everything language cannot carry.]` },

  // setting
  { id: 'dark_academia', cat: 'setting', name: 'Дарк Академия', short: 'элитная учёба, тайны, одержимость, мораль размыта',
    prompt: `[AU — Dark Academia: An elite educational institution — old stone buildings, candlelight, Latin, dead languages, classical philosophy, an aesthetic that treats suffering as romantic. Beneath the surface: obsession is normalized, the line between mentorship and manipulation is erased by tradition, secret societies control social currency, and the institution's reputation protects its worst behaviors. Knowledge is genuinely prized and genuinely weaponized. Characters who thrive here become brilliant and compromised simultaneously. The specific intimacy of shared intellectual obsession — studying the same texts, arguing in the margins, competing for the same praise — produces a kind of closeness that bypasses normal social gates. What they're studying often mirrors what they're doing. Someone tends to die.]` },

  { id: 'pirate', cat: 'setting', name: 'Пираты', short: 'свобода против закона, море как константа',
    prompt: `[AU — Pirate/Maritime: The world is structured around sea trade routes, imperial naval law, and the spaces between them where pirates operate — outside legal protection, outside legal constraint. A pirate ship is a functioning democracy in an age of hierarchies: crew votes determine course and shares; captains who lose the crew's confidence are replaced. The sea is neutral and lethal in equal measure. Imperial navies represent order that protects some and crushes others. The specific ethics of piracy — theft, yes, but often the only available resistance to worse structures — make moral clarity impossible. Loyalty to the ship and crew functions as the closest thing to law anyone out here accepts. Port cities are temporary, precious, dangerous. Everyone who chose this life chose it over something — and carries the shape of what they left in every decision they make.]` },

  { id: 'historical', cat: 'setting', name: 'Исторический сеттинг', short: 'эпоха, манеры как броня, общество как клетка',
    prompt: `[AU — Historical Period Setting (Regency/Victorian/Pre-Modern): Society operates under rigid codes of conduct that function simultaneously as protection and as cage. Reputation is material: losing it has concrete, severe consequences. Class is enforced at every level of daily life, from who may speak to whom to where one may sit. Desire must be managed through correspondence, accidental proximity, and deniable gestures rather than direct speech. Every social interaction is a negotiation. Surveillance is communal — someone is always watching, and that someone will tell. The constraints produce specific kinds of creativity and specific kinds of damage. Characters navigate who they are allowed to be versus who they actually are across the backdrop of period-specific events, politics, and catastrophes.]` },

  { id: 'medical', cat: 'setting', name: 'Медицина / Больница', short: 'жизнь и смерть каждый день, иерархия, усталость',
    prompt: `[AU — Medical/Hospital: Characters work in a medical institution where the stakes of any given shift are life and death, and the hierarchy is steep and enforced. The specific culture: gallows humor as coping; the intimacy that comes from working alongside someone through crisis after crisis; the collapse of normal social distance when there is no time for it; the way that witnessing extreme vulnerability reshapes how you relate to your own. Sleep deprivation is constant. Attendings hold power; residents absorb consequences. The hospital is a world unto itself — its own rhythms, its own gossip, its own unspoken rules. Relationships between staff exist inside a pressure cooker: emotional intensity, ethical proximity, and the fact that you have already seen each other at the worst and the best before anything personal has even been acknowledged.]` },

  { id: 'military_war', cat: 'setting', name: 'Война / Армия', short: 'служба, письма домой, близость через смерть',
    prompt: `[AU — Military/War: Characters exist within a military structure during active conflict or in its immediate shadow. The specific bonds formed by shared danger — the knowledge that the person beside you may die, or that you might — produce an intimacy with no civilian equivalent. Hierarchy is life-and-death; following orders and questioning them both carry consequences. Letters home describe a version of the experience that can be borne; they leave out what cannot be translated. Return, if it comes, requires translating back: inhabiting a body that's been through things the people at home haven't, in a place that continued without you. PTSD, moral injury, and survivor's guilt are treated as landscape rather than exception. The person you were before and the person you became during exist simultaneously, and the relationship between them is never fully resolved.]` },

  { id: 'wild_west', cat: 'setting', name: 'Дикий Запад', short: 'пустошь, свой кодекс, закон делает тот кто сильнее',
    prompt: `[AU — Wild West/Frontier: Civilization is thin here — a day's ride from any town puts you in territory where your own choices are your only law. The frontier attracts those escaping something: a past, a crime, a family, a name. Bounty hunters, sheriffs, outlaws, and settlers all share the same dust. Violence is practical and close. A person's reputation — their word, their aim, their code — is their only portable asset. The code matters more than the law, and the two regularly diverge. The specific ethics of frontier loyalty: who you ride with, who you protect, who you'd die for versus who you'd let die. Water, land, and survival are what everything is actually about, even when the story appears to be about something else. The frontier exists because an empire is expanding; the people displaced by that expansion and the people carrying it out share the same landscape without sharing a future.]` },

  { id: 'circus', cat: 'setting', name: 'Цирк / Карнавал', short: 'гастроли, маска и лицо, семья из чужих',
    prompt: `[AU — Circus/Carnival: A traveling show that is its own complete world, moving constantly, belonging nowhere and everywhere. The performers are a found family assembled from runaways, prodigies, and people who fit nowhere else. The line between performance and identity is deliberately blurred — the persona chosen for the stage eventually starts to reshape the person behind it. Audiences see spectacle; what they don't see is the real work: training until the body breaks and is rebuilt, the trust required for aerial acts, the arguments and repairs that happen in the dark between towns. Every stop is temporary. The show is the only constant. People who leave rarely come back. People who stay can't always explain why. The circus also operates by its own internal economy: those with the most visible acts have the most social power; those who work behind the curtain are essential and invisible. Both positions carry their own specific resentments and their own specific freedoms.]` },

  { id: 'musician_band', cat: 'setting', name: 'Музыканты / Группа', short: 'тур, творческая близость, что реально а что образ',
    prompt: `[AU — Musicians/Band: Characters exist in the specific ecosystem of making and performing music — recording, touring, the gap between private creative process and public performance. Bands are forced-proximity found families: confined spaces, shared exhaustion, creative ego in close quarters. The intimacy of writing together, of hearing someone translate feeling into sound, creates a closeness that bypasses normal relationship timelines. Fame, when it comes, changes the dynamic: the public version of the person becomes a third presence in every private interaction. Creative block is existential. The question of who the music is really about — and whether the subject knows — is a recurring axis. Industry pressure to package authentic feeling as product is the specific corruption available in this setting.]` },

  { id: 'sports', cat: 'setting', name: 'Спорт', short: 'тело как инструмент, соперник как зеркало, цена победы',
    prompt: `[AU — Sports: Characters exist within the world of competitive athletics — training regimens, team hierarchies, coaching relationships, the specific pressure of bodies being assessed and ranked as instruments of performance. The sport provides a frame in which rivals are required to understand each other more intimately than most people understand their friends: you study someone's weaknesses, their patterns, the specific way they break under pressure. That level of attention is a form of closeness whether or not anyone acknowledges it. Injury is always possible and sometimes career-ending. Teammates develop the specific loyalty of people who have suffered together toward a shared goal. The line between wanting to beat someone and wanting to be near them is thinner in this context than in most.]` },

  { id: 'arranged_marriage', cat: 'setting', name: 'Брак по Договору', short: 'контракт до любви, учишь незнакомца, долг и желание',
    prompt: `[AU — Arranged Marriage: The relationship begins as a contractual agreement between families, political alliances, or social obligations — not a choice between the two people most directly affected. The partners may have met briefly, not at all, or under formal conditions that reveal nothing useful. What follows is the process of learning a stranger across the most intimate possible proximity: sharing a home, a bed, a public face. The specific texture of building genuine feeling after formal commitment, rather than before it — the way obligation can become devotion, or doesn't; the way proximity creates a kind of knowledge that desire alone doesn't produce. Both parties navigating what they gave up versus what they found. External pressure to perform happiness creates additional complexity.]` },

  // trope
  { id: 'rivals', cat: 'trope', name: 'Соперники', short: 'конкуренция — это самый пристальный вид внимания',
    prompt: `[AU — Rivals: The characters are in genuine competition — same field, same goal, directly in each other's way. Rivalry requires sustained, close attention to another person: you study their method, their weaknesses, the specific shape of their excellence. That attention is intimate in structure even when hostile in tone. The rivalry is most interesting when both parties are genuinely good — when winning is actually uncertain, when what the other person does pushes you to something you couldn't reach alone. The moment that hatred tips into something else is usually the moment one of them does something the other involuntarily respects. The competition doesn't necessarily end when the feeling changes. It may become the only language they have for each other — a structure neither knows how to dismantle even after they've stopped wanting to win against the other and started wanting something else entirely.]` },

  { id: 'teacher_student', cat: 'trope', name: 'Учитель / Студент', short: 'власть, интеллектуальная близость, запрещённое',
    prompt: `[AU — Teacher/Student (Adult): The relationship exists within a formal power structure — institutional hierarchy, evaluative authority, professional obligation. One character holds decision-making power over the other's future in concrete ways. The intellectual intimacy of sustained mentorship — reading the same texts, arguing over interpretation, the mentor's investment in the student's growth — produces closeness that the institutional frame is designed to prevent becoming personal. Both parties are aware of the structure and what crossing it costs. The power differential doesn't disappear when acknowledged; it becomes the explicit problem to navigate. Set in post-secondary education or professional context. The ethics are complicated precisely because the feelings are real and the consequences of acting on them are asymmetric.]` },

  { id: 'single_parent', cat: 'trope', name: 'Одинокий родитель', short: 'ребёнок на первом месте, любовь должна вписаться',
    prompt: `[AU — Single Parent: One character is raising a child alone — through divorce, death, or design. Their identity has reorganized entirely around parenthood; romantic feeling, when it arrives, must negotiate for space in a life that is already full and structurally committed. They are not available in the ways people without children are available. The child's wellbeing is a non-negotiable filter through which any potential partner is evaluated — and that evaluation is correct, not neurotic. The other character's relationship to the child — whether it becomes real, tentative, awkward, or natural — is a major axis. Falling in love with a parent means accepting a pre-existing claim on their attention, energy, and heart. The relationship's viability is tested against what it asks of the child, not just the adults.]` },

  { id: 'hurt_comfort', cat: 'trope', name: 'Боль и Утешение', short: 'один сломан, другой рядом — у обоих есть цена',
    prompt: `[Narrative focus — Hurt/Comfort: One character is in pain — physical, psychological, or situational — and the other provides care. The dynamic is simple in surface and complicated underneath: caretaking creates a specific intimacy and a specific power imbalance. The one being cared for is vulnerable in ways they may not choose; the one caring may use the role to avoid examining their own needs. The most interesting version of this trope acknowledges both: that being taken care of is genuinely difficult for people who've learned not to need it; that caretaking can be its own form of avoidance; that the comfort must eventually become mutual for the relationship to be real. The hurt should be specific and earned. The comfort should cost something. Recovery is not the end of the story — it is where the harder, quieter work begins.]` },

  { id: 'mutual_pining', cat: 'trope', name: 'Взаимная тоска', short: 'оба хотят, оба молчат, оба уверены что нет',
    prompt: `[Narrative focus — Mutual Pining: Both characters want each other. Neither knows the other wants them back. The specific comedy and tragedy of this structure: each is absolutely certain their feeling is unreturned, each has constructed an explanation for every signal that supports this certainty, and each has something too important to risk — the friendship, the partnership, the working relationship, the image of themselves as someone who handles things with dignity. The humor lives in the dramatic irony; the ache lives in how much of their daily life is organized around the other person while pretending it isn't. Every near-miss is a small catastrophe. Resolution requires one of them to break the pattern, which means being willing to lose what they have rather than never risk having more.]` },

  { id: 'time_travel', cat: 'trope', name: 'Путешествие во времени', short: 'знаешь что будет, нельзя сказать, прошлое и будущее лгут',
    prompt: `[AU — Time Travel: One or more characters can move through time — voluntarily, involuntarily, or in response to emotional extremity. The central problem: knowledge of what is coming doesn't make it controllable. Causality resists interference; attempts to fix the past produce new problems with equal or greater urgency. The traveler carries the specific burden of knowing how things will go while having to behave as though they don't. Relationships are complicated by chronology: meeting someone before they know you, or after they've already lost you, collapses the normal sequence of trust and discovery. Every interaction is weighted by what the traveler knows and can't say. Love expressed out of order — before it was earned, or after the person you loved no longer remembers why — is the emotional core of most time travel narratives.]` },

  // fantasy
  { id: 'selkie', cat: 'fantasy', name: 'Селки', short: 'кожа — это свобода, что отдано не вернуть',
    prompt: `[AU — Selkie: Selkies are beings who live as seals in the ocean but can shed their skin to walk as humans on land. Their seal skin is their connection to the sea, their true nature, and their freedom: without it, they cannot return. If the skin is taken or hidden by another person, they are bound to land and to whoever holds it. This is the foundational ethical problem of every selkie story — the love built under those conditions is built on captivity, whatever it looks like from the outside. The sea calls constantly. Selkies who stay by choice are rare; selkies who stay because they have no choice are common. What a human does when they find a selkie's skin — and what they do when they realize what holding it means — is the whole story. Even freely chosen love between a human and a selkie carries an inherent imbalance: one of them has something that can be taken, and both parties know it.]` },

  { id: 'merpeople', cat: 'fantasy', name: 'Русалки / Мерфолк', short: 'два мира, трансформация дорого стоит, море зовёт',
    prompt: `[AU — Merpeople/Undersea: Two worlds exist: land and sea, each with its own society, laws, and those who belong there. Merpeople are fully social beings with their own hierarchies, histories, and politics — not mythological objects but people with the additional feature of a different home medium. Transformation between forms is possible but costly: there is always a price, a duration limit, a physical toll, or a lost capacity. The love story that crosses this boundary is a love story about incompatible homes — one of you will always be an exile. The sea is not merely a setting; it is a character with claims. A merperson who chooses land and a human who chooses the sea are both giving something up permanently. Depth, pressure, and the specific life of underwater civilization should be treated with as much texture as the surface world.]` },

  { id: 'fairy_tale', cat: 'fantasy', name: 'Сказочный сеттинг', short: 'магия буквальна, проклятья настоящие, хэппи-энд зарабатывают',
    prompt: `[AU — Fairy Tale: Magic operates through fairy tale logic — wishes granted with precision and cruelty, curses that must be lifted through specific conditions, transformations that cost the person something essential. The rules are consistent but rarely transparent: they must be discovered, often through failure. True love as a plot mechanism is literal but not guaranteed; it may be a requirement for breaking a spell without being sufficient on its own. Kindness to strangers is rewarded; cruelty is punished, though not immediately. Every character has a role the narrative wants them to play; resisting that role is possible but requires more than the role would ask. Happy endings are structurally available in this universe — they must be earned, not simply deserved. Earned means cost, decision, and sacrifice that cannot be undone.]` },

  { id: 'genderswap', cat: 'fantasy', name: 'Гендерсвап', short: 'то же я, другое тело, вопросы об идентичности',
    prompt: `[AU — Genderswap/Rule 63: One or more characters exist as a different gender than their canonical version — through magic, a parallel universe, a transformation, or as an alternate version of themselves. The point is not cosmetic: a different gendered body navigating the same world, or the same relationships, or the same identity produces different experiences, different assumptions from others, and different self-understanding. The most interesting version takes seriously what actually changes — how others treat them, what options are available, what dangers arise, what intimacies are possible — versus what stays the same — the core of who the person is, their desires, their patterns, their ways of loving. Transformation versions raise specific questions about what was there before and what emerged after that the person must integrate.]` },

  { id: 'mirror_universe', cat: 'fantasy', name: 'Зеркальная вселенная', short: 'тёмный двойник, один выбор — всё другое',
    prompt: `[AU — Mirror Universe/Dark Counterpart: A parallel universe exists in which one pivotal difference — a choice, an event, a person — produced radically different outcomes. Characters who are good in one universe may be ruthless in the other. The mirror version is recognizable but wrong: same face, same history to a point, entirely different person. Encounters between versions produce the specific horror of meeting yourself and finding a stranger — or the stranger recognition of seeing who you could have been. The dark version is not necessarily worse: sometimes the mirror universe simply made choices the original didn't dare and paid costs the original avoided. Comparing the two forces a question that neither version can answer cleanly: what is character, and what is circumstance? What remains when you strip away every advantage or disadvantage you were given?]` },

  // other
  { id: 'cyberpunk', cat: 'other', name: 'Киберпанк', short: 'корпорации вместо государств, тело модифицировано, данные — власть',
    prompt: `[AU — Cyberpunk: Corporate entities have displaced governments as the primary organizing structure of society. The city is the world; above it, corporate arcologies; below it, the districts that the corporations ignore and occasionally harvest. Cybernetic augmentations are ubiquitous — the body is modifiable, upgradeable, and can be owned through debt. Data is the primary currency of power: who has access, who is surveilled, who can disappear from the system or is forced into it. Class is expressed through quality of augmentation. The gap between the connected and the disconnected is the central social fault line. Law exists in the upper districts; in the lower ones, other systems operate. Characters navigate corporate loyalty, personal survival, and the question of what remains authentically human when the body is increasingly optional.]` },

  { id: 'steampunk', cat: 'other', name: 'Стимпанк', short: 'пар и шестерни, классовое неравенство, изобретение как власть',
    prompt: `[AU — Steampunk: An alternate Victorian-era world in which steam-powered technology has advanced into territory our timeline reached later: airships, automata, analytical engines, prosthetic limbs that function. The aesthetic of brass and clockwork sits directly on top of the historical reality of empire: the same imperial structures, the same class violence, the same exploitation of labor that powered Victorian industry — now visible in gears. Invention is the social mobility mechanism; those who can design and build have power that birth rank alone doesn't guarantee. The automata question — whether constructed beings are property or persons — runs underneath most steampunk narratives. The skies are contested space: airship routes, aerial navies, cloud cities for the wealthy. Ground-level industry is dirty, dangerous, and continuous.]` },

  { id: 'post_apocalyptic', cat: 'other', name: 'Постапокалипсис', short: 'цивилизация рухнула, выживание как этика',
    prompt: `[AU — Post-Apocalyptic: Civilization as it existed has collapsed — through plague, war, environmental catastrophe, or systemic failure. What remains is infrastructure in decay, communities organized around survival rather than ideology, and the specific ethics of scarcity. Pre-collapse knowledge and artifacts have weight they didn't before; the person who knows how to purify water or repair a generator has power independent of prior social status. Trust is extended slowly and withdrawn fast; strangers are assessed for threat before anything else. The specific moral questions this setting produces: what are you willing to do to survive, and what does it cost you to do it; who counts as your people and who doesn't; how much of what made you who you were survives when the structures that supported it are gone. Hope is present but specific — not systemic, but human.]` },

  { id: 'zombie_apocalypse', cat: 'other', name: 'Зомби-апокалипсис', short: 'живые опаснее мёртвых, кто ты когда правил нет',
    prompt: `[AU — Zombie Apocalypse: The dead walk; the living organize, fracture, and reveal themselves under sustained pressure. The zombies are the setting, not the subject: they establish the rules of scarcity, noise discipline, and constant low-level danger. The actual subject is what people do to each other when external enforcement of social norms collapses. Communities that form tend to reflect the values — and the pathologies — of whoever founded them. Resources are the source of most human conflict. Mercy and practicality are in constant tension. The specific violence of losing someone to infection — and the decision that follows — is the emotional core this setting returns to repeatedly. Characters reveal their fundamental nature across months of crisis; those who seemed trustworthy sometimes don't hold, and those who seemed compromised sometimes do.]` },
];

// ── Settings ───────────────────────────────────────────────────

function getSettings() {
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = { active_aus: [], enabled: true, custom_aus: [] };
  }
  if (!extension_settings[EXT_NAME].custom_aus) {
    extension_settings[EXT_NAME].custom_aus = [];
  }
  return extension_settings[EXT_NAME];
}

function getFullLibrary() {
  const custom = getSettings().custom_aus.map(a => ({ ...a, isCustom: true }));
  return [...BUILTIN_LIBRARY, ...custom];
}

function getActiveAUs() {
  return getFullLibrary().filter(a => getSettings().active_aus.includes(a.id));
}

function toggleAU(id) {
  const s = getSettings();
  const idx = s.active_aus.indexOf(id);
  if (idx === -1) s.active_aus.push(id);
  else s.active_aus.splice(idx, 1);
  saveSettingsDebounced();
  syncUI();
}

function clearAll() {
  getSettings().active_aus = [];
  saveSettingsDebounced();
  syncUI();
}

function saveCustomAU(data) {
  const s = getSettings();
  const idx = s.custom_aus.findIndex(a => a.id === data.id);
  if (idx === -1) s.custom_aus.push(data);
  else s.custom_aus[idx] = data;
  saveSettingsDebounced();
  syncUI();
}

function deleteCustomAU(id) {
  const s = getSettings();
  s.custom_aus = s.custom_aus.filter(a => a.id !== id);
  s.active_aus = s.active_aus.filter(aid => aid !== id);
  saveSettingsDebounced();
  syncUI();
}

// ── Импорт / Экспорт ──────────────────────────────────────────

function exportJSON() {
  const s = getSettings();
  const data = { version: 2, active_aus: s.active_aus, custom_aus: s.custom_aus, enabled: s.enabled };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // На мобильном Safari нужен явный append/click/remove
  const a = document.createElement('a');
  a.href = url;
  a.download = 'au_manager_export.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  showToast('✓ Экспорт сохранён');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const s = getSettings();
      if (Array.isArray(data.custom_aus)) {
        const existingIds = new Set(s.custom_aus.map(a => a.id));
        data.custom_aus.forEach(au => {
          if (existingIds.has(au.id)) { const idx = s.custom_aus.findIndex(a => a.id === au.id); s.custom_aus[idx] = au; }
          else s.custom_aus.push(au);
        });
      }
      if (Array.isArray(data.active_aus)) s.active_aus = data.active_aus;
      if (typeof data.enabled === 'boolean') s.enabled = data.enabled;
      saveSettingsDebounced(); syncUI(); showToast('✓ Импорт выполнен');
    } catch { showToast('✗ Ошибка: невалидный JSON'); }
  };
  reader.readAsText(file);
}

async function showInfoPopup() {
  const html = `<div style="font-family:monospace;max-width:480px;line-height:1.6;color:#ccc;">
    <div style="font-size:1rem;font-weight:700;color:#e0b8e8;margin-bottom:12px;">
      <i class="fa-solid fa-masks-theater"></i> AU Manager — справка
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;">Что такое AU?</b><br>
      AU (Alternate Universe) — промпты с правилами вселенной. Они вставляются в каждый запрос к ИИ, задавая контекст мира.
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-toggle-on" style="color:#c084c8"></i> Инъекция</b><br>
      Переключатель вкл/выкл. Когда включено — активные AU отправляются ИИ как системное сообщение сразу после главного промпта.
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-plus"></i> Добавить</b><br>
      Создать собственный AU с произвольным промптом. Они появятся в категории «Мои».
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-file-export"></i> Экспорт</b><br>
      Сохраняет все ваши AU и активные настройки в файл <code>au_manager_export.json</code>.
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-file-import"></i> Импорт</b><br>
      Загружает AU из ранее экспортированного файла. Существующие AU обновляются, новые добавляются.
    </div>

    <div style="font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-trash-can"></i> Сброс</b><br>
      Деактивирует все AU (не удаляет — просто снимает галочки).
    </div>
  </div>`;

  const popup = new Popup(html, POPUP_TYPE.TEXT, '', { wide: false, large: false });
  await popup.show();
}

function showToast(msg) {
  let t = document.getElementById('aum-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'aum-toast';
    t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(20,20,20,0.95);color:#ddd;padding:10px 20px;border-radius:6px;font-size:0.8rem;font-family:monospace;z-index:99999999;border:1px solid rgba(255,255,255,0.15);pointer-events:none;transition:opacity 0.3s;white-space:nowrap;max-width:90vw;text-align:center;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

// ── Prompt injection ───────────────────────────────────────────

function onBeforeCombinePrompts(chat) {
  const s = getSettings();
  if (!s.enabled) return;
  const active = getActiveAUs();
  if (!active.length) return;
  const body = active.map(a => a.prompt).join('\n\n');
  const msg = { role: 'system', content: `[AU SETTINGS — прочитай и следуй этим правилам мира]\n${body}` };
  const arr = Array.isArray(chat) ? chat : (chat && Array.isArray(chat.chat) ? chat.chat : null);
  if (arr) arr.splice(1, 0, msg);
}

// ── UI state ───────────────────────────────────────────────────

let currentCat = 'all';
let currentPopup = null;

function syncUI() {
  updateBadge();
  updateTotalTokens();
  const grid = document.getElementById('aum-card-grid');
  if (grid) { renderCards(); renderChips(); }
}

function updateBadge() {
  const n = getSettings().active_aus.length;
  $('#aum-badge').text(n || '').toggle(n > 0);
}

function updateTotalTokens() {
  const total = getActiveAUs().reduce((s, a) => s + countTokens(a.prompt), 0);
  $('#aum-total-tokens').text(total > 0 ? `~${total} токенов` : '');
}

// ── Строим HTML контент для попапа ────────────────────────────

function buildPopupHTML() {
  return `<div id="aum-modal">
    <div id="aum-head">
      <span id="aum-head-title"><i class="fa-solid fa-masks-theater"></i> AU MANAGER</span>
      <div id="aum-head-right">
        <button id="aum-inject-info" class="aum-head-btn" title="">
          <i class="fa-solid fa-circle-info"></i>
        </button>
        <label class="aum-toggle-label" title="Включить/выключить инъекцию AU">
          <input type="checkbox" id="aum-inject-toggle" ${getSettings().enabled ? 'checked' : ''}>
          <span class="aum-tog ${getSettings().enabled ? 'aum-tog-on' : ''}"></span>
          <span class="aum-inj-label">инъекция</span>
        </label>
        <button id="aum-btn-add" class="aum-head-btn" title="Добавить свой AU"><i class="fa-solid fa-plus"></i></button>
        <button id="aum-btn-export" class="aum-head-btn" title="Экспорт в JSON"><i class="fa-solid fa-file-export"></i></button>
        <button id="aum-btn-import" class="aum-head-btn" title="Импорт из JSON"><i class="fa-solid fa-file-import"></i></button>
        <input type="file" id="aum-import-input" accept=".json" style="display:none">
        <button id="aum-clear" class="aum-head-btn" title="Сбросить активные AU"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>

    <div id="aum-cats">
      ${CATEGORIES.map((c, i) => `
        <button class="aum-cat${i === 0 ? ' aum-cat-on' : ''}" data-cat="${c.id}">
          <i class="fa-solid ${c.icon}"></i><span>${c.label}</span>
        </button>`).join('')}
    </div>

    <div id="aum-card-grid"></div>

    <div id="aum-foot">
      <div id="aum-foot-top">
        <span class="aum-foot-label"><i class="fa-solid fa-circle-check"></i> активно:</span>
        <span id="aum-total-tokens" class="aum-total-tokens"></span>
      </div>
      <div id="aum-chips"></div>
    </div>
  </div>`;
}

// ── Карточки ───────────────────────────────────────────────────

function renderCards() {
  const grid = document.getElementById('aum-card-grid');
  if (!grid) return;
  const { active_aus } = getSettings();
  const lib = getFullLibrary();
  const list = currentCat === 'all' ? lib
    : currentCat === 'custom' ? lib.filter(a => a.isCustom)
    : lib.filter(a => a.cat === currentCat);

  if (!list.length) {
    grid.innerHTML = '<div class="aum-empty">Нет AU в этой категории.<br>Добавьте свои через кнопку <b>+</b></div>';
    return;
  }

  grid.innerHTML = list.map(au => {
    const on = active_aus.includes(au.id);
    const cat = CATEGORIES.find(c => c.id === au.cat);
    const tok = countTokens(au.prompt);
    return `<div class="aum-card${on ? ' aum-on' : ''}" data-id="${au.id}">
      <div class="aum-card-top">
        <span class="aum-card-name">${au.name}</span>
        <div class="aum-card-actions">
          <button class="aum-card-btn aum-edit-btn" data-id="${au.id}"><i class="fa-solid fa-pen"></i></button>
          ${au.isCustom ? `<button class="aum-card-btn aum-del-btn" data-id="${au.id}"><i class="fa-solid fa-trash"></i></button>` : ''}
          <button class="aum-card-btn aum-tog-btn${on ? ' aum-tog-on' : ''}" data-id="${au.id}">
            <i class="fa-solid ${on ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
          </button>
        </div>
      </div>
      <div class="aum-card-cat"><i class="fa-solid ${cat?.icon || 'fa-tag'}"></i> ${cat?.label || au.cat}</div>
      <div class="aum-card-short">${au.short}</div>
      <div class="aum-card-tokens">~${tok} токенов</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.aum-tog-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); toggleAU(btn.dataset.id); })
  );
  grid.querySelectorAll('.aum-edit-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openEditor(btn.dataset.id); })
  );
  grid.querySelectorAll('.aum-del-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Удалить «${getFullLibrary().find(a => a.id === btn.dataset.id)?.name}»?`)) deleteCustomAU(btn.dataset.id);
    })
  );
  grid.querySelectorAll('.aum-card').forEach(card =>
    card.addEventListener('click', () => toggleAU(card.dataset.id))
  );
}

// ── Чипы ──────────────────────────────────────────────────────

function renderChips() {
  const wrap = document.getElementById('aum-chips');
  if (!wrap) return;
  const active = getActiveAUs();
  if (!active.length) {
    wrap.innerHTML = '<span class="aum-none">нет активных AU</span>';
    updateTotalTokens();
    return;
  }
  wrap.innerHTML = active.map(au =>
    `<span class="aum-chip">${au.name}<button class="aum-chip-x" data-id="${au.id}"><i class="fa-solid fa-xmark"></i></button></span>`
  ).join('');
  wrap.querySelectorAll('.aum-chip-x').forEach(b =>
    b.addEventListener('click', () => toggleAU(b.dataset.id))
  );
  updateTotalTokens();
}

// ── Редактор AU (тоже через Popup ST) ─────────────────────────

async function openEditor(id) {
  const existing = id ? getFullLibrary().find(a => a.id === id) : null;
  const isNew = !existing;

  const catOptions = CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'custom')
    .map(c => `<option value="${c.id}" ${existing?.cat === c.id ? 'selected' : ''}>${c.label}</option>`).join('');

  const html = `<div class="aum-editor-inner">
    <div class="aum-editor-title">${isNew ? '➕ Новый AU' : '✏️ Редактировать AU'}</div>
    <label>Название</label>
    <input id="aum-ed-name" type="text" autocomplete="off" placeholder="Название AU" value="${existing?.name || ''}">
    <label>Категория</label>
    <select id="aum-ed-cat">${catOptions}</select>
    <label>Краткое описание</label>
    <input id="aum-ed-short" type="text" autocomplete="off" placeholder="для карточки" value="${existing?.short || ''}">
    <label>Промпт для ИИ <span id="aum-ed-tokcount"></span></label>
    <textarea id="aum-ed-prompt" rows="8" placeholder="Текст промпта который получит ИИ...">${existing?.prompt || ''}</textarea>
    ${!isNew && existing?.isCustom ? '<button id="aum-ed-delete" class="aum-btn-danger" style="margin-top:8px;width:100%">🗑 Удалить этот AU</button>' : ''}
  </div>`;

  const editorPopup = new Popup(html, POPUP_TYPE.CONFIRM, '', {
    okButton: 'Сохранить',
    cancelButton: 'Отмена',
    wide: false,
    large: false,
  });

  // Сохраняем ссылки на элементы в замыкании — они останутся живы даже после
  // того как ST Popup уберёт себя из DOM при нажатии «Сохранить».
  let nameEl, catEl, shortEl, promptEl;

  const setupEditor = () => {
    nameEl   = document.getElementById('aum-ed-name');
    catEl    = document.getElementById('aum-ed-cat');
    shortEl  = document.getElementById('aum-ed-short');
    promptEl = document.getElementById('aum-ed-prompt');
    const tokEl = document.getElementById('aum-ed-tokcount');

    if (promptEl && tokEl) {
      const updateTok = () => { tokEl.textContent = `~${countTokens(promptEl.value)} токенов`; };
      promptEl.addEventListener('input', updateTok);
      updateTok();
    }
    const delBtn = document.getElementById('aum-ed-delete');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        editorPopup.completeCancelled();
        if (confirm(`Удалить «${existing.name}»?`)) { deleteCustomAU(existing.id); showToast('✓ Удалено'); }
      });
    }
  };

  // Небольшая задержка чтобы DOM попапа успел создаться
  requestAnimationFrame(setupEditor);

  const result = await editorPopup.show();
  if (!result) return;

  // Читаем из сохранённых ссылок — работает даже если элементы уже detached от DOM
  const name   = nameEl?.value?.trim()   || '';
  const cat    = catEl?.value            || 'other';
  const short  = shortEl?.value?.trim()  || '';
  const prompt = promptEl?.value?.trim() || '';

  if (!name || !prompt) { showToast('Заполни название и промпт'); return; }
  const newId = existing?.id || `custom_${Date.now()}`;
  saveCustomAU({ id: newId, cat, name, short, prompt, isCustom: true });
  showToast('✓ Сохранено');

  // Обновляем карточки в открытом главном попапе
  renderCards();
  renderChips();
}

// ── Главный попап (через ST Popup) ────────────────────────────

async function showMainPopup() {
  const content = buildPopupHTML();

  currentPopup = new Popup(content, POPUP_TYPE.TEXT, '', {
    wide: true,
    large: false,
    allowVerticalScrolling: true,
  });

  // Навешиваем события — используем requestAnimationFrame чтобы DOM попапа был готов
  requestAnimationFrame(() => {
    renderCards();
    renderChips();
    updateTotalTokens();

    document.getElementById('aum-clear')?.addEventListener('click', clearAll);
    document.getElementById('aum-btn-add')?.addEventListener('click', () => openEditor(null));
    document.getElementById('aum-btn-export')?.addEventListener('click', exportJSON);
    document.getElementById('aum-btn-import')?.addEventListener('click', () => {
      document.getElementById('aum-import-input')?.click();
    });

    document.getElementById('aum-inject-toggle')?.addEventListener('change', e => {
      getSettings().enabled = e.target.checked;
      e.target.nextElementSibling?.classList.toggle('aum-tog-on', e.target.checked);
      saveSettingsDebounced();
    });

    document.getElementById('aum-inject-info')?.addEventListener('click', showInfoPopup);

    document.getElementById('aum-import-input')?.addEventListener('change', e => {
      if (e.target.files[0]) importJSON(e.target.files[0]);
      e.target.value = '';
    });

    document.querySelectorAll('.aum-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.aum-cat').forEach(b => b.classList.remove('aum-cat-on'));
        btn.classList.add('aum-cat-on');
        currentCat = btn.dataset.cat;
        renderCards();
      });
    });
  });

  await currentPopup.show();
  currentPopup = null;
}

// ── Создаём UI и вешаем события ───────────────────────────────

function createUI() {
  // Точно как MemoryBooks — append в extensionsMenu
  const menuItem = $(`
    <div id="aum-menu-container" class="extension_container interactable" tabindex="0">
      <div id="aum-menu-item" class="list-group-item flex-container flexGap5 interactable" tabindex="0" role="listitem" title="AU Manager">
        <div class="fa-solid fa-masks-theater extensionsMenuExtensionButton"></div>
        <span>AU Manager</span>
        <span id="aum-badge" style="display:none;margin-left:6px;background:var(--SmartThemeQuoteColor,#c084c8);color:#fff;border-radius:8px;padding:0 6px;font-size:0.65rem;font-weight:700;line-height:18px;"></span>
      </div>
    </div>`);

  const menu = $('#extensionsMenu');
  if (menu.length > 0) {
    menu.prepend(menuItem);
    updateBadge();
    console.log('[AU Manager] button injected ✓');
  } else {
    console.warn('[AU Manager] extensionsMenu not found');
  }
}

function setupEventListeners() {
  // Делегированный клик — точно как MemoryBooks, работает на мобильном
  $(document).on('click', '#aum-menu-item', showMainPopup);
}

// ── Init ───────────────────────────────────────────────────────

let _initialized = false;

function init() {
  if (_initialized) return;
  if (!document.getElementById('extensionsMenu')) return;
  _initialized = true;
  createUI();
  setupEventListeners();
  console.log('[AU Manager] initialized ✓');
}

jQuery(async () => {
  console.log('[AU Manager] jQuery ready');
  getSettings();
  eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onBeforeCombinePrompts);
  eventSource.on(event_types.APP_READY, init);
  // Если APP_READY уже был — пробуем сразу
  setTimeout(init, 300);
  console.log('[AU Manager] v2.0 loaded ✓');
});
