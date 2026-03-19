import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Menu } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { IconExternalLink, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import { NotificationIcon } from '../icons';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { socketService } from '../../services/socket';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from '../../store/services/notification/notificationSlice';
import type { TNotification, TNotificationType } from '../../types/notification.types';
import { Loader } from './loaders';

const PAGE_LIMIT = 20;

/** Helper to format a date string into a human-readable relative label */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Full date/time for expanded details */
function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Human-readable notification type label */
function getNotificationTypeLabel(type: TNotificationType): string {
  const labels: Record<TNotificationType, string> = {
    TASK_ASSIGNED: 'Task assigned',
    TASK_UPDATED: 'Task updated',
    COMMENT_MENTION: 'Comment mention',
    SUBTASK_ASSIGNED: 'Checklist assigned',
    PROJECT_ASSIGNED: 'Project assigned',
    STATUS_CHANGED: 'Status changed',
    TIMESHEET_REMINDER: 'Timesheet reminder',
    TIMESHEET_WEEK_SUBMITTED: 'Timesheet week submitted',
    TIMESHEET_APPROVED: 'Timesheet approved',
    TIMESHEET_REJECTED: 'Timesheet rejected',
    TIMESHEET_BILLED: 'Timesheet billed',
  };
  return labels[type] ?? type.replace(/_/g, ' ').toLowerCase();
}

/** Human-readable metadata key for display */
function formatMetadataKey(key: string): string {
  const map: Record<string, string> = {
    timesheetWeekId: 'Timesheet week ID',
    timesheetId: 'Timesheet ID',
    taskId: 'Task ID',
    projectId: 'Project ID',
    subTaskId: 'Checklist ID',
    commentId: 'Comment ID',
    billingRef: 'Billing reference',
    oldStatus: 'Previous status',
    newStatus: 'New status',
  };
  return map[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

/**
 * Build a navigation URL based on notification type and metadata.
 * Returns null if no meaningful destination can be derived.
 */
function getNotificationUrl(
  type: TNotificationType,
  metadata?: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null;

  const projectId = metadata.projectId as string | undefined;
  const taskId = metadata.taskId as string | undefined;

  switch (type) {
    case 'TASK_ASSIGNED':
    case 'TASK_UPDATED':
    case 'STATUS_CHANGED':
      if (projectId && taskId) return `/projects/${projectId}/task?taskId=${taskId}`;
      if (taskId) return `/tasks?taskId=${taskId}`;
      return null;

    case 'SUBTASK_ASSIGNED':
      if (projectId && taskId) return `/projects/${projectId}/task?taskId=${taskId}`;
      if (taskId) return `/tasks?taskId=${taskId}`;
      return null;

    case 'COMMENT_MENTION':
      if (projectId && taskId) return `/projects/${projectId}/task?taskId=${taskId}`;
      if (taskId) return `/tasks?taskId=${taskId}`;
      return null;

    case 'PROJECT_ASSIGNED':
      if (projectId) return `/projects/${projectId}/summary`;
      return null;

    case 'TIMESHEET_REMINDER':
    case 'TIMESHEET_WEEK_SUBMITTED':
    case 'TIMESHEET_APPROVED':
    case 'TIMESHEET_REJECTED':
    case 'TIMESHEET_BILLED':
      return '/timesheet';

    default:
      return null;
  }
}

export const NotificationsButton = () => {
  const navigate = useNavigate();
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(0);
  const [allNotifications, setAllNotifications] = useState<TNotification[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- API data ---
  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery(
    { pageNo: page, pageLimit: PAGE_LIMIT },
    { refetchOnMountOrArgChange: true },
  );
  const { data: countData, refetch: refetchCount } = useGetUnreadCountQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const [liveUnreadCount, setLiveUnreadCount] = useState<number | null>(null);
  const unreadCount = liveUnreadCount ?? countData?.unreadCount ?? 0;

  // --- Accumulate pages ---
  useEffect(() => {
    if (!data?.notifications) return;

    if (page === 0) {
      setAllNotifications(data.notifications);
    } else {
      setAllNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = data.notifications.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
    }

    const totalLoaded = (page + 1) * PAGE_LIMIT;
    setHasMore(totalLoaded < data.totalCount);
  }, [data, page]);

  // --- Infinite scroll via IntersectionObserver ---
  useEffect(() => {
    if (!opened || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [opened, hasMore, isFetching]);

  // --- Reset to page 0 when dropdown opens ---
  useEffect(() => {
    if (opened) {
      setPage(0);
      setHasMore(true);
      setExpandedId(null);
    }
  }, [opened]);

  // --- Socket: real-time updates ---
  useSocketEvent(
    'notification:new',
    useCallback(() => {
      setPage(0);
      setHasMore(true);
      refetch();
      refetchCount();
    }, [refetch, refetchCount]),
  );

  useSocketEvent(
    'notification:count',
    useCallback((payload: { unreadCount: number }) => {
      setLiveUnreadCount(payload.unreadCount);
    }, []),
  );

  // Sync liveUnreadCount when API count changes
  useEffect(() => {
    if (countData?.unreadCount !== undefined) {
      setLiveUnreadCount(countData.unreadCount);
    }
  }, [countData?.unreadCount]);

  // --- Handlers ---
  function handleMarkAllAsRead() {
    markAllAsRead();
    socketService.emit('notification:markAllRead');
    setLiveUnreadCount(0);
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function markRead(n: TNotification) {
    if (!n.isRead) {
      markAsRead(n.id);
      socketService.emit('notification:markRead', n.id);
      setLiveUnreadCount((prev) => Math.max(0, (prev ?? 1) - 1));
      setAllNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
      );
    }
  }

  function handleView(n: TNotification) {
    markRead(n);
    const url = getNotificationUrl(n.type, n.metadata);
    setOpened(false);
    if (url) {
      navigate(url);
    }
  }

  function handleExpand(e: React.MouseEvent, notifId: string) {
    e.stopPropagation();
    setExpandedId((prev) => (prev === notifId ? null : notifId));
  }

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      width={420}
      position='bottom-end'
      offset={10}
      withinPortal
      shadow='md'
      transitionProps={{ transition: 'pop-top-right', duration: 160 }}
    >
      <Menu.Target>
        <button
          type='button'
          aria-label='Notifications'
          className='relative border border-border-light bg-bg-light rounded-full flex items-center justify-center size-11 text-gray-500 cursor-pointer transition-all duration-200 ease-in-out hover:bg-white hover:shadow-sm hover:scale-[1.02]'
          onClick={() => setOpened((v) => !v)}
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
          >
            <NotificationIcon className='size-5 text-text-secondary' />
          </motion.div>

          {unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-purple-600 text-white text-[10px] font-semibold flex items-center justify-center shadow-sm'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </Menu.Target>

      <Menu.Dropdown className='p-0! overflow-hidden rounded-2xl border border-border-light'>
        {/* Header */}
        <div className='px-4 py-3 border-b border-border-light bg-white'>
          <div className='flex items-center justify-between gap-3'>
            <div className='min-w-0'>
              <div className='text-sm font-semibold text-gray-900'>Notifications</div>
              <div className='text-xs text-gray-500'>
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type='button'
                onClick={handleMarkAllAsRead}
                className='text-xs font-medium text-purple-700 hover:text-purple-800 hover:underline cursor-pointer'
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Body — scrollable with infinite loading */}
        <div ref={scrollContainerRef} className='max-h-[420px] overflow-auto bg-white'>
          {isLoading && page === 0 ? (
            <div className='flex items-center justify-center py-10'>
              <Loader />
            </div>
          ) : allNotifications.length === 0 ? (
            <div className='px-4 py-10 text-center'>
              <div className='text-sm font-medium text-gray-900'>No notifications</div>
              <div className='text-xs text-gray-500 mt-1'>You'll see updates here.</div>
            </div>
          ) : (
            <div className='py-1'>
              {allNotifications.map((n) => {
                const isExpanded = expandedId === n.id;
                const navUrl = getNotificationUrl(n.type, n.metadata);

                return (
                  <div
                    key={n.id}
                    className={clsx(
                      'w-full text-left px-4 py-3 transition-colors border-b border-gray-50 last:border-b-0',
                      !n.isRead && 'bg-bg-light/40',
                    )}
                  >
                    {/* Main row */}
                    <div className='flex gap-3'>
                      <span
                        className={clsx(
                          'mt-1.5 size-2 rounded-full shrink-0',
                          n.isRead ? 'bg-gray-200' : 'bg-purple-600',
                        )}
                        aria-hidden='true'
                      />

                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-2'>
                          <div className='min-w-0 flex-1'>
                            <div
                              className={clsx(
                                'text-sm font-semibold text-gray-900',
                                !isExpanded && 'truncate',
                              )}
                            >
                              {n.title}
                            </div>
                            {/* Collapsed: clamp message to 1 line */}
                            {n.message && !isExpanded && (
                              <div className='text-xs text-gray-600 mt-0.5 line-clamp-1'>
                                {n.message}
                              </div>
                            )}
                            {n.actor?.name && !isExpanded && (
                              <div className='text-[11px] text-gray-400 mt-0.5'>
                                by {n.actor.name}
                              </div>
                            )}
                          </div>
                          <div className='text-[11px] text-gray-500 shrink-0'>
                            {timeAgo(n.createdAt)}
                          </div>
                        </div>

                        {/* Expanded: full details (title, message, type, metadata, actor, date) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className='overflow-hidden'
                            >
                              <div className='mt-2 space-y-2 bg-gray-50 rounded-lg p-2.5 text-xs'>
                                <div className='font-medium text-gray-700'>
                                  {getNotificationTypeLabel(n.type)}
                                </div>
                                {n.message && (
                                  <div className='text-gray-600 whitespace-pre-wrap'>
                                    {n.message}
                                  </div>
                                )}
                                {n.actor?.name && (
                                  <div className='text-gray-500'>By: {n.actor.name}</div>
                                )}
                                <div className='text-gray-500'>{formatFullDate(n.createdAt)}</div>
                                {n.metadata && Object.keys(n.metadata).length > 0 && (
                                  <div className='pt-1 border-t border-gray-200 space-y-0.5'>
                                    {Object.entries(n.metadata).map(([key, value]) => (
                                      <div key={key} className='flex gap-2'>
                                        <span className='text-gray-500 shrink-0'>
                                          {formatMetadataKey(key)}:
                                        </span>
                                        <span className='text-gray-700 break-all'>
                                          {typeof value === 'object'
                                            ? JSON.stringify(value)
                                            : String(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action buttons — Expand always shown so user can see full details */}
                        <div className='flex items-center gap-1 mt-2'>
                          {navUrl && (
                            <button
                              type='button'
                              onClick={() => handleView(n)}
                              className='inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors cursor-pointer'
                            >
                              <IconExternalLink size={12} />
                              View
                            </button>
                          )}
                          <button
                            type='button'
                            onClick={(e) => handleExpand(e, n.id)}
                            className='inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors cursor-pointer'
                          >
                            {isExpanded ? (
                              <>
                                <IconChevronUp size={12} />
                                Collapse
                              </>
                            ) : (
                              <>
                                <IconChevronDown size={12} />
                                Expand
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className='h-1' />

              {/* Loading indicator for next page */}
              {isFetching && page > 0 && (
                <div className='flex items-center justify-center py-3'>
                  <Loader />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <div className='px-4 py-3 border-t border-border-light bg-white'>
            <button
              type='button'
              className='w-full text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer'
              onClick={() => setOpened(false)}
            >
              Close
            </button>
          </div>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};
