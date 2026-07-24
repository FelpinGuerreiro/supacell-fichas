export const ATTRIBUTES = [
  { id: "for", label: "Força", short: "FOR" },
  { id: "agi", label: "Agilidade", short: "AGI" },
  { id: "vig", label: "Vigor", short: "VIG" },
  { id: "int", label: "Intelecto", short: "INT" },
  { id: "pre", label: "Presença", short: "PRE" },
  { id: "ins", label: "Instinto", short: "INS" },
] as const;

export type AttributeId = (typeof ATTRIBUTES)[number]["id"];
export type ClassId = "vanguarda" | "operador" | "especialista" | "influente";

export const ATTRIBUTE_MATRIX = [14, 13, 12, 11, 10, 8] as const;

export const CLASSES = {
  vanguarda: {
    id: "vanguarda" as const,
    name: "Vanguarda",
    tag: "Linha de frente",
    description: "Resistência, proteção e domínio corporal do confronto.",
    accent: "#ff4f40",
    initialSkills: 3,
    initial: { pv: 14, pe: 8, pa: 2 },
    growth: { pv: 6, pe: 4, pa: 1 },
    passive: {
      name: "Linha de Frente",
      description:
        "Inimigos próximos têm desvantagem para atacar seus aliados enquanto você estiver consciente.",
    },
  },
  operador: {
    id: "operador" as const,
    name: "Operador",
    tag: "Precisão tática",
    description: "Mobilidade, equipamentos, precisão e controle de terreno.",
    accent: "#32a8ff",
    initialSkills: 4,
    initial: { pv: 12, pe: 6, pa: 4 },
    growth: { pv: 5, pe: 3, pa: 2 },
    passive: {
      name: "Ritmo Tático",
      description:
        "Após um acerto ou teste de Agilidade bem-sucedido, reposicione-se sem gastar ação ou PE.",
    },
  },
  especialista: {
    id: "especialista" as const,
    name: "Especialista",
    tag: "Conhecimento aplicado",
    description: "Investigação, medicina, tecnologia e preparação científica.",
    accent: "#36d278",
    initialSkills: 6,
    initial: { pv: 10, pe: 4, pa: 6 },
    growth: { pv: 4, pe: 2, pa: 3 },
    passive: {
      name: "Campo de Especialidade",
      description:
        "Duas perícias de Intelecto treinadas recebem +2 permanente, mesmo quando seu grau aumenta.",
    },
  },
  influente: {
    id: "influente" as const,
    name: "Influente",
    tag: "Presença social",
    description: "Liderança, reputação, contatos e mobilização de pessoas.",
    accent: "#b06cff",
    initialSkills: 7,
    initial: { pv: 8, pe: 2, pa: 8 },
    growth: { pv: 3, pe: 1, pa: 4 },
    passive: {
      name: "Liderança Natural",
      description:
        "A ação Ajudar funciona a distância e também concede +1d4 ao teste do aliado.",
    },
  },
} as const;

