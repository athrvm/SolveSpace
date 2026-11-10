import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axiosClient from '../utils/axiosClient';
import { readChatStream } from '../utils/chatStream';
import { ArrowUp, Sparkles, Square, UserRound } from 'lucide-react';
import './ChatAi.css';

function OrbitDots() {
    return <span className="assistant-orbit" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} style={{ '--dot-index': index }} />)}</span>;
}

function ChatAi({ problem }) {
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi! Ask me for a hint, an explanation or help with your code.' }
    ]);
    const { register, handleSubmit, reset, setValue, setFocus, formState: { isValid } } = useForm({ mode: 'onChange', defaultValues: { message: '' } });
    const conversationRef = useRef(null);
    const followReplyRef = useRef(true);
    const requestRef = useRef(null);
    const historyRef = useRef([]);
    const [sending, setSending] = useState(false);
    const waitingForResponse = sending && !messages.at(-1)?.text;

    useEffect(() => () => {
        requestRef.current?.abort();
        requestRef.current = null;
    }, []);

    useEffect(() => {
        const conversation = conversationRef.current;
        if (conversation && followReplyRef.current) conversation.scrollTop = conversation.scrollHeight;
    }, [messages]);

    const onSubmit = async data => {
        const text = data.message.trim();
        if (!text || requestRef.current) return;
        const controller = new AbortController();
        requestRef.current = controller;
        followReplyRef.current = true;
        setSending(true);
        const id = crypto.randomUUID();
        const contents = [...historyRef.current, { role: 'user', parts: [{ text }] }];
        let reply = '';
        const updateReply = changes => {
            if (requestRef.current !== controller) return;
            setMessages(previous => previous.map(message => message.id === id ? { ...message, ...changes } : message));
        };
        setMessages(previous => [...previous,
            { role: 'user', text },
            { id, role: 'model', text: '', status: 'streaming' }
        ]);
        reset();
        try {
            const response = await fetch(`${axiosClient.defaults.baseURL}/chat/ai`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
                signal: controller.signal,
                body: JSON.stringify({ messages: contents, title: problem.title,
                    description: problem.description, testCases: problem.visibleTestCases,
                    startCode: problem.startCode })
            });
            await readChatStream(response, delta => {
                reply += delta;
                updateReply({ text: reply });
            });
            if (controller.signal.aborted) throw new DOMException('Stopped', 'AbortError');
            if (!reply.trim()) throw new Error('The assistant returned an empty reply. Please try again.');
            if (requestRef.current !== controller) return;
            // Only completed turns enter future requests; errors and stopped replies stay in the UI.
            historyRef.current = [...contents, { role: 'model', parts: [{ text: reply }] }];
            updateReply({ status: 'complete' });
        } catch (error) {
            updateReply({ status: controller.signal.aborted ? 'stopped' : 'error',
                error: controller.signal.aborted ? 'Reply stopped.' :
                    error instanceof TypeError ? 'Connection lost. Please try again.' : error.message });
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setSending(false);
            }
        }
    };

    return (
        <section className="assistant-chat" aria-label="Problem assistant">
            <header className="assistant-header">
                <span className="assistant-avatar"><Sparkles size={20} aria-hidden="true" /></span>
                <div className="assistant-heading"><h2>SolveSpace assistant</h2><p title={problem.title}>{problem.title}</p></div>
                <span className="assistant-status">{waitingForResponse ? 'Thinking…' : sending ? 'Replying…' : 'Ready to help'}</span>
            </header>
            <div ref={conversationRef} className="assistant-conversation" aria-label="Conversation" onScroll={event => {
                const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
                followReplyRef.current = scrollHeight - scrollTop - clientHeight < 64;
            }}>
                {messages.map((message, index) => (
                    <article key={message.id || index} className={`assistant-message ${message.role === 'user' ? 'assistant-message-user' : ''}`}>
                        <div className="assistant-message-label">{message.role === 'user' ? <UserRound size={13} aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}{message.role === 'user' ? 'You' : 'SolveSpace'}</div>
                        <div className="assistant-bubble" aria-busy={message.status === 'streaming'}>
                            {message.text}
                            {message.status === 'streaming' && !message.text && <div className="assistant-thinking"><OrbitDots /><span>Thinking through your question…</span></div>}
                            {message.status === 'streaming' && message.text && <span className="assistant-cursor" aria-hidden="true" />}
                            {message.error && <p className="assistant-error" role={message.status === 'error' ? 'alert' : 'status'}>{message.error}{message.text && ' The reply above is incomplete.'}</p>}
                        </div>
                    </article>
                ))}
                {messages.length === 1 && <div className="assistant-suggestions" aria-label="Suggested prompts">
                    {['Give me a hint', 'Explain the approach', 'Help me with complexity'].map(prompt => <button key={prompt} type="button" onClick={() => { setValue('message', prompt, { shouldValidate: true }); setFocus('message'); }}>{prompt}<ArrowUp size={14} aria-hidden="true" /></button>)}
                </div>}
            </div>
            <p className="sr-only" role="status">{waitingForResponse ? 'Waiting for the assistant’s response.' : sending ? 'Assistant is replying.' : ''}</p>
            <form onSubmit={event => handleSubmit(onSubmit)(event)} className="assistant-composer">
                <div className="assistant-input-row">
                    <textarea aria-label="Message to problem assistant" aria-describedby="assistant-input-help" placeholder="Ask a question or paste your code…" rows={3}
                        onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!sending) event.currentTarget.form.requestSubmit(); } }}
                        {...register('message', { validate: value => !!value.trim() })} />
                    {sending ? (
                        <button type="button" className="assistant-send assistant-stop" aria-label="Stop response" title="Stop response" onClick={() => requestRef.current?.abort()}>{waitingForResponse ? <OrbitDots /> : <Square size={16} fill="currentColor" aria-hidden="true" />}</button>
                    ) : (
                        <button type="submit" className="assistant-send" aria-label="Send message" title="Send message" disabled={!isValid}><ArrowUp size={20} aria-hidden="true" /></button>
                    )}
                </div>
                <div className="assistant-input-help" id="assistant-input-help"><span>{sending ? 'Select the stop button to end this reply.' : 'Enter to send · Shift + Enter for a new line'}</span><span>AI can make mistakes.</span></div>
            </form>
        </section>
    );
}
export default ChatAi;
