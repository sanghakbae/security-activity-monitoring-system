import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleAuthCallback } from '@/auth/auth'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const run = async () => {
      try {
        const result = await handleAuthCallback()

        if (result.authenticated) {
          navigate('/')
        } else {
          navigate('/login')
        }
      } catch (err: unknown) {
        console.error(err)
        navigate('/login')
      }
    }

    run()
  }, [navigate])

  return <div>로그인 처리 중...</div>
}