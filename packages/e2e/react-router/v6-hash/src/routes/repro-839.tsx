import { Repro839 } from 'e2e-shared/specs/react-router/repro-839-location-state-persistence'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Page() {
  return <Repro839 useLocation={useLocation} useNavigate={useNavigate} />
}
