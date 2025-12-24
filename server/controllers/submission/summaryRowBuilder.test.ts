import { buildSummaryRows, buildVideoRows, SummaryRow } from './summaryRowBuilder'
import { CheckinFormData } from '../../data/models/formData'
import MentalHealth from '../../data/models/survey/mentalHealth'
import SupportAspect from '../../data/models/survey/supportAspect'
import CallbackRequested from '../../data/models/survey/callbackRequested'

describe('summaryRowBuilder', () => {
  // Mock translation function
  const mockT = (key: string): string => `translated:${key}`

  describe('buildSummaryRows', () => {
    const submissionId = 'test-submission-123'

    describe('mental health row', () => {
      it('builds row with translated mental health value', () => {
        const formData: CheckinFormData = {
          mentalHealth: MentalHealth.VeryWell,
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const mentalHealthRow = rows[0]
        expect(mentalHealthRow.key.text).toBe('translated:checkAnswers.rows.mentalHealth.key')
        expect(mentalHealthRow.value.text).toBe('Very well')
        expect(mentalHealthRow.actions.items[0].href).toBe(
          '/test-submission-123/questions/mental-health?checkAnswers=true',
        )
        expect(mentalHealthRow.actions.items[0].text).toBe('translated:common.change')
        expect(mentalHealthRow.actions.items[0].visuallyHiddenText).toBe(
          'translated:checkAnswers.rows.mentalHealth.changeHidden',
        )
      })

      it.each([
        [MentalHealth.VeryWell, 'Very well'],
        [MentalHealth.Well, 'Well'],
        [MentalHealth.Ok, 'OK'],
        [MentalHealth.NotGreat, 'Not great'],
        [MentalHealth.Struggling, 'Struggling'],
      ])('handles mental health value %s correctly', (mentalHealth, expectedText) => {
        const formData: CheckinFormData = { mentalHealth }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        expect(rows[0].value.text).toBe(expectedText)
      })

      it('handles undefined mental health gracefully', () => {
        const formData: CheckinFormData = {}

        const rows = buildSummaryRows(formData, submissionId, mockT)

        expect(rows[0].value.text).toBe('')
      })
    })

    describe('assistance row', () => {
      it('builds row with single assistance value', () => {
        const formData: CheckinFormData = {
          assistance: SupportAspect.MentalHealth,
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const assistanceRow = rows[1]
        expect(assistanceRow.key.text).toBe('translated:checkAnswers.rows.assistance.key')
        expect(assistanceRow.value.text).toBe('Mental health')
        expect(assistanceRow.actions.items[0].href).toBe('/test-submission-123/questions/assistance?checkAnswers=true')
      })

      it('builds row with multiple assistance values joined by comma', () => {
        const formData: CheckinFormData = {
          assistance: [SupportAspect.MentalHealth, SupportAspect.Housing, SupportAspect.Money],
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const assistanceRow = rows[1]
        expect(assistanceRow.value.text).toBe('Mental health, Housing, Money')
      })

      it('handles undefined assistance gracefully', () => {
        const formData: CheckinFormData = {}

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const assistanceRow = rows[1]
        expect(assistanceRow.value.text).toBe('')
      })

      it('handles empty array assistance', () => {
        const formData: CheckinFormData = {
          assistance: [],
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const assistanceRow = rows[1]
        expect(assistanceRow.value.text).toBe('')
      })

      it('trims whitespace from assistance values', () => {
        const formData: CheckinFormData = {
          assistance: [' MENTAL_HEALTH ' as SupportAspect, '  HOUSING  ' as SupportAspect],
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const assistanceRow = rows[1]
        expect(assistanceRow.value.text).toBe('Mental health, Housing')
      })

      it.each([
        [SupportAspect.MentalHealth, 'Mental health'],
        [SupportAspect.Alcohol, 'Alcohol'],
        [SupportAspect.Drugs, 'Drugs'],
        [SupportAspect.Money, 'Money'],
        [SupportAspect.Housing, 'Housing'],
        [SupportAspect.SupportSystem, 'Support system'],
        [SupportAspect.Other, 'Other'],
        [SupportAspect.NoHelp, 'No, I do not need help'],
      ])('maps assistance value %s to %s', (aspect, expected) => {
        const formData: CheckinFormData = { assistance: aspect }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        expect(rows[1].value.text).toBe(expected)
      })
    })

    describe('support detail rows', () => {
      it('includes mentalHealthSupport row when provided', () => {
        const formData: CheckinFormData = {
          assistance: SupportAspect.MentalHealth,
          mentalHealthSupport: 'I need help with anxiety',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.mentalHealthSupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('I need help with anxiety')
        expect(supportRow!.actions.items[0].href).toBe('/test-submission-123/questions/assistance?checkAnswers=true')
      })

      it('includes alcoholSupport row when provided', () => {
        const formData: CheckinFormData = {
          assistance: SupportAspect.Alcohol,
          alcoholSupport: 'Need support with drinking',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.alcoholSupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('Need support with drinking')
      })

      it('includes drugsSupport row when provided', () => {
        const formData: CheckinFormData = {
          drugsSupport: 'Need drug support',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.drugsSupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('Need drug support')
      })

      it('includes moneySupport row when provided', () => {
        const formData: CheckinFormData = {
          moneySupport: 'Having financial difficulties',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.moneySupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('Having financial difficulties')
      })

      it('includes housingSupport row when provided', () => {
        const formData: CheckinFormData = {
          housingSupport: 'Need stable accommodation',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.housingSupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('Need stable accommodation')
      })

      it('includes supportSystemSupport row when provided', () => {
        const formData: CheckinFormData = {
          supportSystemSupport: 'Need family support',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.supportSystemSupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('Need family support')
      })

      it('includes otherSupport row when provided', () => {
        const formData: CheckinFormData = {
          otherSupport: 'Other needs',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const supportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.otherSupport.key')
        expect(supportRow).toBeDefined()
        expect(supportRow!.value.text).toBe('Other needs')
      })

      it('excludes support rows when values are empty strings', () => {
        const formData: CheckinFormData = {
          mentalHealthSupport: '',
          alcoholSupport: '',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const mentalHealthSupportRow = rows.find(
          r => r.key.text === 'translated:checkAnswers.rows.mentalHealthSupport.key',
        )
        const alcoholSupportRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.alcoholSupport.key')
        expect(mentalHealthSupportRow).toBeUndefined()
        expect(alcoholSupportRow).toBeUndefined()
      })

      it('includes multiple support rows when all provided', () => {
        const formData: CheckinFormData = {
          mentalHealthSupport: 'Mental health details',
          alcoholSupport: 'Alcohol details',
          drugsSupport: 'Drugs details',
          moneySupport: 'Money details',
          housingSupport: 'Housing details',
          supportSystemSupport: 'Support system details',
          otherSupport: 'Other details',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        // Should have: mentalHealth, assistance, 7 support rows, callback = 10 rows
        expect(rows.length).toBe(10)
      })
    })

    describe('callback row', () => {
      it('builds callback row with YES value', () => {
        const formData: CheckinFormData = {
          callback: CallbackRequested.Yes,
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callback.key')
        expect(callbackRow).toBeDefined()
        expect(callbackRow!.value.text).toBe('Yes')
        expect(callbackRow!.actions.items[0].href).toBe('/test-submission-123/questions/callback?checkAnswers=true')
      })

      it('builds callback row with NO value', () => {
        const formData: CheckinFormData = {
          callback: CallbackRequested.No,
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callback.key')
        expect(callbackRow!.value.text).toBe('No')
      })

      it('handles undefined callback gracefully', () => {
        const formData: CheckinFormData = {}

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callback.key')
        expect(callbackRow!.value.text).toBe('')
      })
    })

    describe('callback details row', () => {
      it('includes callbackDetails row when callback is YES and details provided', () => {
        const formData: CheckinFormData = {
          callback: CallbackRequested.Yes,
          callbackDetails: 'Please call in the morning',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackDetailsRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callbackDetails.key')
        expect(callbackDetailsRow).toBeDefined()
        expect(callbackDetailsRow!.value.text).toBe('Please call in the morning')
        expect(callbackDetailsRow!.actions.items[0].href).toBe(
          '/test-submission-123/questions/callback?checkAnswers=true',
        )
      })

      it('excludes callbackDetails row when callback is NO', () => {
        const formData: CheckinFormData = {
          callback: CallbackRequested.No,
          callbackDetails: 'This should not appear',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackDetailsRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callbackDetails.key')
        expect(callbackDetailsRow).toBeUndefined()
      })

      it('excludes callbackDetails row when callback is YES but details empty', () => {
        const formData: CheckinFormData = {
          callback: CallbackRequested.Yes,
          callbackDetails: '',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackDetailsRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callbackDetails.key')
        expect(callbackDetailsRow).toBeUndefined()
      })

      it('excludes callbackDetails row when callback is undefined', () => {
        const formData: CheckinFormData = {
          callbackDetails: 'Details without callback',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        const callbackDetailsRow = rows.find(r => r.key.text === 'translated:checkAnswers.rows.callbackDetails.key')
        expect(callbackDetailsRow).toBeUndefined()
      })
    })

    describe('row ordering', () => {
      it('returns rows in correct order', () => {
        const formData: CheckinFormData = {
          mentalHealth: MentalHealth.Well,
          assistance: SupportAspect.Housing,
          housingSupport: 'Need housing help',
          callback: CallbackRequested.Yes,
          callbackDetails: 'Call me',
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)

        expect(rows[0].key.text).toBe('translated:checkAnswers.rows.mentalHealth.key')
        expect(rows[1].key.text).toBe('translated:checkAnswers.rows.assistance.key')
        expect(rows[2].key.text).toBe('translated:checkAnswers.rows.housingSupport.key')
        expect(rows[3].key.text).toBe('translated:checkAnswers.rows.callback.key')
        expect(rows[4].key.text).toBe('translated:checkAnswers.rows.callbackDetails.key')
      })
    })

    describe('row structure', () => {
      it('builds row with correct structure', () => {
        const formData: CheckinFormData = {
          mentalHealth: MentalHealth.Well,
        }

        const rows = buildSummaryRows(formData, submissionId, mockT)
        const row = rows[0]

        expect(row).toEqual({
          key: { text: expect.any(String) },
          value: { text: expect.any(String) },
          actions: {
            items: [
              {
                href: expect.any(String),
                text: expect.any(String),
                visuallyHiddenText: expect.any(String),
              },
            ],
          },
        })
      })
    })
  })

  describe('buildVideoRows', () => {
    const submissionId = 'video-test-123'

    it('returns MATCH text when autoVerifyResult is MATCH', () => {
      const rows = buildVideoRows('MATCH', submissionId, mockT)

      expect(rows).toHaveLength(1)
      expect(rows[0].key.text).toBe('translated:checkAnswers.rows.videoCheck.key')
      expect(rows[0].value.text).toBe('translated:checkAnswers.rows.videoCheck.match')
    })

    it('returns noMatch text when autoVerifyResult is not MATCH', () => {
      const rows = buildVideoRows('NO_MATCH', submissionId, mockT)

      expect(rows[0].value.text).toBe('translated:checkAnswers.rows.videoCheck.noMatch')
    })

    it('returns noMatch text when autoVerifyResult is empty', () => {
      const rows = buildVideoRows('', submissionId, mockT)

      expect(rows[0].value.text).toBe('translated:checkAnswers.rows.videoCheck.noMatch')
    })

    it('returns noMatch text for any other value', () => {
      const rows = buildVideoRows('PENDING', submissionId, mockT)

      expect(rows[0].value.text).toBe('translated:checkAnswers.rows.videoCheck.noMatch')
    })

    it('builds correct action with view link', () => {
      const rows = buildVideoRows('MATCH', submissionId, mockT)

      expect(rows[0].actions.items).toHaveLength(1)
      expect(rows[0].actions.items[0].href).toBe('/video-test-123/video/view?checkAnswers=true')
      expect(rows[0].actions.items[0].text).toBe('translated:common.view')
      expect(rows[0].actions.items[0].visuallyHiddenText).toBe('translated:checkAnswers.rows.videoCheck.viewHidden')
    })

    it('returns correct row structure', () => {
      const rows = buildVideoRows('MATCH', submissionId, mockT)

      expect(rows[0]).toEqual<SummaryRow>({
        key: { text: 'translated:checkAnswers.rows.videoCheck.key' },
        value: { text: 'translated:checkAnswers.rows.videoCheck.match' },
        actions: {
          items: [
            {
              href: '/video-test-123/video/view?checkAnswers=true',
              text: 'translated:common.view',
              visuallyHiddenText: 'translated:checkAnswers.rows.videoCheck.viewHidden',
            },
          ],
        },
      })
    })
  })
})
