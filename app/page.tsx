"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import abilityCatalog from "./abilities.generated.json";
import {
  ATTRIBUTES,
  CLASSES,
  EQUIPMENT,
  EQUIPMENT_CATEGORIES,
  ORIGINS,
  POWER_KEYWORDS,
  SKILLS,
  SKILL_GRADES,
  attributeLabel,
  type AttributeId,
  type ClassId,
  type EquipmentCategory,
  type EquipmentItem,
} from "./data";

type SectionId = "identidade" | "status" | "pericias" | "progressao" | "habilidades" | "combate" | "equipamentos" | "poder";
type AppScreen = "inicio" | "historia" | "slots" | "mestre" | "ficha";
type ResourceId = "pv" | "pe" | "pa";
type SexId = "masculino" | "feminino";
type NeedId = "fome" | "sede" | "sono";
type BodyPartId = "cabeca" | "tronco" | "bracoEsquerdo" | "bracoDireito" | "pernaEsquerda" | "pernaDireita";
type CombatAttributeId = AttributeId;
type AbilityNature = "fisica" | "poder";
type CostResource = "nenhum" | "pe" | "pa";
type AbilityView = "obtidas" | "catalogo" | "adicionar";
type CatalogKind = "classe" | "geral";
type CatalogBand = "1-4" | "5-9" | "10-14" | "15-20";
type AbilityBuffs = {
  defense?: number;
  resources?: Partial<Record<ResourceId, number>>;
  skills?: Record<string, number>;
  carryCapacity?: number;
};
type RollMode = "normal" | "vantagem" | "desvantagem";
type Ability = {
  id: string;
  group: ClassId | "gerais";
  level: number;
  type: "Passiva" | "Ativa";
  name: string;
  description: string;
  requirement?: string;
  cost?: string;
  damage?: string;
  damageType?: string;
  effect?: string;
  range?: string;
  action?: string;
  nature?: AbilityNature;
  costResource?: CostResource;
  attackSkill?: string;
  attackAttribute?: CombatAttributeId | "";
  damageAttribute?: CombatAttributeId | "";
  criticalHit?: number;
  criticalMultiplier?: number;
  notes?: string;
  buffs?: AbilityBuffs;
};

type EditableAbility = {
  id: string;
  sourceId?: string;
  level: number;
  nature: AbilityNature;
  name: string;
  description: string;
  damage: string;
  damageType: string;
  effect: string;
  action: string;
  range: string;
  cost: string;
  costResource: CostResource;
  attackSkill: string;
  attackAttribute: CombatAttributeId;
  damageAttribute: CombatAttributeId;
  attackBonus: number;
  damageBonus: number;
  criticalHit: number;
  criticalMultiplier: number;
};

type RollResult = {
  id: string;
  abilityName: string;
  nature: AbilityNature;
  attackDice: number[];
  attackAttributeModifier: number;
  attackSkillName: string;
  attackSkillBonus: number;
  attackFreeBonus: number;
  attackModifier: number;
  attackTotal: number;
  tone: "critical" | "failure" | "neutral";
  label: string;
  critical: boolean;
  criticalMultiplier: number;
  damageRolls: number[];
  damageModifier: number;
  baseDamageTotal: number | null;
  damageTotal: number | null;
  damageType: string;
  costText: string;
};

type ObtainedAbilityEntry = {
  key: string;
  level: number;
  type: "Passiva" | "Ativa";
  source: string;
  name: string;
  description: string;
  damage: string;
  damageType: string;
  effect: string;
  action: string;
  range: string;
  cost: string;
  costResource: CostResource;
  attackSkill?: string;
  attackAttribute?: CombatAttributeId | "";
  damageAttribute?: CombatAttributeId | "";
  criticalHit: number;
  criticalMultiplier: number;
  catalogAbility?: Ability;
  customAbility?: EditableAbility;
};

type SkillRollResult = {
  id: string;
  skillName: string;
  attribute: AttributeId;
  die: number;
  attributeModifier: number;
  skillBonus: number;
  total: number;
  tone: "critical" | "failure" | "neutral";
};

type FloatingRollEntry =
  | { kind: "skill"; result: SkillRollResult }
  | { kind: "combat"; result: RollResult };

type Character = {
  id: string;
  slot: number;
  portrait: string;
  name: string;
  player: string;
  sex: SexId | "";
  level: number;
  classId: ClassId;
  originId: string;
  originPrimary: AttributeId;
  baseScores: Record<AttributeId, number>;
  attributeBoosts: Record<string, Partial<Record<AttributeId, number>>>;
  creationSkills: string[];
  skillAdvances: Record<string, number>;
  skillUsage: Record<string, number>;
  specialistSkills: string[];
  classAbilities: Record<string, string>;
  generalAbilities: Record<string, string>;
  obtainedAbilityIds: string[];
  inventory: Record<string, number>;
  armorId: string;
  resourceUsed: Record<ResourceId, number>;
  resourceTemporary: Record<ResourceId, number>;
  resourceMaximumOverrides: Partial<Record<ResourceId, number | null>>;
  defenseOverride: number | null;
  carryLimitOverride: number | null;
  needs: Record<NeedId, number>;
  bodyHealth: Record<BodyPartId, number>;
  deathMarks: number;
  customAbilities: EditableAbility[];
  powerAbilities: EditableAbility[];
  combatAbilities: EditableAbility[];
  power: {
    keyword: string;
    name: string;
    concept: string;
    baseEffect: string;
    limits: string;
    weakness: string;
    cost: string;
    test: string;
    expansions: string;
    evolution: string;
    overload: string;
  };
  rulesVersion: number;
  bio: {
    age: string;
    appearance: string;
    personality: string;
    bonds: string;
    history: string;
    notes: string;
  };
  updatedAt: number;
};

const STORAGE_KEY = "supacell-rpg-characters-v2";
const OLD_STORAGE_KEY = "supacell-rpg-characters-v1";
const NPC_STORAGE_KEY = "supacell-rpg-npcs-v1";
const SITE_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const MAX_SLOTS = 5;
const MAX_NPC_SLOTS = 30;
const MASTER_PASSWORD_SALT = "supacell-rpg::";
const MASTER_PASSWORD_DIGEST = "53103101ed3d37556e818ffff7b03dadf0dcea43005aefd4df89914278775579";
const CURRENT_RULES_VERSION = 3;
const EVEN_LEVELS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
const ATTRIBUTE_LEVELS = [4, 8, 12, 16, 20];
const OBTAINED_ABILITIES_PER_PAGE = 6;
const CATALOG_BANDS: Array<{ id: CatalogBand; label: string; min: number; max: number }> = [
  { id: "1-4", label: "Níveis 1–4", min: 1, max: 4 },
  { id: "5-9", label: "Níveis 5–9", min: 5, max: 9 },
  { id: "10-14", label: "Níveis 10–14", min: 10, max: 14 },
  { id: "15-20", label: "Níveis 15–20", min: 15, max: 20 },
];
const ACTION_OPTIONS = ["Livre", "Movimento", "Padrão", "Completa"] as const;
const RANGE_OPTIONS = ["Pessoal", "Toque", "Corpo a Corpo", "Curto", "Médio", "Longo", "Ilimitado"] as const;
const DAMAGE_TYPE_OPTIONS = ["Corte", "Impacto", "Perfuração", "Tóxico", "Balístico", "Supacell"] as const;

const defaultScores: Record<AttributeId, number> = {
  for: 14,
  agi: 13,
  vig: 12,
  int: 11,
  pre: 10,
  ins: 8,
};

const BASE_SCORES_BY_SEX: Record<SexId, Record<AttributeId, number>> = {
  masculino: {
    for: 15,
    vig: 13,
    agi: 13,
    int: 11,
    pre: 10,
    ins: 9,
  },
  feminino: {
    for: 14,
    vig: 12,
    agi: 14,
    int: 12,
    pre: 11,
    ins: 8,
  },
};

const DEFAULT_NEEDS: Record<NeedId, number> = {
  fome: 0,
  sede: 0,
  sono: 0,
};

const DEFAULT_BODY_HEALTH: Record<BodyPartId, number> = {
  cabeca: 100,
  tronco: 100,
  bracoEsquerdo: 100,
  bracoDireito: 100,
  pernaEsquerda: 100,
  pernaDireita: 100,
};

async function digestMasterPassword(password: string) {
  const data = new TextEncoder().encode(`${MASTER_PASSWORD_SALT}${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const NEEDS: Array<{ id: NeedId; label: string; description: string }> = [
  { id: "fome", label: "Fome", description: "Afeta Força e Vigor." },
  { id: "sede", label: "Sede", description: "Afeta todos os testes físicos." },
  { id: "sono", label: "Sono", description: "Afeta Agilidade, Intelecto e Instinto." },
];

const NEED_LEVELS = [
  { name: "Satisfeito", penalty: "Sem penalidade" },
  { name: "Incômodo", penalty: "Efeito narrativo" },
  { name: "Prejudicado", penalty: "−3" },
  { name: "Debilitado", penalty: "−8" },
  { name: "Crítico", penalty: "−12" },
  { name: "Colapso", penalty: "Falha automática · −100" },
] as const;

const BODY_PARTS: Array<{ id: BodyPartId; label: string; short: string }> = [
  { id: "cabeca", label: "Cabeça", short: "CAB" },
  { id: "tronco", label: "Tronco", short: "TRN" },
  { id: "bracoEsquerdo", label: "Braço esquerdo", short: "BE" },
  { id: "bracoDireito", label: "Braço direito", short: "BD" },
  { id: "pernaEsquerda", label: "Perna esquerda", short: "PE" },
  { id: "pernaDireita", label: "Perna direita", short: "PD" },
];

const emptyPower: Character["power"] = {
  keyword: "",
  name: "",
  concept: "",
  baseEffect: "",
  limits: "",
  weakness: "",
  cost: "",
  test: "",
  expansions: "",
  evolution: "",
  overload: "",
};

const emptyBio: Character["bio"] = {
  age: "",
  appearance: "",
  personality: "",
  bonds: "",
  history: "",
  notes: "",
};

const makeId = () => `char-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
const makeRecordId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const modifier = (score: number) => Math.floor((score - 10) / 2);
const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);
const clampNeedLevel = (value: number) => Math.min(5, Math.max(0, Math.trunc(Number(value) || 0)));
const clampBodyHealth = (value: number) => Math.min(100, Math.max(0, Math.trunc(Number(value) || 0)));
const bodyHealthState = (value: number) => {
  if (value <= 0) return { name: "Incapacitado", penalty: "−100", tone: "incapacitated" };
  if (value <= 25) return { name: "Crítico", penalty: "−12", tone: "critical" };
  if (value <= 50) return { name: "Grave", penalty: "−8", tone: "grave" };
  if (value <= 75) return { name: "Ferido", penalty: "−3", tone: "wounded" };
  if (value < 100) return { name: "Lesão leve", penalty: "Narrativo", tone: "light" };
  return { name: "Saudável", penalty: "Sem penalidade", tone: "healthy" };
};
const safeFileName = (value: string) => value.trim().toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 48) || "ficha";
const skillIdByName = (name: string): string => SKILLS.find((skill) => skill.name === name)?.id ?? "";
const hasDamage = (damage: string | undefined) => Boolean(damage?.trim());

const OFFENSIVE_ABILITIES = new Set([
  "Investida Brutal", "Retaliação", "Golpe Demolidor", "Passo Pesado", "Quebra-Guarda",
  "Contra o Chão", "Impacto em Cadeia", "Imparável", "Punho Sísmico", "Quebra-Linha",
  "Vingança Imediata", "Golpe de Execução", "Impacto Absoluto", "Força da Catástrofe",
  "Disparo Calculado", "Ponto Cego", "Fogo de Cobertura", "Duplo Engajamento", "Ângulo Impossível",
  "Entrada Dinâmica", "Desarme Cirúrgico", "Sequência Perfeita", "Ataque Coordenado", "Tiro Terminal",
  "Zona de Supressão", "Execução Limpa", "Protocolo Impossível", "Sabotagem Precisa",
  "Tecnologia Experimental", "Quebra de Sistema", "Projeto Proibido", "Contramedida Perfeita",
  "Briga de Rua", "Combate Improvisado", "Caçador de Anomalias", "Potencial Ilimitado",
]);

const POWER_ABILITY_NAMES = new Set([
  "Afinidade Supacell", "Controle de Manifestação", "Reserva Oculta", "Resistência Supacell",
  "Análise Supacell", "Manifestação Econômica", "Evolução Supacell", "Conexão com a Rede",
  "Potencial Ilimitado", "Tecnologia Experimental", "Projeto Proibido", "Teoria Unificada",
]);

const SHOOTING_PATTERN = /disparo|tiro|fogo de cobertura|ângulo|munição|balístic|atirador|supressão|duplo engajamento|execução limpa/i;
const HEALING_PATTERN = /diagnóstico|primeiros socorros|tratamento|cirurgia|medicina de guerra|socorrista|recuperação rápida/i;
const MOVEMENT_PATTERN = /investida|rolamento|saída|passo|fuga|mobilidade|entrada dinâmica|infiltração|fantasma|reposicion|avança|move/i;
const DEFENSE_PATTERN = /guarda|muralha|escudo|fortificação|resistência|inabalável|proteção|protetor|durão|sobreviv|corpo de aço|sem recuar|último de pé/i;
const REACTION_PATTERN = /retaliação|vingança imediata|reflexo|plano b|contramedida|reação aprimorada|protetor instintivo|desafiar a morte/i;
const COMPLETE_PATTERN = /catástrofe|terminal|absoluto|impossível|cirurgia|operação fantasma|movimento popular|coletiv|resposta para tudo|voz de uma geração|potencial ilimitado/i;
const INTIMIDATION_PATTERN = /provocação|autoridade|pressão|medo|ordem|ameaç|intimid/i;
const SHARED_EFFECT_PATTERN = /linha de frente|presença ameaçadora|ombro a ombro|domínio do ringue|pressão constante|zona de perigo|guardião do grupo|presença titânica|liderança|elo de confiança|presença magnética|moral elevada|confiança contagiante|ícone da comunidade|rede subterrânea|proteção mútua|influência institucional|símbolo vivo|presença absoluta|rede sem fronteiras|lenda de londres|sincronia de equipe|olhos em toda parte|rede de informação/i;
const SELF_USE_PATTERN = /guarda|fortificação|resistência|inabalável|durão|sangue frio|foco|reserva oculta|controle de manifestação|afinidade supacell|corpo treinado|mente afiada|vontade de ferro|recuperação rápida|além do limite|evolução supacell|desafiar a morte|camuflagem/i;

const abilityTier = (level: number) => level <= 4 ? 0 : level <= 9 ? 1 : level <= 14 ? 2 : 3;
const abilityBonus = (level: number) => level <= 2 ? 2 : level <= 4 ? 3 : level <= 9 ? 5 : level <= 14 ? 8 : 10;

function mergeAbilityBuffs(target: AbilityBuffs, source: AbilityBuffs | undefined) {
  if (!source) return target;
  target.defense = (target.defense ?? 0) + (source.defense ?? 0);
  target.carryCapacity = (target.carryCapacity ?? 0) + (source.carryCapacity ?? 0);
  target.resources ??= {};
  target.skills ??= {};
  for (const resource of ["pv", "pe", "pa"] as ResourceId[]) {
    target.resources[resource] = (target.resources[resource] ?? 0) + (source.resources?.[resource] ?? 0);
  }
  for (const [skillId, value] of Object.entries(source.skills ?? {})) {
    target.skills[skillId] = (target.skills[skillId] ?? 0) + value;
  }
  return target;
}

function buffsForCatalogAbility(
  raw: Ability,
  text: string,
  bonus: number,
  power: boolean,
  technical: boolean,
  social: boolean,
): AbilityBuffs {
  if (raw.type !== "Passiva" || SHARED_EFFECT_PATTERN.test(text) || raw.name === "Campo de Especialidade") return {};
  const buffs: AbilityBuffs = { resources: {}, skills: {} };
  const addSkill = (skillId: string) => {
    if (SKILLS.some((skill) => skill.id === skillId)) buffs.skills![skillId] = Math.max(buffs.skills![skillId] ?? 0, bonus);
  };
  const addAttributeSkills = (attribute: AttributeId) => {
    for (const skill of SKILLS.filter((entry) => entry.attribute === attribute)) addSkill(skill.id);
  };

  if (DEFENSE_PATTERN.test(text)) buffs.defense = bonus;
  if (/fôlego|recuperação|durão|aguenta|último de pé|resistência anormal|corpo adaptado|corpo sobre-humano/i.test(text)) {
    buffs.resources!.pv = bonus * 2;
    buffs.resources!.pe = bonus;
  }
  if (/afinidade supacell|resistência supacell|manifestação econômica|evolução supacell/i.test(text)) {
    buffs.resources!.pa = bonus;
    addSkill("ocultismo");
  }
  if (/colosso|corpo sobre-humano/i.test(text)) buffs.carryCapacity = bonus;

  if (technical) addAttributeSkills("int");
  else if (social) {
    addSkill("diplomacia");
    addSkill("enganacao");
    addSkill("intimidacao");
  } else if (power) addSkill("ocultismo");
  else if (raw.group === "operador") {
    addSkill("pontaria");
    addSkill("reflexos");
    if (/fantasma|camuflagem|emboscada|rastro|infiltração/i.test(text)) addSkill("furtividade");
  } else if (raw.group === "vanguarda") {
    addSkill("luta");
    addSkill("fortitude");
    if (/força|colosso|corpo|ringue|gigantes/i.test(text)) addSkill("atletismo");
  } else if (raw.group === "gerais") {
    if (/passos|reflex/i.test(text)) {
      addSkill("furtividade");
      addSkill("reflexos");
    } else if (/mente|foco|improvis|talento|polivalente/i.test(text)) {
      addAttributeSkills("int");
    } else if (/vontade|sangue frio|pânico|mente blindada/i.test(text)) {
      addSkill("vontade");
    } else if (/presença|reputação/i.test(text)) {
      addSkill("diplomacia");
      addSkill("intimidacao");
    } else if (/olhos|instinto|sobreviv/i.test(text)) {
      addSkill("percepcao");
      addSkill("sobrevivencia");
    } else {
      addSkill("atletismo");
      addSkill("fortitude");
    }
  }
  return buffs;
}

