import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiCpu,
  FiFileText,
  FiMessageSquare,
  FiPlay,
  FiRefreshCw,
  FiShield,
  FiStar,
  FiUsers
} from 'react-icons/fi';
import API from '../services/api';
import {
  analyzeProjectHealth,
  analyzeSprintRisk,
  askAssistant,
  createGeneratedTasks,
  generateReleaseNotes,
  generateTasks,
  prioritizeBug,
  recommendAssignment,
  summarizeMeeting
} from '../services/aiApi';

const emptyOutput = null;
const serviceCards = [
  ['Task Generator', 'Turn requirements into implementation-ready tasks.', FiClipboard, 'tasks'],
  ['Project Health', 'Get an AI health score and action plan.', FiCheckCircle, 'health'],
  ['Smart Assignment', 'Recommend the best developer for a task.', FiUsers, 'assignment'],
  ['AI Assistant', 'Ask questions about live SprintIQ data.', FiCpu, 'chat']
];

const prettyDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

function OutputPanel({ title, icon: Icon, children }) {
  return (
    <section className="ai-output panel">
      <div className="panel-header">
        <div><h2>{title}</h2><p>AI-generated analysis from your current SprintIQ data.</p></div>
        <Icon size={21} />
      </div>
      {children}
    </section>
  );
}

