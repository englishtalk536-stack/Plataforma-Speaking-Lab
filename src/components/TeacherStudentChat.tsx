'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Send, Users } from 'lucide-react';

type ChatRole = 'TEACHER' | 'STUDENT';
type ChatMessage = { id: string; senderId: string; content: string; createdAt: string; readAt: string | null };
type Contact = {
  id: string;
  fullName: string;
  classrooms: { id: string; name: string }[];
  conversationId: string | null;
  unreadCount: number;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  updatedAt: string | null;
};

export function TeacherStudentChat({ role, initialContactId = '' }: { role: ChatRole; initialContactId?: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState(initialContactId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? null;

  useEffect(() => {
    let active = true;
    async function loadContacts() {
      try {
        const response = await fetch('/api/messages', { cache: 'no-store' });
        const result = await response.json() as { contacts?: Contact[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? 'No se pudieron cargar tus conversaciones.');
        if (active) {
          setContacts(result.contacts ?? []);
          if (initialContactId && !result.contacts?.some((contact) => contact.id === initialContactId)) setSelectedId('');
          setError('');
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar tus conversaciones.');
      } finally {
        if (active) setLoadingContacts(false);
      }
    }
    void loadContacts();
    const interval = window.setInterval(() => void loadContacts(), 15000);
    return () => { active = false; window.clearInterval(interval); };
  }, [initialContactId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    async function loadMessages(showLoading: boolean) {
      if (showLoading && active) setLoadingMessages(true);
      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(selectedId)}`, { cache: 'no-store' });
        const result = await response.json() as { messages?: ChatMessage[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? 'No se pudieron cargar los mensajes.');
        if (active) {
          setMessages(result.messages ?? []);
          setError('');
          setContacts((current) => current.map((contact) => contact.id === selectedId ? { ...contact, unreadCount: 0 } : contact));
        }
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los mensajes.');
      } finally {
        if (active && showLoading) setLoadingMessages(false);
      }
    }
    void loadMessages(true);
    const interval = window.setInterval(() => void loadMessages(false), 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [selectedId]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!selectedContact || !content || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(selectedContact.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'No se pudo enviar el mensaje.');
      setDraft('');
      const updated = await fetch(`/api/messages/${encodeURIComponent(selectedContact.id)}`, { cache: 'no-store' });
      const thread = await updated.json() as { messages?: ChatMessage[] };
      setMessages(thread.messages ?? []);
      const inbox = await fetch('/api/messages', { cache: 'no-store' });
      const inboxResult = await inbox.json() as { contacts?: Contact[] };
      setContacts(inboxResult.contacts ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  }

  const contactLabel = role === 'TEACHER' ? 'Estudiante' : 'Profesor';

  return (
    <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="relative overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-gradient-to-br from-white via-white to-speaking-background p-5 shadow-[0_12px_32px_rgba(16,52,105,0.07)] sm:p-6">
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-speaking-cobalt via-speaking-king to-speaking-mustard" />
          <p className="font-body text-xs font-bold uppercase tracking-[0.12em] text-speaking-king">Comunicación directa</p>
          <h1 className="mt-1 font-title text-3xl text-speaking-cobalt">Mensajes</h1>
          <p className="mt-2 font-body text-sm leading-6 text-speaking-cobalt/75">Conversaciones privadas entre estudiantes y profesores de la misma aula.</p>
        </header>

        <section className="grid min-h-[min(68vh,680px)] overflow-hidden rounded-2xl border border-speaking-cobalt/10 bg-white shadow-[0_12px_32px_rgba(16,52,105,0.07)] md:grid-cols-[300px_minmax(0,1fr)]" aria-label="Chat individual">
          <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} min-h-72 flex-col border-b border-speaking-cobalt/10 bg-speaking-background/60 md:border-b-0 md:border-r`}>
            <div className="flex items-center justify-between border-b border-speaking-cobalt/10 px-4 py-4">
              <h2 className="font-title text-lg text-speaking-cobalt">Contactos</h2>
              <span className="font-body text-xs font-semibold text-speaking-cobalt/60">{contacts.length}</span>
            </div>
            {loadingContacts ? (
              <p className="p-4 font-body text-sm text-speaking-cobalt/70">Cargando contactos…</p>
            ) : contacts.length === 0 ? (
              <div className="m-4 rounded-xl border border-speaking-cobalt/10 bg-white p-4">
                <Users className="h-5 w-5 text-speaking-king" aria-hidden="true" />
                <p className="mt-2 font-body text-sm font-semibold text-speaking-cobalt">No hay contactos disponibles</p>
                <p className="mt-1 font-body text-sm leading-6 text-speaking-cobalt/70">Los mensajes aparecen cuando hay un aula activa compartida.</p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto p-2">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <button type="button" onClick={() => { setMessages([]); setSelectedId(contact.id); setError(''); }} aria-pressed={selectedId === contact.id} className={`my-1 flex min-h-16 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${selectedId === contact.id ? 'border-speaking-king/20 bg-speaking-cobalt text-white shadow-sm' : 'border-transparent bg-white text-speaking-cobalt hover:border-speaking-cobalt/10 hover:bg-speaking-white'}`}>
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-title text-sm ${selectedId === contact.id ? 'bg-speaking-mustard text-speaking-cobalt' : 'bg-speaking-cobalt/8 text-speaking-cobalt'}`}>{contact.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-body text-sm font-semibold">{contact.fullName}</span>
                          {contact.unreadCount > 0 && <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-speaking-mustard px-1.5 font-body text-xs font-bold text-speaking-cobalt">{contact.unreadCount}</span>}
                        </span>
                        <span className={`mt-1 block truncate font-body text-xs ${selectedId === contact.id ? 'text-white/75' : 'text-speaking-cobalt/65'}`}>{contact.classrooms.map(({ name }) => name).join(' · ')}</span>
                        {contact.lastMessage && <span className={`mt-1 block truncate font-body text-xs ${selectedId === contact.id ? 'text-white/80' : 'text-speaking-cobalt/70'}`}>{contact.lastMessage.senderId === contact.id ? `${contactLabel}: ` : 'Tú: '}{contact.lastMessage.content}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className={`${selectedId ? 'flex' : 'hidden md:flex'} min-h-[min(68vh,680px)] min-w-0 flex-col`}>
            {selectedContact ? (
              <>
                <header className="flex min-h-[76px] items-center gap-3 border-b border-speaking-cobalt/10 px-4 py-3 sm:px-5">
                  <button type="button" onClick={() => { setMessages([]); setSelectedId(''); }} aria-label="Volver a contactos" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-speaking-cobalt transition-colors hover:bg-speaking-cobalt/5 md:hidden"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-speaking-mustard/25 font-title text-sm text-speaking-cobalt">{selectedContact.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                  <div className="min-w-0">
                    <h2 className="truncate font-title text-lg text-speaking-cobalt">{selectedContact.fullName}</h2>
                    <p className="truncate font-body text-sm text-speaking-cobalt/65">{selectedContact.classrooms.map(({ name }) => name).join(' · ')}</p>
                  </div>
                  <span className="ml-auto hidden items-center gap-1.5 font-body text-xs font-semibold text-speaking-success sm:inline-flex"><span className="h-2 w-2 rounded-full bg-speaking-success" />Chat privado</span>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-speaking-background/65 to-white p-4 sm:p-5" aria-live="polite" aria-label="Mensajes de la conversación">
                  {loadingMessages && messages.length === 0 && <p className="text-center font-body text-sm text-speaking-cobalt/65">Cargando mensajes…</p>}
                  {!loadingMessages && messages.length === 0 && <div className="mx-auto mt-10 max-w-sm text-center"><MessageCircle className="mx-auto h-8 w-8 text-speaking-king/70" aria-hidden="true" /><p className="mt-3 font-title text-lg text-speaking-cobalt">Inicia la conversación</p><p className="mt-1 font-body text-sm leading-6 text-speaking-cobalt/70">Escribe un mensaje para {selectedContact.fullName}. Solo ustedes dos pueden leer este chat.</p></div>}
                  {messages.map((message) => {
                    const ownMessage = message.senderId !== selectedContact.id;
                    return <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}><article className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[75%] ${ownMessage ? 'rounded-br-md bg-speaking-cobalt text-white' : 'rounded-bl-md border border-speaking-cobalt/10 bg-white text-speaking-cobalt'}`}><p className="whitespace-pre-wrap break-words font-body text-sm leading-6">{message.content}</p><time dateTime={message.createdAt} className={`mt-1 block text-right font-body text-xs ${ownMessage ? 'text-white/70' : 'text-speaking-cobalt/55'}`}>{new Date(message.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</time></article></div>;
                  })}
                  <div ref={endOfMessagesRef} />
                </div>
                {error && <p role="alert" className="mx-4 mt-3 rounded-lg border-l-2 border-speaking-streak bg-speaking-streak/5 px-3 py-2 font-body text-sm text-speaking-streak sm:mx-5">{error}</p>}
                <form onSubmit={sendMessage} className="border-t border-speaking-cobalt/10 bg-white p-3 sm:p-4">
                  <label htmlFor="chat-message" className="sr-only">Escribe un mensaje</label>
                  <div className="flex items-end gap-2">
                    <textarea id="chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={2000} placeholder="Escribe un mensaje…" className="max-h-36 min-h-12 flex-1 resize-y rounded-xl border border-speaking-cobalt/15 bg-speaking-background/55 px-3 py-2.5 font-body text-sm leading-6 text-speaking-cobalt outline-none transition focus:border-speaking-king focus:ring-2 focus:ring-speaking-king/15" />
                    <button type="submit" disabled={!draft.trim() || sending} aria-label="Enviar mensaje" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-speaking-cobalt text-white shadow-sm transition-colors hover:bg-speaking-king focus-visible:outline focus-visible:outline-2 focus-visible:outline-speaking-mustard focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"><Send className="h-5 w-5" aria-hidden="true" /></button>
                  </div>
                  <p className="mt-1.5 text-right font-body text-xs text-speaking-cobalt/55">{draft.length}/2000</p>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-speaking-mustard/20 text-speaking-cobalt"><MessageCircle className="h-7 w-7" aria-hidden="true" /></span>
                <h2 className="mt-4 font-title text-xl text-speaking-cobalt">Selecciona un contacto</h2>
                <p className="mt-1 max-w-sm font-body text-sm leading-6 text-speaking-cobalt/70">Elige un {contactLabel.toLowerCase()} para leer mensajes anteriores o iniciar un chat privado.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
