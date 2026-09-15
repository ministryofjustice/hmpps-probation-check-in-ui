import { dataAccess } from '../data'
import AuditService from './auditService'
import EsupervisionService from './esupervisionService'
import ProbationAccountService from './probationAccountService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, esupervisionApiClient, probationAccountApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    esupervisionService: new EsupervisionService(esupervisionApiClient),
    probationAccountService: new ProbationAccountService(probationAccountApiClient),
  }
}

export type Services = ReturnType<typeof services>
