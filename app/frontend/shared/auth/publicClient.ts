import axios from 'axios'
import { getAuthPortalHeader } from './portalContext'

const publicClient = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    ...getAuthPortalHeader('client'),
  },
})

export default publicClient
