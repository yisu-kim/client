import { mount } from 'enzyme';

import { checkAccessibility } from '../../../test-util/accessibility';
import Buckets from '../Buckets';

describe('Buckets', () => {
  let fakeAbove;
  let fakeBelow;
  let fakeBuckets;
  let fakeOnFocusAnnotations;
  let fakeOnScrollToClosestOffScreenAnchor;
  let fakeOnSelectAnnotations;

  beforeEach(() => {
    fakeAbove = {
      anchors: [
        { annotation: { $tag: 'a1' }, highlights: ['hi'] },
        { annotation: { $tag: 'a2' }, highlights: ['there'] },
      ],
      position: 150,
    };
    fakeBelow = {
      anchors: [
        { annotation: { $tag: 'b1' }, highlights: ['ho'] },
        { annotation: { $tag: 'b2' }, highlights: ['there'] },
      ],
      position: 550,
    };
    fakeBuckets = [
      {
        anchors: [
          { annotation: { $tag: 't1' }, highlights: ['hi'] },
          { annotation: { $tag: 't2' }, highlights: ['yay'] },
        ],
        position: 250,
      },
      { anchors: ['you', 'also', 'are', 'welcome'], position: 350 },
    ];
    fakeOnFocusAnnotations = sinon.stub();
    fakeOnScrollToClosestOffScreenAnchor = sinon.stub();
    fakeOnSelectAnnotations = sinon.stub();
  });

  const createComponent = () =>
    mount(
      <Buckets
        above={fakeAbove}
        below={fakeBelow}
        buckets={fakeBuckets}
        onFocusAnnotations={fakeOnFocusAnnotations}
        onScrollToClosestOffScreenAnchor={fakeOnScrollToClosestOffScreenAnchor}
        onSelectAnnotations={fakeOnSelectAnnotations}
      />
    );

  describe('up and down navigation', () => {
    it('renders an up navigation button if there are above-screen anchors', () => {
      const wrapper = createComponent();
      const upButton = wrapper.find('.Buckets__button--up');
      // The list item element wrapping the button
      const bucketItem = wrapper.find('.Buckets__bucket').first();

      assert.isTrue(upButton.exists());
      assert.equal(
        bucketItem.getDOMNode().style.top,
        `${fakeAbove.position}px`
      );
    });

    it('does not render an up navigation button if there are no above-screen anchors', () => {
      fakeAbove = { anchors: [], position: 150 };
      const wrapper = createComponent();
      assert.isFalse(wrapper.find('.Buckets__button--up').exists());
    });

    it('renders a down navigation button if there are below-screen anchors', () => {
      const wrapper = createComponent();

      const downButton = wrapper.find('.Buckets__button--down');
      // The list item element wrapping the button
      const bucketItem = wrapper.find('.Buckets__bucket').last();

      assert.isTrue(downButton.exists());
      assert.equal(
        bucketItem.getDOMNode().style.top,
        `${fakeBelow.position}px`
      );
    });

    it('does not render a down navigation button if there are no below-screen anchors', () => {
      fakeBelow = { anchors: [], position: 550 };
      const wrapper = createComponent();
      assert.isFalse(wrapper.find('.Buckets__button--down').exists());
    });

    it('scrolls to anchors above when up navigation button is pressed', () => {
      const wrapper = createComponent();
      const upButton = wrapper.find('.Buckets__button--up');

      upButton.simulate('click');

      assert.calledWith(
        fakeOnScrollToClosestOffScreenAnchor,
        ['a1', 'a2'],
        'up'
      );
    });

    it('scrolls to anchors below when down navigation button is pressed', () => {
      const wrapper = createComponent();
      const downButton = wrapper.find('.Buckets__button--down');

      downButton.simulate('click');

      assert.calledWith(
        fakeOnScrollToClosestOffScreenAnchor,
        ['b1', 'b2'],
        'down'
      );
    });
  });

  describe('on-screen buckets', () => {
    it('renders a bucket button for each bucket', () => {
      const wrapper = createComponent();

      assert.equal(wrapper.find('.Buckets__button--left').length, 2);
    });

    it('focuses associated anchors when mouse enters the element', () => {
      const wrapper = createComponent();

      wrapper.find('.Buckets__button--left').first().simulate('mousemove');

      assert.calledOnce(fakeOnFocusAnnotations);
      assert.calledWith(fakeOnFocusAnnotations, ['t1', 't2']);
    });

    it('removes focus on associated anchors when element is blurred', () => {
      const wrapper = createComponent();

      wrapper.find('.Buckets__button--left').first().simulate('blur');

      assert.calledOnce(fakeOnFocusAnnotations);
      assert.calledWith(fakeOnFocusAnnotations, []);
    });

    it('removes focus on associated anchors when mouse leaves the element', () => {
      const wrapper = createComponent();

      wrapper.find('.Buckets__button--left').first().simulate('mouseout');

      assert.calledOnce(fakeOnFocusAnnotations);
      assert.calledWith(fakeOnFocusAnnotations, []);
    });

    it('selects associated annotations when bucket button pressed', () => {
      const wrapper = createComponent();

      wrapper
        .find('.Buckets__button--left')
        .first()
        .simulate('click', { metaKey: false, ctrlKey: false });

      assert.calledOnce(fakeOnSelectAnnotations);
      const call = fakeOnSelectAnnotations.getCall(0);
      assert.deepEqual(call.args[0], [
        fakeBuckets[0].anchors[0].annotation.$tag,
        fakeBuckets[0].anchors[1].annotation.$tag,
      ]);
      assert.equal(call.args[1], false);
    });

    it('toggles annotation selection if metakey pressed', () => {
      const wrapper = createComponent();

      wrapper
        .find('.Buckets__button--left')
        .first()
        .simulate('click', { metaKey: true, ctrlKey: false });

      const call = fakeOnSelectAnnotations.getCall(0);

      assert.equal(call.args[1], true);
    });
  });

  it(
    'should pass a11y checks',
    checkAccessibility([
      {
        content: () => createComponent(),
      },
    ])
  );
});
