import { useEffect } from 'react'
import { useNavigate } from 'react-router'
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate()

  useEffect(() => {
    const tosAccepted     = localStorage.getItem('isTermOfUseAccepted')     === 'true'
    const privacyAccepted = localStorage.getItem('isPrivacyPolicyAccepted') === 'true'

    if (!tosAccepted || !privacyAccepted) {
   
      navigate('/', { replace: true })
    }

    return () => {
      localStorage.setItem('isTermOfUseAccepted',     'false')
      localStorage.setItem('isPrivacyPolicyAccepted', 'false')
    }
  }, [navigate])

  const tosAccepted     = localStorage.getItem('isTermOfUseAccepted')     === 'true'
  const privacyAccepted = localStorage.getItem('isPrivacyPolicyAccepted') === 'true'

  if (!tosAccepted || !privacyAccepted) return null

  return children
}