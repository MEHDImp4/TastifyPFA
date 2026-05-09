import axiosInstance from './axiosInstance'
import { getAuthPortalHeader, type AuthPortal } from './portalContext'

export const logoutWithAccessToken = async (accessToken: string, portal: AuthPortal) =>
  axiosInstance.post(
    '/users/logout/',
    undefined,
    {
      headers: {
        ...getAuthPortalHeader(portal),
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
