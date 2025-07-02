// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    pnpm: true,
  },
  {
    rules: {
      'ts/no-redeclare': 'off',
      'ts/ban-ts-comment': 'off',
      'perfectionist/sort-imports': 'off',
    },
  },
)
