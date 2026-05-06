import { Navigate, Route, Routes } from 'react-router-dom'
import { StepConfirm } from './StepConfirm'
import { StepDateTime } from './StepDateTime'
import { StepTableSelect } from './StepTableSelect'
import { WizardProvider } from './WizardContext'

export const ReservationWizardShell = () => (
  <WizardProvider>
    <Routes>
      <Route path="new" element={<StepDateTime />} />
      <Route path="table" element={<StepTableSelect />} />
      <Route path="confirm" element={<StepConfirm />} />
      <Route index element={<Navigate to="new" replace />} />
    </Routes>
  </WizardProvider>
)
