import { describe, it } from 'vitest';
import {
  DISEASES, MEDICAL_TERMS, SYMPTOMS, PHRASES, VOCABULARY, READINGS, CASES, GRAMMAR, MEDICATIONS, INVESTIGATIONS,
} from '@/lib/content';

describe('content audit', () => {
  it('reports register-C and dialogue coverage', () => {
    const pct = (n: number, d: number) => `${n}/${d} (${Math.round((n / Math.max(1, d)) * 100)}%)`;

    console.log('=== SYMPTOM-TO-PHRASE LINKAGE ===');
    // How many symptom patient-expressions appear verbatim inside phrasebook lines?
    const phraseText = PHRASES.map(p => p.japanese).join(' ');
    let linked = 0;
    for (const s of SYMPTOMS) {
      if (s.patientExpressions.some(e => phraseText.includes(e))) linked += 1;
    }
    console.log('symptoms whose patient wording appears in the phrasebook:', pct(linked, SYMPTOMS.length));

    console.log('=== TERM-TO-TERM RELATIONS ===');
    const surface = new Set([...MEDICAL_TERMS.map(t => t.japanese), ...SYMPTOMS.map(s => s.japanese), ...DISEASES.map(d => d.japanese)]);
    let resolvable = 0, totalRefs = 0;
    for (const t of MEDICAL_TERMS) {
      for (const rel of t.relatedIds) {
        totalRefs += 1;
        if (surface.has(rel)) resolvable += 1;
      }
    }
    console.log('term.relatedIds resolvable:', pct(resolvable, totalRefs));
    let dResolvable = 0, dTotal = 0;
    for (const d of DISEASES) {
      for (const rel of d.relatedTerms) {
        dTotal += 1;
        if (surface.has(rel)) dResolvable += 1;
      }
    }
    console.log('disease.relatedTerms resolvable:', pct(dResolvable, dTotal));

    console.log('=== CASE-TO-SYMPTOM COVERAGE ===');
    console.log('cases with no matching symptom page topic:', CASES.filter(c => !c.requiredQuestions.some(q => SYMPTOMS.some(s => s.doctorQuestions.includes(q.acceptedPhrases[0])))).map(c => c.id).join(', ') || 'none');

    console.log('=== MEDICAL TERMS ===');
    console.log('patientFriendly:', pct(MEDICAL_TERMS.filter(t => t.patientFriendly).length, MEDICAL_TERMS.length));
    console.log('patientExpression:', pct(MEDICAL_TERMS.filter(t => t.patientExpression).length, MEDICAL_TERMS.length));
    console.log('definitionJa:', pct(MEDICAL_TERMS.filter(t => t.definitionJa).length, MEDICAL_TERMS.length));
    console.log('no relatedIds:', pct(MEDICAL_TERMS.filter(t => t.relatedIds.length === 0).length, MEDICAL_TERMS.length));

    console.log('=== SYMPTOMS ===');
    console.log('patientFriendlyExplanation:', pct(SYMPTOMS.filter(s => s.patientFriendlyExplanation).length, SYMPTOMS.length));
    console.log('redFlags:', pct(SYMPTOMS.filter(s => s.redFlags.length > 0).length, SYMPTOMS.length));
    console.log('descriptors:', pct(SYMPTOMS.filter(s => s.descriptors.length > 0).length, SYMPTOMS.length));
    console.log('associatedQuestions:', pct(SYMPTOMS.filter(s => s.associatedQuestions.length > 0).length, SYMPTOMS.length));
    console.log('avg patientExpressions:', (SYMPTOMS.reduce((a, s) => a + s.patientExpressions.length, 0) / SYMPTOMS.length).toFixed(1));
    console.log('avg doctorQuestions:', (SYMPTOMS.reduce((a, s) => a + s.doctorQuestions.length, 0) / SYMPTOMS.length).toFixed(1));

    console.log('=== DISEASES ===');
    console.log('dialogue turns:', pct(DISEASES.filter(d => d.dialogue.length > 0).length, DISEASES.length), '(pages with any dialogue)');
    console.log('avg dialogue turns:', (DISEASES.reduce((a, d) => a + d.dialogue.length, 0) / DISEASES.length).toFixed(1));
    console.log('causeExplanation:', pct(DISEASES.filter(d => d.causeExplanation).length, DISEASES.length));
    console.log('examinationPhrases:', pct(DISEASES.filter(d => d.examinationPhrases.length > 0).length, DISEASES.length));
    console.log('investigationExplanations:', pct(DISEASES.filter(d => d.investigationExplanations.length > 0).length, DISEASES.length));
    console.log('treatmentPhrases:', pct(DISEASES.filter(d => d.treatmentPhrases.length > 0).length, DISEASES.length));
    console.log('redFlagPhrases:', pct(DISEASES.filter(d => d.redFlagPhrases.length > 0).length, DISEASES.length));
    console.log('admissionWording:', pct(DISEASES.filter(d => d.admissionWording.length > 0).length, DISEASES.length));
    console.log('layJapanese:', pct(DISEASES.filter(d => d.layJapanese).length, DISEASES.length));
    console.log('verified status:', DISEASES.map(d => d.verificationStatus).join(','));

    console.log('=== PHRASES ===');
    const byRegister: Record<string, number> = {};
    for (const p of PHRASES) byRegister[p.register] = (byRegister[p.register] ?? 0) + 1;
    console.log('by register:', JSON.stringify(byRegister));
    const byStage: Record<string, number> = {};
    for (const p of PHRASES) byStage[p.stage] = (byStage[p.stage] ?? 0) + 1;
    console.log('by stage:', JSON.stringify(byStage));
    console.log('with variants:', pct(PHRASES.filter(p => p.variants.length > 0).length, PHRASES.length));
    console.log('with kana:', pct(PHRASES.filter(p => p.kana).length, PHRASES.length));
    console.log('with romaji:', pct(PHRASES.filter(p => p.romaji).length, PHRASES.length));
    console.log('with clinical context:', pct(PHRASES.filter(p => p.clinicalContext).length, PHRASES.length));
    console.log('speaker coverage:', new Set(PHRASES.map(p => p.speaker)).size, 'speakers');

    console.log('=== MEDICATIONS ===');
    console.log('entries:', MEDICATIONS.length);
    console.log('romaji:', pct(MEDICATIONS.filter(m => m.romaji).length, MEDICATIONS.length));
    console.log('counselling:', pct(MEDICATIONS.filter(m => m.whyPrescribed && m.allergyQuestion && m.reconciliationQuestions.length > 0).length, MEDICATIONS.length));

    console.log('=== INVESTIGATIONS ===');
    console.log('entries:', INVESTIGATIONS.length);
    console.log('romaji:', pct(INVESTIGATIONS.filter(i => i.romaji).length, INVESTIGATIONS.length));
    console.log('patient explanation:', pct(INVESTIGATIONS.filter(i => i.patientExplanation).length, INVESTIGATIONS.length));
    console.log('result discussion:', pct(INVESTIGATIONS.filter(i => i.resultDiscussion).length, INVESTIGATIONS.length));

    console.log('=== VOCABULARY ===');
    console.log('with kana:', pct(VOCABULARY.filter(v => v.kana).length, VOCABULARY.length));
    console.log('definitionJa:', pct(VOCABULARY.filter(v => v.definitionJa).length, VOCABULARY.length));
    console.log('>=2 examples:', pct(VOCABULARY.filter(v => v.examples.length >= 2).length, VOCABULARY.length));
    console.log('with synonyms:', pct(VOCABULARY.filter(v => (v.synonyms ?? []).length > 0).length, VOCABULARY.length));
    console.log('medicalRelevance:', pct(VOCABULARY.filter(v => v.medicalRelevance).length, VOCABULARY.length));
    const byLevel: Record<string, number> = {};
    for (const v of VOCABULARY) byLevel[v.jlptLevel ?? 'none'] = (byLevel[v.jlptLevel ?? 'none'] ?? 0) + 1;
    console.log('by level:', JSON.stringify(byLevel));

    console.log('=== GRAMMAR ===');
    console.log('with readingExample:', pct(GRAMMAR.filter(g => g.readingExample).length, GRAMMAR.length));
    console.log('with commonMistakes:', pct(GRAMMAR.filter(g => g.commonMistakes.length > 0).length, GRAMMAR.length));
    console.log('with contrastNote:', pct(GRAMMAR.filter(g => g.contrastNote).length, GRAMMAR.length));

    console.log('=== READINGS ===');
    for (const r of READINGS) {
      const annotated = (r.text.match(/\{[^{}|]+\|[^{}|]+\}/g) ?? []).length;
      console.log(`${r.id}: ${r.characterCount}字 ${r.questions.length}q annotations=${annotated} verification=${r.verificationStatus}`);
    }

    console.log('=== CASES ===');
    for (const c of CASES) {
      console.log(`${c.id}: drillTerms=${c.drillTerms.length} redFlags=${c.requiredQuestions.filter(q => q.redFlag).length} lines=${c.patientLines.length}`);
    }
  });
});