export default function AIWorkspace() {
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [active, setActive] = useState('tasks');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiReady, setAiReady] = useState(null);

  const [taskForm, setTaskForm] = useState({ requirement: '', projectId: '', sprintId: '' });
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [selectedTaskIndexes, setSelectedTaskIndexes] = useState([]);

  const [sprintId, setSprintId] = useState('');
  const [riskResult, setRiskResult] = useState(emptyOutput);

  const [assignmentTaskId, setAssignmentTaskId] = useState('');
  const [assignmentResult, setAssignmentResult] = useState(emptyOutput);
  const [assignmentApplied, setAssignmentApplied] = useState(false);

  const [bugId, setBugId] = useState('');
  const [bugResult, setBugResult] = useState(emptyOutput);

  const [healthProjectId, setHealthProjectId] = useState('');
  const [healthResult, setHealthResult] = useState(emptyOutput);

  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingProjectId, setMeetingProjectId] = useState('');
  const [meetingResult, setMeetingResult] = useState(emptyOutput);
  const [meetingTasksCreated, setMeetingTasksCreated] = useState(false);

  const [releaseSprintId, setReleaseSprintId] = useState('');
  const [releaseResult, setReleaseResult] = useState(emptyOutput);

  const [question, setQuestion] = useState('');
  const [chatProjectId, setChatProjectId] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const selectedSprintOptions = useMemo(() => sprints.filter((s) => !taskForm.projectId || String(s.project?._id || s.project) === String(taskForm.projectId)), [sprints, taskForm.projectId]);

  useEffect(() => {
    Promise.all([
      API.get('/projects'),
      API.get('/sprints'),
      API.get('/tasks'),
      API.get('/bugs'),
      API.get('/ai/status')
    ]).then(([p, s, t, b, ai]) => {
      setProjects(p.data.projects || []);
      setSprints(s.data.sprints || []);
      setTasks(t.data.tasks || []);
      setBugs(b.data.bugs || []);
      setAiReady(ai.data.ai);
    }).catch((error) => {
      console.error(error);
      setMessage(error.response?.data?.message || 'Unable to load AI workspace data.');
    });
  }, []);

  const run = async (fn) => {
    try {
      setLoading(true);
      setMessage('');
      return await fn();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'AI request failed.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onGenerateTasks = () => run(async () => {
    if (!taskForm.requirement || !taskForm.projectId) return setMessage('Requirement and project are required.');
    const response = await generateTasks(taskForm);
    const generated = response.data.result?.tasks || [];
    setGeneratedTasks(generated);
    setSelectedTaskIndexes(generated.map((_, index) => index));
  });

  const onCreateTasks = () => run(async () => {
    const selected = generatedTasks.filter((_, index) => selectedTaskIndexes.includes(index));
    if (!selected.length) return setMessage('Select at least one generated task.');
    const response = await createGeneratedTasks({ projectId: taskForm.projectId, sprintId: taskForm.sprintId || undefined, tasks: selected });
    setMessage(response.data.message);
    setGeneratedTasks([]);
    setSelectedTaskIndexes([]);
    const refreshed = await API.get('/tasks');
    setTasks(refreshed.data.tasks || []);
  });

  const onRisk = () => run(async () => {
    if (!sprintId) return setMessage('Select a sprint.');
    const response = await analyzeSprintRisk({ sprintId });
    setRiskResult(response.data.result);
  });

  const onAssignment = () => run(async () => {
    if (!assignmentTaskId) return setMessage('Select a task.');
    const response = await recommendAssignment({ taskId: assignmentTaskId });
    setAssignmentResult(response.data);
    setAssignmentApplied(false);
  });

  const applyAssignment = () => run(async () => {
    const recommendedUserId = assignmentResult?.result?.recommendedUserId;
    if (!assignmentTaskId || !recommendedUserId) return setMessage('No valid developer recommendation to apply.');
    const response = await API.put(`/tasks/${assignmentTaskId}`, { assignedTo: recommendedUserId });
    setMessage(response.data.message || 'AI assignment applied.');
    setAssignmentApplied(true);
    const refreshed = await API.get('/tasks');
    setTasks(refreshed.data.tasks || []);
  });

  const onBug = () => run(async () => {
    if (!bugId) return setMessage('Select a bug.');
    const response = await prioritizeBug({ bugId });
    setBugResult({ ...response.data.result, bugId });
  });

  const applyBug = () => run(async () => {
    if (!bugResult?.bugId) return setMessage('No bug recommendation to apply.');
    const response = await API.put(`/bugs/${bugResult.bugId}`, {
      severity: bugResult.recommendedSeverity,
      priority: bugResult.recommendedPriority
    });
    setMessage(response.data.message || 'AI recommendation applied.');
    const refreshed = await API.get('/bugs');
    setBugs(refreshed.data.bugs || []);
  });

  const onHealth = () => run(async () => {
    if (!healthProjectId) return setMessage('Select a project.');
    const response = await analyzeProjectHealth(healthProjectId);
    setHealthResult(response.data);
  });

  const onMeeting = () => run(async () => {
    if (!meetingNotes.trim()) return setMessage('Paste meeting notes first.');
    const response = await summarizeMeeting({ notes: meetingNotes, projectId: meetingProjectId || undefined });
    setMeetingResult(response.data.result);
    setMeetingTasksCreated(false);
  });

  const createMeetingTasks = () => run(async () => {
    if (!meetingProjectId) return setMessage('Select a project before creating meeting action-item tasks.');
    const actionItems = meetingResult?.actionItems || [];
    if (!actionItems.length) return setMessage('There are no action items to convert into tasks.');
    const tasks = actionItems
      .filter((item) => item?.title?.trim())
      .map((item) => ({
        title: item.title,
        description: `Meeting action item${item.ownerName && item.ownerName !== 'Unassigned' ? ` for ${item.ownerName}` : ''}.`,
        priority: item.priority || 'Medium',
        estimatedHours: 1,
        storyPoints: 1,
        labels: ['meeting', 'action-item'],
        dependencies: []
      }));
    if (!tasks.length) return setMessage('No valid action items were found.');
    const response = await createGeneratedTasks({ projectId: meetingProjectId, tasks });
    setMessage(response.data.message || 'Meeting action items created as tasks.');
    setMeetingTasksCreated(true);
    const refreshed = await API.get('/tasks');
    setTasks(refreshed.data.tasks || []);
  });

  const onRelease = () => run(async () => {
    if (!releaseSprintId) return setMessage('Select a sprint.');
    const response = await generateReleaseNotes({ sprintId: releaseSprintId });
    setReleaseResult(response.data.result);
  });

  const onAsk = () => run(async () => {
    if (!question.trim()) return setMessage('Ask SprintIQ AI a question.');
    const userMessage = question.trim();
    setQuestion('');
    setChatMessages((items) => [...items, { role: 'user', text: userMessage }]);
    const response = await askAssistant({ question: userMessage, projectId: chatProjectId || undefined });
    setChatMessages((items) => [...items, { role: 'assistant', result: response.data.result }]);
  });

  const toggleTask = (index) => setSelectedTaskIndexes((items) => items.includes(index) ? items.filter((i) => i !== index) : [...items, index]);

  return (
    <div className="ai-page">
      <div className="page-header">
        <div>
          <h1>AI Workspace</h1>
          <p>Use AI directly inside your project-management workflow.</p>
        </div>
        <div className={`ai-status ${aiReady?.configured ? 'ready' : 'warning'}`}>
          <span className="ai-status-dot" />
          {aiReady?.configured ? `${aiReady.provider} · ${aiReady.model}` : 'AI key not configured'}
        </div>
      </div>

      <section className="ai-hero panel">
        <div className="ai-hero-icon"><FiCpu size={28} /></div>
        <div>
          <div className="eyebrow">SPRINTIQ INTELLIGENCE</div>
          <h2>From project data to engineering decisions.</h2>
          <p>Generate work, balance assignments, analyze project health, and ask questions about your live workspace.</p>
        </div>
      </section>

      {message && <div className="ai-message">{message}</div>}

      <div className="ai-service-grid">
        {serviceCards.map(([title, description, Icon, key]) => {
          return (
            <button key={title} className={`ai-service-card ${active === key ? 'active' : ''}`} onClick={() => setActive(key)} type="button">
              <div className="ai-service-icon"><Icon size={19} /></div>
              <strong>{title}</strong>
              <span>{description}</span>
            </button>
          );
        })}
      </div>

      {active === 'tasks' && (
        <>
          <section className="panel">
            <div className="panel-header"><div><h2>Requirement → Tasks</h2><p>Describe a feature and let AI break it into actionable engineering work.</p></div><FiStar size={20} /></div>
            <div className="form-grid">
              <label className="full-width">Requirement<textarea rows="6" value={taskForm.requirement} onChange={(e) => setTaskForm({ ...taskForm, requirement: e.target.value })} placeholder="Example: Users should be able to register, login, reset their password and update their profile." /></label>
              <label>Project<select value={taskForm.projectId} onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value, sprintId: '' })}><option value="">Select project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label>
              <label>Sprint (optional)<select value={taskForm.sprintId} onChange={(e) => setTaskForm({ ...taskForm, sprintId: e.target.value })}><option value="">No sprint</option>{selectedSprintOptions.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name}</option>)}</select></label>
            </div>
            <div className="form-actions"><button className="primary-button" onClick={onGenerateTasks} disabled={loading}><FiPlay size={16} />{loading ? 'Generating...' : 'Generate Tasks'}</button></div>
          </section>

          {generatedTasks.length > 0 && (
            <OutputPanel title="Generated Engineering Tasks" icon={FiClipboard}>
              <div className="ai-task-list">
                {generatedTasks.map((task, index) => (
                  <label className={`ai-task-suggestion ${selectedTaskIndexes.includes(index) ? 'selected' : ''}`} key={`${task.title}-${index}`}>
                    <input type="checkbox" checked={selectedTaskIndexes.includes(index)} onChange={() => toggleTask(index)} />
                    <div className="ai-task-suggestion-main"><strong>{task.title}</strong><p>{task.description}</p><div className="ai-inline-meta"><span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span><span>{task.estimatedHours}h</span><span>{task.storyPoints} pts</span>{task.labels?.map((label) => <span key={label}>#{label}</span>)}</div></div>
                  </label>
                ))}
              </div>
              <div className="ai-action-row"><span>{selectedTaskIndexes.length} selected</span><button className="primary-button" onClick={onCreateTasks} disabled={loading}><FiCheck size={16} />Create Selected Tasks</button></div>
            </OutputPanel>
          )}
        </>
      )}

      {active === 'risk' && (
        <>
          <section className="panel"><div className="panel-header"><div><h2>Sprint Risk Prediction</h2><p>AI evaluates real sprint tasks and unresolved project bugs.</p></div><FiShield size={20} /></div><div className="form-grid"><label>Sprint<select value={sprintId} onChange={(e) => setSprintId(e.target.value)}><option value="">Select sprint</option>{sprints.map((sprint) => <option key={sprint._id} value={sprint._id}>{sprint.name}</option>)}</select></label></div><div className="form-actions"><button className="primary-button" onClick={onRisk} disabled={loading}><FiRefreshCw size={16} />Analyze Sprint</button></div></section>
          {riskResult && <OutputPanel title={`${riskResult.riskLevel} Risk · ${riskResult.riskScore}/100`} icon={FiShield}><div className="ai-score-card"><div className="ai-score">{riskResult.riskScore}</div><div><strong>{riskResult.summary}</strong><div className="ai-chip-row">{riskResult.reasons?.map((r) => <span className="ai-chip danger" key={r}>{r}</span>)}</div></div></div><div className="ai-two-col"><div><h3>Why this sprint is at risk</h3><ul>{riskResult.reasons?.map((r) => <li key={r}>{r}</li>)}</ul></div><div><h3>Recommended actions</h3><ul>{riskResult.recommendations?.map((r) => <li key={r}>{r}</li>)}</ul></div></div></OutputPanel>}
        </>
      )}

      {active === 'assignment' && (
        <>
          <section className="panel"><div className="panel-header"><div><h2>Smart Task Assignment</h2><p>AI combines task context with current developer workload.</p></div><FiUsers size={20} /></div><div className="form-grid"><label className="full-width">Task<select value={assignmentTaskId} onChange={(e) => setAssignmentTaskId(e.target.value)}><option value="">Select task</option>{tasks.filter((t) => t.status !== 'Done').map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}</select></label></div><div className="form-actions"><button className="primary-button" onClick={onAssignment} disabled={loading}><FiPlay size={16} />Recommend Developer</button></div></section>
          {assignmentResult && <OutputPanel title="Developer Recommendation" icon={FiUsers}><div className="ai-recommendation"><div><div className="eyebrow">RECOMMENDED</div><h2>{assignmentResult.candidates?.find((c) => String(c._id) === String(assignmentResult.result.recommendedUserId))?.name || 'Developer'}</h2><p>{assignmentResult.result.summary}</p><div className="form-actions"><button className="primary-button" onClick={applyAssignment} disabled={loading || assignmentApplied}>{assignmentApplied ? 'Assignment Applied' : 'Apply Recommendation'}</button></div></div><div className="ai-ranking">{assignmentResult.result.recommendations?.map((r) => { const candidate = assignmentResult.candidates?.find((c) => String(c._id) === String(r.userId)); return <div className="ai-ranking-row" key={r.userId}><strong>{candidate?.name || r.userId}</strong><span>{r.score}/100</span><small>{r.reason}</small></div>; })}</div></div></OutputPanel>}
        </>
      )}

      {active === 'bug' && (
        <>
          <section className="panel"><div className="panel-header"><div><h2>AI Bug Prioritization</h2><p>Use project and bug context to recommend a consistent priority.</p></div><FiAlertTriangle size={20} /></div><div className="form-grid"><label className="full-width">Bug<select value={bugId} onChange={(e) => setBugId(e.target.value)}><option value="">Select bug</option>{bugs.filter((b) => !['Resolved', 'Closed'].includes(b.status)).map((bug) => <option key={bug._id} value={bug._id}>{bug.title}</option>)}</select></label></div><div className="form-actions"><button className="primary-button" onClick={onBug} disabled={loading}><FiPlay size={16} />Analyze Bug</button></div></section>
          {bugResult && <OutputPanel title="AI Bug Analysis" icon={FiAlertTriangle}><div className="ai-bug-result"><div className="ai-result-box"><span>Severity</span><strong>{bugResult.recommendedSeverity}</strong></div><div className="ai-result-box"><span>Priority</span><strong>{bugResult.recommendedPriority}</strong></div><div className="ai-result-box"><span>Confidence</span><strong>{bugResult.confidence}%</strong></div></div><p className="ai-summary">{bugResult.summary}</p><ul>{bugResult.reasoning?.map((r) => <li key={r}>{r}</li>)}</ul><div className="form-actions"><button className="primary-button" onClick={applyBug}><FiCheck size={16} />Apply Recommendation</button></div></OutputPanel>}
        </>
      )}

      {active === 'health' && (
        <>
          <section className="panel"><div className="panel-header"><div><h2>Project Health Analyzer</h2><p>Assess delivery, bugs, sprint pressure and team signals.</p></div><FiCheckCircle size={20} /></div><div className="form-grid"><label>Project<select value={healthProjectId} onChange={(e) => setHealthProjectId(e.target.value)}><option value="">Select project</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label></div><div className="form-actions"><button className="primary-button" onClick={onHealth} disabled={loading}><FiPlay size={16} />Analyze Health</button></div></section>
          {healthResult && <OutputPanel title="Project Health" icon={FiCheckCircle}><div className="ai-health-header"><div className="ai-health-score">{healthResult.result.healthScore}</div><div><div className="eyebrow">{healthResult.result.healthStatus}</div><h2>Project health score</h2><p>{healthResult.result.summary}</p></div></div><div className="ai-two-col"><div><h3>Strengths</h3><ul>{healthResult.result.strengths?.map((r) => <li key={r}>{r}</li>)}</ul></div><div><h3>Risks & recommendations</h3><ul>{healthResult.result.risks?.map((r) => <li key={r}>{r}</li>)}{healthResult.result.recommendations?.map((r) => <li key={r}>{r}</li>)}</ul></div></div></OutputPanel>}
        </>
      )}

      {active === 'meeting' && (
        <>
          <section className="panel"><div className="panel-header"><div><h2>Meeting Intelligence</h2><p>Paste standup, planning, review or client notes.</p></div><FiMessageSquare size={20} /></div><div className="form-grid"><label className="full-width">Meeting notes<textarea rows="10" value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} placeholder="Paste transcript or notes here..." /></label><label>Project (optional)<select value={meetingProjectId} onChange={(e) => setMeetingProjectId(e.target.value)}><option value="">General meeting</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label></div><div className="form-actions"><button className="primary-button" onClick={onMeeting} disabled={loading}><FiMessageSquare size={16} />Analyze Meeting</button></div></section>
          {meetingResult && <OutputPanel title="Meeting Summary" icon={FiMessageSquare}><p className="ai-summary">{meetingResult.summary}</p><div className="ai-two-col"><div><h3>Decisions</h3><ul>{meetingResult.decisions?.map((x) => <li key={x}>{x}</li>)}</ul></div><div><h3>Follow-ups</h3><ul>{meetingResult.followUps?.map((x) => <li key={x}>{x}</li>)}</ul></div></div><h3>Action Items</h3><div className="ai-action-list">{meetingResult.actionItems?.map((item, index) => <div className="ai-action-item" key={`${item.title}-${index}`}><strong>{item.title}</strong><span>{item.ownerName}</span><span>{item.priority}</span>{item.dueDate && <span>{prettyDate(item.dueDate)}</span>}</div>)}</div>{meetingProjectId && <div className="form-actions"><button className="primary-button" onClick={createMeetingTasks} disabled={loading || meetingTasksCreated}>{meetingTasksCreated ? 'Action Items Added as Tasks' : 'Create Action-Item Tasks'}</button></div>}</OutputPanel>}
        </>
      )}

      {active === 'release' && (
        <>
          <section className="panel"><div className="panel-header"><div><h2>AI Release Notes</h2><p>Generate release-ready notes from completed sprint work.</p></div><FiFileText size={20} /></div><div className="form-grid"><label>Sprint<select value={releaseSprintId} onChange={(e) => setReleaseSprintId(e.target.value)}><option value="">Select sprint</option>{sprints.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></label></div><div className="form-actions"><button className="primary-button" onClick={onRelease} disabled={loading}><FiFileText size={16} />Generate Release Notes</button></div></section>
          {releaseResult && <OutputPanel title={releaseResult.title} icon={FiFileText}><p className="ai-summary">{releaseResult.summary}</p><div className="ai-two-col"><div><h3>New Features</h3><ul>{releaseResult.newFeatures?.map((x) => <li key={x}>{x}</li>)}</ul><h3>Improvements</h3><ul>{releaseResult.improvements?.map((x) => <li key={x}>{x}</li>)}</ul></div><div><h3>Bug Fixes</h3><ul>{releaseResult.bugFixes?.map((x) => <li key={x}>{x}</li>)}</ul><h3>Known Issues</h3><ul>{releaseResult.knownIssues?.map((x) => <li key={x}>{x}</li>)}</ul></div></div></OutputPanel>}
        </>
      )}

      {active === 'chat' && (
        <section className="panel ai-chat-panel">
          <div className="panel-header"><div><h2>Ask SprintIQ AI</h2><p>Questions are answered from the live project, sprint, task and bug context.</p></div><FiCpu size={21} /></div>
          <div className="form-grid"><label>Project scope (optional)<select value={chatProjectId} onChange={(e) => setChatProjectId(e.target.value)}><option value="">All accessible projects</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label></div>
          <div className="ai-chat-history">{chatMessages.length === 0 ? <div className="ai-chat-empty"><FiCpu size={30} /><p>Try asking: “Which projects need attention?” or “What should we prioritize this sprint?”</p></div> : chatMessages.map((message, index) => <div key={index} className={`chat-bubble ${message.role}`}>{message.role === 'user' ? message.text : <><strong>{message.result?.answer}</strong><div className="ai-chip-row">{message.result?.keyPoints?.map((x) => <span className="ai-chip" key={x}>{x}</span>)}</div>{message.result?.suggestedActions?.length > 0 && <div className="chat-actions"><FiArrowRight size={14} />{message.result.suggestedActions.join(' · ')}</div>}</>}</div>)}</div>
          <div className="ai-chat-input"><textarea rows="3" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onAsk(); }} placeholder="Ask SprintIQ AI... (Ctrl/Cmd + Enter to send)" /><button className="primary-button" onClick={onAsk} disabled={loading}><FiPlay size={16} />Send</button></div>
        </section>
      )}
    </div>
  );
}
