import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  IconActivity,
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconClock,
} from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  useLazyGetProjectActivitiesQuery,
  type TProjectActivity,
} from '../../../../store/services/commentAndActivities/activitiesSlice';
import { Loader } from '../../../../components';

const PAGE_LIMIT = 10;

export default function ActivityLogs() {
  const { id: projectId } = useParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [activities, setActivities] = useState<TProjectActivity[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [fetchActivities, { isLoading, isFetching, isError }] = useLazyGetProjectActivitiesQuery();

  // Initial load
  useEffect(() => {
    if (projectId) {
      fetchActivities({
        projectId,
        pageNo: '0',
        pageLimit: String(PAGE_LIMIT),
      }).then((result) => {
        if (result.data) {
          setActivities(result.data.activities);
          setHasMore(result.data.activities.length < result.data.totalCount);
        }
      });
    }
  }, [projectId, fetchActivities]);

  // Load more activities
  const loadMore = useCallback(async () => {
    if (!projectId || isFetching || !hasMore) return;

    const nextPage = page + 1;
    const result = await fetchActivities({
      projectId,
      pageNo: String(nextPage),
      pageLimit: String(PAGE_LIMIT),
    });

    if (result.data?.activities.length) {
      setActivities((prev) => [...prev, ...result.data!.activities]);
      setPage(nextPage);
      setHasMore(activities.length + result.data.activities.length < result.data.totalCount);
    } else {
      setHasMore(false);
    }
  }, [projectId, page, isFetching, hasMore, fetchActivities, activities.length]);

  // Scroll handler for infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetching || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Load more when user scrolls within 50px of bottom
    if (scrollHeight - scrollTop - clientHeight < 50) {
      loadMore();
    }
  }, [loadMore, isFetching, hasMore]);

  return (
    <div className='px-5 py-5 bg-white rounded-md flex flex-col'>
      <div className='flex items-center mb-4'>
        <h6 className='font-bold text-lg text-text-secondary flex items-center gap-2'>
          <IconActivity className='size-5 text-blue-500' />
          Activity Logs
        </h6>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className='flex-1 max-h-[320px] overflow-y-auto pr-1'
      >
        {isLoading && activities.length === 0 ? (
          <Loader variant='component' minHeight={150} text='Loading activities...' />
        ) : isError && activities.length === 0 ? (
          <p className='text-sm text-gray-500 text-center py-4'>Failed to load activities</p>
        ) : activities.length === 0 ? (
          <p className='text-sm text-gray-500 text-center py-4'>No activities yet</p>
        ) : (
          <div className='space-y-0'>
            {activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isLast={index === activities.length - 1 && !hasMore}
              />
            ))}
            {isFetching && (
              <div className='flex items-center justify-center py-2'>
                <IconLoader2 className='size-4 text-gray-900 animate-spin' />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity, isLast }: { activity: TProjectActivity; isLast: boolean }) {
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'create':
        return <IconPlus className='size-3 text-white' />;
      case 'update':
        return <IconEdit className='size-3 text-white' />;
      case 'delete':
        return <IconTrash className='size-3 text-white' />;
      case 'timesheet':
        return <IconClock className='size-3 text-white' />;
      default:
        return <IconActivity className='size-3 text-white' />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'delete':
        return 'bg-red-500';
      case 'timesheet':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEntityBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'project':
        return 'bg-purple-100 text-purple-700';
      case 'task':
        return 'bg-blue-100 text-blue-700';
      case 'subtask':
        return 'bg-cyan-100 text-cyan-700';
      case 'timesheet':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  // Format activity text - replace underscores with spaces
  const formatActivityText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <div className='flex gap-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors'>
      {/* Timeline indicator */}
      <div className='flex flex-col items-center'>
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.activityType)}`}
        >
          {getActivityIcon(activity.activityType)}
        </div>
        {!isLast && <div className='w-px flex-1 bg-gray-200 mt-1 min-h-[12px]' />}
      </div>

      {/* Content */}
      <div className='flex-1 min-w-0 pb-1'>
        <p className='text-sm text-gray-900 leading-snug'>
          {activity.activity.map((text, i) => (
            <span key={i}>{formatActivityText(text)}</span>
          ))}
        </p>
        <div className='flex items-center gap-2 mt-1'>
          <span
            className={`text-xs px-1.5 py-0.5 rounded capitalize ${getEntityBadgeColor(activity.entityType)}`}
          >
            {activity.entityType}
          </span>
          <span className='text-xs text-gray-400'>{timeAgo}</span>
          <span className='text-xs text-gray-400'>• {activity.user?.name}</span>
        </div>
      </div>
    </div>
  );
}
