// Field family mappings — 58 entries (CORE IP — server-side only in production)
export const FIELD_FAMILIES = {
  // ══════ 1. FINANCE, ACCOUNTING & ECONOMICS FAMILY ══════
  "finance": {
    core:["finance","accounting","economics","statistics","actuarial science","banking","public finance"],
    related:["business administration","financial engineering","mathematics","cooperative management","insurance","commerce"],
    conditional:["sociology","arts","education","agriculture","engineering","computer science","any"],
    conditional_quals:["cpa_k","acca","cfa","cia"]
  },
  "accounting": {
    core:["accounting","finance","economics","statistics","actuarial science"],
    related:["business administration","financial engineering","mathematics","cooperative management","banking","insurance","commerce"],
    conditional:["sociology","arts","education","agriculture","engineering","computer science","any"],
    conditional_quals:["cpa_k","acca"]
  },
  "economics": {
    core:["economics","statistics","finance","actuarial science"],
    related:["commerce","business administration","banking","cooperative management","mathematics"],
    conditional:[],
    conditional_quals:[]
  },
  "statistics": {
    core:["statistics","mathematics","economics","actuarial science","data science","biostatistics"],
    related:["finance","computer science","information technology"],
    conditional:[],
    conditional_quals:[]
  },
  "actuarial science": {
    core:["actuarial science","statistics","mathematics","economics","finance"],
    related:["commerce","insurance","data science"],
    conditional:[],
    conditional_quals:[]
  },

  // ══════ 2. LAW & GOVERNANCE FAMILY ══════
  "law": {
    core:["law","llb"],
    related:[],
    conditional:[],
    conditional_quals:[]
  },
  "governance": {
    core:["law","governance","political science","public administration"],
    related:["international relations","conflict resolution","criminology","public policy"],
    conditional:["any"],
    conditional_quals:["cps"]
  },

  // ══════ 3. HUMAN RESOURCE MANAGEMENT FAMILY ══════
  "human resource management": {
    core:["human resource management","human resources","industrial relations"],
    related:["public administration","social sciences","sociology","psychology","industrial psychology","business administration","labour studies","commerce","education"],
    conditional:["any"],
    conditional_quals:["chrp","cipd"]
  },

  // ══════ 4. PUBLIC ADMINISTRATION & MANAGEMENT FAMILY ══════
  "public administration": {
    core:["public administration","business administration","governance","political science","leadership"],
    related:["social sciences","sociology","anthropology","economics","commerce","international relations","development studies","project management","human resource management","law","community development","secretarial studies","planning"],
    conditional:[],
    conditional_quals:[]
  },
  "business administration": {
    core:["business administration","commerce","public administration","management","governance","business management"],
    related:["economics","finance","human resource management","marketing","supply chain management","project management"],
    conditional:[],
    conditional_quals:[]
  },
  "management": {
    core:["management","business administration","public administration","commerce","strategic management"],
    related:["economics","finance","human resource management","project management"],
    conditional:[],
    conditional_quals:[]
  },

  // ══════ 5. COMMUNICATIONS, PR & MEDIA FAMILY ══════
  "communications": {
    core:["communications","mass communication","journalism","public relations","media studies","film studies"],
    related:["marketing","international relations","english","literature","linguistics","social sciences","event management","graphic design","visual communication"],
    conditional:["any"],
    conditional_quals:[]
  },
  "journalism": {
    core:["journalism","mass communication","communications","media studies"],
    related:["public relations","english","literature","marketing"],
    conditional:[],
    conditional_quals:[]
  },
  "public relations": {
    core:["public relations","communications","mass communication","media studies"],
    related:["marketing","journalism","international relations","event management"],
    conditional:[],
    conditional_quals:[]
  },

  // ══════ 6. SUPPLY CHAIN MANAGEMENT & PROCUREMENT FAMILY ══════
  "supply chain management": {
    core:["supply chain management","procurement","logistics","purchasing"],
    related:["commerce","business administration","economics","accounting","cooperative management"],
    conditional:["any"],
    conditional_quals:["cips","cpsp_k"]
  },
  "procurement": {
    core:["procurement","supply chain management","logistics","purchasing"],
    related:["commerce","business administration","economics","accounting"],
    conditional:["any"],
    conditional_quals:["cips","cpsp_k"]
  },

  // ══════ 7. ICT FAMILY ══════
  "computer science": {
    core:["computer science","information technology","software engineering","information systems","informatics","computer engineering","cyber security","data science"],
    related:["mathematics","electrical engineering","telecommunications engineering","library science","management information systems"],
    conditional:["any"],
    conditional_quals:["ccna","itil"]
  },
  "information technology": {
    core:["information technology","computer science","software engineering","information systems","informatics","computer engineering","cyber security","data science"],
    related:["mathematics","electrical engineering","telecommunications engineering","library science"],
    conditional:["any"],
    conditional_quals:["ccna","itil"]
  },
  "software engineering": {
    core:["software engineering","computer science","information technology","information systems","computer engineering"],
    related:["mathematics","data science","electrical engineering"],
    conditional:[],
    conditional_quals:[]
  },
  "data science": {
    core:["data science","statistics","computer science","information technology","mathematics"],
    related:["economics","actuarial science","information systems"],
    conditional:[],
    conditional_quals:[]
  },
  "information systems": {
    core:["information systems","information technology","computer science","software engineering","business information technology"],
    related:["management information systems","data science","library science"],
    conditional:[],
    conditional_quals:[]
  },
  "ict": {
    core:["information technology","computer science","software engineering","information systems","ict","data science","cyber security"],
    related:["mathematics","electrical engineering","telecommunications engineering"],
    conditional:["any"],
    conditional_quals:["ccna","itil"]
  },

  // ══════ 8. HEALTH FAMILY (STRICT — no cross-cadre matching) ══════
  "nursing": { core:["nursing","midwifery"], related:[], conditional:[], conditional_quals:[] },
  "pharmacy": { core:["pharmacy","pharmaceutical sciences"], related:[], conditional:[], conditional_quals:[] },
  "medicine": { core:["medicine","surgery"], related:[], conditional:[], conditional_quals:[] },
  "clinical medicine": { core:["clinical medicine"], related:[], conditional:[], conditional_quals:[] },
  "medical laboratory": { core:["medical laboratory sciences","medical laboratory technology"], related:[], conditional:[], conditional_quals:[] },
  "public health": {
    core:["public health","community health","environmental health","epidemiology"],
    related:["health management","health sciences","nutrition"],
    conditional:[],
    conditional_quals:[]
  },
  "nutrition": { core:["nutrition","food science","dietetics"], related:["public health","biochemistry"], conditional:[], conditional_quals:[] },

  // ══════ 9. ENGINEERING & TECHNICAL FAMILY (STRICT within discipline) ══════
  "civil engineering": {
    core:["civil engineering","structural engineering"],
    related:["construction management","building technology","civil and structural engineering"],
    conditional:[],
    conditional_quals:[]
  },
  "mechanical engineering": {
    core:["mechanical engineering"],
    related:["mechatronic engineering","industrial engineering"],
    conditional:[],
    conditional_quals:[]
  },
  "electrical engineering": {
    core:["electrical engineering","electronics","electrical and electronic engineering","electrical and electronics engineering"],
    related:["telecommunications engineering","mechatronic engineering"],
    conditional:[],
    conditional_quals:[]
  },
  "architecture": {
    core:["architecture"],
    related:["urban planning","town planning","landscape architecture"],
    conditional:[],
    conditional_quals:[]
  },
  "quantity surveying": {
    core:["quantity surveying"],
    related:["construction management","building economics"],
    conditional:[],
    conditional_quals:[]
  },
  "engineering": {
    core:["civil engineering","mechanical engineering","electrical engineering","structural engineering","chemical engineering","water engineering","environmental engineering"],
    related:["construction management","building technology"],
    conditional:[],
    conditional_quals:[]
  },
  "technology": {
    core:["civil engineering","mechanical engineering","electrical engineering","engineering"],
    related:["construction management"],
    conditional:[],
    conditional_quals:[]
  },

  // ══════ 10. EDUCATION FAMILY ══════
  "education": {
    core:["education","educational management","curriculum development"],
    related:[],
    conditional:["any"],
    conditional_quals:[]
  },

  // ══════ 11. AGRICULTURE, LIVESTOCK & ENVIRONMENT FAMILY ══════
  "agriculture": {
    core:["agriculture","agricultural economics","horticulture","crop science","animal science","agronomy","agribusiness"],
    related:["environmental science","botany","zoology","soil science","food science","geography"],
    conditional:[],
    conditional_quals:[]
  },
  "environmental science": {
    core:["environmental science","natural resource management","conservation biology","environmental studies"],
    related:["agriculture","geography","botany","zoology","forestry"],
    conditional:[],
    conditional_quals:[]
  },
  "veterinary": { core:["veterinary medicine","veterinary science"], related:["animal science"], conditional:[], conditional_quals:[] },
  "forestry": { core:["forestry"], related:["environmental science","natural resource management"], conditional:[], conditional_quals:[] },

  // ══════ 12. SOCIAL SCIENCES & DEVELOPMENT FAMILY ══════
  "social work": {
    core:["social work","sociology","community development","gender studies","development studies","anthropology","social sciences"],
    related:["psychology","political science","public administration","education","criminology","economics","project management","social policy"],
    conditional:[],
    conditional_quals:[]
  },
  "sociology": {
    core:["sociology","social work","community development","social sciences","anthropology"],
    related:["psychology","development studies","political science","public administration","criminology","gender studies"],
    conditional:["any"],
    conditional_quals:["cpa_k","acca"]
  },
  "development studies": {
    core:["development studies","community development","social sciences","sociology"],
    related:["economics","political science","public administration","project management","gender studies","international relations"],
    conditional:[],
    conditional_quals:[]
  },
  "counselling": {
    core:["counselling psychology","psychology","counselling"],
    related:["social work","sociology","education"],
    conditional:[],
    conditional_quals:[]
  },
  "political science": {
    core:["political science","governance","international relations","public policy","international affairs"],
    related:["public administration","law","development studies","sociology","conflict resolution"],
    conditional:[],
    conditional_quals:[]
  },
  "gender": {
    core:["gender studies","gender","development studies","social sciences"],
    related:["sociology","community development","public administration","psychology"],
    conditional:[],
    conditional_quals:[]
  },

  // ══════ ADDITIONAL FAMILIES (from Margaret Section 7) ══════
  "marketing": {
    core:["marketing","sales","commerce"],
    related:["business administration","communications","public relations","hospitality","event management","international business"],
    conditional:[],
    conditional_quals:[]
  },
  "library science": {
    core:["library science","information science","records management","archives"],
    related:["information technology","communications"],
    conditional:[],
    conditional_quals:[]
  },
  "hospitality": {
    core:["hospitality","tourism","hotel management","travel","tour operations","hospitality & tourism"],
    related:["event management","marketing","business administration","food science"],
    conditional:[],
    conditional_quals:[]
  },
  "hospitality & tourism": {
    core:["hospitality","tourism","hotel management","travel","tour operations","hospitality & tourism"],
    related:["event management","marketing","business administration","food science"],
    conditional:[],
    conditional_quals:[]
  },
  "criminology": {
    core:["criminology","security studies","forensic science","security management"],
    related:["political science","sociology","law","public administration","psychology"],
    conditional:[],
    conditional_quals:[]
  },
  "project management": {
    core:["project management","project planning","monitoring and evaluation","m&e","project planning and management"],
    related:["development studies","economics","public administration","business administration","commerce","sociology"],
    conditional:["any"],
    conditional_quals:["pmp","prince2"]
  },
  "commerce": {
    core:["commerce","business administration","accounting","finance","economics"],
    related:["marketing","supply chain management","human resource management","insurance","banking","statistics"],
    conditional:[],
    conditional_quals:[]
  },
  "strategic management": {
    core:["strategic management","management","business administration","public administration"],
    related:["economics","finance","commerce","project management","governance"],
    conditional:[],
    conditional_quals:[]
  },
  "mathematics": {
    core:["mathematics","statistics","actuarial science"],
    related:["economics","computer science","data science","finance","physics"],
    conditional:[],
    conditional_quals:[]
  },
  "banking": {
    core:["banking","finance","commerce","economics"],
    related:["business administration","accounting","insurance","actuarial science"],
    conditional:[],
    conditional_quals:[]
  },
  "media studies": {
    core:["media studies","mass communication","communications","journalism","film studies"],
    related:["public relations","marketing","english","literature"],
    conditional:[],
    conditional_quals:[]
  },
}

export const QUAL_EQUIVALENCES = {
  "cpa_k": ["acca","cfa"], "acca": ["cpa_k"], "cfa": ["cpa_k"],
  "cpa_ii": ["cpa_k","acca"],
  "cia": [], "cisa": [],
  "pmp": ["prince2"], "prince2": ["pmp"],
  "cips": ["cpsp_k"], "cpsp_k": ["cips"],
  "chrp": ["cipd"], "cipd": ["chrp"],
  "cim": [], "cps": [], "advocate": [],
  "ccna": [], "itil": [],
}

export const RELATED_FIELDS = {}
