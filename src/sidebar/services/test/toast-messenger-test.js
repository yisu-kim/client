import { ToastMessengerService } from '../toast-messenger';

describe('ToastMessengerService', () => {
  let clock;
  let fakeStore;
  let fakeWindow;
  let service;

  beforeEach(() => {
    fakeStore = {
      addToastMessage: sinon.stub(),
      getToastMessage: sinon.stub(),
      hasToastMessage: sinon.stub(),
      removeToastMessage: sinon.stub(),
      updateToastMessage: sinon.stub(),
    };
    fakeWindow = new EventTarget();
    fakeWindow.document = {
      hasFocus: sinon.stub().returns(true),
    };

    clock = sinon.useFakeTimers();
    service = new ToastMessengerService(fakeStore, fakeWindow);
  });

  afterEach(() => {
    clock.restore();
  });

  describe('#success', () => {
    it('does not add a new success message if a matching one already exists in the store', () => {
      fakeStore.hasToastMessage.returns(true);

      service.success('This is my message');

      assert.calledWith(
        fakeStore.hasToastMessage,
        'success',
        'This is my message',
      );
      assert.notCalled(fakeStore.addToastMessage);
    });

    it('adds a new success toast message to the store', () => {
      fakeStore.hasToastMessage.returns(false);

      service.success('hooray', { visuallyHidden: true });

      assert.calledWith(
        fakeStore.addToastMessage,
        sinon.match({
          type: 'success',
          message: 'hooray',
          visuallyHidden: true,
        }),
      );
    });

    it('passes along `moreInfoURL` when present', () => {
      fakeStore.hasToastMessage.returns(false);

      service.success('hooray', { moreInfoURL: 'http://www.example.com' });

      assert.calledWith(
        fakeStore.addToastMessage,
        sinon.match({
          type: 'success',
          message: 'hooray',
          moreInfoURL: 'http://www.example.com',
        }),
      );
    });

    it('dismisses the message after timeout fires', () => {
      fakeStore.hasToastMessage.returns(false);
      fakeStore.getToastMessage.returns(undefined);

      service.success('hooray');

      // Move to the first scheduled timeout, which should invoke the
      // `dismiss` method
      clock.next();

      assert.calledOnce(fakeStore.getToastMessage);
      assert.notCalled(fakeStore.updateToastMessage);
    });

    it('emits "toastMessageAdded" event', () => {
      fakeStore.hasToastMessage.returns(false);

      const fakeHandler = sinon.stub();
      service.on('toastMessageAdded', fakeHandler);

      service.success('hooray', {});

      assert.calledWith(
        fakeHandler,
        sinon.match({ message: 'hooray', type: 'success' }),
      );
    });
  });

  describe('#notice', () => {
    it('adds a new notice toast message to the store', () => {
      fakeStore.hasToastMessage.returns(false);

      service.notice('boo');

      assert.calledWith(
        fakeStore.addToastMessage,
        sinon.match({ type: 'notice', message: 'boo' }),
      );
    });
  });

  describe('#error', () => {
    it('does not add a new error message if one with the same message text already exists', () => {
      fakeStore.hasToastMessage.returns(true);

      service.error('This is my message');

      assert.calledWith(
        fakeStore.hasToastMessage,
        'error',
        'This is my message',
      );
      assert.notCalled(fakeStore.addToastMessage);
    });

    it('adds a new error toast message to the store', () => {
      fakeStore.hasToastMessage.returns(false);

      service.error('boo');

      assert.calledWith(
        fakeStore.addToastMessage,
        sinon.match({ type: 'error', message: 'boo' }),
      );
    });

    it('dismisses the message after timeout fires', () => {
      fakeStore.hasToastMessage.returns(false);
      fakeStore.getToastMessage.returns(undefined);

      service.error('boo');

      // Move to the first scheduled timeout, which should invoke the
      // `dismiss` method
      clock.next();

      assert.calledOnce(fakeStore.getToastMessage);
      assert.notCalled(fakeStore.updateToastMessage);
    });

    it('does not dismiss the message if `autoDismiss` is false', () => {
      fakeStore.hasToastMessage.returns(false);
      fakeStore.getToastMessage.returns(undefined);

      service.error('boo', { autoDismiss: false });

      // Move to the first scheduled timeout.
      clock.next();

      assert.notCalled(fakeStore.getToastMessage);
      assert.notCalled(fakeStore.updateToastMessage);
    });
  });

  describe('#dismiss', () => {
    it('does not dismiss the message if it does not exist', () => {
      fakeStore.getToastMessage.returns(undefined);

      service.dismiss('someid');

      assert.notCalled(fakeStore.updateToastMessage);
    });

    it('does not dismiss a message if it is already dismissed', () => {
      fakeStore.getToastMessage.returns({
        type: 'success',
        message: 'yay',
        isDismissed: true,
      });

      service.dismiss('someid');

      assert.notCalled(fakeStore.updateToastMessage);
    });

    it('updates the message object to set `isDimissed` to `true`', () => {
      fakeStore.getToastMessage.returns({
        type: 'success',
        message: 'yay',
        isDismissed: false,
      });

      service.dismiss('someid');

      assert.calledWith(
        fakeStore.updateToastMessage,
        sinon.match({ isDismissed: true }),
      );
    });

    it('removes the message from the store after timeout fires', () => {
      fakeStore.getToastMessage.returns({
        type: 'success',
        message: 'yay',
        isDismissed: false,
      });

      service.dismiss('someid');

      // Advance the clock to fire the timeout that will remove the message
      clock.next();

      assert.calledOnce(fakeStore.removeToastMessage);
      assert.calledWith(fakeStore.removeToastMessage, 'someid');
    });

    it('emits "toastMessageDismissed" event', () => {
      fakeStore.getToastMessage.returns({
        id: 'someid',
        type: 'success',
        message: 'yay',
        isDismissed: false,
      });

      const fakeHandler = sinon.stub();
      service.on('toastMessageDismissed', fakeHandler);

      service.dismiss('someid');
      assert.calledWith(fakeHandler, 'someid');
    });
  });

  context('when the message is delayed', () => {
    it('behaves same as non-delayed message if document is focused', () => {
      fakeWindow.document.hasFocus.returns(true);
      service.notice('foo', { delayed: true });

      assert.calledWith(
        fakeStore.addToastMessage,
        sinon.match({ type: 'notice', message: 'foo' }),
      );
    });

    it('defers adding message if the document is not focused', () => {
      fakeWindow.document.hasFocus.returns(false);
      service.notice('foo', { delayed: true });

      assert.notCalled(fakeStore.addToastMessage);
    });

    it('dispatches all deferred messages when the document is focused', () => {
      fakeWindow.document.hasFocus.returns(false);
      service.notice('foo', { delayed: true });
      service.notice('bar', { delayed: true });

      assert.notCalled(fakeStore.addToastMessage);
      fakeWindow.dispatchEvent(new Event('focus'));
      assert.calledTwice(fakeStore.addToastMessage);
    });
  });
});
