import { act } from 'react';
import TestRenderer from 'react-test-renderer';
import { useStreamdownMarkdown } from '../hooks/useStreamdownMarkdown';

jest.mock('../worklets/remendWorklet', () => ({
  processRemendInWorklet: jest.fn(
    (markdown: string, onComplete: (r: string) => void) => {
      onComplete(markdown);
    }
  ),
}));

const { processRemendInWorklet } = jest.requireMock(
  '../worklets/remendWorklet'
) as {
  processRemendInWorklet: jest.Mock;
};

function Consumer({
  markdown,
  config,
  forceJsThread,
}: {
  markdown: string;
  config: unknown;
  forceJsThread?: boolean;
}) {
  useStreamdownMarkdown(markdown, {
    remendConfig: config as never,
    forceJsThread,
  });
  return null;
}

describe('useStreamdownMarkdown', () => {
  beforeEach(() => {
    processRemendInWorklet.mockClear();
  });

  it('does not re-run the worklet job on idle re-renders when remendConfig is an inline literal', () => {
    const Parent = ({ markdown }: { markdown: string }) => (
      <Consumer markdown={markdown} config={{ katex: true }} />
    );

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Parent markdown="hi" />);
    });
    expect(processRemendInWorklet).toHaveBeenCalledTimes(1);

    // Idle parent re-renders (same markdown) must not reschedule the job.
    act(() => {
      renderer.update(<Parent markdown="hi" />);
    });
    act(() => {
      renderer.update(<Parent markdown="hi" />);
    });
    expect(processRemendInWorklet).toHaveBeenCalledTimes(1);

    // A markdown change still schedules a new job.
    act(() => {
      renderer.update(<Parent markdown="hi there" />);
    });
    expect(processRemendInWorklet).toHaveBeenCalledTimes(2);
  });

  it('reprocesses the current markdown when forceJsThread changes', () => {
    const Parent = ({ force }: { force: boolean }) => (
      <Consumer markdown="hi" config={undefined} forceJsThread={force} />
    );

    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => {
      renderer = TestRenderer.create(<Parent force={false} />);
    });
    expect(processRemendInWorklet).toHaveBeenCalledTimes(1);

    act(() => {
      renderer.update(<Parent force={true} />);
    });
    expect(processRemendInWorklet).toHaveBeenLastCalledWith(
      'hi',
      expect.any(Function),
      undefined,
      true
    );
  });
});
