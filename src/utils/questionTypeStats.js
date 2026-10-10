// Shared helpers for the result "detailed data table" (stats by question type)
// and the "time taken" display.

// Maps the loosely-typed question_type keys (set in the reading/listening editors
// and the admin "question typing" tool) to human labels. Unknown keys are
// prettified as a fallback. Keys are matched case-insensitively.
export const QUESTION_TYPE_LABELS = {
  true_false_not_given: 'True / False / Not Given',
  true_false_ng: 'True / False / Not Given',
  true_false: 'True / False / Not Given',
  yes_no_not_given: 'Yes / No / Not Given',
  yes_no_ng: 'Yes / No / Not Given',
  matching_headings: 'Matching Headings',
  matching_information: 'Matching Information',
  matching: 'Matching Information',
  matching_names: 'Matching Names / Features',
  matching_features: 'Matching Features',
  matching_features_dragdrop: 'Matching Features (Drag & Drop)',
  matching_features_drag: 'Matching Features (Drag & Drop)',
  matching_features_table: 'Matching Features (Table)',
  matching_sentence_endings: 'Matching Sentence Endings',
  summary_completion_wordlist: 'Summary Completion (With Word List)',
  summary_completion_word_list: 'Summary Completion (With Word List)',
  multiple_choice: 'Multiple Choice (One Answer)',
  multiple_choice_single: 'Multiple Choice (One Answer)',
  multiple_choice_many: 'Multiple Choice (Many Answers)',
  multiple_choice_multiple: 'Multiple Choice (Many Answers)',
  checkbox: 'Multiple Choice (Many Answers)',
  two_options: 'Multiple Choice (Many Answers)',
  three_options: 'Multiple Choice (Many Answers)',
  fill_blank: 'Fill in the Blank',
  fill_in_blank: 'Fill in the Blank',
  summary_completion: 'Summary Completion',
  sentence_completion: 'Sentence Completion',
  note_completion: 'Note Completion',
  table_completion: 'Table Completion',
  form_completion: 'Form Completion',
  flow_chart: 'Flow Chart Completion',
  flow_chart_completion: 'Flow Chart Completion',
  diagram_labelling: 'Diagram Labelling',
  diagram_label: 'Diagram Labelling',
  plan_map_diagram: 'Plan / Map / Diagram',
  map: 'Map',                 // writing task-1 category "map" → "Map" (reading uses map_labelling)
  map_labelling: 'Map Labelling',
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  // Writing Task 1 categories (from the question typing / forecast tools)
  line: 'Line graph',
  bar: 'Bar chart',
  pie: 'Pie chart',
  table: 'Table',
  process: 'Process',
  mixed_task1: 'Mixed (Task 1)',
  // Writing Task 2 categories
  agree_disagree: 'Agree / Disagree',
  negative_positive: 'Positive / Negative',
  advantages_disadvantages: 'Advantages / Disadvantages',
  discuss_opinion: 'Discuss both views',
  solutions_effects: 'Causes / Solutions / Effects',
  two_parts_mixed: 'Two-part / Mixed',
};

const prettify = (key) =>
  String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const labelForType = (key) => {
  if (!key) return 'Uncategorised';
  const k = String(key).toLowerCase().trim();
  return QUESTION_TYPE_LABELS[k] || prettify(k);
};

/**
 * Group detailed answers by question type and count correct/wrong/blank + accuracy.
 * Returns rows sorted by the first question number of each type (paper order).
 * `evaluation` is 'correct' | 'wrong' | 'blank'.
 */
export const computeTypeStats = (detailedAnswers = []) => {
  const groups = {};
  detailedAnswers.forEach((a) => {
    const raw = a.category || a.question_type;   // prefer the admin-assigned IELTS category
    if (raw === 'main_text') return; // passage/heading sentinel, not a real question
    const label = labelForType(raw);
    if (!groups[label]) {
      groups[label] = { type: label, total: 0, correct: 0, wrong: 0, blank: 0, firstQ: Infinity };
    }
    const g = groups[label];
    g.total += 1;
    if (a.evaluation === 'correct') g.correct += 1;
    else if (a.evaluation === 'wrong') g.wrong += 1;
    else g.blank += 1;
    const qn = Number(a.question_number);
    if (!Number.isNaN(qn) && qn < g.firstQ) g.firstQ = qn;
  });
  return Object.values(groups)
    .map((g) => ({
      ...g,
      accuracy: g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0,
    }))
    .sort((a, b) => a.firstQ - b.firstQ);
};

/** Format elapsed seconds as "1 h 5 min", "12 min 34 s", or "45 s". */
export const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${sec} s`;
  return `${sec} s`;
};
