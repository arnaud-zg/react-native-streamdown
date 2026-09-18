import { act } from 'react';
import TestRenderer from 'react-test-renderer';
import { StreamdownText } from '../StreamdownText';

// Captures the props StreamdownText hands to EnrichedMarkdownText.
const renderedProps: Record<string, unknown>[] = [];

jest.mock('react-native-enriched-markdown', () => ({
  EnrichedMarkdownText: (props: Record<string, unknown>) => {
    renderedProps.push(props);
    return null;
  },
}));

jest.mock('../worklets/remendWorklet', () => ({
  processRemendInWorklet: jest.fn(
    (markdown: string, onComplete: (r: string) => void) => onComplete(markdown)
  ),
}));

const { processRemendInWorklet } = jest.requireMock(
  '../worklets/remendWorklet'
) as { processRemendInWorklet: jest.Mock };

function render(element: React.ReactElement) {
  act(() => {
    TestRenderer.create(element);
  });
}

describe('StreamdownText', () => {
  beforeEach(() => {
    processRemendInWorklet.mockClear();
    renderedProps.length = 0;
  });

  it('defaults forceJsThread to false', () => {
    render(<StreamdownText markdown="hi" />);

    expect(processRemendInWorklet).toHaveBeenCalledWith(
      'hi',
      expect.any(Function),
      undefined,
      false
    );
  });

  it('passes forceJsThread down to the processor', () => {
    render(<StreamdownText markdown="hi" forceJsThread />);

    expect(processRemendInWorklet).toHaveBeenCalledWith(
      'hi',
      expect.any(Function),
      undefined,
      true
    );
  });

  it('does not forward forceJsThread to EnrichedMarkdownText', () => {
    render(<StreamdownText markdown="hi" flavor="github" forceJsThread />);

    expect(renderedProps.at(-1)).not.toHaveProperty('forceJsThread');
    expect(renderedProps.at(-1)).toMatchObject({ flavor: 'github' });
  });
});
