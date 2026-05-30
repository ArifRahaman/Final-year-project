import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Cpu, Play, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
import './OSSchedulingLab.css';

type Algorithm = 'fcfs' | 'sjf' | 'rr';

interface ProcessInput {
  id: string;
  arrival: number;
  burst: number;
  color: string;
}

interface ProcessResult extends ProcessInput {
  start: number;
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
}

interface GanttSegment {
  processId: string;
  start: number;
  end: number;
  color: string;
}

interface ScheduleResult {
  gantt: GanttSegment[];
  rows: ProcessResult[];
  averageWaiting: number;
  averageTurnaround: number;
  averageResponse: number;
  cpuUtilization: number;
  totalTime: number;
}

const palette = ['#4cd7f6', '#d2bbff', '#4edea3', '#f59e0b', '#ffb4ab', '#38bdf8'];

const initialProcesses: ProcessInput[] = [
  { id: 'P1', arrival: 0, burst: 5, color: palette[0] },
  { id: 'P2', arrival: 1, burst: 3, color: palette[1] },
  { id: 'P3', arrival: 2, burst: 8, color: palette[2] },
  { id: 'P4', arrival: 3, burst: 6, color: palette[3] },
];

const idleColor = '#475569';

function normalizeProcesses(processes: ProcessInput[]) {
  return processes
    .filter((process) => process.id.trim() && process.burst > 0)
    .map((process, index) => ({ ...process, order: index }))
    .sort((a, b) => a.arrival - b.arrival || a.order - b.order);
}

function addIdleSegment(gantt: GanttSegment[], currentTime: number, nextTime: number) {
  if (nextTime > currentTime) {
    gantt.push({ processId: 'Idle', start: currentTime, end: nextTime, color: idleColor });
  }
}

function summarize(gantt: GanttSegment[], rows: ProcessResult[]): ScheduleResult {
  const totalTime = gantt.length ? gantt[gantt.length - 1].end : 0;
  const busyTime = gantt
    .filter((segment) => segment.processId !== 'Idle')
    .reduce((sum, segment) => sum + segment.end - segment.start, 0);
  const divisor = rows.length || 1;

  return {
    gantt,
    rows: [...rows].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    averageWaiting: rows.reduce((sum, row) => sum + row.waiting, 0) / divisor,
    averageTurnaround: rows.reduce((sum, row) => sum + row.turnaround, 0) / divisor,
    averageResponse: rows.reduce((sum, row) => sum + row.response, 0) / divisor,
    cpuUtilization: totalTime > 0 ? (busyTime / totalTime) * 100 : 0,
    totalTime,
  };
}

function scheduleFcfs(processes: ProcessInput[]): ScheduleResult {
  const sorted = normalizeProcesses(processes);
  const gantt: GanttSegment[] = [];
  const rows: ProcessResult[] = [];
  let currentTime = 0;

  sorted.forEach((process) => {
    addIdleSegment(gantt, currentTime, process.arrival);
    const start = Math.max(currentTime, process.arrival);
    const completion = start + process.burst;
    const turnaround = completion - process.arrival;
    const waiting = turnaround - process.burst;

    gantt.push({ processId: process.id, start, end: completion, color: process.color });
    rows.push({ ...process, start, completion, turnaround, waiting, response: waiting });
    currentTime = completion;
  });

  return summarize(gantt, rows);
}

function scheduleSjf(processes: ProcessInput[]): ScheduleResult {
  const sorted = normalizeProcesses(processes);
  const remaining = [...sorted];
  const gantt: GanttSegment[] = [];
  const rows: ProcessResult[] = [];
  let currentTime = 0;

  while (remaining.length) {
    const available = remaining.filter((process) => process.arrival <= currentTime);

    if (!available.length) {
      const nextArrival = Math.min(...remaining.map((process) => process.arrival));
      addIdleSegment(gantt, currentTime, nextArrival);
      currentTime = nextArrival;
      continue;
    }

    available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
    const selected = available[0];
    const index = remaining.findIndex((process) => process.id === selected.id);
    remaining.splice(index, 1);

    const start = currentTime;
    const completion = start + selected.burst;
    const turnaround = completion - selected.arrival;
    const waiting = turnaround - selected.burst;

    gantt.push({ processId: selected.id, start, end: completion, color: selected.color });
    rows.push({ ...selected, start, completion, turnaround, waiting, response: waiting });
    currentTime = completion;
  }

  return summarize(gantt, rows);
}