export const ORIGINS = [
  {
    id: "entregador-urbano",
    name: "Entregador Urbano",
    description: "Cruzava Londres cumprindo prazos e descobrindo atalhos que quase ninguém percebia.",
    attributes: ["agi", "ins"] as AttributeId[],
    skills: ["Pilotagem", "Percepção"],
  },
  {
    id: "assistente-social",
    name: "Assistente Social",
    description: "Atendia famílias em crise e sabia ouvir, negociar e reconhecer problemas escondidos.",
    attributes: ["pre", "ins"] as AttributeId[],
    skills: ["Diplomacia", "Intuição"],
  },
  {
    id: "profissional-saude",
    name: "Profissional da Saúde",
    description: "Trabalhava sob pressão em hospitais, clínicas, ambulâncias ou atendimento comunitário.",
    attributes: ["int", "vig"] as AttributeId[],
    skills: ["Medicina", "Fortitude"],
  },
  {
    id: "vida-no-corre",
    name: "Vida no Corre",
    description: "Sobrevivia de negócios ilegais, contatos e decisões rápidas nas ruas de Londres.",
    attributes: ["agi", "pre"] as AttributeId[],
    skills: ["Crime", "Enganação"],
  },
  {
    id: "ex-detento",
    name: "Ex-detento",
    description: "Voltou para uma cidade hostil carregando resistência e leitura constante de ameaças.",
    attributes: ["vig", "pre"] as AttributeId[],
    skills: ["Fortitude", "Vontade"],
  },
  {
    id: "atleta-bairro",
    name: "Atleta de Bairro",
    description: "Transformava disciplina, treino físico e competitividade em uma chance de futuro.",
    attributes: ["for", "agi"] as AttributeId[],
    skills: ["Atletismo", "Luta"],
  },
  {
    id: "seguranca-particular",
    name: "Segurança Particular",
    description: "Protegia lugares e pessoas com pouco apoio, aprendendo a ocupar espaço e conter confusões.",
    attributes: ["for", "vig"] as AttributeId[],
    skills: ["Percepção", "Intimidação"],
  },
  {
    id: "estudante-universitario",
    name: "Estudante Universitário",
    description: "Conciliava estudos, transporte e cobranças, usando conhecimento como principal ferramenta.",
    attributes: ["int", "ins"] as AttributeId[],
    skills: ["Ciências", "Atualidades"],
  },
  {
    id: "tecnico-ti",
    name: "Técnico de TI",
    description: "Consertava sistemas e encontrava falhas digitais que outras pessoas não conseguiam enxergar.",
    attributes: ["int", "agi"] as AttributeId[],
    skills: ["Tecnologia", "Investigação"],
  },
  {
    id: "artista-independente",
    name: "Artista Independente",
    description: "Criava seu próprio palco por meio de música, dança, atuação, fotografia ou arte urbana.",
    attributes: ["pre", "agi"] as AttributeId[],
    skills: ["Artes", "Diplomacia"],
  },
  {
    id: "trabalhador-obras",
    name: "Trabalhador de Obras",
    description: "Dependia de força, resistência e conhecimento prático para resolver problemas concretos.",
    attributes: ["for", "vig"] as AttributeId[],
    skills: ["Atletismo", "Profissão"],
  },
  {
    id: "comerciante-local",
    name: "Comerciante Local",
    description: "Administrava um pequeno negócio e conhecia os rostos, histórias e dívidas da vizinhança.",
    attributes: ["pre", "int"] as AttributeId[],
    skills: ["Diplomacia", "Profissão"],
  },
  {
    id: "jornalista-local",
    name: "Jornalista Local",
    description: "Fazia perguntas incômodas e conectava pistas antes que alguém apagasse a história.",
    attributes: ["int", "pre"] as AttributeId[],
    skills: ["Investigação", "Atualidades"],
  },
  {
    id: "veterano",
    name: "Veterano",
    description: "Carregava treinamento militar, disciplina e reações moldadas por situações de risco.",
    attributes: ["for", "ins"] as AttributeId[],
    skills: ["Tática", "Pontaria"],
  },
  {
    id: "cuidador-familiar",
    name: "Cuidador Familiar",
    description: "Aprendeu a suportar cansaço e perceber mudanças sutis cuidando de alguém dependente.",
    attributes: ["vig", "pre"] as AttributeId[],
    skills: ["Intuição", "Vontade"],
  },
  {
    id: "tecnico-laboratorio",
    name: "Técnico de Laboratório",
    description: "Analisava amostras e reconhecia pequenas anomalias antes mesmo do Apagão.",
    attributes: ["int", "ins"] as AttributeId[],
    skills: ["Ciências", "Medicina"],
  },
] as const;

export const attributeLabel = (id: AttributeId) =>
  ATTRIBUTES.find((attribute) => attribute.id === id)?.short ?? id.toUpperCase();

