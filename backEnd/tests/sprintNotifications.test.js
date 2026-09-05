import sinon from 'sinon';
import assert from 'node:assert/strict';
import Sprint from '../models/Sprint.js';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { fakeQuery } from './helpers/fakeQuery.js';
import { updateSprint } from '../controllers/sprintController.js';

const jsonRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Sprint notifications', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('notifies the manager and members when sprint status changes', async function () {
    const existingSprint = {
      _id: 'sprint1',
      project: 'proj1',
      name: 'Sprint 1',
      goal: 'Ship login',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-14'),
      status: 'Planning',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['dev1', 'dev2'] };
    const updatedSprintView = { _id: 'sprint1', name: 'Sprint 1' };

    const findByIdStub = sinon.stub(Sprint, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingSprint));
    findByIdStub.onCall(1).returns(fakeQuery(updatedSprintView));

    sinon.stub(Project, 'findById').resolves(project);
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'sprint1' },
      body: { status: 'Active' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateSprint(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient).sort(), ['dev1', 'dev2']);
    assert.equal(docs[0].type, 'Sprint Updated');
  });

  it('does not notify anyone when the sprint is edited without a status change', async function () {
    const existingSprint = {
      _id: 'sprint1',
      project: 'proj1',
      name: 'Sprint 1',
      goal: 'Ship login',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-14'),
      status: 'Planning',
      save: sinon.stub().resolves()
    };
    const project = { _id: 'proj1', name: 'Proj One', manager: 'mgr1', members: ['dev1'] };
    const updatedSprintView = { _id: 'sprint1', name: 'Sprint 1' };

    const findByIdStub = sinon.stub(Sprint, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingSprint));
    findByIdStub.onCall(1).returns(fakeQuery(updatedSprintView));

    sinon.stub(Project, 'findById').resolves(project);
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'sprint1' },
      body: { goal: 'Ship login and signup' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateSprint(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.called, false);
  });
});
