const { findViolations } = require('../scripts/validate-terminology.cjs') as {
  findViolations: (root?: string) => string;
};

it('keeps prohibited terminology out of implementation files', () => {
  expect(findViolations()).toBe('');
});