export const SKILLS = [
  { id: "atletismo", name: "Atletismo", attribute: "for" },
  { id: "luta", name: "Luta", attribute: "for" },
  { id: "acrobacia", name: "Acrobacia", attribute: "agi" },
  { id: "crime", name: "Crime", attribute: "agi" },
  { id: "furtividade", name: "Furtividade", attribute: "agi" },
  { id: "iniciativa", name: "Iniciativa", attribute: "agi" },
  { id: "pilotagem", name: "Pilotagem", attribute: "agi" },
  { id: "pontaria", name: "Pontaria", attribute: "agi" },
  { id: "reflexos", name: "Reflexos", attribute: "agi" },
  { id: "fortitude", name: "Fortitude", attribute: "vig" },
  { id: "atualidades", name: "Atualidades", attribute: "int" },
  { id: "ciencias", name: "Ciências", attribute: "int" },
  { id: "investigacao", name: "Investigação", attribute: "int" },
  { id: "medicina", name: "Medicina", attribute: "int" },
  { id: "ocultismo", name: "Ocultismo", attribute: "int" },
  { id: "profissao", name: "Profissão", attribute: "int" },
  { id: "tatica", name: "Tática", attribute: "int" },
  { id: "tecnologia", name: "Tecnologia", attribute: "int" },
  { id: "artes", name: "Artes", attribute: "pre" },
  { id: "diplomacia", name: "Diplomacia", attribute: "pre" },
  { id: "enganacao", name: "Enganação", attribute: "pre" },
  { id: "intimidacao", name: "Intimidação", attribute: "pre" },
  { id: "religiao", name: "Religião", attribute: "pre" },
  { id: "adestramento", name: "Adestramento", attribute: "ins" },
  { id: "intuicao", name: "Intuição", attribute: "ins" },
  { id: "percepcao", name: "Percepção", attribute: "ins" },
  { id: "sobrevivencia", name: "Sobrevivência", attribute: "ins" },
  { id: "vontade", name: "Vontade", attribute: "ins" },
] as const satisfies ReadonlyArray<{ id: string; name: string; attribute: AttributeId }>;

export const SKILL_GRADES = [
  { level: 0, name: "Destreinado", bonus: 0 },
  { level: 1, name: "Treinado", bonus: 5 },
  { level: 2, name: "Especialista", bonus: 10 },
  { level: 3, name: "Mestre", bonus: 15 },
] as const;

export type EquipmentCategory =
  | "branca"
  | "fogo"
  | "armadura"
  | "medicina"
  | "geral"
  | "municao";

export type EquipmentItem = {
  id: string;
  name: string;
  category: EquipmentCategory;
  description: string;
  weight: number;
  defense?: number;
  ammo?: "Curta" | "Média" | "Longa" | "Escopeta";
  shots?: number;
  damage?: string;
  healing?: string;
  damageType?: string;
  effect?: string;
  action?: string;
  range?: string;
  attackAttribute?: AttributeId;
  damageAttribute?: AttributeId;
  attackSkill?: string;
  cost?: number;
  costResource?: "nenhum" | "pe" | "pa";
  criticalHit?: number;
  criticalMultiplier?: number;
  capacityBonus?: number;
};

