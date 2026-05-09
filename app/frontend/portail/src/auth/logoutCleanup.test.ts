import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logoutWithAccessToken } from '../../../shared/auth/logoutCleanup'

const postMock = vi.hoisted(() => vi.fn())

vi.mock('../../../shared/auth/axiosInstance', () => ({
  default: {
    post: postMock,
  },
}))

describe('logoutWithAccessToken', () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  it('sends the issued access token to logout before clearing the portal session', async () => {
    postMock.mockResolvedValueOnce({ data: { message: 'Successfully logged out' } })

    await logoutWithAccessToken('access-token', 'client')

    expect(postMock).toHaveBeenCalledWith(
      '/users/logout/',
      undefined,
      {
        headers: {
          'X-Tastify-Portal': 'client',
          Authorization: 'Bearer access-token',
        },
      }
    )
  })
})
