import sinon from 'sinon';
import assert from 'node:assert/strict';
import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { fakeQuery } from './helpers/fakeQuery.js';
import { updateProject } from '../controllers/projectController.js';

const jsonRes = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
};

describe('Project notifications', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('notifies the manager and members when project status changes', async function () {
    const existingProject = {
      _id: 'proj1',
      name: 'Proj One',
      manager: 'mgr1',
      members: ['dev1', 'dev2'],
      status: 'Planning',
      startDate: undefined,
      endDate: undefined,
      save: sinon.stub().resolves()
    };
    const updatedProjectView = { _id: 'proj1', name: 'Proj One' };

    const findByIdStub = sinon.stub(Project, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingProject));
    findByIdStub.onCall(1).returns(fakeQuery(updatedProjectView));

    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'proj1' },
      body: { status: 'Active' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateProject(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((d) => d.recipient).sort(), ['dev1', 'dev2']);
    assert.equal(docs[0].type, 'Project Updated');
  });

  it('does not notify anyone when the project is edited without a status change', async function () {
    const existingProject = {
      _id: 'proj1',
      name: 'Proj One',
      manager: 'mgr1',
      members: ['dev1'],
      status: 'Planning',
      startDate: undefined,
      endDate: undefined,
      save: sinon.stub().resolves()
    };
    const updatedProjectView = { _id: 'proj1', name: 'Proj One' };

    const findByIdStub = sinon.stub(Project, 'findById');
    findByIdStub.onCall(0).returns(fakeQuery(existingProject));
    findByIdStub.onCall(1).returns(fakeQuery(updatedProjectView));

    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    const req = {
      params: { id: 'proj1' },
      body: { description: 'Updated description' },
      user: { _id: 'mgr1', role: 'Project Manager' }
    };
    const res = jsonRes();

    await updateProject(req, res);

    assert.equal(res.status.calledWith(200), true);
    assert.equal(insertMany.called, false);
  });
});
