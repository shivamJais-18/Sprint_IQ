import sinon from 'sinon';
import assert from 'node:assert/strict';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { fakeQuery } from './helpers/fakeQuery.js';
import { createTask, updateTask } from '../controllers/taskController.js';

const jsonRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Task notifications', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('notifies the assignee when a task is created with an assignee', async function () {
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['dev1'] };
    sinon.stub(Project, 'findById').returns(fakeQuery(project));
    sinon.stub(User, 'findOne').returns(fakeQuery({ _id: 'dev1', role: 'Developer' }));
    sinon.stub(Task, 'create').resolves({ _id: 'task1', title: 'Build login' });
    sinon.stub(Task, 'findById').returns(fakeQuery({ _id: 'task1', title: 'Build login' }));
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      body: { title: 'Build login', description: 'desc', project: 'proj1', assignedTo: 'dev1' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await createTask(req, res);

    assert.equal(res.status.calledWith(201), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient), ['dev1']);
    assert.equal(docs[0].type, 'Task Assigned');
  });

  it('does not notify anyone when a task is created unassigned', async function () {
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['dev1'] };
    sinon.stub(Project, 'findById').returns(fakeQuery(project));
    sinon.stub(Task, 'create').resolves({ _id: 'task2', title: 'Unassigned task' });
    sinon.stub(Task, 'findById').returns(fakeQuery({ _id: 'task2', title: 'Unassigned task' }));
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      body: { title: 'Unassigned task', description: 'desc', project: 'proj1' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await createTask(req, res);

    assert.equal(res.status.calledWith(201), true);
    assert.equal(insertMany.called, false);
  });

  it('notifies the new assignee on reassignment, not the old one', async function () {
    const existingTask = {
      _id: 'task1',
      project: 'proj1',
      sprint: undefined,
      assignedTo: 'devOld',
      status: 'To Do',
      createdBy: 'creator1',
      title: 'Old title',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['devOld', 'devNew'] };
    const updatedTaskView = { _id: 'task1', title: 'Old title' };

    const findByIdStub = sinon.stub(Task, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingTask));
    findByIdStub.onCall(1).returns(fakeQuery(updatedTaskView));

    sinon.stub(Project, 'findById').resolves(project);
    sinon.stub(User, 'findOne').returns(fakeQuery({ _id: 'devNew', role: 'Developer' }));
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'task1' },
      body: { assignedTo: 'devNew' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateTask(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient), ['devNew']);
    assert.equal(docs[0].type, 'Task Assigned');
  });

  it('notifies the assignee and creator on a status change without reassignment', async function () {
    const existingTask = {
      _id: 'task1',
      project: 'proj1',
      sprint: undefined,
      assignedTo: 'dev1',
      status: 'To Do',
      createdBy: 'creator1',
      title: 'Old title',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['dev1'] };
    const updatedTaskView = { _id: 'task1', title: 'Old title' };

    const findByIdStub = sinon.stub(Task, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingTask));
    findByIdStub.onCall(1).returns(fakeQuery(updatedTaskView));

    sinon.stub(Project, 'findById').resolves(project);
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'task1' },
      body: { status: 'In Progress' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateTask(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient).sort(), ['creator1', 'dev1']);
    assert.equal(docs[0].type, 'Task Updated');
  });

  it('does not notify when the actor is also the recipient', async function () {
    const existingTask = {
      _id: 'task1',
      project: 'proj1',
      sprint: undefined,
      assignedTo: 'dev1',
      status: 'To Do',
      createdBy: 'dev1',
      title: 'Old title',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['dev1'] };
    const updatedTaskView = { _id: 'task1', title: 'Old title' };

    const findByIdStub = sinon.stub(Task, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingTask));
    findByIdStub.onCall(1).returns(fakeQuery(updatedTaskView));

    sinon.stub(Project, 'findById').resolves(project);
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    // dev1 updates their own assigned task's status - dev1 is both the
    // assignee and the actor, so they should not be notified about their
    // own change.
    const req = {
      params: { id: 'task1' },
      body: { status: 'In Progress' },
      user: { _id: 'dev1', role: 'Developer' }
    };
    const res = jsonRes();

    await updateTask(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.called, false);
  });
});
