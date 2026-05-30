import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Play, RotateCcw, Table2, TerminalSquare } from 'lucide-react';
import './DatabaseQueryLab.css';

type Row = Record<string, string | number>;

interface TableData {
  name: string;
  description: string;
  columns: string[];
  rows: Row[];
}

interface QueryResult {
  rows: Row[];
  columns: string[];
  explanation: string[];
  error?: string;
}

const tables: Record<string, TableData> = {
  students: {
    name: 'students',
    description: 'Student performance records used for filtering and sorting practice.',
    columns: ['id', 'name', 'department', 'marks', 'attendance'],
    rows: [
      { id: 1, name: 'Arif', department: 'IT', marks: 92, attendance: 88 },
      { id: 2, name: 'Riya', department: 'CSE', marks: 86, attendance: 91 },
      { id: 3, name: 'Sayan', department: 'IT', marks: 73, attendance: 76 },
      { id: 4, name: 'Ananya', department: 'ECE', marks: 95, attendance: 94 },
      { id: 5, name: 'Kabir', department: 'CSE', marks: 68, attendance: 70 },
      { id: 6, name: 'Maya', department: 'IT', marks: 81, attendance: 84 },
    ],
  },
  courses: {
    name: 'courses',
    description: 'Course catalog records for understanding projection and predicates.',
    columns: ['id', 'title', 'department', 'credits', 'level'],
    rows: [
      { id: 101, title: 'Database Systems', department: 'CSE', credits: 4, level: 3 },
      { id: 102, title: 'Operating Systems', department: 'IT', credits: 4, level: 3 },
      { id: 103, title: 'Machine Learning', department: 'IT', credits: 3, level: 4 },
      { id: 104, title: 'Computer Networks', department: 'ECE', credits: 3, level: 3 },
      { id: 105, title: 'Cloud Computing', department: 'CSE', credits: 3, level: 4 },
    ],
  },
};

const examples = [
  'SELECT * FROM students;',
  'SELECT name, marks FROM students WHERE marks > 80 ORDER BY marks DESC;',
  "SELECT id, name, attendance FROM students WHERE department = 'IT' ORDER BY attendance DESC LIMIT 3;",
  'SELECT title, credits FROM courses WHERE level >= 4;',
];

const operators = ['>=', '<=', '!=', '=', '>', '<'];

function normalizeSql(sql: string) {
  return sql.trim().replace(/\s+/g, ' ').replace(/;$/, '');
}

function parseValue(raw: string) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }

  const numeric = Number(trimmed);
  return Number.isNaN(numeric) ? trimmed : numeric;
}

function compareValues(left: string | number, operator: string, right: string | number) {
  const leftValue = typeof left === 'number' ? left : String(left).toLowerCase();
  const rightValue = typeof right === 'number' ? right : String(right).toLowerCase();

  switch (operator) {
    case '=':
      return leftValue === rightValue;
    case '!=':
      return leftValue !== rightValue;
    case '>':
      return leftValue > rightValue;
    case '<':
      return leftValue < rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<=':
      return leftValue <= rightValue;
    default:
      return false;
  }
}

function runQuery(sql: string): QueryResult {
  const normalized = normalizeSql(sql);
  const selectMatch = normalized.match(/^select\s+(.+?)\s+from\s+(\w+)(.*)$/i);

  if (!selectMatch) {
    return {
      rows: [],
      columns: [],
      explanation: [],
      error: 'Use the format: SELECT columns FROM table WHERE condition ORDER BY column LIMIT n',
    };
  }

  const [, selectPart, tableNameRaw, restRaw] = selectMatch;
  const tableName = tableNameRaw.toLowerCase();
  const table = tables[tableName];

  if (!table) {
    return {
      rows: [],
      columns: [],
      explanation: [],
      error: `Unknown table "${tableNameRaw}". Try students or courses.`,
    };
  }

  let rest = restRaw.trim();
  const explanation = [`FROM ${table.name}: loaded ${table.rows.length} rows.`];
  let rows = [...table.rows];

  const whereMatch = rest.match(/^where\s+(.+?)(?=\s+order\s+by|\s+limit|$)(.*)$/i);
  if (whereMatch) {
    const condition = whereMatch[1].trim();
    rest = whereMatch[2].trim();
    const operator = operators.find((item) => condition.includes(item));

    if (!operator) {
      return { rows: [], columns: [], explanation, error: 'WHERE supports =, !=, >, <, >=, <= only.' };
    }

    const [columnRaw, valueRaw] = condition.split(operator);
    const column = columnRaw.trim();
    const expected = parseValue(valueRaw);

    if (!table.columns.includes(column)) {
      return { rows: [], columns: [], explanation, error: `Unknown column "${column}".` };
    }

    rows = rows.filter((row) => compareValues(row[column], operator, expected));
    explanation.push(`WHERE ${column} ${operator} ${valueRaw.trim()}: kept ${rows.length} rows.`);
  }

  const orderMatch = rest.match(/^order\s+by\s+(\w+)(?:\s+(asc|desc))?(.*)$/i);
  if (orderMatch) {
    const [, orderColumn, directionRaw, tail] = orderMatch;
    rest = tail.trim();

    if (!table.columns.includes(orderColumn)) {
      return { rows: [], columns: [], explanation, error: `Unknown ORDER BY column "${orderColumn}".` };
    }

    const direction = directionRaw?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    rows.sort((a, b) => {
      if (a[orderColumn] === b[orderColumn]) return 0;
      const comparison = a[orderColumn] > b[orderColumn] ? 1 : -1;
      return direction === 'desc' ? -comparison : comparison;
    });
    explanation.push(`ORDER BY ${orderColumn} ${direction.toUpperCase()}: sorted the remaining rows.`);
  }

  const limitMatch = rest.match(/^limit\s+(\d+)$/i);
  if (limitMatch) {
    const limit = Number(limitMatch[1]);
    rows = rows.slice(0, limit);
    explanation.push(`LIMIT ${limit}: returned only the first ${rows.length} rows.`);
  } else if (rest) {
    return { rows: [], columns: [], explanation, error: `Could not understand: "${rest}".` };
  }

  const columns = selectPart.trim() === '*'
    ? table.columns
    : selectPart.split(',').map((column) => column.trim());

  const unknownColumn = columns.find((column) => !table.columns.includes(column));
  if (unknownColumn) {
    return { rows: [], columns: [], explanation, error: `Unknown selected column "${unknownColumn}".` };
  }

  explanation.push(`SELECT ${selectPart}: projected ${columns.length} column(s).`);

  return {
    rows,
    columns,
    explanation,
  };
}

