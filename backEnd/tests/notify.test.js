import sinon from 'sinon';
import assert from 'node:assert/strict';
import Notification from '../models/Notification.js';
import { notifyUsers } from '../utils/notify.js';

describe('notifyUsers helper', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('creates one notification per unique, non-null recipient', async function () {
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    await notifyUsers(['user1', 'user2', 'user1', null, undefined], {
      type: 'System',
      title: 'Title',
      message: 'Message',
      relatedId: 'related1'
    });

    assert.equal(insertMany.calledOnce, true);
    const docs = insertMany.firstCall.args[0];
    const recipients = docs.map((doc) => doc.recipient).sort();
    assert.deepEqual(recipients, ['user1', 'user2']);
    docs.forEach((doc) => {
      assert.equal(doc.type, 'System');
      assert.equal(doc.title, 'Title');
      assert.equal(doc.message, 'Message');
      assert.equal(doc.relatedId, 'related1');
    });
  });

  it('excludes the acting user from the recipient list', async function () {
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    await notifyUsers(['actor1', 'user2'], {
      type: 'System',
      title: 'Title',
      message: 'Message',
      excludeUserId: 'actor1'
    });

    const docs = insertMany.firstCall.args[0];
    assert.deepEqual(docs.map((doc) => doc.recipient), ['user2']);
  });

  it('does nothing when there are no recipients left after filtering', async function () {
    const insertMany = sinon.stub(Notification, 'insertMany').resolves([]);

    await notifyUsers([null, undefined], { type: 'System', title: 'Title', message: 'Message' });
    await notifyUsers(['actor1'], { type: 'System', title: 'Title', message: 'Message', excludeUserId: 'actor1' });

    assert.equal(insertMany.called, false);
  });

  it('swallows database errors instead of throwing', async function () {
    sinon.stub(Notification, 'insertMany').rejects(new Error('DB down'));

    await assert.doesNotReject(() =>
      notifyUsers(['user1'], { type: 'System', title: 'Title', message: 'Message' })
    );
  });
});