function scheduleRoundRobin(processes: ProcessInput[], quantum: number): ScheduleResult {
  const sorted = normalizeProcesses(processes);
  const remaining = new Map(sorted.map((process) => [process.id, process.burst]));
  const responseStart = new Map<string, number>();
  const queue: ProcessInput[] = [];
  const gantt: GanttSegment[] = [];
  const rows: ProcessResult[] = [];
  let currentTime = 0;
  let cursor = 0;
  let completed = 0;

  while (completed < sorted.length) {
    while (cursor < sorted.length && sorted[cursor].arrival <= currentTime) {
      queue.push(sorted[cursor]);
      cursor += 1;
    }

    if (!queue.length) {
      const nextArrival = sorted[cursor]?.arrival ?? currentTime;
      addIdleSegment(gantt, currentTime, nextArrival);
      currentTime = nextArrival;
      continue;
    }

    const process = queue.shift();
    if (!process) continue;

    if (!responseStart.has(process.id)) {
      responseStart.set(process.id, currentTime - process.arrival);
    }

    const remainingBurst = remaining.get(process.id) ?? 0;
    const runtime = Math.min(Math.max(1, quantum), remainingBurst);
    const start = currentTime;
    const end = start + runtime;

    gantt.push({ processId: process.id, start, end, color: process.color });
    currentTime = end;
    remaining.set(process.id, remainingBurst - runtime);

    while (cursor < sorted.length && sorted[cursor].arrival <= currentTime) {
      queue.push(sorted[cursor]);
      cursor += 1;
    }

    if ((remaining.get(process.id) ?? 0) > 0) {
      queue.push(process);
    } else {
      const completion = currentTime;
      const turnaround = completion - process.arrival;
      const waiting = turnaround - process.burst;
      rows.push({
        ...process,
        start,
        completion,
        turnaround,
        waiting,
        response: responseStart.get(process.id) ?? 0,
      });
      completed += 1;
    }
  }

  return summarize(gantt, rows);
}

function calculateSchedule(
  processes: ProcessInput[],
  algorithm: Algorithm,
  quantum: number
): ScheduleResult {
  if (algorithm === 'sjf') return scheduleSjf(processes);
  if (algorithm === 'rr') return scheduleRoundRobin(processes, quantum);
  return scheduleFcfs(processes);
}