export default function DatabaseQueryLab() {
  const [query, setQuery] = useState(examples[1]);
  const [selectedTable, setSelectedTable] = useState('students');
  const result = useMemo(() => runQuery(query), [query]);
  const table = tables[selectedTable];

  const useExample = (example: string) => {
    setQuery(example);
    const tableMatch = example.match(/from\s+(\w+)/i);
    if (tableMatch?.[1] && tables[tableMatch[1].toLowerCase()]) {
      setSelectedTable(tableMatch[1].toLowerCase());
    }
  };

  return (
    <div className="db-lab-page" id="database-query-lab">
      <Link to="/labs" className="btn btn-ghost btn-sm db-back-link">
        <ArrowLeft size={16} /> Back to Labs
      </Link>

      <section className="db-lab-hero glass-strong">
        <div>
          <div className="db-lab-eyebrow">
            <Database size={16} />
            <span>Database Systems Virtual Lab</span>
          </div>
          <h1>SQL Query Execution Lab</h1>
          <p>
            Practice how a simple query flows through FROM, WHERE, ORDER BY, LIMIT,
            and SELECT using in-browser sample tables.
          </p>
        </div>
        <div className="db-lab-summary">
          <div>
            <span>Rows Returned</span>
            <strong>{result.error ? 0 : result.rows.length}</strong>
          </div>
          <div>
            <span>Active Table</span>
            <strong>{selectedTable}</strong>
          </div>
        </div>
      </section>

      <section className="db-content-grid">
        <aside className="db-theory glass">
          <h2>Aim</h2>
          <p>To understand how SQL clauses filter, sort, limit, and project table data.</p>

          <h2>Supported Syntax</h2>
          <code className="syntax-box">
            SELECT columns FROM table WHERE column operator value ORDER BY column DESC LIMIT n
          </code>

          <h2>Procedure</h2>
          <ol>
            <li>Choose a table and inspect its rows.</li>
            <li>Write or select a sample SQL query.</li>
            <li>Run the query and read each execution step.</li>
          </ol>

          <h2>Tables</h2>
          <div className="db-table-selector">
            {Object.values(tables).map((item) => (
              <button
                className={`btn btn-sm ${selectedTable === item.name ? 'btn-primary' : 'btn-ghost'}`}
                key={item.name}
                onClick={() => setSelectedTable(item.name)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
        </aside>

        <main className="db-simulator glass-strong">
          <div className="db-section-header">
            <div>
              <h2><TerminalSquare size={20} /> Query Editor</h2>
              <p>Try simple read-only SELECT queries. Keywords are case-insensitive.</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => useExample('SELECT * FROM students;')}
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          <textarea
            className="db-query-editor"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={5}
            spellCheck={false}
          />

          <div className="example-query-list">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className="example-query"
                onClick={() => useExample(example)}
              >
                <Play size={14} />
                {example}
              </button>
            ))}
          </div>
        </main>
      </section>

      <section className="db-output-grid">
        <div className="db-table-card glass">
          <div className="db-section-header compact">
            <div>
              <h2><Table2 size={20} /> Source Table: {table.name}</h2>
              <p>{table.description}</p>
            </div>
          </div>

          <div className="db-table-wrap">
            <table className="db-data-table">
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={String(row.id)}>
                    {table.columns.map((column) => (
                      <td key={column}>{row[column]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="db-result-card glass-strong">
          <div className="db-section-header compact">
            <div>
              <h2>Query Result</h2>
              <p>Output generated from the current SQL statement.</p>
            </div>
          </div>

          {result.error ? (
            <div className="db-error">{result.error}</div>
          ) : (
            <div className="db-table-wrap">
              <table className="db-data-table result">
                <thead>
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, index) => (
                    <tr key={`${row.id}-${index}`}>
                      {result.columns.map((column) => (
                        <td key={column}>{row[column]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="execution-plan">
            <h3>Execution Steps</h3>
            {result.error ? (
              <p>Fix the query to see the execution plan.</p>
            ) : (
              <ol>
                {result.explanation.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      <section className="db-viva-section glass">
        <h2>Quiz / Viva Questions</h2>
        <div className="db-viva-grid">
          <div>
            <h3>1. Why is WHERE applied before SELECT output?</h3>
            <p>Rows are filtered first, then only the selected columns are projected in the final result.</p>
          </div>
          <div>
            <h3>2. What does ORDER BY DESC do?</h3>
            <p>It sorts rows from highest to lowest for the selected ordering column.</p>
          </div>
          <div>
            <h3>3. Why use LIMIT?</h3>
            <p>LIMIT restricts output size, which is useful for previews, pagination, and performance.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
