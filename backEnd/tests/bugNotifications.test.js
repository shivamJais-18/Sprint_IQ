import sinon from 'sinon';
import assert from 'node:assert/strict';
import Bug from '../models/Bug.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { fakeQuery } from './helpers/fakeQuery.js';
import { createBug, updateBug } from '../controllers/bugController.js';

const jsonRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Bug notifications', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('notifies the project manager and assignee when a bug is reported', async function () {
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['reporter1', 'dev1'] };
    sinon.stub(Project, 'findById').returns(fakeQuery(project));
    sinon.stub(User, 'findOne').returns(fakeQuery({ _id: 'dev1', role: 'Developer' }));
    sinon.stub(Bug, 'create').resolves({ _id: 'bug1', title: 'Login crash' });
    sinon.stub(Bug, 'findById').returns(fakeQuery({ _id: 'bug1', title: 'Login crash' }));
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      body: { title: 'Login crash', description: 'Crashes on submit', project: 'proj1', assignedTo: 'dev1' },
      user: { _id: 'reporter1', role: 'Developer' }
    };
    const res = jsonRes();

    await createBug(req, res);

    assert.equal(res.status.calledWith(201), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient).sort(), ['dev1', 'mgr1']);
    assert.equal(docs[0].type, 'Bug Reported');
  });

  it('does not notify the reporter themselves when they are also the manager', async function () {
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: [] };
    sinon.stub(Project, 'findById').returns(fakeQuery(project));
    sinon.stub(Bug, 'create').resolves({ _id: 'bug2', title: 'Minor issue' });
    sinon.stub(Bug, 'findById').returns(fakeQuery({ _id: 'bug2', title: 'Minor issue' }));
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      body: { title: 'Minor issue', description: 'Small bug', project: 'proj1' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await createBug(req, res);

    assert.equal(res.status.calledWith(201), true);
    assert.equal(insertMany.called, false);
  });

  it('notifies the new assignee when a bug is reassigned', async function () {
    const existingBug = {
      _id: 'bug1',
      project: 'proj1',
      task: undefined,
      assignedTo: undefined,
      reportedBy: 'reporter1',
      status: 'Open',
      severity: 'Medium',
      priority: 'Medium',
      title: 'Login crash',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['reporter1', 'dev1'] };
    const updatedBugView = { _id: 'bug1', title: 'Login crash' };

    const findByIdStub = sinon.stub(Bug, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingBug));
    findByIdStub.onCall(1).returns(fakeQuery(updatedBugView));

    sinon.stub(Project, 'findById').resolves(project);
    sinon.stub(User, 'findOne').returns(fakeQuery({ _id: 'dev1', role: 'Developer' }));
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'bug1' },
      body: { assignedTo: 'dev1' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateBug(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient), ['dev1']);
    assert.equal(docs[0].type, 'Bug Reported');
  });

  it('notifies the assignee and reporter on a severity change without reassignment', async function () {
    const existingBug = {
      _id: 'bug1',
      project: 'proj1',
      task: undefined,
      assignedTo: 'dev1',
      reportedBy: 'reporter1',
      status: 'Open',
      severity: 'Medium',
      priority: 'Medium',
      title: 'Login crash',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['reporter1', 'dev1'] };
    const updatedBugView = { _id: 'bug1', title: 'Login crash' };

    const findByIdStub = sinon.stub(Bug, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingBug));
    findByIdStub.onCall(1).returns(fakeQuery(updatedBugView));

    sinon.stub(Project, 'findById').resolves(project);
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'bug1' },
      body: { severity: 'Critical' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateBug(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient).sort(), ['dev1', 'reporter1']);
    assert.equal(docs[0].type, 'Bug Updated');
  });
});