function buffsFromEditableAbility(ability: EditableAbility): AbilityBuffs {
  const text = `${ability.description} ${ability.effect}`;
  const buffs: AbilityBuffs = { resources: {}, skills: {} };
  const defense = /(?:defesa|def)\s*(?:máxima)?\s*\+(\d+)|\+(\d+)\s*(?:na\s+)?defesa/i.exec(text);
  if (defense) buffs.defense = Number(defense[1] ?? defense[2]) || 0;
  const carry = /(?:carga|capacidade)\s*\+(\d+)|\+(\d+)\s*kg/i.exec(text);
  if (carry) buffs.carryCapacity = Number(carry[1] ?? carry[2]) || 0;
  for (const resource of ["pv", "pe", "pa"] as ResourceId[]) {
    const match = new RegExp(`(?:${resource}\\s*(?:máxim[oa])?\\s*\\+(\\d+)|\\+(\\d+)\\s*(?:de\\s+)?${resource}\\s*(?:máxim[oa])?)`, "i").exec(text);
    if (match) buffs.resources![resource] = Number(match[1] ?? match[2]) || 0;
  }
  for (const skill of SKILLS) {
    const escaped = skill.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(?:${escaped}\\s*\\+(\\d+)|\\+(\\d+)\\s*(?:em\\s+)?${escaped})`, "i").exec(text);
    if (match) buffs.skills![skill.id] = Number(match[1] ?? match[2]) || 0;
  }
  return buffs;
}

function describeAbilityBuffs(buffs: AbilityBuffs | undefined) {
  if (!buffs) return [];
  const descriptions: string[] = [];
  if (buffs.defense) descriptions.push(`Defesa +${buffs.defense}`);
  for (const resource of ["pv", "pe", "pa"] as ResourceId[]) {
    const value = buffs.resources?.[resource] ?? 0;
    if (value) descriptions.push(`${resource.toUpperCase()} máximo +${value}`);
  }
  if (buffs.carryCapacity) descriptions.push(`Carga +${buffs.carryCapacity} kg`);
  for (const [skillId, value] of Object.entries(buffs.skills ?? {})) {
    const skill = SKILLS.find((entry) => entry.id === skillId);
    if (skill && value) descriptions.push(`${skill.name} +${value}`);
  }
  return descriptions;
}

function completeCatalogAbility(raw: Ability): Ability {
  const tier = abilityTier(raw.level);
  const text = `${raw.name} ${raw.description}`;
  const power = raw.nature === "poder" || POWER_ABILITY_NAMES.has(raw.name) || /manifestação supacell/i.test(text);
  const shooting = SHOOTING_PATTERN.test(text) && raw.group === "operador";
  const healing = HEALING_PATTERN.test(text);
  const offensive = raw.type === "Ativa" && OFFENSIVE_ABILITIES.has(raw.name);
  const movement = MOVEMENT_PATTERN.test(text);
  const social = raw.group === "influente";
  const technical = raw.group === "especialista";
  const passiveBonus = abilityBonus(raw.level);
  const selfUse = (raw.type === "Passiva" && !SHARED_EFFECT_PATTERN.test(text))
    || (!offensive && DEFENSE_PATTERN.test(text) && !SHARED_EFFECT_PATTERN.test(text))
    || (movement && !offensive)
    || (!offensive && SELF_USE_PATTERN.test(text));

  const derivedAction = raw.type === "Passiva"
    ? "Livre"
    : COMPLETE_PATTERN.test(text)
      ? "Completa"
      : REACTION_PATTERN.test(text)
        ? "Livre"
        : movement && !offensive
          ? "Movimento"
          : "Padrão";

  const derivedRange = selfUse
    ? "Pessoal"
    : social
      ? raw.level >= 20 ? "Ilimitado" : raw.level >= 15 ? "Longo" : raw.level >= 10 ? "Médio" : "Curto"
      : shooting
        ? raw.level >= 13 ? "Longo" : raw.level >= 7 ? "Médio" : "Curto"
        : power
          ? raw.level >= 15 ? "Longo" : raw.level >= 8 ? "Médio" : "Curto"
          : technical || healing
            ? "Toque"
            : offensive ? "Corpo a Corpo" : raw.type === "Passiva" ? "Curto" : "Toque";

  const damageTables = shooting
    ? ["3d6+2", "7d6+5", "10d6+10", "18d6+18"]
    : power
      ? ["2d10", "4d10+6", "7d10+8", "12d12+6"]
      : ["2d8+4", "5d8+5", "8d8+8", "12d10+20"];
  const damage = offensive ? damageTables[tier] : raw.damage || "";
  const damageType = raw.damageType || (damage ? power || technical ? "Supacell" : shooting ? "Balístico" : "Impacto" : "");
  const healingFormula = ["2d6+3", "4d8+5", "6d10+8", "10d12+10"][tier];
  const buffs = buffsForCatalogAbility(raw, text, passiveBonus, power, technical, social);

  let effect = raw.effect ?? "";
  if (!effect && raw.type === "Passiva") {
    if (DEFENSE_PATTERN.test(text)) effect = `Enquanto a condição descrita estiver ativa, receba +${passiveBonus} na Defesa ou no teste defensivo relacionado.`;
    else if (social) effect = `Aliados que percebam você recebem +${passiveBonus} em testes diretamente ligados à coordenação, confiança ou moral.`;
    else if (technical) effect = `Receba +${passiveBonus} em testes de Intelecto diretamente beneficiados por esta habilidade.`;
    else if (raw.group === "operador") effect = `Receba +${passiveBonus} em testes de Agilidade ou Pontaria diretamente beneficiados por esta habilidade.`;
    else if (power) effect = `Receba +${passiveBonus} em testes de Ocultismo ligados ao controle da manifestação Supacell.`;
    else effect = `Receba +${passiveBonus} nos testes diretamente beneficiados pela condição descrita.`;
  }
  if (!effect && healing) effect = `Restaure ${healingFormula} PV de uma criatura em alcance; cada alvo só pode receber este efeito uma vez por cena.`;
  if (!effect && offensive) {
    const condition = /quebra|desarme|demolidor/i.test(text)
      ? " O alvo sofre −2 na Defesa até o início do seu próximo turno."
      : /sísmico|chão|impacto|catástrofe/i.test(text)
        ? " O alvo é empurrado e fica caído se falhar em Fortitude contra a DT do mestre."
        : /terminal|execução|absoluto/i.test(text)
          ? " Contra um alvo com metade dos PV ou menos, role um dado adicional do mesmo tipo."
          : /cobertura|supressão|cadeia/i.test(text)
            ? " A área atingida permanece perigosa até o início do seu próximo turno."
            : "";
    effect = `Ao acertar, cause o dano indicado.${condition}`;
  }
  if (!effect && movement) effect = `Desloque-se até o alcance indicado sem sofrer penalidade por terreno comum; seu próximo teste relacionado recebe +${passiveBonus}.`;
  if (!effect && social) effect = `Escolha uma criatura em alcance: um aliado recebe +${passiveBonus}, ou um adversário sofre −${passiveBonus}, no próximo teste coerente com a descrição.`;
  if (!effect && technical) effect = `Ao ter acesso ao alvo ou sistema, obtenha vantagem no teste descrito e conceda +${passiveBonus} ao próximo aliado que agir sobre ele.`;
  if (!effect) effect = `Realize o efeito descrito e receba +${passiveBonus} no próximo teste diretamente relacionado a ele.`;

  let attackAttribute: CombatAttributeId = "for";
  let damageAttribute: CombatAttributeId = "for";
  let attackSkill = "luta";
  if (power) {
    attackAttribute = "int";
    damageAttribute = "int";
    attackSkill = "ocultismo";
  } else if (shooting) {
    attackAttribute = "agi";
    damageAttribute = "agi";
    attackSkill = "pontaria";
  } else if (healing) {
    attackAttribute = "int";
    damageAttribute = "int";
    attackSkill = "medicina";
  } else if (technical) {
    attackAttribute = "int";
    damageAttribute = "int";
    attackSkill = "tecnologia";
  } else if (social) {
    attackAttribute = "pre";
    damageAttribute = "pre";
    attackSkill = INTIMIDATION_PATTERN.test(text) ? "intimidacao" : "diplomacia";
  } else if (raw.group === "operador" && !offensive) {
    attackAttribute = "agi";
    damageAttribute = "agi";
    attackSkill = /fantasma|rastro|camuflagem|infiltração/i.test(text) ? "furtividade" : "acrobacia";
  } else if (raw.group === "vanguarda" && !offensive) {
    attackAttribute = "vig";
    damageAttribute = "vig";
    attackSkill = "fortitude";
  } else if (raw.group === "gerais" && !offensive) {
    if (/rastre|sobreviv/i.test(text)) {
      attackAttribute = "ins";
      damageAttribute = "ins";
      attackSkill = "sobrevivencia";
    } else if (/reflex|passos|reação/i.test(text)) {
      attackAttribute = "agi";
      damageAttribute = "agi";
      attackSkill = "reflexos";
    } else if (/contato|presença/i.test(text)) {
      attackAttribute = "pre";
      damageAttribute = "pre";
      attackSkill = "diplomacia";
    }
  }

  const action = ACTION_OPTIONS.includes(raw.action as (typeof ACTION_OPTIONS)[number]) ? raw.action : derivedAction;
  const range = RANGE_OPTIONS.includes(raw.range as (typeof RANGE_OPTIONS)[number]) ? raw.range : derivedRange;
  const nature: AbilityNature = power ? "poder" : "fisica";
  const costResource: CostResource = raw.type === "Passiva" ? "nenhum" : power ? "pa" : "pe";
  const cost = raw.cost || (raw.type === "Passiva" ? "0" : String(Math.min(5, tier + 1 + (action === "Completa" ? 1 : 0))));
  const precisionAbility = /terminal|execução|absoluto/i.test(text);

  return {
    ...raw,
    requirement: raw.requirement || `Nível ${raw.level}`,
    nature,
    cost,
    costResource,
    damage,
    damageType,
    effect,
    action,
    range,
    attackSkill: raw.attackSkill || attackSkill,
    attackAttribute: raw.attackAttribute || attackAttribute,
    damageAttribute: raw.damageAttribute || damageAttribute,
    criticalHit: raw.criticalHit ?? (precisionAbility ? 19 : 20),
    criticalMultiplier: raw.criticalMultiplier ?? (precisionAbility || raw.level === 20 ? 3 : 2),
    buffs,
  };
}

const ABILITIES = (abilityCatalog as Ability[]).map(completeCatalogAbility);
const CATALOG_ABILITY_IDS = new Set(ABILITIES.map((ability) => ability.id));

function emptyEditableAbility(prefix = "ability"): EditableAbility {
  return {
    id: makeRecordId(prefix),
    level: 1,
    nature: "fisica",
    name: "",
    description: "",
    damage: "1d6",
    damageType: "Impacto",
    effect: "",
    action: "Padrão",
    range: "Corpo a Corpo",
    cost: "0",
    costResource: "pe",
    attackSkill: "luta",
    attackAttribute: "for",
    damageAttribute: "for",
    attackBonus: 0,
    damageBonus: 0,
    criticalHit: 20,
    criticalMultiplier: 2,
  };
}

function emptyPowerAbility(): EditableAbility {
  return {
    ...emptyEditableAbility("power"),
    nature: "poder",
    damage: "",
    damageType: "Supacell",
    range: "Curto",
    cost: "1",
    costResource: "pa",
    attackSkill: "ocultismo",
    attackAttribute: "int",
    damageAttribute: "int",
  };
}

const isAttributeId = (value: unknown): value is AttributeId =>
  typeof value === "string" && ATTRIBUTES.some((attribute) => attribute.id === value);

const isSkillId = (value: unknown): value is string =>
  typeof value === "string" && SKILLS.some((skill) => skill.id === value);

const normalizeAction = (value: unknown) => {
  if (ACTION_OPTIONS.includes(value as (typeof ACTION_OPTIONS)[number])) return value as string;
  if (value === "Ação") return "Padrão";
  return "Padrão";
};

const normalizeRange = (value: unknown) => {
  if (RANGE_OPTIONS.includes(value as (typeof RANGE_OPTIONS)[number])) return value as string;
  if (typeof value === "string") {
    const cleaned = value.replace(" alcance", "").replace("Corpo a corpo", "Corpo a Corpo");
    if (RANGE_OPTIONS.includes(cleaned as (typeof RANGE_OPTIONS)[number])) return cleaned;
  }
  return "Corpo a Corpo";
};

const normalizeDamageType = (value: unknown, nature: AbilityNature) =>
  DAMAGE_TYPE_OPTIONS.includes(value as (typeof DAMAGE_TYPE_OPTIONS)[number])
    ? value as string
    : nature === "poder" ? "Supacell" : "Impacto";

function normalizeEditableAbility(raw: Partial<EditableAbility>, prefix: string): EditableAbility {
  const fallback = emptyEditableAbility(prefix);
  const nature: AbilityNature = raw.nature === "poder" ? "poder" : "fisica";
  const equipmentId = raw.sourceId?.startsWith("equipment:") ? raw.sourceId.slice("equipment:".length) : "";
  const equipment = equipmentId ? EQUIPMENT.find((item) => item.id === equipmentId) : undefined;
  const catalogAbility = raw.sourceId && CATALOG_ABILITY_IDS.has(raw.sourceId)
    ? ABILITIES.find((ability) => ability.id === raw.sourceId)
    : undefined;
  const normalizedRange = normalizeRange(raw.range);
  return {
    ...fallback,
    ...raw,
    id: raw.id || fallback.id,
    level: Math.min(20, Math.max(1, Math.trunc(Number(raw.level) || 1))),
    nature,
    costResource: raw.costResource === "pa" || raw.costResource === "pe" || raw.costResource === "nenhum" ? raw.costResource : nature === "poder" ? "pa" : "pe",
    damageType: normalizeDamageType(raw.damageType, nature),
    action: normalizeAction(raw.action),
    range: normalizedRange === "Toque" && catalogAbility?.range === "Pessoal"
      ? "Pessoal"
      : normalizedRange,
    attackSkill: isSkillId(raw.attackSkill) ? raw.attackSkill : equipment?.attackSkill ?? (nature === "poder" ? "ocultismo" : "luta"),
    attackAttribute: isAttributeId(raw.attackAttribute) ? raw.attackAttribute : nature === "poder" ? "int" : "for",
    damageAttribute: isAttributeId(raw.damageAttribute) ? raw.damageAttribute : nature === "poder" ? "int" : "for",
    attackBonus: Number(raw.attackBonus) || 0,
    damageBonus: Number(raw.damageBonus) || 0,
    criticalHit: Math.min(20, Math.max(1, Math.trunc(Number(raw.criticalHit) || 20))),
    criticalMultiplier: Math.max(1, Math.trunc(Number(raw.criticalMultiplier) || 2)),
  };
}

function normalizePowerAbility(raw: Partial<EditableAbility>): EditableAbility {
  const normalized = normalizeEditableAbility({ ...raw, nature: "poder" }, "power");
  return {
    ...normalized,
    nature: "poder",
    costResource: normalized.costResource === "nenhum" ? "nenhum" : "pa",
  };
}

const equipmentAbilitySource = (itemId: string) => `equipment:${itemId}`;

function combatAbilityFromEquipment(item: EquipmentItem): EditableAbility {
  return normalizeEditableAbility({
    id: makeRecordId("combat"),
    sourceId: equipmentAbilitySource(item.id),
    level: 1,
    nature: "fisica",
    name: item.name,
    description: item.description,
    damage: item.damage ?? "",
    damageType: item.damageType ?? "",
    effect: item.effect ?? "",
    action: item.action ?? "Padrão",
    range: item.range ?? "A definir",
    cost: String(item.cost ?? 0),
    costResource: item.costResource ?? "nenhum",
    attackSkill: item.attackSkill ?? (item.category === "fogo" ? "pontaria" : "luta"),
    attackAttribute: item.attackAttribute ?? (item.category === "fogo" ? "agi" : "for"),
    damageAttribute: item.damageAttribute ?? (item.category === "fogo" ? "agi" : "for"),
    attackBonus: 0,
    damageBonus: 0,
    criticalHit: item.criticalHit ?? 20,
    criticalMultiplier: item.criticalMultiplier ?? 2,
  }, "combat");
}

function combatAbilityFromCatalog(ability: Ability): EditableAbility {
  const nature: AbilityNature = ability.nature === "poder" ? "poder" : "fisica";
  const defaultAttribute: CombatAttributeId = nature === "poder" ? "int" : "for";
  return {
    ...emptyEditableAbility("combat"),
    sourceId: ability.id,
    level: ability.level,
    nature,
    name: ability.name,
    description: ability.description,
    damage: ability.damage ?? "",
    damageType: ability.damageType ?? "",
    effect: ability.effect ?? "",
    action: ability.action ?? "A definir",
    range: ability.range ?? "A definir",
    cost: ability.cost ?? "0",
    costResource: ability.costResource ?? (nature === "poder" ? "pa" : "pe"),
    attackSkill: ability.attackSkill || (nature === "poder" ? "ocultismo" : "luta"),
    attackAttribute: ability.attackAttribute || defaultAttribute,
    damageAttribute: ability.damageAttribute || defaultAttribute,
    criticalHit: ability.criticalHit ?? 20,
    criticalMultiplier: ability.criticalMultiplier ?? 2,
  };
}

function synchronizeCatalogCombat(combatAbilities: EditableAbility[], obtainedIds: Set<string>, refreshCatalog = false) {
  const synchronized = combatAbilities.filter(
    (ability) => !ability.sourceId || !CATALOG_ABILITY_IDS.has(ability.sourceId) || obtainedIds.has(ability.sourceId),
  );
  for (const abilityId of obtainedIds) {
    const ability = ABILITIES.find((entry) => entry.id === abilityId);
    if (!ability || !hasDamage(ability.damage)) continue;
    const currentIndex = synchronized.findIndex((entry) => entry.sourceId === abilityId);
    if (currentIndex >= 0) {
      if (refreshCatalog) synchronized[currentIndex] = {
        ...combatAbilityFromCatalog(ability),
        id: synchronized[currentIndex].id,
      };
      continue;
    }
    synchronized.push(combatAbilityFromCatalog(ability));
  }
  return synchronized;
}

function basicUnarmedAttack(): EditableAbility {
  return normalizeEditableAbility({
    id: makeRecordId("combat"),
    sourceId: "basic:soco",
    level: 1,
    nature: "fisica",
    name: "Soco",
    description: "Um ataque desarmado direto.",
    damage: "1d2",
    damageType: "Impacto",
    effect: "Ao acertar, causa o dano indicado.",
    action: "Padrão",
    range: "Corpo a Corpo",
    cost: "0",
    costResource: "nenhum",
    attackSkill: "luta",
    attackAttribute: "for",
    damageAttribute: "for",
    criticalHit: 20,
    criticalMultiplier: 2,
  }, "combat");
}

function rollDamageFormula(formula: string) {
  const normalized = formula.trim().toLowerCase().replace(/\s+/g, "");
  if (!normalized) return null;
  const match = /^(\d*)d(\d+)([+-]\d+)?$/.exec(normalized);
  if (!match) {
    const fixed = Number(normalized);
    return Number.isFinite(fixed) ? { rolls: [] as number[], flat: fixed } : null;
  }
  const baseCount = Math.min(50, Math.max(1, Number(match[1]) || 1));
  const count = baseCount;
  const sides = Math.min(1000, Math.max(2, Number(match[2]) || 2));
  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  return { rolls, flat: Number(match[3]) || 0 };
}

function normalizeAttributeBoosts(raw: Character["attributeBoosts"] | undefined) {
  const normalized: Character["attributeBoosts"] = {};
  for (const milestone of ATTRIBUTE_LEVELS) {
    const source = raw?.[String(milestone)] ?? {};
    let remaining = 6;
    const next: Partial<Record<AttributeId, number>> = {};
    for (const attribute of ATTRIBUTES) {
      const value = Math.min(3, Math.max(0, Math.trunc(Number(source[attribute.id]) || 0)), remaining);
      if (value > 0) next[attribute.id] = value;
      remaining -= value;
    }
    if (Object.keys(next).length) normalized[String(milestone)] = next;
  }
  return normalized;
}

function newCharacter(index = 1, slot = index, maxSlots = MAX_SLOTS, namePrefix = "Novo Desperto"): Character {
  return {
    id: makeId(),
    slot: Math.min(maxSlots, Math.max(1, slot)),
    portrait: "",
    name: `${namePrefix} ${index}`,
    player: "",
    sex: "",
    level: 1,
    classId: "vanguarda",
    originId: ORIGINS[0].id,
    originPrimary: ORIGINS[0].attributes[0],
    baseScores: { ...defaultScores },
    attributeBoosts: {},
    creationSkills: [],
    skillAdvances: {},
    skillUsage: {},
    specialistSkills: [],
    classAbilities: {},
    generalAbilities: {},
    obtainedAbilityIds: [],
    inventory: {},
    armorId: "",
    resourceUsed: { pv: 0, pe: 0, pa: 0 },
    resourceTemporary: { pv: 0, pe: 0, pa: 0 },
    resourceMaximumOverrides: {},
    defenseOverride: null,
    carryLimitOverride: null,
    needs: { ...DEFAULT_NEEDS },
    bodyHealth: { ...DEFAULT_BODY_HEALTH },
    deathMarks: 0,
    customAbilities: [],
    powerAbilities: [],
    combatAbilities: [basicUnarmedAttack()],
    power: { ...emptyPower },
    rulesVersion: CURRENT_RULES_VERSION,
    bio: { ...emptyBio },
    updatedAt: Date.now(),
  };
}

function normalizeCharacter(
  raw: Partial<Character>,
  index: number,
  maxSlots = MAX_SLOTS,
  namePrefix = "Novo Desperto",
): Character {
  const fallback = newCharacter(index, Number(raw.slot) || index, maxSlots, namePrefix);
  const needsRulesMigration = (Number(raw.rulesVersion) || 0) < CURRENT_RULES_VERSION;
  const origin = ORIGINS.find((entry) => entry.id === raw.originId) ?? ORIGINS[0];
  const originPrimary = origin.attributes.includes(raw.originPrimary as AttributeId)
    ? (raw.originPrimary as AttributeId)
    : origin.attributes[0];
  const sex: SexId | "" = raw.sex === "masculino" || raw.sex === "feminino" ? raw.sex : "";
  const inventory = raw.inventory ?? {};
  const selectedAbilityIds = new Set([
    ...Object.values(raw.classAbilities ?? {}),
    ...Object.values(raw.generalAbilities ?? {}),
  ].filter(Boolean));
  const legacyCombatCatalogIds = (raw.combatAbilities ?? [])
    .map((ability) => ability.sourceId ?? "")
    .filter((abilityId) => CATALOG_ABILITY_IDS.has(abilityId));
  const obtainedAbilityIds = Array.from(new Set(
    [...(raw.obtainedAbilityIds ?? []), ...legacyCombatCatalogIds]
      .filter((abilityId) => CATALOG_ABILITY_IDS.has(abilityId)),
  ));
  const obtainedCatalogIds = new Set([...selectedAbilityIds, ...obtainedAbilityIds]);
  const customAbilities = (raw.customAbilities ?? []).map((ability) => normalizeEditableAbility(ability, "custom"));
  const powerAbilities = (raw.powerAbilities ?? []).map((ability) => normalizePowerAbility(ability));
  const ownedAbilityIds = new Set([...customAbilities, ...powerAbilities].map((ability) => ability.id).filter(Boolean));
  let combatAbilities = (raw.combatAbilities ?? [])
    .map((ability) => normalizeEditableAbility(ability, "combat"))
    .filter((ability) => {
      if (!hasDamage(ability.damage)) return false;
      if (!ability.sourceId || ability.sourceId.startsWith("basic:")) return true;
      if (ability.sourceId.startsWith("equipment:")) {
        const itemId = ability.sourceId.slice("equipment:".length);
        return (inventory[itemId] ?? 0) > 0;
      }
      if (CATALOG_ABILITY_IDS.has(ability.sourceId)) return obtainedCatalogIds.has(ability.sourceId);
      if (ownedAbilityIds.has(ability.sourceId)) return true;
      return true;
    });
  for (const item of EQUIPMENT) {
    if (!item.damage || (inventory[item.id] ?? 0) <= 0) continue;
    const sourceId = equipmentAbilitySource(item.id);
    if (!combatAbilities.some((ability) => ability.sourceId === sourceId)) {
      combatAbilities.push(combatAbilityFromEquipment(item));
    }
  }
  combatAbilities = synchronizeCatalogCombat(combatAbilities, obtainedCatalogIds, needsRulesMigration);
  for (const ability of [...customAbilities, ...powerAbilities]) {
    if (!hasDamage(ability.damage) || combatAbilities.some((entry) => entry.sourceId === ability.id)) continue;
    combatAbilities.push({ ...ability, id: makeRecordId("combat"), sourceId: ability.id });
  }
  if (!combatAbilities.some((ability) => ability.sourceId === "basic:soco")) {
    combatAbilities.unshift(basicUnarmedAttack());
  }
  return {
    ...fallback,
    ...raw,
    id: raw.id || fallback.id,
    slot: Math.min(maxSlots, Math.max(1, Number(raw.slot) || fallback.slot)),
    portrait: typeof raw.portrait === "string" ? raw.portrait : "",
    sex,
    classId: raw.classId && raw.classId in CLASSES ? raw.classId : fallback.classId,
    level: Math.min(20, Math.max(1, Number(raw.level) || 1)),
    originId: origin.id,
    originPrimary,
    baseScores: raw.baseScores
      ? { ...defaultScores, ...raw.baseScores }
      : sex
        ? { ...BASE_SCORES_BY_SEX[sex] }
        : { ...defaultScores },
    attributeBoosts: normalizeAttributeBoosts(raw.attributeBoosts),
    creationSkills: raw.creationSkills ?? [],
    skillAdvances: raw.skillAdvances ?? {},
    skillUsage: raw.skillUsage ?? {},
    specialistSkills: raw.specialistSkills ?? [],
    classAbilities: raw.classAbilities ?? {},
    generalAbilities: raw.generalAbilities ?? {},
    obtainedAbilityIds,
    inventory,
    armorId: raw.armorId ?? "",
    resourceUsed: { ...fallback.resourceUsed, ...(raw.resourceUsed ?? {}) },
    resourceTemporary: { ...fallback.resourceTemporary, ...(raw.resourceTemporary ?? {}) },
    resourceMaximumOverrides: Object.fromEntries(
      (["pv", "pe", "pa"] as ResourceId[]).map((resource) => {
        const value = raw.resourceMaximumOverrides?.[resource];
        return [resource, typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null];
      }),
    ),
    defenseOverride: typeof raw.defenseOverride === "number" && Number.isFinite(raw.defenseOverride)
      ? Math.max(0, Math.trunc(raw.defenseOverride))
      : null,
    carryLimitOverride: typeof raw.carryLimitOverride === "number" && Number.isFinite(raw.carryLimitOverride)
      ? Math.max(0, raw.carryLimitOverride)
      : null,
    needs: {
      fome: clampNeedLevel(raw.needs?.fome ?? DEFAULT_NEEDS.fome),
      sede: clampNeedLevel(raw.needs?.sede ?? DEFAULT_NEEDS.sede),
      sono: clampNeedLevel(raw.needs?.sono ?? DEFAULT_NEEDS.sono),
    },
    bodyHealth: {
      cabeca: clampBodyHealth(raw.bodyHealth?.cabeca ?? DEFAULT_BODY_HEALTH.cabeca),
      tronco: clampBodyHealth(raw.bodyHealth?.tronco ?? DEFAULT_BODY_HEALTH.tronco),
      bracoEsquerdo: clampBodyHealth(raw.bodyHealth?.bracoEsquerdo ?? DEFAULT_BODY_HEALTH.bracoEsquerdo),
      bracoDireito: clampBodyHealth(raw.bodyHealth?.bracoDireito ?? DEFAULT_BODY_HEALTH.bracoDireito),
      pernaEsquerda: clampBodyHealth(raw.bodyHealth?.pernaEsquerda ?? DEFAULT_BODY_HEALTH.pernaEsquerda),
      pernaDireita: clampBodyHealth(raw.bodyHealth?.pernaDireita ?? DEFAULT_BODY_HEALTH.pernaDireita),
    },
    deathMarks: Math.min(3, Math.max(0, Math.trunc(Number(raw.deathMarks) || 0))),
    customAbilities,
    powerAbilities,
    combatAbilities,
    power: { ...emptyPower, ...(raw.power ?? {}) },
    rulesVersion: CURRENT_RULES_VERSION,
    bio: { ...emptyBio, ...(raw.bio ?? {}) },
    updatedAt: raw.updatedAt ?? Date.now(),
  };
}

function normalizeCharacterList(raw: Partial<Character>[], maxSlots = MAX_SLOTS, namePrefix = "Novo Desperto") {
  const occupied = new Set<number>();
  const usedIds = new Set<string>();
  return raw.slice(0, maxSlots).map((entry, index) => {
    const requested = Number(entry.slot);
    const slot = Number.isInteger(requested) && requested >= 1 && requested <= maxSlots && !occupied.has(requested)
      ? requested
      : Array.from({ length: maxSlots }, (_, slotIndex) => slotIndex + 1).find((candidate) => !occupied.has(candidate)) ?? index + 1;
    occupied.add(slot);
    const requestedId = typeof entry.id === "string" && entry.id.trim() ? entry.id : "";
    const id = requestedId && !usedIds.has(requestedId) ? requestedId : makeId();
    usedIds.add(id);
    return normalizeCharacter({ ...entry, id, slot }, index + 1, maxSlots, namePrefix);
  });
}

async function resizePortrait(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("invalid-image");
  const objectUrl = URL.createObjectURL(file);
  try {
    const source = new Image();
    source.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      source.onload = () => resolve();
      source.onerror = () => reject(new Error("invalid-image"));
    });

    const width = 600;
    const height = 750;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas-unavailable");

    const scale = Math.max(width / source.naturalWidth, height / source.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (source.naturalWidth - sourceWidth) / 2;
    const sourceY = (source.naturalHeight - sourceHeight) / 2;
    context.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function levelBenefits(level: number) {
  if (level === 1) return ["Criação", "Classe", "Origem", "Passiva inicial"];
  const benefits: string[] = [];
  if (level % 2 === 0) benefits.push("Habilidade Geral", "Habilidade de Classe");
  if (level % 3 === 0) benefits.push("Avanço de perícia");
  if (level % 4 === 0) benefits.push("6 pontos de atributo");
  if (level === 12) benefits.push("Acesso ao grau Mestre");
  if (!benefits.length) benefits.push("Crescimento de PV, PE e PA");
  return benefits;
}

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [npcs, setNpcs] = useState<Character[]>([]);
  const [sheetKind, setSheetKind] = useState<"player" | "npc">("player");
  const [activeId, setActiveId] = useState("");
  const [screen, setScreen] = useState<AppScreen>("inicio");
  const [masterPassword, setMasterPassword] = useState("");
  const [masterUnlocked, setMasterUnlocked] = useState(false);
  const [masterError, setMasterError] = useState("");
  const [npcSlotPage, setNpcSlotPage] = useState(1);
  const [section, setSection] = useState<SectionId>("identidade");
  const [hydrated, setHydrated] = useState(false);
  const [equipmentCategory, setEquipmentCategory] = useState<EquipmentCategory>("branca");
  const [abilitySearch, setAbilitySearch] = useState("");
  const [abilityView, setAbilityView] = useState<AbilityView>("obtidas");
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("classe");
  const [catalogBand, setCatalogBand] = useState<CatalogBand>("1-4");
  const [obtainedPage, setObtainedPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => new Set());
  const catalogCloseTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [customDraft, setCustomDraft] = useState<EditableAbility>(() => emptyEditableAbility("custom"));
  const [editingCustomId, setEditingCustomId] = useState("");
  const [powerAbilityPage, setPowerAbilityPage] = useState(1);
  const [powerAbilityDraft, setPowerAbilityDraft] = useState<EditableAbility>(() => emptyPowerAbility());
  const [editingPowerAbilityId, setEditingPowerAbilityId] = useState("");
  const [showPowerAbilityModal, setShowPowerAbilityModal] = useState(false);
  const [combatDraft, setCombatDraft] = useState<EditableAbility>(() => emptyEditableAbility("combat"));
  const [showCombatForm, setShowCombatForm] = useState(false);
  const [editingCombatId, setEditingCombatId] = useState("");
  const [rollMode, setRollMode] = useState<RollMode>("normal");
  const [floatingRoll, setFloatingRoll] = useState<FloatingRollEntry | null>(null);
  const [rollDockOpen, setRollDockOpen] = useState(false);

  const pushFloatingRoll = (entry: FloatingRollEntry) => {
    setFloatingRoll(entry);
    setRollDockOpen(true);
  };

  const toggleCard = (cardId: string) => {
    setExpandedCards((current) => {
      const next = new Set(current);
      const wasExpanded = next.has(cardId);
      if (wasExpanded) next.delete(cardId);
      else next.add(cardId);
      if (cardId.startsWith("catalog:")) {
        clearTimeout(catalogCloseTimers.current[cardId]);
        delete catalogCloseTimers.current[cardId];
        if (!wasExpanded) {
          catalogCloseTimers.current[cardId] = setTimeout(() => {
            setExpandedCards((openCards) => {
              const closed = new Set(openCards);
              closed.delete(cardId);
              return closed;
            });
            delete catalogCloseTimers.current[cardId];
          }, 25_000);
        }
      }
      return next;
    });
  };

  useEffect(() => () => {
    for (const timer of Object.values(catalogCloseTimers.current)) clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showPowerAbilityModal) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setShowPowerAbilityModal(false);
      setEditingPowerAbilityId("");
      setPowerAbilityDraft(emptyPowerAbility());
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showPowerAbilityModal]);

  useEffect(() => {
    if (!rollDockOpen) return;
    const closeOnAnyClick = () => setRollDockOpen(false);
    window.addEventListener("pointerdown", closeOnAnyClick);
    return () => window.removeEventListener("pointerdown", closeOnAnyClick);
  }, [rollDockOpen]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(OLD_STORAGE_KEY);
        const parsed = saved ? (JSON.parse(saved) as Partial<Character>[]) : [];
        const initial = Array.isArray(parsed) ? normalizeCharacterList(parsed) : [];
        setCharacters(initial);
        setActiveId(initial[0]?.id ?? "");
      } catch {
        setCharacters([]);
        setActiveId("");
      }
      try {
        const savedNpcs = localStorage.getItem(NPC_STORAGE_KEY);
        const parsedNpcs = savedNpcs ? (JSON.parse(savedNpcs) as Partial<Character>[]) : [];
        setNpcs(Array.isArray(parsedNpcs) ? normalizeCharacterList(parsedNpcs, MAX_NPC_SLOTS, "Novo NPC") : []);
      } catch {
        setNpcs([]);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
  }, [characters, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(NPC_STORAGE_KEY, JSON.stringify(npcs));
  }, [npcs, hydrated]);

  const activeCollection = sheetKind === "npc" ? npcs : characters;
  const character = activeCollection.find((entry) => entry.id === activeId) ?? activeCollection[0];
  const origin = ORIGINS.find((entry) => entry.id === character?.originId) ?? ORIGINS[0];
  const classData = character ? CLASSES[character.classId] : CLASSES.vanguarda;
  const masterEditMode = sheetKind === "npc" && masterUnlocked;

  const update = (patch: Partial<Character>) => {
    if (!character) return;
    const applyPatch = (current: Character[]) => current.map((entry) =>
      entry.id === character.id ? { ...entry, ...patch, updatedAt: Date.now() } : entry,
    );
    if (sheetKind === "npc") setNpcs(applyPatch);
    else setCharacters(applyPatch);
  };

  const activeCatalogAbilities = useMemo(() => {
    if (!character) return [] as Ability[];
    const ids = new Set<string>();
    const passive = ABILITIES.find(
      (ability) => ability.group === character.classId && ability.name === classData.passive.name,
    );
    if (passive) ids.add(passive.id);
    for (const [level, abilityId] of [
      ...Object.entries(character.classAbilities),
      ...Object.entries(character.generalAbilities),
    ]) {
      if (abilityId && (masterEditMode || Number(level) <= character.level)) ids.add(abilityId);
    }
    for (const abilityId of character.obtainedAbilityIds) ids.add(abilityId);
    return ABILITIES.filter((ability) => ids.has(ability.id));
  }, [character, classData, masterEditMode]);

  const automaticBuffs = useMemo(() => {
    const merged: AbilityBuffs = { resources: {}, skills: {} };
    for (const ability of activeCatalogAbilities) mergeAbilityBuffs(merged, ability.buffs);
    for (const ability of [...(character?.customAbilities ?? []), ...(character?.powerAbilities ?? [])]) {
      mergeAbilityBuffs(merged, buffsFromEditableAbility(ability));
    }
    return merged;
  }, [activeCatalogAbilities, character?.customAbilities, character?.powerAbilities]);

  const initialScores = useMemo(() => {
    if (!character) return { ...defaultScores };
    const next = { ...character.baseScores };
    const primary = origin.attributes.includes(character.originPrimary)
      ? character.originPrimary
      : origin.attributes[0];
    for (const attribute of origin.attributes) next[attribute] += attribute === primary ? 2 : 1;
    return next;
  }, [character, origin]);

  const scores = useMemo(() => {
    const next = { ...initialScores };
    if (!character) return next;
    for (const milestone of ATTRIBUTE_LEVELS) {
      if (milestone > character.level) continue;
      const boosts = character.attributeBoosts[String(milestone)] ?? {};
      for (const attribute of ATTRIBUTES) next[attribute.id] += boosts[attribute.id] ?? 0;
    }
    return next;
  }, [character, initialScores]);

  const mods = useMemo(
    () =>
      Object.fromEntries(ATTRIBUTES.map((attribute) => [attribute.id, modifier(scores[attribute.id])])) as Record<
        AttributeId,
        number
      >,
    [scores],
  );

  const armor = EQUIPMENT.find((item) => item.id === character?.armorId && item.category === "armadura");

  const calculatedMaximums = useMemo(() => {
    const level = character?.level ?? 1;
    return {
      pv: Math.max(0, classData.initial.pv + mods.vig + (level - 1) * Math.max(1, classData.growth.pv + mods.vig) + (automaticBuffs.resources?.pv ?? 0)),
      pe: Math.max(0, classData.initial.pe + mods.for + (level - 1) * Math.max(1, classData.growth.pe + mods.for) + (automaticBuffs.resources?.pe ?? 0)),
      pa: Math.max(0, classData.initial.pa + mods.int + (level - 1) * Math.max(1, classData.growth.pa + mods.int) + (automaticBuffs.resources?.pa ?? 0)),
      defense: Math.max(0, 10 + mods.vig + (armor?.defense ?? 0) + (automaticBuffs.defense ?? 0)),
    };
  }, [character?.level, classData, mods, armor, automaticBuffs]);

  const maximums = {
    pv: character?.resourceMaximumOverrides.pv ?? calculatedMaximums.pv,
    pe: character?.resourceMaximumOverrides.pe ?? calculatedMaximums.pe,
    pa: character?.resourceMaximumOverrides.pa ?? calculatedMaximums.pa,
    defense: character?.defenseOverride ?? calculatedMaximums.defense,
  };

  const baseCurrents = {
    pv: Math.max(0, maximums.pv - (character?.resourceUsed.pv ?? 0)),
    pe: Math.max(0, maximums.pe - (character?.resourceUsed.pe ?? 0)),
    pa: Math.max(0, maximums.pa - (character?.resourceUsed.pa ?? 0)),
  };
  const currents = {
    pv: baseCurrents.pv + (character?.resourceTemporary.pv ?? 0),
    pe: baseCurrents.pe + (character?.resourceTemporary.pe ?? 0),
    pa: baseCurrents.pa + (character?.resourceTemporary.pa ?? 0),
  };

  const originSkillIds = useMemo(() => origin.skills.map(skillIdByName).filter(Boolean), [origin]);
  const creationSkillReference = Math.max(0, classData.initialSkills + modifier(initialScores.int));
  const skillAdvanceReference = Math.floor((character?.level ?? 1) / 3);
  const skillAdvancesUsed = Object.values(character?.skillAdvances ?? {}).reduce((sum, value) => sum + value, 0);
  const inventoryWeight = EQUIPMENT.reduce(
    (total, item) => total + item.weight * (character?.inventory[item.id] ?? 0),
    0,
  );
  const carriedItems = EQUIPMENT.filter((item) => (character?.inventory[item.id] ?? 0) > 0);
  const carriedUnits = carriedItems.reduce((total, item) => total + (character?.inventory[item.id] ?? 0), 0);
  const backpackCapacity = (character?.inventory.mochila ?? 0) > 0
    ? EQUIPMENT.find((item) => item.id === "mochila")?.capacityBonus ?? 8
    : 0;
  const calculatedCarryLimit = Math.max(
    0,
    Math.floor(scores.for / 4) * 3.5 + backpackCapacity + (automaticBuffs.carryCapacity ?? 0),
  );
  const carryLimit = character?.carryLimitOverride ?? calculatedCarryLimit;
  const loadPercent = carryLimit > 0 ? Math.min(100, (inventoryWeight / carryLimit) * 100) : inventoryWeight > 0 ? 100 : 0;

  const getSkillGrade = (skillId: string) => {
    const baseline = originSkillIds.includes(skillId) || character?.creationSkills.includes(skillId) ? 1 : 0;
    return Math.min(3, baseline + Math.max(0, character?.skillAdvances[skillId] ?? 0));
  };

  const getSkillTotal = (skillId: string) => {
    const grade = SKILL_GRADES[getSkillGrade(skillId)];
    const usage = character?.skillUsage[skillId] ?? 0;
    const specialist = character?.classId === "especialista" && character.specialistSkills.includes(skillId) && getSkillGrade(skillId) >= 1 ? 2 : 0;
    const abilityBonusValue = automaticBuffs.skills?.[skillId] ?? 0;
    return grade.bonus + usage + specialist + abilityBonusValue;
  };

  const setBaseScore = (attributeId: AttributeId, value: number) => {
    if (!character || !masterEditMode) return;
    update({ baseScores: { ...character.baseScores, [attributeId]: Number.isFinite(value) ? value : 0 } });
  };

  const changeSex = (sex: SexId) => {
    if (!character) return;
    update({
      sex,
      baseScores: { ...BASE_SCORES_BY_SEX[sex] },
    });
  };

  const changeOrigin = (originId: string) => {
    const nextOrigin = ORIGINS.find((entry) => entry.id === originId) ?? ORIGINS[0];
    update({ originId, originPrimary: nextOrigin.attributes[0] });
  };

  const setNeedLevel = (need: NeedId, value: number) => {
    if (!character) return;
    update({
      needs: {
        ...character.needs,
        [need]: clampNeedLevel(value),
      },
    });
  };

  const setBodyPartHealth = (bodyPart: BodyPartId, value: number) => {
    if (!character) return;
    update({
      bodyHealth: {
        ...character.bodyHealth,
        [bodyPart]: clampBodyHealth(value),
      },
    });
  };

  const setDeathMarks = (marks: number) => {
    if (!character) return;
    update({ deathMarks: Math.min(3, Math.max(0, Math.trunc(marks))) });
  };

  const resurrectCharacter = () => {
    if (!character) return;
    update({
      resourceUsed: { ...character.resourceUsed, pv: 0 },
      resourceTemporary: { ...character.resourceTemporary, pv: 0 },
      deathMarks: 0,
    });
  };

  const availablePlayerSlots = Array.from({ length: MAX_SLOTS }, (_, index) => index + 1).filter(
    (slot) => !characters.some((entry) => entry.slot === slot),
  );
  const availableNpcSlots = Array.from({ length: MAX_NPC_SLOTS }, (_, index) => index + 1).filter(
    (slot) => !npcs.some((entry) => entry.slot === slot),
  );
  const activeAvailableSlots = sheetKind === "npc" ? availableNpcSlots : availablePlayerSlots;
  const activeSlotLimit = sheetKind === "npc" ? MAX_NPC_SLOTS : MAX_SLOTS;

  const prepareSheet = (kind: "player" | "npc", characterId: string) => {
    setSheetKind(kind);
    setActiveId(characterId);
    setObtainedPage(1);
    setPowerAbilityPage(1);
    setShowPowerAbilityModal(false);
    setExpandedCards(new Set());
    setSection("identidade");
    setScreen("ficha");
  };

  const openCharacter = (characterId: string) => {
    prepareSheet("player", characterId);
  };

  const openNpc = (npcId: string) => prepareSheet("npc", npcId);

  const addCharacter = (requestedSlot?: number) => {
    const slot = typeof requestedSlot === "number" && availablePlayerSlots.includes(requestedSlot)
      ? requestedSlot
      : availablePlayerSlots[0];
    if (!slot) {
      window.alert("Os cinco slots já estão ocupados. Exclua uma ficha para criar outra.");
      return;
    }
    const created = newCharacter(slot, slot);
    setCharacters((current) => [...current, created]);
    prepareSheet("player", created.id);
  };

  const addNpc = (requestedSlot?: number) => {
    const slot = typeof requestedSlot === "number" && availableNpcSlots.includes(requestedSlot)
      ? requestedSlot
      : availableNpcSlots[0];
    if (!slot) {
      window.alert("Os 30 slots de NPCs já estão ocupados. Exclua uma ficha para criar outra.");
      return;
    }
    const created = newCharacter(slot, slot, MAX_NPC_SLOTS, "Novo NPC");
    setNpcs((current) => [...current, created]);
    prepareSheet("npc", created.id);
  };

  const duplicateCharacter = () => {
    if (!character) return;
    const slot = activeAvailableSlots[0];
    if (!slot) {
      window.alert("Não há slot livre para duplicar esta ficha.");
      return;
    }
    const copy = normalizeCharacter(
      { ...character, id: makeId(), slot, name: `${character.name} — cópia` },
      slot,
      activeSlotLimit,
      sheetKind === "npc" ? "Novo NPC" : "Novo Desperto",
    );
    if (sheetKind === "npc") setNpcs((current) => [...current, copy]);
    else setCharacters((current) => [...current, copy]);
    setActiveId(copy.id);
    setObtainedPage(1);
    setPowerAbilityPage(1);
    setShowPowerAbilityModal(false);
    setExpandedCards(new Set());
  };

  const deleteCharacterById = (characterId: string) => {
    const target = characters.find((entry) => entry.id === characterId);
    if (!target || !window.confirm(`Excluir permanentemente a ficha de ${target.name}?`)) return;
    const remaining = characters.filter((entry) => entry.id !== characterId);
    setCharacters(remaining);
    if (activeId === characterId) setActiveId(remaining[0]?.id ?? "");
    setScreen("slots");
  };

  const deleteNpcById = (npcId: string) => {
    const target = npcs.find((entry) => entry.id === npcId);
    if (!target || !window.confirm(`Excluir permanentemente a ficha de ${target.name}?`)) return;
    const remaining = npcs.filter((entry) => entry.id !== npcId);
    setNpcs(remaining);
    if (activeId === npcId) setActiveId(remaining[0]?.id ?? "");
    setScreen("mestre");
  };

  const deleteCharacter = () => {
    if (!character) return;
    if (sheetKind === "npc") deleteNpcById(character.id);
    else deleteCharacterById(character.id);
  };

  const uploadPortrait = async (characterId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const portrait = await resizePortrait(file);
      setCharacters((current) => current.map((entry) =>
        entry.id === characterId ? { ...entry, portrait, updatedAt: Date.now() } : entry,
      ));
      setNpcs((current) => current.map((entry) =>
        entry.id === characterId ? { ...entry, portrait, updatedAt: Date.now() } : entry,
      ));
    } catch {
      window.alert("Não foi possível usar essa imagem. Escolha um arquivo JPG, PNG ou WEBP válido.");
    }
    event.target.value = "";
  };

  const removePortrait = (characterId: string) => {
    setCharacters((current) => current.map((entry) =>
      entry.id === characterId ? { ...entry, portrait: "", updatedAt: Date.now() } : entry,
    ));
    setNpcs((current) => current.map((entry) =>
      entry.id === characterId ? { ...entry, portrait: "", updatedAt: Date.now() } : entry,
    ));
  };

  const exportCharacter = (characterId: string, kind: "player" | "npc" = sheetKind) => {
    const collection = kind === "npc" ? npcs : characters;
    const target = collection.find((entry) => entry.id === characterId);
    if (!target) return;
    const blob = new Blob([JSON.stringify(target, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `supacell-${kind === "npc" ? "npc" : "ficha"}-${safeFileName(target.name)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importCharacter = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: "player" | "npc" = sheetKind,
    requestedSlot?: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Partial<Character>[] | Partial<Character> | { character?: Partial<Character> };
      const rawEntry = Array.isArray(data)
        ? data[0]
        : data && typeof data === "object" && "character" in data && data.character
          ? data.character
          : data as Partial<Character>;
      const collection = kind === "npc" ? npcs : characters;
      const limit = kind === "npc" ? MAX_NPC_SLOTS : MAX_SLOTS;
      const availableSlots = Array.from({ length: limit }, (_, index) => index + 1)
        .filter((slot) => !collection.some((entry) => entry.slot === slot));
      const slot = typeof requestedSlot === "number" && availableSlots.includes(requestedSlot)
        ? requestedSlot
        : availableSlots[0];
      if (!rawEntry || typeof rawEntry !== "object" || !slot) {
        window.alert("Não há slots livres para importar fichas.");
        event.target.value = "";
        return;
      }
      const incoming = normalizeCharacter(
        { ...rawEntry, id: makeId(), slot },
        slot,
        limit,
        kind === "npc" ? "Novo NPC" : "Novo Desperto",
      );
      if (kind === "npc") setNpcs((current) => [...current, incoming]);
      else setCharacters((current) => [...current, incoming]);
      setActiveId(incoming.id);
    } catch {
      window.alert("Este arquivo não contém uma ficha válida.");
    }
    event.target.value = "";
  };

  const setResourceCurrent = (resource: ResourceId, value: number) => {
    if (!character) return;
    const maximum = maximums[resource];
    const desired = Math.max(0, Math.floor(Number(value) || 0));
    const nextUsed = desired < maximum ? maximum - desired : 0;
    const nextTemporary = desired > maximum ? desired - maximum : 0;
    update({
      resourceUsed: { ...character.resourceUsed, [resource]: nextUsed },
      resourceTemporary: { ...character.resourceTemporary, [resource]: nextTemporary },
    });
  };

  const setResourceMaximum = (resource: ResourceId, value: number | null) => {
    if (!character) return;
    const nextMaximum = value === null
      ? calculatedMaximums[resource]
      : Math.max(0, Math.floor(Number(value) || 0));
    const desiredCurrent = currents[resource];
    update({
      resourceMaximumOverrides: {
        ...character.resourceMaximumOverrides,
        [resource]: value === null ? null : nextMaximum,
      },
      resourceUsed: {
        ...character.resourceUsed,
        [resource]: desiredCurrent < nextMaximum ? nextMaximum - desiredCurrent : 0,
      },
      resourceTemporary: {
        ...character.resourceTemporary,
        [resource]: desiredCurrent > nextMaximum ? desiredCurrent - nextMaximum : 0,
      },
    });
  };

  const setDefense = (value: number | null) => {
    if (!character) return;
    update({
      defenseOverride: value === null ? null : Math.max(0, Math.floor(Number(value) || 0)),
    });
  };

  const setCarryLimit = (value: number | null) => {
    if (!character) return;
    update({
      carryLimitOverride: value === null ? null : Math.max(0, Number(value) || 0),
    });
  };

  const setTemporaryResource = (resource: ResourceId, value: number) => {
    if (!character) return;
    update({
      resourceTemporary: {
        ...character.resourceTemporary,
        [resource]: Math.max(0, Math.floor(Number(value) || 0)),
      },
    });
  };

  const toggleCreationSkill = (skillId: string) => {
    if (!character || originSkillIds.includes(skillId)) return;
    const selected = character.creationSkills.includes(skillId);
    update({
      creationSkills: selected
        ? character.creationSkills.filter((id) => id !== skillId)
        : [...character.creationSkills, skillId],
    });
  };

  const adjustSkillAdvance = (skillId: string, delta: number) => {
    if (!character) return;
    const current = character.skillAdvances[skillId] ?? 0;
    const baseline = originSkillIds.includes(skillId) || character.creationSkills.includes(skillId) ? 1 : 0;
    const next = Math.min(3 - baseline, Math.max(0, current + delta));
    update({ skillAdvances: { ...character.skillAdvances, [skillId]: next } });
  };

  const toggleSpecialistSkill = (skillId: string) => {
    if (!character) return;
    const selected = character.specialistSkills.includes(skillId);
    if (!selected && character.specialistSkills.length >= 2) return;
    update({
      specialistSkills: selected
        ? character.specialistSkills.filter((id) => id !== skillId)
        : [...character.specialistSkills, skillId],
    });
  };

  const rollSkill = (skill: { id: string; name: string; attribute: AttributeId }) => {
    const die = Math.floor(Math.random() * 20) + 1;
    const attributeModifier = mods[skill.attribute];
    const skillBonus = getSkillTotal(skill.id);
    const total = die + attributeModifier + skillBonus;
    const tone: SkillRollResult["tone"] = die === 20 ? "critical" : total < 10 ? "failure" : "neutral";
    const result: SkillRollResult = {
      id: makeRecordId("skill-roll"),
      skillName: skill.name,
      attribute: skill.attribute,
      die,
      attributeModifier,
      skillBonus,
      total,
      tone,
    };
    pushFloatingRoll({ kind: "skill", result });
  };

  const adjustAttributeBoost = (milestone: number, attribute: AttributeId, delta: number) => {
    if (!character || (!masterEditMode && character.level < milestone)) return;
    const key = String(milestone);
    const currentMilestone = character.attributeBoosts[key] ?? {};
    const current = currentMilestone[attribute] ?? 0;
    const used = Object.values(currentMilestone).reduce((sum, value) => sum + (value ?? 0), 0);
    if (delta > 0 && (used >= 6 || current >= 3)) return;
    const next = Math.min(3, Math.max(0, current + delta));
    update({
      attributeBoosts: {
        ...character.attributeBoosts,
        [key]: { ...currentMilestone, [attribute]: next },
      },
    });
  };

  const selectAbility = (kind: "class" | "general", level: number, id: string) => {
    if (!character) return;
    const field = kind === "class" ? "classAbilities" : "generalAbilities";
    const nextField = { ...character[field], [String(level)]: id };
    const nextClassAbilities = kind === "class" ? nextField : character.classAbilities;
    const nextGeneralAbilities = kind === "general" ? nextField : character.generalAbilities;
    const obtainedIds = new Set([
      ...Object.values(nextClassAbilities),
      ...Object.values(nextGeneralAbilities),
      ...character.obtainedAbilityIds,
    ].filter(Boolean));
    update({
      [field]: nextField,
      combatAbilities: synchronizeCatalogCombat(character.combatAbilities, obtainedIds),
    });
  };

  const changeClass = (classId: ClassId) => {
    if (!character) return;
    const obtainedIds = new Set([
      ...Object.values(character.generalAbilities),
      ...character.obtainedAbilityIds,
    ].filter(Boolean));
    update({
      classId,
      classAbilities: {},
      combatAbilities: synchronizeCatalogCombat(character.combatAbilities, obtainedIds),
    });
  };

  const saveCustomAbility = () => {
    if (!character || !customDraft.name.trim()) return;
    const saved = { ...customDraft, name: customDraft.name.trim() };
    let combatAbilities = character.combatAbilities;
    if (editingCustomId) {
      combatAbilities = hasDamage(saved.damage)
        ? combatAbilities.map((ability) => ability.sourceId === editingCustomId ? { ...saved, id: ability.id, sourceId: editingCustomId } : ability)
        : combatAbilities.filter((ability) => ability.sourceId !== editingCustomId);
      if (hasDamage(saved.damage) && !combatAbilities.some((ability) => ability.sourceId === editingCustomId)) {
        combatAbilities = [...combatAbilities, { ...saved, id: makeRecordId("combat"), sourceId: editingCustomId }];
      }
    } else if (hasDamage(saved.damage)) {
      combatAbilities = [...combatAbilities, { ...saved, id: makeRecordId("combat"), sourceId: saved.id }];
    }
    update({
      customAbilities: editingCustomId
        ? character.customAbilities.map((ability) => ability.id === editingCustomId ? saved : ability)
        : [...character.customAbilities, saved],
      combatAbilities,
    });
    setCustomDraft(emptyEditableAbility("custom"));
    setEditingCustomId("");
  };

  const editCustomAbility = (ability: EditableAbility) => {
    setCustomDraft({ ...ability });
    setEditingCustomId(ability.id);
    setAbilityView("adicionar");
  };

  const deleteCustomAbility = (abilityId: string) => {
    if (!character) return;
    update({
      customAbilities: character.customAbilities.filter((ability) => ability.id !== abilityId),
      combatAbilities: character.combatAbilities.filter((ability) => ability.sourceId !== abilityId),
    });
    if (editingCustomId === abilityId) {
      setCustomDraft(emptyEditableAbility("custom"));
      setEditingCustomId("");
    }
  };

  const addAbilityToCombat = (ability: EditableAbility) => {
    if (!character || !hasDamage(ability.damage) || character.combatAbilities.some((entry) => entry.sourceId === (ability.sourceId ?? ability.id))) return;
    const combatAbility = {
      ...ability,
      id: makeRecordId("combat"),
      sourceId: ability.sourceId ?? ability.id,
    };
    update({ combatAbilities: [...character.combatAbilities, combatAbility] });
  };

  const addCatalogAbilityToCombat = (ability: Ability) => addAbilityToCombat(combatAbilityFromCatalog(ability));

  const addCatalogAbility = (ability: Ability) => {
    if (!character) return;
    const obtainedAbilityIds = character.obtainedAbilityIds.includes(ability.id)
      ? character.obtainedAbilityIds
      : [...character.obtainedAbilityIds, ability.id];
    const obtainedIds = new Set([
      ...Object.values(character.classAbilities),
      ...Object.values(character.generalAbilities),
      ...obtainedAbilityIds,
    ].filter(Boolean));
    update({
      obtainedAbilityIds,
      combatAbilities: synchronizeCatalogCombat(character.combatAbilities, obtainedIds),
    });
  };

  const saveCombatDraft = () => {
    if (!character || !combatDraft.name.trim() || !hasDamage(combatDraft.damage)) return;
    update({ combatAbilities: [...character.combatAbilities, { ...combatDraft, name: combatDraft.name.trim() }] });
    setCombatDraft(emptyEditableAbility("combat"));
    setShowCombatForm(false);
  };

  const updateCombatAbility = (abilityId: string, next: EditableAbility) => {
    if (!character) return;
    update({ combatAbilities: character.combatAbilities.map((ability) => ability.id === abilityId ? next : ability) });
  };

  const deleteCombatAbility = (abilityId: string) => {
    if (!character) return;
    update({ combatAbilities: character.combatAbilities.filter((ability) => ability.id !== abilityId) });
    if (editingCombatId === abilityId) setEditingCombatId("");
  };

  const rollCombatAbility = (ability: EditableAbility) => {
    const diceCount = rollMode === "normal" ? 1 : 2;
    const attackDice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 20) + 1);
    const chosenDie = rollMode === "vantagem" ? Math.max(...attackDice) : rollMode === "desvantagem" ? Math.min(...attackDice) : attackDice[0];
    const attackAttributeModifier = mods[ability.attackAttribute];
    const attackSkill = SKILLS.find((skill) => skill.id === ability.attackSkill);
    const attackSkillBonus = attackSkill ? getSkillTotal(attackSkill.id) : 0;
    const attackModifier = attackAttributeModifier + attackSkillBonus + ability.attackBonus;
    const attackTotal = chosenDie + attackModifier;
    const criticalHit = Math.min(20, Math.max(1, Math.trunc(ability.criticalHit || 20)));
    const criticalMultiplier = Math.max(1, Math.trunc(ability.criticalMultiplier || 2));
    const critical = chosenDie >= criticalHit;
    const tone: RollResult["tone"] = critical ? "critical" : attackTotal < 10 ? "failure" : "neutral";
    const label = critical ? `Crítico ×${criticalMultiplier}` : attackTotal < 10 ? "Resultado abaixo de 10" : "Resultado do teste";
    const damage = rollDamageFormula(ability.damage);
    const damageModifier = damage ? damage.flat + mods[ability.damageAttribute] + ability.damageBonus : 0;
    const baseDamageTotal = damage ? Math.max(0, damage.rolls.reduce((sum, roll) => sum + roll, 0) + damageModifier) : null;
    const damageTotal = baseDamageTotal === null ? null : critical ? baseDamageTotal * criticalMultiplier : baseDamageTotal;
    const cost = Math.max(0, Number.parseInt(ability.cost, 10) || 0);
    const costText = cost > 0 && ability.costResource !== "nenhum" ? `${cost} ${ability.costResource.toUpperCase()}` : "Sem custo";
    if (cost > 0 && ability.costResource !== "nenhum") {
      setResourceCurrent(ability.costResource, currents[ability.costResource] - cost);
    }
    const result: RollResult = {
      id: makeRecordId("roll"),
      abilityName: ability.name,
      nature: ability.nature,
      attackDice,
      attackAttributeModifier,
      attackSkillName: attackSkill?.name ?? "Sem perícia",
      attackSkillBonus,
      attackFreeBonus: ability.attackBonus,
      attackModifier,
      attackTotal,
      tone,
      label,
      critical,
      criticalMultiplier,
      damageRolls: damage?.rolls ?? [],
      damageModifier,
      baseDamageTotal,
      damageTotal,
      damageType: ability.damageType,
      costText,
    };
    pushFloatingRoll({ kind: "combat", result });
  };

  const changeInventory = (itemId: string, delta: number) => {
    if (!character) return;
    const currentQuantity = character.inventory[itemId] ?? 0;
    const nextQuantity = Math.max(0, currentQuantity + delta);
    const inventory = { ...character.inventory, [itemId]: nextQuantity };
    const armorId = itemId === character.armorId && nextQuantity === 0 ? "" : character.armorId;
    const item = EQUIPMENT.find((entry) => entry.id === itemId);
    const sourceId = equipmentAbilitySource(itemId);
    let combatAbilities = character.combatAbilities;
    if (item?.damage && currentQuantity === 0 && nextQuantity > 0 && !combatAbilities.some((ability) => ability.sourceId === sourceId)) {
      combatAbilities = [...combatAbilities, combatAbilityFromEquipment(item)];
    } else if (currentQuantity > 0 && nextQuantity === 0) {
      combatAbilities = combatAbilities.filter((ability) => ability.sourceId !== sourceId);
    }
    update({ inventory, armorId, combatAbilities });
  };

  const updatePower = (field: keyof Character["power"], value: string) => {
    if (!character) return;
    update({ power: { ...character.power, [field]: value } });
  };

  const closePowerAbilityModal = () => {
    setShowPowerAbilityModal(false);
    setEditingPowerAbilityId("");
    setPowerAbilityDraft(emptyPowerAbility());
  };

  const openNewPowerAbility = () => {
    setEditingPowerAbilityId("");
    setPowerAbilityDraft(emptyPowerAbility());
    setShowPowerAbilityModal(true);
  };

  const editPowerAbility = (ability: EditableAbility) => {
    setEditingPowerAbilityId(ability.id);
    setPowerAbilityDraft({ ...ability });
    setShowPowerAbilityModal(true);
  };

  const savePowerAbility = () => {
    if (!character || !powerAbilityDraft.name.trim()) return;
    const saved = normalizePowerAbility({
      ...powerAbilityDraft,
      name: powerAbilityDraft.name.trim(),
    });
    const nextPowerAbilities = editingPowerAbilityId
      ? character.powerAbilities.map((ability) => ability.id === editingPowerAbilityId ? saved : ability)
      : [...character.powerAbilities, saved];
    let combatAbilities = character.combatAbilities;
    if (editingPowerAbilityId) {
      combatAbilities = hasDamage(saved.damage)
        ? combatAbilities.map((ability) => ability.sourceId === editingPowerAbilityId
          ? { ...saved, id: ability.id, sourceId: editingPowerAbilityId }
          : ability)
        : combatAbilities.filter((ability) => ability.sourceId !== editingPowerAbilityId);
      if (hasDamage(saved.damage) && !combatAbilities.some((ability) => ability.sourceId === editingPowerAbilityId)) {
        combatAbilities = [...combatAbilities, { ...saved, id: makeRecordId("combat"), sourceId: saved.id }];
      }
    } else if (hasDamage(saved.damage)) {
      combatAbilities = [...combatAbilities, { ...saved, id: makeRecordId("combat"), sourceId: saved.id }];
    }
    update({ powerAbilities: nextPowerAbilities, combatAbilities });
    setPowerAbilityPage(Math.max(1, Math.ceil(nextPowerAbilities.length / OBTAINED_ABILITIES_PER_PAGE)));
    closePowerAbilityModal();
  };

  const deletePowerAbility = () => {
    if (!character || !editingPowerAbilityId) return;
    const nextPowerAbilities = character.powerAbilities.filter((ability) => ability.id !== editingPowerAbilityId);
    update({
      powerAbilities: nextPowerAbilities,
      combatAbilities: character.combatAbilities.filter((ability) => ability.sourceId !== editingPowerAbilityId),
    });
    setPowerAbilityPage(Math.min(powerAbilityPage, Math.max(1, Math.ceil(nextPowerAbilities.length / OBTAINED_ABILITIES_PER_PAGE))));
    closePowerAbilityModal();
  };

  const updateBio = (field: keyof Character["bio"], value: string) => {
    if (!character) return;
    update({ bio: { ...character.bio, [field]: value } });
  };

  const activeCatalogBand = CATALOG_BANDS.find((band) => band.id === catalogBand) ?? CATALOG_BANDS[0];
  const catalogResults = ABILITIES.filter((ability) => {
    const correctKind = catalogKind === "geral"
      ? ability.group === "gerais"
      : ability.group === (character?.classId ?? "vanguarda");
    const correctLevel = ability.level >= activeCatalogBand.min && ability.level <= activeCatalogBand.max;
    const matchesSearch = `${ability.name} ${ability.description}`.toLowerCase().includes(abilitySearch.toLowerCase());
    return correctKind && correctLevel && matchesSearch;
  });

  const obtainedAbilities = useMemo<ObtainedAbilityEntry[]>(() => {
    if (!character) return [];
    const entries: ObtainedAbilityEntry[] = [];
    const fromCatalog = (ability: Ability, source: string): ObtainedAbilityEntry => ({
      key: `catalog:${ability.id}`,
      level: ability.level,
      type: ability.type,
      source,
      name: ability.name,
      description: ability.description,
      damage: ability.damage ?? "",
      damageType: ability.damageType ?? "",
      effect: ability.effect ?? "",
      action: ability.action ?? "A definir",
      range: ability.range ?? "A definir",
      cost: ability.cost ?? "0",
      costResource: ability.costResource ?? "nenhum",
      attackSkill: ability.attackSkill,
      attackAttribute: ability.attackAttribute,
      damageAttribute: ability.damageAttribute,
      criticalHit: ability.criticalHit ?? 20,
      criticalMultiplier: ability.criticalMultiplier ?? 2,
      catalogAbility: ability,
    });

    const passive = ABILITIES.find((ability) => ability.group === character.classId && ability.name === classData.passive.name);
    if (passive) {
      entries.push(fromCatalog(passive, `Passiva de ${classData.name}`));
    } else {
      entries.push({
        key: `passive:${character.classId}`,
        level: 1,
        type: "Passiva",
        source: `Passiva de ${classData.name}`,
        name: classData.passive.name,
        description: classData.passive.description,
        damage: "",
        damageType: "",
        effect: classData.passive.description,
        action: "Livre",
        range: character.classId === "vanguarda" || character.classId === "influente" ? "Curto" : "Pessoal",
        cost: "0",
        costResource: "nenhum",
        criticalHit: 20,
        criticalMultiplier: 2,
      });
    }

  const selected = [
      ...Object.entries(character.classAbilities).map(([slot, id]) => ({ slot: Number(slot), id, source: "Classe" })),
      ...Object.entries(character.generalAbilities).map(([slot, id]) => ({ slot: Number(slot), id, source: "Geral" })),
    ];
    const includedIds = new Set(entries.map((entry) => entry.catalogAbility?.id).filter(Boolean));
    for (const choice of selected) {
      if (!choice.id || (!masterEditMode && choice.slot > character.level) || includedIds.has(choice.id)) continue;
      const ability = ABILITIES.find((entry) => entry.id === choice.id);
      if (!ability) continue;
      entries.push(fromCatalog(ability, choice.source));
      includedIds.add(ability.id);
    }

    for (const abilityId of character.obtainedAbilityIds) {
      if (includedIds.has(abilityId)) continue;
      const ability = ABILITIES.find((entry) => entry.id === abilityId);
      if (!ability) continue;
      entries.push(fromCatalog(ability, "Adicionada pelo Catálogo"));
      includedIds.add(ability.id);
    }

    for (const ability of character.customAbilities) {
      entries.push({
        key: `custom:${ability.id}`,
        level: ability.level,
        type: ability.action.toLowerCase().includes("passiv") ? "Passiva" : "Ativa",
        source: "Personalizada",
        name: ability.name,
        description: ability.description,
        damage: ability.damage,
        damageType: ability.damageType,
        effect: ability.effect,
        action: ability.action,
        range: ability.range,
        cost: ability.cost,
        costResource: ability.costResource,
        attackSkill: ability.attackSkill,
        attackAttribute: ability.attackAttribute,
        damageAttribute: ability.damageAttribute,
        criticalHit: ability.criticalHit,
        criticalMultiplier: ability.criticalMultiplier,
        customAbility: ability,
      });
    }

    for (const ability of character.powerAbilities) {
      entries.push({
        key: `power:${ability.id}`,
        level: ability.level,
        type: "Ativa",
        source: "Poder",
        name: ability.name,
        description: ability.description,
        damage: ability.damage,
        damageType: ability.damageType,
        effect: ability.effect,
        action: ability.action,
        range: ability.range,
        cost: ability.cost,
        costResource: ability.costResource,
        attackSkill: ability.attackSkill,
        attackAttribute: ability.attackAttribute,
        damageAttribute: ability.damageAttribute,
        criticalHit: ability.criticalHit,
        criticalMultiplier: ability.criticalMultiplier,
        customAbility: ability,
      });
    }

    return entries.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "pt-BR"));
  }, [character, classData, masterEditMode]);

  const obtainedPageCount = Math.max(1, Math.ceil(obtainedAbilities.length / OBTAINED_ABILITIES_PER_PAGE));
  const currentObtainedPage = Math.min(obtainedPage, obtainedPageCount);
  const visibleObtainedAbilities = obtainedAbilities.slice(
    (currentObtainedPage - 1) * OBTAINED_ABILITIES_PER_PAGE,
    currentObtainedPage * OBTAINED_ABILITIES_PER_PAGE,
  );
  const powerAbilities = character?.powerAbilities ?? [];
  const powerAbilityPageCount = Math.max(1, Math.ceil(powerAbilities.length / OBTAINED_ABILITIES_PER_PAGE));
  const currentPowerAbilityPage = Math.min(powerAbilityPage, powerAbilityPageCount);
  const visiblePowerAbilities = powerAbilities.slice(
    (currentPowerAbilityPage - 1) * OBTAINED_ABILITIES_PER_PAGE,
    currentPowerAbilityPage * OBTAINED_ABILITIES_PER_PAGE,
  );

  const rollDock = rollDockOpen && floatingRoll
    ? <FloatingRollDock entry={floatingRoll} onClose={() => setRollDockOpen(false)} />
    : null;

  if (!hydrated) return <main className="loading-screen">Carregando manifestação…</main>;

  if (screen !== "ficha" || !character) {
    return (
      <>
        <CampaignPortal
          screen={screen === "ficha" ? sheetKind === "npc" ? "mestre" : "slots" : screen}
          setScreen={setScreen}
          characters={characters}
          npcs={npcs}
          addCharacter={addCharacter}
          addNpc={addNpc}
          openCharacter={openCharacter}
          openNpc={openNpc}
          deleteCharacter={deleteCharacterById}
          deleteNpc={deleteNpcById}
          exportCharacter={exportCharacter}
          importCharacter={importCharacter}
          uploadPortrait={uploadPortrait}
          removePortrait={removePortrait}
          masterPassword={masterPassword}
          setMasterPassword={setMasterPassword}
          masterUnlocked={masterUnlocked}
          setMasterUnlocked={setMasterUnlocked}
          masterError={masterError}
          setMasterError={setMasterError}
          npcSlotPage={npcSlotPage}
          setNpcSlotPage={setNpcSlotPage}
        />
        {rollDock}
      </>
    );
  }

  return (
    <>
      <main className="app-shell" style={{ "--class-accent": classData.accent } as CSSProperties}>
      <aside className="vault-panel">
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div><strong>SUPACELL</strong><span>FICHAS // LONDRES</span></div>
        </div>

        <button className="portal-return" onClick={() => setScreen(sheetKind === "npc" ? "mestre" : "inicio")}>
          <span>←</span> {sheetKind === "npc" ? "Painel do Mestre" : "Menu principal"}
        </button>

        <div className="vault-heading">
          <span>{sheetKind === "npc" ? "Arquivo de NPCs" : "Arquivo de personagens"}</span>
          <button className="icon-button" onClick={() => sheetKind === "npc" ? addNpc() : addCharacter()} disabled={activeCollection.length >= activeSlotLimit} aria-label={sheetKind === "npc" ? "Criar NPC" : "Criar personagem"}>+</button>
        </div>

        <div className="character-list">
          {[...activeCollection].sort((first, second) => first.slot - second.slot).map((entry) => (
            <button
              key={entry.id}
              className={`character-row ${entry.id === character.id ? "active" : ""}`}
              style={{ "--character-accent": CLASSES[entry.classId].accent } as CSSProperties}
              onClick={() => setActiveId(entry.id)}
            >
              <span className={`character-avatar ${entry.portrait ? "has-image" : ""}`}>
                {entry.portrait ? <img src={entry.portrait} alt="" /> : entry.name.slice(0, 1).toUpperCase()}
              </span>
              <span><strong>{entry.name}</strong><small>Nível {entry.level} · {CLASSES[entry.classId].name}</small></span>
            </button>
          ))}
        </div>

        <div className="vault-tools">
          <button onClick={duplicateCharacter} disabled={activeCollection.length >= activeSlotLimit}>Duplicar</button>
          <button onClick={() => exportCharacter(character.id, sheetKind)}>Exportar esta ficha</button>
          <label>Importar em slot livre<input type="file" accept="application/json" onChange={(event) => importCharacter(event, sheetKind)} /></label>
          <button className="danger-action" onClick={deleteCharacter}>Excluir</button>
        </div>
        <div className="save-state"><span className="pulse-dot" />Salvamento automático ativo</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><span className="eyebrow">REGISTRO DE MANIFESTAÇÃO</span><h1>{character.name}</h1></div>
          <div className="top-actions">
            <button className="print-button" onClick={() => window.print()}>Imprimir ficha</button>
            <div className="level-control">
              <button aria-label="Diminuir nível" onClick={() => update({ level: Math.max(1, character.level - 1) })}>−</button>
              <label><span>NÍVEL</span><strong>{String(character.level).padStart(2, "0")}</strong></label>
              <button aria-label="Aumentar nível" onClick={() => update({ level: Math.min(20, character.level + 1) })}>+</button>
            </div>
          </div>
        </header>

        <nav className="section-tabs" aria-label="Seções da ficha">
          {([
            ["identidade", "Identidade"], ["status", "Status"], ["pericias", "Perícias"], ["progressao", "Progressão"],
            ["habilidades", "Habilidades"], ["combate", "Combate"], ["equipamentos", "Equipamentos"], ["poder", "Poder"],
          ] as Array<[SectionId, string]>).map(([id, label]) => (
            <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>{label}</button>
          ))}
        </nav>

        <div className="resource-strip">
          {(["pv", "pe", "pa"] as ResourceId[]).map((resource) => {
            const labels = { pv: ["PV ATUAL", "Vida"], pe: ["PE ATUAL", "Esforço"], pa: ["PA ATUAL", "Supacell"] };
            const inDeathState = resource === "pv" && currents.pv <= 0;
            return (
              <article className={`resource-card ${resource} ${inDeathState ? "death-card" : ""}`} key={resource}>
                <span>{labels[resource][0]}</span>
                {inDeathState ? (
                  <div className="death-state">
                    <div className="death-orbs" aria-label={`${character.deathMarks} de 3 marcadores de morte preenchidos`}>
                      {[0, 1, 2].map((index) => {
                        const filled = index < character.deathMarks;
                        const value = index + 1;
                        return (
                          <button
                            key={index}
                            type="button"
                            className={`death-orb ${filled ? "filled" : ""}`}
                            aria-label={`${filled ? "Remover" : "Preencher"} marcador ${value} de morte`}
                            aria-pressed={filled}
                            onClick={() => setDeathMarks(character.deathMarks === value ? index : value)}
                          />
                        );
                      })}
                    </div>
                    <small>{character.deathMarks === 3 ? "ÚLTIMA CHANCE" : "ESTADO DE MORTE"}</small>
                    <button className="resurrect-button" type="button" onClick={resurrectCharacter}>Ressurgir</button>
                  </div>
                ) : (
                  <>
                    <div className="resource-value">
                      <input aria-label={`${resource.toUpperCase()} atual`} type="number" min="0" value={currents[resource]} onChange={(event) => setResourceCurrent(resource, Number(event.target.value))} />
                      <em>/</em>
                      <input className="resource-maximum-input" aria-label={`${resource.toUpperCase()} máximo`} title="Valor máximo editável" type="number" min="0" value={maximums[resource]} onChange={(event) => setResourceMaximum(resource, Number(event.target.value))} />
                    </div>
                    <small>{labels[resource][1]}</small>
                    <div className="resource-controls">
                      <button aria-label={`Recuperar ${resource.toUpperCase()}`} onClick={() => setResourceCurrent(resource, currents[resource] + 1)}>+</button>
                      <button aria-label={`Gastar ${resource.toUpperCase()}`} onClick={() => setResourceCurrent(resource, currents[resource] - 1)}>−</button>
                    </div>
                    {character.resourceMaximumOverrides[resource] !== null && character.resourceMaximumOverrides[resource] !== undefined && <button className="resource-auto-button" onClick={() => setResourceMaximum(resource, null)}>Máx. automático</button>}
                    <label className="temporary-resource"><span>TEMP</span><input aria-label={`${resource.toUpperCase()} temporário`} type="number" min="0" value={character.resourceTemporary[resource]} onChange={(event) => setTemporaryResource(resource, Number(event.target.value))} /></label>
                  </>
                )}
              </article>
            );
          })}
          <article className="resource-card defense">
            <span>DEFESA</span><strong>{maximums.defense}</strong>
            <small>10 + VIG{armor ? ` + ${armor.defense} armadura` : ""}{automaticBuffs.defense ? ` + ${automaticBuffs.defense} habilidades` : ""}</small>
            <label className="defense-editor"><span>EDITAR</span><input aria-label="Defesa total" type="number" min="0" value={maximums.defense} onChange={(event) => setDefense(Number(event.target.value))} /></label>
            {character.defenseOverride !== null && <button className="resource-auto-button" onClick={() => setDefense(null)}>Defesa automática</button>}
          </article>
        </div>

        {section === "identidade" && (
          <div className="content-grid">
            <section className="panel identity-panel">
              <PanelHeading number="01" title="Identidade" text="Quem era você antes do Apagão?" />
              <div className="identity-portrait-row">
                <div className={`identity-portrait ${character.portrait ? "has-image" : ""}`}>
                  {character.portrait ? <img src={character.portrait} alt={`Retrato de ${character.name}`} /> : <span>{character.name.slice(0, 1).toUpperCase()}</span>}
                </div>
                <div>
                  <strong>Retrato do personagem</strong>
                  <p>Esta imagem também aparece no seu slot.</p>
                  <div className="portrait-buttons">
                    <label className="secondary-button">{character.portrait ? "Trocar foto" : "Enviar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(character.id, event)} /></label>
                    {character.portrait && <button className="text-button danger-text" onClick={() => removePortrait(character.id)}>Remover</button>}
                  </div>
                </div>
              </div>
              <div className="form-grid">
                <Field label="Nome do personagem"><input value={character.name} onChange={(event) => update({ name: event.target.value })} /></Field>
                <Field label="Nome do jogador"><input value={character.player} placeholder="Quem controla esta ficha?" onChange={(event) => update({ player: event.target.value })} /></Field>
                <Field label="Idade"><input value={character.bio.age} onChange={(event) => updateBio("age", event.target.value)} /></Field>
                <Field label="Sexo">
                  <select value={character.sex} onChange={(event) => changeSex(event.target.value as SexId)}>
                    <option value="" disabled>Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </Field>
                <Field label="Origem"><select value={character.originId} onChange={(event) => changeOrigin(event.target.value)}>{ORIGINS.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></Field>
              </div>
              <div className="origin-summary">
                <div><strong>{origin.name}</strong><p>{origin.description}</p></div>
                <div className="origin-bonuses"><span>{origin.skills.join(" · ")}</span><div>{origin.attributes.map((attribute) => <button key={attribute} className={character.originPrimary === attribute ? "primary" : ""} onClick={() => update({ originPrimary: attribute })}>{attributeLabel(attribute)} {character.originPrimary === attribute ? "+2" : "+1"}</button>)}</div></div>
              </div>
              <div className="narrative-grid">
                <Field label="Aparência"><textarea value={character.bio.appearance} onChange={(event) => updateBio("appearance", event.target.value)} /></Field>
                <Field label="Personalidade"><textarea value={character.bio.personality} onChange={(event) => updateBio("personality", event.target.value)} /></Field>
                <Field label="Vínculos"><textarea value={character.bio.bonds} onChange={(event) => updateBio("bonds", event.target.value)} /></Field>
                <Field label="História"><textarea value={character.bio.history} onChange={(event) => updateBio("history", event.target.value)} /></Field>
              </div>
            </section>

            <section className="panel class-panel">
              <PanelHeading number="02" title="Classe" />
              <div className="class-selector">
                {(Object.values(CLASSES) as (typeof CLASSES)[ClassId][]).map((entry) => (
                  <button key={entry.id} className={character.classId === entry.id ? "selected" : ""} style={{ "--option-accent": entry.accent } as CSSProperties} onClick={() => changeClass(entry.id)}>
                    <span>{entry.tag}</span><strong>{entry.name}</strong><small>{entry.description}</small>
                  </button>
                ))}
              </div>
              <div className="passive-card"><span>PASSIVA INICIAL</span><strong>{classData.passive.name}</strong><p>{classData.passive.description}</p></div>
              <div className="formula-card">
                <span>RECURSOS POR NÍVEL</span>
                <p>PV: {classData.growth.pv} + VIG · PE: {classData.growth.pe} + FOR · PA: {classData.growth.pa} + INT</p>
                <p>Perícias iniciais: {classData.initialSkills} + modificador de INT.</p>
              </div>
            </section>

            <section className="panel attributes-panel">
              <PanelHeading number="03" title="Atributos" text={masterEditMode ? "Modo Mestre: valores-base livres e todos os controles desbloqueados." : "Os valores-base ficam protegidos na ficha do jogador. Apenas o Mestre pode alterá-los."} />
              <div className="attribute-grid">
                {ATTRIBUTES.map((attribute) => (
                  <article className={`attribute-card ${masterEditMode ? "master-editable" : "player-locked"}`} key={attribute.id}>
                    <span>{attribute.short}</span>
                    <input aria-label={`Valor-base de ${attribute.label}`} title={masterEditMode ? "Editar valor-base" : "Somente o Mestre pode editar"} type="number" disabled={!masterEditMode} value={character.baseScores[attribute.id]} onChange={(event) => setBaseScore(attribute.id, Number(event.target.value))} />
                    <strong>{scores[attribute.id]}</strong><b>{signed(mods[attribute.id])}</b><small>{attribute.label}</small>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {section === "status" && (
          <section className="panel page-panel status-panel">
            <PanelHeading number="04" title="Status" text="Necessidades e saúde corporal atualizadas diretamente na ficha." />

            <div className="needs-grid">
              {NEEDS.map((need) => {
                const level = character.needs[need.id];
                const state = NEED_LEVELS[level];
                return (
                  <article className={`need-card need-${need.id} level-${level}`} key={need.id}>
                    <header>
                      <div><span>NECESSIDADE</span><strong>{need.label}</strong></div>
                      <b>NÍVEL {level}</b>
                    </header>
                    <div className="need-meter" role="progressbar" aria-label={`Nível de ${need.label}`} aria-valuemin={0} aria-valuemax={5} aria-valuenow={level}>
                      <i style={{ width: `${level * 20}%` }} />
                    </div>
                    <div className="need-scale" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((mark) => <span key={mark}>{mark}</span>)}</div>
                    <div className="need-state">
                      <div><strong>{state.name}</strong><small>{state.penalty}</small></div>
                      <div className="need-controls">
                        <button type="button" aria-label={`Diminuir ${need.label}`} onClick={() => setNeedLevel(need.id, level - 1)}>−</button>
                        <input aria-label={`Nível de ${need.label}`} type="number" min="0" max="5" value={level} onChange={(event) => setNeedLevel(need.id, Number(event.target.value))} />
                        <button type="button" aria-label={`Aumentar ${need.label}`} onClick={() => setNeedLevel(need.id, level + 1)}>+</button>
                      </div>
                    </div>
                    <p>{need.description}</p>
                  </article>
                );
              })}
            </div>

            <div className="body-status-block">
              <div className="body-status-heading">
                <div><span>SAÚDE LOCALIZADA</span><h3>Saúde dos membros</h3></div>
                <p>Cada região vai de 100% a 0%. Ajuste o valor conforme o dano localizado recebido.</p>
              </div>

              <div className="body-health-layout">
                <div className="body-figure" aria-label="Mapa corporal do personagem">
                  {BODY_PARTS.map((bodyPart) => {
                    const health = character.bodyHealth[bodyPart.id];
                    const state = bodyHealthState(health);
                    return (
                      <div
                        className={`body-zone zone-${bodyPart.id} health-${state.tone}`}
                        title={`${bodyPart.label}: ${health}% — ${state.name}`}
                        key={bodyPart.id}
                      >
                        <span>{bodyPart.short}</span>
                        <strong>{health}%</strong>
                      </div>
                    );
                  })}
                </div>

                <div className="member-grid">
                  {BODY_PARTS.map((bodyPart) => {
                    const health = character.bodyHealth[bodyPart.id];
                    const state = bodyHealthState(health);
                    return (
                      <article className={`member-card health-${state.tone}`} key={bodyPart.id}>
                        <header>
                          <div><span>{bodyPart.short}</span><strong>{bodyPart.label}</strong></div>
                          <b>{health}%</b>
                        </header>
                        <div className="member-meter" role="progressbar" aria-label={`Saúde de ${bodyPart.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={health}>
                          <i style={{ width: `${health}%` }} />
                        </div>
                        <footer>
                          <div className="member-controls">
                            <button type="button" aria-label={`Reduzir saúde de ${bodyPart.label}`} onClick={() => setBodyPartHealth(bodyPart.id, health - 5)}>−</button>
                            <input aria-label={`Saúde de ${bodyPart.label} em porcentagem`} type="number" min="0" max="100" value={health} onChange={(event) => setBodyPartHealth(bodyPart.id, Number(event.target.value))} />
                            <button type="button" aria-label={`Aumentar saúde de ${bodyPart.label}`} onClick={() => setBodyPartHealth(bodyPart.id, health + 5)}>+</button>
                          </div>
                          <div><strong>{state.name}</strong><small>{state.penalty}</small></div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {section === "pericias" && (
          <section className="panel page-panel">
            <PanelHeading number="05" title="Perícias" text={`Escolhidas na criação: ${character.creationSkills.length} · referência da ${classData.name}: ${creationSkillReference} · avanços aplicados: ${skillAdvancesUsed} (referência do nível: ${skillAdvanceReference}). Edição livre, sem bloqueios.`} />
            <div className="rules-banner"><strong>Teste</strong><span>1d20 + modificador do atributo + Total da perícia contra a DT. O Total abaixo não inclui o atributo.</span></div>
            <div className="skill-table">
              <div className="skill-row skill-header"><span>Perícia / Teste</span><span>Atributo</span><span>Criação</span><span>Grau</span><span>Uso</span><span>Total</span></div>
              {SKILLS.map((skill) => {
                const gradeLevel = getSkillGrade(skill.id);
                const grade = SKILL_GRADES[gradeLevel];
                const fromOrigin = originSkillIds.includes(skill.id);
                const creationSelected = character.creationSkills.includes(skill.id);
                const canSpecialize = character.classId === "especialista" && skill.attribute === "int" && gradeLevel >= 1;
                return (
                  <div className={`skill-row grade-${gradeLevel}`} key={skill.id}>
                    <div className="skill-name">
                      <strong title={skill.name}>{skill.name}</strong>
                      {canSpecialize && <button className={character.specialistSkills.includes(skill.id) ? "specialist-active" : ""} onClick={() => toggleSpecialistSkill(skill.id)}>Campo +2</button>}
                    </div>
                    <button className="skill-roll-button skill-roll-cell" onClick={() => rollSkill(skill)}>Rolar d20</button>
                    <span className="attribute-pill">{attributeLabel(skill.attribute)}</span>
                    <button className={`training-toggle ${fromOrigin || creationSelected ? "selected" : ""}`} disabled={fromOrigin} onClick={() => toggleCreationSkill(skill.id)}>{fromOrigin ? "Origem" : creationSelected ? "Treinada" : "Escolher"}</button>
                    <div className="step-control"><button onClick={() => adjustSkillAdvance(skill.id, -1)}>−</button><span>{grade.name}<small>{signed(grade.bonus)}</small></span><button onClick={() => adjustSkillAdvance(skill.id, 1)}>+</button></div>
                    <input aria-label={`Bônus livre de ${skill.name}`} type="number" value={character.skillUsage[skill.id] ?? 0} onChange={(event) => update({ skillUsage: { ...character.skillUsage, [skill.id]: Number(event.target.value) || 0 } })} />
                    <strong className="skill-total" title={automaticBuffs.skills?.[skill.id] ? `Inclui +${automaticBuffs.skills[skill.id]} de habilidades obtidas` : undefined}>{signed(getSkillTotal(skill.id))}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {section === "progressao" && (
          <div className="progression-layout">
            <section className="panel page-panel">
              <PanelHeading number="06" title="Progressão 1–20" text="Clique em um nível para atualizar a ficha inteira." />
              <div className="level-timeline">
                {Array.from({ length: 20 }, (_, index) => index + 1).map((level) => (
                  <button key={level} className={`${level === character.level ? "current" : ""} ${level < character.level ? "passed" : ""}`} onClick={() => update({ level })}>
                    <strong>{level}</strong><span>{levelBenefits(level).join(" · ")}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel page-panel">
              <PanelHeading number="07" title="Aumentos de atributo" text="A cada marco, distribua 6 pontos: no máximo 3 no mesmo atributo." />
              <div className="milestone-list">
                {ATTRIBUTE_LEVELS.map((milestone) => {
                  const boosts = character.attributeBoosts[String(milestone)] ?? {};
                  const used = Object.values(boosts).reduce((sum, value) => sum + (value ?? 0), 0);
                  const milestoneLocked = !masterEditMode && character.level < milestone;
                  return (
                    <article className={`milestone-card ${milestoneLocked ? "locked" : ""}`} key={milestone}>
                      <header><strong>Nível {milestone}</strong><span>{used}/6 pontos adicionados</span></header>
                      <div>{ATTRIBUTES.map((attribute) => <div key={attribute.id}><span>{attribute.short}</span><button disabled={milestoneLocked || (boosts[attribute.id] ?? 0) <= 0} aria-label={`Remover ${attribute.label} no nível ${milestone}`} onClick={() => adjustAttributeBoost(milestone, attribute.id, -1)}>−</button><b>{boosts[attribute.id] ?? 0}</b><button disabled={milestoneLocked || used >= 6 || (boosts[attribute.id] ?? 0) >= 3} aria-label={`Adicionar ${attribute.label} no nível ${milestone}`} onClick={() => adjustAttributeBoost(milestone, attribute.id, 1)}>+</button></div>)}</div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {section === "habilidades" && (
          <>
            <div className="view-switch panel" aria-label="Modo das habilidades">
              <button className={abilityView === "obtidas" ? "active" : ""} onClick={() => setAbilityView("obtidas")}>Obtidas</button>
              <button className={abilityView === "catalogo" ? "active" : ""} onClick={() => setAbilityView("catalogo")}>Catálogo</button>
              <button className={abilityView === "adicionar" ? "active" : ""} onClick={() => setAbilityView("adicionar")}>Adicionar</button>
            </div>

            {abilityView === "obtidas" ? (
              <section className="panel page-panel obtained-panel">
                <PanelHeading number="08" title="Habilidades obtidas" text={`${obtainedAbilities.length} ${obtainedAbilities.length === 1 ? "habilidade" : "habilidades"} da classe, escolhas de nível, Catálogo e criações próprias, ordenadas do menor nível para o maior.`} />
                {!obtainedAbilities.length && <div className="empty-state">Nenhuma habilidade obtida nesta ficha.</div>}
                <div className="ability-catalog expanded-catalog obtained-ability-list">
                  {visibleObtainedAbilities.map((ability) => {
                    const sourceId = ability.catalogAbility?.id ?? ability.customAbility?.id;
                    const inCombat = sourceId ? character.combatAbilities.some((entry) => entry.sourceId === sourceId) : false;
                    const canAddToCombat = ability.type === "Ativa" && hasDamage(ability.damage) && Boolean(ability.catalogAbility || ability.customAbility);
                    const cardId = `obtained:${ability.key}`;
                    const expanded = expandedCards.has(cardId);
                    const buffDescriptions = describeAbilityBuffs(
                      ability.catalogAbility?.buffs ?? (ability.customAbility ? buffsFromEditableAbility(ability.customAbility) : undefined),
                    );
                    return (
                      <article className={`collapsible-card ${expanded ? "expanded" : ""}`} key={ability.key}>
                        <strong className="collapsible-title">{ability.name}</strong>
                        <button type="button" className="card-expand-button" aria-expanded={expanded} onClick={() => toggleCard(cardId)}>{expanded ? "Recolher" : "Expandir"}</button>
                        {expanded && <div className="collapsible-content">
                          <div className="ability-meta-row"><span className={ability.type === "Ativa" ? "active-type" : "passive-type"}>{ability.type}</span><small>Nível {ability.level} · {ability.source}</small></div>
                          <p>{ability.description || "Sem descrição."}</p>
                          <div className="mechanic-grid">
                            <span><b>Custo</b>{ability.cost || "0"} {ability.costResource === "nenhum" ? "" : ability.costResource.toUpperCase()}</span>
                            <span><b>Dano</b>{ability.damage || "—"} {ability.damageType}</span>
                            <span><b>Efeito</b>{ability.effect || "—"}</span>
                            <span><b>Ação</b>{ability.action || "A definir"}</span>
                            <span><b>Alcance</b>{ability.range || "A definir"}</span>
                            {buffDescriptions.length > 0 && <span className="automatic-buff"><b>Bônus automático aplicado</b>{buffDescriptions.join(" · ")}</span>}
                            {ability.type === "Ativa" && <span><b>Crítico</b>{ability.criticalHit}+ · dano ×{ability.criticalMultiplier}</span>}
                            {ability.type === "Ativa" && <span><b>Teste de perícia</b>{SKILLS.find((skill) => skill.id === ability.attackSkill)?.name ?? "—"}</span>}
                            {ability.type === "Ativa" && <span><b>Atributos</b>{ability.attackAttribute ? `${ability.attackAttribute.toUpperCase()} ataque · ${(ability.damageAttribute || ability.attackAttribute).toUpperCase()} dano` : "—"}</span>}
                          </div>
                          {canAddToCombat && <button className="catalog-combat-button" disabled={inCombat} onClick={() => ability.catalogAbility ? addCatalogAbilityToCombat(ability.catalogAbility) : ability.customAbility && addAbilityToCombat(ability.customAbility)}>{inCombat ? "No Combate" : "Adicionar ao Combate"}</button>}
                        </div>}
                      </article>
                    );
                  })}
                </div>
                {obtainedPageCount > 1 && <nav className="ability-pagination" aria-label="Páginas das habilidades obtidas">
                  <button type="button" disabled={currentObtainedPage === 1} onClick={() => setObtainedPage(currentObtainedPage - 1)}>← Anterior</button>
                  <div>{Array.from({ length: obtainedPageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === currentObtainedPage ? "active" : ""} aria-current={page === currentObtainedPage ? "page" : undefined} aria-label={`Página ${page}`} onClick={() => setObtainedPage(page)} key={page}>{page}</button>)}</div>
                  <button type="button" disabled={currentObtainedPage === obtainedPageCount} onClick={() => setObtainedPage(currentObtainedPage + 1)}>Próxima →</button>
                </nav>}
              </section>
            ) : abilityView === "catalogo" ? (
              <div className="abilities-layout">
                <section className="panel page-panel">
                  <PanelHeading number="08" title="Escolhas por nível" text="A cada nível par, escolha uma habilidade da Classe e uma Geral." />
                  <div className="ability-slots">
                    {EVEN_LEVELS.map((level) => {
                      const locked = !masterEditMode && character.level < level;
                      const optionLevel = masterEditMode ? 20 : level;
                      const classOptions = ABILITIES.filter((ability) => ability.group === character.classId && ability.level <= optionLevel && ability.name !== classData.passive.name);
                      const generalOptions = ABILITIES.filter((ability) => ability.group === "gerais" && ability.level <= optionLevel);
                      return (
                        <article className={locked ? "locked" : ""} key={level}>
                          <strong>Nível {level}</strong>
                          <label><span>Classe</span><select disabled={locked} value={character.classAbilities[String(level)] ?? ""} onChange={(event) => selectAbility("class", level, event.target.value)}><option value="">Escolher habilidade</option>{classOptions.map((ability) => <option key={ability.id} value={ability.id} disabled={Object.entries(character.classAbilities).some(([slot, id]) => slot !== String(level) && id === ability.id)}>{ability.name} · Nv. {ability.level}</option>)}</select></label>
                          <label><span>Geral</span><select disabled={locked} value={character.generalAbilities[String(level)] ?? ""} onChange={(event) => selectAbility("general", level, event.target.value)}><option value="">Escolher habilidade</option>{generalOptions.map((ability) => <option key={ability.id} value={ability.id} disabled={Object.entries(character.generalAbilities).some(([slot, id]) => slot !== String(level) && id === ability.id)}>{ability.name} · Nv. {ability.level}</option>)}</select></label>
                        </article>
                      );
                    })}
                  </div>
                </section>
                <section className="panel page-panel catalog-panel">
                  <PanelHeading number="09" title="Catálogo completo" text={`${catalogResults.length} exibidas de ${ABILITIES.length} habilidades · ${catalogKind === "classe" ? `${CLASSES[character.classId].name} · ${activeCatalogBand.label}` : `Habilidades Gerais · ${activeCatalogBand.label}`}. Cards abertos fecham após 25 segundos.`} />
                  <div className="catalog-segmentation">
                    <div className="catalog-kind-tabs" aria-label="Tipo de habilidade">
                      <button type="button" className={catalogKind === "classe" ? "active" : ""} onClick={() => setCatalogKind("classe")}>Habilidade de Classe</button>
                      <button type="button" className={catalogKind === "geral" ? "active" : ""} onClick={() => setCatalogKind("geral")}>Habilidade Geral</button>
                    </div>
                    <div className="catalog-level-tabs" aria-label="Faixa de nível">
                      {CATALOG_BANDS.map((band) => <button type="button" key={band.id} className={catalogBand === band.id ? "active" : ""} onClick={() => setCatalogBand(band.id)}>{band.label}</button>)}
                    </div>
                  </div>
                  <input className="search-input" placeholder="Buscar habilidade…" value={abilitySearch} onChange={(event) => setAbilitySearch(event.target.value)} />
                  <div className="ability-catalog expanded-catalog catalog-compact-grid">
                    {!catalogResults.length && <div className="empty-state">Nenhuma habilidade encontrada nesta categoria.</div>}
                    {catalogResults.map((ability) => {
                      const obtained = obtainedAbilities.some((entry) => entry.catalogAbility?.id === ability.id);
                      const cardId = `catalog:${ability.id}`;
                      const expanded = expandedCards.has(cardId);
                      const buffDescriptions = describeAbilityBuffs(ability.buffs);
                      return (
                        <article className={`collapsible-card ${expanded ? "expanded" : ""}`} key={ability.id}>
                          <strong className="collapsible-title">{ability.name}</strong>
                          <button type="button" className="card-expand-button" aria-expanded={expanded} onClick={() => toggleCard(cardId)}>{expanded ? "Recolher" : "Expandir"}</button>
                          {expanded && <div className="collapsible-content">
                            <div className="ability-meta-row"><span className={ability.type === "Ativa" ? "active-type" : "passive-type"}>{ability.type}</span><small>Nível {ability.level} · {ability.group === "gerais" ? "Geral" : CLASSES[ability.group].name}</small></div>
                            <p>{ability.description}</p>
                            <div className="mechanic-grid">
                              <span><b>Requisito</b>{ability.requirement || `Nível ${ability.level}`}</span>
                              <span><b>Custo</b>{ability.cost || "0"} {ability.costResource === "nenhum" ? "" : ability.costResource?.toUpperCase()}</span>
                              <span><b>Dano</b>{ability.damage || "Sem dano"}</span>
                              <span><b>Tipo de dano</b>{ability.damageType || "—"}</span>
                              <span><b>Efeito</b>{ability.effect || "—"}</span>
                              <span><b>Ação</b>{ability.action}</span>
                              <span><b>Alcance</b>{ability.range}</span>
                              {buffDescriptions.length > 0 && <span className="automatic-buff"><b>Bônus automático</b>{buffDescriptions.join(" · ")}</span>}
                              <span><b>Teste de perícia</b>{SKILLS.find((skill) => skill.id === ability.attackSkill)?.name ?? "—"}</span>
                              <span><b>Crítico</b>{ability.criticalHit ?? 20}+ · dano ×{ability.criticalMultiplier ?? 2}</span>
                              <span><b>Atributos</b>{ability.attackAttribute ? `${ability.attackAttribute.toUpperCase()} ataque · ${(ability.damageAttribute || ability.attackAttribute).toUpperCase()} dano` : "A definir"}</span>
                            </div>
                            <button className="catalog-combat-button" disabled={obtained} onClick={() => addCatalogAbility(ability)}>{obtained ? "Adicionada" : "Adicionar"}</button>
                          </div>}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="custom-abilities-layout">
                <section className="panel page-panel">
                  <PanelHeading number="08" title={editingCustomId ? "Editar habilidade" : "Criar habilidade"} text="Todos os campos ficam livres para você personalizar agora ou depois." />
                  <AbilityEditor value={customDraft} onChange={setCustomDraft} />
                  <div className="form-actions">
                    {editingCustomId && <button className="secondary-button" onClick={() => { setCustomDraft(emptyEditableAbility("custom")); setEditingCustomId(""); }}>Cancelar edição</button>}
                    <button className="primary-button" onClick={saveCustomAbility}>{editingCustomId ? "Salvar alterações" : "Adicionar habilidade"}</button>
                  </div>
                </section>
                <section className="panel page-panel">
                  <PanelHeading number="09" title="Habilidades personalizadas" text={`${character.customAbilities.length} criadas nesta ficha.`} />
                  <div className="custom-ability-list">
                    {!character.customAbilities.length && <div className="empty-state">Nenhuma habilidade personalizada criada ainda.</div>}
                    {character.customAbilities.map((ability) => {
                      const cardId = `custom:${ability.id}`;
                      const expanded = expandedCards.has(cardId);
                      return (
                        <article className={`collapsible-card ${expanded ? "expanded" : ""}`} key={ability.id}>
                          <strong className="collapsible-title">{ability.name}</strong>
                          <button type="button" className="card-expand-button" aria-expanded={expanded} onClick={() => toggleCard(cardId)}>{expanded ? "Recolher" : "Expandir"}</button>
                          {expanded && <div className="collapsible-content">
                            <div className="ability-card-head"><span className={ability.nature === "poder" ? "power-type" : "physical-type"}>{ability.nature === "poder" ? "Poder" : "Física"}</span><small>Nível {ability.level} · {ability.action} · {ability.range}</small></div>
                            <p>{ability.description || "Sem descrição."}</p>
                            <div className="mechanic-grid compact"><span><b>Dano</b>{ability.damage || "—"} {ability.damageType}</span><span><b>Efeito</b>{ability.effect || "—"}</span><span><b>Teste de perícia</b>{SKILLS.find((skill) => skill.id === ability.attackSkill)?.name ?? "—"}</span><span><b>Ataque</b>1d20 {signed(mods[ability.attackAttribute] + getSkillTotal(ability.attackSkill) + ability.attackBonus)} ({ability.attackAttribute.toUpperCase()})</span><span><b>Custo</b>{ability.cost || "0"} {ability.costResource === "nenhum" ? "" : ability.costResource.toUpperCase()}</span><span><b>Crítico</b>{ability.criticalHit}+ · dano ×{ability.criticalMultiplier}</span></div>
                            <div className="card-actions"><button onClick={() => editCustomAbility(ability)}>Editar</button>{hasDamage(ability.damage) && <button disabled={character.combatAbilities.some((entry) => entry.sourceId === ability.id)} onClick={() => addAbilityToCombat(ability)}>Adicionar ao Combate</button>}<button className="danger-small" onClick={() => deleteCustomAbility(ability.id)}>Excluir</button></div>
                          </div>}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </>
        )}

        {section === "combate" && (
          <div className="combat-layout">
            <section className="panel page-panel">
              <div className="panel-action-heading"><PanelHeading number="10" title="Combate" text="Ataques físicos, armas e poderes com teste, custo, crítico e dano calculados. O mestre decide se acertou." /><button className="primary-button" onClick={() => setShowCombatForm((current) => !current)}>{showCombatForm ? "Fechar" : "+ Adicionar"}</button></div>
              <div className="combat-controls">
                <Field label="Modo do d20"><select value={rollMode} onChange={(event) => setRollMode(event.target.value as RollMode)}><option value="normal">Normal</option><option value="vantagem">Vantagem</option><option value="desvantagem">Desvantagem</option></select></Field>
                <div className="combat-formula"><span>TESTE ABERTO</span><strong>1d20 + atributo de ataque + Total da perícia + bônus livre</strong><small>Físico usa Luta + FOR, poder usa Ocultismo + INT e tiros usam Pontaria + AGI por padrão.</small></div>
              </div>
              {showCombatForm && <div className="combat-add-form"><AbilityEditor value={combatDraft} onChange={setCombatDraft} /><div className="form-actions"><button className="secondary-button" onClick={() => { setCombatDraft(emptyEditableAbility("combat")); setShowCombatForm(false); }}>Cancelar</button><button className="primary-button" disabled={!combatDraft.name.trim() || !hasDamage(combatDraft.damage)} onClick={saveCombatDraft}>Adicionar ao Combate</button></div></div>}
              <div className="combat-action-list">
                {!character.combatAbilities.length && <div className="empty-state">Adicione um ataque com dano aqui ou envie uma habilidade ofensiva pela aba Habilidades.</div>}
                {character.combatAbilities.map((ability) => {
                  const cardId = `combat:${ability.id}`;
                  const expanded = expandedCards.has(cardId);
                  return (
                    <article className={`combat-card collapsible-card ${expanded ? "expanded" : ""}`} key={ability.id}>
                      <div className="combat-card-quick-row">
                        <h3 className="collapsible-title">{ability.name}</h3>
                        <button type="button" className="combat-quick-roll" onClick={() => rollCombatAbility(ability)}>Rolar dados</button>
                      </div>
                      <button type="button" className="card-expand-button" aria-expanded={expanded} onClick={() => toggleCard(cardId)}>{expanded ? "Recolher" : "Expandir"}</button>
                      {expanded && <div className="collapsible-content">
                        <header className="combat-card-meta"><span className={ability.sourceId?.startsWith("equipment:") ? "equipment-type" : ability.sourceId?.startsWith("basic:") ? "basic-type" : ability.nature === "poder" ? "power-type" : "physical-type"}>{ability.sourceId?.startsWith("equipment:") ? "Equipamento" : ability.sourceId?.startsWith("basic:") ? "Básico" : ability.nature === "poder" ? "Poder" : "Física"}</span><small>Nível {ability.level} · {ability.action} · {ability.range}</small></header>
                        <p>{ability.description || "Sem descrição."}</p>
                        <div className="combat-stats"><span><b>Teste de perícia</b>{SKILLS.find((skill) => skill.id === ability.attackSkill)?.name ?? "—"} {signed(getSkillTotal(ability.attackSkill))}</span><span><b>Ataque</b>1d20 {signed(mods[ability.attackAttribute] + getSkillTotal(ability.attackSkill) + ability.attackBonus)} · {ability.attackAttribute.toUpperCase()}</span><span><b>Dano</b>{ability.damage || "Não definido"} {ability.damageType}</span><span><b>Efeito</b>{ability.effect || "—"}</span><span><b>Custo</b>{ability.cost || "0"} {ability.costResource === "nenhum" ? "" : ability.costResource.toUpperCase()}</span><span><b>Acerto crítico</b>{ability.criticalHit}+</span><span><b>Dano crítico</b>×{ability.criticalMultiplier}</span></div>
                        <footer><button onClick={() => setEditingCombatId(editingCombatId === ability.id ? "" : ability.id)}>{editingCombatId === ability.id ? "Fechar edição" : "Editar"}</button>{!ability.sourceId?.startsWith("equipment:") && !ability.sourceId?.startsWith("basic:") && <button className="danger-small" onClick={() => deleteCombatAbility(ability.id)}>Excluir</button>}</footer>
                        {editingCombatId === ability.id && <div className="inline-combat-editor"><AbilityEditor value={ability} onChange={(next) => updateCombatAbility(ability.id, next)} /></div>}
                      </div>}
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {section === "equipamentos" && (
          <div className="equipment-layout">
            <section className="panel page-panel">
              <PanelHeading number="11" title="Equipamentos" text={`Peso carregado: ${inventoryWeight.toFixed(2).replace(".", ",")} kg · limite: ${carryLimit.toFixed(1).replace(".", ",")} kg.`} />
              <div className={`load-banner ${inventoryWeight > carryLimit ? "overloaded" : ""}`}>
                <div>
                  <span>CARGA</span>
                  <strong>{inventoryWeight.toFixed(2).replace(".", ",")} / <input aria-label="Limite de carga" type="number" min="0" step="0.5" value={carryLimit} onChange={(event) => setCarryLimit(Number(event.target.value))} /> kg</strong>
                  <small>Base: 3,5 kg a cada 4 FOR{backpackCapacity ? ` · Mochila reforçada: +${backpackCapacity} kg` : ""}{automaticBuffs.carryCapacity ? ` · Habilidades: +${automaticBuffs.carryCapacity} kg` : ""}.</small>
                  {character.carryLimitOverride !== null && <button type="button" className="load-auto-button" onClick={() => setCarryLimit(null)}>Usar cálculo automático</button>}
                </div>
                <div className="load-track"><i style={{ width: `${loadPercent}%` }} /></div>
              </div>
              <div className="equipment-toolbar">
                <div>{EQUIPMENT_CATEGORIES.map((category) => <button key={category.id} className={equipmentCategory === category.id ? "active" : ""} onClick={() => setEquipmentCategory(category.id)}>{category.name}</button>)}</div>
                <label>Armadura equipada<select value={character.armorId} onChange={(event) => update({ armorId: event.target.value })}><option value="">Nenhuma</option>{EQUIPMENT.filter((item) => item.category === "armadura" && (character.inventory[item.id] ?? 0) > 0).map((item) => <option value={item.id} key={item.id}>{item.name} · Defesa +{item.defense}</option>)}</select></label>
              </div>
              <div className="equipment-grid">
                {EQUIPMENT.filter((item) => item.category === equipmentCategory).map((item) => (
                  <article key={item.id} className={(character.inventory[item.id] ?? 0) > 0 ? "owned" : ""}>
                    <div><span>{item.category === "fogo" ? item.ammo : item.category === "armadura" ? `Defesa +${item.defense}` : item.category === "municao" ? "10 disparos" : EQUIPMENT_CATEGORIES.find((category) => category.id === item.category)?.name}</span><strong>{item.name}</strong><p>{item.description}</p><div className="equipment-mechanics">{item.damage && <b>Dano {item.damage} · {item.damageType}</b>}{item.healing && <b>Cura {item.healing}</b>}{item.capacityBonus && <b>Capacidade +{item.capacityBonus} kg</b>}<b>{item.action} · {item.range}</b><b>Custo {item.cost ?? 0}</b>{item.attackSkill && <b>Teste: {SKILLS.find((skill) => skill.id === item.attackSkill)?.name}</b>}{item.effect && <small>{item.effect}</small>}</div></div>
                    <footer><small>{item.weight.toFixed(2).replace(".", ",")} kg</small><div><button aria-label={`Remover ${item.name}`} onClick={() => changeInventory(item.id, -1)}>−</button><b>{character.inventory[item.id] ?? 0}</b><button aria-label={`Adicionar ${item.name}`} onClick={() => changeInventory(item.id, 1)}>+</button></div></footer>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel page-panel inventory-panel">
              <PanelHeading number="11B" title="Inventário" text={`${carriedItems.length} ${carriedItems.length === 1 ? "tipo de item" : "tipos de item"} · ${carriedUnits} ${carriedUnits === 1 ? "unidade carregada" : "unidades carregadas"}.`} />
              {!carriedItems.length ? (
                <div className="empty-state">O inventário está vazio. Adicione itens no catálogo de Equipamentos acima.</div>
              ) : (
                <div className="inventory-grid">
                  {carriedItems.map((item) => {
                    const quantity = character.inventory[item.id] ?? 0;
                    const category = EQUIPMENT_CATEGORIES.find((entry) => entry.id === item.category)?.name ?? "Item";
                    return (
                      <article key={item.id}>
                        <div className="inventory-item-copy"><span>{category}</span><strong>{item.name}</strong><p>{item.description}</p></div>
                        <div className="inventory-item-data">
                          <span><small>Quantidade</small><strong>{quantity}</strong></span>
                          <span><small>Peso total</small><strong>{(item.weight * quantity).toFixed(2).replace(".", ",")} kg</strong></span>
                          {item.damage && <span><small>Dano</small><strong>{item.damage} · {item.damageType}</strong></span>}
                          {item.healing && <span><small>Cura</small><strong>{item.healing}</strong></span>}
                          {item.defense && <span><small>Defesa</small><strong>+{item.defense}</strong></span>}
                          {item.capacityBonus && <span><small>Capacidade</small><strong>+{item.capacityBonus} kg</strong></span>}
                        </div>
                        <footer><small>{item.weight.toFixed(2).replace(".", ",")} kg por unidade</small><div><button aria-label={`Remover ${item.name}`} onClick={() => changeInventory(item.id, -1)}>−</button><b>{quantity}</b><button aria-label={`Adicionar ${item.name}`} onClick={() => changeInventory(item.id, 1)}>+</button></div></footer>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {section === "poder" && (
          <div className="power-layout">
            <section className="panel page-panel">
              <PanelHeading number="12" title="Manifestação Supacell" text={`PA disponível: ${currents.pa}/${maximums.pa}. A palavra-chave inspira; não limita o poder.`} />
              <div className="keyword-grid">{POWER_KEYWORDS.map((keyword) => <button key={keyword.id} className={character.power.keyword === keyword.id ? "selected" : ""} onClick={() => updatePower("keyword", keyword.id)}><strong>{keyword.name}</strong><span>{keyword.description}</span></button>)}</div>
              <div className="power-form">
                <Field label="Nome do poder"><input value={character.power.name} onChange={(event) => updatePower("name", event.target.value)} /></Field>
                <Field label="Conceito"><textarea value={character.power.concept} onChange={(event) => updatePower("concept", event.target.value)} /></Field>
              </div>
            </section>
            <section className="panel page-panel power-abilities-panel">
              <div className="panel-action-heading">
                <PanelHeading number="13" title="Habilidades do Poder" text={`${character.powerAbilities.length} ${character.powerAbilities.length === 1 ? "habilidade criada" : "habilidades criadas"}. Habilidades com dano entram automaticamente no Combate.`} />
                <button type="button" className="primary-button" onClick={openNewPowerAbility}>+ Adicionar</button>
              </div>
              {!character.powerAbilities.length && <div className="empty-state">Nenhuma habilidade de poder criada. Use “Adicionar” para registrar a primeira manifestação.</div>}
              <div className="custom-ability-list power-ability-list">
                {visiblePowerAbilities.map((ability) => {
                  const cardId = `power:${ability.id}`;
                  const expanded = expandedCards.has(cardId);
                  return (
                    <article className={`collapsible-card ${expanded ? "expanded" : ""}`} key={ability.id}>
                      <strong className="collapsible-title">{ability.name}</strong>
                      <button type="button" className="card-expand-button" aria-expanded={expanded} onClick={() => toggleCard(cardId)}>{expanded ? "Recolher" : "Expandir"}</button>
                      {expanded && <div className="collapsible-content">
                        <div className="ability-card-head"><span className="power-type">Poder</span><small>Nível {ability.level} · {ability.action} · {ability.range}</small></div>
                        <p>{ability.description || "Sem descrição."}</p>
                        <div className="mechanic-grid compact">
                          <span><b>Dano</b>{ability.damage || "—"} {ability.damage ? ability.damageType : ""}</span>
                          <span><b>Efeito</b>{ability.effect || "—"}</span>
                          <span><b>Teste de perícia</b>{SKILLS.find((skill) => skill.id === ability.attackSkill)?.name ?? "—"}</span>
                          <span><b>Ataque</b>1d20 {signed(mods[ability.attackAttribute] + getSkillTotal(ability.attackSkill) + ability.attackBonus)} ({ability.attackAttribute.toUpperCase()})</span>
                          <span><b>Custo</b>{ability.cost || "0"} {ability.costResource === "nenhum" ? "" : "PA"}</span>
                          <span><b>Crítico</b>{ability.criticalHit}+ · dano ×{ability.criticalMultiplier}</span>
                        </div>
                        <div className="card-actions"><button type="button" onClick={() => editPowerAbility(ability)}>Editar habilidade</button></div>
                      </div>}
                    </article>
                  );
                })}
              </div>
              {powerAbilityPageCount > 1 && <nav className="ability-pagination" aria-label="Páginas das habilidades do poder">
                <button type="button" disabled={currentPowerAbilityPage === 1} onClick={() => setPowerAbilityPage(currentPowerAbilityPage - 1)}>← Anterior</button>
                <div>{Array.from({ length: powerAbilityPageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === currentPowerAbilityPage ? "active" : ""} aria-current={page === currentPowerAbilityPage ? "page" : undefined} aria-label={`Página ${page}`} onClick={() => setPowerAbilityPage(page)} key={page}>{page}</button>)}</div>
                <button type="button" disabled={currentPowerAbilityPage === powerAbilityPageCount} onClick={() => setPowerAbilityPage(currentPowerAbilityPage + 1)}>Próxima →</button>
              </nav>}
            </section>
            <section className="panel page-panel notes-panel">
              <PanelHeading number="14" title="Anotações" text="Condições, contatos, pistas e consequências da campanha." />
              <textarea value={character.bio.notes} onChange={(event) => updateBio("notes", event.target.value)} placeholder="Escreva livremente…" />
            </section>
          </div>
        )}
      </section>
      </main>
      {showPowerAbilityModal && <div className="power-ability-overlay" onMouseDown={(event) => { if (event.currentTarget === event.target) closePowerAbilityModal(); }}>
        <section className="power-ability-modal" role="dialog" aria-modal="true" aria-labelledby="power-ability-modal-title">
          <header className="power-ability-modal-header">
            <div><span>MANIFESTAÇÃO // HABILIDADE</span><h2 id="power-ability-modal-title">{editingPowerAbilityId ? "Editar habilidade do poder" : "Criar habilidade do poder"}</h2><p>Defina livremente custo, alcance, efeito, teste e dano. Se houver dano, ela será enviada ao Combate.</p></div>
            <button type="button" aria-label="Fechar sem salvar" onClick={closePowerAbilityModal}>×</button>
          </header>
          <div className="power-ability-modal-body">
            <AbilityEditor value={powerAbilityDraft} onChange={(next) => setPowerAbilityDraft(normalizePowerAbility(next))} powerMode />
            <div className="form-actions power-modal-actions">
              {editingPowerAbilityId && <button type="button" className="danger-small power-delete-button" onClick={deletePowerAbility}>Apagar habilidade</button>}
              <button type="button" className="secondary-button" onClick={closePowerAbilityModal}>Fechar sem salvar</button>
              <button type="button" className="primary-button" disabled={!powerAbilityDraft.name.trim()} onClick={savePowerAbility}>{editingPowerAbilityId ? "Salvar alterações" : "Adicionar habilidade"}</button>
            </div>
          </div>
        </section>
      </div>}
      {rollDock}
    </>
  );
}

function FloatingRollDock({ entry, onClose }: { entry: FloatingRollEntry; onClose: () => void }) {
  return (
    <aside className="floating-roll-dock" aria-live="polite" aria-label="Resultado atual dos dados">
      <header className="floating-roll-dock-header">
        <div><span>DADOS // ROLAGEM</span><strong>Resultado atual</strong></div>
        <button type="button" onClick={onClose} aria-label="Fechar resultado">×</button>
      </header>
      <div className="floating-roll-body">
        {entry.kind === "skill" ? (
          <article className={`floating-roll-card skill ${entry.result.tone}`}>
            <header><span>PERÍCIA · {attributeLabel(entry.result.attribute)}</span><small>d20 [{entry.result.die}]</small></header>
            <h3>{entry.result.skillName}</h3>
            <div className="floating-roll-value"><span>RESULTADO</span><strong>{entry.result.total}</strong><em>{entry.result.tone === "critical" ? "20 natural" : "Teste de perícia"}</em></div>
            <p>{signed(entry.result.attributeModifier)} atributo · {signed(entry.result.skillBonus)} perícia</p>
          </article>
        ) : (
          <article className={`floating-roll-card combat ${entry.result.tone}`}>
            <header><span>{entry.result.nature === "poder" ? "PODER" : "FÍSICO"}</span><small>{entry.result.costText}</small></header>
            <h3>{entry.result.abilityName}</h3>
            <div className="floating-roll-values">
              <div><span>ATAQUE</span><strong>{entry.result.attackTotal}</strong><em>{entry.result.label}</em></div>
              <div><span>DANO</span><strong>{entry.result.damageTotal ?? "—"}</strong><em>{entry.result.damageType || "não definido"}</em></div>
            </div>
            <p>d20 [{entry.result.attackDice.join(", ")}] {signed(entry.result.attackAttributeModifier)} atributo · {signed(entry.result.attackSkillBonus)} {entry.result.attackSkillName} · {signed(entry.result.attackFreeBonus)} livre</p>
            {entry.result.damageTotal !== null && <p>Dados [{entry.result.damageRolls.join(", ") || "fixo"}] {signed(entry.result.damageModifier)}{entry.result.critical ? ` · base ${entry.result.baseDamageTotal} × ${entry.result.criticalMultiplier}` : ""}</p>}
          </article>
        )}
      </div>
    </aside>
  );
}

type CampaignPortalProps = {
  screen: AppScreen;
  setScreen: React.Dispatch<React.SetStateAction<AppScreen>>;
  characters: Character[];
  npcs: Character[];
  addCharacter: (slot?: number) => void;
  addNpc: (slot?: number) => void;
  openCharacter: (characterId: string) => void;
  openNpc: (npcId: string) => void;
  deleteCharacter: (characterId: string) => void;
  deleteNpc: (npcId: string) => void;
  exportCharacter: (characterId: string, kind?: "player" | "npc") => void;
  importCharacter: (event: ChangeEvent<HTMLInputElement>, kind?: "player" | "npc", slot?: number) => void;
  uploadPortrait: (characterId: string, event: ChangeEvent<HTMLInputElement>) => void;
  removePortrait: (characterId: string) => void;
  masterPassword: string;
  setMasterPassword: React.Dispatch<React.SetStateAction<string>>;
  masterUnlocked: boolean;
  setMasterUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
  masterError: string;
  setMasterError: React.Dispatch<React.SetStateAction<string>>;
  npcSlotPage: number;
  setNpcSlotPage: React.Dispatch<React.SetStateAction<number>>;
};

function CampaignPortal({
  screen,
  setScreen,
  characters,
  npcs,
  addCharacter,
  addNpc,
  openCharacter,
  openNpc,
  deleteCharacter,
  deleteNpc,
  exportCharacter,
  importCharacter,
  uploadPortrait,
  removePortrait,
  masterPassword,
  setMasterPassword,
  masterUnlocked,
  setMasterUnlocked,
  masterError,
  setMasterError,
  npcSlotPage,
  setNpcSlotPage,
}: CampaignPortalProps) {
  const navigate = (next: AppScreen) => {
    setMasterError("");
    setScreen(next);
  };

  const unlockMaster = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedDigest = await digestMasterPassword(masterPassword);
    if (submittedDigest === MASTER_PASSWORD_DIGEST) {
      setMasterUnlocked(true);
      setMasterPassword("");
      setMasterError("");
      return;
    }
    setMasterError("Senha incorreta. Verifique os espaços e tente novamente.");
  };

  const sortedCharacters = [...characters].sort((first, second) => first.slot - second.slot);
  const sortedNpcs = [...npcs].sort((first, second) => first.slot - second.slot);
  const npcPageCount = Math.ceil(MAX_NPC_SLOTS / MAX_SLOTS);
  const currentNpcPage = Math.min(npcPageCount, Math.max(1, npcSlotPage));
  const visibleNpcSlots = Array.from(
    { length: MAX_SLOTS },
    (_, index) => (currentNpcPage - 1) * MAX_SLOTS + index + 1,
  );

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <button className="portal-brand" onClick={() => navigate("inicio")} aria-label="Voltar à tela principal">
          <span className="brand-mark">S</span>
          <span><strong>SUPACELL</strong><small>ARQUIVO // LONDRES</small></span>
        </button>
        <nav className="portal-nav" aria-label="Menu principal">
          <button className={screen === "historia" ? "active" : ""} onClick={() => navigate("historia")}>História</button>
          <button className={screen === "slots" ? "active" : ""} onClick={() => navigate("slots")}>Slots <span>{characters.length}/{MAX_SLOTS}</span></button>
          <button className={screen === "mestre" ? "active" : ""} onClick={() => navigate("mestre")}>Mestre <span>{masterUnlocked ? "ABERTO" : "BLOQ."}</span></button>
        </nav>
      </header>

      <div className="portal-main">
        {screen === "inicio" && (
          <section className="portal-home">
            <div className="portal-hero">
              <span className="portal-kicker">PROTOCOLO 20 // SUL DE LONDRES</span>
              <h1>O Apagão passou.<br /><em>As consequências, não.</em></h1>
              <p>Entre na campanha, escolha um registro e descubra até onde sua manifestação pode levar você.</p>
              <div className="portal-signal"><span />SINAL SUPACELL DETECTADO</div>
            </div>

            <div className="portal-menu-grid">
              <button className="portal-option story-option" onClick={() => navigate("historia")}>
                <span className="option-index">01</span>
                <div className="option-symbol">H</div>
                <div><small>ARQUIVO DA CAMPANHA</small><strong>História</strong><p>Prólogo, capítulos, imagens e tudo que Londres já revelou.</p></div>
                <b>Explorar →</b>
              </button>
              <button className="portal-option slots-option" onClick={() => navigate("slots")}>
                <span className="option-index">02</span>
                <div className="option-symbol">{characters.length}</div>
                <div><small>SEUS PERSONAGENS</small><strong>Slots</strong><p>Crie, abra e organize até cinco fichas completas.</p></div>
                <b>{characters.length ? "Ver fichas →" : "Criar primeira ficha →"}</b>
              </button>
              <button className="portal-option master-option" onClick={() => navigate("mestre")}>
                <span className="option-index">03</span>
                <div className="option-symbol">M</div>
                <div><small>ACESSO RESTRITO</small><strong>Mestre</strong><p>Gerencie fichas de NPCs e prepare os próximos arquivos da campanha.</p></div>
                <b>{masterUnlocked ? "Acessar painel →" : "Desbloquear →"}</b>
              </button>
            </div>
          </section>
        )}

        {screen === "historia" && (
          <section className="story-page">
            <div className="portal-page-heading">
              <div><span>01 // ARQUIVO DA CAMPANHA</span><h1>História</h1></div>
              <p>Leia os arquivos em ordem. Esta é a história conhecida pelos jogadores — os segredos do Apagão permanecem ocultos.</p>
            </div>

            <nav className="story-index" aria-label="Capítulos da história">
              <a href="#historia-prologo"><span>00</span><strong>Prólogo</strong><small>Quando Londres apagou</small></a>
              <a href="#historia-capitulo-1"><span>01</span><strong>Capítulo 1</strong><small>Primeiros sinais</small></a>
              <a href="#historia-capitulo-2"><span>02</span><strong>Capítulo 2</strong><small>Depois da meia-noite</small></a>
            </nav>

            <article className="story-feature story-entry" id="historia-prologo">
              <div className="story-prologue-image">
                <img
                  src={`${SITE_BASE_PATH}/images/prologue-blackout.webp`}
                  alt="Rua do sul de Londres durante o Apagão, sob chuva e nuvens iluminadas por um brilho violeta"
                  width="1600"
                  height="900"
                  loading="lazy"
                />
              </div>
              <div className="story-feature-copy">
                <span>PRÓLOGO // ARQUIVO 00</span>
                <h2>Quando Londres apagou</h2>
                <div className="story-reading">
                  <p>Londres nunca foi uma cidade tranquila. Enquanto os arranha-céus brilhavam sobre o Tâmisa, milhões de pessoas continuavam espremidas em apartamentos pequenos, encarando jornadas longas, contas atrasadas e ruas onde uma escolha errada podia mudar uma vida inteira.</p>
                  <p>Vocês faziam parte dessa Londres. Tinham empregos, famílias, responsabilidades, sonhos e problemas. Eram pessoas comuns tentando chegar ao fim de mais um dia.</p>
                  <p>Até a noite em que todas as luzes se apagaram.</p>
                  <p>Às 23h17, uma sequência de falhas atingiu o sul de Londres. Postes apagaram, telefones perderam o sinal, câmeras pararam de gravar e carros morreram no meio das ruas. Até os geradores dos hospitais deixaram de funcionar.</p>
                  <p>Durante treze minutos e quarenta e sete segundos, parte da cidade ficou completamente isolada. Não houve tempestade, explosão ou qualquer explicação convincente.</p>
                  <p>Na escuridão, algumas pessoas sentiram uma pressão dentro do peito, calor percorrendo as veias e um som grave que parecia vir debaixo da terra. Outras juraram ter visto luzes violetas atravessando o céu, embora nenhuma câmera tenha registrado o fenômeno.</p>
                  <p>Então tudo voltou. As luzes acenderam, os telefones recuperaram o sinal e os carros tornaram a funcionar. Mas Londres já não era a mesma.</p>
                  <p>E vocês também não.</p>
                </div>
              </div>
            </article>

            <div className="story-chapters story-reading-list">
              <article className="has-story-image" id="historia-capitulo-1">
                <div className="story-chapter-image">
                  <img
                    src={`${SITE_BASE_PATH}/images/chapter1-first-signs.webp`}
                    alt="Jovem erguendo um carro estacionado enquanto testemunhas registram o primeiro sinal de uma habilidade impossível"
                    width="1600"
                    height="900"
                    loading="lazy"
                  />
                </div>
                <div className="chapter-copy">
                  <span>CAPÍTULO 01 // DEPOIS DO APAGÃO</span>
                  <h3>Primeiros sinais</h3>
                  <div className="story-reading">
                    <p>Nos dias seguintes, histórias impossíveis começaram a circular. Um jovem teria levantado um carro para libertar uma criança. Uma mulher desapareceu diante de três policiais e surgiu do outro lado da rua. Um homem sobreviveu a uma queda que deveria ter quebrado todos os ossos de seu corpo.</p>
                    <p>Alguns chamaram os vídeos de montagens. Outros falaram em experiências militares, drogas novas ou uma doença desconhecida. As autoridades classificaram tudo como acidentes, histeria coletiva e desinformação.</p>
                    <p>Mas as testemunhas começaram a desaparecer. Equipes sem identificação chegavam antes das ambulâncias. Câmeras eram recolhidas, celulares confiscados e pessoas que publicavam provas recebiam ameaças — ou simplesmente apagavam suas contas.</p>
                    <p>Nos cantos mais escondidos da internet, uma palavra começou a aparecer: <strong>SUPACELL.</strong></p>
                    <p>Ninguém sabia o que significava. Para alguns, era uma mutação. Para outros, uma arma, uma doença ou o próximo estágio da humanidade. Havia quem considerasse aquilo uma bênção e quem acreditasse que todos os afetados deveriam ser eliminados.</p>
                    <p>Enquanto Londres discutia se aquelas pessoas existiam, vocês tentavam esconder aquilo que despertava dentro de seus próprios corpos: um poder sem respostas, acompanhado apenas por limites, consequências e pela certeza de que alguém estava observando.</p>
                  </div>
                </div>
              </article>

              <article className="has-story-image" id="historia-capitulo-2">
                <div className="story-chapter-image">
                  <img
                    src={`${SITE_BASE_PATH}/images/chapter2-after-midnight.webp`}
                    alt="Cinco desconhecidos reunidos em uma estação subterrânea abandonada sob uma misteriosa luz violeta"
                    width="1600"
                    height="900"
                    loading="lazy"
                  />
                </div>
                <div className="chapter-copy">
                  <span>CAPÍTULO 02 // A FOTOGRAFIA</span>
                  <h3>Depois da meia-noite</h3>
                  <div className="story-reading">
                    <p>Três semanas depois do Apagão, cada um de vocês recebeu um envelope preto. Não havia endereço, selo ou nome de remetente.</p>
                    <p>Dentro existia apenas uma fotografia. A imagem mostrava uma estação subterrânea abandonada, iluminada por uma estranha luz violeta. No centro estavam várias pessoas reunidas: vocês.</p>
                    <p>Todos apareciam na fotografia, embora nunca tivessem se encontrado antes.</p>
                    <blockquote><strong>ASHDOWN — PLATAFORMA 0 — 00H30</strong><br />TRAGAM A FOTOGRAFIA.<br />NÃO CONFIEM EM QUEM DISSER QUE O APAGÃO FOI UM ACIDENTE.</blockquote>
                    <p>Naquela mesma noite, movidos por medo, curiosidade ou necessidade de respostas, vocês seguiram até Ashdown. A estação estava oficialmente fechada havia mais de vinte anos. Ainda assim, o portão estava aberto.</p>
                    <p>Sob as ruas de Londres, vocês encontraram as outras pessoas da fotografia: desconhecidos unidos pelo mesmo acontecimento, pela mesma mensagem e por poderes que ninguém compreendia completamente.</p>
                    <p>Antes que pudessem descobrir quem os havia chamado, veículos cercaram a estação. Passos ecoaram pelas escadas. Homens armados começaram a descer em direção à plataforma.</p>
                    <blockquote>“Se quiserem descobrir o que aconteceu naquela noite, precisarão sobreviver primeiro.”</blockquote>
                    <p>Foi assim que vocês se encontraram.</p>
                    <p>Foi assim que a caçada começou.</p>
                  </div>
                </div>
              </article>
            </div>
          </section>
        )}

        {screen === "slots" && (
          <section className="slots-page">
            <div className="portal-page-heading">
              <div><span>02 // ARQUIVO DE PERSONAGENS</span><h1>Seus Slots</h1></div>
              <p>{characters.length} de {MAX_SLOTS} ocupados. Cada slot mantém uma ficha completa e seu retrato.</p>
            </div>
            <div className="slots-progress" aria-label={`${characters.length} de ${MAX_SLOTS} slots ocupados`}>
              {Array.from({ length: MAX_SLOTS }, (_, index) => {
                const slotCharacter = sortedCharacters.find((entry) => entry.slot === index + 1);
                return (
                  <span
                    key={index}
                    className={slotCharacter ? "filled" : ""}
                    style={slotCharacter ? { "--slot-accent": CLASSES[slotCharacter.classId].accent } as CSSProperties : undefined}
                  />
                );
              })}
            </div>
            <div className="slot-grid">
              {Array.from({ length: MAX_SLOTS }, (_, index) => index + 1).map((slot) => {
                const entry = sortedCharacters.find((character) => character.slot === slot);
                if (!entry) {
                  return (
                    <article className="slot-card empty" key={slot}>
                      <span className="slot-number">SLOT {String(slot).padStart(2, "0")}</span>
                      <div className="empty-slot-actions">
                        <button className="empty-slot-action" onClick={() => addCharacter(slot)}>
                          <span>+</span><strong>Criar personagem</strong><small>Iniciar uma ficha vazia</small>
                        </button>
                        <label className="slot-import-action">Importar uma ficha<input type="file" accept="application/json" onChange={(event) => importCharacter(event, "player", slot)} /></label>
                      </div>
                    </article>
                  );
                }
                const classEntry = CLASSES[entry.classId];
                return (
                  <article className="slot-card occupied" key={slot} style={{ "--slot-accent": classEntry.accent } as CSSProperties}>
                    <span className="slot-number">SLOT {String(slot).padStart(2, "0")}</span>
                    <div className="slot-portrait">
                      {entry.portrait
                        ? <img src={entry.portrait} alt={`Retrato de ${entry.name}`} />
                        : <div className="slot-avatar-placeholder"><strong>{entry.name.slice(0, 1).toUpperCase()}</strong><span>SEM RETRATO</span></div>}
                      <label className="slot-photo-action">{entry.portrait ? "Trocar foto" : "Enviar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(entry.id, event)} /></label>
                    </div>
                    <div className="slot-copy">
                      <small>NÍVEL {String(entry.level).padStart(2, "0")}</small>
                      <h2>{entry.name || "Sem nome"}</h2>
                      <p>{classEntry.name}</p>
                    </div>
                    <div className="slot-actions">
                      <button className="primary-button" onClick={() => openCharacter(entry.id)}>Abrir ficha</button>
                      <button className="slot-export" onClick={() => exportCharacter(entry.id, "player")}>Exportar</button>
                      <button className="slot-delete" onClick={() => deleteCharacter(entry.id)}>Excluir</button>
                    </div>
                    {entry.portrait && <button className="remove-slot-photo" onClick={() => removePortrait(entry.id)}>Remover foto</button>}
                  </article>
                );
              })}
            </div>
            <p className="portal-storage-note"><span className="pulse-dot" />As fichas e fotos são salvas automaticamente neste navegador.</p>
          </section>
        )}

        {screen === "mestre" && (
          <section className="master-page">
            <div className="portal-page-heading">
              <div><span>03 // ÁREA RESTRITA</span><h1>Mestre</h1></div>
              <p>Centro de controle da campanha. As fichas de NPCs já estão disponíveis; os demais módulos chegam nas próximas etapas.</p>
            </div>
            {!masterUnlocked ? (
              <div className="master-gate">
                <div className="master-lock"><span>M</span></div>
                <span>PROTOCOLO DE SEGURANÇA</span>
                <h2>Acesso do Mestre</h2>
                <p>Digite a senha da campanha para abrir o painel reservado.</p>
                <form onSubmit={unlockMaster}>
                  <label><span>Senha</span><input type="password" autoComplete="current-password" value={masterPassword} onChange={(event) => { setMasterPassword(event.target.value); setMasterError(""); }} placeholder="Digite a senha" autoFocus /></label>
                  {masterError && <p className="master-error" role="alert">{masterError}</p>}
                  <button className="primary-button" type="submit">Desbloquear painel</button>
                </form>
              </div>
            ) : (
              <div className="master-dashboard">
                <div className="master-welcome"><div><span>ACESSO AUTORIZADO</span><h2>Painel do Mestre</h2><p>Crie e organize fichas completas de aliados, contatos e antagonistas da campanha.</p></div><button onClick={() => { setMasterUnlocked(false); setMasterPassword(""); }}>Bloquear painel</button></div>
                <section className="master-npc-section">
                  <div className="master-npc-heading">
                    <div><span>NPC // ARQUIVO RESERVADO</span><h3>Fichas de NPCs</h3><p>{npcs.length} de {MAX_NPC_SLOTS} slots ocupados. Cada NPC usa a mesma ficha completa dos jogadores.</p></div>
                    <button className="primary-button" type="button" disabled={npcs.length >= MAX_NPC_SLOTS} onClick={() => addNpc()}>+ Criar NPC</button>
                  </div>
                  <div className="npc-slots-progress" aria-label={`${npcs.length} de ${MAX_NPC_SLOTS} slots de NPC ocupados`}>
                    {Array.from({ length: MAX_NPC_SLOTS }, (_, index) => {
                      const slotNpc = sortedNpcs.find((entry) => entry.slot === index + 1);
                      return (
                        <span
                          key={index}
                          className={slotNpc ? "filled" : ""}
                          style={slotNpc ? { "--slot-accent": CLASSES[slotNpc.classId].accent } as CSSProperties : undefined}
                        />
                      );
                    })}
                  </div>
                  <div className="npc-page-heading"><span>PÁGINA {currentNpcPage} DE {npcPageCount}</span><small>Slots {String(visibleNpcSlots[0]).padStart(2, "0")}–{String(visibleNpcSlots.at(-1)).padStart(2, "0")}</small></div>
                  <div className="slot-grid master-npc-grid">
                    {visibleNpcSlots.map((slot) => {
                      const entry = sortedNpcs.find((npc) => npc.slot === slot);
                      if (!entry) {
                        return (
                          <article className="slot-card empty" key={slot}>
                            <span className="slot-number">NPC {String(slot).padStart(2, "0")}</span>
                            <div className="empty-slot-actions">
                              <button className="empty-slot-action" type="button" onClick={() => addNpc(slot)}>
                                <span>+</span><strong>Criar NPC</strong><small>Iniciar uma ficha vazia</small>
                              </button>
                              <label className="slot-import-action">Importar um NPC<input type="file" accept="application/json" onChange={(event) => importCharacter(event, "npc", slot)} /></label>
                            </div>
                          </article>
                        );
                      }
                      const classEntry = CLASSES[entry.classId];
                      return (
                        <article className="slot-card occupied" key={slot} style={{ "--slot-accent": classEntry.accent } as CSSProperties}>
                          <span className="slot-number">NPC {String(slot).padStart(2, "0")}</span>
                          <div className="slot-portrait">
                            {entry.portrait
                              ? <img src={entry.portrait} alt={`Retrato de ${entry.name}`} />
                              : <div className="slot-avatar-placeholder"><strong>{entry.name.slice(0, 1).toUpperCase()}</strong><span>SEM RETRATO</span></div>}
                            <label className="slot-photo-action">{entry.portrait ? "Trocar foto" : "Enviar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadPortrait(entry.id, event)} /></label>
                          </div>
                          <div className="slot-copy"><small>NÍVEL {String(entry.level).padStart(2, "0")}</small><h2>{entry.name || "Sem nome"}</h2><p>{classEntry.name}</p></div>
                          <div className="slot-actions"><button className="primary-button" type="button" onClick={() => openNpc(entry.id)}>Abrir ficha</button><button className="slot-export" type="button" onClick={() => exportCharacter(entry.id, "npc")}>Exportar</button><button className="slot-delete" type="button" onClick={() => deleteNpc(entry.id)}>Excluir</button></div>
                          {entry.portrait && <button className="remove-slot-photo" type="button" onClick={() => removePortrait(entry.id)}>Remover foto</button>}
                        </article>
                      );
                    })}
                  </div>
                  <nav className="npc-page-nav" aria-label="Páginas dos slots de NPCs">
                    <button type="button" disabled={currentNpcPage === 1} onClick={() => setNpcSlotPage(currentNpcPage - 1)}>← Anterior</button>
                    <div>{Array.from({ length: npcPageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === currentNpcPage ? "active" : ""} aria-current={page === currentNpcPage ? "page" : undefined} onClick={() => setNpcSlotPage(page)} key={page}>{page}</button>)}</div>
                    <button type="button" disabled={currentNpcPage === npcPageCount} onClick={() => setNpcSlotPage(currentNpcPage + 1)}>Próxima →</button>
                  </nav>
                  <p className="portal-storage-note"><span className="pulse-dot" />As fichas e fotos dos NPCs são salvas automaticamente neste navegador.</p>
                </section>
                <div className="master-module-grid master-future-grid">
                  {[
                    ["AMEAÇA", "Monstros e ameaças", "Criaturas, supers e perigos de Londres."],
                    ["CENA", "Encontros", "Iniciativa, DTs e controle de combate."],
                    ["ARQUIVO", "Campanha", "Pistas, capítulos e anotações secretas."],
                  ].map(([tag, title, description]) => <article key={tag}><span>{tag}</span><h3>{title}</h3><p>{description}</p><small>EM BREVE</small></article>)}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function PanelHeading({ number, title, text }: { number: string; title: string; text?: string }) {
  return <div className="panel-heading"><div><span className="section-number">{number}</span><h2>{title}</h2></div>{text && <p>{text}</p>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function AbilityEditor({ value, onChange, powerMode = false }: { value: EditableAbility; onChange: (ability: EditableAbility) => void; powerMode?: boolean }) {
  const patch = (next: Partial<EditableAbility>) => onChange({ ...value, ...next });
  const changeNature = (nature: AbilityNature) => patch({
    nature,
    attackAttribute: nature === "poder" ? "int" : "for",
    damageAttribute: nature === "poder" ? "int" : "for",
    costResource: nature === "poder" ? "pa" : "pe",
    attackSkill: nature === "poder" ? "ocultismo" : "luta",
    damageType: nature === "poder" ? "Supacell" : "Impacto",
  });

  return (
    <div className="ability-editor">
      <div className="editor-grid">
        <Field label="Natureza"><select value={powerMode ? "poder" : value.nature} disabled={powerMode} onChange={(event) => changeNature(event.target.value as AbilityNature)}><option value="fisica">Física</option><option value="poder">Poder</option></select></Field>
        <Field label="Nome"><input value={value.name} placeholder="Nome da habilidade" onChange={(event) => patch({ name: event.target.value })} /></Field>
        <Field label="Nível"><input type="number" min="1" max="20" value={value.level} onChange={(event) => patch({ level: Math.min(20, Math.max(1, Number(event.target.value) || 1)) })} /></Field>
        <Field label="Descrição"><textarea value={value.description} placeholder="O que a habilidade representa?" onChange={(event) => patch({ description: event.target.value })} /></Field>
        <Field label="Efeito"><textarea value={value.effect} placeholder="Condição, movimento ou consequência" onChange={(event) => patch({ effect: event.target.value })} /></Field>
        <Field label="Dano"><input value={value.damage} placeholder="Ex.: 2d6+1" onChange={(event) => patch({ damage: event.target.value })} /></Field>
        <Field label="Tipo de dano"><select value={value.damageType} onChange={(event) => patch({ damageType: event.target.value })}>{DAMAGE_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
        <Field label="Ação"><select value={value.action} onChange={(event) => patch({ action: event.target.value })}>{ACTION_OPTIONS.map((action) => <option key={action} value={action}>{action}</option>)}</select></Field>
        <Field label="Alcance"><select value={value.range} onChange={(event) => patch({ range: event.target.value })}>{RANGE_OPTIONS.map((range) => <option key={range} value={range}>{range}</option>)}</select></Field>
        <Field label="Custo"><input value={value.cost} placeholder="0" onChange={(event) => patch({ cost: event.target.value })} /></Field>
        <Field label="Recurso do custo"><select value={value.costResource} onChange={(event) => patch({ costResource: event.target.value as CostResource })}><option value="nenhum">Nenhum</option>{!powerMode && <option value="pe">PE</option>}<option value="pa">PA</option></select></Field>
        <Field label="Teste de perícia"><select value={value.attackSkill} onChange={(event) => patch({ attackSkill: event.target.value })}>{SKILLS.map((skill) => <option key={skill.id} value={skill.id}>{skill.name} ({attributeLabel(skill.attribute)})</option>)}</select></Field>
        <Field label="Atributo de ataque"><select value={value.attackAttribute} onChange={(event) => patch({ attackAttribute: event.target.value as CombatAttributeId })}>{ATTRIBUTES.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.short}</option>)}</select></Field>
        <Field label="Bônus livre de ataque"><input type="number" value={value.attackBonus} onChange={(event) => patch({ attackBonus: Number(event.target.value) || 0 })} /></Field>
        <Field label="Atributo de dano"><select value={value.damageAttribute} onChange={(event) => patch({ damageAttribute: event.target.value as CombatAttributeId })}>{ATTRIBUTES.map((attribute) => <option key={attribute.id} value={attribute.id}>{attribute.short}</option>)}</select></Field>
        <Field label="Bônus livre de dano"><input type="number" value={value.damageBonus} onChange={(event) => patch({ damageBonus: Number(event.target.value) || 0 })} /></Field>
        <Field label="Acerto crítico"><input type="number" min="1" max="20" value={value.criticalHit} onChange={(event) => patch({ criticalHit: Math.min(20, Math.max(1, Number(event.target.value) || 20)) })} /></Field>
        <Field label="Multiplicador de dano crítico"><input type="number" min="1" value={value.criticalMultiplier} onChange={(event) => patch({ criticalMultiplier: Math.max(1, Math.trunc(Number(event.target.value) || 2)) })} /></Field>
      </div>
    </div>
  );
}

export const SUPACELL_RULES_TESTING = {
  abilities: ABILITIES,
  baseScoresBySex: BASE_SCORES_BY_SEX,
  normalizeCharacterList,
  currentRulesVersion: CURRENT_RULES_VERSION,
};
