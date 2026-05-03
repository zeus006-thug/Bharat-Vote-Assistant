import React from 'react';
import { Calendar, UserPlus, FileSignature, CheckCircle, BarChart3, Box } from 'lucide-react';

const timelineSteps = [
  {
    id: 1,
    title: 'Voter Registration (Form 6)',
    date: 'Pre-Election Period',
    description: 'Register as a new voter using Form 6 via the NVSP portal or Voter Helpline App. Check your name in the Electoral Roll.',
    icon: UserPlus,
  },
  {
    id: 2,
    title: 'Candidate KYC',
    date: 'Post-Nomination',
    description: 'Review candidate affidavits detailing educational, financial, and criminal backgrounds on the ECI KYC App.',
    icon: Calendar,
  },
  {
    id: 3,
    title: 'Find Polling Booth & BLO',
    date: '2 Weeks Before Election',
    description: 'Locate your Vaku-Chavadi (Polling Booth) and identify your Booth Level Officer (BLO) for grassroots assistance.',
    icon: FileSignature,
  },
  {
    id: 4,
    title: 'Election Day (EVM & VVPAT)',
    date: 'Voting Day',
    description: 'Cast your vote via EVM. Verify your choice through the 7-second VVPAT slip window. Remember to bring your EPIC or Aadhaar.',
    icon: CheckCircle,
    hasVisual: true
  },
  {
    id: 5,
    title: 'Counting & Results',
    date: 'Declaration Day',
    description: 'Votes are securely counted under the supervision of the Election Commission. Winners are officially declared.',
    icon: BarChart3,
  }
];

// Visual component for EVM & VVPAT
const EvmVisual = () => (
  <div className="evm-visual-container">
    <div className="evm-machine">
      <div className="evm-screen">Ready</div>
      <div className="evm-buttons">
        <div className="evm-btn-row"><div className="evm-blue-btn"></div><div className="evm-label">Cand 1</div></div>
        <div className="evm-btn-row"><div className="evm-blue-btn"></div><div className="evm-label">Cand 2</div></div>
        <div className="evm-btn-row"><div className="evm-blue-btn"></div><div className="evm-label">NOTA</div></div>
      </div>
    </div>
    <div className="vvpat-machine">
      <div className="vvpat-indicator">VVPAT</div>
      <div className="vvpat-window">
        <div className="vvpat-slip">
          <span>Vote Cast</span>
          <Box size={14} />
        </div>
      </div>
    </div>
  </div>
);

export default function Timeline() {
  return (
    <section className="timeline-section">
      <h2 className="timeline-title">Election Timeline</h2>
      <div className="timeline-grid">
        {timelineSteps.map((step) => (
          <div key={step.id} className="timeline-card glass-panel">
            <div className="timeline-icon-wrap">
              <step.icon size={24} />
            </div>
            <span className="timeline-date">{step.date}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            {step.hasVisual && <EvmVisual />}
          </div>
        ))}
      </div>
    </section>
  );
}
