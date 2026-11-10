import ResizableWorkspace from '../components/ResizableWorkspace';
import { useSelector } from 'react-redux';
import BookmarkButton from '../components/BookmarkButton';
import { draftKey, readDraft, saveDraft } from '../utils/codeDrafts';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { ErrorState } from '../components/ui/States';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';


const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};


const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const userId = useSelector(state => state.auth.user?._id);
  const [draftStatus, setDraftStatus] = useState('');
  const activeDraft = useRef(null);
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let { problemId } = useParams();

  const { theme } = useTheme();
  const [fetchError, setFetchError] = useState('');
  const [retry, setRetry] = useState(0);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchProblem = async () => {
      setLoading(true);
      setProblem(null);
      activeDraft.current = null;
      setFetchError('');
      try {

        const response = await axiosClient.get(`/problem/problemById/${problemId}`);


        if (!active) return;

        setProblem(response.data);

        setLoading(false);

      } catch (error) {
        if (!active) return;
        console.error('Error fetching problem:', error);
        setFetchError('This problem could not be loaded. Please try again.');
        setLoading(false);
      }
    };

    fetchProblem();
    return () => { active = false; };
  }, [problemId, retry]);

  // Restore before accepting editor changes; never write a template over a saved draft.
  useEffect(() => {
    activeDraft.current = null;
    if (!problem || problem._id !== problemId) return;
    const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
    if (!userId) { setCode(initialCode); setDraftStatus('Sign in to save drafts'); return; }
    const key = draftKey(userId, problemId, selectedLanguage);
    let restored;
    try { restored = readDraft(window.localStorage, key, initialCode); }
    catch { restored = { code: initialCode, status: 'Browser storage unavailable' }; }
    setCode(restored.code);
    setDraftStatus(restored.status);
    activeDraft.current = key;
  }, [selectedLanguage, problem, problemId, userId]);

  const handleEditorChange = value => {
    const nextCode = value ?? '';
    setCode(nextCode);
    if (!userId || activeDraft.current !== draftKey(userId, problemId, selectedLanguage)) return;
    // Synchronous persistence also covers immediate refresh, closing and language switching.
    try { setDraftStatus(saveDraft(window.localStorage, activeDraft.current, nextCode)); }
    catch { setDraftStatus('Draft not saved — browser storage unavailable'); }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');

    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    setSubmitError('');

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      setLoading(false);
      setActiveRightTab('result');

    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitError('Your solution could not be submitted. Please try again.');
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (fetchError) return <ErrorState message={fetchError} onRetry={() => setRetry(r => r + 1)} />;

  return (
    <ResizableWorkspace>
      {/* Left Panel */}
      <div id="problem-statement-panel" className="statement-panel">
        {/* Left Tabs */}
        <div className="tabs tabs-bordered bg-base-200 px-4">
          <button
            className={`tab ${activeLeftTab === 'description' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('description')} aria-pressed={activeLeftTab === 'description'}
          >
            Description
          </button>
          <button
            className={`tab ${activeLeftTab === 'editorial' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('editorial')} aria-pressed={activeLeftTab === 'editorial'}
          >
            Editorial
          </button>
          <button
            className={`tab ${activeLeftTab === 'solutions' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('solutions')} aria-pressed={activeLeftTab === 'solutions'}
          >
            Solutions
          </button>
          <button
            className={`tab ${activeLeftTab === 'submissions' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('submissions')} aria-pressed={activeLeftTab === 'submissions'}
          >
            Submissions
          </button>

          <button
            className={`tab ${activeLeftTab === 'chatAI' ? 'tab-active' : ''}`}
            onClick={() => setActiveLeftTab('chatAI')} aria-pressed={activeLeftTab === 'chatAI'}
          >
            Assistant
          </button>


        </div>

        {/* Left Content */}
        <div className={`statement-content${activeLeftTab === 'chatAI' ? ' assistant-content' : ''}`}>
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div>
                  <div className="problem-title-row">
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    {userId && <BookmarkButton key={`${userId}:${problemId}`} problemId={problemId} />}
                    <div className={`badge badge-outline ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </div>
                    <div className="badge badge-primary">{problem.tags}</div>
                  </div>

                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {problem.description}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Examples:</h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className="bg-base-200 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">Example {index + 1}:</h4>
                          <div className="space-y-2 text-sm font-mono">
                            <div><strong>Input:</strong> {example.input}</div>
                            <div><strong>Output:</strong> {example.output}</div>
                            <div><strong>Explanation:</strong> {example.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-bold mb-4">Editorial</h2>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                  </div>
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Solutions</h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.length ? problem.referenceSolution.map((solution, index) => (
                      <div key={index} className="border border-base-300 rounded-lg">
                        <div className="bg-base-200 px-4 py-2 rounded-t-lg">
                          <h3 className="font-semibold">{problem?.title} - {solution?.language}</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto">
                            <code>{solution?.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) : <p className="text-gray-500">No reference solutions are available yet.</p>}
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">My Submissions</h2>
                  <SubmissionHistory key={problemId} problemId={problemId} />
                </div>
              )}

              {activeLeftTab === 'chatAI' && (
                <ChatAi key={problemId} problem={problem} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="coding-panel">
        {/* Right Tabs */}
        <div className="tabs tabs-bordered bg-base-200 px-4">
          <button
            className={`tab ${activeRightTab === 'code' ? 'tab-active' : ''}`}
            onClick={() => setActiveRightTab('code')} aria-pressed={activeRightTab === 'code'}
          >
            Code
          </button>
          <button
            className={`tab ${activeRightTab === 'testcase' ? 'tab-active' : ''}`}
            onClick={() => setActiveRightTab('testcase')} aria-pressed={activeRightTab === 'testcase'}
          >
            Test cases
          </button>
          <button
            className={`tab ${activeRightTab === 'result' ? 'tab-active' : ''}`}
            onClick={() => setActiveRightTab('result')} aria-pressed={activeRightTab === 'result'}
          >
            Result
          </button>
        </div>

        {/* Right Content */}
        <div className="coding-content">
          {(
            <div className="code-pane">
              {/* Language Selector */}
              <div className="editor-toolbar"><label className="flex items-center gap-3"><span className="muted">Language</span><select className="select select-sm" aria-label="Programming language" value={selectedLanguage} onChange={e => handleLanguageChange(e.target.value)}>{Object.entries(langMap).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><span className="text-xs muted" role="status">{draftStatus}</span></div>

              {/* Monaco Editor */}
              <div className="editor-container">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-base-300 flex justify-between">
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setActiveRightTab('testcase')} aria-pressed={activeRightTab === 'testcase'}
                  >
                    Console
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleRun}
                    disabled={loading}
                  >
                    {loading ? 'Working…' : 'Run'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="results-panel" role="status">
              <h3 className="font-semibold mb-4">Test Results</h3>
              {runResult ? (
                <div className={`alert ${runResult.success ? 'alert-success' : 'alert-error'} mb-4`}>
                  <div>
                    {runResult.success ? (
                      <div>
                        <h4 className="font-bold">All test cases passed</h4>
                        <p className="text-sm mt-2">Runtime: {runResult.runtime + " sec"}</p>
                        <p className="text-sm">Memory: {runResult.memory + " KB"}</p>

                        <div className="mt-4 space-y-2">
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className="bg-base-100 p-3 rounded text-xs">
                              <div className="font-mono">
                                <div><strong>Input:</strong> {tc.stdin}</div>
                                <div><strong>Expected:</strong> {tc.expected_output}</div>
                                <div><strong>Output:</strong> {tc.stdout}</div>
                                <div className={'text-green-600'}>
                                  {'✓ Passed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold">Run failed</h4><p>{runResult.error}</p>
                        <div className="mt-4 space-y-2">
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className="bg-base-100 p-3 rounded text-xs">
                              <div className="font-mono">
                                <div><strong>Input:</strong> {tc.stdin}</div>
                                <div><strong>Expected:</strong> {tc.expected_output}</div>
                                <div><strong>Output:</strong> {tc.stdout}</div>
                                <div className={tc.status_id == 3 ? 'text-green-600' : 'text-red-600'}>
                                  {tc.status_id == 3 ? '✓ Passed' : '✗ Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="mb-4">Run your code against these example test cases.</p>
                  {problem?.visibleTestCases.map((test, index) => <div key={index} className="bg-base-200 p-3 rounded mb-3 font-mono text-sm"><strong>Case {index + 1}</strong><p>Input: {test.input}</p><p>Expected: {test.output}</p></div>)}
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="results-panel" role="status">
              <h3 className="font-semibold mb-4">Submission Result</h3>
              {submitError ? <div className="alert alert-error">{submitError}</div> : submitResult ? (
                <div className={`alert ${submitResult.accepted ? 'alert-success' : 'alert-error'}`}>
                  <div>
                    {submitResult.accepted ? (
                      <div>
                        <h4 className="font-bold text-lg">Accepted</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          <p>Runtime: {submitResult.runtime + " sec"}</p>
                          <p>Memory: {submitResult.memory + "KB"} </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-lg">{submitResult.error || "Not accepted"}</h4>
                        <div className="mt-4 space-y-2">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Click "Submit" to submit your solution for evaluation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ResizableWorkspace>
  );
};

export default ProblemPage;
