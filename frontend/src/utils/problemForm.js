const languages = ['C++', 'Java', 'JavaScript'];

// Pick editable fields only. Hidden tests are deliberately absent: the read API
// does not expose them, and the update endpoint preserves omitted fields.
export function problemFormValues(problem) {
  return {
    title: problem.title ?? '',
    description: problem.description ?? '',
    difficulty: problem.difficulty ?? 'easy',
    tags: problem.tags ?? 'array',
    visibleTestCases: (problem.visibleTestCases ?? []).map(({ input, output, explanation }) => ({ input, output, explanation })),
    startCode: languages.map(language => ({
      language,
      initialCode: problem.startCode?.find(code => code.language === language)?.initialCode ?? '',
    })),
    referenceSolution: languages.map(language => ({
      language,
      completeCode: problem.referenceSolution?.find(code => code.language === language)?.completeCode ?? '',
    })),
  };
}