export default function OSSchedulingLab() {
  const [processes, setProcesses] = useState<ProcessInput[]>(initialProcesses);
  const [algorithm, setAlgorithm] = useState<Algorithm>('fcfs');
  const [timeQuantum, setTimeQuantum] = useState(2);

  const result = useMemo(
    () => calculateSchedule(processes, algorithm, timeQuantum),
    [processes, algorithm, timeQuantum]
  );

  const addProcess = () => {
    const nextNumber = Math.max(
      0,
      ...processes.map((process) => Number(process.id.replace(/\D/g, '')) || 0)
    ) + 1;

    setProcesses((current) => [
      ...current,
      {
        id: `P${nextNumber}`,
        arrival: 0,
        burst: 4,
        color: palette[current.length % palette.length],
      },
    ]);
  };

  const updateProcess = (id: string, field: 'arrival' | 'burst', value: string) => {
    const parsed = Number(value);
    const fallback = field === 'burst' ? 1 : 0;
    const nextValue = Number.isFinite(parsed)
      ? Math.max(fallback, parsed)
      : fallback;

    setProcesses((current) =>
      current.map((process) =>
        process.id === id ? { ...process, [field]: nextValue } : process
      )
    );
  };

  const removeProcess = (id: string) => {
    setProcesses((current) => current.filter((process) => process.id !== id));
  };

  const resetExample = () => {
    setProcesses(initialProcesses);
    setAlgorithm('fcfs');
    setTimeQuantum(2);
  };

  return (
    <div className="os-lab-page" id="os-scheduling-lab">
      <Link to="/labs" className="btn btn-ghost btn-sm os-back-link">
        <ArrowLeft size={16} /> Back to Labs
      </Link>

      <section className="os-lab-hero glass-strong">
        <div>
          <div className="os-lab-eyebrow">
            <Cpu size={16} />
            <span>Operating Systems Virtual Lab</span>
          </div>
          <h1>CPU Scheduling Simulator</h1>
          <p>
            Compare FCFS, SJF, and Round Robin algorithms by changing process arrival
            times, burst times, and time quantum.
          </p>
        </div>
        <div className="os-lab-summary">
          <div>
            <span>Average Waiting</span>
            <strong>{result.averageWaiting.toFixed(2)}</strong>
          </div>
          <div>
            <span>Average Turnaround</span>
            <strong>{result.averageTurnaround.toFixed(2)}</strong>
          </div>
        </div>
      </section>

      <section className="lab-content-grid">
        <aside className="lab-theory glass">
          <h2>Aim</h2>
          <p>
            To understand how CPU scheduling algorithms decide the execution order of
            processes and how that affects waiting time and turnaround time.
          </p>

          <h2>Theory</h2>
          <ul>
            <li><strong>FCFS:</strong> Executes processes in arrival order.</li>
            <li><strong>SJF:</strong> Picks the shortest available burst time first.</li>
            <li><strong>Round Robin:</strong> Gives every process a fixed time quantum.</li>
          </ul>

          <h2>Procedure</h2>
          <ol>
            <li>Enter process arrival and burst times.</li>
            <li>Select a scheduling algorithm.</li>
            <li>Run the simulator and compare the metrics.</li>
          </ol>
        </aside>

        <main className="lab-simulator glass-strong">
          <div className="simulator-header">
            <div>
              <h2><Play size={20} /> Simulator</h2>
              <p>Change values and the output updates instantly.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetExample}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <div className="scheduler-controls">
            <div className="form-group">
              <label className="form-label" htmlFor="algorithm">Algorithm</label>
              <select
                id="algorithm"
                className="form-input"
                value={algorithm}
                onChange={(event) => setAlgorithm(event.target.value as Algorithm)}
              >
                <option value="fcfs">First Come First Serve</option>
                <option value="sjf">Shortest Job First</option>
                <option value="rr">Round Robin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="time-quantum">Time Quantum</label>
              <input
                id="time-quantum"
                className="form-input"
                type="number"
                min="1"
                value={timeQuantum}
                disabled={algorithm !== 'rr'}
                onChange={(event) => setTimeQuantum(Math.max(1, Number(event.target.value) || 1))}
              />
            </div>
          </div>

          <div className="process-table-wrap">
            <table className="process-input-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Arrival Time</th>
                  <th>Burst Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr key={process.id}>
                    <td>
                      <span className="process-pill" style={{ borderColor: process.color }}>
                        {process.id}
                      </span>
                    </td>
                    <td>
                      <input
                        className="form-input compact-input"
                        type="number"
                        min="0"
                        value={process.arrival}
                        onChange={(event) => updateProcess(process.id, 'arrival', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input compact-input"
                        type="number"
                        min="1"
                        value={process.burst}
                        onChange={(event) => updateProcess(process.id, 'burst', event.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeProcess(process.id)}
                        disabled={processes.length <= 1}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="btn btn-primary btn-sm" onClick={addProcess}>
            <PlusCircle size={16} /> Add Process
          </button>
        </main>
      </section>

      <section className="lab-output glass-strong">
        <div className="output-header">
          <div>
            <h2><Clock size={20} /> Output</h2>
            <p>Gantt chart and calculated performance metrics.</p>
          </div>
          <span className="cpu-chip">CPU Utilization: {result.cpuUtilization.toFixed(1)}%</span>
        </div>

        <div className="gantt-chart">
          {result.gantt.map((segment, index) => (
            <div
              className="gantt-segment"
              key={`${segment.processId}-${segment.start}-${index}`}
              style={{ flexGrow: segment.end - segment.start, background: segment.color }}
            >
              <strong>{segment.processId}</strong>
              <span>{segment.start} - {segment.end}</span>
            </div>
          ))}
        </div>

        <div className="result-stats">
          <div className="metric-card">
            <span>Total Time</span>
            <strong>{result.totalTime}</strong>
          </div>
          <div className="metric-card">
            <span>Avg Waiting</span>
            <strong>{result.averageWaiting.toFixed(2)}</strong>
          </div>
          <div className="metric-card">
            <span>Avg Turnaround</span>
            <strong>{result.averageTurnaround.toFixed(2)}</strong>
          </div>
          <div className="metric-card">
            <span>Avg Response</span>
            <strong>{result.averageResponse.toFixed(2)}</strong>
          </div>
        </div>

        <div className="process-table-wrap">
          <table className="process-result-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>Start</th>
                <th>Completion</th>
                <th>Turnaround</th>
                <th>Waiting</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.start}</td>
                  <td>{row.completion}</td>
                  <td>{row.turnaround}</td>
                  <td>{row.waiting}</td>
                  <td>{row.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="viva-section glass">
        <h2>Quiz / Viva Questions</h2>
        <div className="viva-grid">
          <div>
            <h3>1. Which algorithm may cause starvation?</h3>
            <p>SJF can cause starvation because long jobs may wait if short jobs keep arriving.</p>
          </div>
          <div>
            <h3>2. Why does Round Robin need a time quantum?</h3>
            <p>The time quantum limits how long each process runs before the CPU switches to another process.</p>
          </div>
          <div>
            <h3>3. Which metric should be minimized?</h3>
            <p>Waiting time and turnaround time are commonly minimized to improve responsiveness.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
