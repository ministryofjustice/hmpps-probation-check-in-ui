import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default [
  ...hmppsConfig(),
  {
    languageOptions: {
      ecmaVersion: 2020,
    },
  },
]
