import PageInfo from './pageInfo'

export default interface Page<T> {
  pagination: PageInfo
  content: T[]
}
