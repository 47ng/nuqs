import { useLocation, useNavigate } from '@remix-run/react'
import { Repro839 } from 'e2e-shared/specs/react-router/repro-839-location-state-persistence'

export default function Page() {
  return <Repro839 useLocation={useLocation} useNavigate={useNavigate} />
}
