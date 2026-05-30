import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Cpu, Database, Network, PlayCircle } from 'lucide-react';
import './VirtualLabsPage.css';

const labs = [
  {
    title: 'OS CPU Scheduling Simulator',
    description: 'Run FCFS, SJF, and Round Robin scheduling with Gantt charts and timing metrics.',
    path: '/labs/os-scheduling',
    status: 'Live',
    icon: <Cpu size={24} />,
    accent: 'var(--accent-cyan)',
    topics: ['FCFS', 'SJF', 'Round Robin', 'Gantt Chart'],
  },
  {
    title: 'Database Query Lab',
    description: 'Practice filtering rows and understanding how simple SQL queries return results.',
    path: '/labs/db-query',
    status: 'Live',
    icon: <Database size={24} />,
    accent: 'var(--accent-emerald)',
    topics: ['SELECT', 'WHERE', 'ORDER BY', 'LIMIT'],
  },
  {
    title: 'ML Prediction Demo',
    description: 'Visualize how simple features can produce a prediction and confidence score.',
    path: '/labs',
    status: 'Coming Soon',
    icon: <Brain size={24} />,
    accent: 'var(--accent-violet)',
    topics: ['Features', 'Prediction', 'Confidence', 'Model'],
  },
  {
    title: 'Networking Packet Flow',
    description: 'Animate a request moving through DNS, TCP handshake, server processing, and response.',
    path: '/labs',
    status: 'Coming Soon',
    icon: <Network size={24} />,
    accent: 'var(--accent-amber)',
    topics: ['DNS', 'TCP', 'Request', 'Response'],
  },
];

export default function VirtualLabsPage() {
  return (
    <div className="virtual-labs-page" id="virtual-labs-page">
      <section className="labs-hero glass-strong">
        <div>
          <div className="labs-eyebrow">
            <PlayCircle size={16} />
            <span>Interactive Virtual Lab Mode</span>
          </div>
          <h1>
            Learn by running <span className="text-gradient">browser-based experiments</span>
          </h1>
          <p>
            A vlab-style module for computer science subjects. Students can change inputs,
            run simulations, observe output, and answer viva questions.
          </p>
        </div>
        <Link to="/labs/os-scheduling" className="btn btn-primary btn-lg">
          Start OS Lab <ArrowRight size={18} />
        </Link>
      </section>

      <section className="labs-method-grid">
        <div className="lab-method-card glass">
          <span className="lab-method-step">01</span>
          <h3>Aim</h3>
          <p>Understand a core CS concept through a focused experiment.</p>
        </div>
        <div className="lab-method-card glass">
          <span className="lab-method-step">02</span>
          <h3>Simulator</h3>
          <p>Enter inputs, run the model, and inspect the visual output.</p>
        </div>
        <div className="lab-method-card glass">
          <span className="lab-method-step">03</span>
          <h3>Analysis</h3>
          <p>Compare metrics, answer viva questions, and explain the result.</p>
        </div>
      </section>

      <section className="labs-section">
        <div className="labs-section-header">
          <div>
            <h2>Available Labs</h2>
            <p>Run simulations for operating systems and database query execution.</p>
          </div>
        </div>

        <div className="labs-grid">
          {labs.map((lab) => {
            const isLive = lab.status === 'Live';
            const CardContent = (
              <>
                <div className="lab-card-top">
                  <div className="lab-card-icon" style={{ color: lab.accent }}>
                    {lab.icon}
                  </div>
                  <span className={`lab-status ${isLive ? 'live' : ''}`}>{lab.status}</span>
                </div>
                <h3>{lab.title}</h3>
                <p>{lab.description}</p>
                <div className="lab-topic-list">
                  {lab.topics.map((topic) => (
                    <span key={topic}>{topic}</span>
                  ))}
                </div>
                <div className="lab-card-action">
                  {isLive ? 'Open Lab' : 'Planned'} <ArrowRight size={16} />
                </div>
              </>
            );

            return isLive ? (
              <Link to={lab.path} className="lab-card glass" key={lab.title}>
                {CardContent}
              </Link>
            ) : (
              <div className="lab-card glass disabled" key={lab.title}>
                {CardContent}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
