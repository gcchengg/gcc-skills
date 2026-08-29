import { fileURLToPath } from 'node:url';
import { CATALOG_META } from '../src/data/meta.js';
import { TASKS } from '../src/data/tasks.js';
import { SKILLS } from '../src/data/skills.js';

const COLLECTION_NAMES = ['industries', 'roles', 'tasks', 'questions', 'skills', 'capabilities'];
const TASK_ID = /^[a-z][a-z0-9_]+$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;
const GITHUB_REPOSITORY_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
const LEARNING_COSTS = new Set(['low', 'medium', 'high']);
const REQUIRED_SKILL_STRING_FIELDS = ['id', 'name', 'summary', 'githubUrl', 'qualityGrade', 'learningCost', 'verifiedAt', 'riskNote'];

function asRecords(catalog, name, errors) {
  const records = catalog?.[name];
  if (!Array.isArray(records)) {
    errors.push(`${name} must be an array`);
    return [];
  }
  return records;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value) {
  if (!nonEmptyString(value)) return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1, 4).map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

function isFrozenReadmeUrl(value, repositoryUrl) {
  if (!nonEmptyString(value)) return false;
  try {
    const evidenceUrl = new URL(value);
    const repository = new URL(repositoryUrl);
    if (evidenceUrl.origin !== repository.origin) return false;
    const repositoryPath = repository.pathname.replace(/\/$/, '');
    if (!evidenceUrl.pathname.startsWith(`${repositoryPath}/blob/`)) return false;
    const pathAfterBlob = evidenceUrl.pathname.slice(`${repositoryPath}/blob/`.length).split('/');
    const [revision, ...filePath] = pathAfterBlob;
    return /^[a-f0-9]{7,40}$/i.test(revision)
      && /^readme(?:\.[a-z0-9_-]+)?$/i.test(filePath.at(-1) ?? '');
  } catch {
    return false;
  }
}

function isFrozenSkillUrl(value) {
  if (!nonEmptyString(value)) return false;
  try {
    const sourceUrl = new URL(value);
    const parts = sourceUrl.pathname.split('/').filter(Boolean);
    return sourceUrl.origin === 'https://github.com'
      && parts.length >= 6
      && parts[2] === 'blob'
      && /^[a-f0-9]{7,40}$/i.test(parts[3])
      && parts.at(-1) === 'SKILL.md';
  } catch {
    return false;
  }
}

function isGitHubSkillLocation(value) {
  return GITHUB_REPOSITORY_URL.test(value ?? '') || isFrozenSkillUrl(value);
}

function hasReviewableEvidence(evidence, repositoryUrl) {
  if (isFrozenSkillUrl(repositoryUrl)) return evidence === repositoryUrl;
  if (typeof evidence === 'string') return isFrozenReadmeUrl(evidence, repositoryUrl);
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return false;
  return evidence.repositoryUrl === repositoryUrl && isFrozenReadmeUrl(evidence.readmeUrl, repositoryUrl);
}

function validateIds(name, records, errors) {
  const ids = new Set();
  for (const record of records) {
    if (!record || typeof record !== 'object' || !nonEmptyString(record.id)) {
      errors.push(`${name} record must have a non-empty id`);
      continue;
    }
    if (ids.has(record.id)) errors.push(`duplicate ${name.slice(0, -1)} id: ${record.id}`);
    ids.add(record.id);
  }
  return ids;
}

function validateDates(record, label, errors) {
  for (const [field, value] of Object.entries(record)) {
    if (field.endsWith('At') && !isIsoDate(value)) errors.push(`${label}.${field} must be an ISO date`);
  }
}

function validateMeta(errors) {
  if (!nonEmptyString(CATALOG_META.version)) errors.push('CATALOG_META.version must be a non-empty string');
  if (!isIsoDate(CATALOG_META.verifiedAt)) errors.push('CATALOG_META.verifiedAt must be an ISO date');
  if (!Number.isInteger(CATALOG_META.minimumVerifiedSkills) || CATALOG_META.minimumVerifiedSkills < 0) {
    errors.push('CATALOG_META.minimumVerifiedSkills must be a non-negative integer');
  }
}

/**
 * Validate the offline catalog data contract.
 *
 * Tasks are the canonical registry for each role's taskWeights keys. Capability
 * IDs describe uncovered gaps and are deliberately separate from task IDs.
 */