const EQUIPMENT_BASE: EquipmentItem[] = [
  { id: "canivete", name: "Canivete", category: "branca", description: "Pequena lâmina dobrável, discreta e fácil de carregar.", weight: 0.15, damage: "1d2+1", damageType: "Corte", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "faca-utilitaria", name: "Faca utilitária", category: "branca", description: "Lâmina robusta usada em trabalho, sobrevivência ou defesa.", weight: 0.35, damage: "1d4", damageType: "Corte", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "bastao-retratil", name: "Bastão retrátil", category: "branca", description: "Bastão metálico compacto que se estende com um movimento.", weight: 0.55, damage: "1d4+1", damageType: "Impacto", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "martelo", name: "Martelo", category: "branca", description: "Ferramenta curta e resistente para confrontos improvisados.", weight: 0.75, damage: "1d6", damageType: "Impacto", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "taco-criquete", name: "Taco de críquete", category: "branca", description: "Taco esportivo longo, resistente e comum nos bairros londrinos.", weight: 1.25, damage: "1d6+1", damageType: "Impacto", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "pe-cabra", name: "Pé-de-cabra", category: "branca", description: "Barra metálica usada para alavancar portas ou golpear com força.", weight: 1.8, damage: "1d8", damageType: "Impacto", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "machado-incendio", name: "Machado de incêndio", category: "branca", description: "Ferramenta pesada feita para romper portas e obstáculos.", weight: 2.8, damage: "1d8+1", damageType: "Corte", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },
  { id: "marreta", name: "Marreta", category: "branca", description: "Martelo de duas mãos extremamente pesado e difícil de ocultar.", weight: 5, damage: "1d10", damageType: "Impacto", action: "Ação", range: "Corpo a corpo", attackAttribute: "for", damageAttribute: "for", criticalHit: 20, criticalMultiplier: 2 },

  { id: "pistola-compacta", name: "Pistola compacta", category: "fogo", description: "Arma curta, leve e fácil de esconder sob a roupa.", weight: 0.65, ammo: "Curta", damage: "1d6", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "pistola-semiautomatica", name: "Pistola semiautomática", category: "fogo", description: "Arma curta equilibrada, confiável e versátil.", weight: 0.9, ammo: "Curta", damage: "2d6", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "revolver-leve", name: "Revólver leve", category: "fogo", description: "Arma simples e resistente, com capacidade limitada.", weight: 0.75, ammo: "Curta", damage: "1d8", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "revolver-pesado", name: "Revólver pesado", category: "fogo", description: "Arma curta robusta, potente e difícil de ocultar.", weight: 1.2, ammo: "Curta", damage: "1d10", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "submetralhadora", name: "Submetralhadora compacta", category: "fogo", description: "Arma automática curta, feita para espaços apertados.", weight: 2.4, ammo: "Curta", damage: "3d6", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "espingarda-curta", name: "Espingarda de cano curto", category: "fogo", description: "Arma compacta de grande presença em curta distância.", weight: 2.7, ammo: "Escopeta", damage: "1d12", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "espingarda-bomba", name: "Espingarda de ação por bombeamento", category: "fogo", description: "Arma longa resistente, intimidadora e confiável.", weight: 3.4, ammo: "Escopeta", damage: "2d8", damageType: "Balístico", action: "Ação", range: "Curto alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "carabina", name: "Carabina semiautomática", category: "fogo", description: "Arma longa mais leve, precisa e fácil de controlar.", weight: 3.1, ammo: "Média", damage: "4d6", damageType: "Balístico", action: "Ação", range: "Médio alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "fuzil-assalto", name: "Fuzil de assalto", category: "fogo", description: "Arma militar versátil, rara e altamente controlada.", weight: 3.8, ammo: "Média", damage: "3d8+2", damageType: "Balístico", action: "Ação", range: "Médio alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },
  { id: "rifle-precisao", name: "Rifle de precisão", category: "fogo", description: "Arma longa preparada para tiros a grande distância.", weight: 5.5, ammo: "Longa", damage: "3d12", damageType: "Balístico", action: "Ação", range: "Longo alcance", attackAttribute: "agi", damageAttribute: "agi", criticalHit: 20, criticalMultiplier: 2 },

  { id: "jaqueta-reforcada", name: "Jaqueta reforçada", category: "armadura", description: "Proteção discreta contra impactos e cortes.", weight: 3, defense: 1 },
  { id: "colete-discreto", name: "Colete balístico discreto", category: "armadura", description: "Proteção leve escondida sob roupas comuns.", weight: 4.5, defense: 5 },
  { id: "colete-tatico", name: "Colete tático com placas", category: "armadura", description: "Colete ostensivo preparado para confrontos armados.", weight: 8, defense: 8 },
  { id: "armadura-intervencao", name: "Armadura de intervenção", category: "armadura", description: "Conjunto pesado com capacete e proteção ampliada.", weight: 14, defense: 10 },

  { id: "bandagem-esteril", name: "Bandagem estéril", category: "medicina", description: "Protege ferimentos leves e permite cuidados básicos.", weight: 0.1, healing: "1d4+2" },
  { id: "bandagem-compressiva", name: "Bandagem compressiva", category: "medicina", description: "Controla um sangramento grave até o tratamento adequado.", weight: 0.2, healing: "2d4+2" },
  { id: "antisseptico", name: "Antisséptico portátil", category: "medicina", description: "Limpa ferimentos e reduz o risco de infecção.", weight: 0.25, healing: "3d2" },
  { id: "analgesico", name: "Analgésico", category: "medicina", description: "Reduz temporariamente os efeitos da dor.", weight: 0.05, healing: "1d8" },
  { id: "kit-primeiros-socorros", name: "Kit de primeiros socorros", category: "medicina", description: "Trata lesões leves e estabiliza feridos.", weight: 1.2, healing: "1d10+2" },
  { id: "kit-trauma", name: "Kit de trauma", category: "medicina", description: "Material avançado para emergências e ferimentos graves.", weight: 3, healing: "2d10+4" },
  { id: "bolsa-termica", name: "Bolsa térmica instantânea", category: "medicina", description: "Alivia contusões, inchaço e desconforto muscular.", weight: 0.25, healing: "2d4" },
  { id: "inalador", name: "Inalador de emergência", category: "medicina", description: "Ajuda a recuperar a respiração após esforço ou fumaça.", weight: 0.1, healing: "1d2+2" },
  { id: "injetor", name: "Injetor estimulante", category: "medicina", description: "Mantém uma pessoa responsiva por pouco tempo.", weight: 0.15, healing: "1d4" },
  { id: "antidoto", name: "Antídoto de campo", category: "medicina", description: "Combate toxinas comuns quando aplicado corretamente.", weight: 0.2, healing: "1d6" },

  { id: "smartphone", name: "Smartphone", category: "geral", description: "Comunicação, gravação, navegação e acesso à internet.", weight: 0.2 },
  { id: "bateria", name: "Bateria externa", category: "geral", description: "Recarrega pequenos aparelhos longe de uma tomada.", weight: 0.4 },
  { id: "lanterna", name: "Lanterna portátil", category: "geral", description: "Ilumina áreas escuras com um feixe direcionado.", weight: 0.25 },
  { id: "radio", name: "Rádio comunicador", category: "geral", description: "Contato de curta distância sem rede telefônica.", weight: 0.3 },
  { id: "camera-corporal", name: "Câmera corporal", category: "geral", description: "Registra áudio e vídeo durante uma operação.", weight: 0.2 },
  { id: "notebook", name: "Notebook portátil", category: "geral", description: "Executa pesquisas, análises e tarefas digitais.", weight: 1.5 },
  { id: "ferramentas", name: "Kit de ferramentas", category: "geral", description: "Instrumentos para reparos mecânicos e elétricos.", weight: 3.5 },
  { id: "multiferramenta", name: "Multiferramenta", category: "geral", description: "Lâminas, chaves e alicates num objeto compacto.", weight: 0.25 },
  { id: "fita", name: "Fita resistente", category: "geral", description: "Prende, veda ou improvisa reparos temporários.", weight: 0.4 },
  { id: "corda", name: "Corda de nylon, 15 metros", category: "geral", description: "Auxilia em escaladas, resgates e amarrações.", weight: 1.5 },
  { id: "escalada", name: "Kit de escalada", category: "geral", description: "Mosquetões, cadeirinha e equipamento básico de subida.", weight: 4.5 },
  { id: "arrombamento", name: "Kit de arrombamento", category: "geral", description: "Ferramentas delicadas para manipular fechaduras.", weight: 0.35 },
  { id: "binoculos", name: "Binóculos compactos", category: "geral", description: "Observação de pessoas e locais a longa distância.", weight: 0.6 },
  { id: "mascara", name: "Máscara filtrante", category: "geral", description: "Protege contra fumaça e partículas nocivas.", weight: 0.9 },
  { id: "mochila", name: "Mochila reforçada", category: "geral", description: "Transporta equipamentos, suporta uso intenso e aumenta a capacidade de carga em 8 kg.", weight: 1, capacityBonus: 8 },
  { id: "algemas", name: "Algemas plásticas", category: "geral", description: "Imobilizam temporariamente os pulsos de uma pessoa.", weight: 0.2 },
  { id: "cobertor", name: "Cobertor térmico", category: "geral", description: "Conserva calor corporal e protege contra exposição.", weight: 0.1 },
  { id: "scanner", name: "Scanner de frequências", category: "geral", description: "Localiza transmissões próximas e seus canais.", weight: 0.7 },
  { id: "drone", name: "Drone compacto", category: "geral", description: "Observação aérea com transmissão de imagens.", weight: 1.2 },
  { id: "gerador", name: "Gerador portátil", category: "geral", description: "Energia temporária para aparelhos e instalações pequenas.", weight: 12 },

  { id: "municao-curta", name: "Munição curta · 10 disparos", category: "municao", description: "Compatível com pistolas, revólveres e submetralhadoras.", weight: 0.15, ammo: "Curta", shots: 10 },
  { id: "municao-media", name: "Munição média · 10 disparos", category: "municao", description: "Compatível com carabinas e fuzis de assalto.", weight: 0.25, ammo: "Média", shots: 10 },
  { id: "municao-longa", name: "Munição longa · 10 disparos", category: "municao", description: "Compatível com rifles de precisão.", weight: 0.35, ammo: "Longa", shots: 10 },
  { id: "municao-escopeta", name: "Munição de escopeta · 10 disparos", category: "municao", description: "Compatível com espingardas.", weight: 0.45, ammo: "Escopeta", shots: 10 },
];

const equipmentEffect = (item: EquipmentItem) => {
  if (item.damage) return `Ao acertar, causa ${item.damage} de dano ${item.damageType?.toLowerCase() ?? "físico"}.`;
  if (item.healing) return `Com uma aplicação, recupera ${item.healing} PV do alvo.`;
  if (item.defense) return `Enquanto equipada, concede +${item.defense} na Defesa.`;
  if (item.capacityBonus) return `Enquanto carregada, aumenta o limite de carga em ${item.capacityBonus} kg.`;
  if (item.shots) return `Fornece ${item.shots} disparos para armas de munição ${item.ammo?.toLowerCase()}.`;
  return item.description;
};

const PERSONAL_EQUIPMENT_IDS = new Set([
  "smartphone", "lanterna", "radio", "camera-corporal", "notebook",
  "binoculos", "mascara", "mochila", "scanner",
]);

export const EQUIPMENT: EquipmentItem[] = EQUIPMENT_BASE.map((item) => {
  const isMelee = item.category === "branca";
  const isFirearm = item.category === "fogo";
  const isWeapon = isMelee || isFirearm;
  const isPersonal = item.category === "armadura" || item.category === "municao" || PERSONAL_EQUIPMENT_IDS.has(item.id);
  const range = isMelee
    ? "Corpo a Corpo"
    : isFirearm
      ? (item.range ?? "Curto").replace(" alcance", "")
      : item.id === "drone"
        ? "Curto"
        : isPersonal ? "Pessoal" : "Toque";

  return {
    ...item,
    action: isWeapon || item.category === "medicina" || item.category === "geral" ? "Padrão" : "Livre",
    range,
    effect: item.effect || equipmentEffect(item),
    attackSkill: item.attackSkill ?? (isFirearm ? "pontaria" : isMelee ? "luta" : undefined),
    cost: item.cost ?? 0,
    costResource: item.costResource ?? "nenhum",
  };
});

export const EQUIPMENT_CATEGORIES: Array<{ id: EquipmentCategory; name: string }> = [
  { id: "branca", name: "Armas brancas" },
  { id: "fogo", name: "Armas de fogo" },
  { id: "armadura", name: "Armaduras" },
  { id: "medicina", name: "Medicina" },
  { id: "municao", name: "Munições" },
  { id: "geral", name: "Itens gerais" },
];

export const POWER_KEYWORDS = [
  { id: "impulso", name: "Impulso", description: "Movimento, aceleração, força ou projeção." },
  { id: "veu", name: "Véu", description: "Ocultação, ilusão, silêncio ou intangibilidade." },
  { id: "eco", name: "Eco", description: "Repetição, memória, cópia ou ressonância." },
  { id: "vinculo", name: "Vínculo", description: "Conexão entre pessoas, objetos, lugares ou emoções." },
  { id: "ruptura", name: "Ruptura", description: "Quebra, corte, explosão ou interrupção." },
  { id: "ancora", name: "Âncora", description: "Estabilidade, resistência, bloqueio ou fixação." },
  { id: "fluxo", name: "Fluxo", description: "Transformação, adaptação, energia ou transferência." },
  { id: "dominio", name: "Domínio", description: "Controle de uma área, elemento, condição ou regra." },
] as const;
