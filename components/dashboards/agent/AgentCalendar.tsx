import React, { useState, useMemo } from 'react';
import type { CalendarEvent } from '../../../types';
import { EventType } from '../../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import EventModal from '../../EventModal';
import ShareAvailabilityModal from '../../ShareAvailabilityModal';
import { ShareIcon } from '../../icons/AgentDashboardIcons';
import { useToast } from '../../../contexts/ToastContext';

interface AgentCalendarProps {
  calendarEvents: CalendarEvent[];
  onAddEvent: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

const eventColors: Record<EventType, string> = {
  [EventType.SHOWING]: 'bg-[#0F2D25] text-white border-l-2 border-[#C9A35D]',
  [EventType.MEETING]: 'bg-emerald-600 text-white border-l-2 border-emerald-300',
  [EventType.DEADLINE]: 'bg-amber-600 text-white border-l-2 border-amber-200',
};

const AgentCalendar: React.FC<AgentCalendarProps> = ({
  calendarEvents,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const { addToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1);
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const eventsByDate = useMemo(() => {
    return calendarEvents.reduce((acc, event) => {
      (acc[event.date] = acc[event.date] || []).push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [calendarEvents]);

  const changeMonth = (offset: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleOpenEventModal = (event?: CalendarEvent, date?: string) => {
    setSelectedEvent(event || null);
    setSelectedDate(date || null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<CalendarEvent, 'id'> | CalendarEvent) => {
    if ('id' in eventData) {
      onUpdateEvent(eventData);
      addToast('Appointment updated.', 'success');
    } else {
      onAddEvent(eventData);
      addToast('Appointment added to schedule.', 'success');
    }
    setIsEventModalOpen(false);
  };

  const handleDelete = (eventId: string) => {
    onDeleteEvent(eventId);
    setIsEventModalOpen(false);
    addToast('Event removed from calendar.', 'info');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Schedule & Viewings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Coordinate private showings, closing deadlines, and availability.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 whitespace-nowrap"
          >
            <ShareIcon className="w-4 h-4" /> Share Availability
          </button>
          <button
            onClick={() => handleOpenEventModal(undefined, new Date().toISOString().split('T')[0])}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] whitespace-nowrap"
          >
            + Add Event
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-t-xl border border-slate-200 dark:border-slate-800 gap-3">
        <div className="flex items-center gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white font-sans">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs font-semibold px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addToast('Google Calendar two-way sync enabled.', 'success')}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Sync Google
          </button>
          <button
            onClick={() => addToast('Outlook Calendar two-way sync enabled.', 'success')}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Sync Outlook
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-grow bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 py-2 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="border-b border-r border-slate-100 dark:border-slate-800/70 bg-slate-50/30 dark:bg-slate-950/30"
          />
        ))}
        {daysInMonth.map((day) => {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
            2,
            '0'
          )}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday =
            new Date().toDateString() ===
            new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

          return (
            <div
              key={day}
              className="border-b border-r border-slate-100 dark:border-slate-800 p-1.5 sm:p-2 flex flex-col min-h-[82px] sm:min-h-[108px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              onClick={() => handleOpenEventModal(undefined, dateStr)}
            >
              <span
                className={`font-mono tabular-nums font-semibold text-xs self-end ${
                  isToday
                    ? 'bg-[#0F2D25] text-[#C9A35D] rounded-md w-6 h-6 flex items-center justify-center'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {day}
              </span>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {dayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEventModal(event, dateStr);
                    }}
                    className={`w-full text-left text-[11px] px-1.5 py-1 rounded truncate ${eventColors[event.type]}`}
                  >
                    <span className="font-mono hidden sm:inline mr-1">{event.startTime}</span>
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSave={handleSaveEvent}
          onDelete={handleDelete}
          eventToEdit={selectedEvent}
          selectedDate={selectedDate}
        />
      )}

      {isShareModalOpen && (
        <ShareAvailabilityModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AgentCalendar;