export function validateCatalog(catalog, { enforceMinimum = false } = {}) {
  const errors = [];
  validateMeta(errors);

  const records = Object.fromEntries(COLLECTION_NAMES.map((name) => [name, asRecords(catalog, name, errors)]));
  const ids = Object.fromEntries(COLLECTION_NAMES.map((name) => [name, validateIds(name, records[name], errors)]));

  for (const [name, collection] of Object.entries(records)) {
    collection.forEach((record, index) => {
      if (record && typeof record === 'object') validateDates(record, `${name}[${index}]`, errors);
    });
  }

  records.skills.forEach((skill, index) => {
    const label = `skills[${index}]`;
    if (!skill || typeof skill !== 'object') return;
    for (const field of REQUIRED_SKILL_STRING_FIELDS) {
      if (!nonEmptyString(skill[field])) errors.push(`${label}.${field} must be a non-empty string`);
    }
    if (typeof skill.evidence !== 'string' && (!skill.evidence || typeof skill.evidence !== 'object' || Array.isArray(skill.evidence))) {
      errors.push(`${label}.evidence must be a non-empty string or structured evidence object`);
    }
    if (!isGitHubSkillLocation(skill.githubUrl)) errors.push(`${label}.githubUrl must be a GitHub repository URL or frozen SKILL.md source`);
    if (!hasReviewableEvidence(skill.evidence, skill.githubUrl)) {
      errors.push(`${label}.evidence must be frozen README evidence or its frozen SKILL.md source`);
    }
    if (!['A', 'B'].includes(skill.qualityGrade)) errors.push(`${label}.qualityGrade must be A or B`);
    if (!LEARNING_COSTS.has(skill.learningCost)) errors.push(`${label}.learningCost must be low, medium, or high`);
    if (!Array.isArray(skill.taskTags)) {
      errors.push(`${label}.taskTags must be an array`);
    } else {
      if (skill.taskTags.length === 0) errors.push(`${label}.taskTags must not be empty`);
      for (const taskId of skill.taskTags) {
        if (!ids.tasks.has(taskId)) errors.push(`${label}.taskTags references unknown task tag: ${taskId}`);
      }
    }
    if (!Array.isArray(skill.industryIds)) {
      errors.push(`${label}.industryIds must be an array`);
    } else {
      if (skill.industryIds.length === 0) errors.push(`${label}.industryIds must not be empty`);
      if (ids.industries.size > 0) {
        for (const industryId of skill.industryIds) {
          if (!ids.industries.has(industryId)) errors.push(`${label}.industryIds contains unknown industry: ${industryId}`);
        }
      }
    }
    if (!Array.isArray(skill.roleIds) || skill.roleIds.length === 0) errors.push(`${label}.roleIds must be a non-empty array`);
    if (typeof skill.softwareDevelopmentOnly !== 'boolean') {
      errors.push(`${label}.softwareDevelopmentOnly must be a boolean`);
    }
  });

  const skillUrls = new Set();
  records.skills.forEach((skill) => {
    if (!nonEmptyString(skill?.githubUrl)) return;
    if (skillUrls.has(skill.githubUrl)) errors.push(`duplicate skill githubUrl: ${skill.githubUrl}`);
    skillUrls.add(skill.githubUrl);
  });
  const softwareOnlyCount = records.skills.filter((skill) => skill?.softwareDevelopmentOnly === true).length;
  if (records.skills.length > 0 && softwareOnlyCount / records.skills.length > 0.2) {
    errors.push(`software-development-only skills exceed 20%: ${softwareOnlyCount}/${records.skills.length}`);
  }

  records.capabilities.forEach((capability, index) => {
    const label = `capabilities[${index}]`;
    if (capability && typeof capability === 'object' && Object.hasOwn(capability, 'githubUrl')) {
      errors.push(`${label}.githubUrl is not allowed for capability records`);
    }
    if (!Array.isArray(capability?.taskTags)) {
      errors.push(`${label}.taskTags must be an array`);
      return;
    }
    for (const taskId of capability.taskTags) {
      if (!ids.tasks.has(taskId)) errors.push(`${label}.taskTags references unknown task tag: ${taskId}`);
    }
  });

  records.tasks.forEach((task, index) => {
    if (!TASK_ID.test(task?.id ?? '')) errors.push(`tasks[${index}].id must match ${TASK_ID}`);
  });

  records.roles.forEach((role, index) => {
    if (!role || typeof role !== 'object') return;
    const label = `roles[${index}]`;
    if (!Array.isArray(role.industryIds)) {
      errors.push(`${label}.industryIds must be an array`);
    } else {
      for (const industryId of role.industryIds) {
        if (!ids.industries.has(industryId)) errors.push(`${label}.industryIds contains unknown industry: ${industryId}`);
      }
    }
    if (!role.taskWeights || typeof role.taskWeights !== 'object' || Array.isArray(role.taskWeights)) {
      errors.push(`${label}.taskWeights must be an object`);
      return;
    }
    for (const taskId of Object.keys(role.taskWeights)) {
      if (!TASK_ID.test(taskId)) errors.push(`${label}.taskWeights has invalid task ID: ${taskId}`);
      if (!ids.tasks.has(taskId)) errors.push(`${label}.taskWeights references unknown task: ${taskId}`);
    }
  });

  records.questions.forEach((question, questionIndex) => {
    if (!question || typeof question !== 'object') return;
    if (!Array.isArray(question.options)) {
      errors.push(`questions[${questionIndex}].options must be an array`);
      return;
    }
    question.options.forEach((option, optionIndex) => {
      const delta = option?.delta;
      if (!Number.isInteger(delta) || delta < -3 || delta > 3) {
        errors.push(`questions[${questionIndex}].options[${optionIndex}].delta must be an integer between -3 and 3`);
      }
    });
  });

  if (enforceMinimum) {
    const verifiedSkills = records.skills.filter((skill) => (
      skill && typeof skill === 'object'
      && isGitHubSkillLocation(skill.githubUrl)
      && hasReviewableEvidence(skill.evidence, skill.githubUrl)
      && ['A', 'B'].includes(skill.qualityGrade)
      && LEARNING_COSTS.has(skill.learningCost)
      && Array.isArray(skill.taskTags) && skill.taskTags.length > 0
      && Array.isArray(skill.industryIds) && skill.industryIds.length > 0
      && Array.isArray(skill.roleIds) && skill.roleIds.length > 0
      && typeof skill.softwareDevelopmentOnly === 'boolean'
    )).length;
    if (verifiedSkills < CATALOG_META.minimumVerifiedSkills) {
      errors.push(`minimumVerifiedSkills requires ${CATALOG_META.minimumVerifiedSkills} verified skills; found ${verifiedSkills}`);
    }
  }

  return errors;
}

function runCli() {
  const errors = validateCatalog({ industries: [], roles: [], tasks: TASKS, questions: [], skills: SKILLS, capabilities: [] }, {
    enforceMinimum: true
  });
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`Catalog data contract is valid (${SKILLS.length} verified skills).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) runCli();
